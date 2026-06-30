import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

interface Homework {
  id?: number;
  class_id?: number;
  subject_id?: number;
  teacher_id?: number;
  title: string;
  description: string;
  assigned_date?: string;
  due_date: string;
  subject_name?: string;
  teacher_name?: string;
  status?: string;
}

@Component({
  selector: 'app-homework',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header">
      <h1>হোমওয়ার্ক ব্যবস্থাপনা</h1>
      <button class="btn btn-primary" (click)="showAddForm = !showAddForm">
        {{ showAddForm ? '✕ বাতিল' : '+ নতুন হোমওয়ার্ক যোগ করুন' }}
      </button>
    </div>

    <div *ngIf="showAddForm" class="card mb-3">
      <h3>নতুন হোমওয়ার্ক</h3>
      <form (ngSubmit)="addHomework()" #hwForm="ngForm">
        <div class="row">
          <div class="col-2">
            <div class="form-group">
              <label>শিরোনাম *</label>
              <input type="text" class="form-control" [(ngModel)]="newHw.title" name="title" required placeholder="হোমওয়ার্কের শিরোনাম">
            </div>
          </div>
          <div class="col">
            <div class="form-group">
              <label>জমা দেওয়ার তারিখ *</label>
              <input type="date" class="form-control" [(ngModel)]="newHw.due_date" name="due_date" required>
            </div>
          </div>
          <div class="col">
            <div class="form-group">
              <label>ক্লাস আইডি</label>
              <input type="number" class="form-control" [(ngModel)]="newHw.class_id" name="class_id" placeholder="ক্লাস নম্বর">
            </div>
          </div>
        </div>

        <div class="row">
          <div class="col">
            <div class="form-group">
              <label>বিষয় আইডি</label>
              <input type="number" class="form-control" [(ngModel)]="newHw.subject_id" name="subject_id">
            </div>
          </div>
          <div class="col">
            <div class="form-group">
              <label>শিক্ষক আইডি</label>
              <input type="number" class="form-control" [(ngModel)]="newHw.teacher_id" name="teacher_id">
            </div>
          </div>
        </div>

        <div class="form-group">
          <label>বিবরণ</label>
          <textarea class="form-control" [(ngModel)]="newHw.description" name="description" rows="3" placeholder="হোমওয়ার্কের বিস্তারিত..."></textarea>
        </div>

        <div *ngIf="errorMsg" class="alert alert-danger">{{ errorMsg }}</div>
        <div *ngIf="successMsg" class="alert alert-success">{{ successMsg }}</div>

        <div class="d-flex gap-2">
          <button type="submit" class="btn btn-success" [disabled]="!hwForm.form.valid || loading">
            {{ loading ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন' }}
          </button>
          <button type="button" class="btn btn-secondary" (click)="cancelAdd()">বাতিল</button>
        </div>
      </form>
    </div>

    <div class="card">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h3>হোমওয়ার্ক তালিকা</h3>
        <div class="d-flex gap-2">
          <input type="number" class="form-control" style="max-width:120px" placeholder="ক্লাস আইডি" [(ngModel)]="filterClassId">
          <button class="btn btn-primary btn-sm" (click)="loadHomework()">ফিল্টার</button>
        </div>
      </div>

      <div class="table-responsive">
        <table class="table">
          <thead>
            <tr>
              <th>#</th>
              <th>শিরোনাম</th>
              <th>বিষয়</th>
              <th>শিক্ষক</th>
              <th>প্রদানের তারিখ</th>
              <th>জমার তারিখ</th>
              <th>স্ট্যাটাস</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let hw of homeworks; let i = index">
              <td>{{ i + 1 }}</td>
              <td>
                <div style="font-weight:500">{{ hw.title }}</div>
                <small class="text-muted" *ngIf="hw.description">{{ hw.description | slice:0:60 }}{{ hw.description.length > 60 ? '...' : '' }}</small>
              </td>
              <td>{{ hw.subject_name || '—' }}</td>
              <td>{{ hw.teacher_name || '—' }}</td>
              <td>{{ hw.assigned_date | date:'dd/MM/yyyy' }}</td>
              <td>{{ hw.due_date | date:'dd/MM/yyyy' }}</td>
              <td>
                <span class="badge" [class]="isOverdue(hw.due_date) ? 'badge-overdue' : 'badge-active'">
                  {{ isOverdue(hw.due_date) ? 'মেয়াদ শেষ' : 'সক্রিয়' }}
                </span>
              </td>
            </tr>
            <tr *ngIf="homeworks.length === 0 && !loading">
              <td colspan="7" class="text-center text-muted" style="padding:2rem">
                {{ filterClassId ? 'এই ক্লাসের জন্য কোনো হোমওয়ার্ক নেই' : 'ক্লাস আইডি দিয়ে হোমওয়ার্ক খুঁজুন' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class HomeworkComponent implements OnInit {
  http = inject(HttpClient);

  homeworks: Homework[] = [];
  loading = false;
  showAddForm = false;
  filterClassId: number | null = null;
  errorMsg = '';
  successMsg = '';
  newHw: Homework = this.emptyHw();

  isOverdue(dueDate: string): boolean {
    return new Date(dueDate) < new Date();
  }

  ngOnInit() {}

  loadHomework() {
    if (!this.filterClassId) return;
    this.loading = true;
    this.http.get<Homework[]>(`https://raes-backend.vercel.app/api/homework/class/${this.filterClassId}`).subscribe({
      next: (data) => { this.homeworks = data; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  addHomework() {
    this.loading = true;
    this.errorMsg = '';
    this.http.post<Homework>('https://raes-backend.vercel.app/api/homework', this.newHw).subscribe({
      next: () => {
        this.successMsg = 'হোমওয়ার্ক সফলভাবে যোগ করা হয়েছে!';
        if (this.filterClassId) this.loadHomework();
        setTimeout(() => { this.cancelAdd(); }, 1500);
      },
      error: () => {
        this.errorMsg = 'হোমওয়ার্ক যোগ করতে সমস্যা হয়েছে।';
        this.loading = false;
      }
    });
  }

  cancelAdd() {
    this.showAddForm = false;
    this.newHw = this.emptyHw();
    this.errorMsg = '';
    this.successMsg = '';
    this.loading = false;
  }

  private emptyHw(): Homework {
    return { title: '', description: '', due_date: '' };
  }
}
