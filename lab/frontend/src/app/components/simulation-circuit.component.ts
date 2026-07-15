import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SimulationService } from '../services/simulation.service';
import { I18nService } from '../services/i18n.service';

interface Trial { voltage: number; resistance: number; current: number; }

@Component({
  selector: 'app-simulation-circuit',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="lab-shell">
      <div class="lab-header">
        <h2>🔌 {{ i18n.isEn ? "Ohm's Law Circuit Lab" : 'ওহমের সূত্র বর্তনী ল্যাব' }}</h2>
        <button class="ghost-btn" (click)="finishAndSave()">✅ {{ i18n.isEn ? 'Finish & Save Report' : 'সমাপ্ত করুন ও রিপোর্ট সংরক্ষণ' }}</button>
      </div>

      <div class="layout">
        <div class="circuit-stage">
          <svg viewBox="0 0 320 200" class="circuit-svg">
            <!-- wire loop -->
            <rect x="30" y="30" width="260" height="140" fill="none" stroke="#9fb0bf" stroke-width="3"/>
            <!-- battery -->
            <rect x="140" y="20" width="40" height="20" fill="#17212c"/>
            <text x="160" y="16" text-anchor="middle" fill="#e8eef4" font-size="11">{{ voltage }}V</text>
            <!-- resistor 1 -->
            <rect [attr.x]="mode==='series' ? 120 : 250" y="70" width="30" height="14" fill="#37c2b5"/>
            <text [attr.x]="mode==='series' ? 135 : 265" y="66" text-anchor="middle" fill="#e8eef4" font-size="10">R1={{ r1 }}Ω</text>
            <!-- resistor 2 -->
            <ng-container *ngIf="mode === 'parallel'">
              <line x1="30" y1="100" x2="290" y2="100" stroke="#9fb0bf" stroke-width="2" stroke-dasharray="3 3"/>
              <rect x="250" y="100" width="30" height="14" fill="#e0a23a"/>
              <text x="265" y="127" text-anchor="middle" fill="#e8eef4" font-size="10">R2={{ r2 }}Ω</text>
            </ng-container>
            <ng-container *ngIf="mode === 'series'">
              <rect x="200" y="70" width="30" height="14" fill="#e0a23a"/>
              <text x="215" y="66" text-anchor="middle" fill="#e8eef4" font-size="10">R2={{ r2 }}Ω</text>
            </ng-container>
            <!-- ammeter -->
            <circle cx="70" cy="170" r="14" fill="#0f1720" stroke="#37c2b5" stroke-width="2"/>
            <text x="70" y="174" text-anchor="middle" fill="#37c2b5" font-size="11" font-weight="700">A</text>
            <!-- voltmeter -->
            <circle cx="160" cy="170" r="14" fill="#0f1720" stroke="#e0a23a" stroke-width="2"/>
            <text x="160" y="174" text-anchor="middle" fill="#e0a23a" font-size="11" font-weight="700">V</text>
          </svg>

          <div class="readouts">
            <div class="readout"><span>{{ i18n.isEn ? 'Current (I)' : 'প্রবাহ (I)' }}</span><b>{{ current().toFixed(3) }} A</b></div>
            <div class="readout"><span>{{ i18n.isEn ? 'Equivalent R' : 'সমতুল্য R' }}</span><b>{{ equivalentR().toFixed(1) }} Ω</b></div>
          </div>

          <div class="controls">
            <div class="mode-row">
              <button class="mode-btn" [class.active]="mode==='series'" (click)="mode='series'">{{ i18n.isEn ? 'Series' : 'সিরিজ' }}</button>
              <button class="mode-btn" [class.active]="mode==='parallel'" (click)="mode='parallel'">{{ i18n.isEn ? 'Parallel' : 'প্যারালাল' }}</button>
            </div>
            <label>{{ i18n.isEn ? 'Voltage (V)' : 'ভোল্টেজ (V)' }}: {{ voltage }} V</label>
            <input type="range" min="1" max="12" step="1" [(ngModel)]="voltage">
            <label>R1: {{ r1 }} Ω</label>
            <input type="range" min="5" max="100" step="5" [(ngModel)]="r1">
            <label>R2: {{ r2 }} Ω</label>
            <input type="range" min="5" max="100" step="5" [(ngModel)]="r2">
            <button class="primary-btn" (click)="recordTrial()">📏 {{ i18n.isEn ? 'Record Reading' : 'পাঠ রেকর্ড করুন' }}</button>
          </div>
        </div>

        <div class="data-panel">
          <h3>{{ i18n.isEn ? 'Observation Table' : 'পর্যবেক্ষণ সারণি' }}</h3>
          <table class="obs-table">
            <thead><tr><th>#</th><th>V</th><th>R (Ω)</th><th>I (A)</th></tr></thead>
            <tbody>
              <tr *ngFor="let t of trials; let i = index">
                <td>{{ i + 1 }}</td><td>{{ t.voltage }}</td><td>{{ t.resistance.toFixed(1) }}</td><td>{{ t.current.toFixed(3) }}</td>
              </tr>
            </tbody>
          </table>
          <div class="chart-wrap" *ngIf="trials.length >= 2">
            <h4>{{ i18n.isEn ? 'V vs I graph' : 'V বনাম I লেখচিত্র' }}</h4>
            <svg viewBox="0 0 220 160" class="chart">
              <line x1="30" y1="10" x2="30" y2="140" stroke="#9fb0bf" stroke-width="1"/>
              <line x1="30" y1="140" x2="210" y2="140" stroke="#9fb0bf" stroke-width="1"/>
              <circle *ngFor="let p of chartPoints()" [attr.cx]="p.x" [attr.cy]="p.y" r="3" fill="#1a6d5e"/>
            </svg>
            <p class="g-estimate">{{ i18n.isEn ? 'Slope (average R from graph)' : 'ঢাল (লেখচিত্র থেকে গড় R)' }} ≈ {{ estimatedR().toFixed(1) }} Ω</p>
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
    .circuit-stage { background: #17212c; border-radius: 12px; padding: 20px; display: flex; flex-direction: column; gap: 14px; }
    .circuit-svg { width: 100%; height: auto; }
    .readouts { display: flex; gap: 16px; }
    .readout { flex: 1; background: #1e2b38; border-radius: 8px; padding: 10px; text-align: center; }
    .readout span { display: block; font-size: 0.72rem; color: #9fb0bf; }
    .readout b { color: #37c2b5; font-size: 1.1rem; }
    .controls { display: flex; flex-direction: column; gap: 6px; color: #e8eef4; }
    .controls label { font-size: 0.82rem; margin-top: 4px; }
    .mode-row { display: flex; gap: 6px; margin-bottom: 4px; }
    .mode-btn { flex: 1; padding: 7px; border-radius: 8px; border: 1px solid #2c3a48; background: #1e2b38; color: #e8eef4; font-size: 0.82rem; }
    .mode-btn.active { background: #37c2b5; color: #06231f; border-color: #37c2b5; }
    .primary-btn { background: linear-gradient(135deg, #37c2b5, #2a9c92); color: #06231f; border: none; padding: 10px; border-radius: 8px; font-weight: 700; margin-top: 8px; }
    .data-panel { background: #fff; border: 1px solid #e2e8ec; border-radius: 12px; padding: 16px; }
    .data-panel h3 { color: #1a6d5e; font-size: 1rem; margin: 0 0 10px; }
    .obs-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
    .obs-table th, .obs-table td { border: 1px solid #e2e8ec; padding: 6px 8px; text-align: center; }
    .chart-wrap { margin-top: 16px; }
    .chart { width: 100%; height: 160px; }
    .g-estimate { text-align: center; font-weight: 600; color: #1a6d5e; margin-top: 8px; }
  `],
})
export class SimulationCircuitComponent implements OnInit {
  private simulationService = inject(SimulationService);
  private router = inject(Router);
  i18n = inject(I18nService);

  mode: 'series' | 'parallel' = 'series';
  voltage = 6;
  r1 = 20;
  r2 = 30;
  trials: Trial[] = [];
  attemptId: number | null = null;

  ngOnInit() {
    this.simulationService.startAttempt('phy-circuit', 'free').subscribe({ next: (a) => this.attemptId = a.id, error: () => {} });
  }

  equivalentR(): number {
    return this.mode === 'series' ? this.r1 + this.r2 : (this.r1 * this.r2) / (this.r1 + this.r2);
  }

  current(): number {
    return this.voltage / this.equivalentR();
  }

  recordTrial() {
    this.trials.push({ voltage: this.voltage, resistance: this.equivalentR(), current: this.current() });
    this.logStep();
  }

  chartPoints() {
    if (this.trials.length < 2) return [];
    const maxV = Math.max(...this.trials.map(t => t.voltage));
    const maxI = Math.max(...this.trials.map(t => t.current));
    return this.trials.map(t => ({ x: 30 + (t.voltage / maxV) * 170, y: 140 - (t.current / maxI) * 120 }));
  }

  estimatedR(): number {
    if (!this.trials.length) return 0;
    const avg = this.trials.reduce((a, t) => a + t.resistance, 0) / this.trials.length;
    return avg;
  }

  private logStep() {
    if (!this.attemptId) return;
    this.simulationService.updateAttempt(this.attemptId, { steps: this.trials }).subscribe({ error: () => {} });
  }

  finishAndSave() {
    if (!this.attemptId || !this.trials.length) { this.router.navigateByUrl('/subjects'); return; }
    const summary = `${this.i18n.isEn ? 'Verified' : 'যাচাই করা হয়েছে'}: R ≈ ${this.estimatedR().toFixed(1)} Ω (${this.trials.length} ${this.i18n.isEn ? 'trials' : 'বার'})`;
    this.simulationService.completeAttempt(this.attemptId, summary, { trials: this.trials }).subscribe({
      next: () => { alert(this.i18n.isEn ? 'Saved to your dashboard!' : 'আপনার ড্যাশবোর্ডে সংরক্ষিত হয়েছে!'); this.router.navigateByUrl('/dashboard'); },
      error: () => alert(this.i18n.isEn ? 'Could not save — please try again.' : 'সংরক্ষণ করা যায়নি — আবার চেষ্টা করুন।'),
    });
  }
}
