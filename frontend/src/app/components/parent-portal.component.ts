import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { I18nService } from '../services/i18n.service';
import { AuthService } from '../services/auth.service';
import { environment } from '../../environments/environment';

const API = environment.apiUrl;

interface Child {
  id: number;
  name_en: string;
  name_bn: string;
  class_id: number;
  roll_number: number;
  class_name?: string;
  section?: string;
}

@Component({
  selector: 'app-parent-portal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="portal-wrap">
  <button class="sidebar-toggle" (click)="sidebarOpen=true">☰</button>
  <div class="sidebar-backdrop" [class.open]="sidebarOpen" (click)="sidebarOpen=false"></div>
  <aside class="sidebar" [class.open]="sidebarOpen">
    <div class="sidebar-brand">
      <div class="sidebar-logo">🏫</div>
      <div class="sidebar-school">{{ i18n.isEn ? 'Rowshon Amir' : 'রওশন আমির' }}</div>
      <div class="sidebar-role-badge">{{ i18n.isEn ? 'Parent Portal' : 'অভিভাবক পোর্টাল' }}</div>
    </div>

    <div class="child-switcher" *ngIf="children.length > 1">
      <label>{{ i18n.isEn ? 'Viewing' : 'দেখছেন' }}</label>
      <select class="child-select" [(ngModel)]="selectedChildId" (change)="onChildChange()">
        <option *ngFor="let c of children" [value]="c.id">{{ c.name_en }} — {{ c.class_name }} {{ c.section }}</option>
      </select>
    </div>

    <nav class="sidebar-nav">
      <button [class.active]="activeTab==='overview'" (click)="activeTab='overview'; sidebarOpen=false">
        <span class="nav-icon">📊</span> {{ i18n.isEn ? 'Overview' : 'সারসংক্ষেপ' }}
      </button>
      <button [class.active]="activeTab==='grades'" (click)="activeTab='grades'; sidebarOpen=false">
        <span class="nav-icon">📝</span> {{ i18n.t('myGrades') }}
      </button>
      <button [class.active]="activeTab==='attendance'" (click)="activeTab='attendance'; sidebarOpen=false">
        <span class="nav-icon">📅</span> {{ i18n.t('myAttendance') }}
      </button>
      <button [class.active]="activeTab==='homework'" (click)="activeTab='homework'; sidebarOpen=false">
        <span class="nav-icon">📚</span> {{ i18n.t('myHomework') }}
      </button>
      <button [class.active]="activeTab==='fees'" (click)="activeTab='fees'; sidebarOpen=false">
        <span class="nav-icon">💳</span> {{ i18n.t('myPayments') }}
      </button>
    </nav>
    <div class="sidebar-footer">
      <div class="user-info">
        <div class="user-avatar">{{ userInitial }}</div>
        <div>
          <div class="user-name">{{ userName }}</div>
          <div class="user-role">{{ i18n.t('roleParent') }}</div>
        </div>
      </div>
      <div class="sidebar-actions">
        <button class="action-btn" (click)="i18n.toggle()" title="Toggle language">{{ i18n.isEn ? 'বাংলা' : 'EN' }}</button>
        <button class="action-btn logout-btn" (click)="logout()">{{ i18n.t('logout') }}</button>
      </div>
    </div>
  </aside>

  <main class="portal-main">
    <div class="empty-state" style="padding:3rem" *ngIf="!children.length">
      {{ i18n.isEn ? 'No children are linked to your account yet. Please contact the school office.' : 'আপনার একাউন্টে এখনো কোনো সন্তান যুক্ত করা হয়নি। স্কুল অফিসে যোগাযোগ করুন।' }}
    </div>

    <ng-container *ngIf="selectedChild">
      <!-- OVERVIEW -->
      <div *ngIf="activeTab==='overview'" class="tab-content">
        <div class="page-header">
          <div>
            <div class="page-eyebrow">{{ i18n.isEn ? 'Viewing' : 'দেখছেন' }}</div>
            <h1 class="page-title">{{ selectedChild.name_en }}</h1>
          </div>
          <div class="header-date">{{ todayLabel }}</div>
        </div>
        <div class="overview-grid">
          <div class="stat-tile green">
            <div class="tile-icon">📝</div><div class="tile-value">{{ gradeCount }}</div>
            <div class="tile-label">{{ i18n.isEn ? 'Subjects' : 'বিষয়' }}</div>
          </div>
          <div class="stat-tile blue">
            <div class="tile-icon">📅</div><div class="tile-value">{{ attendancePct }}%</div>
            <div class="tile-label">{{ i18n.isEn ? 'Attendance' : 'উপস্থিতি' }}</div>
          </div>
          <div class="stat-tile yellow">
            <div class="tile-icon">📚</div><div class="tile-value">{{ pendingHomework }}</div>
            <div class="tile-label">{{ i18n.isEn ? 'Pending HW' : 'পেন্ডিং HW' }}</div>
          </div>
          <div class="stat-tile orange">
            <div class="tile-icon">💳</div><div class="tile-value">{{ pendingFees }}</div>
            <div class="tile-label">{{ i18n.isEn ? 'Pending Fees' : 'বকেয়া ফি' }}</div>
          </div>
        </div>
        <div class="section-card">
          <div class="card-header"><h2>{{ i18n.isEn ? 'Upcoming Exams' : 'আসন্ন পরীক্ষা' }}</h2></div>
          <div class="exam-list" *ngIf="exams.length > 0">
            <div class="exam-row" *ngFor="let e of exams">
              <div class="exam-icon">📋</div>
              <div class="exam-info">
                <div class="exam-name">{{ e.exam_name }}</div>
                <div class="exam-date">{{ e.start_date | date:'mediumDate' }}</div>
                <div class="exam-seat" *ngIf="e.seat">🪑 {{ i18n.isEn ? 'Room' : 'রুম' }} {{ e.seat.room }} — {{ i18n.isEn ? 'Seat' : 'আসন' }} {{ e.seat.seat_number }}</div>
              </div>
              <div class="exam-status" [class]="'status-' + e.status">{{ e.status }}</div>
            </div>
          </div>
          <div class="empty-state" *ngIf="exams.length === 0">{{ i18n.isEn ? 'No upcoming exams' : 'কোনো আসন্ন পরীক্ষা নেই' }}</div>
        </div>
      </div>

      <!-- GRADES -->
      <div *ngIf="activeTab==='grades'" class="tab-content">
        <div class="page-header"><h1 class="page-title">{{ i18n.t('myGrades') }}</h1></div>
        <div class="section-card">
          <div class="results-grid">
            <div class="result-card" *ngFor="let s of subjects">
              <div class="result-subject">{{ s.name }}</div>
              <div class="result-bar-wrap"><div class="result-bar" [style.width]="s.pct + '%'" [class]="s.grade"></div></div>
              <div class="result-score">{{ s.score }}/100</div>
              <div class="result-grade" [class]="'grade-' + s.grade">{{ s.grade }}</div>
            </div>
          </div>
          <div class="empty-state" *ngIf="subjects.length === 0">{{ i18n.isEn ? 'No results published yet' : 'এখনো কোনো ফলাফল প্রকাশিত হয়নি' }}</div>
        </div>
      </div>

      <!-- ATTENDANCE -->
      <div *ngIf="activeTab==='attendance'" class="tab-content">
        <div class="page-header"><h1 class="page-title">{{ i18n.t('myAttendance') }}</h1></div>
        <div class="section-card">
          <div class="attendance-summary">
            <div class="att-circle">
              <svg viewBox="0 0 100 100" class="att-ring">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" stroke-width="10"/>
                <circle cx="50" cy="50" r="40" fill="none" stroke="#1A4731" stroke-width="10"
                  [attr.stroke-dasharray]="attendancePct * 2.513 + ' 251.3'" stroke-linecap="round" transform="rotate(-90 50 50)"/>
              </svg>
              <div class="att-pct">{{ attendancePct }}%</div>
            </div>
            <div class="att-legend">
              <div class="att-leg-item"><span class="dot green"></span>{{ i18n.isEn ? 'Present' : 'উপস্থিত' }}: {{ presentDays }}</div>
              <div class="att-leg-item"><span class="dot red"></span>{{ i18n.isEn ? 'Absent' : 'অনুপস্থিত' }}: {{ absentDays }}</div>
              <div class="att-leg-item"><span class="dot yellow"></span>{{ i18n.isEn ? 'Late' : 'দেরিতে' }}: {{ lateDays }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- HOMEWORK -->
      <div *ngIf="activeTab==='homework'" class="tab-content">
        <div class="page-header"><h1 class="page-title">{{ i18n.t('myHomework') }}</h1></div>
        <div class="section-card">
          <div class="hw-list" *ngIf="homework.length > 0">
            <div class="hw-item" *ngFor="let h of homework">
              <div class="hw-subject">{{ h.subject_name || h.subject_id }}</div>
              <div class="hw-desc">{{ h.description }}</div>
              <div class="hw-due">{{ i18n.isEn ? 'Due' : 'শেষ তারিখ' }}: <strong>{{ h.due_date | date:'mediumDate' }}</strong></div>
            </div>
          </div>
          <div class="empty-state" *ngIf="homework.length === 0">{{ i18n.isEn ? 'No homework assigned' : 'কোনো হোমওয়ার্ক নেই' }}</div>
        </div>
      </div>

      <!-- FEES -->
      <div *ngIf="activeTab==='fees'" class="tab-content">
        <div class="page-header"><h1 class="page-title">{{ i18n.t('myPayments') }}</h1></div>
        <div class="section-card">
          <div class="table-scroll-wrap">
          <table class="fee-table" *ngIf="payments.length > 0">
            <thead><tr>
              <th>{{ i18n.isEn ? 'Fee Type' : 'ফি ধরন' }}</th><th>{{ i18n.isEn ? 'Date' : 'তারিখ' }}</th>
              <th>{{ i18n.isEn ? 'Amount' : 'পরিমাণ' }}</th><th>{{ i18n.isEn ? 'Status' : 'স্ট্যাটাস' }}</th>
            </tr></thead>
            <tbody>
              <tr *ngFor="let p of payments">
                <td class="fee-type-cell">{{ p.payment_type || '—' }}</td>
                <td class="fee-date-cell">{{ p.payment_date | date:'dd MMM yyyy' }}</td>
                <td class="fee-amt-cell">৳{{ p.amount | number:'1.0-0' }}</td>
                <td><span class="fee-status" [class]="'fstatus-' + p.status">{{ p.status }}</span></td>
              </tr>
            </tbody>
          </table>
          </div>
          <div class="empty-state" *ngIf="payments.length === 0">{{ i18n.isEn ? 'No payment records' : 'কোনো পেমেন্ট রেকর্ড নেই' }}</div>
        </div>
      </div>
    </ng-container>
  </main>
</div>
  `,
  styles: [`
    :host {
      --surface-dark: #1A4731; --accent: #D4911A; --ground: #F7F5EC; --text: #1C2A1D; --muted: #6B7A5E; --border: rgba(28,42,29,0.1);
      display: block; font-family: 'Noto Sans Bengali', 'DM Sans', sans-serif;
    }
    .portal-wrap { display: flex; min-height: 100vh; }
    .sidebar { width: 240px; background: var(--surface-dark); color: rgba(255,255,255,0.85); display: flex; flex-direction: column; flex-shrink: 0; position: sticky; top: 0; height: 100vh; overflow-y: auto; }
    .sidebar-brand { padding: 1.75rem 1.25rem 1.25rem; border-bottom: 1px solid rgba(255,255,255,0.1); }
    .sidebar-logo { font-size: 1.75rem; margin-bottom: 0.25rem; }
    .sidebar-school { font-family: 'Noto Serif Bengali', serif; font-weight: 700; font-size: 0.9rem; }
    .sidebar-role-badge { display: inline-block; margin-top: 0.4rem; background: rgba(212,145,26,0.25); color: var(--accent); font-size: 0.7rem; padding: 0.15rem 0.55rem; border-radius: 2rem; font-family: 'DM Sans', sans-serif; }
    .child-switcher { padding: 0.85rem 1rem; border-bottom: 1px solid rgba(255,255,255,0.1); }
    .child-switcher label { display: block; font-size: 0.7rem; color: rgba(255,255,255,0.5); margin-bottom: 0.3rem; text-transform: uppercase; letter-spacing: 0.05em; }
    .child-select { width: 100%; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); color: #fff; padding: 0.4rem 0.5rem; border-radius: 6px; font-size: 0.8rem; }
    .sidebar-nav { padding: 0.75rem; display: flex; flex-direction: column; gap: 0.15rem; flex: 1; }
    .sidebar-nav button { display: flex; align-items: center; gap: 0.65rem; padding: 0.6rem 0.85rem; border-radius: 6px; background: none; border: none; color: rgba(255,255,255,0.65); cursor: pointer; font-size: 0.875rem; text-align: left; width: 100%; }
    .sidebar-nav button:hover { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.9); }
    .sidebar-nav button.active { background: rgba(255,255,255,0.12); color: #fff; font-weight: 600; }
    .nav-icon { font-size: 1rem; }
    .sidebar-footer { padding: 1rem 0.75rem; border-top: 1px solid rgba(255,255,255,0.1); }
    .user-info { display: flex; align-items: center; gap: 0.65rem; margin-bottom: 0.75rem; }
    .user-avatar { width: 36px; height: 36px; border-radius: 50%; background: rgba(212,145,26,0.3); color: var(--accent); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.95rem; }
    .user-name { font-size: 0.85rem; font-weight: 600; color: #fff; }
    .user-role { font-size: 0.7rem; color: rgba(255,255,255,0.5); }
    .sidebar-actions { display: flex; gap: 0.5rem; }
    .action-btn { flex: 1; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.12); color: rgba(255,255,255,0.75); padding: 0.35rem 0.5rem; border-radius: 5px; font-size: 0.75rem; cursor: pointer; }
    .action-btn:hover { background: rgba(255,255,255,0.14); color: #fff; }
    .logout-btn:hover { background: rgba(220,53,69,0.3); border-color: rgba(220,53,69,0.4); }
    .portal-main { flex: 1; background: #F0F2F5; overflow-y: auto; }
    .tab-content { padding: 2rem; max-width: 900px; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; }
    .page-eyebrow { font-size: 0.75rem; color: var(--muted); letter-spacing: 0.1em; text-transform: uppercase; }
    .page-title { font-family: 'Noto Serif Bengali', 'Cormorant Garamond', serif; font-size: 1.75rem; font-weight: 700; color: var(--text); margin-top: 0.25rem; }
    .header-date { font-size: 0.825rem; color: var(--muted); margin-top: 0.25rem; }
    .overview-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
    .stat-tile { background: #fff; border-radius: 10px; padding: 1.25rem; display: flex; flex-direction: column; gap: 0.35rem; border-left: 4px solid transparent; }
    .stat-tile.green { border-color: #1A4731; } .stat-tile.blue { border-color: #1a5c8a; } .stat-tile.yellow { border-color: #D4911A; } .stat-tile.orange { border-color: #c0392b; }
    .tile-icon { font-size: 1.3rem; }
    .tile-value { font-size: 1.75rem; font-weight: 700; font-family: 'Cormorant Garamond', serif; color: var(--text); }
    .tile-label { font-size: 0.75rem; color: var(--muted); }
    .section-card { background: #fff; border-radius: 10px; padding: 1.5rem; margin-bottom: 1.5rem; }
    .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    .card-header h2 { font-size: 1rem; font-weight: 600; color: var(--text); font-family: 'Noto Serif Bengali', serif; }
    .empty-state { text-align: center; padding: 2rem; color: var(--muted); font-size: 0.875rem; }
    .exam-list { display: flex; flex-direction: column; gap: 0.75rem; }
    .exam-row { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem; background: var(--ground); border-radius: 8px; }
    .exam-icon { font-size: 1.1rem; }
    .exam-info { flex: 1; }
    .exam-name { font-size: 0.9rem; font-weight: 600; color: var(--text); }
    .exam-date { font-size: 0.775rem; color: var(--muted); margin-top: 0.1rem; }
    .exam-seat { font-size: 0.775rem; color: var(--accent); margin-top: 0.2rem; font-weight: 600; }
    .exam-status { font-size: 0.7rem; padding: 0.2rem 0.6rem; border-radius: 2rem; font-weight: 600; text-transform: uppercase; }
    .status-scheduled { background: #DBEAFE; color: #1E40AF; } .status-ongoing { background: #D1FAE5; color: #065F46; } .status-completed { background: #F3F4F6; color: #374151; }
    .results-grid { display: flex; flex-direction: column; gap: 0.75rem; }
    .result-card { display: grid; grid-template-columns: 120px 1fr 60px 40px; align-items: center; gap: 1rem; padding: 0.75rem 0; border-bottom: 1px solid var(--border); }
    .result-card:last-child { border-bottom: none; }
    .result-subject { font-size: 0.875rem; font-weight: 600; color: var(--text); }
    .result-bar-wrap { height: 8px; background: #F3F4F6; border-radius: 4px; overflow: hidden; }
    .result-bar { height: 100%; border-radius: 4px; background: #1A4731; }
    .result-bar.A { background: #1A4731; } .result-bar.B { background: #D4911A; } .result-bar.C { background: #3B82F6; }
    .result-score { font-size: 0.825rem; color: var(--muted); }
    .result-grade { font-size: 0.8rem; font-weight: 700; padding: 0.15rem 0.5rem; border-radius: 4px; text-align: center; }
    .grade-A { background: #D1FAE5; color: #065F46; } .grade-B { background: #FEF3C7; color: #92400E; } .grade-C { background: #DBEAFE; color: #1E40AF; } .grade-F { background: #FEE2E2; color: #991B1B; }
    .attendance-summary { display: flex; gap: 3rem; align-items: center; margin-bottom: 1rem; }
    .att-circle { position: relative; width: 120px; height: 120px; flex-shrink: 0; }
    .att-ring { width: 100%; height: 100%; }
    .att-pct { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: 1.3rem; font-weight: 700; color: var(--surface-dark); }
    .att-legend { display: flex; flex-direction: column; gap: 0.6rem; }
    .att-leg-item { display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; color: var(--text); }
    .dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
    .dot.green { background: #1A4731; } .dot.red { background: #c0392b; } .dot.yellow { background: #D4911A; }
    .hw-list { display: flex; flex-direction: column; gap: 0.75rem; }
    .hw-item { padding: 1rem; background: var(--ground); border-radius: 8px; border-left: 3px solid var(--accent); }
    .hw-subject { font-size: 0.8rem; font-weight: 700; color: var(--accent); text-transform: uppercase; margin-bottom: 0.3rem; }
    .hw-desc { font-size: 0.9rem; color: var(--text); margin-bottom: 0.4rem; line-height: 1.5; }
    .hw-due { font-size: 0.775rem; color: var(--muted); }
    .table-scroll-wrap { overflow-x: auto; }
    .fee-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
    .fee-table thead tr { background: var(--surface-dark); }
    .fee-table th { padding: 0.65rem 0.85rem; text-align: left; color: rgba(255,255,255,0.9); font-size: 0.75rem; font-weight: 600; }
    .fee-table td { padding: 0.75rem 0.85rem; border-bottom: 1px solid var(--border); }
    .fee-type-cell { font-weight: 600; color: var(--text); }
    .fee-date-cell { color: var(--muted); font-size: 0.82rem; }
    .fee-amt-cell { font-weight: 700; color: var(--text); }
    .fee-status { font-size: 0.7rem; padding: 0.22rem 0.65rem; border-radius: 2rem; font-weight: 600; text-transform: uppercase; display: inline-block; }
    .fstatus-paid { background: #D1FAE5; color: #065F46; } .fstatus-pending { background: #FEF3C7; color: #92400E; } .fstatus-overdue { background: #FEE2E2; color: #991B1B; }
    .sidebar-toggle { display: none; position: fixed; top: 0.75rem; left: 0.75rem; z-index: 200; background: var(--surface-dark); color: #fff; border: none; border-radius: 6px; padding: 0.45rem 0.65rem; font-size: 1.1rem; cursor: pointer; }
    .sidebar-backdrop { display: none; }
    @media (max-width: 768px) {
      .sidebar-toggle { display: block; }
      .sidebar { position: fixed; left: -260px; top: 0; height: 100vh; z-index: 150; transition: left 0.25s ease; width: 240px; }
      .sidebar.open { left: 0; }
      .sidebar-backdrop { display: block; position: fixed; inset: 0; background: rgba(0,0,0,0.45); z-index: 140; opacity: 0; pointer-events: none; transition: opacity 0.25s; }
      .sidebar-backdrop.open { opacity: 1; pointer-events: auto; }
      .portal-main { width: 100%; padding-top: 3rem; }
      .tab-content { padding: 1rem; }
      .page-header { flex-direction: column; gap: 0.4rem; margin-bottom: 1rem; }
      .overview-grid { grid-template-columns: repeat(2, 1fr); gap: 0.75rem; }
      .section-card { padding: 1rem; }
      .attendance-summary { flex-direction: column; gap: 1.5rem; align-items: flex-start; }
    }
  `]
})
export class ParentPortalComponent implements OnInit {
  i18n = inject(I18nService);
  auth = inject(AuthService);
  router = inject(Router);
  http = inject(HttpClient);

  activeTab = 'overview';
  sidebarOpen = false;
  todayLabel = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  userName = '';
  userInitial = 'P';
  children: Child[] = [];
  selectedChildId: number | null = null;

  exams: any[] = [];
  homework: any[] = [];
  payments: any[] = [];
  subjects: any[] = [];

  gradeCount = 0;
  attendancePct = 0;
  presentDays = 0;
  absentDays = 0;
  lateDays = 0;
  pendingHomework = 0;
  pendingFees = 0;

  get selectedChild(): Child | undefined {
    return this.children.find(c => c.id === this.selectedChildId);
  }

  ngOnInit() {
    const user = this.auth.currentUser();
    if (user) {
      this.userName = user.full_name || user.username || 'Guardian';
      this.userInitial = this.userName.charAt(0).toUpperCase();
    }

    this.http.get<any>(`${API}/auth/me`).subscribe({
      next: (me: any) => {
        this.children = me.children || [];
        if (this.children.length) {
          this.selectedChildId = this.children[0].id;
          this.loadChildData();
        }
      }
    });
  }

  onChildChange() {
    this.loadChildData();
  }

  loadChildData() {
    const child = this.selectedChild;
    if (!child) return;

    this.exams = []; this.homework = []; this.payments = []; this.subjects = [];
    this.gradeCount = 0; this.attendancePct = 0; this.presentDays = 0; this.absentDays = 0; this.lateDays = 0;
    this.pendingHomework = 0; this.pendingFees = 0;

    this.http.get<any[]>(`${API}/exams`).subscribe({
      next: d => {
        this.exams = d.slice(0, 3);
        this.exams.forEach((e: any) => {
          this.http.get<any>(`${API}/exams/${e.id}/seat-plan/mine/${child.id}`).subscribe({
            next: (seat: any) => { e.seat = seat; },
            error: () => {}
          });
        });
      },
      error: () => {}
    });

    if (child.class_id) {
      this.http.get<any[]>(`${API}/homework/class/${child.class_id}`).subscribe({
        next: d => { this.homework = d; this.pendingHomework = d.length; }, error: () => {}
      });
    }

    this.http.get<any>(`${API}/attendance/student-summary/${child.id}`).subscribe({
      next: (d: any) => { this.attendancePct = d.pct || 0; this.presentDays = d.present || 0; this.absentDays = d.absent || 0; this.lateDays = d.late || 0; },
      error: () => {}
    });

    this.http.get<any[]>(`${API}/payments/student/${child.id}`).subscribe({
      next: d => { this.payments = d.slice(0, 6); this.pendingFees = d.filter((p: any) => p.status !== 'paid').length; },
      error: () => {}
    });

    this.http.get<any[]>(`${API}/exams/student-results/${child.id}`).subscribe({
      next: d => {
        this.subjects = d.map((r: any) => ({ name: r.subject_name, score: r.marks_obtained || 0, pct: r.marks_obtained || 0, grade: r.grade || 'N/A' }));
        this.gradeCount = this.subjects.length;
      },
      error: () => {}
    });
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/']);
  }
}
