// Guided-mode course: turns a BenchExperiment into an ordered list of checkable steps.
import { getChem } from './chemistry-lab-data';
import { dispenseOf, toolsFor, unitOf, DROP_ML, Tool } from './chem-bench-engine';
import type { BenchExperiment } from './chem-curriculum-9-10';

export type GKind = 'info' | 'add' | 'heat' | 'react' | 'filter' | 'observe';
export interface GStep {
  kind: GKind; bn: string; hintBn?: string;
  chem?: string; need?: number;      // native amount (mL / g) for 'add'
  tool?: Tool; uiAmount?: number;    // value to put on the amount slider (drops for droppers)
}

const TOOL_BN: Record<string, string> = { pour: 'বোতল থেকে ঢেলে', dropper: 'ড্রপার দিয়ে', spoon: 'চামচ দিয়ে', forceps: 'চিমটা দিয়ে' };

export function stepsFor(exp: BenchExperiment): GStep[] {
  const steps: GStep[] = [];
  const vname = exp.vessel === 'b1' ? 'বীকার' : 'টেস্ট টিউব ১';
  steps.push({ kind: 'info', bn: `উদ্দেশ্য: ${exp.aimBn || exp.titleBn}`, hintBn: 'বাঁ দিকের আলমারি থেকে রাসায়নিক আর নিচের ট্রে থেকে যন্ত্র নিতে হবে। প্রস্তুত হলে "শুরু করি" চাপুন।' });
  for (const m of exp.materials) {
    const c = getChem(m.chem);
    if (!c) continue;
    const tool = m.tool ?? toolsFor(dispenseOf(c))[0];
    const native = m.unit === 'drops' ? +(m.amount * DROP_ML).toFixed(3) : m.amount;
    const unitBn = m.unit === 'drops' ? 'ফোঁটা' : m.unit;
    steps.push({
      kind: 'add', chem: m.chem, need: native, tool, uiAmount: m.amount,
      bn: `${c.nameBn} (${c.formula !== '—' ? c.formula : c.nameEn}) — ${m.amount} ${unitBn} ${TOOL_BN[tool] ?? ''} ${vname}-এ নিন।`.replace('  ', ' '),
      hintBn: m.note || `আলমারি থেকে "${c.nameBn}" বেছে ${tool === 'pour' ? '"ঢালা"' : tool === 'dropper' ? '"ড্রপার"' : tool === 'spoon' ? '"চামচ"' : '"চিমটা"'} যন্ত্র নিন, পরিমাণ ${m.amount} ${unitBn} দিয়ে পাত্রে ক্লিক করুন।`,
    });
  }
  if (exp.heat) steps.push({ kind: 'heat', bn: 'বুনসেন বার্নার জ্বালিয়ে পাত্রটি আস্তে আস্তে গরম করুন।', hintBn: 'ট্রে থেকে "বুনসেন বার্নার" বেছে পাত্রে ক্লিক করুন। ১০০°C-এর আগেই নিভিয়ে দেবেন।' });
  if (!exp.noReact) steps.push({ kind: 'react', bn: exp.demo ? '"বিক্রিয়া ঘটান" বোতাম চাপুন — মেশানো/দ্রবীভূত হওয়া শুরু হবে; সময়ের গতি ঠিক করে নিন।' : '"বিক্রিয়া ঘটান" বোতাম চাপুন এবং সময়ের গতি ঠিক করে নিন।', hintBn: 'পাত্রের নিচের "বিক্রিয়া" বোতামে বা ডানের "বিক্রিয়া ঘটান" বোতামে চাপ দিন।' });
  if (exp.filter) steps.push({ kind: 'filter', bn: 'ফানেল বসিয়ে মিশ্রণটি ছেঁকে নিন (অধঃক্ষেপ ফিল্টার পেপারে থাকবে)।', hintBn: 'প্রথমে "ফানেল" দিয়ে বীকার/ফ্লাস্কে ফানেল বসান, তারপর "এক পাত্র থেকে অন্যটিতে ঢালা" দিয়ে ঢালুন।' });
  steps.push({ kind: 'observe', bn: `${exp.needTemp ? `তাপমাত্রা ${exp.needTemp}°C-এর কাছাকাছি হলে` : 'শেষ হলে'} পর্যবেক্ষণ করুন: ${exp.observeBn.join(' ')}`, hintBn: 'ডানের "পর্যবেক্ষণ" প্যানেলে কী ঘটল, কেন ঘটল পড়ুন, তারপর "বুঝেছি" চাপুন।' });
  return steps;
}

export function unitLabelOf(chemId: string): string { const c = getChem(chemId); return c ? unitOf(c) : ''; }
