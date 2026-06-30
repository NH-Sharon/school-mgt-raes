import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

interface AttendanceRecord {
  id?: number;
  name_en: string;
  roll_number?: number;
  status: string;
  remarks?: string;
  student_id?: number;
}

interface ClassOption {
  id: number;
  class_name: string;
  section: string;
}

@Component({
  selector: 'app-attendance',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header">
      <h1>উপস্থিতি ব্যবস্থাপনা</h1>
    </div>

    <div class="stats-grid">
      <div class="stat-card green">
        <h3>উপস্থিত</h3>
        <div class="stat-number">{{ countByStatus('present') }}</div>
      </div>
      <div class="stat-card red">
        <h3>অনুপস্থিত</h3>
        <div class="stat-number">{{ countByStatus('absent') }}</div>
      </div>
      <div class="stat-card orange">
        <h3>দেরিতে</h3>
        <div class="stat-number">{{ countByStatus('late') }}</div>
      </div>
      <div class="stat-card">
        <h3>উপস্থিতির হার</h3>
        <div class="stat-number">{{ attendanceRate }}%</div>
      </div>
    </div>

    <div class="card mb-3">
      <h3>উপস্থিতি নিন</h3>
      <div class="d-flex gap-2 mb-3" style="flex-wrap:wrap">
        <div class="form-group" style="margin:0;flex:1;min-width:150px">
          <label>ক্লাস নির্বাচন</label>
          <select class="form-control" [(ngModel)]="selectedClassId" (change)="loadAttendance()">
            <option [ngValue]="null">ক্লাস নির্বাচন করুন</option>
            <option *ngFor="let c of classes" [value]="c.id">{{ c.class_name }} - {{ c.section }}</option>
          </select>
        </div>
        <div class="form-group" style="margin:0;flex:1;min-width:150px">
          <label>তারিখ</label>
          <input type="date" class="form-control" [(ngModel)]="selectedDate" (change)="loadAttendance()">
        </div>
      </div>

      <div *ngIf="records.length > 0">
        <div class="table-responsive">
          <table class="table">
            <thead>
              <tr>
                <th>রোল</th>
                <th>নাম</th>
                <th>উপস্থিতি</th>
                <th>মন্তব্য</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let record of records">
                <td>{{ record.roll_number || '—' }}</td>
                <td>{{ record.name_en }}</td>
                <td>
                  <div class="d-flex gap-2">
                    <label class="radio-label present" [class.selected]="record.status === 'present'">
                      <input type="radio" [(ngModel)]="record.status" [name]="'status_' + record.id" value="present"> উপস্থিত
                    </label>
                    <label class="radio-label absent" [class.selected]="record.status === 'absent'">
                      <input type="radio" [(ngModel)]="record.status" [name]="'status_' + record.id" value="absent"> অনুপস্থিত
                    </label>
                    <label class="radio-label late" [class.selected]="record.status === 'late'">
                      <input type="radio" [(ngModel)]="record.status" [name]="'status_' + record.id" value="late"> দেরিতে
                    </label>
                  </div>
                </td>
                <td>
                  <input type="text" class="form-control" style="min-width:120px" [(ngModel)]="record.remarks" placeholder="মন্তব্য">
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div *ngIf="successMsg" class="alert alert-success mt-2">{{ successMsg }}</div>
        <div *ngIf="errorMsg" class="alert alert-danger mt-2">{{ errorMsg }}</div>

        <div class="d-flex gap-2 mt-2">
          <button class="btn btn-primary" (click)="markAllPresent()">সবাইকে উপস্থিত করুন</button>
          <button class="btn btn-success" (click)="saveAttendance()" [disabled]="saving">
            {{ saving ? 'সংরক্ষণ হচ্ছে...' : 'উপস্থিতি সংরক্ষণ করুন' }}
          </button>
        </div>
      </div>

      <div *ngIf="records.length === 0 && selectedClassId" class="text-center text-muted" style="padding:2rem">
        এই ক্লাসে কোনো শিক্ষার্থী নেই
      </div>

      <div *ngIf="!selectedClassId" class="text-center text-muted" style="padding:2rem">
        উপস্থিতি নেওয়ার জন্য একটি ক্লাস নির্বাচন করুন
      </div>
    </div>
  `,
  styles: [`
    .radio-label {
      display: flex;
      align-items: center;
      gap: 0.3rem;
      padding: 0.3rem 0.6rem;
      border-radius: 6px;
      cursor: pointer;
      border: 1px solid #ddd;
      font-size: 0.85rem;
      background: #f8f9fa;
      transition: all 0.15s;
    }

    .radio-label input[type=radio] {
      display: none;
    }

    .radio-label.present.selected {
      background: #d4edda;
      border-color: #2d6a4f;
      color: #155724;
      font-weight: 600;
    }

    .radio-label.absent.selected {
      background: #f8d7da;
      border-color: #dc3545;
      color: #721c24;
      font-weight: 600;
    }

    .radio-label.late.selected {
      background: #fff3cd;
      border-color: #f0a500;
      color: #856404;
      font-weight: 600;
    }
  `]
})
export class AttendanceComponent implements OnInit {
  http = inject(HttpClient);

  classes: ClassOption[] = [];
  records: AttendanceRecord[] = [];
  selectedClassId: number | null = null;
  selectedDate = new Date().toISOString().split('T')[0];
  saving = false;
  successMsg = '';
  errorMsg = '';

  get attendanceRate() {
    if (this.records.length === 0) return 0;
    const present = this.records.filter(r => r.status === 'present').length;
    return Math.round((present / this.records.length) * 100);
  }

  countByStatus(status: string) {
    return this.records.filter(r => r.status === status).length;
  }

  ngOnInit() {
    this.http.get<ClassOption[]>('https://raes-backend.vercel.app/api/classes').subscribe({
      next: (data) => { this.classes = data; },
      error: () => {}
    });
  }

  loadAttendance() {
    if (!this.selectedClassId || !this.selectedDate) return;
    this.http.get<AttendanceRecord[]>(`https://raes-backend.vercel.app/api/attendance/${this.selectedClassId}/${this.selectedDate}`).subscribe({
      next: (data) => { this.records = data; },
      error: () => {}
    });
  }

  markAllPresent() {
    this.records.forEach(r => r.status = 'present');
  }

  saveAttendance() {
    this.saving = true;
    this.errorMsg = '';
    this.successMsg = '';

    const attendanceData = this.records.map(r => ({
      student_id: r.id,
      class_id: this.selectedClassId,
      date: this.selectedDate,
      status: r.status,
      remarks: r.remarks || '',
      created_by: 1
    }));

    this.http.post('https://raes-backend.vercel.app/api/attendance', { attendanceData }).subscribe({
      next: () => {
        this.successMsg = 'উপস্থিতি সফলভাবে সংরক্ষণ করা হয়েছে!';
        this.saving = false;
        setTimeout(() => { this.successMsg = ''; }, 3000);
      },
      error: () => {
        this.errorMsg = 'উপস্থিতি সংরক্ষণ করতে সমস্যা হয়েছে।';
        this.saving = false;
      }
    });
  }
}
