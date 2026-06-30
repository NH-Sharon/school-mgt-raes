import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../services/auth.service';

interface Teacher {
  id?: number;
  teacher_id: string;
  name_bn: string;
  name_en: string;
  designation: string;
  subject: string;
  phone: string;
  email: string;
  address: string;
  salary?: number;
  status?: string;
}

@Component({
  selector: 'app-teachers',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header">
      <h1>শিক্ষক ব্যবস্থাপনা</h1>
      <button class="btn btn-primary" (click)="showAddForm = !showAddForm">
        {{ showAddForm ? '✕ বাতিল' : '+ নতুন শিক্ষক যোগ করুন' }}
      </button>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <h3>মোট শিক্ষক</h3>
        <div class="stat-number">{{ teachers.length }}</div>
      </div>
      <div class="stat-card green">
        <h3>সক্রিয় শিক্ষক</h3>
        <div class="stat-number">{{ activeCount }}</div>
      </div>
    </div>

    <div *ngIf="showAddForm" class="card mb-3">
      <h3>নতুন শিক্ষক তথ্য</h3>
      <form (ngSubmit)="addTeacher()" #teacherForm="ngForm">
        <div class="row">
          <div class="col">
            <div class="form-group">
              <label>শিক্ষক আইডি *</label>
              <input type="text" class="form-control" [(ngModel)]="newTeacher.teacher_id" name="teacher_id" required placeholder="যেমন: T001">
            </div>
          </div>
          <div class="col">
            <div class="form-group">
              <label>নাম (বাংলা) *</label>
              <input type="text" class="form-control" [(ngModel)]="newTeacher.name_bn" name="name_bn" required>
            </div>
          </div>
          <div class="col">
            <div class="form-group">
              <label>নাম (ইংরেজি) *</label>
              <input type="text" class="form-control" [(ngModel)]="newTeacher.name_en" name="name_en" required>
            </div>
          </div>
        </div>

        <div class="row">
          <div class="col">
            <div class="form-group">
              <label>পদবি</label>
              <select class="form-control" [(ngModel)]="newTeacher.designation" name="designation">
                <option value="">নির্বাচন করুন</option>
                <option value="প্রধান শিক্ষক">প্রধান শিক্ষক</option>
                <option value="সহকারী প্রধান শিক্ষক">সহকারী প্রধান শিক্ষক</option>
                <option value="সহকারী শিক্ষক">সহকারী শিক্ষক</option>
              </select>
            </div>
          </div>
          <div class="col">
            <div class="form-group">
              <label>বিষয়</label>
              <select class="form-control" [(ngModel)]="newTeacher.subject" name="subject">
                <option value="">নির্বাচন করুন</option>
                <option value="বাংলা">বাংলা</option>
                <option value="ইংরেজি">ইংরেজি</option>
                <option value="গণিত">গণিত</option>
                <option value="বিজ্ঞান">বিজ্ঞান</option>
                <option value="সমাজ বিজ্ঞান">সমাজ বিজ্ঞান</option>
                <option value="ধর্ম">ধর্ম</option>
                <option value="সাধারণ জ্ঞান">সাধারণ জ্ঞান</option>
              </select>
            </div>
          </div>
          <div class="col">
            <div class="form-group">
              <label>ফোন</label>
              <input type="tel" class="form-control" [(ngModel)]="newTeacher.phone" name="phone">
            </div>
          </div>
        </div>

        <div class="row">
          <div class="col">
            <div class="form-group">
              <label>ইমেইল</label>
              <input type="email" class="form-control" [(ngModel)]="newTeacher.email" name="email">
            </div>
          </div>
          <div class="col">
            <div class="form-group">
              <label>বেতন (টাকা)</label>
              <input type="number" class="form-control" [(ngModel)]="newTeacher.salary" name="salary">
            </div>
          </div>
        </div>

        <div class="form-group">
          <label>ঠিকানা</label>
          <textarea class="form-control" [(ngModel)]="newTeacher.address" name="address" rows="2"></textarea>
        </div>

        <div *ngIf="errorMsg" class="alert alert-danger">{{ errorMsg }}</div>
        <div *ngIf="successMsg" class="alert alert-success">{{ successMsg }}</div>

        <div class="d-flex gap-2">
          <button type="submit" class="btn btn-success" [disabled]="!teacherForm.form.valid || loading">
            {{ loading ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন' }}
          </button>
          <button type="button" class="btn btn-secondary" (click)="cancelAdd()">বাতিল</button>
        </div>
      </form>
    </div>

    <div class="card">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h3>শিক্ষকদের তালিকা</h3>
        <input type="text" class="form-control" style="max-width:250px" placeholder="নাম বা আইডি খুঁজুন..." [(ngModel)]="searchText">
      </div>

      <div *ngIf="loading && teachers.length === 0" class="empty-state">
        <p>লোড হচ্ছে...</p>
      </div>

      <div class="table-responsive">
        <table class="table">
          <thead>
            <tr>
              <th>#</th>
              <th>আইডি</th>
              <th>নাম (বাংলা)</th>
              <th>নাম (ইংরেজি)</th>
              <th>পদবি</th>
              <th>বিষয়</th>
              <th>ফোন</th>
              <th>স্ট্যাটাস</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let t of filteredTeachers; let i = index">
              <td>{{ i + 1 }}</td>
              <td>{{ t.teacher_id }}</td>
              <td>{{ t.name_bn }}</td>
              <td>{{ t.name_en }}</td>
              <td>{{ t.designation || '—' }}</td>
              <td>{{ t.subject || '—' }}</td>
              <td>{{ t.phone || '—' }}</td>
              <td><span class="badge" [class]="'badge-' + (t.status || 'active')">{{ t.status === 'inactive' ? 'নিষ্ক্রিয়' : 'সক্রিয়' }}</span></td>
            </tr>
            <tr *ngIf="filteredTeachers.length === 0 && !loading">
              <td colspan="8" class="text-center text-muted" style="padding:2rem">কোনো শিক্ষক পাওয়া যায়নি</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class TeachersComponent implements OnInit {
  http = inject(HttpClient);
  authService = inject(AuthService);

  teachers: Teacher[] = [];
  showAddForm = false;
  loading = false;
  searchText = '';
  errorMsg = '';
  successMsg = '';
  newTeacher: Teacher = this.emptyTeacher();

  get activeCount() {
    return this.teachers.filter(t => t.status !== 'inactive').length;
  }

  get filteredTeachers() {
    if (!this.searchText) return this.teachers;
    const q = this.searchText.toLowerCase();
    return this.teachers.filter(t =>
      t.name_bn.toLowerCase().includes(q) ||
      t.name_en.toLowerCase().includes(q) ||
      t.teacher_id.toLowerCase().includes(q)
    );
  }

  ngOnInit() {
    this.loadTeachers();
  }

  loadTeachers() {
    this.loading = true;
    this.http.get<Teacher[]>('http://localhost:3000/api/teachers').subscribe({
      next: (data) => { this.teachers = data; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  addTeacher() {
    this.loading = true;
    this.errorMsg = '';
    this.http.post<Teacher>('http://localhost:3000/api/teachers', this.newTeacher).subscribe({
      next: () => {
        this.successMsg = 'শিক্ষক সফলভাবে যোগ করা হয়েছে!';
        this.loadTeachers();
        setTimeout(() => { this.cancelAdd(); }, 1500);
      },
      error: () => {
        this.errorMsg = 'শিক্ষক যোগ করতে সমস্যা হয়েছে।';
        this.loading = false;
      }
    });
  }

  cancelAdd() {
    this.showAddForm = false;
    this.newTeacher = this.emptyTeacher();
    this.errorMsg = '';
    this.successMsg = '';
    this.loading = false;
  }

  private emptyTeacher(): Teacher {
    return { teacher_id: '', name_bn: '', name_en: '', designation: '', subject: '', phone: '', email: '', address: '' };
  }
}
