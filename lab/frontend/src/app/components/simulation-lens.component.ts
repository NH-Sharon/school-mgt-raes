import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SimulationService } from '../services/simulation.service';
import { I18nService } from '../services/i18n.service';

interface Trial { u: number; v: number; f: number; }

@Component({
  selector: 'app-simulation-lens',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="lab-shell">
      <div class="lab-header">
        <h2>🔍 {{ i18n.isEn ? 'Convex Lens Focal Length Lab' : 'উত্তল লেন্সের ফোকাস দূরত্ব নির্ণয়' }}</h2>
        <button class="ghost-btn" (click)="finishAndSave()">✅ {{ i18n.isEn ? 'Finish & Save Report' : 'সমাপ্ত করুন ও রিপোর্ট সংরক্ষণ' }}</button>
      </div>

      <div class="layout">
        <div class="bench-stage">
          <svg viewBox="0 0 400 160" class="bench-svg">
            <line x1="10" y1="80" x2="390" y2="80" stroke="#2c3a48" stroke-width="2"/>
            <!-- object -->
            <line [attr.x1]="objX()" y1="80" [attr.x2]="objX()" y2="50" stroke="#e0a23a" stroke-width="3"/>
            <polygon [attr.points]="objArrow()" fill="#e0a23a"/>
            <!-- lens -->
            <ellipse cx="200" cy="80" rx="8" ry="55" fill="rgba(55,194,181,0.25)" stroke="#37c2b5" stroke-width="2"/>
            <!-- screen / image -->
            <line [attr.x1]="screenX()" y1="80" [attr.x2]="screenX()" [attr.y2]="80 - imageHeight()" [attr.stroke]="inFocus() ? '#37c2b5' : '#5b6b71'" stroke-width="3" stroke-dasharray="1"/>
            <rect [attr.x]="screenX()-4" y="20" width="8" height="120" [attr.fill]="inFocus() ? 'rgba(55,194,181,0.15)' : 'rgba(255,255,255,0.05)'" stroke="#5b6b71" stroke-width="1"/>
            <text [attr.x]="objX()" y="105" text-anchor="middle" fill="#9fb0bf" font-size="10">{{ i18n.isEn ? 'Object' : 'বস্তু' }}</text>
            <text x="200" y="145" text-anchor="middle" fill="#9fb0bf" font-size="10">{{ i18n.isEn ? 'Lens' : 'লেন্স' }}</text>
            <text [attr.x]="screenX()" y="145" text-anchor="middle" fill="#9fb0bf" font-size="10">{{ i18n.isEn ? 'Screen' : 'পর্দা' }}</text>
          </svg>
          <p class="focus-hint" [class.ok]="inFocus()">{{ inFocus() ? ('✅ ' + (i18n.isEn ? 'Sharp image!' : 'স্পষ্ট প্রতিবিম্ব!')) : ('🔍 ' + (i18n.isEn ? 'Move the screen to focus' : 'স্পষ্ট করতে পর্দা সরান')) }}</p>

          <div class="controls">
            <label>{{ i18n.isEn ? 'Object distance (u)' : 'বস্তুর দূরত্ব (u)' }}: {{ u }} cm</label>
            <input type="range" min="15" max="60" step="1" [(ngModel)]="u">
            <label>{{ i18n.isEn ? 'Screen distance (v)' : 'পর্দার দূরত্ব (v)' }}: {{ v }} cm</label>
            <input type="range" min="5" max="60" step="1" [(ngModel)]="v">
            <button class="primary-btn" [disabled]="!inFocus()" (click)="recordTrial()">📏 {{ i18n.isEn ? 'Record Reading' : 'পাঠ রেকর্ড করুন' }}</button>
          </div>
        </div>

        <div class="data-panel">
          <h3>{{ i18n.isEn ? 'Observation Table' : 'পর্যবেক্ষণ সারণি' }}</h3>
          <table class="obs-table">
            <thead><tr><th>#</th><th>u (cm)</th><th>v (cm)</th><th>f (cm)</th></tr></thead>
            <tbody>
              <tr *ngFor="let t of trials; let i = index">
                <td>{{ i + 1 }}</td><td>{{ t.u }}</td><td>{{ t.v }}</td><td>{{ t.f.toFixed(1) }}</td>
              </tr>
            </tbody>
          </table>
          <p class="g-estimate" *ngIf="trials.length">{{ i18n.isEn ? 'Average focal length' : 'গড় ফোকাস দূরত্ব' }} ≈ {{ averageF().toFixed(1) }} cm</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .lab-shell { max-width: 1000px; margin: 0 auto; padding: 16px; }
    .lab-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; margin-bottom: 16px; }
    .lab-header h2 { margin: 0; color: #1a6d5e; }
    .ghost-btn { background: transparent; border: 1px solid #cfd9dd; color: #33454f; padding: 8px 14px; border-radius: 8px; }
    .layout { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    @media (max-width: 800px) { .layout { grid-template-columns: 1fr; } }
    .bench-stage { background: #17212c; border-radius: 12px; padding: 20px; display: flex; flex-direction: column; gap: 10px; }
    .bench-svg { width: 100%; height: auto; }
    .focus-hint { text-align: center; font-size: 0.8rem; color: #e0a23a; margin: 0; }
    .focus-hint.ok { color: #37c2b5; }
    .controls { display: flex; flex-direction: column; gap: 4px; color: #e8eef4; margin-top: 8px; }
    .controls label { font-size: 0.82rem; margin-top: 6px; }
    .primary-btn { background: linear-gradient(135deg, #37c2b5, #2a9c92); color: #06231f; border: none; padding: 10px; border-radius: 8px; font-weight: 700; margin-top: 10px; }
    .primary-btn:disabled { opacity: 0.4; }
    .data-panel { background: #fff; border: 1px solid #e2e8ec; border-radius: 12px; padding: 16px; }
    .data-panel h3 { color: #1a6d5e; font-size: 1rem; margin: 0 0 10px; }
    .obs-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
    .obs-table th, .obs-table td { border: 1px solid #e2e8ec; padding: 6px 8px; text-align: center; }
    .g-estimate { text-align: center; font-weight: 600; color: #1a6d5e; margin-top: 12px; }
  `],
})
export class SimulationLensComponent implements OnInit {
  private simulationService = inject(SimulationService);
  private router = inject(Router);
  i18n = inject(I18nService);

  readonly TRUE_F = 12;
  u = 30;
  v = 20;
  trials: Trial[] = [];
  attemptId: number | null = null;

  ngOnInit() {
    this.simulationService.startAttempt('phy-lens', 'guided').subscribe({ next: (a) => this.attemptId = a.id, error: () => {} });
  }

  private correctV(): number {
    // 1/f = 1/v + 1/u (real image convex lens convention used here) => v = (f*u)/(u-f)
    return (this.TRUE_F * this.u) / (this.u - this.TRUE_F);
  }

  inFocus(): boolean {
    return Math.abs(this.v - this.correctV()) < 1.5;
  }

  objX(): number { return 200 - this.u * 3; }
  objArrow(): string {
    const x = this.objX();
    return `${x - 4},54 ${x + 4},54 ${x},46`;
  }
  screenX(): number { return 200 + this.v * 3; }
  imageHeight(): number {
    const mag = this.correctV() / this.u;
    return Math.min(50, 30 * mag);
  }

  recordTrial() {
    if (!this.inFocus()) return;
    const f = 1 / (1 / this.v + 1 / this.u);
    this.trials.push({ u: this.u, v: this.v, f });
    this.logStep();
  }

  averageF(): number {
    return this.trials.reduce((a, t) => a + t.f, 0) / this.trials.length;
  }

  private logStep() {
    if (!this.attemptId) return;
    this.simulationService.updateAttempt(this.attemptId, { steps: this.trials }).subscribe({ error: () => {} });
  }

  finishAndSave() {
    if (!this.attemptId || !this.trials.length) { this.router.navigateByUrl('/subjects'); return; }
    const summary = `${this.i18n.isEn ? 'Average focal length' : 'গড় ফোকাস দূরত্ব'} ≈ ${this.averageF().toFixed(1)} cm (${this.trials.length} ${this.i18n.isEn ? 'trials' : 'বার'})`;
    this.simulationService.completeAttempt(this.attemptId, summary, { trials: this.trials }).subscribe({
      next: () => { alert(this.i18n.isEn ? 'Saved to your dashboard!' : 'আপনার ড্যাশবোর্ডে সংরক্ষিত হয়েছে!'); this.router.navigateByUrl('/dashboard'); },
      error: () => alert(this.i18n.isEn ? 'Could not save — please try again.' : 'সংরক্ষণ করা যায়নি — আবার চেষ্টা করুন।'),
    });
  }
}
