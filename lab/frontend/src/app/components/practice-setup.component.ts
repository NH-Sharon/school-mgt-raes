import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { SubjectService, Subject, Chapter } from '../services/subject.service';
import { ContentService } from '../services/content.service';
import { ExamService } from '../services/exam.service';
import { AuthService } from '../services/auth.service';
import { I18nService } from '../services/i18n.service';

interface Topic { id: number; title_bn: string; title_en: string; chapter_id: number; }

@Component({
  selector: 'app-practice-setup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <h1>🎯 {{ i18n.t('mcqPractice') }}</h1>
      <p class="ds-muted">{{ i18n.isEn ? 'Choose what to practise and how many questions.' : 'কী অনুশীলন করবেন ও কয়টি প্রশ্ন তা বেছে নিন।' }}</p>

      <!-- 1. Class -->
      <section class="ds-card step">
        <h2><span class="n">1</span> {{ i18n.t('classLevel') }}</h2>
        <div class="chips">
          <button class="chip" *ngFor="let c of classes" [class.active]="classLevel()===c" [disabled]="lockedClass && c!==classLevel()" (click)="setClass(c)">{{ c }}</button>
        </div>
      </section>

      <!-- 2. Subject -->
      <section class="ds-card step">
        <h2><span class="n">2</span> {{ i18n.t('subjects') }}</h2>
        <div class="chips">
          <button class="chip" *ngFor="let s of subjects()" [class.active]="subject()?.id===s.id" (click)="selectSubject(s)">
            {{ i18n.isEn ? s.name_en : s.name_bn }}
          </button>
        </div>
      </section>

      <!-- 3. Chapters -->
      <section class="ds-card step" *ngIf="subject()">
        <h2><span class="n">3</span> {{ i18n.isEn ? 'Chapters' : 'অধ্যায়সমূহ' }} <small class="ds-muted">({{ i18n.isEn ? 'pick one or more' : 'এক বা একাধিক' }})</small></h2>
        <div class="ds-loading small" *ngIf="loadingChapters()"><div class="ds-spinner"></div></div>
        <p class="ds-muted" *ngIf="!loadingChapters() && chapters().length===0">{{ i18n.isEn ? 'No published chapters.' : 'কোনো প্রকাশিত অধ্যায় নেই।' }}</p>
        <label class="checkrow" *ngFor="let ch of chapters()">
          <input type="checkbox" [checked]="selectedChapters().has(ch.id)" (change)="toggleChapter(ch.id)">
          {{ i18n.isEn ? ch.title_en : ch.title_bn }}
        </label>
      </section>

      <!-- 4. Topics (optional) -->
      <section class="ds-card step" *ngIf="topics().length">
        <h2><span class="n">4</span> {{ i18n.t('topics') }} <small class="ds-muted">({{ i18n.isEn ? 'optional — blank = all' : 'ঐচ্ছিক — খালি হলে সব' }})</small></h2>
        <label class="checkrow" *ngFor="let t of topics()">
          <input type="checkbox" [checked]="selectedTopics().has(t.id)" (change)="toggleTopic(t.id)">
          {{ i18n.isEn ? t.title_en : t.title_bn }}
        </label>
      </section>

      <!-- 5. How many questions -->
      <section class="ds-card step" *ngIf="selectedChapters().size">
        <h2><span class="n">5</span> {{ i18n.isEn ? 'How many questions?' : 'কয়টি প্রশ্ন?' }}</h2>
        <div class="chips">
          <button class="chip" *ngFor="let n of counts" [class.active]="numQuestions()===n" (click)="numQuestions.set(n)">{{ n }}</button>
          <input class="ds-input count-input" type="number" min="1" max="100" [ngModel]="numQuestions()" (ngModelChange)="numQuestions.set(+$event)">
        </div>
      </section>

      <!-- 6. Level -->
      <section class="ds-card step" *ngIf="selectedChapters().size">
        <h2><span class="n">6</span> {{ i18n.t('difficulty') }}</h2>
        <div class="chips">
          <button class="chip" [class.active]="level()==='all'" (click)="level.set('all')">{{ i18n.isEn ? 'All' : 'সব' }}</button>
          <button class="chip lvl basic" [class.active]="level()==='basic'" (click)="level.set('basic')">{{ i18n.t('basic') }}</button>
          <button class="chip lvl medium" [class.active]="level()==='medium'" (click)="level.set('medium')">{{ i18n.isEn ? 'Medium' : 'মাঝারি' }}</button>
          <button class="chip lvl advanced" [class.active]="level()==='advanced'" (click)="level.set('advanced')">{{ i18n.t('advanced') }}</button>
        </div>
      </section>

      <p class="ds-error" *ngIf="error()">{{ error() }}</p>
      <button class="ds-btn ds-btn-primary start" [disabled]="!selectedChapters().size || starting()" (click)="start()">
        ▶ {{ starting() ? i18n.t('loading') : i18n.t('practiceMode') }}
      </button>
    </div>
  `,
  styles: [`
    .page { max-width: 720px; margin: 0 auto; padding: 24px 20px; }
    h1 { color: var(--brand); font-size: 1.4rem; margin-bottom: 2px; }
    .step { padding: 16px; margin: 14px 0; }
    .step h2 { display: flex; align-items: center; gap: 8px; font-size: 1rem; margin: 0 0 12px; }
    .step h2 small { font-weight: 400; }
    .n { display: inline-grid; place-items: center; width: 22px; height: 22px; border-radius: 50%; background: var(--brand); color: #fff; font-size: 0.78rem; }
    .chips { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
    .chip { padding: 7px 14px; border-radius: 999px; border: 1px solid var(--border-strong); background: var(--surface); font-size: 0.85rem; }
    .chip.active { background: var(--brand); color: #fff; border-color: var(--brand); }
    .chip:disabled { opacity: 0.4; }
    .chip.lvl.basic.active { background: var(--difficulty-basic); border-color: var(--difficulty-basic); }
    .chip.lvl.medium.active { background: var(--difficulty-medium); border-color: var(--difficulty-medium); }
    .chip.lvl.advanced.active { background: var(--difficulty-advanced); border-color: var(--difficulty-advanced); }
    .count-input { width: 80px; }
    .checkrow { display: flex; gap: 8px; align-items: center; padding: 6px 0; font-size: 0.9rem; }
    .start { width: 100%; padding: 14px; font-size: 1rem; margin-top: 8px; }
    .ds-loading.small { padding: 12px; }
  `],
})
export class PracticeSetupComponent implements OnInit {
  private subjectSvc = inject(SubjectService);
  private contentSvc = inject(ContentService);
  private examSvc = inject(ExamService);
  private auth = inject(AuthService);
  private router = inject(Router);
  i18n = inject(I18nService);

  classes = [6, 7, 8, 9, 10, 11, 12];
  counts = [5, 10, 15, 20, 25];
  lockedClass = false;

  classLevel = signal(9);
  subjects = signal<Subject[]>([]);
  subject = signal<Subject | null>(null);
  chapters = signal<Chapter[]>([]);
  loadingChapters = signal(false);
  selectedChapters = signal<Set<number>>(new Set());
  topics = signal<Topic[]>([]);
  selectedTopics = signal<Set<number>>(new Set());
  numQuestions = signal(10);
  level = signal<'all' | 'basic' | 'medium' | 'advanced'>('all');
  starting = signal(false);
  error = signal('');

  ngOnInit() {
    const user = this.auth.currentUser();
    if (user?.classLevel) this.classLevel.set(user.classLevel);
    if (user?.role === 'student' && user.classLevel) this.lockedClass = true;
    this.subjectSvc.getSubjects().subscribe(s => this.subjects.set(s));
  }

  setClass(c: number) {
    if (this.lockedClass) return;
    this.classLevel.set(c);
    if (this.subject()) this.selectSubject(this.subject()!);
  }

  selectSubject(s: Subject) {
    this.subject.set(s);
    this.selectedChapters.set(new Set());
    this.selectedTopics.set(new Set());
    this.topics.set([]);
    this.loadingChapters.set(true);
    this.subjectSvc.getChapters(s.id, this.classLevel()).subscribe({
      next: (chs) => { this.chapters.set(chs); this.loadingChapters.set(false); },
      error: () => this.loadingChapters.set(false),
    });
  }

  toggleChapter(id: number) {
    const set = new Set(this.selectedChapters());
    set.has(id) ? set.delete(id) : set.add(id);
    this.selectedChapters.set(set);
    this.reloadTopics();
  }

  private reloadTopics() {
    const ids = [...this.selectedChapters()];
    if (!ids.length) { this.topics.set([]); this.selectedTopics.set(new Set()); return; }
    forkJoin(ids.map(id => this.contentSvc.getTopics(id))).subscribe((lists) => {
      const merged = ([] as Topic[]).concat(...lists as Topic[][]);
      this.topics.set(merged);
      // drop topic selections that no longer apply
      const valid = new Set(merged.map(t => t.id));
      this.selectedTopics.set(new Set([...this.selectedTopics()].filter(t => valid.has(t))));
    });
  }

  toggleTopic(id: number) {
    const set = new Set(this.selectedTopics());
    set.has(id) ? set.delete(id) : set.add(id);
    this.selectedTopics.set(set);
  }

  start() {
    const chapterIds = [...this.selectedChapters()];
    if (!chapterIds.length) return;
    this.error.set('');
    this.starting.set(true);
    const payload: any = {
      chapterIds,
      examMode: 'practice',
      numQuestions: this.numQuestions(),
      timeLimitSec: 0,
    };
    const topicIds = [...this.selectedTopics()];
    if (topicIds.length) payload.topicIds = topicIds;
    if (this.level() !== 'all') payload.difficulty = this.level();

    this.examSvc.start(payload).subscribe({
      next: (res) => this.router.navigate(['/exam/take', res.attempt.id]),
      error: (err) => {
        this.starting.set(false);
        this.error.set(err?.error?.message || (this.i18n.isEn ? 'No questions match your selection yet.' : 'আপনার নির্বাচনের সাথে মেলে এমন প্রশ্ন নেই।'));
      },
    });
  }
}
