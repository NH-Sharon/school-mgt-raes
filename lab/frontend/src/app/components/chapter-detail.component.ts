import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { SubjectService, ChapterDetail } from '../services/subject.service';
import { ContentService } from '../services/content.service';
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
    <div class="page" *ngIf="detail as d">
      <h2>{{ i18n.isEn ? d.chapter.title_en : d.chapter.title_bn }}</h2>

      <div class="progress-row">
        <div class="progress-bar"><div class="progress-fill" [style.width.%]="progressPct"></div></div>
        <span>{{ progressPct }}%</span>
        <button class="ghost-btn small" (click)="toggleBookmark()">{{ bookmarked ? '★' : '☆' }} {{ i18n.isEn ? 'Bookmark' : 'বুকমার্ক' }}</button>
      </div>

      <div class="content-blocks">
        <div class="content-block" *ngFor="let c of d.content">
          <h4>{{ blockLabel(c.content_type) }} — {{ i18n.isEn ? c.title_en : c.title_bn }}</h4>
          <p class="body-text">{{ i18n.isEn ? c.body_en : c.body_bn }}</p>
        </div>
      </div>

      <div class="notes-box">
        <label>{{ i18n.isEn ? 'Your notes' : 'আপনার নোট' }}</label>
        <textarea [(ngModel)]="notes" rows="3" (blur)="saveNotes()"></textarea>
      </div>

      <div class="action-row">
        <button class="primary-btn" *ngFor="let sim of d.simulations" (click)="openSimulation(sim.key)">
          🧪 {{ i18n.t('simulate') }}: {{ i18n.isEn ? sim.title_en : sim.title_bn }}
        </button>
        <button class="secondary-btn" (click)="startExam(d.chapter.id)">📝 {{ i18n.t('startExam') }}</button>
      </div>
    </div>
  `,
  styles: [`
    .page { max-width: 800px; margin: 0 auto; padding: 24px 20px; }
    h2 { color: #1a6d5e; }
    .progress-row { display: flex; align-items: center; gap: 10px; margin-bottom: 20px; }
    .progress-bar { flex: 1; height: 8px; background: #e2e8ec; border-radius: 999px; overflow: hidden; }
    .progress-fill { height: 100%; background: #1a6d5e; transition: width .3s; }
    .ghost-btn.small { background: none; border: 1px solid #cfd9dd; border-radius: 8px; padding: 5px 10px; font-size: 0.78rem; }
    .content-block { background: #fff; border: 1px solid #e2e8ec; border-radius: 12px; padding: 16px; margin-bottom: 12px; }
    .content-block h4 { margin: 0 0 8px; color: #1a6d5e; font-size: 0.95rem; }
    .body-text { white-space: pre-line; line-height: 1.6; color: #33454f; font-size: 0.9rem; }
    .notes-box { margin: 16px 0; }
    .notes-box label { display: block; font-size: 0.85rem; color: #55666f; margin-bottom: 4px; }
    .notes-box textarea { width: 100%; border: 1px solid #cfd9dd; border-radius: 8px; padding: 10px; font-family: inherit; }
    .action-row { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 10px; }
    .primary-btn { background: linear-gradient(135deg, #1a6d5e, #144f45); color: #fff; border: none; padding: 11px 16px; border-radius: 10px; font-weight: 600; font-size: 0.88rem; }
    .secondary-btn { background: #fff; border: 1px solid #1a6d5e; color: #1a6d5e; padding: 11px 16px; border-radius: 10px; font-weight: 600; font-size: 0.88rem; }
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
    const path = SIMULATION_ROUTES[key];
    if (path) this.router.navigateByUrl(path);
  }

  startExam(chapterId: number) {
    this.examService.start({ chapterIds: [chapterId], examMode: 'exam', numQuestions: 25, timeLimitSec: 1500 }).subscribe({
      next: (res) => this.router.navigate(['/exam/take', res.attempt.id]),
      error: () => alert(this.i18n.isEn ? 'No published questions for this chapter yet.' : 'এই অধ্যায়ের জন্য এখনো কোনো প্রশ্ন প্রকাশিত হয়নি।'),
    });
  }
}
