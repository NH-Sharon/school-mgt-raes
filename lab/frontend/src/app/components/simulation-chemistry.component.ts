import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CHEMICALS, REACTIONS, PRESET_GROUPS, INDICATOR_BEHAVIOR, Chemical, Reaction, getChem } from '../data/chemistry-lab-data';
import { SimulationService } from '../services/simulation.service';
import { LabSessionService } from '../services/lab-session.service';
import { I18nService } from '../services/i18n.service';
import { ChemBeaker3dComponent } from './chem-beaker-3d.component';

interface SlotData { chemId: string; amount: number; }
interface NotebookEntry { reactants: string; equation: string; observation: string; time: string; }
interface ResultView {
  kind: 'warning' | 'indicator' | 'no-reaction' | 'reaction';
  title?: string; equation?: string; observation?: string; indicatorLine?: string; useNote?: string; safetyNote?: string; message?: string;
}

const NOTEBOOK_KEY = 'bdVirtualLab_chemNotebook';

@Component({
  selector: 'app-simulation-chemistry',
  standalone: true,
  imports: [CommonModule, FormsModule, ChemBeaker3dComponent],
  template: `
    <div class="lab-shell">
      <div class="lab-header">
        <h2>⚗️ {{ i18n.isEn ? 'Chemical Mixing Lab' : 'রাসায়নিক পদার্থ মিশ্রণ পরীক্ষাগার' }}</h2>
        <div class="mode-row">
          <button class="mode-btn" [class.active]="mode==='guided'" (click)="mode='guided'">{{ i18n.isEn ? 'Guided' : 'গাইডেড মোড' }}</button>
          <button class="mode-btn" [class.active]="mode==='free'" (click)="mode='free'">{{ i18n.isEn ? 'Free' : 'ফ্রি মোড' }}</button>
          <button class="ghost-btn" (click)="notebookOpen = true">📓 {{ i18n.isEn ? 'Notebook' : 'ল্যাব নোটবুক' }}</button>
          <button class="ghost-btn" (click)="finishAndSave()">✅ {{ i18n.isEn ? 'Finish & Save Report' : 'সমাপ্ত করুন ও রিপোর্ট সংরক্ষণ' }}</button>
        </div>
      </div>

      <div class="layout">
        <aside class="shelf">
          <div class="tabs">
            <button *ngFor="let cat of categories" class="tab" [class.active]="activeCat===cat.key" (click)="activeCat = cat.key">{{ i18n.isEn ? cat.en : cat.bn }}</button>
          </div>
          <div class="chem-list">
            <div class="chem-item" *ngFor="let chem of chemicalsInCategory()">
              <div class="chem-swatch" [style.background]="chem.color"></div>
              <div class="chem-names">
                <span class="chem-name-bn">{{ i18n.isEn ? chem.nameEn : chem.nameBn }}</span>
                <span class="chem-formula">{{ chem.formula }} {{ chem.state === 'solid' ? (i18n.isEn ? '(solid)' : '(কঠিন)') : '' }}</span>
              </div>
              <button class="add-btn" (click)="quickAdd(chem.id)">+</button>
            </div>
          </div>

          <!-- FR-2.2 guided step script -->
          <div class="guided-steps" *ngIf="mode === 'guided' && guidedSteps.length">
            <h3>🧭 {{ i18n.t('step') }} {{ currentStep + 1 }} / {{ guidedSteps.length }}</h3>
            <p class="gstep-instruction">{{ i18n.isEn ? guidedSteps[currentStep].instruction_en : guidedSteps[currentStep].instruction_bn }}</p>
            <p class="gstep-hint" *ngIf="guidedSteps[currentStep].hint_en">💡 {{ i18n.isEn ? guidedSteps[currentStep].hint_en : guidedSteps[currentStep].hint_bn }}</p>
            <div class="gstep-nav">
              <button class="ghost-btn" (click)="prevStep()" [disabled]="currentStep === 0">‹</button>
              <button class="ghost-btn" (click)="nextStep()" [disabled]="currentStep === guidedSteps.length - 1">›</button>
            </div>
          </div>

          <div class="presets" *ngIf="mode === 'guided'">
            <h3>{{ i18n.isEn ? 'Famous experiments — one click (basic to advanced)' : 'বিখ্যাত পরীক্ষা — এক ক্লিকে (বেসিক থেকে অ্যাডভান্সড)' }}</h3>
            <div class="preset-group" *ngFor="let group of presetGroups">
              <div class="preset-group-header"><span class="preset-level">{{ group.level }}</span>{{ group.titleBn }}</div>
              <button class="preset-btn" *ngFor="let item of group.items" (click)="applyPreset(item)">{{ item.labelBn }}</button>
            </div>
          </div>
        </aside>

        <section class="workspace">
          <div class="slots">
            <div class="slot" [class.filled]="slots[0]">
              <div class="slot-label">{{ i18n.isEn ? 'Vessel 1' : 'পাত্র ১' }}</div>
              <div class="slot-body" [class.empty]="!slots[0]" (click)="openPicker(0)">
                <ng-container *ngIf="slots[0] as s; else emptySlot0">
                  <div class="slot-chem-swatch" [style.background]="getChem(s.chemId)?.color"></div>
                  <span>{{ i18n.isEn ? getChem(s.chemId)?.nameEn : getChem(s.chemId)?.nameBn }} ({{ getChem(s.chemId)?.formula }})</span>
                  <button class="remove-chip" (click)="removeSlot($event, 0)">✕</button>
                </ng-container>
                <ng-template #emptySlot0>+ {{ i18n.isEn ? 'Click to add' : 'চাপুন / ক্লিক করে যোগ করুন' }}</ng-template>
              </div>
              <input type="range" min="1" max="10" [(ngModel)]="slotAmount0" [disabled]="!slots[0]" (input)="setAmount(0, slotAmount0)" class="amount-slider">
              <div class="amount-readout">{{ i18n.isEn ? 'Amount' : 'পরিমাণ' }}: {{ slotAmount0 }}</div>
            </div>
            <div class="plus-icon">+</div>
            <div class="slot" [class.filled]="slots[1]">
              <div class="slot-label">{{ i18n.isEn ? 'Vessel 2' : 'পাত্র ২' }}</div>
              <div class="slot-body" [class.empty]="!slots[1]" (click)="openPicker(1)">
                <ng-container *ngIf="slots[1] as s; else emptySlot1">
                  <div class="slot-chem-swatch" [style.background]="getChem(s.chemId)?.color"></div>
                  <span>{{ i18n.isEn ? getChem(s.chemId)?.nameEn : getChem(s.chemId)?.nameBn }} ({{ getChem(s.chemId)?.formula }})</span>
                  <button class="remove-chip" (click)="removeSlot($event, 1)">✕</button>
                </ng-container>
                <ng-template #emptySlot1>+ {{ i18n.isEn ? 'Click to add' : 'চাপুন / ক্লিক করে যোগ করুন' }}</ng-template>
              </div>
              <input type="range" min="1" max="10" [(ngModel)]="slotAmount1" [disabled]="!slots[1]" (input)="setAmount(1, slotAmount1)" class="amount-slider">
              <div class="amount-readout">{{ i18n.isEn ? 'Amount' : 'পরিমাণ' }}: {{ slotAmount1 }}</div>
            </div>
            <div class="slot slot-indicator" [class.filled]="slots[2]">
              <div class="slot-label">{{ i18n.isEn ? 'Indicator (optional)' : 'নির্দেশক (ঐচ্ছিক)' }}</div>
              <div class="slot-body" [class.empty]="!slots[2]" (click)="openPicker(2)">
                <ng-container *ngIf="slots[2] as s; else emptySlot2">
                  <div class="slot-chem-swatch" [style.background]="getChem(s.chemId)?.color"></div>
                  <span>{{ i18n.isEn ? getChem(s.chemId)?.nameEn : getChem(s.chemId)?.nameBn }}</span>
                  <button class="remove-chip" (click)="removeSlot($event, 2)">✕</button>
                </ng-container>
                <ng-template #emptySlot2>+ {{ i18n.isEn ? 'Optional indicator' : 'ঐচ্ছিক নির্দেশক যোগ করুন' }}</ng-template>
              </div>
            </div>
          </div>

          <div class="action-row">
            <button class="primary-btn" (click)="react()">⚗️ {{ i18n.isEn ? 'Mix (React)' : 'মিশ্রিত করুন (React)' }}</button>
            <button class="ghost-btn" (click)="resetSlots()">🔄 {{ i18n.isEn ? 'Empty vessels' : 'পাত্র খালি করুন' }}</button>
          </div>

          <div class="beaker-stage">
            <app-chem-beaker-3d
              [liquidColor]="liquidColor" [liquidHeight]="liquidHeight"
              [precipitateColor]="precipitateColor" [precipitateHeight]="precipitateHeight"
              [bubbleCount]="bubbleCount" [gasLabel]="gasLabel" [smellLabel]="smellLabel"
              [slotA]="vesselFor(0)" [slotB]="vesselFor(1)" [isEn]="i18n.isEn"
              (amountAChange)="setAmount(0, $event)" (amountBChange)="setAmount(1, $event)">
            </app-chem-beaker-3d>
          </div>

          <div class="result-panel">
            <p class="placeholder-text" *ngIf="!result">{{ i18n.isEn ? 'Select chemicals and press "Mix" — the result will appear here.' : 'রাসায়নিক পদার্থ নির্বাচন করে "মিশ্রিত করুন" বাটনে চাপুন — ফলাফল এখানে দেখা যাবে।' }}</p>
            <ng-container *ngIf="result">
              <p class="result-section no-reaction" *ngIf="result.kind === 'warning'">⚠️ {{ result.message }}</p>
              <ng-container *ngIf="result.kind !== 'warning'">
                <h3 class="result-title">{{ result.title }}</h3>
                <div class="result-equation" *ngIf="result.equation">{{ result.equation }}</div>
                <p class="result-section" *ngIf="result.observation"><b>{{ i18n.isEn ? 'Observation:' : 'পর্যবেক্ষণ:' }}</b> {{ result.observation }}</p>
                <p class="result-section" *ngIf="result.indicatorLine">{{ result.indicatorLine }}</p>
                <p class="result-section" *ngIf="result.useNote"><b>{{ i18n.isEn ? 'Use:' : 'ব্যবহার:' }}</b> {{ result.useNote }}</p>
                <p class="result-section safety" *ngIf="result.safetyNote"><b>⚠️ {{ i18n.isEn ? 'Safety:' : 'নিরাপত্তা:' }}</b> {{ result.safetyNote }}</p>
              </ng-container>
            </ng-container>
          </div>
        </section>
      </div>
    </div>

    <div class="notebook-overlay" [class.open]="notebookOpen" (click)="closeOverlayIfBackdrop($event, 'notebook')">
      <div class="notebook-panel">
        <div class="notebook-header">
          <h2>📓 {{ i18n.isEn ? 'Lab Notebook' : 'ল্যাব নোটবুক' }}</h2>
          <button class="ghost-btn" (click)="notebookOpen = false">✕</button>
        </div>
        <div class="notebook-actions">
          <button class="ghost-btn" (click)="exportNotebook()">⬇️ {{ i18n.isEn ? 'Download (.txt)' : 'ডাউনলোড (.txt)' }}</button>
          <button class="ghost-btn" (click)="printNotebook()">🖨️ {{ i18n.isEn ? 'Print' : 'প্রিন্ট করুন' }}</button>
          <button class="ghost-btn danger" (click)="clearNotebook()">🗑️ {{ i18n.isEn ? 'Clear' : 'মুছে ফেলুন' }}</button>
        </div>
        <table class="notebook-table">
          <thead><tr><th>#</th><th>{{ i18n.isEn ? 'Reactants' : 'বিক্রিয়াকারী পদার্থ' }}</th><th>{{ i18n.isEn ? 'Equation' : 'সমীকরণ' }}</th><th>{{ i18n.isEn ? 'Observation' : 'পর্যবেক্ষণ' }}</th></tr></thead>
          <tbody>
            <tr *ngFor="let e of notebook; let i = index">
              <td>{{ i + 1 }}</td><td>{{ e.reactants }}</td><td>{{ e.equation }}</td><td>{{ e.observation }}</td>
            </tr>
          </tbody>
        </table>
        <p class="notebook-empty" *ngIf="notebook.length === 0">{{ i18n.isEn ? 'No experiments recorded yet.' : 'এখনো কোনো পরীক্ষা রেকর্ড করা হয়নি।' }}</p>
      </div>
    </div>

    <div class="picker-overlay" [class.open]="pickerOpen" (click)="closeOverlayIfBackdrop($event, 'picker')">
      <div class="picker-panel">
        <div class="picker-header">
          <h3>{{ i18n.isEn ? 'Select a chemical' : 'রাসায়নিক পদার্থ নির্বাচন করুন' }}</h3>
          <button class="ghost-btn" (click)="pickerOpen = false">✕</button>
        </div>
        <div class="picker-list">
          <div class="picker-item" *ngFor="let chem of pickerOptions()" (click)="choosePicker(chem)">
            <div class="chem-swatch" [style.background]="chem.color"></div>
            <div class="chem-names">
              <span class="chem-name-bn">{{ i18n.isEn ? chem.nameEn : chem.nameBn }}</span>
              <span class="chem-formula">{{ chem.formula }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .lab-shell { max-width: 1400px; margin: 0 auto; padding: 16px; font-family: 'Noto Sans Bengali','Noto Sans',sans-serif; }
    .lab-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; margin-bottom: 12px; }
    .lab-header h2 { margin: 0; color: #1a6d5e; }
    .mode-row { display: flex; gap: 8px; flex-wrap: wrap; }
    .mode-btn { padding: 7px 14px; border-radius: 999px; border: 1px solid #cfd9dd; background: #fff; font-size: 0.82rem; }
    .mode-btn.active { background: #1a6d5e; color: #fff; border-color: #1a6d5e; }
    .ghost-btn { background: transparent; border: 1px solid #cfd9dd; color: #33454f; padding: 7px 12px; border-radius: 8px; font-size: 0.82rem; }
    .ghost-btn.danger:hover { border-color: #e0645c; color: #e0645c; }

    :root, .lab-shell { --bg-panel: #17212c; --bg-card: #1e2b38; --border: #2c3a48; --text: #e8eef4; --text-dim: #9fb0bf; --accent: #37c2b5; --accent-dark: #2a9c92; --warn: #e0a23a; --danger: #e0645c; --radius: 12px; }

    .layout { display: grid; grid-template-columns: 300px 1fr; gap: 16px; }
    @media (max-width: 900px) { .layout { grid-template-columns: 1fr; } }

    .shelf { background: var(--bg-panel); border: 1px solid var(--border); border-radius: var(--radius); padding: 14px; color: var(--text); align-self: start; }
    .tabs { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; margin-bottom: 12px; }
    .tab { padding: 8px 6px; background: var(--bg-card); border: 1px solid var(--border); color: var(--text-dim); border-radius: 8px; font-size: 0.85rem; font-weight: 600; }
    .tab.active { background: var(--accent); color: #06231f; border-color: var(--accent); }
    .chem-list { display: flex; flex-direction: column; gap: 6px; max-height: 340px; overflow-y: auto; padding-right: 4px; }
    .chem-item { display: flex; align-items: center; gap: 10px; padding: 8px 10px; background: var(--bg-card); border: 1px solid var(--border); border-radius: 8px; }
    .chem-swatch { width: 20px; height: 20px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.25); flex-shrink: 0; }
    .chem-names { display: flex; flex-direction: column; line-height: 1.25; flex: 1; }
    .chem-name-bn { font-size: 0.85rem; font-weight: 600; color: var(--text); }
    .chem-formula { font-size: 0.75rem; color: var(--text-dim); }
    .add-btn { background: var(--accent); color: #06231f; border: none; border-radius: 6px; width: 26px; height: 26px; font-weight: 700; }
    .guided-steps { margin-top: 16px; border: 1px solid var(--accent, #37c2b5); border-radius: 10px; padding: 12px; background: rgba(55,194,181,0.08); }
    .guided-steps h3 { font-size: 0.82rem; margin: 0 0 8px; color: var(--accent, #37c2b5); }
    .gstep-instruction { font-size: 0.86rem; margin: 0 0 8px; line-height: 1.5; }
    .gstep-hint { font-size: 0.8rem; margin: 0 0 8px; color: var(--text-dim, #8aa); }
    .gstep-nav { display: flex; gap: 8px; }
    .gstep-nav .ghost-btn { flex: 1; text-align: center; }
    .presets { margin-top: 18px; border-top: 1px solid var(--border); padding-top: 14px; max-height: 480px; overflow-y: auto; }
    .presets h3 { font-size: 0.8rem; color: var(--text-dim); margin: 0 0 10px; }
    .preset-group { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; }
    .preset-group-header { font-size: 0.78rem; font-weight: 700; color: var(--text); display: flex; align-items: center; gap: 6px; }
    .preset-level { font-size: 0.65rem; font-weight: 700; color: #06231f; background: var(--accent); padding: 2px 7px; border-radius: 999px; }
    .preset-btn { text-align: left; background: var(--bg-card); border: 1px solid var(--border); color: var(--text); padding: 8px 10px; border-radius: 8px; font-size: 0.8rem; }
    .preset-btn:hover { border-color: var(--warn); }

    .workspace { background: var(--bg-panel); border: 1px solid var(--border); border-radius: var(--radius); padding: 16px; display: flex; flex-direction: column; gap: 16px; color: var(--text); }
    .slots { display: flex; align-items: flex-start; gap: 10px; flex-wrap: wrap; }
    .slot { flex: 1 1 180px; background: var(--bg-card); border: 2px dashed var(--border); border-radius: var(--radius); padding: 10px; min-width: 160px; }
    .slot.filled { border-style: solid; border-color: var(--accent); }
    .slot-label { font-size: 0.8rem; color: var(--text-dim); margin-bottom: 6px; font-weight: 600; }
    .slot-body { min-height: 46px; display: flex; align-items: center; gap: 8px; font-size: 0.85rem; padding: 6px; border-radius: 8px; cursor: pointer; }
    .slot-body.empty { color: var(--text-dim); font-style: italic; justify-content: center; text-align: center; }
    .slot-chem-swatch { width: 18px; height: 18px; border-radius: 50%; flex-shrink: 0; border: 2px solid rgba(255,255,255,0.25); }
    .remove-chip { margin-left: auto; background: none; border: none; color: var(--danger); font-size: 1rem; font-weight: 700; }
    .amount-slider { width: 100%; margin-top: 8px; accent-color: var(--accent); }
    .amount-readout { font-size: 0.75rem; color: var(--text-dim); margin-top: 2px; text-align: center; }
    .plus-icon { align-self: center; font-size: 1.4rem; color: var(--text-dim); padding-top: 20px; }
    .action-row { display: flex; gap: 10px; flex-wrap: wrap; }
    .primary-btn { background: linear-gradient(135deg, var(--accent), var(--accent-dark)); color: #06231f; border: none; padding: 12px 20px; border-radius: 10px; font-weight: 700; font-size: 0.95rem; }

    .beaker-stage { display: flex; justify-content: center; padding: 4px 0; position: relative; }

    .result-panel { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius); padding: 16px; min-height: 80px; }
    .placeholder-text { color: var(--text-dim); font-size: 0.9rem; margin: 0; text-align: center; }
    .result-title { font-size: 1.1rem; font-weight: 700; margin: 0 0 6px; color: var(--accent); }
    .result-equation { font-family: monospace; font-size: 1rem; background: rgba(55,194,181,0.08); border: 1px solid rgba(55,194,181,0.25); padding: 8px 12px; border-radius: 8px; display: inline-block; margin-bottom: 10px; }
    .result-section { margin-bottom: 8px; font-size: 0.9rem; line-height: 1.5; }
    .result-section.safety { color: var(--warn); }
    .result-section.no-reaction { color: var(--text-dim); font-style: italic; }

    .notebook-overlay, .picker-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: none; align-items: center; justify-content: center; padding: 20px; z-index: 100; }
    .notebook-overlay.open, .picker-overlay.open { display: flex; }
    .notebook-panel { background: var(--bg-panel); border: 1px solid var(--border); border-radius: var(--radius); padding: 20px; width: 100%; max-width: 720px; max-height: 85vh; overflow-y: auto; color: var(--text); }
    .notebook-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
    .notebook-actions { display: flex; gap: 8px; margin-bottom: 14px; flex-wrap: wrap; }
    .notebook-table { width: 100%; border-collapse: collapse; font-size: 0.82rem; }
    .notebook-table th, .notebook-table td { border: 1px solid var(--border); padding: 8px; text-align: left; vertical-align: top; }
    .notebook-empty { color: var(--text-dim); text-align: center; margin-top: 14px; }
    .picker-panel { background: var(--bg-panel); border: 1px solid var(--border); border-radius: var(--radius); padding: 18px; width: 100%; max-width: 420px; max-height: 80vh; overflow-y: auto; color: var(--text); }
    .picker-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
    .picker-list { display: flex; flex-direction: column; gap: 6px; }
    .picker-item { display: flex; align-items: center; gap: 10px; padding: 10px; background: var(--bg-card); border: 1px solid var(--border); border-radius: 8px; cursor: pointer; }
    .picker-item:hover { border-color: var(--accent); }
  `],
})
export class SimulationChemistryComponent implements OnInit {
  private simulationService = inject(SimulationService);
  private router = inject(Router);
  i18n = inject(I18nService);

