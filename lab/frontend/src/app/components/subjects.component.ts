import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { SubjectService, Subject, Chapter } from '../services/subject.service';
import { ExamService, Availability } from '../services/exam.service';
import { SimulationService, LabCatalogItem } from '../services/simulation.service';
import { DashboardService } from '../services/dashboard.service';
import { AuthService } from '../services/auth.service';
import { I18nService } from '../services/i18n.service';

const THEME: Record<string, { icon: string; c1: string; c2: string }> = {
  CHE: { icon: '⚗️', c1: '#1f8a76', c2: '#144f45' },
  PHY: { icon: '🔭', c1: '#3b7ddd', c2: '#23459a' },
  BIO: { icon: '🧬', c1: '#43a56b', c2: '#216b43' },
  ICT: { icon: '💻', c1: '#8a5cd6', c2: '#533299' },
};
const FALLBACK = { icon: '📘', c1: '#5b7f78', c2: '#3a5550' };

@Component({
  selector: 'app-subjects',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <!-- header -->
      <header class="hero">
        <div class="hero-text">
          <h1>📚 {{ i18n.isEn ? 'Study' : 'অধ্যয়ন' }}</h1>
          <p>{{ i18n.isEn ? 'Class' : 'শ্রেণি' }} {{ classLevel() }} · {{ i18n.isEn ? 'pick a subject, then a chapter' : 'বিষয় বেছে অধ্যায় পড়ুন' }}</p>
        </div>
        <div class="search">
          <span>🔍</span>
          <input type="text" [ngModel]="search()" (ngModelChange)="search.set($event)" [placeholder]="i18n.isEn ? 'Search chapters…' : 'অধ্যায় খুঁজুন…'" name="q">
          <button *ngIf="search()" class="x" (click)="search.set('')">✕</button>
        </div>
      </header>

      <div class="class-picker" *ngIf="classLevels.length > 1">
        <button *ngFor="let c of classLevels" class="chip" [class.on]="c === classLevel()" (click)="selectClass(c)">{{ i18n.isEn ? 'Class' : 'শ্রেণি' }} {{ c }}</button>
      </div>

      <!-- practice builder banner -->
      <button class="builder" (click)="goPractice()">
        <span class="b-ico">🎯</span>
        <span class="b-txt"><b>{{ i18n.isEn ? 'Practice & exam builder' : 'অনুশীলন ও পরীক্ষা সেটআপ' }}</b>
          <small>{{ i18n.isEn ? 'Choose subject, chapters, topics, Easy / Medium / Hard and how many questions.' : 'বিষয়, অধ্যায়, টপিক, সহজ / মাঝারি / কঠিন ও প্রশ্নসংখ্যা বেছে নিন।' }}</small></span>
        <span class="b-go">→</span>
      </button>

      <!-- subject cards -->
      <section class="subjects">
        <button class="s-card" *ngFor="let s of subjects()" [class.on]="active()?.id === s.id" (click)="selectSubject(s)"
                [style.--c1]="theme(s).c1" [style.--c2]="theme(s).c2">
          <span class="s-ico">{{ theme(s).icon }}</span>
          <span class="s-name">{{ i18n.isEn ? s.name_en : s.name_bn }}</span>
          <span class="s-meta">{{ chapterCount(s.id) }} {{ i18n.isEn ? 'chapters' : 'টি অধ্যায়' }}</span>
          <ng-container *ngIf="mastery(s.id) as m">
            <span class="s-bar"><i [style.width.%]="m.pct"></i></span>
            <span class="s-prog">{{ m.done }}/{{ m.total }} {{ i18n.isEn ? 'mastered' : 'সম্পন্ন' }}</span>
          </ng-container>
        </button>
      </section>

      <!-- chapters -->
      <section class="chapters">
        <div class="ch-head">
          <h2 *ngIf="!search().trim() && active() as a">{{ theme(a).icon }} {{ i18n.isEn ? a.name_en : a.name_bn }}
            <small>{{ shown().length }} {{ i18n.isEn ? 'chapters' : 'টি অধ্যায়' }}</small></h2>
          <h2 *ngIf="search().trim()">🔍 “{{ search() }}” <small>{{ shown().length }} {{ i18n.isEn ? 'found' : 'টি পাওয়া গেছে' }}</small></h2>
        </div>

        <div class="grid" *ngIf="loading()">
          <div class="skeleton" *ngFor="let n of [1,2,3,4]"></div>
        </div>

        <div class="empty" *ngIf="!loading() && !shown().length">
          <span>📭</span>
          <p>{{ search().trim() ? (i18n.isEn ? 'No chapter matches your search.' : 'আপনার খোঁজের সাথে কোনো অধ্যায় মেলেনি।') : (i18n.isEn ? 'No published chapters for this class yet.' : 'এই শ্রেণির জন্য এখনো কোনো অধ্যায় প্রকাশিত হয়নি।') }}</p>
        </div>

        <div class="grid" *ngIf="!loading()">
          <article class="ch" *ngFor="let ch of shown()" [style.--c1]="theme(subjectOf(ch)).c1" [style.--c2]="theme(subjectOf(ch)).c2">
            <div class="ch-top">
              <span class="no">{{ ch.order_index }}</span>
              <h3>{{ i18n.isEn ? ch.title_en : ch.title_bn }}</h3>
            </div>
            <div class="tags">
              <span class="tag subj" *ngIf="search().trim()">{{ theme(subjectOf(ch)).icon }} {{ subjectName(ch.subject_id) }}</span>
              <span class="tag" *ngIf="labCount(ch.id)">🧪 {{ labCount(ch.id) }} {{ i18n.isEn ? 'labs' : 'ল্যাব' }}</span>
              <span class="tag" *ngIf="qCount(ch.id)">📝 {{ qCount(ch.id) }} {{ i18n.isEn ? 'questions' : 'প্রশ্ন' }}</span>
              <span class="tag none" *ngIf="!labCount(ch.id) && !qCount(ch.id)">{{ i18n.isEn ? 'Notes' : 'শুধু পাঠ' }}</span>
            </div>
            <div class="acts">
              <button class="read" (click)="openChapter(ch)">📖 {{ i18n.isEn ? 'Read' : 'পড়ুন' }}</button>
              <button class="prac" *ngIf="qCount(ch.id)" (click)="goPractice(ch.subject_id, ch.id)">🎯 {{ i18n.isEn ? 'Practice' : 'অনুশীলন' }}</button>
              <button class="lab" *ngIf="labCount(ch.id)" (click)="openLabs()">🧪</button>
            </div>
          </article>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .page { max-width: 1040px; margin: 0 auto; padding: 22px 16px 48px; color: #22323b; }
    .hero { display: flex; justify-content: space-between; align-items: center; gap: 14px; flex-wrap: wrap; padding: 20px 22px; border-radius: 18px; color: #fff; margin-bottom: 14px;
      background: radial-gradient(900px 260px at 100% -40%, rgba(55,194,181,.5), transparent 60%), linear-gradient(135deg, #1a6d5e, #144f45); box-shadow: 0 10px 26px rgba(20,79,69,.22); }
    .hero h1 { margin: 0; font-size: 1.5rem; } .hero p { margin: 4px 0 0; opacity: .9; font-size: .9rem; }
    .search { display: flex; align-items: center; gap: 8px; background: rgba(255,255,255,.96); border-radius: 12px; padding: 0 12px; min-width: 260px; flex: 0 1 340px; }
    .search input { border: none; outline: none; background: transparent; padding: 11px 0; font-size: .92rem; flex: 1; min-width: 0; font-family: inherit; color: #22323b; }
    .search .x { border: none; background: none; cursor: pointer; color: #6b7a84; }
    .class-picker { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 14px; }
    .chip { padding: 6px 14px; border-radius: 999px; border: 1px solid #cfd9dd; background: #fff; font-size: .84rem; cursor: pointer; }
    .chip.on { background: #1a6d5e; color: #fff; border-color: #1a6d5e; }

    .builder { width: 100%; display: flex; align-items: center; gap: 14px; text-align: left; background: linear-gradient(135deg, #fffaf0, #fff); border: 1px solid #f0d9aa; border-radius: 14px; padding: 13px 16px; margin-bottom: 16px; cursor: pointer; font-family: inherit; transition: .18s; }
    .builder:hover { box-shadow: 0 8px 20px rgba(160,100,10,.14); transform: translateY(-1px); }
    .b-ico { font-size: 1.8rem; } .b-txt { flex: 1; display: flex; flex-direction: column; gap: 2px; color: #7a4f00; } .b-txt small { color: #6b7a84; font-size: .8rem; line-height: 1.4; } .b-go { font-size: 1.3rem; color: #a8620a; }

    .subjects { display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 12px; margin-bottom: 20px; }
    .s-card { position: relative; overflow: hidden; display: flex; flex-direction: column; align-items: flex-start; gap: 3px; text-align: left; padding: 16px 16px 14px; border-radius: 16px; border: 2px solid transparent; cursor: pointer; font-family: inherit;
      color: #fff; background: linear-gradient(135deg, var(--c1), var(--c2)); box-shadow: 0 6px 16px rgba(20,40,40,.14); transition: .2s; opacity: .82; }
    .s-card::after { content: ''; position: absolute; right: -34px; top: -34px; width: 120px; height: 120px; border-radius: 50%; background: rgba(255,255,255,.14); }
    .s-card:hover { opacity: 1; transform: translateY(-3px); }
    .s-card.on { opacity: 1; border-color: #fff; box-shadow: 0 0 0 3px var(--c1), 0 12px 26px rgba(20,40,40,.25); transform: translateY(-3px); }
    .s-ico { font-size: 1.9rem; } .s-name { font-weight: 800; font-size: 1.02rem; } .s-meta { font-size: .78rem; opacity: .92; }
    .s-bar { width: 100%; height: 6px; border-radius: 6px; background: rgba(255,255,255,.28); margin-top: 8px; overflow: hidden; }
    .s-bar i { display: block; height: 100%; background: #fff; border-radius: 6px; transition: width .6s; }
    .s-prog { font-size: .7rem; opacity: .9; }

    .ch-head h2 { display: flex; align-items: baseline; gap: 10px; font-size: 1.15rem; margin: 0 0 12px; color: #144f45; }
    .ch-head h2 small { font-size: .8rem; color: #6b7a84; font-weight: 500; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 12px; }
    .ch { background: #fff; border: 1px solid #e2e8ec; border-radius: 16px; padding: 14px 16px; display: flex; flex-direction: column; gap: 10px; transition: .18s; border-top: 4px solid var(--c1); animation: up .35s ease both; }
    .ch:hover { box-shadow: 0 10px 24px rgba(20,60,50,.12); transform: translateY(-3px); }
    @keyframes up { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
    .ch-top { display: flex; gap: 12px; align-items: flex-start; }
    .no { flex: 0 0 32px; height: 32px; border-radius: 10px; display: grid; place-items: center; font-weight: 800; font-size: .86rem; color: #fff; background: linear-gradient(135deg, var(--c1), var(--c2)); }
    .ch h3 { margin: 0; font-size: .98rem; line-height: 1.4; }
    .tags { display: flex; flex-wrap: wrap; gap: 6px; }
    .tag { background: #f2f6f5; color: #33454f; border-radius: 99px; padding: 3px 10px; font-size: .74rem; font-weight: 600; }
    .tag.subj { background: #eef6f4; color: #1a6d5e; } .tag.none { color: #8a97a0; font-weight: 500; }
    .acts { display: flex; gap: 8px; margin-top: auto; }
    .acts button { border: none; border-radius: 10px; padding: 8px 12px; font-size: .84rem; font-weight: 700; cursor: pointer; font-family: inherit; }
    .read { flex: 1; background: linear-gradient(135deg, var(--c1), var(--c2)); color: #fff; }
    .prac { background: #fff6e6; color: #8a5200; border: 1px solid #f0d9aa !important; }
    .lab { background: #eef6f4; color: #1a6d5e; border: 1px solid #cfe3de !important; }
    .acts button:hover { filter: brightness(1.06); }

    .skeleton { height: 128px; border-radius: 16px; background: linear-gradient(90deg, #eef2f3 25%, #f7f9f9 50%, #eef2f3 75%); background-size: 200% 100%; animation: sh 1.2s infinite; }
    @keyframes sh { to { background-position: -200% 0; } }
    .empty { text-align: center; padding: 40px 10px; color: #6b7a84; } .empty span { font-size: 2.2rem; }
    @media (max-width: 560px) { .grid { grid-template-columns: 1fr; } .search { flex: 1 1 100%; } .subjects { grid-template-columns: repeat(2, 1fr); gap: 10px; } .s-card { padding: 12px; } .s-ico { font-size: 1.5rem; } .s-name { font-size: .92rem; } }
    @media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }
  `],
})
export class SubjectsComponent implements OnInit {
  private subjectService = inject(SubjectService);
  private examSvc = inject(ExamService);
  private simSvc = inject(SimulationService);
  private dashSvc = inject(DashboardService);
  private auth = inject(AuthService);
  private router = inject(Router);
  i18n = inject(I18nService);

  classLevels = [6, 7, 8, 9, 10, 11, 12];
  classLevel = signal(9);
  subjects = signal<Subject[]>([]);
  chaptersBySubject = signal<Record<number, Chapter[]>>({});
  active = signal<Subject | null>(null);
  loading = signal(true);
  search = signal('');
  avail = signal<Availability | null>(null);
  labs = signal<LabCatalogItem[]>([]);
  masteryRows = signal<any[]>([]);

  shown = computed<Chapter[]>(() => {
    const term = this.search().trim().toLowerCase();
    const map = this.chaptersBySubject();
    if (term) {
      return this.subjects().flatMap(s => map[s.id] || []).filter(c =>
        [c.title_bn, c.title_en].some(t => (t || '').toLowerCase().includes(term)));
    }
    const a = this.active();
    return a ? (map[a.id] || []) : [];
  });

  ngOnInit() {
    const user = this.auth.currentUser();
    if (user?.classLevel) this.classLevel.set(user.classLevel);
    // Students see only their own class's chapters.
    if (user?.role === 'student' && user.classLevel) this.classLevels = [user.classLevel];
    if (user?.role === 'student') this.dashSvc.student().pipe(catchError(() => of(null))).subscribe(s => this.masteryRows.set(s?.mastery || []));
    this.simSvc.getCatalog().pipe(catchError(() => of([]))).subscribe(l => this.labs.set(l));
    this.subjectService.getSubjects().subscribe(s => { this.subjects.set(s); this.loadAll(); });
  }

  private loadAll() {
    this.loading.set(true);
    const subs = this.subjects();
    if (!subs.length) { this.loading.set(false); return; }
    forkJoin(subs.map(s => this.subjectService.getChapters(s.id, this.classLevel()).pipe(catchError(() => of([] as Chapter[]))))).subscribe(lists => {
      const map: Record<number, Chapter[]> = {};
      subs.forEach((s, i) => map[s.id] = lists[i]);
      this.chaptersBySubject.set(map);
      // open the last-used subject, else the first one that has chapters
      let saved = 0; try { saved = +(localStorage.getItem('studySubject') || 0); } catch { /* ignore */ }
      this.active.set(subs.find(s => s.id === saved && map[s.id].length) || subs.find(s => map[s.id].length) || subs[0]);
      this.loading.set(false);
      const ids = lists.flat().map(c => c.id);
      if (ids.length) this.examSvc.availability(ids).pipe(catchError(() => of(null))).subscribe(a => this.avail.set(a));
    });
  }

  selectClass(c: number) { this.classLevel.set(c); this.avail.set(null); this.loadAll(); }
  selectSubject(s: Subject) { this.active.set(s); this.search.set(''); try { localStorage.setItem('studySubject', String(s.id)); } catch { /* ignore */ } }

  theme(s: Subject | null) { return (s && THEME[s.code]) || FALLBACK; }
  subjectOf(ch: Chapter): Subject | null { return this.subjects().find(s => s.id === ch.subject_id) || null; }
  subjectName(id: number): string { const s = this.subjects().find(x => x.id === id); return s ? (this.i18n.isEn ? s.name_en : s.name_bn) : ''; }
  chapterCount(id: number): number { return (this.chaptersBySubject()[id] || []).length; }
  qCount(chapterId: number): number { return this.avail()?.byChapter?.[chapterId]?.total ?? 0; }
  labCount(chapterId: number): number { return this.labs().filter(l => l.chapter_id === chapterId).length; }
  mastery(subjectId: number): { done: number; total: number; pct: number } | null {
    const m = this.masteryRows().find(r => r.subject_id === subjectId);
    if (!m || !+m.total_chapters) return null;
    const done = +m.mastered, total = +m.total_chapters;
    return { done, total, pct: Math.min(100, ((done + 0.5 * (+m.in_progress || 0)) / total) * 100) };
  }

  openChapter(ch: Chapter) { this.router.navigate(['/subjects', ch.subject_id, 'chapters', ch.id]); }
  openLabs() { this.router.navigateByUrl('/labs'); }
  goPractice(subject?: number, chapter?: number) {
    this.router.navigate(['/practice'], { queryParams: { ...(subject ? { subject } : {}), ...(chapter ? { chapter } : {}) } });
  }
}
