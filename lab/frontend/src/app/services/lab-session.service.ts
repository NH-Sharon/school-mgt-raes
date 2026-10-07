import { Injectable } from '@angular/core';

export type LabMode = 'guided' | 'free';

interface LaunchContext { key: string; mode: LabMode; selection: string[]; ts: number; }

// Carries the chosen mode + safety selection from the lab-launch screen into the
// simulation component. A context is single-lab and short-lived; the guard uses
// has() to block direct navigation to a sim without going through lab-launch.
@Injectable({ providedIn: 'root' })
export class LabSessionService {
  private ctx: LaunchContext | null = null;
  private readonly TTL = 5 * 60 * 1000; // 5 min

  set(key: string, mode: LabMode, selection: string[]) {
    this.ctx = { key, mode, selection, ts: Date.now() };
  }

  private valid(key: string): boolean {
    return !!this.ctx && this.ctx.key === key && (Date.now() - this.ctx.ts) < this.TTL;
  }

  has(key: string): boolean { return this.valid(key); }
  getMode(key: string): LabMode { return this.valid(key) ? this.ctx!.mode : 'guided'; }
  getSelection(key: string): string[] { return this.valid(key) ? this.ctx!.selection : []; }
}
