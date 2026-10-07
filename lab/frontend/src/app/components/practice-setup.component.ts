import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { SubjectService, Subject, Chapter } from '../services/subject.service';
import { ContentService } from '../services/content.service';
import { ExamService, Availability } from '../services/exam.service';
import { AuthService } from '../services/auth.service';
import { I18nService } from '../services/i18n.service';

interface Topic { id: number; title_bn: string; title_en: string; chapter_id: number; }
type Level = 'basic' | 'medium' | 'advanced';
const LEVELS: { key: Level; bn: string; en: string; icon: string; color: string }[] = [
  { key: 'basic', bn: 'সহজ', en: 'Easy', icon: '🌱', color: '#2e8b57' },
  { key: 'medium', bn: 'মাঝারি', en: 'Medium', icon: '⚖️', color: '#d4900f' },
  { key: 'advanced', bn: 'কঠিন', en: 'Hard', icon: '🔥', color: '#c0392b' },
];

@Component({
  selector: 'app-practice-setup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <header class="head">
        <h1>🎯 {{ i18n.isEn ? 'Practice & Exam builder' : 'অনুশীলন ও পরীক্ষা সেটআপ' }}</h1>
        <p class="ds-muted">{{ i18n.isEn ? 'Pick subject → chapters & topics → difficulty → number of questions, then practise or sit an exam.' : 'বিষয় → অধ্যায় ও টপিক → কঠিনতা → প্রশ্নসংখ্যা বেছে অনুশীলন করুন অথবা পরীক্ষা দিন।' }}</p>
      </header>

      <div class="layout">
        <div class="steps">
          <!-- 1. class + subject -->
          <section class="card">
            <h2><span class="n">1</span> {{ i18n.isEn ? 'Class & subject' : 'শ্রেণি ও বিষয়' }}</h2>
            <div class="chips" *ngIf="!lockedClass">
              <button class="chip" *ngFor="let c of classes" [class.on]="classLevel()===c" (click)="setClass(c)">{{ c }}</button>
            </div>
            <p class="ds-muted small" *ngIf="lockedClass">{{ i18n.t('classLevel') }} {{ classLevel() }}</p>
            <div class="subjects">
              <button class="subj" *ngFor="let s of subjects()" [class.on]="subject()?.id===s.id" (click)="selectSubject(s)">
                <span>{{ icon(s.code) }}</span>{{ i18n.isEn ? s.name_en : s.name_bn }}
              </button>
            </div>
          </section>

          <!-- 2. chapters + topics -->
          <section class="card" *ngIf="subject()">
            <div class="h-row">
              <h2><span class="n">2</span> {{ i18n.isEn ? 'Chapters & topics' : 'অধ্যায় ও টপিক' }}</h2>
              <span class="mini-actions" *ngIf="chapters().length">
                <button class="link" (click)="selectAllChapters()">{{ i18n.isEn ? 'Select all' : 'সব বাছুন' }}</button>
                <button class="link" (click)="clearChapters()">{{ i18n.isEn ? 'Clear' : 'মুছুন' }}</button>
              </span>
            </div>
            <div class="ds-loading small" *ngIf="loadingChapters()"><div class="ds-spinner"></div></div>
            <p class="ds-muted" *ngIf="!loadingChapters() && !chapters().length">{{ i18n.isEn ? 'No published chapters for this class yet.' : 'এই শ্রেণির জন্য এখনো কোনো অধ্যায় নেই।' }}</p>

            <div class="chap" *ngFor="let ch of chapters()" [class.on]="selectedChapters().has(ch.id)">
              <label class="chap-head">
                <input type="checkbox" [checked]="selectedChapters().has(ch.id)" (change)="toggleChapter(ch.id)">
                <span class="chap-title">{{ i18n.isEn ? ch.title_en : ch.title_bn }}</span>
                <span class="qcount" [class.zero]="countOf(ch.id) === 0">{{ countOf(ch.id) }} {{ i18n.isEn ? 'Q' : 'প্রশ্ন' }}</span>
              </label>
              <div class="topics" *ngIf="selectedChapters().has(ch.id) && topicsOf(ch.id).length">
                <span class="tlabel">{{ i18n.isEn ? 'Topics (blank = all)' : 'টপিক (কিছু না বাছলে সব)' }}</span>
                <label class="tchip" *ngFor="let t of topicsOf(ch.id)" [class.on]="selectedTopics().has(t.id)" [class.zero]="topicCount(t.id) === 0">
                  <input type="checkbox" [checked]="selectedTopics().has(t.id)" (change)="toggleTopic(t.id)">
                  {{ i18n.isEn ? t.title_en : t.title_bn }} <b>{{ topicCount(t.id) }}</b>
                </label>
              </div>
              <p class="note" *ngIf="selectedChapters().has(ch.id) && !topicsOf(ch.id).length && !topicsLoading()">{{ i18n.isEn ? 'Questions for this chapter are not split by topic — the whole chapter is used.' : 'এই অধ্যায়ের প্রশ্ন টপিকে ভাগ করা নেই — পুরো অধ্যায় থেকে আসবে।' }}</p>
            </div>
          </section>

          <!-- 3. difficulty -->
          <section class="card" *ngIf="selectedChapters().size">
            <h2><span class="n">3</span> {{ i18n.isEn ? 'Difficulty' : 'কঠিনতা' }} <small class="ds-muted">{{ i18n.isEn ? '(pick one or more — none = all)' : '(এক বা একাধিক — কিছু না বাছলে সব)' }}</small></h2>
            <div class="levels">
              <button class="lvl" *ngFor="let l of levels" [class.on]="levelSet().has(l.key)" [style.--c]="l.color" (click)="toggleLevel(l.key)" [disabled]="levelCount(l.key) === 0">
                <span class="li">{{ l.icon }}</span>
                <b>{{ i18n.isEn ? l.en : l.bn }}</b>
                <small>{{ levelCount(l.key) }} {{ i18n.isEn ? 'questions' : 'টি প্রশ্ন' }}</small>
              </button>
            </div>
          </section>

          <!-- 4. count -->
          <section class="card" *ngIf="selectedChapters().size">
            <h2><span class="n">4</span> {{ i18n.isEn ? 'How many questions?' : 'কয়টি প্রশ্ন?' }}
              <small class="ds-muted">{{ i18n.isEn ? 'available' : 'পাওয়া যাবে' }}: <b>{{ available() }}</b></small></h2>
            <div class="chips">
              <button class="chip" *ngFor="let n of presetCounts()" [class.on]="count() === n" (click)="setCount(n)">{{ n }}</button>
              <button class="chip" [class.on]="count() === available()" (click)="setCount(available())" [disabled]="!available()">{{ i18n.isEn ? 'All' : 'সব' }} ({{ available() }})</button>
            </div>
            <div class="slider" *ngIf="available() > 1">
              <input type="range" min="1" [max]="Math.min(available(), 100)" [ngModel]="count()" (ngModelChange)="setCount(+$event)">
              <input class="ds-input num" type="number" min="1" [max]="Math.min(available(), 100)" [ngModel]="count()" (ngModelChange)="setCount(+$event)">
            </div>
            <p class="warn" *ngIf="available() === 0">⚠️ {{ i18n.isEn ? 'No questions match this selection — change chapters, topics or difficulty.' : 'এই নির্বাচনে কোনো প্রশ্ন নেই — অধ্যায়, টপিক বা কঠিনতা বদলান।' }}</p>
          </section>

          <!-- 5. mode -->
          <section class="card" *ngIf="selectedChapters().size">
            <h2><span class="n">5</span> {{ i18n.isEn ? 'Practice or exam?' : 'অনুশীলন নাকি পরীক্ষা?' }}</h2>
            <div class="modes">
              <button class="mode" [class.on]="mode() === 'practice'" (click)="mode.set('practice')">
                <span class="mi">🎯</span><b>{{ i18n.isEn ? 'Practice' : 'অনুশীলন' }}</b>
                <small>{{ i18n.isEn ? 'No timer · take your time · explanations after submit' : 'টাইমার নেই · নিজের গতিতে · জমা দিলে ব্যাখ্যাসহ উত্তর' }}</small>
              </button>
              <button class="mode" [class.on]="mode() === 'exam'" (click)="mode.set('exam')">
                <span class="mi">📝</span><b>{{ i18n.isEn ? 'Exam' : 'পরীক্ষা' }}</b>
                <small>{{ i18n.isEn ? 'Timed · auto-submit when time ends' : 'সময়সীমা সহ · সময় শেষে নিজে জমা হয়' }}</small>
              </button>
            </div>
            <div class="exam-opts" *ngIf="mode() === 'exam'">
              <label class="opt">⏱ {{ i18n.isEn ? 'Time (minutes)' : 'সময় (মিনিট)' }}
                <input class="ds-input num" type="number" min="1" max="240" [ngModel]="timeMin()" (ngModelChange)="timeEdited = true; timeMin.set(+$event)">
              </label>
              <label class="opt chk"><input type="checkbox" [ngModel]="negative()" (ngModelChange)="negative.set($event)"> ➖ {{ i18n.isEn ? 'Negative marking (−0.25 per wrong answer)' : 'নেগেটিভ মার্কিং (ভুল উত্তরে −০.২৫)' }}</label>
            </div>
          </section>
        </div>

        <!-- summary -->
        <aside class="summary">
          <div class="card sticky">
            <h3>📋 {{ i18n.isEn ? 'Your set' : 'আপনার নির্বাচন' }}</h3>
            <ul class="sum">
              <li><span>{{ i18n.isEn ? 'Subject' : 'বিষয়' }}</span><b>{{ subject() ? (i18n.isEn ? subject()!.name_en : subject()!.name_bn) : '—' }}</b></li>
              <li><span>{{ i18n.isEn ? 'Chapters' : 'অধ্যায়' }}</span><b>{{ selectedChapters().size || '—' }}</b></li>
              <li><span>{{ i18n.isEn ? 'Topics' : 'টপিক' }}</span><b>{{ selectedTopics().size || (selectedChapters().size ? (i18n.isEn ? 'All' : 'সব') : '—') }}</b></li>
              <li><span>{{ i18n.isEn ? 'Difficulty' : 'কঠিনতা' }}</span><b>{{ levelLabel() }}</b></li>
              <li><span>{{ i18n.isEn ? 'Questions' : 'প্রশ্ন' }}</span><b>{{ selectedChapters().size ? count() : '—' }}</b></li>
              <li><span>{{ i18n.isEn ? 'Mode' : 'ধরন' }}</span><b>{{ mode() === 'exam' ? (i18n.isEn ? 'Exam · ' + timeMin() + ' min' : 'পরীক্ষা · ' + timeMin() + ' মিনিট') : (i18n.isEn ? 'Practice' : 'অনুশীলন') }}</b></li>
            </ul>
            <p class="ds-error" *ngIf="error()">{{ error() }}</p>
            <button class="start" [class.exam]="mode() === 'exam'" [disabled]="!canStart() || starting()" (click)="start()">
              {{ starting() ? i18n.t('loading') : (mode() === 'exam' ? ('📝 ' + (i18n.isEn ? 'Start exam' : 'পরীক্ষা শুরু করুন')) : ('🎯 ' + (i18n.isEn ? 'Start practice' : 'অনুশীলন শুরু করুন'))) }}
            </button>
            <button class="link hist" (click)="router.navigateByUrl('/exam/history')">🕘 {{ i18n.isEn ? 'Past attempts' : 'আগের ফলাফল' }}</button>
          </div>
        </aside>
      </div>
    </div>
  `,
  styles: [`
    .page { max-width: 1040px; margin: 0 auto; padding: 24px 16px 48px; }
    .head h1 { color: var(--brand); font-size: 1.45rem; margin: 0 0 2px; }
    .layout { display: grid; grid-template-columns: minmax(0, 1fr) 300px; gap: 18px; align-items: start; margin-top: 14px; }
    @media (max-width: 860px) { .layout { grid-template-columns: 1fr; } .summary { order: -1; } .sticky { position: static !important; } }
    .card { background: var(--surface, #fff); border: 1px solid var(--border, #e2e8ec); border-radius: 14px; padding: 16px 18px; margin-bottom: 14px; box-shadow: 0 1px 2px rgba(20,40,40,.05); }
    .card h2 { display: flex; align-items: center; gap: 8px; font-size: 1rem; margin: 0 0 12px; flex-wrap: wrap; }
    .card h2 small { font-weight: 400; margin-left: auto; }
    .h-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; }
    .n { display: inline-grid; place-items: center; width: 24px; height: 24px; border-radius: 50%; background: var(--brand); color: #fff; font-size: .8rem; }
    .chips { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; margin-bottom: 8px; }
    .chip { padding: 7px 15px; border-radius: 999px; border: 1px solid var(--border-strong, #cfd9dd); background: #fff; font-size: .86rem; cursor: pointer; }
    .chip.on { background: var(--brand); color: #fff; border-color: var(--brand); }
    .chip:disabled { opacity: .4; cursor: default; }
    .small { font-size: .85rem; margin: 0 0 8px; }
    .subjects { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; }
    .subj { display: flex; align-items: center; gap: 8px; padding: 11px 12px; border: 1px solid var(--border-strong, #cfd9dd); background: #fff; border-radius: 12px; font-weight: 600; cursor: pointer; font-size: .9rem; text-align: left; }
    .subj span { font-size: 1.3rem; }
    .subj.on { border-color: var(--brand); background: var(--brand-soft, #eef6f4); color: var(--brand); box-shadow: 0 0 0 2px rgba(26,109,94,.15); }
    .link { background: none; border: none; color: var(--brand); font-weight: 600; font-size: .82rem; cursor: pointer; padding: 2px 6px; }
    .mini-actions { display: flex; gap: 4px; }

    .chap { border: 1px solid var(--border, #e2e8ec); border-radius: 12px; margin-bottom: 8px; background: #fff; transition: .15s; }
    .chap.on { border-color: #9fd3c9; background: #f7fcfb; }
    .chap-head { display: flex; align-items: center; gap: 10px; padding: 10px 12px; cursor: pointer; }
    .chap-title { flex: 1; font-size: .92rem; font-weight: 600; }
    .qcount { background: var(--surface-2, #f2f6f5); color: var(--brand); border-radius: 99px; padding: 2px 10px; font-size: .74rem; font-weight: 700; white-space: nowrap; }
    .qcount.zero { color: #a5a5a5; }
    .topics { display: flex; flex-wrap: wrap; gap: 6px; padding: 0 12px 12px 34px; align-items: center; }
    .tlabel { width: 100%; font-size: .72rem; color: var(--text-muted, #6b7a84); font-weight: 700; text-transform: uppercase; letter-spacing: .03em; }
    .tchip { display: inline-flex; align-items: center; gap: 6px; border: 1px solid var(--border-strong, #cfd9dd); background: #fff; border-radius: 999px; padding: 4px 11px; font-size: .8rem; cursor: pointer; }
    .tchip input { display: none; }
    .tchip b { background: var(--surface-2, #f2f6f5); border-radius: 99px; padding: 0 7px; font-size: .72rem; color: var(--text-muted, #6b7a84); }
    .tchip.on { background: var(--brand); color: #fff; border-color: var(--brand); }
    .tchip.on b { background: rgba(255,255,255,.25); color: #fff; }
    .tchip.zero { opacity: .45; }
    .note { margin: 0; padding: 0 12px 10px 34px; font-size: .78rem; color: var(--text-muted, #6b7a84); }

    .levels { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
    .lvl { display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 12px 8px; border: 1.5px solid var(--border-strong, #cfd9dd); background: #fff; border-radius: 14px; cursor: pointer; transition: .15s; }
    .lvl .li { font-size: 1.4rem; }
    .lvl small { color: var(--text-muted, #6b7a84); font-size: .74rem; }
    .lvl.on { border-color: var(--c); background: color-mix(in srgb, var(--c) 12%, #fff); box-shadow: 0 0 0 2px color-mix(in srgb, var(--c) 25%, transparent); }
    .lvl.on b { color: var(--c); }
    .lvl:disabled { opacity: .4; cursor: default; }

    .slider { display: flex; gap: 12px; align-items: center; margin-top: 6px; }
    .slider input[type=range] { flex: 1; accent-color: var(--brand); }
    .num { width: 84px; }
    .warn { background: #fff6e6; border: 1px solid #f0c777; color: #7a4f00; padding: 8px 12px; border-radius: 8px; font-size: .86rem; margin: 10px 0 0; }

    .modes { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    @media (max-width: 520px) { .modes, .levels { grid-template-columns: 1fr; } }
    .mode { display: flex; flex-direction: column; align-items: flex-start; gap: 3px; padding: 14px; border: 1.5px solid var(--border-strong, #cfd9dd); background: #fff; border-radius: 14px; cursor: pointer; text-align: left; }
    .mode .mi { font-size: 1.5rem; }
    .mode small { color: var(--text-muted, #6b7a84); font-size: .78rem; line-height: 1.4; }
    .mode.on { border-color: var(--brand); background: var(--brand-soft, #eef6f4); box-shadow: 0 0 0 2px rgba(26,109,94,.15); }
    .exam-opts { display: flex; gap: 18px; flex-wrap: wrap; margin-top: 12px; align-items: center; }
    .opt { display: flex; align-items: center; gap: 8px; font-size: .88rem; }
    .opt.chk { cursor: pointer; }

    .sticky { position: sticky; top: 76px; margin-bottom: 0; }
    .sticky h3 { margin: 0 0 8px; color: var(--brand); font-size: 1rem; }
    .sum { list-style: none; margin: 0 0 12px; padding: 0; }
    .sum li { display: flex; justify-content: space-between; gap: 8px; padding: 7px 0; border-bottom: 1px dashed #e7eef0; font-size: .86rem; }
    .sum li span { color: var(--text-muted, #6b7a84); }
    .sum li b { text-align: right; }
    .start { width: 100%; padding: 14px; font-size: 1rem; font-weight: 700; border: none; border-radius: 12px; cursor: pointer; color: #fff; background: linear-gradient(135deg, #1f8a76, #144f45); box-shadow: 0 6px 16px rgba(20,79,69,.28); }
    .start.exam { background: linear-gradient(135deg, #d4900f, #a8620a); box-shadow: 0 6px 16px rgba(168,98,10,.3); }
    .start:disabled { opacity: .45; cursor: default; box-shadow: none; }
    .hist { display: block; margin: 10px auto 0; }
    .ds-loading.small { padding: 12px; }
  `],
})
export class PracticeSetupComponent implements OnInit {
  private subjectSvc = inject(SubjectService);
  private contentSvc = inject(ContentService);
  private examSvc = inject(ExamService);
  private auth = inject(AuthService);
  private route = inject(ActivatedRoute);
  router = inject(Router);
  i18n = inject(I18nService);
  Math = Math;
  levels = LEVELS;

  classes = [6, 7, 8, 9, 10, 11, 12];
  lockedClass = false;

  classLevel = signal(9);
  subjects = signal<Subject[]>([]);
  subject = signal<Subject | null>(null);
  chapters = signal<Chapter[]>([]);
  loadingChapters = signal(false);
  selectedChapters = signal<Set<number>>(new Set());
  topics = signal<Topic[]>([]);
  topicsLoading = signal(false);
  selectedTopics = signal<Set<number>>(new Set());
  levelSet = signal<Set<Level>>(new Set());
  mode = signal<'practice' | 'exam'>('practice');
  count = signal(10);
  timeMin = signal(10);
  negative = signal(false);
  timeEdited = false;
  starting = signal(false);
  error = signal('');

  allAvail = signal<Availability | null>(null);   // every chapter of the subject (for the counts next to chapters)
  selAvail = signal<Availability | null>(null);   // the current selection (chapters + topics)

  private preChapter = 0;

  /** questions available for the current chapters/topics/levels */
  available = computed(() => {
    const a = this.selAvail(); if (!a) return 0;
    const lv = this.levelSet();
    return lv.size ? [...lv].reduce((s, l) => s + (a[l] || 0), 0) : a.total;
  });

  ngOnInit() {
    const user = this.auth.currentUser();
    if (user?.classLevel) this.classLevel.set(user.classLevel);
    if (user?.role === 'student' && user.classLevel) this.lockedClass = true;
    const qp = this.route.snapshot.queryParamMap;
    this.preChapter = Number(qp.get('chapter')) || 0;
    const preSubject = Number(qp.get('subject')) || 0;
    this.subjectSvc.getSubjects().subscribe(s => {
      this.subjects.set(s);
      const hit = preSubject ? s.find(x => x.id === preSubject) : null;
      if (hit) this.selectSubject(hit);
    });
  }

  icon(code: string) { return ({ CHE: '⚗️', PHY: '🔭', BIO: '🧬', ICT: '💻' } as any)[code] || '📘'; }

  setClass(c: number) {
    if (this.lockedClass) return;
    this.classLevel.set(c);
    if (this.subject()) this.selectSubject(this.subject()!);
  }

  selectSubject(s: Subject) {
    this.subject.set(s);
    this.selectedChapters.set(new Set()); this.selectedTopics.set(new Set()); this.levelSet.set(new Set());
    this.topics.set([]); this.selAvail.set(null); this.allAvail.set(null);
    this.loadingChapters.set(true);
    this.subjectSvc.getChapters(s.id, this.classLevel()).subscribe({
      next: (chs) => {
        this.chapters.set(chs); this.loadingChapters.set(false);
        if (chs.length) this.examSvc.availability(chs.map(c => c.id)).subscribe(a => this.allAvail.set(a));
        if (this.preChapter && chs.some(c => c.id === this.preChapter)) { this.toggleChapter(this.preChapter); this.preChapter = 0; }
      },
      error: () => this.loadingChapters.set(false),
    });
  }

  countOf(chapterId: number): number { return this.allAvail()?.byChapter?.[chapterId]?.total ?? 0; }
  topicsOf(chapterId: number): Topic[] { return this.topics().filter(t => t.chapter_id === chapterId); }
  topicCount(id: number): number { return this.selAvail()?.byTopic?.[id]?.total ?? 0; }
  levelCount(l: Level): number { return this.selAvail()?.[l] ?? 0; }

  toggleChapter(id: number) {
    const set = new Set(this.selectedChapters());
    set.has(id) ? set.delete(id) : set.add(id);
    this.selectedChapters.set(set);
    this.reloadTopics();
  }
  selectAllChapters() { this.selectedChapters.set(new Set(this.chapters().filter(c => this.countOf(c.id) > 0).map(c => c.id))); this.reloadTopics(); }
  clearChapters() { this.selectedChapters.set(new Set()); this.selectedTopics.set(new Set()); this.topics.set([]); this.selAvail.set(null); }

  private reloadTopics() {
    const ids = [...this.selectedChapters()];
    if (!ids.length) { this.topics.set([]); this.selectedTopics.set(new Set()); this.selAvail.set(null); return; }
    this.topicsLoading.set(true);
    forkJoin(ids.map(id => this.contentSvc.getTopics(id))).subscribe({
      next: (lists) => {
        const merged = ([] as Topic[]).concat(...(lists as Topic[][]));
        this.topics.set(merged);
        const valid = new Set(merged.map(t => t.id));
        this.selectedTopics.set(new Set([...this.selectedTopics()].filter(t => valid.has(t))));
        this.topicsLoading.set(false);
        this.refreshAvail();
      },
      error: () => { this.topicsLoading.set(false); this.refreshAvail(); },
    });
  }

  toggleTopic(id: number) {
    const set = new Set(this.selectedTopics());
    set.has(id) ? set.delete(id) : set.add(id);
    this.selectedTopics.set(set);
    this.refreshAvail();
  }

  toggleLevel(l: Level) {
    const set = new Set(this.levelSet());
    set.has(l) ? set.delete(l) : set.add(l);
    this.levelSet.set(set);
    this.clampCount();
  }

  private refreshAvail() {
    const ids = [...this.selectedChapters()];
    if (!ids.length) { this.selAvail.set(null); return; }
    this.examSvc.availability(ids, [...this.selectedTopics()]).subscribe(a => { this.selAvail.set(a); this.clampCount(); });
  }

  presetCounts(): number[] { return [5, 10, 15, 20, 25, 30, 50].filter(n => n <= this.available()); }
  setCount(n: number) { this.count.set(Math.max(1, Math.min(Math.floor(+n) || 1, Math.max(1, this.available()), 100))); this.autoTime(); }
  private clampCount() {
    const max = Math.min(this.available(), 100);
    if (max > 0 && this.count() > max) this.count.set(max);
    this.autoTime();
  }
  /** default exam time = 1 minute per question until the student edits it */
  private autoTime() { if (!this.timeEdited) this.timeMin.set(Math.max(1, this.count())); }

  levelLabel(): string {
    const s = this.levelSet();
    if (!s.size || s.size === 3) return this.i18n.isEn ? 'All levels' : 'সব স্তর';
    return LEVELS.filter(l => s.has(l.key)).map(l => this.i18n.isEn ? l.en : l.bn).join(' + ');
  }

  canStart(): boolean { return this.selectedChapters().size > 0 && this.available() > 0 && this.count() > 0; }

  start() {
    if (!this.canStart()) return;
    this.error.set(''); this.starting.set(true);
    const exam = this.mode() === 'exam';
    const lv = [...this.levelSet()];
    const payload: any = {
      chapterIds: [...this.selectedChapters()],
      examMode: this.mode(),
      numQuestions: Math.min(this.count(), this.available()),
      timeLimitSec: exam ? Math.max(1, this.timeMin()) * 60 : 0,
      negativeMarking: exam && this.negative(),
    };
    const topicIds = [...this.selectedTopics()];
    if (topicIds.length) payload.topicIds = topicIds;
    if (lv.length && lv.length < 3) payload.difficulties = lv;

    this.examSvc.start(payload).subscribe({
      next: (res) => this.router.navigate(['/exam/take', res.attempt.id]),
      error: (err) => {
        this.starting.set(false);
        this.error.set(err?.error?.message || (this.i18n.isEn ? 'Could not start.' : 'শুরু করা যায়নি।'));
      },
    });
  }
}