  categories = [
    { key: 'acid', bn: 'এসিড', en: 'Acid' }, { key: 'base', bn: 'ক্ষার', en: 'Base' },
    { key: 'salt', bn: 'লবণ', en: 'Salt' }, { key: 'metal', bn: 'ধাতু', en: 'Metal' },
    { key: 'indicator', bn: 'নির্দেশক', en: 'Indicator' },
  ];
  presetGroups = PRESET_GROUPS;

  activeCat = 'acid';
  mode: 'guided' | 'free' = 'guided';
  slots: (SlotData | null)[] = [null, null, null];
  slotAmount0 = 5; slotAmount1 = 5;

  liquidColor = '#cfe8f5'; liquidHeight = 10;
  precipitateColor = 'transparent'; precipitateHeight = 0;
  bubbleCount = 0;
  gasLabel = ''; smellLabel = '';
  result: ResultView | null = null;

  notebookOpen = false;
  pickerOpen = false;
  pickerTargetSlot = 0;
  notebook: NotebookEntry[] = [];

  attemptId: number | null = null;
  mistakes = 0;
  hintsUsed = 0;
  private stepsLog: any[] = [];

  // FR-2 — guided step script (from simulations.config.guidedSteps)
  guidedSteps: { instruction_bn: string; instruction_en: string; hint_bn?: string; hint_en?: string }[] = [];
  currentStep = 0;
  private labSession = inject(LabSessionService);

