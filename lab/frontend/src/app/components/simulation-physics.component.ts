import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SimulationService } from '../services/simulation.service';
import { I18nService } from '../services/i18n.service';

interface Trial { length: number; period: number; periodSquared: number; }

@Component({
  selector: 'app-simulation-physics',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="lab-shell">
      <div class="lab-header">
        <h2>🔭 {{ i18n.isEn ? 'Simple Pendulum Lab' : 'সরল দোলক পরীক্ষাগার' }}</h2>
        <button class="ghost-btn" (click)="finishAndSave()">✅ {{ i18n.isEn ? 'Finish & Save Report' : 'সমাপ্ত করুন ও রিপোর্ট সংরক্ষণ' }}</button>
      </div>

      <div class="layout">
        <div class="pendulum-stage">
          <div class="rig">
            <div class="pivot"></div>
            <div class="string" [style.height.px]="lengthM * 140" [class.swinging]="swinging" [style.animation-duration.s]="theoreticalPeriod"></div>
            <div class="bob" [style.top.px]="lengthM * 140 + 8"></div>
          </div>
          <div class="controls">
            <label>{{ i18n.isEn ? 'Length (L)' : 'দৈর্ঘ্য (L)' }}: {{ lengthM.toFixed(2) }} m</label>
            <input type="range" min="0.2" max="1.5" step="0.05" [(ngModel)]="lengthM" [disabled]="swinging">
            <button class="primary-btn" (click)="release()" [disabled]="swinging">▶️ {{ i18n.isEn ? 'Release & Measure' : 'ছেড়ে দিন ও পরিমাপ করুন' }}</button>
          </div>
        </div>

        <div class="data-panel">
          <h3>{{ i18n.isEn ? 'Observation Table' : 'পর্যবেক্ষণ সারণি' }}</h3>
          <table class="obs-table">
            <thead><tr><th>#</th><th>L (m)</th><th>T (s)</th><th>T² (s²)</th></tr></thead>
            <tbody>
              <tr *ngFor="let t of trials; let i = index">
                <td>{{ i + 1 }}</td><td>{{ t.length.toFixed(2) }}</td><td>{{ t.period.toFixed(3) }}</td><td>{{ t.periodSquared.toFixed(3) }}</td>
              </tr>
            </tbody>
          </table>

          <div class="chart-wrap" *ngIf="trials.length >= 2">
            <h4>{{ i18n.isEn ? 'T² vs L graph' : 'T² বনাম L লেখচিত্র' }}</h4>
            <svg viewBox="0 0 220 160" class="chart">
              <line x1="30" y1="10" x2="30" y2="140" stroke="#9fb0bf" stroke-width="1"/>
              <line x1="30" y1="140" x2="210" y2="140" stroke="#9fb0bf" stroke-width="1"/>
              <circle *ngFor="let p of chartPoints()" [attr.cx]="p.x" [attr.cy]="p.y" r="3" fill="#1a6d5e"/>
              <line *ngIf="fitLine() as f" [attr.x1]="f.x1" [attr.y1]="f.y1" [attr.x2]="f.x2" [attr.y2]="f.y2" stroke="#e0a23a" stroke-width="1.5" stroke-dasharray="4 2"/>
            </svg>
            <p class="g-estimate">g ≈ {{ estimatedG() | number:'1.2-2' }} m/s² ({{ i18n.isEn ? 'standard value' : 'প্রমিত মান' }}: 9.8 m/s²)</p>
          </div>
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
    .pendulum-stage { background: #17212c; border-radius: 12px; padding: 20px; display: flex; flex-direction: column; align-items: center; gap: 16px; }
    .rig { position: relative; height: 220px; width: 100%; display: flex; justify-content: center; }
    .pivot { width: 40px; height: 8px; background: #6b7d8c; border-radius: 3px; }
    .string { position: absolute; top: 8px; width: 2px; background: #9fb0bf; transform-origin: top center; }
    .string.swinging { animation-name: swing; animation-timing-function: ease-in-out; animation-iteration-count: 3; }
    @keyframes swing { 0%, 100% { transform: rotate(-18deg); } 50% { transform: rotate(18deg); } }
    .bob { position: absolute; width: 22px; height: 22px; border-radius: 50%; background: #37c2b5; left: calc(50% - 11px); }
    .controls { width: 100%; color: #e8eef4; display: flex; flex-direction: column; gap: 8px; }
    .controls label { font-size: 0.85rem; }
    .primary-btn { background: linear-gradient(135deg, #37c2b5, #2a9c92); color: #06231f; border: none; padding: 10px; border-radius: 8px; font-weight: 700; }
    .data-panel { background: #fff; border: 1px solid #e2e8ec; border-radius: 12px; padding: 16px; }
    .data-panel h3 { color: #1a6d5e; font-size: 1rem; margin: 0 0 10px; }
    .obs-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
    .obs-table th, .obs-table td { border: 1px solid #e2e8ec; padding: 6px 8px; text-align: center; }
    .chart-wrap { margin-top: 16px; }
    .chart { width: 100%; height: 160px; }
    .g-estimate { text-align: center; font-weight: 600; color: #1a6d5e; margin-top: 8px; }
  `],
})
export class SimulationPhysicsComponent implements OnInit {
  private simulationService = inject(SimulationService);
  private router = inject(Router);
  i18n = inject(I18nService);

  lengthM = 0.5;
  swinging = false;
  trials: Trial[] = [];
  attemptId: number | null = null;
  hintsUsed = 0;

  readonly G_ACTUAL = 9.8;

  get theoreticalPeriod(): number {
    return 2 * Math.PI * Math.sqrt(this.lengthM / this.G_ACTUAL);
  }

  ngOnInit() {
    this.simulationService.startAttempt('phy-pendulum', 'free').subscribe({ next: (a) => this.attemptId = a.id, error: () => {} });
  }

  release() {
    this.swinging = true;
    const noise = 1 + (Math.random() * 0.04 - 0.02);
    const measuredT = this.theoreticalPeriod * noise;
    setTimeout(() => {
      this.swinging = false;
      this.trials.push({ length: this.lengthM, period: measuredT, periodSquared: measuredT * measuredT });
      this.logStep();
    }, this.theoreticalPeriod * 1000 * 3);
  }

  chartPoints() {
    if (this.trials.length < 2) return [];
    const maxL = Math.max(...this.trials.map(t => t.length));
    const maxT2 = Math.max(...this.trials.map(t => t.periodSquared));
    return this.trials.map(t => ({
      x: 30 + (t.length / maxL) * 170,
      y: 140 - (t.periodSquared / maxT2) * 120,
    }));
  }

  private linearFit(): { slope: number; intercept: number } | null {
    if (this.trials.length < 2) return null;
    const n = this.trials.length;
    const sumX = this.trials.reduce((a, t) => a + t.length, 0);
    const sumY = this.trials.reduce((a, t) => a + t.periodSquared, 0);
    const sumXY = this.trials.reduce((a, t) => a + t.length * t.periodSquared, 0);
    const sumXX = this.trials.reduce((a, t) => a + t.length * t.length, 0);
    const denom = n * sumXX - sumX * sumX;
    if (denom === 0) return null;
    const slope = (n * sumXY - sumX * sumY) / denom;
    const intercept = (sumY - slope * sumX) / n;
    return { slope, intercept };
  }

  fitLine() {
    const fit = this.linearFit();
    if (!fit || this.trials.length < 2) return null;
    const maxL = Math.max(...this.trials.map(t => t.length));
    const maxT2 = Math.max(...this.trials.map(t => t.periodSquared));
    const y0 = fit.intercept;
    const y1 = fit.slope * maxL + fit.intercept;
    return {
      x1: 30, y1: 140 - (y0 / maxT2) * 120,
      x2: 30 + 170, y2: 140 - (y1 / maxT2) * 120,
    };
  }

  estimatedG(): number {
    const fit = this.linearFit();
    if (!fit || fit.slope <= 0) return 0;
    return (4 * Math.PI * Math.PI) / fit.slope;
  }

  private logStep() {
    if (!this.attemptId) return;
    this.simulationService.updateAttempt(this.attemptId, { steps: this.trials, hintsUsed: this.hintsUsed }).subscribe({ error: () => {} });
  }

  finishAndSave() {
    if (!this.attemptId || this.trials.length === 0) { this.router.navigateByUrl('/subjects'); return; }
    const summary = `g ≈ ${this.estimatedG().toFixed(2)} m/s² (${this.trials.length} trials)`;
    this.simulationService.completeAttempt(this.attemptId, summary, { trials: this.trials }).subscribe({
      next: () => { alert(this.i18n.isEn ? 'Saved to your dashboard!' : 'আপনার ড্যাশবোর্ডে সংরক্ষিত হয়েছে!'); this.router.navigateByUrl('/dashboard'); },
      error: () => alert(this.i18n.isEn ? 'Could not save — please try again.' : 'সংরক্ষণ করা যায়নি — আবার চেষ্টা করুন।'),
    });
  }
}
