import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SimulationService } from '../services/simulation.service';
import { I18nService } from '../services/i18n.service';

interface Trial { distanceCm: number; bubblesPerMin: number; }

@Component({
  selector: 'app-simulation-photosynthesis',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="lab-shell">
      <div class="lab-header">
        <h2>🌿 {{ i18n.isEn ? 'Effect of Light on Photosynthesis' : 'সালোকসংশ্লেষণে আলোর প্রভাব' }}</h2>
        <button class="ghost-btn" (click)="finishAndSave()">✅ {{ i18n.isEn ? 'Finish & Save Report' : 'সমাপ্ত করুন ও রিপোর্ট সংরক্ষণ' }}</button>
      </div>
      <p class="setup-note">{{ i18n.isEn ? 'A sprig of Hydrilla (pondweed) underwater releases oxygen bubbles when photosynthesizing — the rate depends on light intensity, which falls off with distance.' : 'পানির নিচে হাইড্রিলা (জলজ উদ্ভিদ) সালোকসংশ্লেষণের সময় অক্সিজেন বুদবুদ নির্গত করে — এর হার আলোর তীব্রতার উপর নির্ভর করে, যা দূরত্বের সাথে কমে যায়।' }}</p>

      <div class="layout">
        <div class="tank-stage">
          <svg viewBox="0 0 260 200" class="tank-svg">
            <rect x="10" y="10" width="240" height="180" fill="rgba(80,150,200,0.08)" stroke="#3a5a6a" stroke-width="2"/>
            <!-- light bulb -->
            <circle [attr.cx]="bulbX()" cy="30" r="12" fill="#ffe066" [style.opacity]="lightOpacity()"/>
            <line *ngFor="let r of rays()" [attr.x1]="bulbX()" y1="30" [attr.x2]="bulbX() + r.dx" [attr.y2]="30 + r.dy" stroke="#ffe066" stroke-width="1" [style.opacity]="lightOpacity() * 0.6"/>
            <!-- plant -->
            <line x1="130" y1="180" x2="130" y2="90" stroke="#2e7d32" stroke-width="4"/>
            <ellipse *ngFor="let l of leaves" [attr.cx]="130 + l.dx" [attr.cy]="l.y" rx="10" ry="5" fill="#4caf50" [attr.transform]="'rotate(' + l.rot + ' ' + (130+l.dx) + ' ' + l.y + ')'"/>
            <!-- bubbles -->
            <circle *ngFor="let b of bubbles" [attr.cx]="b.x" [attr.cy]="b.y" r="3" fill="rgba(255,255,255,0.7)"/>
          </svg>
          <p class="bubble-readout">{{ i18n.isEn ? 'Bubble rate' : 'বুদবুদের হার' }}: <b>{{ currentBubbleRate().toFixed(1) }}</b> {{ i18n.isEn ? 'per minute' : 'প্রতি মিনিটে' }}</p>

          <div class="controls">
            <label>{{ i18n.isEn ? 'Light distance' : 'আলোর দূরত্ব' }}: {{ distanceCm }} cm</label>
            <input type="range" min="5" max="100" step="5" [(ngModel)]="distanceCm">
            <button class="primary-btn" (click)="recordTrial()">📏 {{ i18n.isEn ? 'Record Reading' : 'পাঠ রেকর্ড করুন' }}</button>
          </div>
        </div>

        <div class="data-panel">
          <h3>{{ i18n.isEn ? 'Observation Table' : 'পর্যবেক্ষণ সারণি' }}</h3>
          <table class="obs-table">
            <thead><tr><th>#</th><th>{{ i18n.isEn ? 'Distance (cm)' : 'দূরত্ব (cm)' }}</th><th>{{ i18n.isEn ? 'Bubbles/min' : 'বুদবুদ/মিনিট' }}</th></tr></thead>
            <tbody>
              <tr *ngFor="let t of trials; let i = index">
                <td>{{ i + 1 }}</td><td>{{ t.distanceCm }}</td><td>{{ t.bubblesPerMin.toFixed(1) }}</td>
              </tr>
            </tbody>
          </table>
          <div class="chart-wrap" *ngIf="trials.length >= 2">
            <h4>{{ i18n.isEn ? 'Rate vs Distance' : 'হার বনাম দূরত্ব' }}</h4>
            <svg viewBox="0 0 220 160" class="chart">
              <line x1="30" y1="10" x2="30" y2="140" stroke="#cfd9dd" stroke-width="1"/>
              <line x1="30" y1="140" x2="210" y2="140" stroke="#cfd9dd" stroke-width="1"/>
              <polyline [attr.points]="chartLine()" fill="none" stroke="#1a6d5e" stroke-width="2"/>
              <circle *ngFor="let p of chartPoints()" [attr.cx]="p.x" [attr.cy]="p.y" r="3" fill="#1a6d5e"/>
            </svg>
            <p class="conclusion">{{ i18n.isEn ? 'As distance increases, light intensity — and bubble rate — decreases.' : 'দূরত্ব বাড়ার সাথে সাথে আলোর তীব্রতা এবং বুদবুদের হার কমে যায়।' }}</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .lab-shell { max-width: 1000px; margin: 0 auto; padding: 16px; }
    .lab-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; margin-bottom: 8px; }
    .lab-header h2 { margin: 0; color: #1a6d5e; }
    .setup-note { font-size: 0.85rem; color: #667680; margin: 0 0 16px; }
    .ghost-btn { background: transparent; border: 1px solid #cfd9dd; color: #33454f; padding: 8px 14px; border-radius: 8px; }
    .layout { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    @media (max-width: 800px) { .layout { grid-template-columns: 1fr; } }
    .tank-stage { background: #17212c; border-radius: 12px; padding: 20px; display: flex; flex-direction: column; gap: 10px; align-items: center; }
    .tank-svg { width: 100%; height: auto; max-width: 300px; }
    .bubble-readout { color: #e8eef4; font-size: 0.9rem; margin: 0; }
    .controls { width: 100%; display: flex; flex-direction: column; gap: 6px; color: #e8eef4; }
    .controls label { font-size: 0.82rem; }
    .primary-btn { background: linear-gradient(135deg, #37c2b5, #2a9c92); color: #06231f; border: none; padding: 10px; border-radius: 8px; font-weight: 700; margin-top: 8px; }
    .data-panel { background: #fff; border: 1px solid #e2e8ec; border-radius: 12px; padding: 16px; }
    .data-panel h3 { color: #1a6d5e; font-size: 1rem; margin: 0 0 10px; }
    .obs-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
    .obs-table th, .obs-table td { border: 1px solid #e2e8ec; padding: 6px 8px; text-align: center; }
    .chart-wrap { margin-top: 16px; }
    .chart { width: 100%; height: 160px; }
    .conclusion { font-size: 0.82rem; color: #55666f; text-align: center; margin-top: 8px; }
  `],
})
export class SimulationPhotosynthesisComponent implements OnInit {
  private simulationService = inject(SimulationService);
  private router = inject(Router);
  i18n = inject(I18nService);

  distanceCm = 20;
  trials: Trial[] = [];
  attemptId: number | null = null;

  leaves = [
    { dx: -8, y: 150, rot: -30 }, { dx: 8, y: 140, rot: 30 },
    { dx: -8, y: 120, rot: -30 }, { dx: 8, y: 110, rot: 30 },
    { dx: -8, y: 95, rot: -30 },
  ];
  bubbles = Array.from({ length: 6 }, (_, i) => ({ x: 130 + (i % 2 === 0 ? -6 : 6), y: 170 - i * 20 }));

  ngOnInit() {
    this.simulationService.startAttempt('bio-photosynthesis', 'guided').subscribe({ next: (a) => this.attemptId = a.id, error: () => {} });
  }

  bulbX(): number { return 30 + Math.min(180, this.distanceCm * 1.8); }
  lightOpacity(): number { return Math.max(0.15, 1 - this.distanceCm / 110); }
  rays() {
    return [0, 45, 90, 135, 180, 225, 270, 315].map(deg => ({
      dx: 18 * Math.cos((deg * Math.PI) / 180), dy: 18 * Math.sin((deg * Math.PI) / 180),
    }));
  }

  currentBubbleRate(): number {
    // inverse-square-ish falloff, capped by light saturation
    const raw = 4000 / (this.distanceCm * this.distanceCm);
    return Math.min(30, raw);
  }

  recordTrial() {
    this.trials.push({ distanceCm: this.distanceCm, bubblesPerMin: this.currentBubbleRate() });
    this.logStep();
  }

  chartPoints() {
    if (this.trials.length < 2) return [];
    const sorted = [...this.trials].sort((a, b) => a.distanceCm - b.distanceCm);
    const maxD = Math.max(...sorted.map(t => t.distanceCm));
    const maxR = Math.max(...sorted.map(t => t.bubblesPerMin));
    return sorted.map(t => ({ x: 30 + (t.distanceCm / maxD) * 170, y: 140 - (t.bubblesPerMin / maxR) * 120 }));
  }

  chartLine(): string {
    return this.chartPoints().map(p => `${p.x},${p.y}`).join(' ');
  }

  private logStep() {
    if (!this.attemptId) return;
    this.simulationService.updateAttempt(this.attemptId, { steps: this.trials }).subscribe({ error: () => {} });
  }

  finishAndSave() {
    if (!this.attemptId || !this.trials.length) { this.router.navigateByUrl('/subjects'); return; }
    const summary = this.i18n.isEn
      ? `Observed ${this.trials.length} trials — bubble rate decreases with distance`
      : `${this.trials.length}টি পাঠ পর্যবেক্ষণ করা হয়েছে — দূরত্ব বাড়ার সাথে বুদবুদের হার কমেছে`;
    this.simulationService.completeAttempt(this.attemptId, summary, { trials: this.trials }).subscribe({
      next: () => { alert(this.i18n.isEn ? 'Saved to your dashboard!' : 'আপনার ড্যাশবোর্ডে সংরক্ষিত হয়েছে!'); this.router.navigateByUrl('/dashboard'); },
      error: () => alert(this.i18n.isEn ? 'Could not save — please try again.' : 'সংরক্ষণ করা যায়নি — আবার চেষ্টা করুন।'),
    });
  }
}
