import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

interface Payment {
  id?: number;
  student_id?: number;
  name_en?: string;
  student_id_code?: string;
  class_name?: string;
  payment_type: string;
  amount: number;
  payment_date?: string;
  due_date?: string;
  status?: string;
  payment_method?: string;
  transaction_id?: string;
  remarks?: string;
}

interface Student {
  id: number;
  name_en: string;
  student_id: string;
}

@Component({
  selector: 'app-payments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header">
      <h1>পেমেন্ট ব্যবস্থাপনা</h1>
      <button class="btn btn-primary" (click)="showAddForm = !showAddForm">
        {{ showAddForm ? '✕ বাতিল' : '+ নতুন পেমেন্ট যোগ করুন' }}
      </button>
    </div>

    <div class="stats-grid">
      <div class="stat-card green">
        <h3>পরিশোধিত</h3>
        <div class="stat-number">৳ {{ paidTotal | number }}</div>
      </div>
      <div class="stat-card orange">
        <h3>অপেক্ষমাণ</h3>
        <div class="stat-number">৳ {{ pendingTotal | number }}</div>
      </div>
      <div class="stat-card red">
        <h3>বকেয়া</h3>
        <div class="stat-number">৳ {{ overdueTotal | number }}</div>
      </div>
      <div class="stat-card">
        <h3>মোট রেকর্ড</h3>
        <div class="stat-number">{{ payments.length }}</div>
      </div>
    </div>

    <div *ngIf="showAddForm" class="card mb-3">
      <h3>নতুন পেমেন্ট রেকর্ড</h3>
      <form (ngSubmit)="addPayment()" #paymentForm="ngForm">
        <div class="row">
          <div class="col">
            <div class="form-group">
              <label>শিক্ষার্থী আইডি *</label>
              <input type="number" class="form-control" [(ngModel)]="newPayment.student_id" name="student_id" required placeholder="শিক্ষার্থীর ID নম্বর">
            </div>
          </div>
          <div class="col">
            <div class="form-group">
              <label>পেমেন্টের ধরন *</label>
              <select class="form-control" [(ngModel)]="newPayment.payment_type" name="payment_type" required>
                <option value="">নির্বাচন করুন</option>
                <option value="মাসিক বেতন">মাসিক বেতন</option>
                <option value="ভর্তি ফি">ভর্তি ফি</option>
                <option value="পরীক্ষার ফি">পরীক্ষার ফি</option>
                <option value="বই ফি">বই ফি</option>
                <option value="পরিবহন ফি">পরিবহন ফি</option>
                <option value="অন্যান্য">অন্যান্য</option>
              </select>
            </div>
          </div>
          <div class="col">
            <div class="form-group">
              <label>পরিমাণ (৳) *</label>
              <input type="number" class="form-control" [(ngModel)]="newPayment.amount" name="amount" required min="1">
            </div>
          </div>
        </div>

        <div class="row">
          <div class="col">
            <div class="form-group">
              <label>পেমেন্টের পদ্ধতি</label>
              <select class="form-control" [(ngModel)]="newPayment.payment_method" name="payment_method">
                <option value="">নির্বাচন করুন</option>
                <option value="নগদ">নগদ</option>
                <option value="বিকাশ">বিকাশ</option>
                <option value="নগদ অ্যাপ">নগদ অ্যাপ</option>
                <option value="ব্যাংক ট্রান্সফার">ব্যাংক ট্রান্সফার</option>
              </select>
            </div>
          </div>
          <div class="col">
            <div class="form-group">
              <label>ট্রানজেকশন আইডি</label>
              <input type="text" class="form-control" [(ngModel)]="newPayment.transaction_id" name="transaction_id">
            </div>
          </div>
          <div class="col">
            <div class="form-group">
              <label>শেষ তারিখ</label>
              <input type="date" class="form-control" [(ngModel)]="newPayment.due_date" name="due_date">
            </div>
          </div>
        </div>

        <div class="form-group">
          <label>মন্তব্য</label>
          <textarea class="form-control" [(ngModel)]="newPayment.remarks" name="remarks" rows="2"></textarea>
        </div>

        <div *ngIf="errorMsg" class="alert alert-danger">{{ errorMsg }}</div>
        <div *ngIf="successMsg" class="alert alert-success">{{ successMsg }}</div>

        <div class="d-flex gap-2">
          <button type="submit" class="btn btn-success" [disabled]="!paymentForm.form.valid || loading">
            {{ loading ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন' }}
          </button>
          <button type="button" class="btn btn-secondary" (click)="cancelAdd()">বাতিল</button>
        </div>
      </form>
    </div>

    <div class="card">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h3>পেমেন্ট রেকর্ড</h3>
        <select class="form-control" style="max-width:160px" [(ngModel)]="statusFilter" (change)="loadPayments()">
          <option value="">সব স্ট্যাটাস</option>
          <option value="paid">পরিশোধিত</option>
          <option value="pending">অপেক্ষমাণ</option>
          <option value="overdue">বকেয়া</option>
        </select>
      </div>

      <div class="table-responsive">
        <table class="table">
          <thead>
            <tr>
              <th>#</th>
              <th>শিক্ষার্থী</th>
              <th>ক্লাস</th>
              <th>পেমেন্ট টাইপ</th>
              <th>পরিমাণ</th>
              <th>তারিখ</th>
              <th>পদ্ধতি</th>
              <th>স্ট্যাটাস</th>
              <th>কার্যক্রম</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let p of filteredPayments; let i = index">
              <td>{{ i + 1 }}</td>
              <td>{{ p.name_en || 'শিক্ষার্থী #' + p.student_id }}</td>
              <td>{{ p.class_name || '—' }}</td>
              <td>{{ p.payment_type }}</td>
              <td>৳ {{ p.amount | number }}</td>
              <td>{{ p.payment_date | date:'dd/MM/yy' }}</td>
              <td>{{ p.payment_method || '—' }}</td>
              <td>
                <span class="badge" [class]="getBadgeClass(p.status)">
                  {{ getStatusText(p.status) }}
                </span>
              </td>
              <td>
                <button class="btn btn-sm btn-success" *ngIf="p.status !== 'paid'" (click)="markPaid(p)">পরিশোধ</button>
              </td>
            </tr>
            <tr *ngIf="filteredPayments.length === 0 && !loading">
              <td colspan="9" class="text-center text-muted" style="padding:2rem">কোনো পেমেন্ট রেকর্ড নেই</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class PaymentsComponent implements OnInit {
  http = inject(HttpClient);

  payments: Payment[] = [];
  loading = false;
  showAddForm = false;
  statusFilter = '';
  errorMsg = '';
  successMsg = '';
  newPayment: Payment = this.emptyPayment();

  get filteredPayments() {
    if (!this.statusFilter) return this.payments;
    return this.payments.filter(p => p.status === this.statusFilter);
  }

  get paidTotal() {
    return this.payments.filter(p => p.status === 'paid').reduce((s, p) => s + Number(p.amount), 0);
  }

  get pendingTotal() {
    return this.payments.filter(p => p.status === 'pending' || !p.status).reduce((s, p) => s + Number(p.amount), 0);
  }

  get overdueTotal() {
    return this.payments.filter(p => p.status === 'overdue').reduce((s, p) => s + Number(p.amount), 0);
  }

  getBadgeClass(status?: string) {
    const map: Record<string, string> = { paid: 'badge-paid', pending: 'badge-pending', overdue: 'badge-overdue' };
    return map[status || 'pending'] || 'badge-pending';
  }

  getStatusText(status?: string) {
    const map: Record<string, string> = { paid: 'পরিশোধিত', pending: 'অপেক্ষমাণ', overdue: 'বকেয়া' };
    return map[status || 'pending'] || 'অপেক্ষমাণ';
  }

  ngOnInit() {
    this.loadPayments();
  }

  loadPayments() {
    this.loading = true;
    this.http.get<Payment[]>('https://raes-backend.vercel.app/api/payments').subscribe({
      next: (data) => { this.payments = data; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  addPayment() {
    this.loading = true;
    this.errorMsg = '';
    this.http.post<Payment>('https://raes-backend.vercel.app/api/payments', this.newPayment).subscribe({
      next: () => {
        this.successMsg = 'পেমেন্ট সফলভাবে যোগ করা হয়েছে!';
        this.loadPayments();
        setTimeout(() => { this.cancelAdd(); }, 1500);
      },
      error: () => {
        this.errorMsg = 'পেমেন্ট যোগ করতে সমস্যা হয়েছে।';
        this.loading = false;
      }
    });
  }

  markPaid(payment: Payment) {
    if (!payment.id) return;
    this.http.put(`https://raes-backend.vercel.app/api/payments/${payment.id}/status`, { status: 'paid' }).subscribe({
      next: () => { this.loadPayments(); },
      error: () => {}
    });
  }

  cancelAdd() {
    this.showAddForm = false;
    this.newPayment = this.emptyPayment();
    this.errorMsg = '';
    this.successMsg = '';
    this.loading = false;
  }

  private emptyPayment(): Payment {
    return { payment_type: '', amount: 0 };
  }
}
