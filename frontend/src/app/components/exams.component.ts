import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

interface Exam {
  id?: number;
  exam_name: string;
  exam_name_bn: string;
  exam_type: string;
  class_id?: number;
  class_name?: string;
  section?: string;
  start_date: string;
  end_date: string;
  total_marks: number;
  pass_marks: number;
  status?: string;
}

interface ExamResult {
  id?: number;
  name_en?: string;
  roll_number?: number;
  subject_name?: string;
  marks_obtained?: number;
  grade?: string;
  remarks?: string;
}

@Component({
  selector: 'app-exams',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header">
      <h1>পরীক্ষা ব্যবস্থাপনা</h1>
      <button class="btn btn-primary" (click)="showAddForm = !showAddForm">
        {{ showAddForm ? '✕ বাতিল' : '+ নতুন পরীক্ষা যোগ করুন' }}
      </button>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <h3>মোট পরীক্ষা</h3>
        <div class="stat-number">{{ exams.length }}</div>
      </div>
      <div class="stat-card orange">
        <h3>নির্ধারিত</h3>
        <div class="stat-number">{{ countByStatus('scheduled') }}</div>
      </div>
      <div class="stat-card green">
        <h3>চলমান</h3>
        <div class="stat-number">{{ countByStatus('ongoing') }}</div>
      </div>
      <div class="stat-card" style="border-left-color:#6c757d">
        <h3>সম্পন্ন</h3>
        <div class="stat-number" style="color:#6c757d">{{ countByStatus('completed') }}</div>
      </div>
    </div>

    <div *ngIf="showAddForm" class="card mb-3">
      <h3>নতুন পরীক্ষার তথ্য</h3>
      <form (ngSubmit)="addExam()" #examForm="ngForm">
        <div class="row">
          <div class="col">
            <div class="form-group">
              <label>পরীক্ষার নাম (ইংরেজি) *</label>
              <input type="text" class="form-control" [(ngModel)]="newExam.exam_name" name="exam_name" required placeholder="যেমন: First Term Exam">
            </div>
          </div>
          <div class="col">
            <div class="form-group">
              <label>পরীক্ষার নাম (বাংলা) *</label>
              <input type="text" class="form-control" [(ngModel)]="newExam.exam_name_bn" name="exam_name_bn" required placeholder="যেমন: প্রথম সাময়িক পরীক্ষা">
            </div>
          </div>
          <div class="col">
            <div class="form-group">
              <label>পরীক্ষার ধরন *</label>
              <select class="form-control" [(ngModel)]="newExam.exam_type" name="exam_type" required>
                <option value="">নির্বাচন করুন</option>
                <option value="প্রথম সাময়িক">প্রথম সাময়িক</option>
                <option value="দ্বিতীয় সাময়িক">দ্বিতীয় সাময়িক</option>
                <option value="বার্ষিক পরীক্ষা">বার্ষিক পরীক্ষা</option>
                <option value="মডেল টেস্ট">মডেল টেস্ট</option>
                <option value="সাপ্তাহিক পরীক্ষা">সাপ্তাহিক পরীক্ষা</option>
              </select>
            </div>
          </div>
        </div>

        <div class="row">
          <div class="col">
            <div class="form-group">
              <label>শুরুর তারিখ *</label>
              <input type="date" class="form-control" [(ngModel)]="newExam.start_date" name="start_date" required>
            </div>
          </div>
          <div class="col">
            <div class="form-group">
              <label>শেষের তারিখ *</label>
              <input type="date" class="form-control" [(ngModel)]="newExam.end_date" name="end_date" required>
            </div>
          </div>
          <div class="col">
            <div class="form-group">
              <label>মোট নম্বর</label>
              <input type="number" class="form-control" [(ngModel)]="newExam.total_marks" name="total_marks" value="100">
            </div>
          </div>
          <div class="col">
            <div class="form-group">
              <label>পাসের নম্বর</label>
              <input type="number" class="form-control" [(ngModel)]="newExam.pass_marks" name="pass_marks" value="40">
            </div>
          </div>
        </div>

        <div *ngIf="errorMsg" class="alert alert-danger">{{ errorMsg }}</div>
        <div *ngIf="successMsg" class="alert alert-success">{{ successMsg }}</div>

        <div class="d-flex gap-2">
          <button type="submit" class="btn btn-success" [disabled]="!examForm.form.valid || loading">
            {{ loading ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন' }}
          </button>
          <button type="button" class="btn btn-secondary" (click)="cancelAdd()">বাতিল</button>
        </div>
      </form>
    </div>

    <div class="card">
      <h3>পরীক্ষার তালিকা</h3>
      <div class="table-responsive">
        <table class="table">
          <thead>
            <tr>
              <th>#</th>
              <th>পরীক্ষার নাম</th>
              <th>ধরন</th>
              <th>ক্লাস</th>
              <th>শুরু</th>
              <th>শেষ</th>
              <th>মোট নম্বর</th>
              <th>পাসের নম্বর</th>
              <th>স্ট্যাটাস</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let exam of exams; let i = index">
              <td>{{ i + 1 }}</td>
              <td>
                <div>{{ exam.exam_name_bn }}</div>
                <small class="text-muted">{{ exam.exam_name }}</small>
              </td>
              <td>{{ exam.exam_type }}</td>
              <td>{{ exam.class_name ? exam.class_name + ' - ' + exam.section : '—' }}</td>
              <td>{{ exam.start_date | date:'dd/MM/yyyy' }}</td>
              <td>{{ exam.end_date | date:'dd/MM/yyyy' }}</td>
              <td>{{ exam.total_marks }}</td>
              <td>{{ exam.pass_marks }}</td>
              <td>
                <span class="badge" [class]="'badge-' + (exam.status || 'scheduled')">
                  {{ getStatusText(exam.status) }}
                </span>
              </td>
            </tr>
            <tr *ngIf="exams.length === 0 && !loading">
              <td colspan="9" class="text-center text-muted" style="padding:2rem">কোনো পরীক্ষা পাওয়া যায়নি</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class ExamsComponent implements OnInit {
  http = inject(HttpClient);

  exams: Exam[] = [];
  loading = false;
  showAddForm = false;
  errorMsg = '';
  successMsg = '';
  newExam: Exam = this.emptyExam();

  countByStatus(status: string) {
    return this.exams.filter(e => (e.status || 'scheduled') === status).length;
  }

  getStatusText(status?: string) {
    const map: Record<string, string> = {
      scheduled: 'নির্ধারিত',
      ongoing: 'চলমান',
      completed: 'সম্পন্ন'
    };
    return map[status || 'scheduled'] || status || 'নির্ধারিত';
  }

  ngOnInit() {
    this.loadExams();
  }

  loadExams() {
    this.loading = true;
    this.http.get<Exam[]>('https://raes-backend.vercel.app/api/exams').subscribe({
      next: (data) => { this.exams = data; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  addExam() {
    this.loading = true;
    this.errorMsg = '';
    this.http.post<Exam>('https://raes-backend.vercel.app/api/exams', this.newExam).subscribe({
      next: () => {
        this.successMsg = 'পরীক্ষা সফলভাবে যোগ করা হয়েছে!';
        this.loadExams();
        setTimeout(() => { this.cancelAdd(); }, 1500);
      },
      error: () => {
        this.errorMsg = 'পরীক্ষা যোগ করতে সমস্যা হয়েছে।';
        this.loading = false;
      }
    });
  }

  cancelAdd() {
    this.showAddForm = false;
    this.newExam = this.emptyExam();
    this.errorMsg = '';
    this.successMsg = '';
    this.loading = false;
  }

  private emptyExam(): Exam {
    return { exam_name: '', exam_name_bn: '', exam_type: '', start_date: '', end_date: '', total_marks: 100, pass_marks: 40 };
  }
}