  ngOnInit() {
    this.notebook = this.loadNotebook();
    // Honour the mode chosen on the lab-launch screen (FR-2.1)
    this.mode = this.labSession.getMode('chem-mixing');
    this.simulationService.getSimulation('chem-mixing').subscribe({
      next: (sim) => { this.guidedSteps = (sim?.config?.guidedSteps) || []; },
      error: () => {},
    });
    this.simulationService.startAttempt('chem-mixing', this.mode).subscribe({
      next: (a) => this.attemptId = a.id,
      error: () => {},
    });
  }

  nextStep() { if (this.currentStep < this.guidedSteps.length - 1) this.currentStep++; }
  prevStep() { if (this.currentStep > 0) this.currentStep--; }

  getChem(id: string): Chemical | undefined { return getChem(id); }

  chemicalsInCategory(): Chemical[] { return CHEMICALS.filter(c => c.category === this.activeCat); }

  quickAdd(chemId: string) {
    const chem = getChem(chemId)!;
    if (chem.type === 'indicator') {
      if (this.slots[2]) { this.flashWarning(this.i18n.isEn ? 'Indicator vessel already full — empty it first.' : 'নির্দেশকের পাত্র ইতিমধ্যে পূর্ণ — আগে খালি করুন।'); return; }
      this.slots[2] = { chemId, amount: 1 };
    } else if (!this.slots[0]) { this.slots[0] = { chemId, amount: this.slotAmount0 }; }
    else if (!this.slots[1]) { this.slots[1] = { chemId, amount: this.slotAmount1 }; }
    else { this.flashWarning(this.i18n.isEn ? 'Both vessels are full — empty one to add a new chemical.' : 'উভয় পাত্র পূর্ণ — নতুন পদার্থ যোগ করতে আগে একটি খালি করুন।'); }
  }

