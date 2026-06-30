import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

interface Transport {
  id?: number;
  route_name: string;
  route_name_bn: string;
  driver_name: string;
  driver_phone: string;
  vehicle_number: string;
  capacity: number;
  monthly_fee: number;
  status?: string;
}

@Component({
  selector: 'app-transport',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header">
      <h1>পরিবহন ব্যবস্থাপনা</h1>
      <button class="btn btn-primary" (click)="showAddForm = !showAddForm">
        {{ showAddForm ? '✕ বাতিল' : '+ নতুন রুট যোগ করুন' }}
      </button>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <h3>মোট রুট</h3>
        <div class="stat-number">{{ routes.length }}</div>
      </div>
      <div class="stat-card green">
        <h3>সক্রিয় রুট</h3>
        <div class="stat-number">{{ activeRouteCount }}</div>
      </div>
      <div class="stat-card orange">
        <h3>মোট আসন</h3>
        <div class="stat-number">{{ totalCapacity }}</div>
      </div>
    </div>

    <div *ngIf="showAddForm" class="card mb-3">
      <h3>নতুন পরিবহন রুট</h3>
      <form (ngSubmit)="addRoute()" #transportForm="ngForm">
        <div class="row">
          <div class="col">
            <div class="form-group">
              <label>রুটের নাম (ইংরেজি) *</label>
              <input type="text" class="form-control" [(ngModel)]="newRoute.route_name" name="route_name" required placeholder="যেমন: North Route">
            </div>
          </div>
          <div class="col">
            <div class="form-group">
              <label>রুটের নাম (বাংলা) *</label>
              <input type="text" class="form-control" [(ngModel)]="newRoute.route_name_bn" name="route_name_bn" required placeholder="যেমন: উত্তর রুট">
            </div>
          </div>
        </div>

        <div class="row">
          <div class="col">
            <div class="form-group">
              <label>চালকের নাম *</label>
              <input type="text" class="form-control" [(ngModel)]="newRoute.driver_name" name="driver_name" required>
            </div>
          </div>
          <div class="col">
            <div class="form-group">
              <label>চালকের ফোন *</label>
              <input type="tel" class="form-control" [(ngModel)]="newRoute.driver_phone" name="driver_phone" required>
            </div>
          </div>
          <div class="col">
            <div class="form-group">
              <label>গাড়ির নম্বর *</label>
              <input type="text" class="form-control" [(ngModel)]="newRoute.vehicle_number" name="vehicle_number" required placeholder="যেমন: ঢাকা-মেট্রো-১২৩৪">
            </div>
          </div>
        </div>

        <div class="row">
          <div class="col">
            <div class="form-group">
              <label>আসন সংখ্যা</label>
              <input type="number" class="form-control" [(ngModel)]="newRoute.capacity" name="capacity" value="30">
            </div>
          </div>
          <div class="col">
            <div class="form-group">
              <label>মাসিক ফি (৳)</label>
              <input type="number" class="form-control" [(ngModel)]="newRoute.monthly_fee" name="monthly_fee">
            </div>
          </div>
        </div>

        <div *ngIf="errorMsg" class="alert alert-danger">{{ errorMsg }}</div>
        <div *ngIf="successMsg" class="alert alert-success">{{ successMsg }}</div>

        <div class="d-flex gap-2">
          <button type="submit" class="btn btn-success" [disabled]="!transportForm.form.valid || loading">
            {{ loading ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন' }}
          </button>
          <button type="button" class="btn btn-secondary" (click)="cancelAdd()">বাতিল</button>
        </div>
      </form>
    </div>

    <div class="card">
      <h3>পরিবহন রুটের তালিকা</h3>
      <div class="table-responsive">
        <table class="table">
          <thead>
            <tr>
              <th>#</th>
              <th>রুটের নাম</th>
              <th>চালক</th>
              <th>ফোন</th>
              <th>গাড়ির নম্বর</th>
              <th>আসন</th>
              <th>মাসিক ফি</th>
              <th>স্ট্যাটাস</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let route of routes; let i = index">
              <td>{{ i + 1 }}</td>
              <td>
                <div style="font-weight:500">{{ route.route_name_bn }}</div>
                <small class="text-muted">{{ route.route_name }}</small>
              </td>
              <td>{{ route.driver_name }}</td>
              <td>{{ route.driver_phone }}</td>
              <td>{{ route.vehicle_number }}</td>
              <td>{{ route.capacity }}</td>
              <td>৳ {{ route.monthly_fee | number }}</td>
              <td>
                <span class="badge" [class]="'badge-' + (route.status || 'active')">
                  {{ route.status === 'inactive' ? 'নিষ্ক্রিয়' : 'সক্রিয়' }}
                </span>
              </td>
            </tr>
            <tr *ngIf="routes.length === 0 && !loading">
              <td colspan="8" class="text-center text-muted" style="padding:2rem">কোনো রুট পাওয়া যায়নি</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class TransportComponent implements OnInit {
  http = inject(HttpClient);

  routes: Transport[] = [];
  loading = false;
  showAddForm = false;
  errorMsg = '';
  successMsg = '';
  newRoute: Transport = this.emptyRoute();

  get totalCapacity() {
    return this.routes.reduce((sum, r) => sum + (r.capacity || 0), 0);
  }

  get activeRouteCount() {
    return this.routes.filter(r => r.status !== 'inactive').length;
  }

  ngOnInit() {
    this.loadRoutes();
  }

  loadRoutes() {
    this.loading = true;
    this.http.get<Transport[]>('http://localhost:3000/api/transport').subscribe({
      next: (data) => { this.routes = data; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  addRoute() {
    this.loading = true;
    this.errorMsg = '';
    this.http.post<Transport>('http://localhost:3000/api/transport', this.newRoute).subscribe({
      next: () => {
        this.successMsg = 'রুট সফলভাবে যোগ করা হয়েছে!';
        this.loadRoutes();
        setTimeout(() => { this.cancelAdd(); }, 1500);
      },
      error: () => {
        this.errorMsg = 'রুট যোগ করতে সমস্যা হয়েছে।';
        this.loading = false;
      }
    });
  }

  cancelAdd() {
    this.showAddForm = false;
    this.newRoute = this.emptyRoute();
    this.errorMsg = '';
    this.successMsg = '';
    this.loading = false;
  }

  private emptyRoute(): Transport {
    return { route_name: '', route_name_bn: '', driver_name: '', driver_phone: '', vehicle_number: '', capacity: 30, monthly_fee: 0 };
  }
}
