import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SimulationService } from '../services/simulation.service';
import { I18nService } from '../services/i18n.service';

@Component({
  selector: 'app-simulation-biology',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="lab-shell">
      <div class="lab-header">
        <h2>🧬 {{ i18n.isEn ? 'Virtual Microscope' : 'ভার্চুয়াল অণুবীক্ষণ যন্ত্র' }}</h2>
        <button class="ghost-btn" (click)="finishAndSave()">✅ {{ i18n.isEn ? 'Finish & Save Report' : 'সমাপ্ত করুন ও রিপোর্ট সংরক্ষণ' }}</button>
      </div>

      <div class="layout">
        <div class="scope-stage">
          <div class="eyepiece">
            <svg viewBox="0 0 200 200" class="slide-view" [style.filter]="'blur(' + blurPx() + 'px)'">
              <rect width="200" height="200" fill="#eef7ee"/>
              <g *ngFor="let cell of cellsForMagnification()">
                <polygon [attr.points]="cell.points" fill="#d7f0d7" stroke="#4a8a4a" stroke-width="2"/>
                <circle [attr.cx]="cell.nx" [attr.cy]="cell.ny" [attr.r]="cell.nr" fill="#7a4fae" opacity="0.8"/>
              </g>
            </svg>
            <p class="focus-hint" *ngIf="!inFocus()">🔍 {{ i18n.isEn ? 'Adjust focus for a clear image' : 'পরিষ্কার ছবির জন্য ফোকাস ঠিক করুন' }}</p>
          </div>
          <div class="controls">
            <label>{{ i18n.isEn ? 'Focus' : 'ফোকাস' }}</label>
            <input type="range" min="0" max="100" [(ngModel)]="focus">
            <label>{{ i18n.isEn ? 'Magnification' : 'ম্যাগনিফিকেশন' }}</label>
            <div class="mag-row">
              <button *ngFor="let m of magnifications" class="mag-btn" [class.active]="magnification===m" (click)="magnification = m">{{ m }}x</button>
            </div>
          </div>
        </div>

        <div class="data-panel">
          <h3>{{ i18n.isEn ? 'Slide: Onion Peel' : 'স্লাইড: পেঁয়াজের ছাল' }}</h3>
          <p class="desc" *ngIf="inFocus()">{{ magnification >= 400 ? (i18n.isEn ? 'At high magnification, individual cell walls and a clearly stained, dark nucleus are visible within each cell.' : 'উচ্চ ম্যাগনিফিকেশনে প্রতিটি কোষে স্পষ্ট কোষপ্রাচীর এবং রঞ্জিত নিউক্লিয়াস দেখা যাচ্ছে।') : (i18n.isEn ? 'A brick-like arrangement of rectangular plant cells is visible, each bounded by a cell wall.' : 'ইটের মতো সাজানো আয়তক্ষেত্রাকার উদ্ভিদ কোষ দেখা যাচ্ছে, প্রতিটি কোষপ্রাচীর দ্বারা আবদ্ধ।') }}</p>
          <p class="desc muted" *ngIf="!inFocus()">{{ i18n.isEn ? 'Image is out of focus.' : 'ছবি ফোকাসের বাইরে রয়েছে।' }}</p>

          <label>{{ i18n.isEn ? 'Your observation' : 'আপনার পর্যবেক্ষণ' }}</label>
          <textarea [(ngModel)]="observationNote" rows="4" (blur)="logStep()"></textarea>
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
    .scope-stage { background: #17212c; border-radius: 12px; padding: 20px; display: flex; flex-direction: column; align-items: center; gap: 16px; }
    .eyepiece { width: 220px; height: 220px; border-radius: 50%; border: 8px solid #3a4750; overflow: hidden; position: relative; background: #000; }
    .slide-view { width: 100%; height: 100%; transition: filter 0.3s; }
    .focus-hint { position: absolute; bottom: 8px; left: 0; right: 0; text-align: center; color: #e0a23a; font-size: 0.75rem; margin: 0; }
    .controls { width: 100%; color: #e8eef4; display: flex; flex-direction: column; gap: 6px; }
    .controls label { font-size: 0.85rem; }
    .mag-row { display: flex; gap: 6px; }
    .mag-btn { padding: 6px 12px; border-radius: 8px; border: 1px solid #2c3a48; background: #1e2b38; color: #e8eef4; font-size: 0.8rem; }
    .mag-btn.active { background: #37c2b5; color: #06231f; border-color: #37c2b5; }
    .data-panel { background: #fff; border: 1px solid #e2e8ec; border-radius: 12px; padding: 16px; }
    .data-panel h3 { color: #1a6d5e; font-size: 1rem; margin: 0 0 10px; }
    .desc { font-size: 0.88rem; line-height: 1.6; color: #33454f; }
    .desc.muted { color: #9aa7ae; font-style: italic; }
    textarea { width: 100%; border: 1px solid #cfd9dd; border-radius: 8px; padding: 10px; font-family: inherit; margin-top: 4px; }
  `],
})
export class SimulationBiologyComponent implements OnInit {
  private simulationService = inject(SimulationService);
  private router = inject(Router);
  i18n = inject(I18nService);

  focus = 20;
  magnification = 100;
  magnifications = [40, 100, 400];
  observationNote = '';
  attemptId: number | null = null;

  ngOnInit() {
    this.simulationService.startAttempt('bio-microscope', 'guided').subscribe({ next: (a) => this.attemptId = a.id, error: () => {} });
  }

  inFocus(): boolean { return this.focus >= 55 && this.focus <= 85; }
  blurPx(): number { return this.inFocus() ? 0 : Math.abs(70 - this.focus) / 8; }

  cellsForMagnification(): { points: string; nx: number; ny: number; nr: number }[] {
    const cols = this.magnification >= 400 ? 2 : this.magnification >= 100 ? 4 : 6;
    const rows = cols;
    const w = 200 / cols, h = 200 / rows;
    const cells = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = c * w, y = r * h;
        cells.push({
          points: `${x + 2},${y + 2} ${x + w - 2},${y + 2} ${x + w - 2},${y + h - 2} ${x + 2},${y + h - 2}`,
          nx: x + w / 2, ny: y + h / 2, nr: Math.min(w, h) * 0.18,
        });
      }
    }
    return cells;
  }

  logStep() {
    if (!this.attemptId) return;
    this.simulationService.updateAttempt(this.attemptId, { steps: [{ focus: this.focus, magnification: this.magnification, note: this.observationNote }] }).subscribe({ error: () => {} });
  }

  finishAndSave() {
    if (!this.attemptId) { this.router.navigateByUrl('/subjects'); return; }
    const summary = this.observationNote || (this.i18n.isEn ? 'Onion peel slide observed' : 'পেঁয়াজের ছালের স্লাইড পর্যবেক্ষণ করা হয়েছে');
    this.simulationService.completeAttempt(this.attemptId, summary, { note: this.observationNote, magnification: this.magnification }).subscribe({
      next: () => { alert(this.i18n.isEn ? 'Saved to your dashboard!' : 'আপনার ড্যাশবোর্ডে সংরক্ষিত হয়েছে!'); this.router.navigateByUrl('/dashboard'); },
      error: () => alert(this.i18n.isEn ? 'Could not save — please try again.' : 'সংরক্ষণ করা যায়নি — আবার চেষ্টা করুন।'),
    });
  }
}