  removeSlot(e: Event, i: number) { e.stopPropagation(); this.slots[i] = null; }
  setAmount(i: number, value: number) {
    if (!this.slots[i]) return;
    this.slots[i]!.amount = Number(value);
    if (i === 0) this.slotAmount0 = Number(value); else if (i === 1) this.slotAmount1 = Number(value);
  }

  vesselFor(i: 0 | 1): { color: string; amount: number; type: Chemical['type'] } | null {
    const s = this.slots[i];
    if (!s) return null;
    const chem = getChem(s.chemId);
    return { color: chem?.color || '#eef6fb', amount: s.amount, type: chem?.type || 'salt' };
  }

  openPicker(i: number) { this.pickerTargetSlot = i; this.pickerOpen = true; }
  pickerOptions(): Chemical[] {
    const allowedCats = this.pickerTargetSlot === 2 ? ['indicator'] : ['acid', 'base', 'salt', 'metal'];
    return CHEMICALS.filter(c => allowedCats.includes(c.category));
  }
  choosePicker(chem: Chemical) {
    this.slots[this.pickerTargetSlot] = { chemId: chem.id, amount: this.pickerTargetSlot === 2 ? 1 : 5 };
    this.pickerOpen = false;
  }

  applyPreset(item: { slots: (string | null)[] }) {
    this.slots = item.slots.map(id => id ? { chemId: id, amount: 5 } : null);
    this.slotAmount0 = this.slots[0]?.amount ?? 5;
    this.slotAmount1 = this.slots[1]?.amount ?? 5;
    this.react();
  }

