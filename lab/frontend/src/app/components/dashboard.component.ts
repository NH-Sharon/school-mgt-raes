import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service';
import { DashboardService } from '../services/dashboard.service';
import { I18nService } from '../services/i18n.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page">
      <div class="loading-state" *ngIf="role === 'student' && !student || role === 'teacher' && !teacher">
        <div class="spinner"></div><p>{{ i18n.t('loading') }}</p>
      </div>
      <ng-container [ngSwitch]="role">

        <!-- ===== Student dashboard (FR-5.1/5.2/5.3) ===== -->
        <div *ngSwitchCase="'student'">
          <div class="stat-row" *ngIf="student as s">
            <div class="stat-card"><span class="stat-num">{{ s.simulationsCompleted }}</span><span class="stat-label">{{ i18n.isEn ? 'Simulations' : 'সিমুলেশন' }}</span></div>
            <div class="stat-card"><span class="stat-num">{{ s.examsTaken }}</span><span class="stat-label">{{ i18n.isEn ? 'Exams' : 'পরীক্ষা' }}</span></div>
            <div class="stat-card"><span class="stat-num">{{ s.chaptersStudied }}</span><span class="stat-label">{{ i18n.isEn ? 'Chapters' : 'অধ্যায়' }}</span></div>
            <div class="stat-card"><span class="stat-num">{{ s.streakDays }}🔥</span><span class="stat-label">{{ i18n.t('streak') }}</span></div>
            <div class="stat-card"><span class="stat-num">{{ s.points }}</span><span class="stat-label">{{ i18n.t('points') }}</span></div>
          </div>

          <div class="section" *ngIf="student as s">
            <h3>{{ i18n.isEn ? 'Mastery by Subject' : 'বিষয়ভিত্তিক দক্ষতা' }}</h3>
            <div class="mastery-grid">
              <div class="mastery-card" *ngFor="let m of s.mastery">
                <svg viewBox="0 0 40 40" class="ring">
                  <circle cx="20" cy="20" r="16" fill="none" stroke="#e2e8ec" stroke-width="6"/>
                  <circle cx="20" cy="20" r="16" fill="none" stroke="#1a6d5e" stroke-width="6"
                          [attr.stroke-dasharray]="ringDash(m)" transform="rotate(-90 20 20)"/>
                </svg>
                <span>{{ i18n.isEn ? m.name_en : m.name_bn }}</span>
                <span class="mastery-sub">{{ m.mastered }}/{{ m.total_chapters }} {{ i18n.isEn ? 'mastered' : 'সম্পন্ন' }}</span>
              </div>
            </div>
          </div>

          <div class="section" *ngIf="student && student.scoreTrend.length">
            <h3>{{ i18n.isEn ? 'Score Trend' : 'স্কোর প্রবণতা' }}</h3>
            <svg viewBox="0 0 240 100" class="trend-chart">
              <polyline [attr.points]="trendPoints()" fill="none" stroke="#1a6d5e" stroke-width="2"/>
              <circle *ngFor="let p of trendPointsArr()" [attr.cx]="p.x" [attr.cy]="p.y" r="3" fill="#1a6d5e"/>
            </svg>
          </div>

          <div class="section" *ngIf="student && student.heatmap.length">
            <h3>{{ i18n.isEn ? 'Activity (last 90 days)' : 'কার্যকলাপ (গত ৯০ দিন)' }}</h3>
            <div class="heatmap">
              <div class="heat-cell" *ngFor="let h of student.heatmap" [style.opacity]="Math.min(1, h.count / 3 + 0.25)" [title]="h.day"></div>
            </div>
          </div>

          <div class="section" *ngIf="student as s">
            <h3>{{ i18n.isEn ? 'Recent Activity' : 'সাম্প্রতিক কার্যক্রম' }}</h3>
            <ul class="timeline">
              <li *ngFor="let t of s.timeline">
                <span class="tl-icon">{{ t.kind === 'exam' ? '📝' : '🧪' }}</span>
                <span>
                  {{ t.kind === 'exam' ? (i18n.isEn ? 'Exam attempt' : 'পরীক্ষার প্রচেষ্টা') : (i18n.isEn ? t.title_en : t.title_bn) }}
                  <ng-container *ngIf="t.kind === 'exam' && t.max_score">
                    — {{ t.score }}/{{ t.max_score }} ({{ (t.score / t.max_score * 100) | number:'1.0-0' }}%)
                  </ng-container>
                  <ng-container *ngIf="t.kind === 'simulation' && t.duration_seconds">
                    — {{ Math.round(t.duration_seconds / 60) }} {{ i18n.isEn ? 'min' : 'মিনিট' }}, {{ t.hints_used || 0 }} {{ i18n.isEn ? 'hints used' : 'বার হিন্ট নেওয়া হয়েছে' }}
                  </ng-container>
                </span>
                <span class="tl-time">{{ t.at | date:'short' }}</span>
              </li>
            </ul>
          </div>

          <div class="section" *ngIf="student && student.badges.length">
            <h3>{{ i18n.t('badges') }}</h3>
            <div class="badge-row">
              <div class="badge-chip" *ngFor="let b of student.badges">{{ b.icon }} {{ i18n.isEn ? b.title_en : b.title_bn }}</div>
            </div>
          </div>
        </div>

        <!-- ===== Teacher dashboard (FR-5.5) ===== -->
        <div *ngSwitchCase="'teacher'">
          <div class="section" *ngIf="teacher as t">
            <div class="section-header">
              <h3>{{ i18n.isEn ? 'Class' : 'শ্রেণি' }} {{ classLevel }} {{ i18n.isEn ? 'Overview' : 'সারসংক্ষেপ' }}</h3>
              <button class="ghost-btn" (click)="exportClassCsv()">⬇️ {{ i18n.isEn ? 'Export CSV' : 'CSV এক্সপোর্ট' }}</button>
            </div>
            <table class="data-table">
              <thead><tr><th>{{ i18n.isEn ? 'Student' : 'শিক্ষার্থী' }}</th><th>{{ i18n.isEn ? 'Exams' : 'পরীক্ষা' }}</th><th>{{ i18n.isEn ? 'Avg Score' : 'গড় স্কোর' }}</th><th>{{ i18n.isEn ? 'Sims' : 'সিমুলেশন' }}</th></tr></thead>
              <tbody>
                <tr *ngFor="let s of t.students">
                  <td>{{ s.full_name }}</td><td>{{ s.exams_taken }}</td>
                  <td>{{ s.avg_ratio ? (s.avg_ratio * 100 | number:'1.0-0') + '%' : '—' }}</td>
                  <td>{{ s.sims_completed }}</td>
                </tr>
              </tbody>
            </table>

            <h4 style="margin-top: 20px;">{{ i18n.t('weakChapters') }}</h4>
            <div class="weak-list">
              <div class="weak-item" *ngFor="let w of t.weakestChapters">
                <span>{{ i18n.isEn ? w.title_en : w.title_bn }}</span>
                <span class="weak-pct">{{ (w.avg_ratio * 100) | number:'1.0-0' }}%</span>
              </div>
            </div>
          </div>
        </div>

        <!-- ===== Guardian dashboard (FR-5.6) ===== -->
        <div *ngSwitchCase="'guardian'">
          <div class="section">
            <h3>{{ i18n.isEn ? 'Linked Students' : 'সংযুক্ত শিক্ষার্থীরা' }}</h3>
            <div class="linked-list">
              <div class="linked-card" *ngFor="let ls of linkedStudents">
                <span>{{ ls.full_name }} ({{ i18n.isEn ? 'Class' : 'শ্রেণি' }} {{ ls.class_level }})</span>
                <span *ngIf="!ls.confirmed" class="pending-tag">{{ i18n.isEn ? 'Pending confirmation' : 'নিশ্চিতকরণ বাকি' }}</span>
                <button class="ghost-btn" *ngIf="ls.confirmed" (click)="loadGuardianSummary(ls.student_id)">{{ i18n.isEn ? 'View weekly summary' : 'সাপ্তাহিক সারসংক্ষেপ দেখুন' }}</button>
              </div>
            </div>
          </div>
          <div class="section" *ngIf="guardianSummary">
            <h3>{{ i18n.isEn ? 'This Week' : 'এই সপ্তাহে' }}</h3>
            <div class="stat-row">
              <div class="stat-card"><span class="stat-num">{{ guardianSummary.simulations }}</span><span class="stat-label">{{ i18n.isEn ? 'Simulations' : 'সিমুলেশন' }}</span></div>
              <div class="stat-card"><span class="stat-num">{{ guardianSummary.exams }}</span><span class="stat-label">{{ i18n.isEn ? 'Exams' : 'পরীক্ষা' }}</span></div>
              <div class="stat-card"><span class="stat-num">{{ guardianSummary.avg_ratio ? (guardianSummary.avg_ratio * 100 | number:'1.0-0') + '%' : '—' }}</span><span class="stat-label">{{ i18n.isEn ? 'Avg Score' : 'গড় স্কোর' }}</span></div>
            </div>
          </div>
        </div>

      </ng-container>
    </div>
  `,
  styles: [`
    .page { max-width: 1000px; margin: 0 auto; padding: 24px 20px; }
    .loading-state { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 80px 20px; color: #667680; }
    .spinner { width: 32px; height: 32px; border: 3px solid #e2e8ec; border-top-color: #1a6d5e; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .stat-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 12px; margin-bottom: 24px; }
    .stat-card { background: #fff; border: 1px solid #e2e8ec; border-radius: 12px; padding: 16px; text-align: center; }
    .stat-num { display: block; font-size: 1.4rem; font-weight: 700; color: #1a6d5e; }
    .stat-label { font-size: 0.78rem; color: #667680; }
    .section { margin-bottom: 28px; }
    .section-header { display: flex; justify-content: space-between; align-items: center; }
    .section h3 { color: #1a6d5e; font-size: 1rem; margin: 0 0 12px; }
    .mastery-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); gap: 14px; }
    .mastery-card { background: #fff; border: 1px solid #e2e8ec; border-radius: 12px; padding: 14px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 4px; }
    .ring { width: 50px; height: 50px; }
    .mastery-sub { font-size: 0.72rem; color: #8a97a0; }
    .trend-chart { width: 100%; height: 100px; background: #fff; border: 1px solid #e2e8ec; border-radius: 12px; }
    .heatmap { display: flex; flex-wrap: wrap; gap: 3px; }
    .heat-cell { width: 12px; height: 12px; background: #1a6d5e; border-radius: 2px; }
    .timeline { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 8px; }
    .timeline li { display: flex; align-items: center; gap: 10px; background: #fff; border: 1px solid #e2e8ec; border-radius: 8px; padding: 10px 14px; font-size: 0.85rem; }
    .tl-time { margin-left: auto; color: #8a97a0; font-size: 0.78rem; }
    .badge-row { display: flex; gap: 10px; flex-wrap: wrap; }
    .badge-chip { background: #fff8ee; border: 1px solid #f3d9a8; border-radius: 999px; padding: 8px 14px; font-size: 0.85rem; }
    .data-table { width: 100%; border-collapse: collapse; background: #fff; margin-top: 10px; }
    .data-table th, .data-table td { border: 1px solid #e2e8ec; padding: 8px 10px; font-size: 0.85rem; text-align: left; }
    .weak-list { display: flex; flex-direction: column; gap: 6px; }
    .weak-item { display: flex; justify-content: space-between; background: #fff8ee; border: 1px solid #f3d9a8; border-radius: 8px; padding: 8px 12px; font-size: 0.85rem; }
    .weak-pct { font-weight: 700; color: #c0392b; }
    .linked-list { display: flex; flex-direction: column; gap: 8px; }
    .linked-card { display: flex; align-items: center; gap: 10px; background: #fff; border: 1px solid #e2e8ec; border-radius: 8px; padding: 10px 14px; font-size: 0.88rem; }
    .pending-tag { color: #a5690c; font-size: 0.78rem; }
    .ghost-btn { background: transparent; border: 1px solid #cfd9dd; color: #33454f; padding: 7px 12px; border-radius: 8px; font-size: 0.82rem; }
  `],
})
export class DashboardComponent implements OnInit {
  private auth = inject(AuthService);
  private dashboardService = inject(DashboardService);
  i18n = inject(I18nService);
  Math = Math;

  role = '';
  classLevel = 9;
  student: any = null;
  teacher: any = null;
  linkedStudents: any[] = [];
  guardianSummary: any = null;

  ngOnInit() {
    const user = this.auth.currentUser();
    if (!user) return;
    this.role = user.role;
    this.classLevel = user.classLevel || 9;

    if (user.role === 'student') {
      this.dashboardService.student().subscribe(s => this.student = s);
    } else if (user.role === 'teacher') {
      this.dashboardService.teacherClass(this.classLevel).subscribe(t => this.teacher = t);
    } else if (user.role === 'guardian') {
      this.auth.myLinkedStudents().subscribe(ls => this.linkedStudents = ls);
    }
  }

  ringDash(m: any): string {
    const pct = m.total_chapters > 0 ? (m.mastered / m.total_chapters) : 0;
    const circumference = 2 * Math.PI * 16;
    return `${pct * circumference} ${circumference}`;
  }

  trendPointsArr(): { x: number; y: number }[] {
    if (!this.student?.scoreTrend?.length) return [];
    const trend = this.student.scoreTrend;
    return trend.map((t: any, i: number) => ({
      x: trend.length > 1 ? (i / (trend.length - 1)) * 220 + 10 : 120,
      y: 90 - (t.max_score > 0 ? (t.score / t.max_score) * 80 : 0),
    }));
  }

  trendPoints(): string {
    return this.trendPointsArr().map(p => `${p.x},${p.y}`).join(' ');
  }

  loadGuardianSummary(studentId: number) {
    this.dashboardService.guardianStudent(studentId).subscribe(s => this.guardianSummary = s);
  }

  exportClassCsv() {
    if (!this.teacher) return;
    const rows = [['Student', 'Exams Taken', 'Avg Score %', 'Simulations Completed']];
    for (const s of this.teacher.students) {
      rows.push([s.full_name, s.exams_taken, s.avg_ratio ? Math.round(s.avg_ratio * 100) : '', s.sims_completed]);
    }
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `class-${this.classLevel}-report.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }
}
