import { Component, ElementRef, inject, OnDestroy, OnInit, ViewChild, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { BookService } from '../services/book.service';
import { I18nService } from '../services/i18n.service';
import * as pdfjsLib from 'pdfjs-dist';

// Worker wired via bundler URL (Angular esbuild emits it as an asset).
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

@Component({
  selector: 'app-book-reader',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="reader">
      <div class="toolbar">
        <button class="ds-btn" (click)="back()">← {{ i18n.t('bookCorner') }}</button>
        <div class="pager">
          <button class="ds-btn" (click)="prev()" [disabled]="page() <= 1">‹</button>
          <span class="pageinfo">{{ i18n.t('page') }} {{ page() }} / {{ numPages() || '…' }}</span>
          <button class="ds-btn" (click)="next()" [disabled]="page() >= numPages()">›</button>
        </div>
        <div class="zoom">
          <button class="ds-btn" (click)="zoomOut()">−</button>
          <span>{{ (scale * 100) | number:'1.0-0' }}%</span>
          <button class="ds-btn" (click)="zoomIn()">＋</button>
        </div>
      </div>

      <div class="stage">
        <div class="ds-loading" *ngIf="loading()"><div class="ds-spinner"></div><span>{{ i18n.t('loading') }}</span></div>
        <div class="ds-error-state" *ngIf="error()">
          <span class="ds-emoji">⚠️</span><p>{{ error() }}</p>
        </div>
        <canvas #canvas [class.hidden]="loading() || error()"></canvas>
      </div>
    </div>
  `,
  styles: [`
    .reader { display: flex; flex-direction: column; height: calc(100vh - 64px); background: #2a3439; }
    .toolbar { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 10px 16px; background: var(--surface); border-bottom: 1px solid var(--border); flex-wrap: wrap; }
    .pager, .zoom { display: flex; align-items: center; gap: 8px; }
    .pageinfo { font-size: 0.85rem; color: var(--text-muted); min-width: 120px; text-align: center; }
    .zoom span { font-size: 0.8rem; color: var(--text-muted); min-width: 44px; text-align: center; }
    .stage { flex: 1; overflow: auto; display: flex; justify-content: center; align-items: flex-start; padding: 20px; }
    canvas { background: #fff; box-shadow: var(--shadow-lg); max-width: 100%; }
    canvas.hidden { display: none; }
  `],
})
export class BookReaderComponent implements OnInit, OnDestroy {
  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private books = inject(BookService);
  i18n = inject(I18nService);

  bookId = 0;
  page = signal(1);
  numPages = signal(0);
  loading = signal(true);
  error = signal('');
  scale = 1.2;

  private pdf: any = null;
  private saveTimer: any = null;
  private rendering = false;

  ngOnInit() {
    this.bookId = Number(this.route.snapshot.paramMap.get('id'));
    this.load();
  }

  ngOnDestroy() {
    if (this.saveTimer) clearTimeout(this.saveTimer);
    if (this.pdf) { try { this.pdf.destroy(); } catch {} }
  }

  private async load() {
    try {
      const url = this.books.fileUrl(this.bookId);
      // Range-based loading — pdf.js fetches only the pages it needs.
      const task = pdfjsLib.getDocument({ url, disableAutoFetch: true, disableStream: false });
      this.pdf = await task.promise;
      this.numPages.set(this.pdf.numPages);
      // Resume at last-read page
      this.books.getProgress(this.bookId).subscribe({
        next: ({ lastPage }) => {
          const p = Math.min(Math.max(1, lastPage || 1), this.pdf.numPages);
          this.page.set(p);
          this.render();
        },
        error: () => { this.render(); },
      });
    } catch (e: any) {
      this.loading.set(false);
      this.error.set(this.i18n.isEn ? 'Could not open this book.' : 'বইটি খোলা যায়নি।');
    }
  }

  private async render() {
    if (!this.pdf || this.rendering) return;
    this.rendering = true;
    this.loading.set(true);
    try {
      const pageObj = await this.pdf.getPage(this.page());
      const viewport = pageObj.getViewport({ scale: this.scale });
      const canvas = this.canvasRef.nativeElement;
      const ctx = canvas.getContext('2d')!;
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await pageObj.render({ canvasContext: ctx, viewport }).promise;
      this.loading.set(false);
      this.scheduleSave();
    } catch {
      this.loading.set(false);
    } finally {
      this.rendering = false;
    }
  }

  private scheduleSave() {
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => {
      this.books.saveProgress(this.bookId, this.page()).subscribe({ error: () => {} });
    }, 800);
  }

  next() { if (this.page() < this.numPages()) { this.page.update(p => p + 1); this.render(); } }
  prev() { if (this.page() > 1) { this.page.update(p => p - 1); this.render(); } }
  zoomIn() { this.scale = Math.min(3, this.scale + 0.2); this.render(); }
  zoomOut() { this.scale = Math.max(0.5, this.scale - 0.2); this.render(); }
  back() { this.router.navigateByUrl('/book-corner'); }
}