  resetSlots() {
    this.slots = [null, null, null];
    this.animateBeaker({ liquidFrom: '#cfe8f5', liquidTo: '#cfe8f5', gas: false, precipitate: null, vigor: 'none', smell: null });
    this.result = null;
  }

  private flashWarning(msg: string) {
    this.result = { kind: 'warning', message: msg };
    this.hintsUsed++;
    this.mistakes++;
    this.logStep({ type: 'warning', msg });
  }

  private findReaction(ids: string[]): Reaction | undefined {
    const key = [...ids].sort().join('|');
    return REACTIONS.find(r => r.reactants.map(x => x.id).sort().join('|') === key);
  }

  private chemLabel(s: SlotData): string {
    const chem = getChem(s.chemId)!;
    return `${chem.nameBn} (${s.amount} একক)`;
  }

  react() {
    const main = [0, 1].map(i => this.slots[i]).filter((s): s is SlotData => !!s);
    const indicatorSlot = this.slots[2];

    if (main.length === 0) { this.flashWarning(this.i18n.isEn ? 'Select at least one chemical.' : 'অন্তত একটি রাসায়নিক পদার্থ নির্বাচন করুন।'); return; }
    if (main.length === 1 && indicatorSlot) { this.renderIndicatorOnlyResult(main[0], indicatorSlot); return; }
    if (main.length === 1 && !indicatorSlot) { this.flashWarning(this.i18n.isEn ? 'Add a second chemical or an indicator to see a reaction.' : 'বিক্রিয়া দেখতে দ্বিতীয় একটি রাসায়নিক পদার্থ অথবা একটি নির্দেশক যোগ করুন।'); return; }

    const ids = main.map(m => m.chemId);
    const reaction = this.findReaction(ids);
    if (!reaction) { this.renderGenericNoReaction(main); return; }
    this.renderReactionResult(reaction, main, indicatorSlot);
  }

