import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ExamService } from '../services/exam.service';
import { I18nService } from '../services/i18n.service';

@Component({
  selector: 'app-exam-history',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page">
      <h2>{{ i18n.isEn ? 'Exam History' : 'পরীক্ষার ইতিহাস' }}</h2>

      <div class="weak-section" *ngIf="weakChapters.length">
        <h3>⚠️ {{ i18n.t('weakChapters') }}</h3>
        <div class="weak-list">
          <div class="weak-item" *ngFor="let w of weakChapters">
            <span>{{ i18n.isEn ? w.chapter?.title_en : w.chapter?.title_bn }}</span>
            <span class="weak-pct">{{ (w.avg_ratio * 100) | number:'1.0-0' }}%</span>
          </div>
        </div>
      </div>

      <table class="history-table">
        <thead><tr><th>{{ i18n.isEn ? 'Date' : 'তারিখ' }}</th><th>{{ i18n.t('score') }}</th><th>{{ i18n.isEn ? 'Mode' : 'মোড' }}</th><th></th></tr></thead>
        <tbody>
          <tr *ngFor="let h of history">
            <td>{{ h.started_at | date:'mediumDate' }}</td>
            <td>{{ h.score }} / {{ h.max_score }}</td>
            <td>{{ h.exam_mode }}</td>
            <td><button class="ghost-btn" (click)="router.navigate(['/exam/result', h.id])">{{ i18n.isEn ? 'Review' : 'রিভিউ' }}</button></td>
          </tr>
        </tbody>
      </table>
      <p class="empty" *ngIf="!history.length">{{ i18n.isEn ? 'No exams taken yet.' : 'এখনো কোনো পরীক্ষা দেওয়া হয়নি।' }}</p>
    </div>
  `,
  styles: [`
    .page { max-width: 800px; margin: 0 auto; padding: 24px 20px; }
    h2 { color: #1a6d5e; }
    .weak-section { background: #fff8ee; border: 1px solid #f3d9a8; border-radius: 12px; padding: 16px; margin-bottom: 20px; }
    .weak-section h3 { margin: 0 0 10px; font-size: 0.95rem; color: #a5690c; }
    .weak-list { display: flex; flex-direction: column; gap: 6px; }
    .weak-item { display: flex; justify-content: space-between; font-size: 0.88rem; }
    .weak-pct { font-weight: 700; color: #c0392b; }
    .history-table { width: 100%; border-collapse: collapse; background: #fff; }
    .history-table th, .history-table td { border: 1px solid #e2e8ec; padding: 10px; text-align: left; font-size: 0.88rem; }
    .ghost-btn { background: transparent; border: 1px solid #cfd9dd; color: #33454f; padding: 6px 12px; border-radius: 6px; font-size: 0.8rem; }
    .empty { color: #8a97a0; text-align: center; margin-top: 20px; }
  `],
})
export class ExamHistoryComponent implements OnInit {
  private examService = inject(ExamService);
  i18n = inject(I18nService);
  router = inject(Router);

  history: any[] = [];
  weakChapters: any[] = [];

  ngOnInit() {
    this.examService.history().subscribe(h => this.history = h);
    this.examService.weakChapters().subscribe(w => this.weakChapters = w);
  }
}
