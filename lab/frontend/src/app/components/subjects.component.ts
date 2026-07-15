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
        <h3>{{ i18n.isEn ? activeSubject.name_en : activeSubject.name_bn }}</h3>
        <p class="empty-hint" *ngIf="loading">{{ i18n.t('loading') }}</p>
        <p class="empty-hint" *ngIf="!loading && chapters.length === 0">
          {{ i18n.isEn ? 'No published chapters for this class yet.' : 'এই শ্রেণির জন্য এখনো কোনো অধ্যায় প্রকাশিত হয়নি।' }}
        </p>
        <div class="chapter-list">
          <button class="chapter-card" *ngFor="let ch of chapters" (click)="openChapter(ch)">
            <span>{{ i18n.isEn ? ch.title_en : ch.title_bn }}</span>
            <span class="arrow">→</span>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page { max-width: 900px; margin: 0 auto; padding: 24px 20px; }
    h2 { color: #1a6d5e; font-size: 1.2rem; }
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

  subjectIcon(code: string): string {
    return { CHE: '⚗️', PHY: '🔭', BIO: '🧬', ICT: '💻' }[code] || '📘';
  }
}