  private renderIndicatorOnlyResult(slotData: SlotData, indicatorSlotData: SlotData) {
    const chem = getChem(slotData.chemId)!;
    const indicator = getChem(indicatorSlotData.chemId)!;
    const character = chem.type === 'acid' ? 'acid' : chem.type === 'base' ? 'base' : 'neutral';
    const behavior = INDICATOR_BEHAVIOR[indicator.id][character];

    this.animateBeaker({ liquidFrom: chem.color, liquidTo: behavior.color, gas: false, precipitate: null, vigor: 'none', smell: null });

    const characterLabelBn = character === 'acid' ? 'একটি এসিড' : character === 'base' ? 'একটি ক্ষার' : 'একটি নিরপেক্ষ পদার্থ';
    this.result = {
      kind: 'indicator',
      title: `${indicator.nameBn} ${this.i18n.isEn ? 'test' : 'পরীক্ষা'}`,
      equation: `${chem.nameBn} + ${indicator.nameBn}`,
      observation: `${indicator.nameBn} ${behavior.label}। এটি প্রমাণ করে পদার্থটি ${characterLabelBn}।`,
    };
    this.logToNotebook(`${this.chemLabel(slotData)} + ${indicator.nameBn}`, `${chem.formula} + নির্দেশক`, this.result.observation!);
  }

