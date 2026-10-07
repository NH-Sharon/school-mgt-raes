import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { SubjectService, ChapterDetail } from '../services/subject.service';
import { ContentService, CqQuestion } from '../services/content.service';
import { ExamService } from '../services/exam.service';
import { I18nService } from '../services/i18n.service';

const SIMULATION_ROUTES: Record<string, string> = {
  'chem-mixing': '/simulate/chemistry',
  'phy-pendulum': '/simulate/physics',
  'bio-microscope': '/simulate/biology',
  'ict-logic-gates': '/simulate/ict',
  'phy-circuit': '/simulate/circuit',
  'phy-lens': '/simulate/lens',
  'chem-titration': '/simulate/titration',
  'bio-photosynthesis': '/simulate/photosynthesis',
  'ict-html-editor': '/simulate/html-editor',
};

@Component({
  selector: 'app-chapter-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page ds-loading" *ngIf="!detail"><div class="ds-spinner"></div><p>{{ i18n.t('loading') }}</p></div>

    <div class="page" *ngIf="detail as d">
      <h2>{{ i18n.isEn ? d.chapter.title_en : d.chapter.title_bn }}</h2>

      <div class="progress-row">
        <div class="progress-bar"><div class="progress-fill" [style.width.%]="progressPct"></div></div>
        <span>{{ progressPct }}%</span>
        <button class="ds-btn small" (click)="toggleBookmark()">{{ bookmarked ? '★' : '☆' }} {{ i18n.isEn ? 'Bookmark' : 'বুকমার্ক' }}</button>
      </div>

      <!-- tabs (FR-3.2) -->
      <div class="tabs">
        <button class="tab" [class.active]="tab==='notes'" (click)="tab='notes'">📘 {{ i18n.t('notes') }}</button>
        <button class="tab" [class.active]="tab==='mcq'" (click)="tab='mcq'">📝 {{ i18n.t('mcqPractice') }}</button>
        <button class="tab" [class.active]="tab==='cq'" (click)="tab='cq'; loadCqs()">✍️ {{ i18n.t('cqPractice') }}</button>
      </div>

      <!-- NOTES -->
      <section *ngIf="tab==='notes'">
        <div class="content-blocks">
          <div class="ds-card content-block" *ngFor="let c of d.content">
            <h4>{{ blockLabel(c.content_type) }} — {{ i18n.isEn ? c.title_en : c.title_bn }}</h4>
            <p class="body-text">{{ i18n.isEn ? c.body_en : c.body_bn }}</p>
          </div>
          <div class="ds-empty" *ngIf="d.content.length === 0"><span class="ds-emoji">📭</span><p>{{ i18n.isEn ? 'No notes published yet.' : 'এখনো কোনো নোট প্রকাশিত হয়নি।' }}</p></div>
        </div>
        <div class="notes-box">
          <label class="ds-label">{{ i18n.isEn ? 'Your notes' : 'আপনার নোট' }}</label>
          <textarea class="ds-input" [(ngModel)]="notes" rows="3" (blur)="saveNotes()"></textarea>
        </div>
        <div class="action-row">
          <button class="ds-btn ds-btn-primary" *ngFor="let sim of d.simulations" (click)="openSimulation(sim.key)">
            🧪 {{ i18n.t('simulate') }}: {{ i18n.isEn ? sim.title_en : sim.title_bn }}
          </button>
        </div>
      </section>

      <!-- MCQ -->
      <section *ngIf="tab==='mcq'">
        <div class="ds-card panel">
          <p>{{ i18n.isEn ? 'Practice MCQs for this chapter. Questions are randomized and tiered (Basic / Medium / Advanced), with fresh questions preferred each attempt.' : 'এই অধ্যায়ের এমসিকিউ অনুশীলন করুন। প্রশ্ন এলোমেলো ও স্তরভিত্তিক (সহজ / মাঝারি / কঠিন), প্রতিবার নতুন প্রশ্ন অগ্রাধিকার পায়।' }}</p>
          <div class="action-row">
            <button class="ds-btn ds-btn-primary" (click)="startPractice(d.chapter.id)">▶ {{ i18n.t('practiceMode') }}</button>
            <button class="ds-btn" (click)="startExam(d.chapter.id)">📝 {{ i18n.t('examMode') }}</button>
          </div>
        </div>
      </section>

      <!-- CQ -->
      <section *ngIf="tab==='cq'">
        <div class="ds-loading" *ngIf="cqsLoading"><div class="ds-spinner"></div></div>
        <div class="ds-empty" *ngIf="!cqsLoading && cqs.length === 0"><span class="ds-emoji">✍️</span><p>{{ i18n.isEn ? 'No creative questions published for this chapter yet.' : 'এই অধ্যায়ের জন্য এখনো সৃজনশীল প্রশ্ন প্রকাশিত হয়নি।' }}</p></div>

        <article class="ds-card cq" *ngFor="let cq of cqs; let i = index">
          <div class="cq-head">
            <strong>{{ i18n.t('creativeQuestions') }} {{ i + 1 }}</strong>
            <span class="ds-pill" [class]="cq.difficulty">{{ cq.difficulty }}</span>
          </div>
          <p class="stimulus">{{ i18n.isEn ? cq.stimulus_en : cq.stimulus_bn }}</p>
          <ol class="parts">
            <li *ngFor="let p of cq.parts">
              <div class="part-q"><span class="lvl">{{ p.level }}</span> {{ i18n.isEn ? p.question_en : p.question_bn }} <span class="marks">[{{ p.marks }}]</span></div>
              <div class="answer" *ngIf="revealed[cq.id]">
                <span class="ds-label">{{ i18n.t('modelAnswer') }}</span>
                <p>{{ i18n.isEn ? p.model_answer_en : p.model_answer_bn }}</p>
              </div>
            </li>
          </ol>
          <button class="ds-btn small" (click)="revealed[cq.id] = !revealed[cq.id]">
            {{ revealed[cq.id] ? (i18n.isEn ? 'Hide answers' : 'উত্তর লুকান') : i18n.t('showAnswer') }}
          </button>
        </article>
      </section>
    </div>
  `,
  styles: [`
    .page { max-width: 820px; margin: 0 auto; padding: 24px 20px; }
    h2 { color: var(--brand); }
    .progress-row { display: flex; align-items: center; gap: 10px; margin-bottom: 18px; }
    .progress-bar { flex: 1; height: 8px; background: var(--border); border-radius: 999px; overflow: hidden; }
    .progress-fill { height: 100%; background: var(--brand); transition: width .3s; }
    .ds-btn.small { padding: 5px 10px; font-size: 0.78rem; }
    .tabs { display: flex; gap: 6px; border-bottom: 2px solid var(--border); margin-bottom: 18px; flex-wrap: wrap; }
    .tab { background: none; border: none; padding: 10px 14px; font-weight: 600; color: var(--text-muted); border-bottom: 2px solid transparent; margin-bottom: -2px; }
    .tab.active { color: var(--brand); border-bottom-color: var(--brand); }
    .content-block { padding: 16px; margin-bottom: 12px; }
    .content-block h4 { margin: 0 0 8px; color: var(--brand); font-size: 0.95rem; }
    .body-text { white-space: pre-line; line-height: 1.6; color: #33454f; font-size: 0.92rem; }
    .notes-box { margin: 16px 0; }
    .action-row { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 12px; }
    .panel { padding: 18px; }
    .panel p { margin: 0 0 12px; color: var(--text-muted); font-size: 0.9rem; }
    .cq { padding: 18px; margin-bottom: 14px; }
    .cq-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .stimulus { background: var(--surface-2); padding: 12px; border-radius: var(--radius-sm); font-size: 0.92rem; line-height: 1.6; }
    .parts { padding-left: 20px; }
    .parts li { margin-bottom: 12px; }
    .part-q { font-size: 0.92rem; }
    .lvl { font-size: 0.68rem; font-weight: 700; text-transform: uppercase; color: var(--accent); background: var(--brand-soft); padding: 1px 6px; border-radius: 6px; margin-right: 4px; }
    .marks { color: var(--text-faint); font-size: 0.8rem; }
    .answer { margin-top: 6px; padding: 8px 12px; border-left: 3px solid var(--brand); background: var(--brand-soft); border-radius: 0 var(--radius-sm) var(--radius-sm) 0; }
    .answer p { margin: 4px 0 0; font-size: 0.9rem; line-height: 1.6; }
  `],
})
export class ChapterDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private subjectService = inject(SubjectService);
  private contentService = inject(ContentService);
  private examService = inject(ExamService);
  i18n = inject(I18nService);

  detail: ChapterDetail | null = null;
  progressPct = 0;
  bookmarked = false;
  notes = '';
  tab: 'notes' | 'mcq' | 'cq' = 'notes';

  cqs: CqQuestion[] = [];
  cqsLoading = false;
  cqsLoaded = false;
  revealed: Record<number, boolean> = {};

  ngOnInit() {
    const chapterId = Number(this.route.snapshot.paramMap.get('chapterId'));
    this.subjectService.getChapterDetail(chapterId).subscribe(d => {
      this.detail = d;
      this.progressPct = d.progress?.percent_complete ?? 0;
      this.bookmarked = d.progress?.bookmarked ?? false;
      this.notes = d.progress?.notes ?? '';
      if (this.progressPct < 30) {
        this.contentService.updateProgress(chapterId, Math.max(this.progressPct, 30)).subscribe(p => this.progressPct = p.percent_complete);
      }
    });
  }

  loadCqs() {
    if (this.cqsLoaded || !this.detail) return;
    this.cqsLoading = true;
    this.contentService.getCqs(this.detail.chapter.id).subscribe({
      next: (rows) => { this.cqs = rows; this.cqsLoading = false; this.cqsLoaded = true; },
      error: () => { this.cqsLoading = false; this.cqsLoaded = true; },
    });
  }

  blockLabel(type: string): string {
    const map: Record<string, { bn: string; en: string }> = {
      notes: { bn: 'নোট', en: 'Notes' }, formula: { bn: 'সূত্র', en: 'Formula' },
      diagram: { bn: 'ডায়াগ্রাম', en: 'Diagram' }, video: { bn: 'ভিডিও', en: 'Video' }, glossary: { bn: 'শব্দকোষ', en: 'Glossary' },
    };
    const m = map[type] || { bn: type, en: type };
    return this.i18n.isEn ? m.en : m.bn;
  }

  toggleBookmark() {
    if (!this.detail) return;
    this.bookmarked = !this.bookmarked;
    this.contentService.setBookmark(this.detail.chapter.id, this.bookmarked).subscribe();
  }

  saveNotes() {
    if (!this.detail) return;
    this.contentService.setNotes(this.detail.chapter.id, this.notes).subscribe();
  }

  openSimulation(key: string) {
    // Route through the lab-launch flow (mode select + safety check) — FR-2/FR-8.
    this.router.navigate(['/lab-launch', key]);
  }

  startPractice(chapterId: number) {
    this.examService.start({ chapterIds: [chapterId], examMode: 'practice', numQuestions: 10, timeLimitSec: 0 }).subscribe({
      next: (res) => this.router.navigate(['/exam/take', res.attempt.id]),
      error: () => alert(this.i18n.isEn ? 'No published questions for this chapter yet.' : 'এই অধ্যায়ের জন্য এখনো কোনো প্রশ্ন প্রকাশিত হয়নি।'),
    });
  }

  startExam(chapterId: number) {
    this.examService.start({ chapterIds: [chapterId], examMode: 'exam', numQuestions: 25, timeLimitSec: 1500 }).subscribe({
      next: (res) => this.router.navigate(['/exam/take', res.attempt.id]),
      error: () => alert(this.i18n.isEn ? 'No published questions for this chapter yet.' : 'এই অধ্যায়ের জন্য এখনো কোনো প্রশ্ন প্রকাশিত হয়নি।'),
    });
  }
}
