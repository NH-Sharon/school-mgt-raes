import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SimulationService, LabCatalogItem } from '../services/simulation.service';
import { AuthService } from '../services/auth.service';
import { I18nService } from '../services/i18n.service';
import { EXPERIMENTS, CHAPTERS, BOOK_CLASSES } from '../data/chem-curriculum-9-10';

type CatalogRow = LabCatalogItem & { class_levels?: number[]; class_label?: string; exp?: string };

interface LabGroup { key: string; classLevel: number; classLabel: string; subject: string; subjectKey: string; chapterId: number; chapterName: string; chapterOrder: number; labs: CatalogRow[]; }

@Component({
  selector: 'app-labs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <header class="head">
        <h1>🔬 {{ i18n.t('labs') }}</h1>
        <p class="ds-muted">{{ subtitle() }}</p>
      </header>

      <!-- ===== subject cards ===== -->
      <section class="subjects" *ngIf="subjects().length">
        <button class="s-card" *ngFor="let s of subjects()" [class.on]="subjectFilter() === s.key" (click)="toggleSubject(s.key)"
                [style.--c1]="s.c1" [style.--c2]="s.c2">
          <span class="s-ico">{{ s.icon }}</span>
          <span class="s-name">{{ s.name }}</span>
          <span class="s-meta">{{ s.count }} {{ i18n.isEn ? 'labs' : 'টি ল্যাব' }}</span>
        </button>
      </section>

      <!-- ===== narrow down ===== -->
      <section class="filter-card" *ngIf="showFilters()">
        <div class="frow">
          <label class="fld" *ngIf="classes().length > 1 || !isRestricted()">
            <span>{{ i18n.isEn ? 'Class' : 'শ্রেণি' }}</span>
            <select class="ds-select" [ngModel]="classFilter()" (ngModelChange)="setClass(+$event)" name="cls">
              <option [ngValue]="0">{{ i18n.isEn ? '— Select class —' : '— শ্রেণি বেছে নিন —' }}</option>
              <option *ngFor="let c of classes()" [ngValue]="c">{{ i18n.t('classLevel') }} {{ c }}</option>
            </select>
          </label>
          <label class="fld" *ngIf="chapters().length">
            <span>{{ i18n.isEn ? 'Chapter' : 'অধ্যায়' }}</span>
            <select class="ds-select" [ngModel]="chapterFilter()" (ngModelChange)="setChapter(+$event)" name="chap">
              <option [ngValue]="0">{{ i18n.isEn ? 'All chapters' : 'সব অধ্যায়' }}</option>
              <option *ngFor="let ch of chapters()" [ngValue]="ch.id">{{ ch.name }}</option>
            </select>
          </label>
          <label class="fld" *ngIf="topics().length > 1">
            <span>{{ i18n.isEn ? 'Topic' : 'টপিক' }}</span>
            <select class="ds-select" [ngModel]="topicFilter()" (ngModelChange)="topicFilter.set($event)" name="topic">
              <option value="">{{ i18n.isEn ? 'All topics' : 'সব টপিক' }}</option>
              <option *ngFor="let t of topics()" [value]="t">{{ t }}</option>
            </select>
          </label>
          <label class="fld grow">
            <span>{{ i18n.isEn ? 'Search' : 'খুঁজুন' }}</span>
            <input class="ds-input" [ngModel]="search()" (ngModelChange)="search.set($event)" [placeholder]="i18n.isEn ? 'Chapter, topic or lab name…' : 'অধ্যায়, টপিক বা ল্যাবের নাম…'" name="q">
          </label>
        </div>

        <div class="fbar" *ngIf="hasQuery()">
          <span class="result-count">{{ totalLabs() }} {{ i18n.isEn ? 'labs' : 'টি ল্যাব' }} · {{ groups().length }} {{ i18n.isEn ? 'chapters' : 'টি অধ্যায়' }}</span>
          <span class="fspace"></span>
          <button class="link" *ngIf="groups().length > 1" (click)="toggleAll()">{{ allOpen() ? (i18n.isEn ? 'Collapse all' : 'সব বন্ধ করুন') : (i18n.isEn ? 'Expand all' : 'সব খুলুন') }}</button>
          <button class="link danger" (click)="reset()">↺ {{ i18n.isEn ? 'Reset' : 'রিসেট' }}</button>
        </div>
      </section>

      <div class="ds-loading" *ngIf="loading()"><div class="ds-spinner"></div></div>

      <!-- ===== nothing chosen yet: nothing is opened automatically ===== -->
      <div class="pick" *ngIf="!loading() && !hasQuery()">
        <span>👆</span>
        <p>{{ i18n.isEn ? 'Choose a subject above (or search) — only what you pick will open.' : 'উপরে একটি বিষয় বেছে নিন (বা খুঁজুন) — শুধু আপনার বাছাইটাই খুলবে।' }}</p>
      </div>

      <div class="ds-empty" *ngIf="!loading() && hasQuery() && groups().length === 0">
        <span class="ds-emoji">🧫</span>
        <p>{{ isRestricted() ? (i18n.isEn ? 'No labs match your choice yet.' : 'এই নির্বাচনে এখনো কোনো ল্যাব নেই।') : (i18n.isEn ? 'No labs match your filters.' : 'আপনার ফিল্টারে কোনো ল্যাব মেলেনি।') }}</p>
        <button class="link" (click)="reset()">↺ {{ i18n.isEn ? 'Reset filters' : 'ফিল্টার রিসেট' }}</button>
      </div>

      <!-- ===== results: collapsed chapters (accordion) ===== -->
      <section class="acc" *ngFor="let g of groups()" [class.open]="isOpen(g)">
        <button class="acc-head" (click)="toggle(g)" [attr.aria-expanded]="isOpen(g)">
          <span class="chip">{{ g.chapterOrder }}</span>
          <span class="acc-title">
            <span class="crumb">{{ i18n.t('classLevel') }} {{ g.classLabel }} · {{ g.subject }}</span>
            <b>{{ g.chapterName }}</b>
          </span>
          <span class="badge">{{ g.labs.length }} {{ i18n.isEn ? 'labs' : 'ল্যাব' }}</span>
          <span class="caret">{{ isOpen(g) ? '▾' : '▸' }}</span>
        </button>
        <div class="labs" *ngIf="isOpen(g)">
          <article class="lab ds-card" *ngFor="let lab of g.labs">
            <div class="lab-top">
              <span class="lab-ico">🧪</span>
              <div class="modes-avail">
                <span class="tag" *ngIf="lab.supports_guided">{{ i18n.t('guidedMode') }}</span>
                <span class="tag" *ngIf="lab.supports_free">{{ i18n.t('nonGuidedMode') }}</span>
              </div>
            </div>
            <h3>{{ i18n.isEn ? lab.title_en : lab.title_bn }}</h3>
            <p class="topic" *ngIf="lab.topic_en">🏷️ {{ i18n.isEn ? lab.topic_en : lab.topic_bn }}</p>
            <button class="ds-btn ds-btn-primary" (click)="launch(lab)">{{ i18n.t('startLab') }}</button>
          </article>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .page { max-width: 980px; margin: 0 auto; padding: 28px 20px 48px; }
    .head h1 { color: var(--brand); font-size: 1.5rem; margin: 0 0 4px; }
    .filter-card { background: var(--surface, #fff); border: 1px solid var(--border, #e2e8ec); border-radius: 14px; padding: 14px 16px; margin: 16px 0 18px; box-shadow: 0 1px 2px rgba(20,40,40,.05); }
    .frow { display: flex; gap: 12px; flex-wrap: wrap; align-items: flex-end; }
    .fld { display: flex; flex-direction: column; gap: 4px; min-width: 150px; }
    .fld.grow { flex: 1 1 220px; }
    .fld > span, .slabel { font-size: .72rem; font-weight: 700; color: var(--text-muted, #6b7a84); text-transform: uppercase; letter-spacing: .03em; }
    .fld .ds-select, .fld .ds-input { width: 100%; }
    .subjects { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 12px; margin: 16px 0; }
    .s-card { position: relative; overflow: hidden; display: flex; flex-direction: column; align-items: flex-start; gap: 3px; text-align: left; padding: 15px 16px 13px; border-radius: 16px; border: 2px solid transparent; cursor: pointer; font-family: inherit; color: #fff;
      background: linear-gradient(135deg, var(--c1), var(--c2)); box-shadow: 0 6px 16px rgba(20,40,40,.14); transition: .2s; opacity: .85; }
    .s-card::after { content: ''; position: absolute; right: -30px; top: -30px; width: 110px; height: 110px; border-radius: 50%; background: rgba(255,255,255,.14); }
    .s-card:hover { opacity: 1; transform: translateY(-3px); }
    .s-card.on { opacity: 1; border-color: #fff; box-shadow: 0 0 0 3px var(--c1), 0 12px 26px rgba(20,40,40,.25); transform: translateY(-3px); }
    .s-ico { font-size: 1.8rem; } .s-name { font-weight: 800; font-size: 1rem; } .s-meta { font-size: .78rem; opacity: .92; }
    .pick { text-align: center; padding: 26px 10px; color: #55666f; background: #f2f9f7; border: 1px dashed #b8d9d1; border-radius: 14px; margin-bottom: 14px; }
    .pick span { font-size: 1.8rem; } .pick p { margin: 6px 0 0; }
    @media (max-width: 560px) { .subjects { grid-template-columns: repeat(2, 1fr); gap: 10px; } .s-card { padding: 12px; } }
    .subj { display: none; }
    .schip { border: 1px solid var(--border-strong, #cfd9dd); background: #fff; border-radius: 999px; padding: 5px 12px; font-size: .84rem; cursor: pointer; color: var(--text, #22323b); }
    .schip b { background: var(--surface-2, #f2f6f5); border-radius: 99px; padding: 0 7px; margin-left: 4px; font-size: .74rem; color: var(--text-muted, #6b7a84); }
    .schip.on { background: var(--brand, #1a6d5e); color: #fff; border-color: var(--brand, #1a6d5e); }
    .schip.on b { background: rgba(255,255,255,.22); color: #fff; }
    .fbar { display: flex; align-items: center; gap: 12px; margin-top: 12px; padding-top: 10px; border-top: 1px dashed var(--border, #e2e8ec); font-size: .84rem; }
    .fspace { flex: 1; }
    .result-count { color: var(--text-muted, #6b7a84); font-weight: 600; }
    .link { background: none; border: none; color: var(--brand, #1a6d5e); font-weight: 600; font-size: .82rem; cursor: pointer; padding: 2px 4px; }
    .link.danger { color: #a8321f; }

    .overview .hint { background: #eef6f4; border: 1px solid #cfe3de; color: #14544a; padding: 10px 14px; border-radius: 10px; font-size: .9rem; margin: 0 0 14px; }
    .tiles { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; }
    .tile { text-align: left; background: #fff; border: 1px solid var(--border, #e2e8ec); border-radius: 14px; padding: 14px 16px; cursor: pointer; display: flex; flex-direction: column; gap: 3px; transition: .15s; font-family: inherit; }
    .tile:hover { border-color: var(--brand, #1a6d5e); box-shadow: 0 6px 16px rgba(20,60,50,.12); transform: translateY(-2px); }
    .tclass { font-weight: 800; color: var(--brand, #1a6d5e); font-size: 1.05rem; }
    .tcount { font-size: .86rem; color: var(--text, #22323b); }
    .tsubs { font-size: .75rem; color: var(--text-muted, #6b7a84); }

    .acc { background: #fff; border: 1px solid var(--border, #e2e8ec); border-radius: 14px; margin-bottom: 10px; overflow: hidden; }
    .acc.open { border-color: #b8d9d1; box-shadow: 0 4px 14px rgba(20,60,50,.08); }
    .acc-head { width: 100%; display: flex; align-items: center; gap: 12px; padding: 12px 16px; background: transparent; border: none; cursor: pointer; text-align: left; font-family: inherit; color: inherit; }
    .acc-head:hover { background: #f7fbfa; }
    .chip { display: inline-grid; place-items: center; width: 28px; height: 28px; border-radius: 50%; background: var(--brand-soft, #eef6f4); color: var(--brand, #1a6d5e); font-size: .8rem; font-weight: 700; flex-shrink: 0; }
    .acc-title { display: flex; flex-direction: column; flex: 1; min-width: 0; }
    .acc-title b { font-size: 1rem; }
    .crumb { font-size: .74rem; color: var(--text-muted, #6b7a84); font-weight: 600; }
    .badge { background: var(--surface-2, #f2f6f5); color: var(--brand, #1a6d5e); border-radius: 99px; padding: 3px 10px; font-size: .76rem; font-weight: 700; white-space: nowrap; }
    .caret { color: var(--text-muted, #6b7a84); width: 14px; text-align: center; }
    .labs { display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 14px; padding: 4px 16px 16px; border-top: 1px solid #eef2f4; padding-top: 14px; }
    .lab { padding: 16px; display: flex; flex-direction: column; gap: 8px; }
    .lab-top { display: flex; justify-content: space-between; align-items: flex-start; }
    .lab-ico { font-size: 1.8rem; }
    .modes-avail { display: flex; flex-direction: column; gap: 3px; align-items: flex-end; }
    .tag { font-size: .62rem; font-weight: 700; padding: 1px 6px; border-radius: 999px; background: var(--surface-2); color: var(--text-muted); }
    .lab h3 { margin: 0; font-size: 1rem; }
    .topic { margin: 0; font-size: .8rem; color: var(--text-muted); }
    .lab .ds-btn { margin-top: auto; }
  `],
})
export class LabsComponent implements OnInit {
  private simSvc = inject(SimulationService);
  private auth = inject(AuthService);
  private router = inject(Router);
  i18n = inject(I18nService);

  private apiRows = signal<LabCatalogItem[]>([]);
  /** API labs + every guided chemistry experiment of the textbooks, listed by its name */
  all = computed<CatalogRow[]>(() => {
    const api = this.apiRows();
    const allowed = new Set(api.map(l => l.class_level));
    const extra: CatalogRow[] = [];
    EXPERIMENTS.forEach((e, i) => {
      const book = e.book || '9-10';
      const classes = (BOOK_CLASSES[book] || []).filter(c => allowed.has(c));
      if (!classes.length) return;
      const ch = CHAPTERS.find(c => c.no === e.chapter && (c.book || '9-10') === book);
      const sec = ch?.sections?.[e.topic - 1];
      extra.push({
        id: 100000 + i, key: 'exp:' + e.id, exp: e.id, title_bn: e.titleBn, title_en: e.titleBn, supports_guided: true, supports_free: false, order_index: i,
        chapter_id: (book === '9-10' ? 9000 : book === '11' ? 11000 : 12000) + e.chapter, chapter_bn: `অধ্যায় ${e.chapter}: ${ch?.bn ?? ''}`, chapter_en: `Chapter ${e.chapter}: ${ch?.bn ?? ''}`,
        chapter_order: e.chapter, subject_id: 1, class_level: classes[0], class_levels: classes, class_label: classes.length > 1 ? `${classes[0]}–${classes[classes.length - 1]}` : String(classes[0]),
        topic_bn: sec ? `${sec.no} ${sec.titleBn}` : null, topic_en: sec ? `${sec.no} ${sec.titleBn}` : null, subject_bn: 'রসায়ন', subject_en: 'Chemistry',
      });
    });
    return [...api, ...extra];
  });
  loading = signal(true);
  search = signal('');
  classFilter = signal(0);
  subjectFilter = signal('');   // subject_en used as a stable key
  chapterFilter = signal(0);    // chapter_id
  topicFilter = signal('');
  private openKeys = signal<Set<string>>(new Set());

  isRestricted() {
    const r = this.auth.currentUser()?.role;
    return r === 'student' || r === 'guardian';
  }

  subtitle() {
    if (this.isRestricted()) return this.i18n.isEn ? 'Choose what you need — labs open chapter by chapter.' : 'যা দরকার বেছে নিন — অধ্যায় ধরে ল্যাব খুলবে।';
    return this.i18n.isEn ? 'Choose class → subject → chapter → topic.' : 'শ্রেণি → বিষয় → অধ্যায় → টপিক বেছে নিন।';
  }

  private name = (l: LabCatalogItem, f: 'subject' | 'chapter' | 'topic') =>
    this.i18n.isEn ? (l as any)[f + '_en'] : (l as any)[f + '_bn'];

  classes = computed(() => [...new Set(this.all().flatMap(l => l.class_levels ?? [l.class_level]))].sort((a, b) => a - b));

  private byClass = computed(() => { const c = this.classFilter(); return c ? this.all().filter(l => (l.class_levels ?? [l.class_level]).includes(c)) : this.all(); });
  baseCount = computed(() => this.byClass().length);

  subjects = computed(() => {
    const m = new Map<string, { key: string; name: string; icon: string; count: number; c1: string; c2: string }>();
    for (const l of this.byClass()) {
      const t = this.theme(l.subject_en);
      const e = m.get(l.subject_en) ?? { key: l.subject_en, name: this.name(l, 'subject'), icon: t.icon, c1: t.c1, c2: t.c2, count: 0 };
      e.count++; m.set(l.subject_en, e);
    }
    return [...m.values()];
  });
  /** the narrowing row (class / chapter / topic / search) only appears once something is chosen or typed */
  showFilters = computed(() => true);

  private bySubject = computed(() => { const s = this.subjectFilter(); return s ? this.byClass().filter(l => l.subject_en === s) : this.byClass(); });

  chapters = computed(() => {
    if (!this.classFilter() && !this.subjectFilter()) return [];
    const m = new Map<number, { id: number; name: string }>();
    for (const l of this.bySubject()) if (!m.has(l.chapter_id)) m.set(l.chapter_id, { id: l.chapter_id, name: `${l.chapter_order}. ${this.name(l, 'chapter')}` });
    return [...m.values()];
  });

  topics = computed(() => {
    const ch = this.chapterFilter();
    if (!ch) return [];
    return [...new Set(this.bySubject().filter(l => l.chapter_id === ch).map(l => this.name(l, 'topic')).filter(Boolean))] as string[];
  });

  hasQuery = computed(() => !!(this.classFilter() || this.subjectFilter() || this.chapterFilter() || this.topicFilter() || this.search().trim()));

  /** compact overview shown before anything is chosen */
  overview = computed(() => this.classes().map(c => {
    const rows = this.all().filter(l => l.class_level === c);
    return { classLevel: c, labs: rows.length, subjects: [...new Set(rows.map(l => this.name(l, 'subject')))].join(' · ') };
  }));

  private filtered = computed(() => {
    const term = this.search().trim().toLowerCase();
    const ch = this.chapterFilter(), tp = this.topicFilter();
    return this.bySubject().filter(l => {
      if (ch && l.chapter_id !== ch) return false;
      if (tp && this.name(l, 'topic') !== tp) return false;
      if (!term) return true;
      return [l.title_en, l.title_bn, l.chapter_en, l.chapter_bn, l.topic_en, l.topic_bn].some(v => (v || '').toLowerCase().includes(term));
    });
  });

  groups = computed<LabGroup[]>(() => {
    if (!this.hasQuery()) return [];
    const map = new Map<string, LabGroup>();
    for (const l of this.filtered()) {
      const key = `${l.class_label ?? l.class_level}::${l.subject_en}::${l.chapter_id}`;
      if (!map.has(key)) map.set(key, { key, classLevel: l.class_level, classLabel: l.class_label ?? String(l.class_level), subject: this.name(l, 'subject'), subjectKey: l.subject_en, chapterId: l.chapter_id, chapterName: this.name(l, 'chapter'), chapterOrder: l.chapter_order, labs: [] });
      map.get(key)!.labs.push(l);
    }
    return [...map.values()];
  });
  totalLabs = computed(() => this.groups().reduce((s, g) => s + g.labs.length, 0));

  /** a chapter is open when the user opened it, or when they already narrowed down to it */
  isOpen(g: LabGroup): boolean {
    return this.openKeys().has(g.key) || !!this.chapterFilter() || !!this.search().trim() || this.groups().length === 1;
  }
  toggle(g: LabGroup) {
    const s = new Set(this.openKeys()); s.has(g.key) ? s.delete(g.key) : s.add(g.key); this.openKeys.set(s);
  }
  allOpen() { return this.groups().every(g => this.isOpen(g)); }
  toggleAll() { this.openKeys.set(this.allOpen() ? new Set() : new Set(this.groups().map(g => g.key))); }

  setClass(c: number) { this.classFilter.set(c); this.subjectFilter.set(''); this.chapterFilter.set(0); this.topicFilter.set(''); this.openKeys.set(new Set()); }
  setSubject(s: string) { this.subjectFilter.set(s); this.chapterFilter.set(0); this.topicFilter.set(''); this.openKeys.set(new Set()); }
  setChapter(c: number) { this.chapterFilter.set(c); this.topicFilter.set(''); }
  reset() { this.search.set(''); this.setClass(0); }

  private theme(subjectEn: string): { icon: string; c1: string; c2: string } {
    const n = (subjectEn || '').toLowerCase();
    return n.includes('chem') ? { icon: '⚗️', c1: '#1f8a76', c2: '#144f45' } : n.includes('phys') ? { icon: '⚡', c1: '#3b7ddd', c2: '#23459a' }
      : n.includes('bio') ? { icon: '🧬', c1: '#43a56b', c2: '#216b43' } : n.includes('ict') || n.includes('info') ? { icon: '💻', c1: '#8a5cd6', c2: '#533299' } : { icon: '📘', c1: '#5b7f78', c2: '#3a5550' };
  }
  toggleSubject(key: string) { this.setSubject(this.subjectFilter() === key ? '' : key); }
  private icon(subjectEn: string): string {
    const n = (subjectEn || '').toLowerCase();
    return n.includes('chem') ? '⚗️' : n.includes('phys') ? '⚡' : n.includes('bio') ? '🧬' : n.includes('ict') || n.includes('info') ? '💻' : '📘';
  }

  ngOnInit() {
    this.simSvc.getCatalog().subscribe({
      next: (rows) => {
        this.apiRows.set(rows); this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  launch(lab: CatalogRow) {
    if (lab.exp) this.router.navigate(['/lab-launch', 'chem-mixing'], { queryParams: { exp: lab.exp } });
    else this.router.navigate(['/lab-launch', lab.key]);
  }
}