  private renderGenericNoReaction(main: SlotData[]) {
    this.animateBeaker({ liquidFrom: '#cfe8f5', liquidTo: '#cfe8f5', gas: false, precipitate: null, vigor: 'none', smell: null });
    const names = main.map(m => getChem(m.chemId)!.nameBn).join(' + ');
    this.result = {
      kind: 'no-reaction',
      title: this.i18n.isEn ? 'No visible reaction' : 'কোনো দৃশ্যমান বিক্রিয়া নেই',
      observation: `${names} — ${this.i18n.isEn ? 'this combination has no notable syllabus reaction. Try different chemicals.' : 'এই সংমিশ্রণে পাঠ্যক্রমভুক্ত কোনো উল্লেখযোগ্য বিক্রিয়া নেই। ভিন্ন রাসায়নিক পদার্থ নির্বাচন করে আবার চেষ্টা করুন।'}`,
    };
    this.logStep({ type: 'no-reaction', main: main.map(m => m.chemId) });
  }

  private renderReactionResult(reaction: Reaction, main: SlotData[], indicatorSlot: SlotData | null) {
    const partsMap: Record<string, number> = {};
    reaction.reactants.forEach(r => partsMap[r.id] = r.part);
    const withParts = main.map(m => ({ ...m, part: partsMap[m.chemId] }));
    const reactingUnits = Math.min(...withParts.map(m => m.amount / m.part));
    let excess: (SlotData & { part: number }) | null = null;
    withParts.forEach(m => { if (m.amount - reactingUnits * m.part > 0.05) excess = m; });

    let excessNote = '';
    let finalCharacter: 'acid' | 'base' | 'neutral' = 'neutral';
    if (excess) {
      const excessChem = getChem((excess as any).chemId)!;
      excessNote = ` (${this.i18n.isEn ? 'excess' : 'অতিরিক্ত'} ${excessChem.nameBn} ${this.i18n.isEn ? 'remains unreacted' : 'অবিক্রিয়িত অবস্থায় থেকে যাবে'})`;
      finalCharacter = excessChem.type === 'acid' ? 'acid' : excessChem.type === 'base' ? 'base' : 'neutral';
    } else {
      excessNote = this.i18n.isEn ? ' (both fully react)' : ' (উভয় পদার্থ সম্পূর্ণরূপে বিক্রিয়া করবে)';
    }

    const baseColorChem = main.find(m => getChem(m.chemId)!.color !== '#eef6fb') || main[0];
    let liquidFrom = getChem(baseColorChem.chemId)!.color;
    let liquidTo = liquidFrom;
    const cc = reaction.effects.colorChange;
    if (cc === 'blue-to-pale-green') liquidTo = '#cfe8cf';
    else if (cc === 'blue-to-colorless') liquidTo = '#eef6fb';
    else if (cc === 'to-pale-green') liquidTo = '#cfe8cf';
    else if (cc === 'to-blue') liquidTo = '#3f7fd1';
    else if (cc === true) {
      if (indicatorSlot) liquidTo = INDICATOR_BEHAVIOR[getChem(indicatorSlot.chemId)!.id][finalCharacter].color;
      else liquidTo = '#f4f8fb';
    }

    this.animateBeaker({
      liquidFrom, liquidTo, gas: reaction.effects.gas,
      precipitate: reaction.effects.precipitate ? { ...reaction.effects.precipitate, amount: reactingUnits } : null,
      vigor: reaction.effects.vigor || (reaction.effects.gas ? 'medium' : 'none'), smell: reaction.effects.smell,
    });

    let indicatorLine = '';
    if (indicatorSlot && (reaction.category === 'neutralization' || reaction.category.startsWith('gas-'))) {
      const indicator = getChem(indicatorSlot.chemId)!;
      const behavior = INDICATOR_BEHAVIOR[indicator.id][finalCharacter];
      indicatorLine = `${indicator.nameBn}: ${behavior.label}`;
    }

    this.result = {
      kind: 'reaction', title: reaction.nameBn, equation: reaction.equation,
      observation: reaction.observationBn + excessNote, indicatorLine, useNote: reaction.useBn, safetyNote: reaction.safetyBn,
    };

    const reactantLabel = main.map(s => this.chemLabel(s)).join(' + ') + (indicatorSlot ? ` + ${this.chemLabel(indicatorSlot)}` : '');
    this.logToNotebook(reactantLabel, reaction.equation, reaction.observationBn + excessNote);
    this.logStep({ type: 'reaction', reactionId: reaction.id, main: main.map(m => m.chemId) });
  }

