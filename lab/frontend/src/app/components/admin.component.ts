import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../services/admin.service';
import { SubjectService, Subject } from '../services/subject.service';
import { AuthService } from '../services/auth.service';
import { I18nService } from '../services/i18n.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <h2>{{ i18n.t('admin') }}</h2>
      <div class="tabs">
        <button class="tab" [class.active]="tab==='chapters'" (click)="tab='chapters'">{{ i18n.isEn ? 'Chapters & Content' : 'অধ্যায় ও কনটেন্ট' }}</button>
        <button class="tab" [class.active]="tab==='questions'" (click)="tab='questions'">{{ i18n.isEn ? 'Question Bank' : 'প্রশ্নব্যাংক' }}</button>
        <button class="tab" *ngIf="isSystemAdmin" [class.active]="tab==='users'" (click)="tab='users'">{{ i18n.isEn ? 'Users' : 'ব্যবহারকারী' }}</button>
        <button class="tab" *ngIf="isSystemAdmin" [class.active]="tab==='audit'" (click)="tab='audit'; loadAudit()">{{ i18n.isEn ? 'Audit Log' : 'অডিট লগ' }}</button>
      </div>

      <!-- ===== Chapters & Content ===== -->
      <div *ngIf="tab === 'chapters'" class="tab-body">
        <div class="form-card">
          <h4>{{ i18n.isEn ? 'New Chapter' : 'নতুন অধ্যায়' }}</h4>
          <div class="form-row">
            <select [(ngModel)]="newChapter.subjectId"><option *ngFor="let s of subjects" [value]="s.id">{{ s.name_en }}</option></select>
            <select [(ngModel)]="newChapter.classLevel"><option *ngFor="let c of classLevels" [value]="c">{{ c }}</option></select>
          </div>
          <div class="form-row">
            <input placeholder="Title (বাংলা)" [(ngModel)]="newChapter.titleBn">
            <input placeholder="Title (English)" [(ngModel)]="newChapter.titleEn">
          </div>
          <button class="primary-btn" (click)="createChapter()">{{ i18n.t('save') }}</button>
        </div>

        <table class="data-table">
          <thead><tr><th>{{ i18n.isEn ? 'Title' : 'শিরোনাম' }}</th><th>{{ i18n.isEn ? 'Class' : 'শ্রেণি' }}</th><th>{{ i18n.isEn ? 'Status' : 'অবস্থা' }}</th><th></th></tr></thead>
          <tbody>
            <tr *ngFor="let c of chapters">
              <td>{{ c.title_en }}</td><td>{{ c.class_level }}</td>
              <td><span class="status-badge" [class]="c.status">{{ c.status }}</span></td>
              <td>
                <button class="ghost-btn" *ngIf="c.status !== 'published'" (click)="advanceStatus(c)">{{ i18n.isEn ? 'Advance' : 'এগিয়ে নিন' }}</button>
                <button class="ghost-btn" (click)="selectedChapterId = c.id">{{ i18n.isEn ? 'Add Content' : 'কনটেন্ট যোগ করুন' }}</button>
              </td>
            </tr>
          </tbody>
        </table>

        <div class="form-card" *ngIf="selectedChapterId">
          <h4>{{ i18n.isEn ? 'Add Learning Content' : 'পাঠ্য কনটেন্ট যোগ করুন' }}</h4>
          <select [(ngModel)]="newContent.contentType">
            <option value="notes">Notes</option><option value="formula">Formula</option>
            <option value="diagram">Diagram</option><option value="glossary">Glossary</option>
          </select>
          <input placeholder="Title (bn)" [(ngModel)]="newContent.titleBn">
          <input placeholder="Title (en)" [(ngModel)]="newContent.titleEn">
          <textarea placeholder="Body (bn)" rows="3" [(ngModel)]="newContent.bodyBn"></textarea>
          <textarea placeholder="Body (en)" rows="3" [(ngModel)]="newContent.bodyEn"></textarea>
          <button class="primary-btn" (click)="createContent()">{{ i18n.t('save') }}</button>
        </div>
      </div>

      <!-- ===== Question Bank ===== -->
      <div *ngIf="tab === 'questions'" class="tab-body">
        <div class="form-card">
          <h4>{{ i18n.isEn ? 'Select Chapter' : 'অধ্যায় নির্বাচন করুন' }}</h4>
          <select [(ngModel)]="questionChapterId" (change)="loadQuestions()">
            <option *ngFor="let c of chapters" [value]="c.id">{{ c.title_en }}</option>
          </select>
        </div>

        <div class="form-card" *ngIf="questionChapterId">
          <h4>{{ i18n.isEn ? 'Add a Single Question' : 'একটি প্রশ্ন যোগ করুন' }}</h4>
          <textarea placeholder="Question (bn)" rows="2" [(ngModel)]="newQuestion.bn"></textarea>
          <textarea placeholder="Question (en)" rows="2" [(ngModel)]="newQuestion.en"></textarea>
          <div class="option-row" *ngFor="let opt of newQuestion.options">
            <input type="checkbox" [checked]="newQuestion.correct.includes(opt.id)" (change)="toggleCorrect(opt.id)" [title]="i18n.isEn ? 'Correct answer?' : 'সঠিক উত্তর?'">
            <span class="opt-label">{{ opt.id }}</span>
            <input placeholder="Option (bn)" [(ngModel)]="opt.bn">
            <input placeholder="Option (en)" [(ngModel)]="opt.en">
          </div>
          <textarea placeholder="Explanation (bn)" rows="2" [(ngModel)]="newQuestion.explBn"></textarea>
          <textarea placeholder="Explanation (en)" rows="2" [(ngModel)]="newQuestion.explEn"></textarea>
          <select [(ngModel)]="newQuestion.difficulty">
            <option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
          </select>
          <button class="primary-btn" [disabled]="!newQuestion.bn || !newQuestion.correct.length" (click)="createQuestion()">{{ i18n.t('save') }}</button>
        </div>

        <div class="form-card" *ngIf="questionChapterId">
          <h4>{{ i18n.isEn ? 'Bulk Import (CSV)' : 'বাল্ক ইমপোর্ট (CSV)' }}</h4>
          <p class="hint">{{ i18n.isEn ? 'Columns: question_bn,question_en,option_a_bn,option_a_en,option_b_bn,option_b_en,option_c_bn,option_c_en,option_d_bn,option_d_en,correct,explanation_bn,explanation_en,difficulty' : 'কলাম: question_bn,question_en,option_a_bn,...,correct,explanation_bn,explanation_en,difficulty' }}</p>
          <input type="file" accept=".csv" (change)="onFileSelected($event)">
          <button class="primary-btn" [disabled]="!selectedFile" (click)="bulkImport()">{{ i18n.isEn ? 'Import' : 'ইমপোর্ট করুন' }}</button>
          <p *ngIf="importResult">{{ importResult }}</p>
        </div>

        <table class="data-table" *ngIf="questionChapterId">
          <thead><tr><th>{{ i18n.isEn ? 'Question' : 'প্রশ্ন' }}</th><th>{{ i18n.isEn ? 'Status' : 'অবস্থা' }}</th><th></th></tr></thead>
          <tbody>
            <tr *ngFor="let q of questions">
              <td>{{ q.question_en }}</td>
              <td><span class="status-badge" [class]="q.status">{{ q.status }}</span></td>
              <td><button class="ghost-btn" *ngIf="q.status !== 'published'" (click)="advanceQuestionStatus(q)">{{ i18n.isEn ? 'Advance' : 'এগিয়ে নিন' }}</button></td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- ===== Users ===== -->
      <div *ngIf="tab === 'users' && isSystemAdmin" class="tab-body">
        <table class="data-table">
          <thead><tr><th>{{ i18n.t('username') }}</th><th>{{ i18n.t('fullName') }}</th><th>{{ i18n.t('role') }}</th><th></th></tr></thead>
          <tbody>
            <tr *ngFor="let u of users">
              <td>{{ u.username }}</td><td>{{ u.full_name }}</td>
              <td>
                <select [(ngModel)]="u.role" (change)="setUserRole(u)">
                  <option value="student">student</option><option value="teacher">teacher</option>
                  <option value="guardian">guardian</option><option value="content_admin">content_admin</option>
                  <option value="system_admin">system_admin</option>
                </select>
              </td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- ===== Audit Log ===== -->
      <div *ngIf="tab === 'audit' && isSystemAdmin" class="tab-body">
        <table class="data-table">
          <thead><tr><th>{{ i18n.isEn ? 'When' : 'কখন' }}</th><th>{{ i18n.isEn ? 'Actor' : 'ব্যবহারকারী' }}</th><th>{{ i18n.isEn ? 'Action' : 'কার্যক্রম' }}</th><th>{{ i18n.isEn ? 'Entity' : 'সত্তা' }}</th></tr></thead>
          <tbody>
            <tr *ngFor="let a of auditLog">
              <td>{{ a.created_at | date:'short' }}</td><td>{{ a.actor }}</td><td>{{ a.action }}</td><td>{{ a.entity_type }} #{{ a.entity_id }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .page { max-width: 1000px; margin: 0 auto; padding: 24px 20px; }
    h2 { color: #1a6d5e; }
    .tabs { display: flex; gap: 6px; margin-bottom: 20px; flex-wrap: wrap; }
    .tab { padding: 8px 14px; border-radius: 8px; border: 1px solid #cfd9dd; background: #fff; font-size: 0.85rem; }
    .tab.active { background: #1a6d5e; color: #fff; border-color: #1a6d5e; }
    .form-card { background: #fff; border: 1px solid #e2e8ec; border-radius: 12px; padding: 16px; margin-bottom: 16px; display: flex; flex-direction: column; gap: 8px; }
    .form-card h4 { margin: 0 0 6px; color: #1a6d5e; }
    .form-row { display: flex; gap: 8px; flex-wrap: wrap; }
    .form-row select, .form-row input, .form-card select, .form-card input, .form-card textarea {
      flex: 1; padding: 8px 10px; border: 1px solid #cfd9dd; border-radius: 6px; font-family: inherit; min-width: 140px;
    }
    .primary-btn { align-self: flex-start; background: linear-gradient(135deg, #1a6d5e, #144f45); color: #fff; border: none; padding: 9px 18px; border-radius: 8px; font-weight: 600; }
    .primary-btn:disabled { opacity: 0.5; }
    .ghost-btn { background: transparent; border: 1px solid #cfd9dd; color: #33454f; padding: 6px 10px; border-radius: 6px; font-size: 0.78rem; }
    .data-table { width: 100%; border-collapse: collapse; background: #fff; margin-bottom: 16px; }
    .data-table th, .data-table td { border: 1px solid #e2e8ec; padding: 8px 10px; font-size: 0.85rem; text-align: left; }
    .status-badge { padding: 3px 8px; border-radius: 999px; font-size: 0.72rem; background: #eef; }
    .status-badge.published { background: #e4f5eb; color: #1a6d5e; }
    .status-badge.draft { background: #f3f3f3; color: #667680; }
    .status-badge.review { background: #fff8ee; color: #a5690c; }
    .hint { font-size: 0.75rem; color: #8a97a0; }
    .option-row { display: flex; align-items: center; gap: 8px; }
    .opt-label { font-weight: 700; color: #1a6d5e; width: 14px; text-transform: uppercase; }
  `],
})
export class AdminComponent implements OnInit {
  private adminService = inject(AdminService);
  private subjectService = inject(SubjectService);
  private auth = inject(AuthService);
  i18n = inject(I18nService);

  tab: 'chapters' | 'questions' | 'users' | 'audit' = 'chapters';
  isSystemAdmin = false;
  classLevels = [6, 7, 8, 9, 10, 11, 12];
  subjects: Subject[] = [];
  chapters: any[] = [];
  users: any[] = [];
  auditLog: any[] = [];

  newChapter = { subjectId: null as number | null, classLevel: 9, titleBn: '', titleEn: '' };
  selectedChapterId: number | null = null;
  newContent = { contentType: 'notes', titleBn: '', titleEn: '', bodyBn: '', bodyEn: '' };

  questionChapterId: number | null = null;
  questions: any[] = [];
  selectedFile: File | null = null;
  importResult = '';

  newQuestion = {
    bn: '', en: '',
    options: [
      { id: 'a', bn: '', en: '' }, { id: 'b', bn: '', en: '' },
      { id: 'c', bn: '', en: '' }, { id: 'd', bn: '', en: '' },
    ],
    correct: [] as string[],
    explBn: '', explEn: '', difficulty: 'medium',
  };

  ngOnInit() {
    this.isSystemAdmin = this.auth.currentUser()?.role === 'system_admin';
    this.subjectService.getSubjects().subscribe(s => { this.subjects = s; if (s.length) this.newChapter.subjectId = s[0].id; });
    this.loadChapters();
    if (this.isSystemAdmin) this.adminService.listUsers().subscribe(u => this.users = u);
  }

  loadChapters() { this.adminService.listChapters().subscribe(c => this.chapters = c); }

  createChapter() {
    if (!this.newChapter.subjectId || !this.newChapter.titleBn || !this.newChapter.titleEn) return;
    this.adminService.createChapter(this.newChapter).subscribe(() => { this.loadChapters(); this.newChapter.titleBn = ''; this.newChapter.titleEn = ''; });
  }

  advanceStatus(c: any) {
    const next = c.status === 'draft' ? 'review' : 'published';
    this.adminService.setChapterStatus(c.id, next).subscribe(() => this.loadChapters());
  }

  createContent() {
    if (!this.selectedChapterId) return;
    this.adminService.createContent({ chapterId: this.selectedChapterId, ...this.newContent }).subscribe(() => {
      this.newContent = { contentType: 'notes', titleBn: '', titleEn: '', bodyBn: '', bodyEn: '' };
      alert(this.i18n.isEn ? 'Content saved as draft — advance its status from the chapter row to publish.' : 'কনটেন্ট খসড়া হিসেবে সংরক্ষিত হয়েছে।');
    });
  }

  loadQuestions() {
    if (!this.questionChapterId) return;
    this.adminService.questionsForChapter(this.questionChapterId).subscribe(q => this.questions = q);
  }

  advanceQuestionStatus(q: any) {
    const next = q.status === 'draft' ? 'review' : 'published';
    this.adminService.setQuestionStatus(q.id, next).subscribe(() => this.loadQuestions());
  }

  toggleCorrect(optId: string) {
    const i = this.newQuestion.correct.indexOf(optId);
    if (i >= 0) this.newQuestion.correct.splice(i, 1);
    else this.newQuestion.correct.push(optId);
  }

  createQuestion() {
    if (!this.questionChapterId || !this.newQuestion.bn || !this.newQuestion.correct.length) return;
    const options = this.newQuestion.options.filter(o => o.bn);
    this.adminService.createQuestion({
      chapterId: this.questionChapterId,
      questionBn: this.newQuestion.bn,
      questionEn: this.newQuestion.en || this.newQuestion.bn,
      options,
      correctAnswers: this.newQuestion.correct,
      questionType: this.newQuestion.correct.length > 1 ? 'multiple' : 'single',
      explanationBn: this.newQuestion.explBn,
      explanationEn: this.newQuestion.explEn,
      difficulty: this.newQuestion.difficulty,
    }).subscribe(() => {
      this.newQuestion = {
        bn: '', en: '',
        options: [{ id: 'a', bn: '', en: '' }, { id: 'b', bn: '', en: '' }, { id: 'c', bn: '', en: '' }, { id: 'd', bn: '', en: '' }],
        correct: [], explBn: '', explEn: '', difficulty: 'medium',
      };
      this.loadQuestions();
      alert(this.i18n.isEn ? 'Question saved as draft — advance its status below to publish.' : 'প্রশ্ন খসড়া হিসেবে সংরক্ষিত হয়েছে — প্রকাশ করতে নিচে স্ট্যাটাস এগিয়ে নিন।');
    });
  }

  onFileSelected(e: Event) {
    const input = e.target as HTMLInputElement;
    this.selectedFile = input.files?.[0] || null;
  }

  bulkImport() {
    if (!this.selectedFile || !this.questionChapterId) return;
    this.adminService.bulkImportQuestions(this.questionChapterId, this.selectedFile).subscribe({
      next: (res) => { this.importResult = `${this.i18n.isEn ? 'Imported' : 'ইমপোর্ট হয়েছে'}: ${res.insertedCount}`; this.loadQuestions(); },
      error: () => { this.importResult = this.i18n.isEn ? 'Import failed' : 'ইমপোর্ট ব্যর্থ হয়েছে'; },
    });
  }

  setUserRole(u: any) {
    this.adminService.setUserRole(u.id, u.role).subscribe();
  }

  loadAudit() {
    this.adminService.auditLog().subscribe(a => this.auditLog = a);
  }
}
