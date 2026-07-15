import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ExamService } from '../services/exam.service';
import { I18nService } from '../services/i18n.service';

@Component({
  selector: 'app-exam-result',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page" *ngIf="attempt">
      <div class="score-card">
        <h2>{{ i18n.t('score') }}: {{ attempt.score }} / {{ attempt.max_score }}</h2>
        <p class="pct">{{ scorePct() }}%</p>
      </div>

      <div class="review-list">
        <div class="review-item" *ngFor="let q of review; let i = index" [class.correct]="isCorrect(q)" [class.incorrect]="!isCorrect(q)">
          <p class="q-index">{{ i18n.isEn ? 'Question' : 'প্রশ্ন' }} {{ i + 1 }}</p>
          <p class="q-text">{{ i18n.isEn ? q.questionEn : q.questionBn }}</p>
          <div class="opt-list">
            <div class="opt" *ngFor="let opt of q.options"
                 [class.chosen]="q.chosen.includes(opt.id)"
                 [class.right-answer]="q.correctAnswers.includes(opt.id)">
              {{ i18n.isEn ? opt.en : opt.bn }}
              <span *ngIf="q.correctAnswers.includes(opt.id)"> ✓</span>
            </div>
          </div>
          <p class="explanation"><b>{{ i18n.isEn ? 'Explanation:' : 'ব্যাখ্যা:' }}</b> {{ i18n.isEn ? q.explanationEn : q.explanationBn }}</p>
        </div>
      </div>

      <div class="action-row">
        <button class="ghost-btn" (click)="router.navigateByUrl('/exam/history')">{{ i18n.isEn ? 'View History' : 'ইতিহাস দেখুন' }}</button>
        <button class="ghost-btn" (click)="router.navigateByUrl('/dashboard')">{{ i18n.t('dashboard') }}</button>
      </div>
    </div>
  `,
  styles: [`
    .page { max-width: 800px; margin: 0 auto; padding: 24px 20px; }
    .score-card { text-align: center; background: #fff; border: 1px solid #e2e8ec; border-radius: 12px; padding: 24px; margin-bottom: 20px; }
    .score-card h2 { color: #1a6d5e; margin: 0 0 6px; }
    .pct { font-size: 1.6rem; font-weight: 700; color: #1a6d5e; margin: 0; }
    .review-item { background: #fff; border: 1px solid #e2e8ec; border-left: 4px solid #cfd9dd; border-radius: 10px; padding: 16px; margin-bottom: 12px; }
    .review-item.correct { border-left-color: #2ea86f; }
    .review-item.incorrect { border-left-color: #e0645c; }
    .q-index { color: #8a97a0; font-size: 0.78rem; margin: 0 0 4px; }
    .q-text { font-weight: 600; color: #22323b; margin: 0 0 10px; }
    .opt-list { display: flex; flex-direction: column; gap: 4px; margin-bottom: 10px; }
    .opt { padding: 6px 10px; border-radius: 6px; font-size: 0.85rem; background: #f7f9f9; }
    .opt.chosen { background: #fdecea; font-weight: 600; }
    .opt.right-answer { background: #e4f5eb; font-weight: 600; }
    .explanation { font-size: 0.85rem; color: #55666f; margin: 0; }
    .action-row { display: flex; gap: 10px; justify-content: center; margin-top: 20px; }
    .ghost-btn { background: transparent; border: 1px solid #cfd9dd; color: #33454f; padding: 9px 16px; border-radius: 8px; }
  `],
})
export class ExamResultComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private examService = inject(ExamService);
  i18n = inject(I18nService);
  router = inject(Router);

  attempt: any = null;
  review: any[] = [];

  ngOnInit() {
    const attemptId = Number(this.route.snapshot.paramMap.get('attemptId'));
    this.examService.getAttempt(attemptId).subscribe((res) => {
      this.attempt = res.attempt;
      this.review = res.questions;
    });
  }

  isCorrect(q: any): boolean {
    const chosen = [...q.chosen].sort();
    const correct = [...q.correctAnswers].sort();
    return chosen.length === correct.length && chosen.every((v: string, i: number) => v === correct[i]);
  }

  scorePct(): number {
    if (!this.attempt?.max_score) return 0;
    return Math.round((this.attempt.score / this.attempt.max_score) * 100);
  }
}
