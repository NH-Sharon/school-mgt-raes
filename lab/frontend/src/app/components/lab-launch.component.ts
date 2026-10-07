import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { SimulationService, SafetyInfo } from '../services/simulation.service';
import { LabSessionService, LabMode } from '../services/lab-session.service';
import { I18nService } from '../services/i18n.service';
import { KEY_TO_ROUTE } from '../lab-routes';

@Component({
  selector: 'app-lab-launch',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page" *ngIf="sim() as s">
      <button class="ds-btn small back" (click)="cancel()">← {{ i18n.t('labs') }}</button>
      <h1>🧪 {{ i18n.isEn ? s.title_en : s.title_bn }}</h1>

      <!-- Step 1: mode selection (FR-2.1) -->
      <section class="ds-card block">
        <h2><span class="num">1</span> {{ i18n.t('chooseMode') }}</h2>
        <div class="modes">
          <button class="mode-card" [class.selected]="mode()==='guided'" [disabled]="!s.supports_guided" (click)="mode.set('guided')">
            <span class="mico">🧭</span>
            <strong>{{ i18n.t('guidedMode') }}</strong>
            <span class="mdesc">{{ i18n.isEn ? 'Step-by-step instructions, hints and instant feedback.' : 'ধাপে ধাপে নির্দেশনা, ইঙ্গিত ও তাৎক্ষণিক ফিডব্যাক।' }}</span>
          </button>
          <button class="mode-card" [class.selected]="mode()==='free'" [disabled]="!s.supports_free" (click)="mode.set('free')">
            <span class="mico">🎯</span>
            <strong>{{ i18n.t('nonGuidedMode') }}</strong>
            <span class="mdesc">{{ i18n.isEn ? 'Perform the experiment on your own; feedback at the end.' : 'নিজে পরীক্ষা করুন; ফলাফল শেষে।' }}</span>
          </button>
        </div>
      </section>

      <!-- Step 2: safety checklist (FR-8) -->
      <section class="ds-card block">
        <h2><span class="num">2</span> {{ i18n.t('safetyCheck') }}</h2>
        <p class="hint">{{ i18n.t('selectAllRequired') }}</p>
        <div class="equip-grid" *ngIf="safety() as sf">
          <label class="equip" *ngFor="let e of sf.equipment" [class.req]="isRequired(e.key)" [class.checked]="selected().includes(e.key)">
            <input type="checkbox" [checked]="selected().includes(e.key)" (change)="toggle(e.key)">
            <span class="eico">{{ e.icon }}</span>
            <span class="ename">{{ i18n.isEn ? e.name_en : e.name_bn }}</span>
            <span class="reqtag" *ngIf="isRequired(e.key)">★</span>
          </label>
        </div>
        <p class="missing" *ngIf="missing().length">
          ⚠️ {{ i18n.isEn ? 'Still required:' : 'এখনও প্রয়োজন:' }}
          {{ missingNames() }}
        </p>
        <p class="extra" *ngIf="hasExtra()">
          ℹ️ {{ i18n.isEn ? 'You selected items not needed for this experiment (that is fine, but not required).' : 'আপনি এমন সামগ্রী নির্বাচন করেছেন যা এই পরীক্ষার জন্য প্রয়োজন নেই (সমস্যা নেই, তবে আবশ্যক নয়)।' }}
        </p>
      </section>

      <button class="ds-btn ds-btn-primary start" [disabled]="!canStart()" (click)="start()">
        ▶ {{ i18n.t('startLab') }}
      </button>
    </div>
  `,
  styles: [`
    .page { max-width: 720px; margin: 0 auto; padding: 24px 20px; }
    .back { margin-bottom: 12px; }
    .ds-btn.small { padding: 5px 10px; font-size: 0.78rem; }
    h1 { color: var(--brand); font-size: 1.4rem; }
    .block { padding: 18px; margin-bottom: 16px; }
    .block h2 { display: flex; align-items: center; gap: 8px; font-size: 1.05rem; margin: 0 0 12px; }
    .num { display: inline-grid; place-items: center; width: 24px; height: 24px; border-radius: 50%; background: var(--brand); color: #fff; font-size: 0.8rem; }
    .modes { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .mode-card { display: flex; flex-direction: column; gap: 6px; text-align: left; padding: 16px; border: 2px solid var(--border); border-radius: var(--radius); background: var(--surface); }
    .mode-card:hover:not(:disabled) { border-color: var(--brand); }
    .mode-card.selected { border-color: var(--brand); background: var(--brand-soft); }
    .mode-card:disabled { opacity: 0.45; }
    .mico { font-size: 1.6rem; }
    .mode-card strong { color: var(--text); }
    .mdesc { font-size: 0.8rem; color: var(--text-muted); }
    .hint { font-size: 0.85rem; color: var(--text-muted); margin: 0 0 12px; }
    .equip-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px; }
    .equip { display: flex; align-items: center; gap: 8px; padding: 10px; border: 1px solid var(--border); border-radius: var(--radius-sm); cursor: pointer; position: relative; }
    .equip.checked { border-color: var(--brand); background: var(--brand-soft); }
    .equip.req .ename { font-weight: 700; }
    .eico { font-size: 1.3rem; }
    .ename { font-size: 0.85rem; }
    .reqtag { position: absolute; top: 4px; right: 6px; color: var(--accent-warm); font-size: 0.8rem; }
    .missing { color: var(--danger); font-size: 0.85rem; }
    .extra { color: var(--text-muted); font-size: 0.82rem; }
    .start { width: 100%; padding: 14px; font-size: 1rem; }
    @media (max-width: 560px) { .modes { grid-template-columns: 1fr; } }
  `],
})
export class LabLaunchComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private simSvc = inject(SimulationService);
  private labSession = inject(LabSessionService);
  i18n = inject(I18nService);

  key = '';
  sim = signal<any>(null);
  safety = signal<SafetyInfo | null>(null);
  mode = signal<LabMode>('guided');
  selected = signal<string[]>([]);

  missing = computed(() => {
    const req = this.safety()?.requiredKeys || [];
    return req.filter(k => !this.selected().includes(k));
  });
  canStart = computed(() => !!this.sim() && this.missing().length === 0);

  ngOnInit() {
    this.key = this.route.snapshot.paramMap.get('key') || '';
    this.simSvc.getSimulation(this.key).subscribe({
      next: (s) => {
        this.sim.set(s);
        if (!s.supports_guided && s.supports_free) this.mode.set('free');
      },
      error: () => this.router.navigateByUrl('/labs'),
    });
    this.simSvc.getSafety(this.key).subscribe(sf => this.safety.set(sf));
  }

  isRequired(key: string) { return (this.safety()?.requiredKeys || []).includes(key); }

  toggle(key: string) {
    const cur = this.selected();
    this.selected.set(cur.includes(key) ? cur.filter(k => k !== key) : [...cur, key]);
  }

  hasExtra() {
    const req = this.safety()?.requiredKeys || [];
    return this.selected().some(k => !req.includes(k));
  }

  missingNames() {
    const sf = this.safety();
    if (!sf) return '';
    return this.missing()
      .map(k => { const e = sf.equipment.find(x => x.key === k); return e ? (this.i18n.isEn ? e.name_en : e.name_bn) : k; })
      .join(', ');
  }

  start() {
    if (!this.canStart()) return;
    this.labSession.set(this.key, this.mode(), this.selected());
    const route = KEY_TO_ROUTE[this.key];
    if (route) this.router.navigateByUrl(route);
    else this.router.navigateByUrl('/labs');
  }

  cancel() { this.router.navigateByUrl('/labs'); }
}
