import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { BookService, Book } from '../services/book.service';
import { I18nService } from '../services/i18n.service';

@Component({
  selector: 'app-book-corner',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <header class="head">
        <h1>📖 {{ i18n.t('bookCorner') }}</h1>
        <p class="ds-muted">{{ i18n.isEn ? 'Read your class textbooks online.' : 'আপনার শ্রেণির পাঠ্যবই অনলাইনে পড়ুন।' }}</p>
      </header>

      <div class="filters">
        <select class="ds-select" [ngModel]="classFilter()" (ngModelChange)="classFilter.set($event)" name="cls">
          <option [ngValue]="0">{{ i18n.isEn ? 'All classes' : 'সব শ্রেণি' }}</option>
          <option *ngFor="let c of classes" [ngValue]="c">{{ i18n.t('classLevel') }} {{ c }}</option>
        </select>
      </div>

      <div class="ds-loading" *ngIf="loading()"><div class="ds-spinner"></div><span>{{ i18n.t('loading') }}</span></div>

      <div class="ds-empty" *ngIf="!loading() && filtered().length === 0">
        <span class="ds-emoji">📚</span>
        <p>{{ i18n.isEn ? 'No books available yet.' : 'এখনো কোনো বই নেই।' }}</p>
      </div>

      <div class="grid" *ngIf="!loading()">
        <article class="book ds-card" *ngFor="let b of filtered()">
          <div class="cover">📕</div>
          <div class="meta">
            <span class="pill">{{ i18n.t('classLevel') }} {{ b.class_level }}</span>
            <span class="pill subject">{{ i18n.isEn ? b.subject_en : b.subject_bn }}</span>
          </div>
          <h3>{{ i18n.isEn ? b.title_en : b.title_bn }}</h3>
          <button class="ds-btn ds-btn-primary" (click)="open(b)">{{ i18n.t('read') }}</button>
        </article>
      </div>
    </div>
  `,
  styles: [`
    .page { max-width: 1000px; margin: 0 auto; padding: 28px 20px; }
    .head h1 { margin: 0 0 4px; color: var(--brand); font-size: 1.5rem; }
    .filters { margin: 18px 0; max-width: 220px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 18px; }
    .book { padding: 18px; display: flex; flex-direction: column; gap: 10px; }
    .cover { font-size: 2.4rem; }
    .meta { display: flex; gap: 6px; flex-wrap: wrap; }
    .pill { font-size: 0.7rem; font-weight: 700; padding: 2px 8px; border-radius: 999px; background: var(--surface-2); color: var(--text-muted); }
    .pill.subject { background: var(--brand-soft); color: var(--brand); }
    .book h3 { margin: 0; font-size: 1rem; min-height: 2.4em; }
    .book .ds-btn { margin-top: auto; }
  `],
})
export class BookCornerComponent implements OnInit {
  private books = inject(BookService);
  private router = inject(Router);
  i18n = inject(I18nService);

  all = signal<Book[]>([]);
  loading = signal(true);
  classFilter = signal(0);
  classes = [6, 7, 8, 9, 10, 11, 12];

  filtered = computed(() => {
    const cf = this.classFilter();
    return this.all().filter(b => !cf || b.class_level === cf);
  });

  ngOnInit() {
    this.books.list().subscribe({
      next: (rows) => { this.all.set(rows); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  open(b: Book) { this.router.navigate(['/book-corner/read', b.id]); }
}
