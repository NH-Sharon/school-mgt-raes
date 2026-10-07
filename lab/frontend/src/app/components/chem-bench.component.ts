import { Component, ElementRef, OnInit, OnDestroy, ViewChild, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { CHEMICALS, PRESET_GROUPS, Chemical, getChem } from '../data/chemistry-lab-data';
import {
  Tool, Content, View, Explain, Phase, SimOpts, EMPTY_VIEW, evaluate, analyze, commitReaction, toMix, dispenseOf, toolsFor, findReactionAmong,
  SHELF_ORDER, Dispense, AMOUNT_SPEC, toNative, DROP_ML, unitOf, parseReactionText, defaultAmount,
} from '../data/chem-bench-engine';
import { HAZARD, MOLAR_MASS } from '../data/chem-bench-explain';
import { bottleSvg, toolSvg, FLAME_SVG } from '../data/chem-bench-art';
import { SimulationService } from '../services/simulation.service';
import { LabSessionService } from '../services/lab-session.service';
import { I18nService } from '../services/i18n.service';

interface Vessel {
  id: string; kind: 'tube' | 'beaker' | 'flask'; nameBn: string; nameEn: string; cap: number;
  contents: Content[]; view: View; level: number; pLevel: number; bubbleIdx: number[];
  funnel: boolean; residue: { color: string; name: string } | null; heated: boolean; label: string; lastLogged: string;
  phase: Phase; t: number; baseTemp: number; explain: Explain | null; foamIdx: number[]; flakeIdx: number[];
}
interface Geom { w: number; h: number; cx: number; top: number; bottom: number; outline: string; rim: string; inner: string; ticks: number[]; }
interface NotebookEntry { reactants: string; equation: string; observation: string; time: string; }

const HEAD = 74; // headroom above the rim (room for the funnel)
const GEOM: Record<Vessel['kind'], Geom> = {
  tube: { w: 50, h: 250, cx: 25, top: HEAD, bottom: 240,
    outline: 'M8 74 V226 A17 17 0 0 0 42 226 V74', rim: 'M4 74 H46', inner: 'M10 74 V225 A15 15 0 0 0 40 225 V74 Z', ticks: [110, 150, 190] },
  beaker: { w: 130, h: 220, cx: 65, top: HEAD, bottom: 212,
    outline: 'M12 74 V200 Q12 214 26 214 H104 Q118 214 118 200 V74', rim: 'M7 74 H123', inner: 'M14 74 V199 Q14 212 27 212 H103 Q116 212 116 199 V74 Z', ticks: [105, 135, 165, 195] },
  flask: { w: 130, h: 220, cx: 65, top: HEAD, bottom: 211,
    outline: 'M52 74 V120 L12 205 Q8 214 20 214 H110 Q122 214 118 205 L78 120 V74', rim: 'M47 74 H83', inner: 'M54 74 V121 L15 204 Q12 211 21 211 H109 Q118 211 115 204 L76 121 V74 Z', ticks: [150, 175] },
};
const NOTEBOOK_KEY = 'bdVirtualLab_chemNotebook';

const TOOLS: { tool: Tool; bn: string; en: string; hintBn: string; hintEn: string }[] = [
  { tool: 'pour', bn: 'বোতল থেকে ঢালা', en: 'Pour', hintBn: 'তরল ঢালতে', hintEn: 'pour liquids' },
  { tool: 'dropper', bn: 'ড্রপার', en: 'Dropper', hintBn: 'ফোঁটা ফোঁটা তরল/নির্দেশক', hintEn: 'add drop by drop' },
  { tool: 'spoon', bn: 'চামচ', en: 'Spoon', hintBn: 'গুঁড়া পদার্থ', hintEn: 'powders' },
  { tool: 'forceps', bn: 'চিমটা', en: 'Forceps', hintBn: 'ধাতুর টুকরা', hintEn: 'metal pieces' },
  { tool: 'transfer', bn: 'এক পাত্র থেকে অন্যটিতে ঢালা', en: 'Transfer', hintBn: 'প্রথমে উৎস, তারপর গন্তব্য', hintEn: 'source, then target' },
  { tool: 'funnel', bn: 'ফানেল + ফিল্টার', en: 'Funnel', hintBn: 'বীকার/ফ্লাস্কে বসান', hintEn: 'place on beaker/flask' },
  { tool: 'burner', bn: 'বুনসেন বার্নার', en: 'Burner', hintBn: 'গরম করতে', hintEn: 'heat' },
  { tool: 'stir', bn: 'কাচদণ্ড', en: 'Stir', hintBn: 'নাড়াতে', hintEn: 'stir' },
  { tool: 'wash', bn: 'ধুয়ে খালি করুন', en: 'Wash', hintBn: 'পাত্র খালি করতে', hintEn: 'empty a vessel' },
];

@Component({
  selector: 'app-chem-bench',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
  <div class="lab-shell">
    <div class="lab-header">
      <h2>⚗️ {{ i18n.isEn ? 'Chemistry Lab Bench' : 'রসায়ন ল্যাব বেঞ্চ' }}</h2>
      <div class="mode-row">
        <button class="mode-btn sec" [class.active]="section==='bench'" (click)="section='bench'">🧪 {{ i18n.isEn ? 'Lab bench' : 'ল্যাব বেঞ্চ' }}</button>
        <button class="mode-btn sec" [class.active]="section==='quick'" (click)="section='quick'">⌨️ {{ i18n.isEn ? 'Quick reaction' : 'লিখে বিক্রিয়া করুন' }}</button>
        <button class="mode-btn" [class.active]="mode==='guided'" (click)="mode='guided'">{{ i18n.isEn ? 'Guided' : 'গাইডেড মোড' }}</button>
        <button class="mode-btn" [class.active]="mode==='free'" (click)="mode='free'">{{ i18n.isEn ? 'Free' : 'ফ্রি মোড' }}</button>
        <button class="ghost-btn" (click)="notebookOpen = true">📓 {{ i18n.isEn ? 'Notebook' : 'ল্যাব নোটবুক' }}</button>
        <button class="ghost-btn" (click)="finishAndSave()">✅ {{ i18n.isEn ? 'Finish & Save Report' : 'সমাপ্ত করুন ও রিপোর্ট সংরক্ষণ' }}</button>
      </div>
    </div>

    <div class="layout" *ngIf="section === 'bench'">
      <!-- ============ Reagent shelves ============ -->
      <aside class="shelves">
        <div class="shelf-title">🧴 {{ i18n.isEn ? 'Reagent cabinet' : 'রাসায়নিক আলমারি' }}</div>
        <div class="shelf-row" *ngFor="let cat of shelfOrder">
          <div class="shelf-label">{{ i18n.isEn ? cat.en : cat.bn }}</div>
          <div class="shelf-board">
            <button class="bottle" *ngFor="let c of byCat(cat.key)" [attr.data-chem]="c.id"
                    [class.picked]="reagent?.id === c.id" [class.lifted]="liftedId === c.id"
                    draggable="true" (dragstart)="onDragStart($event, c)" (click)="selectReagent(c)"
                    [title]="i18n.isEn ? c.nameEn : c.nameBn">
              <span class="bottle-art" [innerHTML]="bottleHtml(c)"></span>
              <span class="bottle-name">{{ i18n.isEn ? c.nameEn : shortBn(c) }}</span>
            </button>
          </div>
        </div>
      </aside>

      <!-- ============ Bench ============ -->
      <section class="bench-col">
        <div class="hint-bar" [class.warn]="!!warning">
          <ng-container *ngIf="!warning">{{ hint() }}</ng-container>
          <ng-container *ngIf="warning">⚠️ {{ warning }}</ng-container>
        </div>

        <div class="amount-bar" *ngIf="spec() as sp">
          <span class="al">📏 {{ i18n.isEn ? 'Amount per action' : 'প্রতিবারে পরিমাণ' }}:</span>
          <input type="range" [min]="sp.min" [max]="sp.max" [step]="sp.step" [ngModel]="amtVal[tool]" (ngModelChange)="amtVal[tool] = +$event">
          <input class="anum" type="number" [min]="sp.min" [max]="sp.max" [step]="sp.step" [ngModel]="amtVal[tool]" (ngModelChange)="setAmt($event)">
          <b class="au">{{ unitLabel(sp.unit) }}</b>
          <span class="achips"><button class="chip" *ngFor="let c of sp.chips" [class.on]="amtVal[tool] === c" (click)="amtVal[tool] = c">{{ c }}</button></span>
          <span class="adim" *ngIf="sp.unit === 'drops'">≈ {{ amtVal[tool]! * dropMl | number:'1.0-2' }} mL</span>
        </div>

        <div class="bench" #bench>
          <div class="wall-shelf"><span>🧪</span><span>🔬</span><span>🧫</span></div>
          <div class="bench-row">
            <div class="rack-group">
              <div class="rack-title">{{ i18n.isEn ? 'Test-tube rack' : 'টেস্ট টিউব র‍্যাক' }}</div>
              <div class="rack">
                <ng-container *ngFor="let v of vessels">
                  <ng-container *ngIf="v.kind === 'tube'"><ng-container *ngTemplateOutlet="vesselTpl; context: { $implicit: v }"></ng-container></ng-container>
                </ng-container>
              </div>
            </div>
            <ng-container *ngFor="let v of vessels">
              <div class="solo" *ngIf="v.kind !== 'tube'"><ng-container *ngTemplateOutlet="vesselTpl; context: { $implicit: v }"></ng-container></div>
            </ng-container>
          </div>
          <div class="bench-top"></div>
          <div class="fx-layer" #fx></div>
        </div>

        <!-- ============ Tool tray ============ -->
        <div class="tray">
          <div class="tray-title">🧰 {{ i18n.isEn ? 'Equipment tray' : 'যন্ত্রপাতির ট্রে' }}
          <button class="chip tray-empty" [disabled]="busy" (click)="emptyAll()">🗑 {{ i18n.isEn ? 'Empty all vessels' : 'সব পাত্র খালি করুন' }}</button></div>
          <div class="tray-items">
            <button class="tool" *ngFor="let t of tools" [class.active]="tool === t.tool" (click)="pickTool(t.tool)">
              <span class="tool-art" [innerHTML]="toolHtml(t.tool)"></span>
              <span class="tool-name">{{ i18n.isEn ? t.en : t.bn }}</span>
              <span class="tool-hint">{{ i18n.isEn ? t.hintEn : t.hintBn }}</span>
            </button>
          </div>
        </div>
      </section>

      <!-- ============ Side panel ============ -->
      <aside class="side">
        <div class="panel obs">
          <h3>🔍 {{ i18n.isEn ? 'Observation' : 'পর্যবেক্ষণ' }} <small *ngIf="activeVessel() as av">— {{ i18n.isEn ? av.nameEn : av.nameBn }}</small></h3>
          <ng-container *ngIf="activeVessel() as av">
            <div class="react-bar">
              <button class="react-btn" [disabled]="busy || av.phase === 'reacting' || !av.contents.length" (click)="startReaction(av)">
                ⚗️ {{ av.phase === 'reacting' ? (i18n.isEn ? 'Reacting…' : 'বিক্রিয়া চলছে…') : (i18n.isEn ? 'Start reaction' : 'বিক্রিয়া ঘটান') }}
              </button>
              <div class="temp-chip" *ngIf="av.contents.length">🌡️ {{ av.view.temp | number:'1.0-0' }}°C</div>
            </div>
            <div class="timebox" *ngIf="av.phase === 'reacting'">
              <div class="pbar"><div class="pfill" [style.width.%]="av.view.progress * 100"></div></div>
              <div class="tline">
                <span>⏱ {{ av.t | number:'1.0-0' }}s / ≈{{ av.view.tTotal | number:'1.0-0' }}s</span>
                <span>{{ av.view.progress * 100 | number:'1.0-0' }}%</span>
                <span *ngIf="av.view.gasMl > 0.05">💨 {{ av.view.gasMl | number:'1.0-0' }} mL</span>
              </div>
              <div class="tctrl">
                <span class="tl">{{ i18n.isEn ? 'Time-lapse' : 'সময়ের গতি' }}</span>
                <button *ngFor="let s of timeScales" class="chip" [class.on]="timeScale === s" (click)="timeScale = s">{{ s }}×</button>
                <button class="chip" (click)="paused = !paused">{{ paused ? '▶' : '⏸' }}</button>
                <button class="chip" (click)="skipToEnd(av)">⏭ {{ i18n.isEn ? 'Finish' : 'শেষ' }}</button>
              </div>
            </div>
            <ng-container *ngTemplateOutlet="resultTpl; context: { rv: av.view, ex: av.view.explain || av.explain, v: av }"></ng-container>
          </ng-container>
        </div>

        <div class="panel guided" *ngIf="mode === 'guided' && guidedSteps.length">
          <h3>🧭 {{ i18n.t('step') }} {{ currentStep + 1 }} / {{ guidedSteps.length }}</h3>
          <p>{{ i18n.isEn ? guidedSteps[currentStep].instruction_en : guidedSteps[currentStep].instruction_bn }}</p>
          <p class="dim" *ngIf="guidedSteps[currentStep].hint_en">💡 {{ i18n.isEn ? guidedSteps[currentStep].hint_en : guidedSteps[currentStep].hint_bn }}</p>
          <div class="nav">
            <button class="ghost-btn" (click)="currentStep = currentStep - 1" [disabled]="currentStep === 0">‹</button>
            <button class="ghost-btn" (click)="currentStep = currentStep + 1" [disabled]="currentStep === guidedSteps.length - 1">›</button>
          </div>
        </div>

        <div class="panel presets" *ngIf="mode === 'guided'">
          <h3>🎬 {{ i18n.isEn ? 'Watch an experiment (auto-demo in Test tube 1)' : 'পরীক্ষা দেখুন (টেস্ট টিউব ১-এ স্বয়ংক্রিয় ডেমো)' }}</h3>
          <div class="pg" *ngFor="let g of presetGroups">
            <div class="pg-h"><span class="lvl">{{ g.level }}</span>{{ g.titleBn }}</div>
            <button class="preset-btn" *ngFor="let it of g.items" [disabled]="busy" (click)="runPreset(it.slots)">{{ it.labelBn }}</button>
          </div>
        </div>
      </aside>
    </div>
  </div>

  <!-- Quick reaction menu: write a reaction, give amounts, read the full result (no pouring animation) -->
  <div class="lab-shell q-shell" *ngIf="section === 'quick'">
    <div class="quick">
      <div class="panel q-in">
        <h3>⌨️ {{ i18n.isEn ? 'Write a reaction' : 'বিক্রিয়া লিখুন' }}</h3>
        <p class="dim">যেমন: <b>HCl + NaOH</b>, <b>Zn + HCl</b>, <b>NaOH + ফেনলফথ্যালিন</b>। সূত্র, ইংরেজি বা বাংলা নাম — যেকোনোটি লেখা যায়।</p>
        <div class="q-text">
          <input type="text" [(ngModel)]="qText" (keyup.enter)="qParse()" placeholder="HCl + NaOH + phenolphthalein">
          <button class="react-btn small" (click)="qParse()">🔎 {{ i18n.isEn ? 'Detect' : 'শনাক্ত করুন' }}</button>
        </div>
        <div class="q-ex"><button class="chip" *ngFor="let e of qExamples" (click)="qText = e; qParse()">{{ e }}</button></div>
        <div class="q-rows">
          <div class="q-row" *ngFor="let r of qRows; let i = index">
            <select [(ngModel)]="r.chemId" (ngModelChange)="qChanged(r)">
              <optgroup *ngFor="let cat of shelfOrder" [label]="i18n.isEn ? cat.en : cat.bn">
                <option *ngFor="let c of byCat(cat.key)" [value]="c.id">{{ c.formula !== '—' ? c.formula + ' — ' : '' }}{{ i18n.isEn ? c.nameEn : c.nameBn }}</option>
              </optgroup>
            </select>
            <input type="number" min="0" step="any" [(ngModel)]="r.value">
            <span class="unit">{{ rowUnit(r) }}</span>
            <button class="chip" (click)="qRemove(i)" title="remove">✕</button>
          </div>
        </div>
        <button class="ghost-btn" (click)="qAdd()">＋ {{ i18n.isEn ? 'Add chemical' : 'রাসায়নিক যোগ করুন' }}</button>
        <div class="q-opts">
          <label>{{ i18n.isEn ? 'Vessel' : 'পাত্র' }}:
            <select [(ngModel)]="qCap"><option [ngValue]="20">টেস্ট টিউব (২০ mL)</option><option [ngValue]="100">বীকার (১০০ mL)</option></select></label>
          <label><input type="checkbox" [(ngModel)]="qHeat"> 🔥 {{ i18n.isEn ? 'Heat on burner (~70 °C)' : 'বার্নারে গরম করে (~৭০°C)' }}</label>
        </div>
        <div class="q-actions">
          <button class="react-btn" (click)="qRun()">⚗️ {{ i18n.isEn ? 'React & show result' : 'বিক্রিয়া ঘটান ও ফলাফল দেখুন' }}</button>
          <button class="ghost-btn" (click)="qToBench()">🧪 {{ i18n.isEn ? 'Watch it on the bench' : 'বেঞ্চে এনিমেশনে দেখুন' }}</button>
        </div>
        <p class="dim" *ngIf="qMsg">⚠️ {{ qMsg }}</p>
      </div>
      <div class="panel q-out">
        <h3>📋 {{ i18n.isEn ? 'Result' : 'ফলাফল' }}</h3>
        <p class="dim" *ngIf="!qView">{{ i18n.isEn ? 'Enter amounts and press the button — the full explanation appears here.' : 'পরিমাণ দিয়ে বোতাম চাপুন — এখানে সম্পূর্ণ ব্যাখ্যা আসবে।' }}</p>
        <ng-container *ngIf="qView"><ng-container *ngTemplateOutlet="resultTpl; context: { rv: qView, ex: qView.explain, v: null }"></ng-container></ng-container>
      </div>
    </div>
  </div>

  <!-- shared result / explanation block -->
  <ng-template #resultTpl let-rv="rv" let-ex="ex" let-vv="v">
    <div class="risks" *ngIf="rv.risks.length">
      <div class="risk" *ngFor="let r of rv.risks" [ngClass]="r.level">{{ r.text }}</div>
    </div>
    <table class="ctable" *ngIf="rv.rows.length">
      <thead><tr><th>{{ i18n.isEn ? 'Ingredient' : 'উপাদান' }}</th><th>{{ i18n.isEn ? 'Amount' : 'পরিমাণ' }}</th><th>{{ i18n.isEn ? 'Moles' : 'মোল' }}</th></tr></thead>
      <tbody><tr *ngFor="let r of rv.rows"><td>{{ r.name }} <small>{{ r.formula }}</small></td><td>{{ r.amount }}</td><td>{{ r.mol }}</td></tr></tbody>
    </table>
    <p class="dim" *ngIf="!rv.rows.length">{{ i18n.isEn ? 'This vessel is empty.' : 'পাত্রটি খালি। আলমারি থেকে রাসায়নিক নিয়ে এতে যোগ করুন।' }}</p>
    <p class="dim" *ngIf="!ex && rv.rows.length && vv">{{ i18n.isEn ? 'Nothing has reacted yet — press “Start reaction” when you are ready.' : 'এখনও বিক্রিয়া শুরু হয়নি — প্রস্তুত হলে "বিক্রিয়া ঘটান" চাপুন।' }}</p>
    <ng-container *ngIf="ex">
      <h4 class="r-title" [class.bad]="ex.kind === 'no-reaction' || ex.kind === 'unmodelled' || ex.kind === 'incomplete'">
        {{ ex.kind === 'reaction' ? '✅' : ex.kind === 'indicator' ? '🎨' : ex.kind === 'unmodelled' ? '❔' : '❌' }} {{ ex.title }}</h4>
      <div class="r-eq" *ngIf="ex.equation">{{ ex.equation }}</div>
      <div class="r-eq ion" *ngIf="ex.ionic && ex.kind === 'reaction'">{{ i18n.isEn ? 'Ionic' : 'আয়নিক' }}: {{ ex.ionic }}</div>
      <details class="sec" open><summary>👁️ {{ i18n.isEn ? 'What is happening' : 'কী ঘটছে' }}</summary>
        <p *ngFor="let t of ex.what">{{ t }}</p>
        <p class="gas" *ngIf="rv.gas">💨 {{ rv.gas }}</p>
        <p class="gas" *ngIf="rv.smell">{{ rv.smell }}</p>
        <p class="gas" *ngIf="rv.warm">🌡️ {{ i18n.isEn ? 'The vessel is warming up (exothermic).' : 'পাত্রটি গরম হচ্ছে (তাপ উৎপাদী)।' }}</p>
      </details>
      <details class="sec" open><summary>❓ {{ ex.kind === 'reaction' || ex.kind === 'indicator' ? (i18n.isEn ? 'Why it happens' : 'কেন হচ্ছে') : (i18n.isEn ? 'Why it did NOT react' : 'কেন বিক্রিয়া হলো না') }}</summary>
        <p *ngFor="let t of ex.why">• {{ t }}</p></details>
      <details class="sec" open><summary>🔬 {{ i18n.isEn ? 'How it happens' : 'কীভাবে হচ্ছে' }}</summary>
        <p *ngFor="let t of ex.how; let i = index">{{ i + 1 }}. {{ t }}</p></details>
      <details class="sec" open *ngIf="ex.qty.length"><summary>⚖️ {{ i18n.isEn ? 'Quantity calculation' : 'পরিমাণের হিসাব' }}</summary>
        <p *ngFor="let t of ex.qty">{{ t }}</p></details>
      <details class="sec" open *ngIf="ex.time.length"><summary>⏱️ {{ i18n.isEn ? 'Time & temperature' : 'সময় ও তাপমাত্রা' }}</summary>
        <p *ngFor="let t of ex.time">{{ t }}</p></details>
      <p class="use" *ngIf="ex.use">💡 <b>{{ i18n.isEn ? 'Use:' : 'ব্যবহার:' }}</b> {{ ex.use }}</p>
      <p class="safety" *ngIf="ex.safety"><b>⚠️ {{ i18n.isEn ? 'Safety:' : 'নিরাপত্তা:' }}</b> {{ ex.safety }}</p>
    </ng-container>
  </ng-template>

  <!-- Vessel template -->
  <ng-template #vesselTpl let-v>
    <div class="vessel" [class.active]="activeId === v.id" [class.src]="transferSrc === v.id" [class.hot]="v.view.temp > 45" [attr.data-vessel]="v.id"
         (click)="onVesselClick(v)" (dragover)="$event.preventDefault()" (drop)="onDrop($event, v)">
      <svg class="vsvg" [attr.viewBox]="'0 0 ' + G[v.kind].w + ' ' + G[v.kind].h" [style.width.px]="G[v.kind].w * (v.kind === 'tube' ? 1.25 : 1.35)">
        <defs><clipPath [attr.id]="'clip-' + v.id"><path [attr.d]="G[v.kind].inner"/></clipPath></defs>
        <g [attr.clip-path]="'url(#clip-' + v.id + ')'">
          <rect class="liq" x="0" [attr.y]="G[v.kind].top" [attr.width]="G[v.kind].w" [attr.height]="G[v.kind].bottom - G[v.kind].top"
                [style.fill]="disp(v.view.color)" [style.fill-opacity]="lop(v)" [style.transform]="'scaleY(' + v.level + ')'" />
          <rect class="liq susp" x="0" [attr.y]="G[v.kind].top" [attr.width]="G[v.kind].w" [attr.height]="G[v.kind].bottom - G[v.kind].top"
                [style.fill]="v.view.precip ? v.view.precip.color : 'transparent'" [style.opacity]="v.view.suspension" [style.transform]="'scaleY(' + v.level + ')'" />
          <circle *ngFor="let f of v.flakeIdx" class="flake" [attr.cx]="G[v.kind].cx - 10 + (f * 7) % 21" [attr.cy]="surfY(v) + 3" r="1.6"
                  [style.fill]="v.view.precip ? v.view.precip.color : '#fff'" [style.animation-delay.s]="(f % 6) * 0.33" [style.--drop.px]="(G[v.kind].bottom - G[v.kind].top) * v.level - 10" />
          <rect class="liq pre" x="0" [attr.y]="G[v.kind].top" [attr.width]="G[v.kind].w" [attr.height]="G[v.kind].bottom - G[v.kind].top"
                [style.fill]="v.view.precip ? v.view.precip.color : 'transparent'" [style.transform]="'scaleY(' + v.pLevel + ')'" />
          <g *ngFor="let s of v.view.solids; let si = index" class="solid" [style.opacity]="0.15 + s.remaining * 0.85">
            <g *ngIf="isPowder(s.id)">
              <circle *ngFor="let n of piece(s.count * 6)" [attr.cx]="G[v.kind].cx - 17 + (n * 7 + si * 5) % 34" [attr.cy]="G[v.kind].bottom - 3 - (n % 3) * 3.2 - (n % 2)"
                      [attr.r]="2.1 + (n % 2) * .8" [attr.fill]="s.color" stroke="rgba(0,0,0,.22)" stroke-width=".5"/>
            </g>
            <g *ngIf="!isPowder(s.id)">
              <rect *ngFor="let n of piece(s.count)" [attr.x]="G[v.kind].cx - 16 + n * 7 + si * 3" [attr.y]="G[v.kind].bottom - 8 - (n % 2) * 4"
                    width="5" height="14" rx="1.5" [attr.fill]="s.color" stroke="rgba(0,0,0,.3)" stroke-width=".6"
                    [attr.transform]="'rotate(' + (n % 2 ? 18 : -14) + ' ' + (G[v.kind].cx - 14 + n * 7) + ' ' + (G[v.kind].bottom - 4) + ')'" />
              <circle *ngFor="let d of piece(dep(s))" [attr.cx]="G[v.kind].cx - 15 + (d * 5) % 28" [attr.cy]="G[v.kind].bottom - 3 - (d * 3) % 13" [attr.r]="1.5 + (d % 2) * .6"
                      [attr.fill]="s.depositColor" stroke="rgba(0,0,0,.25)" stroke-width=".4"/>
              <g *ngIf="s.tree && s.deposit > 0.05" class="tree" [style.transform]="'scale(' + s.deposit + ')'">
                <path [attr.d]="'M' + (G[v.kind].cx - 8) + ' ' + (G[v.kind].bottom - 8) + ' l-4 -14 m4 14 l3 -20 m-3 6 l-6 -6 m9 0 l5 -9 M' + (G[v.kind].cx + 2) + ' ' + (G[v.kind].bottom - 8) + ' l5 -16 m-5 6 l-5 -6 m5 6 l7 -5'"
                      stroke="#e9eef2" stroke-width="1.3" fill="none" stroke-linecap="round"/>
              </g>
            </g>
          </g>
          <circle *ngFor="let f of v.foamIdx" class="foam" [attr.cx]="G[v.kind].cx - 13 + (f * 9) % 27" [attr.cy]="surfY(v) + 2 - (f % 3) * 2" [attr.r]="2.6 + (f % 3)"/>
          <circle *ngFor="let b of v.bubbleIdx" class="bubble" [attr.cx]="G[v.kind].cx - 11 + (b * 7) % 23" [attr.cy]="G[v.kind].bottom - 8"
                  [attr.r]="2.2 + (b % 3)" [style.animation-delay.s]="(b % 7) * 0.17" [style.--rise.px]="(G[v.kind].bottom - G[v.kind].top) * v.level - 4" />
        </g>
        <path [attr.d]="G[v.kind].inner" fill="rgba(200,230,245,0.10)" stroke="none"/>
        <path [attr.d]="G[v.kind].outline" fill="none" stroke="rgba(235,248,255,.95)" stroke-width="2.4" stroke-linecap="round"/>
        <path [attr.d]="G[v.kind].rim" fill="none" stroke="rgba(235,248,255,.95)" stroke-width="3" stroke-linecap="round"/>
        <path *ngFor="let t of G[v.kind].ticks" [attr.d]="'M' + (v.kind === 'tube' ? 13 : 16) + ' ' + t + ' h8'" stroke="rgba(255,255,255,.55)" stroke-width="1.2"/>
        <path [attr.d]="v.kind === 'tube' ? 'M14 96 V215' : 'M22 90 V170'" stroke="rgba(255,255,255,.55)" stroke-width="2.4" stroke-linecap="round" fill="none"/>
        <g *ngIf="v.view.fumes" class="fumes">
          <circle *ngFor="let f of fumeIdx" class="fume" [ngClass]="v.view.fumes" [attr.cx]="G[v.kind].cx - 12 + f * 4.5" [attr.cy]="G[v.kind].top - 2" r="6"
                  [style.animation-delay.s]="f * 0.5"/>
        </g>
        <g *ngIf="v.funnel" class="funnel-g">
          <path d="M22 14 H108 L74 66 V92 H56 V66 Z" fill="rgba(190,225,240,.35)" stroke="rgba(235,248,255,.95)" stroke-width="2.4"/>
          <path d="M32 20 L65 64 L98 20 Z" fill="#fffdf6" stroke="#b9ae91" stroke-width="1.2" stroke-dasharray="3 2"/>
          <path *ngIf="v.residue" d="M40 28 L65 62 L90 28 Z" [attr.fill]="v.residue.color" stroke="#8d8466" stroke-width="1" opacity=".95"/>
          <circle class="drip" *ngIf="dripId === v.id" cx="65" cy="94" r="2.4" [style.fill]="disp(v.view.color)"/>
        </g>
      </svg>
      <div class="thermo" *ngIf="v.contents.length && (activeId === v.id || v.view.temp > 30)" [class.hot]="v.view.temp > 45" title="তাপমাত্রা">
        <div class="th-tube"><div class="th-hg" [style.height.%]="tpct(v)"></div></div>
        <span class="th-val">{{ v.view.temp | number:'1.0-0' }}°</span>
      </div>
      <div class="burner-slot"><span class="burner" *ngIf="v.heated" [innerHTML]="flameHtml"></span></div>
      <div class="v-foot">
      <div class="v-name">{{ i18n.isEn ? v.nameEn : v.nameBn }}</div>
      <div class="v-chips">{{ v.label || (i18n.isEn ? 'empty' : 'খালি') }}</div>
      <div class="v-phase" *ngIf="v.phase === 'reacting'"><div class="pfill" [style.width.%]="v.view.progress * 100"></div></div>
      <button class="v-empty" *ngIf="v.contents.length || v.funnel" [disabled]="busy" (click)="$event.stopPropagation(); emptyVessel(v)">🗑 {{ i18n.isEn ? 'Empty' : 'খালি করুন' }}</button>
      <button class="v-react" *ngIf="v.contents.length && v.phase !== 'reacting'" [class.again]="v.phase === 'settled'" (click)="$event.stopPropagation(); activeId = v.id; startReaction(v)" [disabled]="busy">
        ⚗️ {{ v.phase === 'settled' ? (i18n.isEn ? 'Re-run' : 'আবার') : (i18n.isEn ? 'React' : 'বিক্রিয়া') }}
      </button>
      </div>
    </div>
  </ng-template>

  <!-- Notebook -->
  <div class="notebook-overlay" [class.open]="notebookOpen" (click)="closeNotebook($event)">
    <div class="notebook-panel">
      <div class="nb-h"><h2>📓 {{ i18n.isEn ? 'Lab Notebook' : 'ল্যাব নোটবুক' }}</h2><button class="ghost-btn" (click)="notebookOpen = false">✕</button></div>
      <div class="nb-a">
        <button class="ghost-btn" (click)="exportNotebook()">⬇️ {{ i18n.isEn ? 'Download (.txt)' : 'ডাউনলোড (.txt)' }}</button>
        <button class="ghost-btn" (click)="printNb()">🖨️ {{ i18n.isEn ? 'Print' : 'প্রিন্ট করুন' }}</button>
        <button class="ghost-btn danger" (click)="clearNotebook()">🗑️ {{ i18n.isEn ? 'Clear' : 'মুছে ফেলুন' }}</button>
      </div>
      <table class="nb-t">
        <thead><tr><th>#</th><th>{{ i18n.isEn ? 'Reactants' : 'বিক্রিয়াকারী' }}</th><th>{{ i18n.isEn ? 'Equation' : 'সমীকরণ' }}</th><th>{{ i18n.isEn ? 'Observation' : 'পর্যবেক্ষণ' }}</th></tr></thead>
        <tbody><tr *ngFor="let e of notebook; let i = index"><td>{{ i + 1 }}</td><td>{{ e.reactants }}</td><td>{{ e.equation }}</td><td>{{ e.observation }}</td></tr></tbody>
      </table>
      <p class="dim" *ngIf="!notebook.length">{{ i18n.isEn ? 'No experiments recorded yet.' : 'এখনো কোনো পরীক্ষা রেকর্ড করা হয়নি।' }}</p>
    </div>
  </div>
  `,
  styles: [`
    :host { display: block; --wood1: #b98b5a; --wood2: #9a6f43; --ink: #22323b; }
    .lab-shell { max-width: 1500px; margin: 0 auto; padding: 14px; font-family: 'Noto Sans Bengali','Noto Sans',sans-serif; color: var(--ink); }
    .lab-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; margin-bottom: 10px; }
    .lab-header h2 { margin: 0; color: #1a6d5e; }
    .mode-row { display: flex; gap: 8px; flex-wrap: wrap; }
    .mode-btn { padding: 7px 14px; border-radius: 999px; border: 1px solid #cfd9dd; background: #fff; font-size: .82rem; cursor: pointer; }
    .mode-btn.active { background: #1a6d5e; color: #fff; border-color: #1a6d5e; }
    .ghost-btn { background: #fff; border: 1px solid #cfd9dd; color: #33454f; padding: 7px 12px; border-radius: 8px; font-size: .82rem; cursor: pointer; }
    .ghost-btn:disabled { opacity: .4; cursor: default; }
    .ghost-btn.danger:hover { border-color: #e0645c; color: #e0645c; }
    .dim { color: #6b7a84; font-size: .85rem; }

    .layout { display: grid; grid-template-columns: 250px minmax(0, 1fr) 380px; gap: 14px; align-items: start; }
    @media (max-width: 1150px) { .layout { grid-template-columns: 220px minmax(0, 1fr); } .side { grid-column: 1 / -1; } }
    @media (max-width: 760px) { .layout { grid-template-columns: 1fr; } }

    /* shelves */
    .shelves { background: linear-gradient(#2b3a46, #22303a); border-radius: 14px; padding: 12px 10px; color: #e8eef4; box-shadow: 0 6px 18px rgba(20,40,40,.18); }
    .shelf-title { font-weight: 700; margin-bottom: 8px; }
    .shelf-row { margin-bottom: 6px; }
    .shelf-label { font-size: .72rem; letter-spacing: .04em; color: #9fb7c4; margin: 4px 4px 2px; font-weight: 700; text-transform: uppercase; }
    .shelf-board { display: flex; flex-wrap: wrap; gap: 4px 6px; padding: 6px 6px 8px; border-bottom: 7px solid var(--wood2); background: rgba(255,255,255,.03); border-radius: 6px 6px 0 0; }
    .bottle { all: unset; cursor: grab; width: 58px; display: flex; flex-direction: column; align-items: center; text-align: center; border-radius: 8px; padding: 2px; transition: transform .15s, background .15s; }
    .bottle:hover { transform: translateY(-3px); background: rgba(255,255,255,.07); }
    .bottle.picked { background: rgba(55,194,181,.28); outline: 2px solid #37c2b5; transform: translateY(-5px); }
    .bottle.lifted { opacity: .25; }
    .bottle-art { display: block; width: 44px; }
    .bottle-art ::ng-deep svg { width: 100%; height: auto; display: block; }
    .bottle-name { font-size: .62rem; line-height: 1.15; color: #cfe0ea; margin-top: 1px; max-width: 58px; }
    @media (max-width: 760px) { .shelves { max-height: 300px; overflow-y: auto; } .bench-col { order: -1; } .shelf-board { flex-wrap: nowrap; overflow-x: auto; } .bottle { flex: 0 0 58px; } }

    /* bench */
    .hint-bar { background: #e7f5f2; border: 1px solid #b8e0d8; color: #14544a; padding: 8px 12px; border-radius: 10px; font-size: .88rem; margin-bottom: 8px; min-height: 20px; }
    .hint-bar.warn { background: #fff3dc; border-color: #f0c777; color: #7a4f00; }
    .bench { position: relative; border-radius: 14px 14px 0 0; padding: 18px 12px 0; background: linear-gradient(#e8eff1 0%, #dfe8ea 70%, #d3dde0 100%); overflow: visible; }
    .wall-shelf { position: absolute; right: 18px; top: 8px; display: flex; gap: 10px; font-size: 1.3rem; opacity: .5; }
    .bench-row { display: flex; align-items: flex-end; justify-content: space-around; flex-wrap: wrap; gap: 6px 14px; min-height: 360px; padding-bottom: 6px; }
    .bench-top { height: 26px; margin: 0 -12px; background: linear-gradient(var(--wood1), var(--wood2)); border-top: 3px solid #cfa578; box-shadow: 0 6px 12px rgba(0,0,0,.18); border-radius: 0 0 6px 6px; }
    .rack-group { display: flex; flex-direction: column; align-items: center; }
    .rack-title { font-size: .7rem; color: #5b6b74; margin-bottom: 2px; }
    .rack { display: flex; gap: 8px; align-items: flex-end; padding: 0 8px; position: relative; }
    .rack::after { content: ''; position: absolute; left: 0; right: 0; top: 120px; height: 10px; background: linear-gradient(#c79a68, #8b6338); border-radius: 4px; pointer-events: none; opacity: .9; }
    .solo { display: flex; }
    .vessel { display: flex; flex-direction: column; align-items: center; cursor: pointer; position: relative; border-radius: 10px; padding: 0 2px; transition: background .2s; }
    .vessel:hover { background: rgba(55,194,181,.10); }
    .vessel.active { background: rgba(55,194,181,.16); box-shadow: 0 0 0 2px rgba(55,194,181,.55); }
    .vessel.src { box-shadow: 0 0 0 3px #f0a53e; }
    .vsvg { display: block; height: auto; max-width: 100%; overflow: visible; filter: drop-shadow(0 3px 3px rgba(0,0,0,.12)); }
    .liq { transform-box: fill-box; transform-origin: 50% 100%; transition: transform 1s cubic-bezier(.4,0,.2,1), fill 1.1s ease; }
    .liq.pre { transition: transform 1.6s ease .4s, fill 1s ease; }
    .solid { transition: opacity 2.2s ease; }
    .bubble { fill: rgba(255,255,255,.75); stroke: rgba(255,255,255,.9); stroke-width: .5; animation: rise 1.3s linear infinite; opacity: 0; }
    @keyframes rise { 0% { transform: translateY(0); opacity: 0; } 12% { opacity: .95; } 100% { transform: translateY(calc(var(--rise, 60px) * -1)); opacity: .1; } }
    .drip { animation: drip .9s ease-in infinite; }
    @keyframes drip { from { transform: translateY(0); opacity: 1; } to { transform: translateY(70px); opacity: .6; } }
    .vessel.splash .vsvg { animation: splash .45s ease; }
    @keyframes splash { 30% { transform: translateY(2px) scale(1.012); } }
    .vessel.shake .vsvg { animation: shake .5s ease; }
    @keyframes shake { 20% { transform: translateX(-3px) rotate(-1.5deg); } 50% { transform: translateX(3px) rotate(1.5deg); } 80% { transform: translateX(-2px); } }
    .burner-slot { height: 72px; width: 60px; display: flex; align-items: flex-end; justify-content: center; margin-top: -2px; }
    .burner { display: block; width: 52px; }
    .burner ::ng-deep svg { width: 100%; height: auto; display: block; }
    .burner ::ng-deep .flame-art path:nth-child(1), .burner ::ng-deep .flame-art path:nth-child(2) { transform-origin: 30px 46px; animation: flicker .35s ease-in-out infinite alternate; }
    @keyframes flicker { from { transform: scale(1, .92) skewX(-3deg); } to { transform: scale(1.06, 1.05) skewX(3deg); } }
    .v-foot { min-height: 112px; display: flex; flex-direction: column; align-items: center; }
    .v-name { font-size: .78rem; font-weight: 700; color: #33454f; }
    .v-chips { font-size: .66rem; color: #6b7a84; max-width: 150px; text-align: center; min-height: 14px; line-height: 1.2; }

    .fx-layer { position: absolute; inset: 0; pointer-events: none; z-index: 30; overflow: visible; }
    :host ::ng-deep .actor { position: absolute; left: 0; top: 0; will-change: transform; filter: drop-shadow(0 6px 5px rgba(0,0,0,.25)); transform-origin: 50% 50%; }
    :host ::ng-deep .actor svg { width: 100%; height: 100%; display: block; }
    :host ::ng-deep .stream { position: absolute; width: 5px; border-radius: 3px; transform-origin: top; }
    :host ::ng-deep .drop { position: absolute; width: 8px; height: 11px; border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%; }
    :host ::ng-deep .grain { position: absolute; width: 5px; height: 5px; border-radius: 1px; }

    /* tray */
    .tray { background: linear-gradient(#3a4a56, #2b3a46); border-radius: 0 0 14px 14px; padding: 10px 12px 12px; color: #e8eef4; }
    .tray-title { font-size: .8rem; font-weight: 700; margin-bottom: 8px; color: #cfe0ea; }
    .tray-items { display: grid; grid-template-columns: repeat(auto-fill, minmax(88px, 1fr)); gap: 8px; }
    .tool { all: unset; cursor: pointer; background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.1); border-radius: 10px; padding: 6px 4px 5px; display: flex; flex-direction: column; align-items: center; text-align: center; transition: .15s; }
    .tool:hover { background: rgba(255,255,255,.12); }
    .tool.active { background: rgba(55,194,181,.3); border-color: #37c2b5; box-shadow: 0 0 0 2px rgba(55,194,181,.4); }
    .tool-art { display: block; height: 52px; width: 56px; }
    .tool-art ::ng-deep svg { width: 100%; height: 100%; }
    .tool-name { font-size: .72rem; font-weight: 700; margin-top: 2px; }
    .tool-hint { font-size: .6rem; color: #9fb7c4; line-height: 1.15; }

    /* side */
    .side { display: flex; flex-direction: column; gap: 12px; }
    .panel { background: #fff; border: 1px solid #e2e8ec; border-radius: 12px; padding: 12px 14px; box-shadow: 0 1px 2px rgba(20,40,40,.06); }
    .panel h3 { margin: 0 0 8px; font-size: .92rem; color: #1a6d5e; }
    .panel h3 small { color: #6b7a84; font-weight: 500; }
    .panel p { margin: 6px 0; font-size: .86rem; line-height: 1.5; }
    .contents { font-size: .78rem; color: #6b7a84; background: #f2f6f5; border-radius: 6px; padding: 4px 8px; }
    .r-title { margin: 8px 0 4px; font-size: .95rem; }
    .r-eq { font-family: 'Cambria Math', 'STIX Two Math', serif; background: #eef6f4; border-left: 3px solid #1a6d5e; padding: 6px 10px; border-radius: 4px; font-size: .95rem; }
    .safety { color: #8a4b00; background: #fff6e6; padding: 6px 8px; border-radius: 6px; }
    .gas { font-weight: 600; color: #1a6d5e; }
    .nav { display: flex; gap: 8px; }
    .pg { margin-bottom: 8px; }
    .pg-h { font-size: .74rem; font-weight: 700; color: #33454f; margin-bottom: 4px; }
    .lvl { background: #1a6d5e; color: #fff; border-radius: 999px; padding: 1px 7px; margin-right: 6px; font-size: .66rem; }
    .preset-btn { display: block; width: 100%; text-align: left; background: #f6faf9; border: 1px solid #dbe6e3; border-radius: 8px; padding: 6px 9px; margin-bottom: 4px; font-size: .78rem; cursor: pointer; }
    .preset-btn:hover:not(:disabled) { border-color: #37c2b5; background: #eef9f7; }
    .preset-btn:disabled { opacity: .5; cursor: default; }

    .notebook-overlay { position: fixed; inset: 0; background: rgba(10,20,25,.55); display: none; align-items: center; justify-content: center; padding: 16px; z-index: 100; }
    .notebook-overlay.open { display: flex; }
    .notebook-panel { background: #fff; border-radius: 14px; padding: 18px; width: 100%; max-width: 760px; max-height: 85vh; overflow-y: auto; }
    .nb-h { display: flex; justify-content: space-between; align-items: center; }
    .nb-a { display: flex; gap: 8px; margin: 10px 0; flex-wrap: wrap; }
    .nb-t { width: 100%; border-collapse: collapse; font-size: .82rem; }
    .nb-t th, .nb-t td { border: 1px solid #e2e8ec; padding: 7px; text-align: left; vertical-align: top; }

    .liq.pre { transition: transform 5s ease .3s, fill 1s ease; }
    .liq.susp { transition: opacity 6s ease, transform 1s ease; }
    .flake { animation: flake 2.4s linear infinite; opacity: 0; }
    @keyframes flake { 0% { transform: translateY(0); opacity: .9; } 100% { transform: translateY(var(--drop, 50px)); opacity: .9; } }
    .foam { fill: rgba(255,255,255,.88); stroke: rgba(180,200,210,.8); stroke-width: .5; }
    .fume { animation: fume 3.2s ease-out infinite; opacity: 0; transform-box: fill-box; transform-origin: center; }
    .fume.steam { fill: rgba(245,248,250,.8); }
    .fume.white { fill: rgba(255,255,255,.92); }
    .fume.pungent { fill: rgba(205,225,200,.6); }
    @keyframes fume { 0% { transform: translateY(0) scale(.5); opacity: 0; } 20% { opacity: .85; } 100% { transform: translateY(-62px) translateX(8px) scale(2.2); opacity: 0; } }
    .tree { transform-box: fill-box; transform-origin: 50% 100%; transition: transform 1s ease; }
    .thermo { position: absolute; right: -14px; top: 78px; display: flex; flex-direction: column; align-items: center; gap: 2px; pointer-events: none; }
    .th-tube { width: 7px; height: 92px; border: 1.5px solid #8aa0ab; border-radius: 5px; background: rgba(255,255,255,.7); display: flex; align-items: flex-end; overflow: hidden; }
    .th-hg { width: 100%; background: #d33; transition: height .4s ease; }
    .thermo.hot .th-hg { background: #ff4a1c; }
    .th-val { font-size: .62rem; font-weight: 700; color: #33454f; }
    .vessel.hot .vsvg { filter: drop-shadow(0 0 7px rgba(255,120,80,.6)); }
    .v-empty { margin-top: 3px; background: #fff; color: #a8321f; border: 1px solid #e3b4ac; border-radius: 999px; padding: 2px 9px; font-size: .7rem; cursor: pointer; }
    .v-empty:hover:not(:disabled) { background: #fdecea; }
    .v-empty:disabled { opacity: .5; }
    .tray-empty { float: right; background: #fff3f0; border-color: #e3b4ac; color: #a8321f; }
    .mode-btn.sec { border-color: #1a6d5e; color: #1a6d5e; font-weight: 600; }
    .mode-btn.sec.active { background: #1a6d5e; color: #fff; }
    .chip { background: #f2f6f5; border: 1px solid #d3dedb; border-radius: 999px; padding: 3px 10px; font-size: .75rem; cursor: pointer; color: #33454f; }
    .chip.on { background: #1a6d5e; color: #fff; border-color: #1a6d5e; }
    .amount-bar { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; background: #fff; border: 1px solid #cfe3de; border-radius: 10px; padding: 7px 12px; margin-bottom: 8px; font-size: .85rem; }
    .amount-bar .al { font-weight: 700; color: #1a6d5e; }
    .amount-bar input[type=range] { flex: 1 1 140px; min-width: 110px; accent-color: #1a6d5e; }
    .anum { width: 70px; padding: 4px 6px; border: 1px solid #cfd9dd; border-radius: 6px; font-size: .9rem; }
    .au { color: #1a6d5e; }
    .achips { display: flex; gap: 4px; flex-wrap: wrap; }
    .adim { color: #6b7a84; font-size: .78rem; }
    .react-bar { display: flex; align-items: center; gap: 10px; margin: 4px 0 8px; }
    .react-btn { background: linear-gradient(#1f8a76, #1a6d5e); color: #fff; border: none; border-radius: 10px; padding: 10px 16px; font-size: .95rem; font-weight: 700; cursor: pointer; box-shadow: 0 3px 8px rgba(26,109,94,.3); }
    .react-btn.small { padding: 7px 12px; font-size: .85rem; }
    .react-btn:disabled { opacity: .5; cursor: default; box-shadow: none; }
    .temp-chip { background: #fff3dc; border: 1px solid #f0c777; color: #7a4f00; border-radius: 999px; padding: 3px 10px; font-size: .8rem; font-weight: 600; }
    .timebox { background: #f2f9f7; border: 1px solid #cfe3de; border-radius: 10px; padding: 8px 10px; margin-bottom: 8px; }
    .pbar { height: 8px; background: #dbe8e4; border-radius: 6px; overflow: hidden; }
    .pfill { height: 100%; background: linear-gradient(90deg, #37c2b5, #1a6d5e); transition: width .15s linear; }
    .tline { display: flex; justify-content: space-between; gap: 8px; font-size: .78rem; margin: 5px 0; color: #33454f; flex-wrap: wrap; }
    .tctrl { display: flex; align-items: center; gap: 5px; flex-wrap: wrap; }
    .tl { font-size: .75rem; color: #6b7a84; }
    .v-phase { width: 70px; height: 5px; background: #dbe8e4; border-radius: 4px; overflow: hidden; margin-top: 2px; }
    .v-react { margin-top: 3px; background: #1a6d5e; color: #fff; border: none; border-radius: 999px; padding: 3px 10px; font-size: .72rem; cursor: pointer; }
    .v-react.again { background: #5b7f78; }
    .v-react:disabled { opacity: .5; }
    .risks { display: flex; flex-direction: column; gap: 5px; margin: 6px 0; }
    .risk { font-size: .8rem; line-height: 1.4; padding: 6px 9px; border-radius: 8px; border-left: 4px solid; }
    .risk.danger { background: #fdecea; border-color: #c0392b; color: #7b1d12; font-weight: 600; animation: blink 1.4s ease-in-out infinite; }
    .risk.warn { background: #fff6e6; border-color: #e09a1a; color: #7a4f00; }
    .risk.info { background: #eef6f4; border-color: #37c2b5; color: #14544a; }
    @keyframes blink { 50% { background: #f9d6d2; } }
    .ctable { width: 100%; border-collapse: collapse; font-size: .78rem; margin: 6px 0; }
    .ctable th, .ctable td { border-bottom: 1px solid #e2e8ec; padding: 4px 5px; text-align: left; }
    .ctable th { color: #6b7a84; font-weight: 600; }
    .ctable small { color: #6b7a84; }
    .r-eq.ion { margin-top: 4px; background: #f4f0fb; border-color: #7b5cc2; }
    .r-title.bad { color: #a8321f; }
    details.sec { margin: 7px 0; border: 1px solid #e2e8ec; border-radius: 8px; padding: 4px 9px; background: #fbfdfc; }
    details.sec summary { cursor: pointer; font-weight: 700; font-size: .84rem; color: #1a6d5e; padding: 3px 0; }
    details.sec p { margin: 4px 0; font-size: .82rem; }
    .use { background: #eef6f4; padding: 6px 8px; border-radius: 6px; }
    .quick { display: grid; grid-template-columns: minmax(300px, 440px) minmax(0, 1fr); gap: 14px; align-items: start; }
    @media (max-width: 900px) { .quick { grid-template-columns: 1fr; } }
    .q-text { display: flex; gap: 8px; margin: 6px 0; }
    .q-text input { flex: 1; padding: 8px 10px; border: 1px solid #cfd9dd; border-radius: 8px; font-size: .95rem; }
    .q-ex { display: flex; gap: 5px; flex-wrap: wrap; margin-bottom: 8px; }
    .q-rows { display: flex; flex-direction: column; gap: 6px; margin: 8px 0; }
    .q-row { display: grid; grid-template-columns: 1fr 82px 44px 30px; gap: 6px; align-items: center; }
    .q-row select, .q-row input, .q-opts select { padding: 6px; border: 1px solid #cfd9dd; border-radius: 6px; font-size: .85rem; min-width: 0; }
    .unit { font-size: .8rem; color: #1a6d5e; font-weight: 600; }
    .q-opts { display: flex; flex-wrap: wrap; gap: 12px; margin: 10px 0; font-size: .85rem; }
    .q-actions { display: flex; gap: 8px; flex-wrap: wrap; }
  `],
})
export class ChemBenchComponent implements OnInit, OnDestroy {
  private sim = inject(SimulationService);
  private router = inject(Router);
  private labSession = inject(LabSessionService);
  private san = inject(DomSanitizer);
  private cdr = inject(ChangeDetectorRef);
  private host = inject(ElementRef<HTMLElement>);
  i18n = inject(I18nService);

  @ViewChild('bench') benchRef!: ElementRef<HTMLElement>;
  @ViewChild('fx') fxRef!: ElementRef<HTMLElement>;

  G: Record<string, Geom> = GEOM;
  shelfOrder = SHELF_ORDER;
  tools = TOOLS;
  presetGroups = PRESET_GROUPS;
  flameHtml: SafeHtml = this.san.bypassSecurityTrustHtml(FLAME_SVG);

  mode: 'guided' | 'free' = 'guided';
  tool: Tool = 'pour';
  reagent: Chemical | null = null;
  liftedId: string | null = null;
  activeId = 't1';
  transferSrc: string | null = null;
  dripId: string | null = null;
  busy = false;
  warning = '';
  private warnTimer: any;
  speed = 1;

  // reaction timing
  section: 'bench' | 'quick' = 'bench';
  timeScales = [1, 5, 20, 60];
  timeScale = 5;
  paused = false;
  private ticker: any;
  dropMl = DROP_ML;
  amtVal: Partial<Record<Tool, number>> = { pour: 5, dropper: 5, spoon: 1, forceps: 0.5 };

  // quick reaction menu
  qText = 'HCl + NaOH + ফেনলফথ্যালিন';
  qExamples = ['HCl + NaOH', 'Zn + HCl', 'AgNO3 + NaCl', 'Cu + HCl', 'NaOH + ফেনলফথ্যালিন', 'Na2CO3 + CH3COOH', 'Mg + H2SO4'];
  qRows: { chemId: string; value: number }[] = [{ chemId: 'HCl', value: 8 }, { chemId: 'NaOH', value: 8 }, { chemId: 'Phenolphthalein', value: 10 }];
  qCap = 20; qHeat = false; qView: View | null = null; qMsg = '';

  vessels: Vessel[] = [
    this.mk('t1', 'tube', 'টেস্ট টিউব ১', 'Test tube 1', 20),
    this.mk('t2', 'tube', 'টেস্ট টিউব ২', 'Test tube 2', 20),
    this.mk('t3', 'tube', 'টেস্ট টিউব ৩', 'Test tube 3', 20),
    this.mk('b1', 'beaker', 'বীকার', 'Beaker', 100),
    this.mk('f1', 'flask', 'কনিক্যাল ফ্লাস্ক', 'Conical flask', 100),
  ];

  notebook: NotebookEntry[] = [];
  notebookOpen = false;
  attemptId: number | null = null;
  mistakes = 0;
  private stepsLog: any[] = [];
  guidedSteps: { instruction_bn: string; instruction_en: string; hint_bn?: string; hint_en?: string }[] = [];
  currentStep = 0;
  private htmlCache = new Map<string, SafeHtml>();

  private mk(id: string, kind: Vessel['kind'], nameBn: string, nameEn: string, cap: number): Vessel {
    return { id, kind, nameBn, nameEn, cap, contents: [], view: { ...EMPTY_VIEW }, level: 0, pLevel: 0, bubbleIdx: [], funnel: false, residue: null, heated: false, label: '', lastLogged: '', phase: 'fresh', t: 0, baseTemp: 25, explain: null, foamIdx: [], flakeIdx: [] };
  }

  ngOnInit() {
    try { this.notebook = JSON.parse(localStorage.getItem(NOTEBOOK_KEY) || '[]'); } catch { this.notebook = []; }
    this.mode = this.labSession.getMode('chem-mixing');
    this.sim.getSimulation('chem-mixing').subscribe({ next: s => { this.guidedSteps = s?.config?.guidedSteps || []; }, error: () => {} });
    this.sim.startAttempt('chem-mixing', this.mode).subscribe({ next: a => this.attemptId = a.id, error: () => {} });
    this.ticker = setInterval(() => this.tick(), 100);
  }
  ngOnDestroy() { clearInterval(this.ticker); clearTimeout(this.warnTimer); }

  // ---------- amount control ----------
  spec() { return AMOUNT_SPEC[this.tool] ?? null; }
  unitLabel(u: string): string { return u === 'drops' ? (this.i18n.isEn ? 'drops' : 'ফোঁটা') : u; }
  setAmt(v: any) { const sp = this.spec(); if (!sp) return; let n = +v; if (!isFinite(n)) return; n = Math.max(sp.min, Math.min(sp.max, n)); this.amtVal[this.tool] = n; }
  rowUnit(r: { chemId: string }): string { const c = getChem(r.chemId)!; return c.type === 'indicator' ? (this.i18n.isEn ? 'drops' : 'ফোঁটা') : unitOf(c); }

  // ---------- template helpers ----------
  byCat(cat: string): Chemical[] { return CHEMICALS.filter(c => c.category === cat); }
  piece(n: number): number[] { return Array.from({ length: n }, (_, i) => i); }
  shortBn(c: Chemical): string { return c.nameBn.replace(/\(.*\)/, '').replace(' দ্রবণ', '').trim().split(' ').slice(0, 2).join(' '); }
  activeVessel(): Vessel | undefined { return this.vessels.find(v => v.id === this.activeId); }
  bottleHtml(c: Chemical): SafeHtml {
    return this.cached('b' + c.id, () => {
      const d = dispenseOf(c);
      const tint = this.nearClear(c.color) ? '#a9d6ec' : c.color;
      return bottleSvg(tint, c.formula === '—' ? c.nameEn.slice(0, 6) : c.formula, d === 'indicator' ? 'drops' : d === 'metal' ? 'metal' : d === 'powder' ? 'powder' : 'liquid', d);
    });
  }
  fumeIdx = [0, 1, 2, 3, 4, 5];
  lop(v: Vessel): number { return this.nearClear(v.view.color) ? 0.5 : 0.93; }
  surfY(v: Vessel): number { const g = GEOM[v.kind]; return g.bottom - (g.bottom - g.top) * v.level; }
  isPowder(id: string): boolean { return id === 'Na2CO3' || id === 'NH4Cl'; }
  dep(s: { deposit: number }): number { return Math.round(s.deposit * 9); }
  tpct(v: Vessel): number { return Math.max(5, Math.min(100, ((v.view.temp - 20) / 80) * 100)); }
  async emptyVessel(v: Vessel) { if (this.busy) return; this.activeId = v.id; await this.wash(v); }
  emptyAll() {
    if (this.busy) return;
    this.vessels.forEach(v => {
      if (v.contents.length || v.funnel) { v.contents = []; v.residue = null; v.funnel = false; v.heated = false; v.baseTemp = 25; v.phase = 'fresh'; v.t = 0; v.explain = null; v.lastLogged = ''; this.recompute(v, false); this.bump(v, 'shake', 600); }
    });
    this.transferSrc = null; this.cdr.detectChanges();
  }
  disp(c: string): string { return this.nearClear(c) ? '#bfe6f7' : c; }
  toolHtml(t: Tool): SafeHtml { return this.cached('t' + t, () => toolSvg(t)); }
  private cached(key: string, f: () => string): SafeHtml {
    let v = this.htmlCache.get(key);
    if (!v) { v = this.san.bypassSecurityTrustHtml(f()); this.htmlCache.set(key, v); }
    return v;
  }
  private nearClear(hex: string): boolean { const n = parseInt(hex.slice(1, 3), 16) + parseInt(hex.slice(3, 5), 16) + parseInt(hex.slice(5, 7), 16); return n > 640; }

  hint(): string {
    const en = this.i18n.isEn;
    const t = TOOLS.find(x => x.tool === this.tool)!;
    if (this.tool === 'transfer') return this.transferSrc
      ? (en ? 'Now click the vessel to pour INTO.' : 'এখন যে পাত্রে ঢালবেন সেটিতে ক্লিক করুন।')
      : (en ? 'Transfer: click the vessel you want to pour FROM.' : 'এক পাত্র থেকে ঢালা: প্রথমে যে পাত্র থেকে ঢালবেন সেটিতে ক্লিক করুন।');
    if (this.tool === 'funnel') return en ? 'Click a beaker or flask to place / remove the funnel with filter paper.' : 'বীকার বা ফ্লাস্কে ক্লিক করে ফানেল (ফিল্টার পেপারসহ) বসান বা সরান।';
    if (this.tool === 'burner') return en ? 'Click a vessel to light / put out the burner under it.' : 'যে পাত্র গরম করবেন সেটিতে ক্লিক করুন (আবার ক্লিকে বন্ধ)।';
    if (this.tool === 'stir') return en ? 'Click a vessel to stir with the glass rod.' : 'কাচদণ্ড দিয়ে নাড়তে একটি পাত্রে ক্লিক করুন।';
    if (this.tool === 'wash') return en ? 'Click a vessel to wash it out and empty it.' : 'ধুয়ে খালি করতে একটি পাত্রে ক্লিক করুন।';
    if (!this.reagent) return en ? 'Pick a reagent bottle from the cabinet (or drag it onto a vessel).' : 'আলমারি থেকে একটি রাসায়নিক বেছে নিন (বা টেনে এনে পাত্রে ছেড়ে দিন)।';
    return `${en ? 'Selected' : 'নির্বাচিত'}: ${this.reagent.formula !== '—' ? this.reagent.formula : this.reagent.nameEn} · ${en ? t.en : t.bn} — ${en ? 'now click a vessel.' : 'এখন একটি পাত্রে ক্লিক করুন।'}`;
  }

  // ---------- selection ----------
  selectReagent(c: Chemical) {
    if (this.busy) return;
    this.reagent = c;
    const allowed = toolsFor(dispenseOf(c));
    if (!allowed.includes(this.tool)) this.tool = allowed[0];
  }
  pickTool(t: Tool) {
    if (this.busy) return;
    this.tool = t; this.transferSrc = null;
    if (this.reagent && ['pour', 'dropper', 'spoon', 'forceps'].includes(t) && !toolsFor(dispenseOf(this.reagent)).includes(t)) {
      this.warn(this.i18n.isEn ? 'This tool cannot take that reagent — pick a matching tool (bottle→pour/dropper, powder→spoon, metal→forceps).' : 'এই যন্ত্র দিয়ে এই রাসায়নিক নেওয়া যায় না — বোতল→ঢালা/ড্রপার, গুঁড়া→চামচ, ধাতু→চিমটা।');
      this.mistakes++;
    }
  }
  onDragStart(e: DragEvent, c: Chemical) { e.dataTransfer?.setData('text/plain', c.id); this.selectReagent(c); }
  onDrop(e: DragEvent, v: Vessel) {
    e.preventDefault();
    const id = e.dataTransfer?.getData('text/plain');
    const c = id ? getChem(id) : null;
    if (c) { this.selectReagent(c); this.onVesselClick(v); }
  }

  warn(msg: string) {
    this.warning = msg;
    clearTimeout(this.warnTimer);
    this.warnTimer = setTimeout(() => { this.warning = ''; this.cdr.detectChanges(); }, 4200);
    this.cdr.detectChanges();
  }

  async onVesselClick(v: Vessel) {
    if (this.busy) return;
    const en = this.i18n.isEn;
    this.activeId = v.id;
    switch (this.tool) {
      case 'pour': case 'dropper': case 'spoon': case 'forceps':
        if (!this.reagent) { this.warn(en ? 'First pick a reagent from the cabinet.' : 'আগে আলমারি থেকে একটি রাসায়নিক বেছে নিন।'); return; }
        if (!toolsFor(dispenseOf(this.reagent)).includes(this.tool)) {
          this.warn(en ? 'Wrong tool for this reagent.' : 'এই রাসায়নিকের জন্য ভুল যন্ত্র নির্বাচিত।'); this.mistakes++; return;
        }
        return this.dispense(v, this.reagent, this.tool);
      case 'transfer':
        if (!this.transferSrc) {
          if (!v.view.liquidAmount && !v.view.precip) { this.warn(en ? 'That vessel is empty.' : 'পাত্রটি খালি।'); return; }
          this.transferSrc = v.id; return;
        }
        if (this.transferSrc === v.id) { this.transferSrc = null; return; }
        { const src = this.vessels.find(x => x.id === this.transferSrc)!; this.transferSrc = null; return this.transfer(src, v); }
      case 'funnel':
        if (v.kind === 'tube') { this.warn(en ? 'The funnel fits a beaker or conical flask.' : 'ফানেল বীকার বা কনিক্যাল ফ্লাস্কে বসে।'); return; }
        v.funnel = !v.funnel; if (!v.funnel) v.residue = null; this.cdr.detectChanges(); return;
      case 'burner':
        v.heated = !v.heated; this.recompute(v); this.log({ type: v.heated ? 'heat-on' : 'heat-off', vessel: v.id }); return;
      case 'stir': return this.stir(v);
      case 'wash': return this.wash(v);
    }
  }

  // ---------- state ----------
  private opts(v: Vessel, t = v.t): SimOpts { return { isEn: this.i18n.isEn, phase: v.phase, t, baseTemp: v.baseTemp, heated: v.heated, cap: v.cap }; }
  private recompute(v: Vessel, detect = true) {
    v.view = evaluate(v.contents, this.opts(v));
    v.level = Math.min(1, v.view.liquidAmount / v.cap);
    v.pLevel = v.view.precip ? Math.min(0.45, 0.03 + (v.view.precip.amount / v.cap) * 0.6) : 0;
    if (v.bubbleIdx.length !== v.view.bubbles) v.bubbleIdx = Array.from({ length: v.view.bubbles }, (_, i) => i);
    const fn = Math.round(v.view.foam * 14); if (v.foamIdx.length !== fn) v.foamIdx = Array.from({ length: fn }, (_, i) => i);
    if (v.flakeIdx.length !== v.view.flakes) v.flakeIdx = Array.from({ length: v.view.flakes }, (_, i) => i);
    v.label = v.view.rows.filter(r => r.id !== '__ppt').map(r => `${r.formula && r.formula !== '—' && r.formula !== '↓' ? r.formula : r.name.split(' ')[0]} ${r.amount}`).join(' + ');
    if (detect) this.cdr.detectChanges();
  }

  // ---------- reaction lifecycle ----------
  async startReaction(v: Vessel) {
    if (v.phase === 'reacting' || this.busy) return;
    if (!v.contents.length) { this.warn(this.i18n.isEn ? 'The vessel is empty — add chemicals first.' : 'পাত্র খালি — আগে রাসায়নিক যোগ করুন।'); return; }
    this.activeId = v.id; v.phase = 'reacting'; v.t = 0; v.explain = null; v.lastLogged = '';
    this.log({ type: 'react-start', vessel: v.id, contents: v.contents.map(c => c.chemId ? { id: c.chemId, amount: c.amount } : { mix: true, amount: c.amount }) });
    this.recompute(v);
    if (v.view.done) this.settle(v);
  }
  skipToEnd(v: Vessel) { if (v.phase === 'reacting') { v.t = Math.max(v.t, v.view.tTotal + 1); this.recompute(v); if (v.view.done) this.settle(v); } }
  private settle(v: Vessel) {
    const ex = v.view.explain;
    v.explain = ex;
    const t = v.t;
    v.contents = commitReaction(v.contents, this.opts(v, 1e9));
    v.baseTemp = Math.max(v.baseTemp, v.view.temp);
    v.phase = 'settled'; v.t = 0;
    this.recompute(v);
    if (ex && ex.kind !== 'reaction' && ex.kind !== 'indicator') this.mistakes++;
    if (ex) {
      const entry: NotebookEntry = { reactants: v.view.rows.length ? v.label : '', equation: ex.equation || ex.title, observation: `${ex.what.join(' ')} ${ex.why[0] ?? ''}`.trim(), time: new Date().toLocaleString('bn-BD') };
      this.notebook.push(entry);
      try { localStorage.setItem(NOTEBOOK_KEY, JSON.stringify(this.notebook)); } catch { /* ignore */ }
      this.log({ type: 'react-done', vessel: v.id, kind: ex.kind, seconds: Math.round(t) });
      if (this.attemptId) this.sim.updateAttempt(this.attemptId, { steps: this.stepsLog, mistakes: this.mistakes }).subscribe({ error: () => {} });
    }
  }
  private tick() {
    const dt = 0.1 * this.timeScale * (this.paused ? 0 : 1);
    let dirty = false;
    for (const v of this.vessels) {
      const before = Math.round(v.baseTemp);
      if (v.heated && v.view.liquidAmount > 0) v.baseTemp = Math.min(100, v.baseTemp + 2 * dt);
      else if (v.baseTemp > 25 && v.phase !== 'reacting') v.baseTemp = Math.max(25, v.baseTemp - 0.35 * dt);
      const tempChanged = Math.round(v.baseTemp) !== before;
      if (v.phase === 'reacting') {
        v.t += dt; this.recompute(v, false); dirty = true;
        if (v.view.done) this.settle(v);
      } else if (tempChanged) { this.recompute(v, false); dirty = true; }
    }
    if (dirty) this.cdr.detectChanges();
  }

  private log(step: any) { this.stepsLog.push({ ...step, at: new Date().toISOString() }); }

  // ---------- animation helpers ----------
  private get benchEl(): HTMLElement { return this.benchRef.nativeElement; }
  private rel(el: Element): { l: number; t: number; w: number; h: number } {
    const b = this.benchEl.getBoundingClientRect(); const r = el.getBoundingClientRect();
    return { l: r.left - b.left, t: r.top - b.top, w: r.width, h: r.height };
  }
  private el(cls: string, html = '', css: Partial<CSSStyleDeclaration> = {}): HTMLElement {
    const d = document.createElement('div'); d.className = cls; d.innerHTML = html; Object.assign(d.style, css);
    this.fxRef.nativeElement.appendChild(d); return d;
  }
  private move(el: HTMLElement, frames: Keyframe[], ms: number, easing = 'ease-in-out'): Promise<void> {
    return el.animate(frames, { duration: ms * this.speed, fill: 'forwards', easing }).finished.then(() => {});
  }
  private sleep(ms: number): Promise<void> { return new Promise(r => setTimeout(r, ms * this.speed)); }
  private vesselEl(v: Vessel): HTMLElement { return this.host.nativeElement.querySelector(`[data-vessel="${v.id}"]`) as HTMLElement; }
  /** mouth point + liquid-surface y (bench coordinates) of a vessel */
  private anchors(v: Vessel, level = v.level) {
    const g = GEOM[v.kind]; const r = this.rel(this.vesselEl(v).querySelector('svg')!);
    const y = (u: number) => r.t + r.h * (u / g.h);
    return { mx: r.l + r.w * (g.cx / g.w), my: y(HEAD), floor: y(g.bottom), surface: y(g.bottom - (g.bottom - g.top) * Math.min(1, level)), w: r.w };
  }
  private liquidColorOf(chem: Chemical): string { return this.nearClear(chem.color) ? '#bfe6f7' : chem.color; }
  private T(cx: number, cy: number, w: number, h: number, rot = 0, sc = 1) { return `translate(${cx - w / 2}px,${cy - h / 2}px) rotate(${rot}deg) scale(${sc})`; }
  private bump(v: Vessel, cls: string, ms = 500) {
    const e = this.vesselEl(v); e.classList.add(cls); setTimeout(() => e.classList.remove(cls), ms);
  }

  // ---------- actions ----------
  private hazardSeen = new Set<string>();
  async dispense(v: Vessel, chem: Chemical, tool: Tool, nativeAmt?: number) {
    const en = this.i18n.isEn; const d = dispenseOf(chem);
    const amt = nativeAmt ?? toNative(tool, this.amtVal[tool] ?? AMOUNT_SPEC[tool]!.def);
    if (v.phase === 'reacting') { this.warn(en ? 'A reaction is running in this vessel — wait for it to finish (or press Finish).' : 'এই পাত্রে বিক্রিয়া চলছে — শেষ হওয়া পর্যন্ত অপেক্ষা করুন (বা "শেষ" চাপুন)।'); return; }
    if (v.funnel) { this.warn(en ? 'Remove the funnel first — add reagents to the vessel directly, or use Transfer to filter.' : 'আগে ফানেল সরান — সরাসরি রাসায়নিক যোগ করুন, অথবা ছাঁকতে "এক পাত্র থেকে ঢালা" ব্যবহার করুন।'); return; }
    const liquid = d === 'bottle' || d === 'indicator';
    if (liquid && v.view.liquidAmount + amt > v.cap) { this.warn(en ? `This vessel would overflow! It holds ${v.cap} mL — ${v.view.liquidAmount.toFixed(1)} mL already inside.` : `পাত্রটি উপচে পড়বে! এর ধারণক্ষমতা ${v.cap} mL — ভেতরে আছে ${v.view.liquidAmount.toFixed(1)} mL।`); this.mistakes++; return; }
    if (!liquid && v.contents.filter(c => c.chemId === chem.id).reduce((s, c) => s + c.amount, 0) + amt > 8) { this.warn(en ? 'That is already a lot of solid for this vessel.' : 'এই পাত্রে কঠিন পদার্থ ইতিমধ্যে অনেক হয়েছে।'); return; }
    if (v.phase === 'settled') v.phase = 'fresh';

    this.busy = true; this.liftedId = chem.id; this.cdr.detectChanges();
    const srcEl = this.host.nativeElement.querySelector(`[data-chem="${chem.id}"]`) as HTMLElement;
    const sr = this.rel(srcEl);
    const sx = sr.l + sr.w / 2, sy = sr.t + sr.h / 2;
    const after = Math.min(1, (v.view.liquidAmount + (liquid ? amt : 0)) / v.cap);
    const a = this.anchors(v, after);
    const col = this.liquidColorOf(chem);
    const land = () => {
      this.addContent(v, { chemId: chem.id, amount: amt }); this.bump(v, 'splash');
      const hz = HAZARD[chem.id];
      if (hz && hz.level >= 2 && !this.hazardSeen.has(chem.id)) { this.hazardSeen.add(chem.id); this.warn('☠️ ' + hz.bn); }
    };

    try {
      if (tool === 'pour') {
        const w = 62, h = 94, el = this.el('actor', toolSvg('pour', col), { width: w + 'px', height: h + 'px' });
        el.style.transform = this.T(sx, sy, w, h);
        await this.move(el, [{ transform: this.T(sx, sy, w, h) }, { transform: this.T(a.mx - 44, a.my - 56, w, h) }], 520);
        await this.move(el, [{ transform: this.T(a.mx - 44, a.my - 56, w, h) }, { transform: this.T(a.mx - 44, a.my - 56, w, h, 118) }], 380);
        const lipX = a.mx - 6, lipY = a.my - 24;
        const stream = this.el('stream', '', { left: lipX - 2 + 'px', top: lipY + 'px', background: col, height: '0px' });
        const down = Math.max(10, a.surface - lipY);
        await this.move(stream, [{ height: '0px' }, { height: down + 'px' }], 220, 'ease-in');
        land();
        await this.sleep(420 + Math.min(amt, 20) * 55);
        stream.remove();
        await this.move(el, [{ transform: this.T(a.mx - 44, a.my - 56, w, h, 118) }, { transform: this.T(a.mx - 44, a.my - 56, w, h) }], 340);
        await this.move(el, [{ transform: this.T(a.mx - 44, a.my - 56, w, h) }, { transform: this.T(sx, sy, w, h) }], 480);
        el.remove();
      } else if (tool === 'dropper') {
        const w = 24, h = 92, el = this.el('actor', toolSvg('dropper', col), { width: w + 'px', height: h + 'px' });
        const hover = this.T(a.mx, a.my - 62, w, h);
        el.style.transform = this.T(sx, sy - 10, w, h);
        await this.move(el, [{ transform: this.T(sx, sy - 10, w, h) }, { transform: hover }], 520);
        const tipY = a.my - 62 + h / 2 - 6;
        const nDrops = Math.min(6, Math.max(1, Math.ceil(amt / DROP_ML / 4)));
        for (let i = 0; i < nDrops; i++) {
          const dr = this.el('drop', '', { left: a.mx - 4 + 'px', top: tipY + 'px', background: col, border: '1px solid rgba(255,255,255,.6)' });
          await this.move(el, [{ transform: hover }, { transform: this.T(a.mx, a.my - 62, w, h, 0, 1.02) }, { transform: hover }], 200);
          const fall = Math.max(8, a.surface - tipY);
          dr.animate([{ transform: 'translateY(0)', opacity: 1 }, { transform: `translateY(${fall}px)`, opacity: .9 }], { duration: 380 * this.speed, easing: 'ease-in', fill: 'forwards' }).finished.then(() => dr.remove());
          await this.sleep(i === 0 ? 300 : 260);
          if (i === 0) land();
        }
        await this.move(el, [{ transform: hover }, { transform: this.T(sx, sy - 10, w, h) }], 460);
        el.remove();
      } else if (tool === 'spoon') {
        const w = 34, h = 118, el = this.el('actor', toolSvg('spoon', '#f4f1ea'), { width: w + 'px', height: h + 'px' });
        const cx = a.mx + 34, cy = a.my - 40;
        el.style.transform = this.T(sx, sy, w, h);
        await this.move(el, [{ transform: this.T(sx, sy, w, h) }, { transform: this.T(cx, cy, w, h) }], 520);
        await this.move(el, [{ transform: this.T(cx, cy, w, h) }, { transform: this.T(cx, cy, w, h, 58) }], 360);
        const fall = Math.max(8, a.floor - 14 - (a.my - 12));
        const nGrain = Math.min(18, Math.round(5 + amt * 4));
        for (let i = 0; i < nGrain; i++) {
          const g = this.el('grain', '', { left: a.mx - 6 + (i % 4) * 3 + 'px', top: a.my - 14 + 'px', background: '#f6f3ec', border: '1px solid rgba(0,0,0,.15)' });
          g.animate([{ transform: 'translate(0,0)', opacity: 1 }, { transform: `translate(${(i % 3 - 1) * 3}px,${fall}px)`, opacity: 1 }], { duration: (420 + i * 40) * this.speed, easing: 'ease-in', fill: 'forwards', delay: i * 45 * this.speed }).finished.then(() => g.remove());
        }
        await this.sleep(520); land(); await this.sleep(300);
        await this.move(el, [{ transform: this.T(cx, cy, w, h, 58) }, { transform: this.T(cx, cy, w, h) }], 320);
        await this.move(el, [{ transform: this.T(cx, cy, w, h) }, { transform: this.T(sx, sy, w, h) }], 480);
        el.remove();
      } else { // forceps
        const w = 34, h = 108, el = this.el('actor', toolSvg('forceps', chem.color), { width: w + 'px', height: h + 'px' });
        const hover = this.T(a.mx, a.my - 66, w, h);
        el.style.transform = this.T(sx, sy, w, h);
        await this.move(el, [{ transform: this.T(sx, sy, w, h) }, { transform: hover }], 560);
        const tipY = a.my - 66 + h / 2 - 8;
        const piece = this.el('grain', '', { left: a.mx - 3 + 'px', top: tipY + 'px', width: '6px', height: '14px', background: chem.color, border: '1px solid rgba(0,0,0,.3)' });
        el.querySelector('rect')?.setAttribute('opacity', '0');
        const fall = Math.max(8, a.floor - 16 - tipY);
        await piece.animate([{ transform: 'translateY(0) rotate(0)' }, { transform: `translateY(${fall}px) rotate(${35}deg)` }], { duration: 480 * this.speed, easing: 'cubic-bezier(.5,0,1,.6)', fill: 'forwards' }).finished;
        piece.remove(); land();
        await this.sleep(240);
        await this.move(el, [{ transform: hover }, { transform: this.T(sx, sy, w, h) }], 520);
        el.remove();
      }
      this.log({ type: 'add', tool, chem: chem.id, vessel: v.id, amount: amt, unit: unitOf(chem) });
    } finally {
      this.liftedId = null; this.busy = false; this.cdr.detectChanges();
    }
    this.activeId = v.id;
    this.cdr.detectChanges();
  }

  private addContent(v: Vessel, c: Content) {
    const existing = v.contents.find(x => x.chemId && x.chemId === c.chemId);
    if (existing) existing.amount += c.amount; else v.contents.push(c);
    this.recompute(v);
  }

  async transfer(src: Vessel, dst: Vessel) {
    const en = this.i18n.isEn;
    const mixAmount = src.view.liquidAmount;
    const filtering = dst.funnel;
    if (src.phase === 'reacting' || dst.phase === 'reacting') { this.warn(en ? 'A reaction is still running — wait until it finishes.' : 'বিক্রিয়া এখনও চলছে — শেষ হওয়া পর্যন্ত অপেক্ষা করুন।'); return; }
    if (src.phase === 'fresh' && src.view.hasReaction) { this.warn(en ? 'These chemicals have not been reacted yet. Press “Start reaction” first — pouring them away unreacted would skip the experiment.' : 'এই রাসায়নিকগুলোর এখনও বিক্রিয়া ঘটানো হয়নি। আগে "বিক্রিয়া ঘটান" চাপুন — না ঘটিয়ে ঢেলে ফেললে পরীক্ষাটি বাদ পড়ে যাবে।'); this.mistakes++; return; }
    if (!filtering && dst.view.liquidAmount + mixAmount > dst.cap) { this.warn(en ? 'The target would overflow!' : 'গন্তব্য পাত্র উপচে পড়বে!'); this.mistakes++; return; }
    if (filtering && dst.contents.length === 0 && dst.view.liquidAmount + mixAmount > dst.cap) { this.warn(en ? 'The target would overflow!' : 'গন্তব্য পাত্র উপচে পড়বে!'); return; }
    this.busy = true; this.cdr.detectChanges();
    try {
      const se = this.vesselEl(src); const sr = this.rel(se.querySelector('svg')!);
      const a = this.anchors(dst, Math.min(1, (dst.view.liquidAmount + mixAmount) / dst.cap));
      const sign = a.mx >= sr.l + sr.w / 2 ? 1 : -1;
      const px = sr.l + sr.w / 2, py = sr.t + sr.h * (HEAD / GEOM[src.kind].h);
      const dx = (a.mx - sign * (GEOM[src.kind].w * 0.62)) - px, dy = (a.my - (filtering ? 70 : 52)) - py;
      const home = 'translate(0,0) rotate(0deg)', up = `translate(${dx}px,${dy}px) rotate(0deg)`, tilt = `translate(${dx}px,${dy}px) rotate(${sign * 82}deg)`;
      se.style.zIndex = '40'; se.style.position = 'relative';
      await this.move(se, [{ transform: home }, { transform: up }], 560);
      await this.move(se, [{ transform: up }, { transform: tilt }], 460);
      const col = this.disp(src.view.color);
      const lipX = a.mx - sign * 2, lipY = a.my - (filtering ? 66 : 48);
      const stream = this.el('stream', '', { left: lipX - 2 + 'px', top: lipY + 'px', background: col, height: '0px', opacity: '.85' });
      await this.move(stream, [{ height: '0px' }, { height: Math.max(10, (filtering ? a.my + 20 : a.surface) - lipY) + 'px' }], 220, 'ease-in');
      // ---- state change ----
      const solids = src.contents.filter(c => c.chemId && getChem(c.chemId) && (getChem(c.chemId)!.state === 'solid' || dispenseOf(getChem(c.chemId)!) === 'powder'));
      const keepSolids = solids.map(c => { const s = src.view.solids.find(x => x.id === c.chemId); return { ...c, amount: c.amount * (s ? s.remaining : 1) }; }).filter(c => c.amount > 0.05);
      const mix = toMix(src.view, !filtering);
      const residue = filtering ? src.view.precip : null;
      src.contents = keepSolids; src.phase = 'fresh'; src.explain = null; src.t = 0; this.recompute(src);
      if (filtering) { this.dripId = dst.id; if (residue) dst.residue = { color: residue.color, name: residue.name }; this.cdr.detectChanges(); await this.sleep(700); }
      dst.contents.push({ amount: mixAmount, mix });
      dst.phase = 'fresh'; this.recompute(dst); this.bump(dst, 'splash');
      await this.sleep(900 + mixAmount * 80);
      stream.remove(); this.dripId = null;
      await this.move(se, [{ transform: tilt }, { transform: up }], 380);
      await this.move(se, [{ transform: up }, { transform: home }], 520);
      se.style.zIndex = ''; se.style.transform = ''; se.getAnimations().forEach(x => x.cancel());
      this.activeId = dst.id; this.log({ type: filtering ? 'filter' : 'transfer', from: src.id, to: dst.id });
    } finally { this.busy = false; this.cdr.detectChanges(); }
  }

  private async stir(v: Vessel) {
    if (!v.view.liquidAmount) { this.warn(this.i18n.isEn ? 'Nothing to stir.' : 'নাড়ার মতো কিছু নেই।'); return; }
    this.busy = true; this.cdr.detectChanges();
    try {
      const a = this.anchors(v); const w = 22, h = 112;
      const el = this.el('actor', toolSvg('stir'), { width: w + 'px', height: h + 'px' });
      const top = this.T(a.mx, a.my - 70, w, h, 8), dip = this.T(a.mx, a.surface - 12, w, h, 8);
      await this.move(el, [{ transform: this.T(a.mx + 60, a.my - 120, w, h, 20) }, { transform: top }], 380);
      await this.move(el, [{ transform: top }, { transform: dip }], 300);
      this.bump(v, 'shake', 600);
      const sw = (dx: number) => this.T(a.mx + dx, a.surface - 12, w, h, 8 + dx);
      await this.move(el, [{ transform: dip }, { transform: sw(-9) }, { transform: sw(9) }, { transform: sw(-9) }, { transform: sw(9) }, { transform: dip }], 1100, 'linear');
      await this.move(el, [{ transform: dip }, { transform: this.T(a.mx + 60, a.my - 120, w, h, 20) }], 400);
      el.remove();
      this.log({ type: 'stir', vessel: v.id });
    } finally { this.busy = false; this.cdr.detectChanges(); }
  }

  private async wash(v: Vessel) {
    if (!v.contents.length && !v.funnel) return;
    this.busy = true; this.bump(v, 'shake', 600); await this.sleep(500);
    v.contents = []; v.residue = null; v.lastLogged = ''; v.phase = 'fresh'; v.t = 0; v.explain = null; v.baseTemp = 25; v.heated = false; this.recompute(v);
    await this.sleep(900); this.busy = false; this.cdr.detectChanges();
  }

  // ---------- auto-demo (watch an experiment) ----------
  async runPreset(slots: (string | null)[]) {
    if (this.busy) return;
    const target = this.vessels[0];
    if (target.contents.length || target.funnel || target.phase !== 'fresh') { await this.wash(target); }
    this.speed = 0.7;
    const ids = slots.filter((s): s is string => !!s);
    const mains = ids.filter(id => getChem(id)!.type !== 'indicator');
    const reaction = findReactionAmong(mains);
    const partOf = (id: string) => reaction?.reactants.find(r => r.id === id)?.part ?? 1;
    this.activeId = target.id;
    try {
      for (const id of ids) {
        const chem = getChem(id)!; const d: Dispense = dispenseOf(chem);
        const tool = toolsFor(d)[0];
        const part = partOf(id);
        const amt = d === 'bottle' ? Math.min(15, part * 5) : d === 'indicator' ? 0.5
          : Math.max(0.2, Math.round(part * 0.005 * (MOLAR_MASS[id] || 60) * 10) / 10);
        this.reagent = chem; this.tool = tool; this.cdr.detectChanges();
        await this.dispense(target, chem, tool, amt);
      }
      await this.startReaction(target);
    } finally { this.speed = 1; this.cdr.detectChanges(); }
  }

  // ---------- quick reaction menu ----------
  qParse() {
    const ids = parseReactionText(this.qText);
    if (!ids.length) { this.qMsg = this.i18n.isEn ? 'No chemical recognised — write formulas or names, e.g. HCl + NaOH.' : 'কোনো রাসায়নিক শনাক্ত হয়নি — সূত্র বা নাম লিখুন, যেমন: HCl + NaOH।'; return; }
    this.qMsg = ''; this.qView = null;
    this.qRows = ids.map(id => ({ chemId: id, value: this.qDefault(id) }));
  }
  private qDefault(id: string): number { const c = getChem(id)!; return c.type === 'indicator' ? 10 : defaultAmount(c); }
  qChanged(r: { chemId: string; value: number }) { r.value = this.qDefault(r.chemId); this.qView = null; }
  qAdd() { const used = new Set(this.qRows.map(r => r.chemId)); const c = CHEMICALS.find(x => !used.has(x.id)); if (c) this.qRows.push({ chemId: c.id, value: this.qDefault(c.id) }); }
  qRemove(i: number) { this.qRows.splice(i, 1); this.qView = null; }
  private qContents(): Content[] | null {
    if (!this.qRows.length) { this.qMsg = this.i18n.isEn ? 'Add at least one chemical.' : 'অন্তত একটি রাসায়নিক যোগ করুন।'; return null; }
    if (this.qRows.some(r => !(+r.value > 0))) { this.qMsg = this.i18n.isEn ? 'Every amount must be greater than zero.' : 'প্রতিটি পরিমাণ শূন্যের বেশি হতে হবে।'; return null; }
    const contents: Content[] = this.qRows.map(r => ({ chemId: r.chemId, amount: getChem(r.chemId)!.type === 'indicator' ? +r.value * DROP_ML : +r.value }));
    const ml = contents.filter(c => unitOf(getChem(c.chemId!)!) === 'mL').reduce((s, c) => s + c.amount, 0);
    if (ml > this.qCap) { this.qMsg = this.i18n.isEn ? `Total liquid ${ml.toFixed(1)} mL does not fit in a ${this.qCap} mL vessel.` : `মোট তরল ${ml.toFixed(1)} mL — ${this.qCap} mL-এর পাত্রে ধরবে না। পরিমাণ কমান বা বড় পাত্র নিন।`; return null; }
    this.qMsg = ''; return contents;
  }
  qRun() {
    const contents = this.qContents(); if (!contents) return;
    this.qView = analyze(contents, { isEn: this.i18n.isEn, phase: 'reacting', t: 1e9, baseTemp: this.qHeat ? 70 : 25, heated: this.qHeat, cap: this.qCap }).view;
    const ex = this.qView.explain;
    this.log({ type: 'quick-react', rows: this.qRows, kind: ex?.kind });
    if (ex) {
      this.notebook.push({ reactants: this.qView.rows.map(r => `${r.formula || r.name} ${r.amount}`).join(' + '), equation: ex.equation || ex.title, observation: `${ex.what.join(' ')} ${ex.why[0] ?? ''}`.trim(), time: new Date().toLocaleString('bn-BD') });
      try { localStorage.setItem(NOTEBOOK_KEY, JSON.stringify(this.notebook)); } catch { /* ignore */ }
    }
  }
  async qToBench() {
    const contents = this.qContents(); if (!contents) return;
    const v = this.vessels.find(x => x.id === (this.qCap > 20 ? 'b1' : 't1'))!;
    v.contents = contents; v.residue = null; v.funnel = false; v.phase = 'fresh'; v.t = 0; v.explain = null; v.heated = this.qHeat; v.baseTemp = 25;
    this.section = 'bench'; this.activeId = v.id; this.cdr.detectChanges(); this.recompute(v);
    this.warn(this.i18n.isEn ? 'Chemicals placed on the bench — press “Start reaction” to watch it.' : 'রাসায়নিকগুলো বেঞ্চে রাখা হয়েছে — "বিক্রিয়া ঘটান" চাপলে বিক্রিয়া দেখা যাবে।');
  }

  // ---------- notebook / save ----------
  closeNotebook(e: MouseEvent) { if ((e.target as HTMLElement).classList.contains('notebook-overlay')) this.notebookOpen = false; }
  clearNotebook() { if (confirm(this.i18n.isEn ? 'Delete all records?' : 'আপনি কি নিশ্চিত সব রেকর্ড মুছে ফেলতে চান?')) { this.notebook = []; try { localStorage.setItem(NOTEBOOK_KEY, '[]'); } catch { /* ignore */ } } }
  printNb() { window.print(); }
  exportNotebook() {
    let text = `${this.i18n.t('appName')} — Lab Notebook\n\n`;
    this.notebook.forEach((e, i) => { text += `${i + 1}. [${e.time}]\n${e.reactants}\n${e.equation}\n${e.observation}\n\n`; });
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
    a.download = 'chemistry-lab-notebook.txt'; a.click(); URL.revokeObjectURL(a.href);
  }
  finishAndSave() {
    if (!this.attemptId) { this.router.navigateByUrl('/subjects'); return; }
    const last = this.notebook[this.notebook.length - 1];
    const summary = last ? `${last.reactants} → ${last.equation}` : (this.i18n.isEn ? 'Lab session completed' : 'ল্যাব সেশন সম্পন্ন হয়েছে');
    this.sim.completeAttempt(this.attemptId, summary, { notebook: this.notebook }).subscribe({
      next: () => { alert(this.i18n.isEn ? 'Saved to your dashboard!' : 'আপনার ড্যাশবোর্ডে সংরক্ষিত হয়েছে!'); this.router.navigateByUrl('/dashboard'); },
      error: () => alert(this.i18n.isEn ? 'Could not save — please try again.' : 'সংরক্ষণ করা যায়নি — আবার চেষ্টা করুন।'),
    });
  }
}
