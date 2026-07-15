import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SimulationService } from '../services/simulation.service';
import { I18nService } from '../services/i18n.service';

const STARTER_HTML = '<h1>Hello!</h1>\n<p>Edit the HTML and CSS on the left — the preview updates as you type.</p>\n<button>Click me</button>';
const STARTER_CSS = 'body { font-family: sans-serif; padding: 20px; }\nh1 { color: teal; }\nbutton { background: teal; color: white; border: none; padding: 8px 16px; border-radius: 6px; }';

@Component({
  selector: 'app-simulation-html-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="lab-shell">
      <div class="lab-header">
        <h2>💻 {{ i18n.isEn ? 'Live HTML/CSS Editor' : 'লাইভ HTML/CSS এডিটর' }}</h2>
        <button class="ghost-btn" (click)="finishAndSave()">✅ {{ i18n.isEn ? 'Finish & Save Report' : 'সমাপ্ত করুন ও রিপোর্ট সংরক্ষণ' }}</button>
      </div>

      <div class="challenge-row">
        <span class="challenge-label">{{ i18n.isEn ? 'Try:' : 'চেষ্টা করুন:' }}</span>
        <button class="chip" *ngFor="let c of challenges" (click)="applyChallenge(c)">{{ i18n.isEn ? c.en : c.bn }}</button>
      </div>

      <div class="editor-layout">
        <div class="pane">
          <label>HTML</label>
          <textarea [(ngModel)]="html" (ngModelChange)="onEdit()" spellcheck="false"></textarea>
        </div>
        <div class="pane">
          <label>CSS</label>
          <textarea [(ngModel)]="css" (ngModelChange)="onEdit()" spellcheck="false"></textarea>
        </div>
        <div class="pane preview-pane">
          <label>{{ i18n.isEn ? 'Preview' : 'প্রিভিউ' }}</label>
          <iframe [srcdoc]="previewDoc()" sandbox="allow-same-origin"></iframe>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .lab-shell { max-width: 1200px; margin: 0 auto; padding: 16px; }
    .lab-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; margin-bottom: 12px; }
    .lab-header h2 { margin: 0; color: #1a6d5e; }
    .ghost-btn { background: transparent; border: 1px solid #cfd9dd; color: #33454f; padding: 8px 14px; border-radius: 8px; }
    .challenge-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 14px; }
    .challenge-label { font-size: 0.82rem; color: #667680; }
    .chip { background: #eef6f4; border: 1px solid #cfe3dd; color: #1a6d5e; padding: 6px 12px; border-radius: 999px; font-size: 0.78rem; }
    .editor-layout { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; height: 460px; }
    @media (max-width: 900px) { .editor-layout { grid-template-columns: 1fr; height: auto; } .pane { height: 220px; } }
    .pane { display: flex; flex-direction: column; gap: 4px; }
    .pane label { font-size: 0.75rem; font-weight: 700; color: #8a97a0; text-transform: uppercase; letter-spacing: 0.04em; }
    .pane textarea {
      flex: 1; font-family: ui-monospace, "SF Mono", Menlo, monospace; font-size: 0.82rem; padding: 10px;
      border: 1px solid #2c3a48; border-radius: 8px; background: #17212c; color: #e8eef4; resize: none;
    }
    .preview-pane iframe { flex: 1; border: 1px solid #e2e8ec; border-radius: 8px; background: #fff; }
  `],
})
export class SimulationHtmlEditorComponent implements OnInit {
  private simulationService = inject(SimulationService);
  private router = inject(Router);
  i18n = inject(I18nService);

  html = STARTER_HTML;
  css = STARTER_CSS;
  attemptId: number | null = null;
  private editCount = 0;
  private saveTimer: any;

  challenges = [
    { bn: 'হেডিং যোগ করুন', en: 'Add a heading', html: '<h2>New Heading</h2>', css: '' },
    { bn: 'রঙ বদলান', en: 'Change the color', html: STARTER_HTML, css: 'h1 { color: crimson; }' },
    { bn: 'একটি তালিকা যোগ করুন', en: 'Add a list', html: '<ul>\n  <li>First item</li>\n  <li>Second item</li>\n</ul>', css: '' },
  ];

  ngOnInit() {
    this.simulationService.startAttempt('ict-html-editor', 'free').subscribe({ next: (a) => this.attemptId = a.id, error: () => {} });
  }

  previewDoc(): string {
    return `<!doctype html><html><head><style>${this.css}</style></head><body>${this.html}</body></html>`;
  }

  applyChallenge(c: { html: string; css: string }) {
    this.html = c.html;
    if (c.css) this.css = c.css;
    this.onEdit();
  }

  onEdit() {
    this.editCount++;
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => this.logStep(), 800);
  }

  private logStep() {
    if (!this.attemptId) return;
    this.simulationService.updateAttempt(this.attemptId, {
      steps: [{ editCount: this.editCount }],
      observationData: { html: this.html, css: this.css },
    }).subscribe({ error: () => {} });
  }

  finishAndSave() {
    if (!this.attemptId) { this.router.navigateByUrl('/subjects'); return; }
    const summary = this.i18n.isEn ? `Made ${this.editCount} edits to the page` : `পেজে ${this.editCount}টি সম্পাদনা করা হয়েছে`;
    this.simulationService.completeAttempt(this.attemptId, summary, { html: this.html, css: this.css }).subscribe({
      next: () => { alert(this.i18n.isEn ? 'Saved to your dashboard!' : 'আপনার ড্যাশবোর্ডে সংরক্ষিত হয়েছে!'); this.router.navigateByUrl('/dashboard'); },
      error: () => alert(this.i18n.isEn ? 'Could not save — please try again.' : 'সংরক্ষণ করা যায়নি — আবার চেষ্টা করুন।'),
    });
  }
}
