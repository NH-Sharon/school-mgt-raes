import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SimulationService } from '../services/simulation.service';
import { I18nService } from '../services/i18n.service';

type GateKey = 'AND' | 'OR' | 'NOT' | 'NAND' | 'NOR' | 'XOR';

const GATE_FN: Record<GateKey, (a: number, b: number) => number> = {
  AND: (a, b) => (a && b ? 1 : 0),
  OR: (a, b) => (a || b ? 1 : 0),
  NOT: (a) => (a ? 0 : 1),
  NAND: (a, b) => (a && b ? 0 : 1),
  NOR: (a, b) => (a || b ? 0 : 1),
  XOR: (a, b) => (a !== b ? 1 : 0),
};

@Component({
  selector: 'app-simulation-ict',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="lab-shell">
      <div class="lab-header">
        <h2>💻 {{ i18n.isEn ? 'Logic Gate Builder' : 'লজিক গেট বিল্ডার' }}</h2>
        <button class="ghost-btn" (click)="finishAndSave()">✅ {{ i18n.isEn ? 'Finish & Save Report' : 'সমাপ্ত করুন ও রিপোর্ট সংরক্ষণ' }}</button>
      </div>

      <div class="layout">
        <div class="gate-stage">
          <div class="gate-picker">
            <button *ngFor="let g of gates" class="gate-btn" [class.active]="activeGate===g" (click)="selectGate(g)">{{ g }}</button>
          </div>

          <div class="circuit">
            <div class="input-col">
              <button class="io-btn" [class.on]="inputA===1" (click)="toggleA()">A = {{ inputA }}</button>
              <button class="io-btn" [class.on]="inputB===1" (click)="toggleB()" *ngIf="activeGate !== 'NOT'">B = {{ inputB }}</button>
            </div>
            <div class="gate-box">{{ activeGate }}</div>
            <div class="output-col">
              <div class="io-out" [class.on]="output===1">Y = {{ output }}</div>
            </div>
          </div>
        </div>

        <div class="data-panel">
          <h3>{{ i18n.isEn ? 'Truth Table' : 'ট্রুথ টেবিল' }}</h3>
          <table class="obs-table">
            <thead>
              <tr><th>A</th><th *ngIf="activeGate !== 'NOT'">B</th><th>Y</th></tr>
            </thead>
            <tbody>
              <tr *ngFor="let row of truthTable()">
                <td>{{ row.a }}</td><td *ngIf="activeGate !== 'NOT'">{{ row.b }}</td><td>{{ row.y }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .lab-shell { max-width: 900px; margin: 0 auto; padding: 16px; }
    .lab-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; margin-bottom: 16px; }
    .lab-header h2 { margin: 0; color: #1a6d5e; }
    .ghost-btn { background: transparent; border: 1px solid #cfd9dd; color: #33454f; padding: 8px 14px; border-radius: 8px; }
    .layout { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    @media (max-width: 800px) { .layout { grid-template-columns: 1fr; } }
    .gate-stage { background: #17212c; border-radius: 12px; padding: 20px; display: flex; flex-direction: column; gap: 20px; align-items: center; }
    .gate-picker { display: flex; gap: 6px; flex-wrap: wrap; justify-content: center; }
    .gate-btn { padding: 8px 14px; border-radius: 8px; border: 1px solid #2c3a48; background: #1e2b38; color: #e8eef4; font-weight: 600; }
    .gate-btn.active { background: #37c2b5; color: #06231f; border-color: #37c2b5; }
    .circuit { display: flex; align-items: center; gap: 16px; }
    .input-col { display: flex; flex-direction: column; gap: 10px; }
    .io-btn { padding: 10px 16px; border-radius: 8px; border: 2px solid #2c3a48; background: #1e2b38; color: #9fb0bf; font-weight: 700; }
    .io-btn.on { background: #37c2b5; color: #06231f; border-color: #37c2b5; }
    .gate-box { padding: 20px 24px; background: #2c3a48; border-radius: 10px; color: #e8eef4; font-weight: 700; font-size: 1.1rem; }
    .io-out { padding: 10px 16px; border-radius: 8px; border: 2px solid #2c3a48; color: #9fb0bf; font-weight: 700; }
    .io-out.on { background: #e0a23a; color: #06231f; border-color: #e0a23a; }
    .data-panel { background: #fff; border: 1px solid #e2e8ec; border-radius: 12px; padding: 16px; }
    .data-panel h3 { color: #1a6d5e; font-size: 1rem; margin: 0 0 10px; }
    .obs-table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
    .obs-table th, .obs-table td { border: 1px solid #e2e8ec; padding: 8px; text-align: center; }
  `],
})
export class SimulationIctComponent implements OnInit {
  private simulationService = inject(SimulationService);
  private router = inject(Router);
  i18n = inject(I18nService);

  gates: GateKey[] = ['AND', 'OR', 'NOT', 'NAND', 'NOR', 'XOR'];
  activeGate: GateKey = 'AND';
  inputA = 0; inputB = 0;
  attemptId: number | null = null;
  private gatesExplored = new Set<GateKey>();

  ngOnInit() {
    this.simulationService.startAttempt('ict-logic-gates', 'free').subscribe({ next: (a) => this.attemptId = a.id, error: () => {} });
  }

  get output(): number { return GATE_FN[this.activeGate](this.inputA, this.inputB); }

  selectGate(g: GateKey) { this.activeGate = g; this.gatesExplored.add(g); this.logStep(); }
  toggleA() { this.inputA = this.inputA ? 0 : 1; this.logStep(); }
  toggleB() { this.inputB = this.inputB ? 0 : 1; this.logStep(); }

  truthTable(): { a: number; b: number; y: number }[] {
    if (this.activeGate === 'NOT') return [0, 1].map(a => ({ a, b: 0, y: GATE_FN.NOT(a, 0) }));
    const rows: { a: number; b: number; y: number }[] = [];
    for (const a of [0, 1]) for (const b of [0, 1]) rows.push({ a, b, y: GATE_FN[this.activeGate](a, b) });
    return rows;
  }

  private logStep() {
    if (!this.attemptId) return;
    this.simulationService.updateAttempt(this.attemptId, {
      steps: [{ gate: this.activeGate, inputA: this.inputA, inputB: this.inputB, output: this.output }],
    }).subscribe({ error: () => {} });
  }

  finishAndSave() {
    if (!this.attemptId) { this.router.navigateByUrl('/subjects'); return; }
    const summary = this.i18n.isEn
      ? `Explored ${this.gatesExplored.size || 1} gate(s)`
      : `${this.gatesExplored.size || 1}টি গেট অন্বেষণ করা হয়েছে`;
    this.simulationService.completeAttempt(this.attemptId, summary, { gatesExplored: Array.from(this.gatesExplored) }).subscribe({
      next: () => { alert(this.i18n.isEn ? 'Saved to your dashboard!' : 'আপনার ড্যাশবোর্ডে সংরক্ষিত হয়েছে!'); this.router.navigateByUrl('/dashboard'); },
      error: () => alert(this.i18n.isEn ? 'Could not save — please try again.' : 'সংরক্ষণ করা যায়নি — আবার চেষ্টা করুন।'),
    });
  }
}