  private animateBeaker(opts: { liquidFrom: string; liquidTo: string; gas: boolean | string | null; precipitate: { color: string; amount: number } | null; vigor: string; smell: string | null }) {
    this.liquidColor = opts.liquidFrom;
    this.liquidHeight = 55;
    this.bubbleCount = 0;
    this.precipitateHeight = 0;
    this.gasLabel = '';
    this.smellLabel = '';

    setTimeout(() => { this.liquidColor = opts.liquidTo; }, 150);

    const vigorCount: Record<string, number> = { none: 0, low: 4, medium: 9, high: 15 };
    this.bubbleCount = vigorCount[opts.vigor] || 0;

    if (opts.gas) this.gasLabel = `${opts.gas} ${this.i18n.isEn ? 'gas released' : 'গ্যাস নির্গত হচ্ছে'} ↑`;
    if (opts.smell === 'pungent') this.smellLabel = this.i18n.isEn ? '👃 Pungent smell' : '👃 ঝাঁঝালো গন্ধ অনুভূত হচ্ছে';
    if (opts.smell === 'vinegar') this.smellLabel = this.i18n.isEn ? '👃 Vinegar-like smell' : '👃 ভিনেগারের মতো গন্ধ';

    if (opts.precipitate) {
      const heightPct = Math.min(70, 15 + opts.precipitate.amount * 6);
      setTimeout(() => { this.precipitateColor = opts.precipitate!.color; this.precipitateHeight = heightPct; }, 400);
    }
  }

  private logStep(step: any) {
    this.stepsLog.push({ ...step, at: new Date().toISOString() });
    if (this.attemptId) {
      this.simulationService.updateAttempt(this.attemptId, { steps: this.stepsLog, mistakes: this.mistakes, hintsUsed: this.hintsUsed }).subscribe({ error: () => {} });
    }
  }

  finishAndSave() {
    if (!this.attemptId) { this.router.navigateByUrl('/subjects'); return; }
    const last = this.notebook[this.notebook.length - 1];
    const summary = last ? `${last.reactants} → ${last.equation}` : (this.i18n.isEn ? 'Lab session completed' : 'ল্যাব সেশন সম্পন্ন হয়েছে');
    this.simulationService.completeAttempt(this.attemptId, summary, { notebook: this.notebook }).subscribe({
      next: () => { alert(this.i18n.isEn ? 'Saved to your dashboard!' : 'আপনার ড্যাশবোর্ডে সংরক্ষিত হয়েছে!'); this.router.navigateByUrl('/dashboard'); },
      error: () => alert(this.i18n.isEn ? 'Could not save — please try again.' : 'সংরক্ষণ করা যায়নি — আবার চেষ্টা করুন।'),
    });
  }

  closeOverlayIfBackdrop(e: MouseEvent, which: 'notebook' | 'picker') {
    if ((e.target as HTMLElement).classList.contains(which === 'notebook' ? 'notebook-overlay' : 'picker-overlay')) {
      if (which === 'notebook') this.notebookOpen = false; else this.pickerOpen = false;
    }
  }

  private loadNotebook(): NotebookEntry[] {
    try { return JSON.parse(localStorage.getItem(NOTEBOOK_KEY) || '[]'); } catch { return []; }
  }
  private saveNotebookToStorage() { localStorage.setItem(NOTEBOOK_KEY, JSON.stringify(this.notebook)); }
  private logToNotebook(reactants: string, equation: string, observation: string) {
    this.notebook.push({ reactants, equation, observation, time: new Date().toLocaleString('bn-BD') });
    this.saveNotebookToStorage();
  }

  clearNotebook() {
    if (confirm(this.i18n.isEn ? 'Delete all records?' : 'আপনি কি নিশ্চিত সব রেকর্ড মুছে ফেলতে চান?')) {
      this.notebook = [];
      this.saveNotebookToStorage();
    }
  }

  exportNotebook() {
    let text = `${this.i18n.t('appName')} — Lab Notebook\n\n`;
    this.notebook.forEach((e, i) => { text += `${i + 1}. [${e.time}]\n${e.reactants}\n${e.equation}\n${e.observation}\n\n`; });
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'chemistry-lab-notebook.txt';
    a.click();
    URL.revokeObjectURL(a.href);
  }

  printNotebook() { window.print(); }
}
