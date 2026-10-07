import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SubjectService, Subject, Chapter } from '../services/subject.service';
import { AuthService } from '../services/auth.service';
import { I18nService } from '../services/i18n.service';

@Component({
  selector: 'app-subjects',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page">
      <h2>{{ i18n.isEn ? 'Class' : 'শ্রেণি' }} {{ classLevel }} — {{ i18n.t('subjects') }}</h2>

      <button class="practice-cta" (click)="goPractice()">
        <span class="pc-ico">🎯</span>
        <span class="pc-txt"><b>{{ i18n.isEn ? 'Practice & exam builder' : 'অনুশীলন ও পরীক্ষা সেটআপ' }}</b>
        <small>{{ i18n.isEn ? 'Choose subject, chapters, topics, Easy / Medium / Hard and how many questions — then practise or sit an exam.' : 'বিষয়, অধ্যায়, টপিক, সহজ / মাঝারি / কঠিন ও প্রশ্নসংখ্যা বেছে নিন — তারপর অনুশীলন বা পরীক্ষা দিন।' }}</small></span>
        <span class="pc-go">→</span>
      </button>

      <div class="class-picker">
        <button *ngFor="let c of classLevels" class="chip" [class.active]="c === classLevel" (click)="selectClass(c)">{{ c }}</button>
      </div>

      <div class="subject-grid" *ngIf="!activeSubject">
        <button class="subject-card" *ngFor="let s of subjects" (click)="selectSubject(s)">
          <span class="subject-icon">{{ subjectIcon(s.code) }}</span>
          <span>{{ i18n.isEn ? s.name_en : s.name_bn }}</span>
        </button>
      </div>

      <div *ngIf="activeSubject">
        <button class="back-link" (click)="activeSubject = null">&larr; {{ i18n.isEn ? 'Back to subjects' : 'বিষয়ে ফিরুন' }}</button>
        <div class="subj-head">
          <h3>{{ i18n.isEn ? activeSubject.name_en : activeSubject.name_bn }}</h3>
          <button class="build-btn" (click)="goPractice(activeSubject.id)">🎯 {{ i18n.isEn ? 'Make a practice / exam' : 'এই বিষয়ে অনুশীলন / পরীক্ষা বানান' }}</button>
        </div>
        <p class="empty-hint" *ngIf="loading">{{ i18n.t('loading') }}</p>
        <p class="empty-hint" *ngIf="!loading && chapters.length === 0">
          {{ i18n.isEn ? 'No published chapters for this class yet.' : 'এই শ্রেণির জন্য এখনো কোনো অধ্যায় প্রকাশিত হয়নি।' }}
        </p>
        <div class="chapter-list">
          <div class="chapter-card" *ngFor="let ch of chapters">
            <button class="ch-main" (click)="openChapter(ch)"><span class="ch-no">{{ ch.order_index }}</span><span>{{ i18n.isEn ? ch.title_en : ch.title_bn }}</span></button>
            <button class="ch-quiz" (click)="goPractice(ch.subject_id, ch.id)" [title]="i18n.isEn ? 'Practice / exam this chapter' : 'এই অধ্যায়ের অনুশীলন / পরীক্ষা'">🎯 {{ i18n.isEn ? 'Practice' : 'অনুশীলন' }}</button>
            <button class="arrow" (click)="openChapter(ch)">→</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page { max-width: 900px; margin: 0 auto; padding: 24px 20px; }
    h2 { color: #1a6d5e; font-size: 1.2rem; }
    .practice-cta { width: 100%; display: flex; align-items: center; gap: 14px; text-align: left; background: linear-gradient(135deg, #eef6f4, #fff); border: 1px solid var(--brand); color: var(--brand); border-radius: 14px; padding: 14px 16px; margin: 6px 0 18px; cursor: pointer; font-family: inherit; }
    .pc-ico { font-size: 1.8rem; } .pc-txt { flex: 1; display: flex; flex-direction: column; gap: 2px; } .pc-txt small { color: #55666f; font-size: .8rem; line-height: 1.4; } .pc-go { font-size: 1.3rem; }
    .subj-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap; }
    .build-btn { background: var(--brand); color: #fff; border: none; border-radius: 10px; padding: 8px 14px; font-size: .84rem; font-weight: 600; cursor: pointer; }
    .ch-main { display: flex; align-items: center; gap: 10px; flex: 1; background: none; border: none; text-align: left; font-size: .92rem; color: #33454f; cursor: pointer; padding: 0; font-family: inherit; }
    .ch-no { display: inline-grid; place-items: center; width: 26px; height: 26px; border-radius: 50%; background: #eef6f4; color: #1a6d5e; font-size: .78rem; font-weight: 700; }
    .ch-quiz { background: #eef6f4; color: #1a6d5e; border: 1px solid #cfe3de; border-radius: 99px; padding: 4px 11px; font-size: .76rem; font-weight: 600; cursor: pointer; }
    .arrow { background: none; border: none; cursor: pointer; }
    .practice-cta:hover { box-shadow: 0 6px 16px rgba(20,60,50,.12); }
    .class-picker { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 20px; }
    .chip { padding: 7px 14px; border-radius: 999px; border: 1px solid #cfd9dd; background: #fff; font-size: 0.85rem; }
    .chip.active { background: #1a6d5e; color: #fff; border-color: #1a6d5e; }
    .subject-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 14px; }
    .subject-card {
      background: #fff; border: 1px solid #e2e8ec; border-radius: 14px; padding: 24px 12px;
      display: flex; flex-direction: column; align-items: center; gap: 8px; font-weight: 600; color: #33454f;
    }
    .subject-card:hover { border-color: #1a6d5e; }
    .subject-icon { font-size: 2rem; }
    .back-link { background: none; border: none; color: #1a6d5e; font-size: 0.85rem; margin-bottom: 10px; padding: 0; }
    .chapter-list { display: flex; flex-direction: column; gap: 8px; }
    .chapter-card {
      display: flex; justify-content: space-between; align-items: center;
      background: #fff; border: 1px solid #e2e8ec; border-radius: 10px; padding: 14px 16px; font-size: 0.92rem; color: #33454f;
    }
    .chapter-card:hover { border-color: #1a6d5e; }
    .arrow { color: #1a6d5e; }
    .empty-hint { color: #8a97a0; font-size: 0.88rem; }
  `],
})
export class SubjectsComponent implements OnInit {
  private subjectService = inject(SubjectService);
  private auth = inject(AuthService);
  private router = inject(Router);
  i18n = inject(I18nService);

  classLevels = [6, 7, 8, 9, 10, 11, 12];
  classLevel = 9;
  subjects: Subject[] = [];
  activeSubject: Subject | null = null;
  chapters: Chapter[] = [];
  loading = false;

  ngOnInit() {
    const user = this.auth.currentUser();
    if (user?.classLevel) this.classLevel = user.classLevel;
    // Students see only their own class's books/chapters (Study = their class).
    if (user?.role === 'student' && user.classLevel) {
      this.classLevels = [user.classLevel];
    }
    this.subjectService.getSubjects().subscribe(s => this.subjects = s);
  }

  selectClass(c: number) {
    this.classLevel = c;
    if (this.activeSubject) this.loadChapters();
  }

  selectSubject(s: Subject) {
    this.activeSubject = s;
    this.loadChapters();
  }

  loadChapters() {
    if (!this.activeSubject) return;
    this.loading = true;
    this.subjectService.getChapters(this.activeSubject.id, this.classLevel).subscribe(chs => {
      this.chapters = chs;
      this.loading = false;
    });
  }

  openChapter(ch: Chapter) {
    this.router.navigate(['/subjects', ch.subject_id, 'chapters', ch.id]);
  }

  goPractice(subject?: number, chapter?: number) {
    this.router.navigate(['/practice'], { queryParams: { ...(subject ? { subject } : {}), ...(chapter ? { chapter } : {}) } });
  }

  subjectIcon(code: string): string {
    return { CHE: '⚗️', PHY: '🔭', BIO: '🧬', ICT: '💻' }[code] || '📘';
  }
}
