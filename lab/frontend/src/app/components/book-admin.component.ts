import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BookService, Book } from '../services/book.service';
import { AnalysisService, AnalysisJob, ReviewChapter } from '../services/analysis.service';
import { SubjectService, Subject } from '../services/subject.service';
import { I18nService } from '../services/i18n.service';

@Component({
  selector: 'app-book-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <h1>📚 {{ i18n.t('bookCorner') }} — {{ i18n.t('admin') }}</h1>

      <!-- Upload -->
      <section class="ds-card block">
        <h2>{{ i18n.t('upload') }}</h2>
        <div class="row">
          <select class="ds-select" [(ngModel)]="upSubject" name="s">
            <option [ngValue]="0" disabled>{{ i18n.t('subjects') }}</option>
            <option *ngFor="let s of subjects()" [ngValue]="s.id">{{ i18n.isEn ? s.name_en : s.name_bn }}</option>
          </select>
          <select class="ds-select" [(ngModel)]="upClass" name="c">
            <option *ngFor="let c of classes" [ngValue]="c">{{ i18n.t('classLevel') }} {{ c }}</option>
          </select>
          <input class="ds-input" [(ngModel)]="upTitleEn" name="te" placeholder="Title (English)">
          <input class="ds-input" [(ngModel)]="upTitleBn" name="tb" placeholder="শিরোনাম (বাংলা)">
        </div>
        <div class="row">
          <input type="file" accept="application/pdf" (change)="onFile($event)">
          <button class="ds-btn ds-btn-primary" (click)="doUpload()" [disabled]="!file || !upSubject || !upTitleEn || uploading()">
            {{ uploading() ? i18n.t('loading') : i18n.t('upload') }}
          </button>
        </div>
        <p class="ds-error" *ngIf="upError">{{ upError }}</p>
      </section>

      <!-- Books + analyze -->
      <section class="ds-card block">
        <h2>{{ i18n.t('bookCorner') }}</h2>
        <table class="tbl">
          <tr *ngFor="let b of books()">
            <td>{{ b.title_en }} <span class="ds-muted">· {{ i18n.t('classLevel') }} {{ b.class_level }}</span></td>
            <td class="analyze-cell">
              <input class="ds-input tiny" type="number" min="1" [(ngModel)]="b['_from']" [ngModelOptions]="{standalone:true}" placeholder="from">
              <input class="ds-input tiny" type="number" min="1" [(ngModel)]="b['_to']" [ngModelOptions]="{standalone:true}" placeholder="to">
              <button class="ds-btn" (click)="analyze(b)">🤖 {{ i18n.t('analyze') }}</button>
              <button class="ds-btn" (click)="loadReview(b)">{{ i18n.t('review') }}</button>
            </td>
          </tr>
        </table>
        <p class="hint">{{ i18n.isEn ? 'Analysis reads the given page range (max 20 pages/run) with Claude and creates draft chapters/topics/MCQ/CQ for review.' : 'বিশ্লেষণ নির্দিষ্ট পৃষ্ঠা পরিসর (সর্বোচ্চ ২০ পৃষ্ঠা) Claude দিয়ে পড়ে খসড়া অধ্যায়/টপিক/এমসিকিউ/সৃজনশীল প্রশ্ন তৈরি করে।' }}</p>
      </section>

      <!-- Jobs -->
      <section class="ds-card block" *ngIf="jobs().length">
        <h2>Jobs</h2>
        <div class="job" *ngFor="let j of jobs()">
          <span class="badge" [class]="j.status">{{ j.status }}</span>
          <span>{{ j.book_title }}</span>
          <span class="ds-muted" *ngIf="j.progress?.phase">{{ j.progress.phase }}<span *ngIf="j.progress.mode"> · {{ j.progress.mode }}</span><span *ngIf="j.status==='ready'"> · {{ j.progress.chapters }}ch/{{ j.progress.mcqs }}mcq/{{ j.progress.cqs }}cq</span></span>
          <span class="ds-error" *ngIf="j.error">{{ j.error }}</span>
        </div>
      </section>

      <!-- Review -->
      <section class="ds-card block" *ngIf="reviewBook()">
        <h2>{{ i18n.t('review') }}: {{ reviewBook()?.title_en }}</h2>
        <div class="ds-empty" *ngIf="reviewTree().length === 0"><span class="ds-emoji">🗂️</span><p>{{ i18n.isEn ? 'No generated chapters yet.' : 'এখনো কোনো খসড়া অধ্যায় নেই।' }}</p></div>
        <article class="chapter" *ngFor="let ch of reviewTree()">
          <header>
            <div>
              <strong>{{ i18n.isEn ? ch.title_en : ch.title_bn }}</strong>
              <span class="badge" [class]="ch.status">{{ ch.status }}</span>
              <span class="ds-muted">{{ ch.topics.length }} {{ i18n.t('topics') }} · {{ ch.mcqCount }} MCQ · {{ ch.cqCount }} CQ</span>
            </div>
            <div class="actions">
              <button class="ds-btn ds-btn-primary" *ngIf="ch.status !== 'published'" (click)="publish(ch)">{{ i18n.t('publish') }}</button>
              <button class="ds-btn danger" (click)="discard(ch)">✕</button>
            </div>
          </header>
          <ul class="topics">
            <li *ngFor="let t of ch.topics">{{ i18n.isEn ? t.title_en : t.title_bn }}</li>
          </ul>
          <details *ngIf="ch.mcqs.length">
            <summary>{{ ch.mcqs.length }} {{ i18n.t('mcqPractice') }}</summary>
            <div class="q" *ngFor="let q of ch.mcqs">
              <span class="ds-pill" [class]="q.difficulty">{{ q.difficulty }}</span>
              {{ i18n.isEn ? q.question_en : q.question_bn }}
            </div>
          </details>
        </article>
      </section>
    </div>
  `,
  styles: [`
    .page { max-width: 940px; margin: 0 auto; padding: 24px 20px; }
    h1 { color: var(--brand); font-size: 1.4rem; }
    .block { padding: 18px; margin-bottom: 18px; }
    .block h2 { margin: 0 0 12px; font-size: 1.05rem; }
    .row { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 10px; align-items: center; }
    .row .ds-input, .row .ds-select { flex: 1; min-width: 140px; }
    .tbl { width: 100%; border-collapse: collapse; }
    .tbl td { padding: 8px 4px; border-bottom: 1px solid var(--border); vertical-align: middle; }
    .analyze-cell { display: flex; gap: 6px; align-items: center; justify-content: flex-end; flex-wrap: wrap; }
    .tiny { width: 70px; padding: 6px 8px; }
    .hint { font-size: 0.78rem; color: var(--text-muted); margin-top: 10px; }
    .job { display: flex; gap: 10px; align-items: center; padding: 6px 0; font-size: 0.88rem; flex-wrap: wrap; }
    .badge { font-size: 0.7rem; font-weight: 700; padding: 2px 8px; border-radius: 999px; background: var(--surface-2); text-transform: capitalize; }
    .badge.ready, .badge.published { background: #e5f4ec; color: var(--success); }
    .badge.failed { background: #fbe7e4; color: var(--danger); }
    .badge.generating, .badge.extracting, .badge.pending, .badge.draft { background: #fdf2df; color: var(--warn); }
    .chapter { border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 12px; margin-bottom: 12px; }
    .chapter header { display: flex; justify-content: space-between; gap: 10px; align-items: center; flex-wrap: wrap; }
    .chapter header .ds-muted { font-size: 0.8rem; margin-left: 8px; }
    .actions { display: flex; gap: 6px; }
    .danger { color: var(--danger); border-color: var(--danger); }
    .topics { margin: 8px 0; padding-left: 18px; font-size: 0.86rem; color: var(--text-muted); }
    details { margin-top: 6px; font-size: 0.85rem; }
    .q { padding: 4px 0; display: flex; gap: 6px; align-items: baseline; }
  `],
})
export class BookAdminComponent implements OnInit, OnDestroy {
  private bookSvc = inject(BookService);
  private analysisSvc = inject(AnalysisService);
  private subjectSvc = inject(SubjectService);
  i18n = inject(I18nService);

  subjects = signal<Subject[]>([]);
  books = signal<(Book & { _from?: number; _to?: number })[]>([]);
  jobs = signal<AnalysisJob[]>([]);
  reviewTree = signal<ReviewChapter[]>([]);
  reviewBook = signal<Book | null>(null);
  uploading = signal(false);

  upSubject = 0; upClass = 9; upTitleEn = ''; upTitleBn = '';
  file: File | null = null;
  upError = '';
  classes = [6, 7, 8, 9, 10, 11, 12];
  private poll: any = null;

  ngOnInit() {
    this.subjectSvc.getSubjects().subscribe(s => this.subjects.set(s));
    this.refreshBooks();
    this.refreshJobs();
    this.poll = setInterval(() => this.refreshJobs(), 4000);
  }
  ngOnDestroy() { if (this.poll) clearInterval(this.poll); }

  refreshBooks() { this.bookSvc.adminList().subscribe(b => this.books.set(b)); }
  refreshJobs() { this.analysisSvc.jobs().subscribe(j => this.jobs.set(j)); }

  onFile(e: Event) { this.file = (e.target as HTMLInputElement).files?.[0] || null; }

  doUpload() {
    if (!this.file) return;
    this.upError = '';
    this.uploading.set(true);
    const fd = new FormData();
    fd.append('file', this.file);
    fd.append('subjectId', String(this.upSubject));
    fd.append('classLevel', String(this.upClass));
    fd.append('titleEn', this.upTitleEn);
    fd.append('titleBn', this.upTitleBn || this.upTitleEn);
    this.bookSvc.upload(fd).subscribe({
      next: () => { this.uploading.set(false); this.upTitleEn = ''; this.upTitleBn = ''; this.file = null; this.refreshBooks(); },
      error: (err) => { this.uploading.set(false); this.upError = err?.error?.message || 'Upload failed'; },
    });
  }

  analyze(b: Book & { _from?: number; _to?: number }) {
    const from = b._from || 1;
    const to = b._to || from + 19;
    this.analysisSvc.start(b.id, from, to).subscribe({
      next: () => this.refreshJobs(),
      error: (err) => alert(err?.error?.message || 'Analyze failed'),
    });
  }

  loadReview(b: Book) {
    this.reviewBook.set(b);
    this.analysisSvc.review(b.id).subscribe(t => this.reviewTree.set(t));
  }

  publish(ch: ReviewChapter) {
    this.analysisSvc.publishChapter(ch.id).subscribe(() => { if (this.reviewBook()) this.loadReview(this.reviewBook()!); });
  }
  discard(ch: ReviewChapter) {
    if (!confirm(this.i18n.isEn ? 'Discard this chapter and all its questions?' : 'এই অধ্যায় ও এর সব প্রশ্ন মুছে ফেলবেন?')) return;
    this.analysisSvc.discardChapter(ch.id).subscribe(() => { if (this.reviewBook()) this.loadReview(this.reviewBook()!); });
  }
}
