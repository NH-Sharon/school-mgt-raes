import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ExamService, ExamQuestion } from '../services/exam.service';
import { I18nService } from '../services/i18n.service';

@Component({
  selector: 'app-mcq-exam',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="exam-shell" *ngIf="questions.length">
      <div class="exam-header">
        <h2>{{ untimed ? i18n.t('practiceMode') : i18n.t('exam') }}</h2>
        <div class="timer" *ngIf="!untimed" [class.low]="remainingSec < 60">⏱ {{ formatTime(remainingSec) }}</div>
        <div class="timer" *ngIf="untimed">∞ {{ i18n.t('practiceMode') }}</div>
      </div>

      <div class="exam-body">
        <div class="question-panel">
          <p class="q-index">{{ i18n.isEn ? 'Question' : 'প্রশ্ন' }} {{ currentIndex + 1 }} / {{ questions.length }}</p>
          <p class="q-text">{{ i18n.isEn ? currentQuestion.questionEn : currentQuestion.questionBn }}</p>
          <div class="options">
            <label class="option" *ngFor="let opt of currentQuestion.options" [class.selected]="isSelected(opt.id)">
              <input [type]="currentQuestion.questionType === 'multiple' ? 'checkbox' : 'radio'" [name]="'q' + currentQuestion.id"
                     [checked]="isSelected(opt.id)" (change)="selectOption(opt.id)">
              {{ i18n.isEn ? opt.en : opt.bn }}
            </label>
          </div>
          <div class="nav-row">
            <button class="ghost-btn" [disabled]="currentIndex === 0" (click)="goTo(currentIndex - 1)">← {{ i18n.isEn ? 'Previous' : 'পূর্ববর্তী' }}</button>
            <button class="ghost-btn" (click)="toggleMark()">{{ marked.has(currentQuestion.id) ? '★' : '☆' }} {{ i18n.isEn ? 'Mark for review' : 'রিভিউর জন্য চিহ্নিত করুন' }}</button>
            <button class="ghost-btn" [disabled]="currentIndex === questions.length - 1" (click)="goTo(currentIndex + 1)">{{ i18n.isEn ? 'Next' : 'পরবর্তী' }} →</button>
          </div>
        </div>

        <div class="palette-panel">
          <h4>{{ i18n.isEn ? 'Questions' : 'প্রশ্নপত্র' }}</h4>
          <div class="palette-grid">
            <button *ngFor="let q of questions; let i = index" class="palette-btn"
                    [class.answered]="(answers[q.id] || []).length"
                    [class.marked]="marked.has(q.id)"
                    [class.current]="i === currentIndex"
                    (click)="goTo(i)">{{ i + 1 }}</button>
          </div>
          <div class="legend">
            <span><i class="dot answered"></i>{{ i18n.isEn ? 'Answered' : 'উত্তর দেওয়া' }}</span>
            <span><i class="dot marked"></i>{{ i18n.isEn ? 'Marked' : 'চিহ্নিত' }}</span>
            <span><i class="dot"></i>{{ i18n.isEn ? 'Unanswered' : 'উত্তর দেওয়া হয়নি' }}</span>
          </div>
          <button class="primary-btn" (click)="submit(false)">✅ {{ i18n.t('submitExam') }}</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .exam-shell { max-width: 1000px; margin: 0 auto; padding: 16px; }
    .exam-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .exam-header h2 { color: #1a6d5e; margin: 0; }
    .timer { font-weight: 700; font-size: 1.1rem; color: #1a6d5e; background: #eef6f4; padding: 8px 16px; border-radius: 999px; }
    .timer.low { color: #c0392b; background: #fdecea; }
    .exam-body { display: grid; grid-template-columns: 1fr 260px; gap: 20px; }
    @media (max-width: 800px) { .exam-body { grid-template-columns: 1fr; } }
    .question-panel { background: #fff; border: 1px solid #e2e8ec; border-radius: 12px; padding: 20px; }
    .q-index { color: #8a97a0; font-size: 0.82rem; margin: 0 0 8px; }
    .q-text { font-size: 1.05rem; color: #22323b; margin: 0 0 16px; line-height: 1.6; }
    .options { display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px; }
    .option { display: flex; align-items: center; gap: 10px; padding: 10px 14px; border: 1px solid #e2e8ec; border-radius: 8px; cursor: pointer; }
    .option.selected { border-color: #1a6d5e; background: #eef6f4; }
    .nav-row { display: flex; justify-content: space-between; gap: 8px; flex-wrap: wrap; }
    .ghost-btn { background: transparent; border: 1px solid #cfd9dd; color: #33454f; padding: 8px 14px; border-radius: 8px; font-size: 0.85rem; }
    .palette-panel { background: #fff; border: 1px solid #e2e8ec; border-radius: 12px; padding: 16px; align-self: start; }
    .palette-panel h4 { margin: 0 0 10px; color: #1a6d5e; font-size: 0.9rem; }
    .palette-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px; margin-bottom: 12px; }
    .palette-btn { padding: 8px 0; border-radius: 6px; border: 1px solid #cfd9dd; background: #fff; font-size: 0.82rem; }
    .palette-btn.answered { background: #d4ecdf; border-color: #1a6d5e; }
    .palette-btn.marked { outline: 2px solid #e0a23a; }
    .palette-btn.current { border-color: #1a6d5e; box-shadow: 0 0 0 2px rgba(26,109,94,0.2); }
    .legend { display: flex; flex-direction: column; gap: 4px; font-size: 0.75rem; color: #667680; margin-bottom: 14px; }
    .dot { display: inline-block; width: 10px; height: 10px; border-radius: 3px; background: #fff; border: 1px solid #cfd9dd; margin-right: 6px; }
    .dot.answered { background: #d4ecdf; border-color: #1a6d5e; }
    .dot.marked { border-color: #e0a23a; }
    .primary-btn { width: 100%; background: linear-gradient(135deg, #1a6d5e, #144f45); color: #fff; border: none; padding: 12px; border-radius: 10px; font-weight: 700; }
  `],
})
export class McqExamComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private examService = inject(ExamService);
  i18n = inject(I18nService);

  attemptId!: number;
  questions: ExamQuestion[] = [];
  currentIndex = 0;
  answers: Record<number, string[]> = {};
  marked = new Set<number>();
  remainingSec = 0;
  untimed = false; // practice mode (timeLimitSec = 0)
  private timerHandle: any;
  private questionStartedAt = Date.now();

  get currentQuestion(): ExamQuestion { return this.questions[this.currentIndex]; }

  ngOnInit() {
    this.attemptId = Number(this.route.snapshot.paramMap.get('attemptId'));
    this.examService.getAttempt(this.attemptId).subscribe((res) => {
      if (res.attempt.status !== 'in_progress') { this.router.navigate(['/exam/result', this.attemptId]); return; }
      this.questions = res.questions;
      this.answers = res.attempt.answers || {};
      // Practice mode has no time limit — don't run the countdown/auto-submit.
      this.untimed = !res.attempt.config?.timeLimitSec;
      if (!this.untimed) {
        this.remainingSec = res.remainingSec;
        this.timerHandle = setInterval(() => this.tick(), 1000);
      }
    });
  }

  ngOnDestroy() { if (this.timerHandle) clearInterval(this.timerHandle); }

  private tick() {
    this.remainingSec--;
    if (this.remainingSec <= 0) { this.submit(true); }
  }

  isSelected(optId: string): boolean {
    return (this.answers[this.currentQuestion.id] || []).includes(optId);
  }

  selectOption(optId: string) {
    const q = this.currentQuestion;
    const timeSpent = Math.round((Date.now() - this.questionStartedAt) / 1000);
    if (q.questionType === 'multiple') {
      const cur = new Set(this.answers[q.id] || []);
      cur.has(optId) ? cur.delete(optId) : cur.add(optId);
      this.answers[q.id] = Array.from(cur);
    } else {
      this.answers[q.id] = [optId];
    }
    this.examService.saveAnswer(this.attemptId, q.id, this.answers[q.id], timeSpent).subscribe({ error: () => {} });
  }

  toggleMark() {
    const id = this.currentQuestion.id;
    this.marked.has(id) ? this.marked.delete(id) : this.marked.add(id);
  }

  goTo(i: number) {
    if (i < 0 || i >= this.questions.length) return;
    this.currentIndex = i;
    this.questionStartedAt = Date.now();
  }

  formatTime(sec: number): string {
    const m = Math.floor(Math.max(0, sec) / 60);
    const s = Math.max(0, sec) % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  submit(timedOut: boolean) {
    if (this.timerHandle) clearInterval(this.timerHandle);
    this.examService.submit(this.attemptId, this.answers, timedOut).subscribe(() => {
      this.router.navigate(['/exam/result', this.attemptId]);
    });
  }
}
