import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SimulationService } from '../services/simulation.service';
import { LabSessionService } from '../services/lab-session.service';
import { I18nService } from '../services/i18n.service';

@Component({
  selector: 'app-simulation-titration',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="lab-shell">
      <div class="lab-header">
        <h2>🧪 {{ i18n.isEn ? 'Acid-Base Titration Lab' : 'এসিড-ক্ষার টাইট্রেশন ল্যাব' }}</h2>
        <button class="ghost-btn" (click)="finishAndSave()">✅ {{ i18n.isEn ? 'Finish & Save Report' : 'সমাপ্ত করুন ও রিপোর্ট সংরক্ষণ' }}</button>
      </div>

      <p class="setup-note">{{ i18n.isEn ? '25.0 mL of 0.1 M HCl with phenolphthalein indicator, titrated against 0.1 M NaOH from the burette.' : 'কনিক্যাল ফ্লাস্কে ২৫.০ mL, ০.১ M HCl (ফেনলফথ্যালিন ইন্ডিকেটরসহ), ব্যুরেট থেকে ০.১ M NaOH যোগ করা হচ্ছে।' }}</p>

      <div class="layout">
        <div class="burette-stage">
          <svg viewBox="0 0 160 260" class="burette-svg">
            <!-- burette -->
            <rect x="70" y="10" width="20" height="120" fill="none" stroke="#9fb0bf" stroke-width="2"/>
            <rect x="70" [attr.y]="10 + (120 * (1 - remainingFraction()))" width="20" [attr.height]="120 * remainingFraction()" fill="#cfe8f5"/>
            <text x="80" y="6" text-anchor="middle" fill="#e8eef4" font-size="9">{{ i18n.isEn ? 'NaOH' : 'NaOH' }}</text>
            <!-- stand arm -->
            <line x1="80" y1="130" x2="80" y2="150" stroke="#9fb0bf" stroke-width="2"/>
            <!-- flask -->
            <path d="M65,230 L65,190 L50,150 L110,150 L95,190 L95,230 Z" fill="rgba(255,255,255,0.03)" stroke="#6b7d8c" stroke-width="3"/>
            <path [attr.d]="liquidPath()" [attr.fill]="liquidColor()"/>
          </svg>
          <p class="volume-readout">{{ i18n.isEn ? 'Volume added' : 'যোগকৃত আয়তন' }}: <b>{{ volumeAdded.toFixed(1) }} mL</b></p>
          <p class="endpoint-note" *ngIf="pastEndpoint() && !recorded">🎉 {{ i18n.isEn ? 'Endpoint reached — color turned pink!' : 'সমাপনী বিন্দুতে পৌঁছেছে — রঙ গোলাপি হয়ে গেছে!' }}</p>

          <div class="controls">
            <button class="drop-btn" (click)="addDrop(0.5)">+0.5 mL</button>
            <button class="drop-btn" (click)="addDrop(2)">+2 mL</button>
            <button class="ghost-btn" (click)="reset()">🔄 {{ i18n.isEn ? 'Reset' : 'রিসেট' }}</button>
          </div>
        </div>

        <div class="data-panel">
          <h3>{{ i18n.isEn ? 'Result' : 'ফলাফল' }}</h3>
          <p class="body-text">{{ i18n.isEn ? 'Add NaOH drop by drop until the solution just turns permanently pink (the endpoint), then record the volume used.' : 'দ্রবণ স্থায়ীভাবে গোলাপি না হওয়া পর্যন্ত ধীরে ধীরে NaOH যোগ করুন (সমাপনী বিন্দু), তারপর ব্যবহৃত আয়তন রেকর্ড করুন।' }}</p>
          <button class="primary-btn" [disabled]="!pastEndpoint() || recorded" (click)="recordEndpoint()">🏁 {{ i18n.isEn ? 'Record Endpoint' : 'সমাপনী বিন্দু রেকর্ড করুন' }}</button>
          <div class="result-box" *ngIf="recorded">
            <p><b>{{ i18n.isEn ? 'Endpoint volume' : 'সমাপনী আয়তন' }}:</b> {{ recordedVolume.toFixed(1) }} mL</p>
            <p><b>{{ i18n.isEn ? 'Calculated HCl concentration' : 'গণনাকৃত HCl ঘনমাত্রা' }}:</b> {{ calculatedConcentration().toFixed(3) }} M</p>
            <p class="dim">M₁V₁ = M₂V₂ → M(HCl) = (0.1 × {{ recordedVolume.toFixed(1) }}) / 25.0</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .lab-shell { max-width: 900px; margin: 0 auto; padding: 16px; }
    .lab-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; margin-bottom: 8px; }
    .lab-header h2 { margin: 0; color: #1a6d5e; }
    .setup-note { font-size: 0.85rem; color: #667680; margin: 0 0 16px; }
    .ghost-btn { background: transparent; border: 1px solid #cfd9dd; color: #33454f; padding: 8px 14px; border-radius: 8px; }
    .layout { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    @media (max-width: 800px) { .layout { grid-template-columns: 1fr; } }
    .burette-stage { background: #17212c; border-radius: 12px; padding: 20px; display: flex; flex-direction: column; align-items: center; gap: 10px; }
    .burette-svg { width: 160px; height: auto; }
    .volume-readout { color: #e8eef4; font-size: 0.9rem; margin: 0; }
    .endpoint-note { color: #e87fc4; font-weight: 700; font-size: 0.85rem; margin: 0; text-align: center; }
    .controls { display: flex; gap: 8px; margin-top: 8px; flex-wrap: wrap; justify-content: center; }
    .drop-btn { background: #1e2b38; border: 1px solid #2c3a48; color: #e8eef4; padding: 8px 14px; border-radius: 8px; font-size: 0.85rem; }
    .drop-btn:hover { border-color: #37c2b5; }
    .data-panel { background: #fff; border: 1px solid #e2e8ec; border-radius: 12px; padding: 16px; }
    .data-panel h3 { color: #1a6d5e; font-size: 1rem; margin: 0 0 10px; }
    .body-text { font-size: 0.88rem; color: #33454f; line-height: 1.6; }
    .primary-btn { width: 100%; background: linear-gradient(135deg, #1a6d5e, #144f45); color: #fff; border: none; padding: 11px; border-radius: 8px; font-weight: 700; margin-top: 8px; }
    .primary-btn:disabled { opacity: 0.4; }
    .result-box { margin-top: 16px; background: #eef6f4; border-radius: 8px; padding: 12px 14px; font-size: 0.88rem; }
    .result-box p { margin: 0 0 6px; }
    .result-box .dim { color: #8a97a0; font-size: 0.78rem; }
  `],
})
export class SimulationTitrationComponent implements OnInit {
  private simulationService = inject(SimulationService);
  private router = inject(Router);
  i18n = inject(I18nService);

  readonly BURETTE_CAPACITY_ML = 50;
  readonly ACID_VOLUME_ML = 25;
  readonly ACID_CONC_M = 0.1;
  readonly BASE_CONC_M = 0.1;
  readonly ENDPOINT_ML = (this.ACID_CONC_M * this.ACID_VOLUME_ML) / this.BASE_CONC_M; // = 25.0

  volumeAdded = 0;
  recorded = false;
  recordedVolume = 0;
  attemptId: number | null = null;
  private labSession = inject(LabSessionService);
  mode: 'guided' | 'free' = 'guided';

  ngOnInit() {
    this.mode = this.labSession.getMode('chem-titration'); // FR-2.1
    this.simulationService.startAttempt('chem-titration', this.mode).subscribe({ next: (a) => this.attemptId = a.id, error: () => {} });
  }

  remainingFraction(): number {
    return Math.max(0, 1 - this.volumeAdded / this.BURETTE_CAPACITY_ML);
  }

  pastEndpoint(): boolean {
    return this.volumeAdded >= this.ENDPOINT_ML - 0.25;
  }

  liquidColor(): string {
    return this.pastEndpoint() ? '#e87fc4' : '#f5f2e9';
  }

  liquidPath(): string {
    const fillHeight = 35;
    const yTop = 230 - fillHeight;
    return `M60,230 L60,${yTop} L100,${yTop} L100,230 Z`;
  }

  addDrop(amount: number) {
    if (this.recorded) return;
    this.volumeAdded = Math.min(this.BURETTE_CAPACITY_ML, this.volumeAdded + amount);
    this.logStep();
  }

  reset() {
    this.volumeAdded = 0;
    this.recorded = false;
    this.recordedVolume = 0;
  }

  recordEndpoint() {
    if (!this.pastEndpoint()) return;
    this.recorded = true;
    this.recordedVolume = this.volumeAdded;
    this.logStep();
  }

  calculatedConcentration(): number {
    return (this.BASE_CONC_M * this.recordedVolume) / this.ACID_VOLUME_ML;
  }

  private logStep() {
    if (!this.attemptId) return;
    this.simulationService.updateAttempt(this.attemptId, {
      steps: [{ volumeAdded: this.volumeAdded, recorded: this.recorded }],
    }).subscribe({ error: () => {} });
  }

  finishAndSave() {
    if (!this.attemptId || !this.recorded) { this.router.navigateByUrl('/subjects'); return; }
    const summary = `${this.i18n.isEn ? 'Endpoint at' : 'সমাপনী বিন্দু'} ${this.recordedVolume.toFixed(1)} mL, ${this.i18n.isEn ? 'calculated conc.' : 'গণনাকৃত ঘনমাত্রা'} ${this.calculatedConcentration().toFixed(3)} M`;
    this.simulationService.completeAttempt(this.attemptId, summary, { volumeAdded: this.recordedVolume, calculatedConcentration: this.calculatedConcentration() }).subscribe({
      next: () => { alert(this.i18n.isEn ? 'Saved to your dashboard!' : 'আপনার ড্যাশবোর্ডে সংরক্ষিত হয়েছে!'); this.router.navigateByUrl('/dashboard'); },
      error: () => alert(this.i18n.isEn ? 'Could not save — please try again.' : 'সংরক্ষণ করা যায়নি — আবার চেষ্টা করুন।'),
    });
  }
}
