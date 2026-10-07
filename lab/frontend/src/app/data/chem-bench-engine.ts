// Chemistry Bench engine — pure functions.
// A vessel's visible state is DERIVED from what was put in it (contents) + reaction phase + elapsed reaction time.
// Amounts are in NATIVE units: liquids in mL, powders/metals in g. Moles: liquids = mL/1000 × 1 mol/L (assumed), solids = g / molar mass.
// Derived values (moles, gas volume, ΔT, reaction time) are teaching estimates — see assumptions text in the explanation panel.
import { INDICATOR_BEHAVIOR, Chemical, Reaction, CHEMICALS, getChem } from './chemistry-lab-data';
import { ALL_REACTIONS, MOLAR_MASS, CONC, GAS_MOLAR_VOLUME_ML, kineticsOf, textFor, noReactionReason, HAZARD, SURE_NO_REACTION_ID } from './chem-bench-explain';

export type Tool = 'pour' | 'dropper' | 'spoon' | 'forceps' | 'transfer' | 'funnel' | 'burner' | 'stir' | 'wash';
export type Dispense = 'bottle' | 'powder' | 'metal' | 'indicator';
export type Character = 'acid' | 'base' | 'neutral';
export type Phase = 'fresh' | 'reacting' | 'settled';

export const DROP_ML = 0.05;

export function dispenseOf(c: Chemical): Dispense {
  if (c.type === 'indicator') return 'indicator';
  if (c.type === 'metal') return 'metal';
  if (c.id === 'Na2CO3' || c.id === 'NH4Cl') return 'powder';
  return 'bottle';
}
export function toolsFor(d: Dispense): Tool[] {
  return d === 'bottle' ? ['pour', 'dropper'] : d === 'powder' ? ['spoon'] : d === 'metal' ? ['forceps'] : ['dropper'];
}
/** unit label + slider range for a tool (what the student chooses) */
export interface AmountSpec { unit: 'mL' | 'g' | 'drops'; min: number; max: number; step: number; def: number; chips: number[]; }
export const AMOUNT_SPEC: Partial<Record<Tool, AmountSpec>> = {
  pour: { unit: 'mL', min: 1, max: 20, step: 1, def: 5, chips: [1, 2, 5, 10, 15] },
  dropper: { unit: 'drops', min: 1, max: 40, step: 1, def: 5, chips: [1, 3, 5, 10, 20] },
  spoon: { unit: 'g', min: 0.1, max: 5, step: 0.1, def: 1, chips: [0.2, 0.5, 1, 2, 4] },
  forceps: { unit: 'g', min: 0.1, max: 3, step: 0.1, def: 0.5, chips: [0.1, 0.3, 0.5, 1, 2] },
};
/** native amount (mL or g) for a slider value */
export function toNative(tool: Tool, value: number): number { return tool === 'dropper' ? +(value * DROP_ML).toFixed(3) : value; }

export interface Mix { color: string; character: Character; precip: { color: string; name: string; amount: number } | null; }
/** chemId + amount (mL/g), or an inert mixture with amount in mL */
export interface Content { chemId?: string; amount: number; mix?: Mix; }

export interface Explain {
  kind: 'reaction' | 'no-reaction' | 'unmodelled' | 'indicator' | 'incomplete';
  title: string; equation?: string; ionic?: string;
  what: string[]; why: string[]; how: string[]; qty: string[]; time: string[]; use?: string; safety?: string;
}
export interface Risk { level: 'info' | 'warn' | 'danger'; text: string; }
export interface Row { id: string; name: string; formula: string; amount: string; mol: string; }
export interface SolidView { id: string; color: string; remaining: number; count: number; deposit: number; depositColor: string; tree: boolean; }
export interface View {
  color: string; liquidAmount: number;
  precip: { color: string; name: string; amount: number } | null; // amount in mmol
  solids: SolidView[]; bubbles: number; gas: string; smell: string; warm: boolean; character: Character;
  explain: Explain | null; reactionId: string | null;
  rows: Row[]; risks: Risk[];
  progress: number; done: boolean; tTotal: number; temp: number; gasMl: number; reacting: boolean; hasReaction: boolean;
  fumes: '' | 'steam' | 'pungent' | 'white'; foam: number; suspension: number; flakes: number;
}
export const EMPTY_VIEW: View = {
  color: '#eef6fb', liquidAmount: 0, precip: null, solids: [], bubbles: 0, gas: '', smell: '', warm: false, character: 'neutral',
  explain: null, reactionId: null, rows: [], risks: [], progress: 0, done: false, tTotal: 0, temp: 25, gasMl: 0, reacting: false, hasReaction: false,
  fumes: '', foam: 0, suspension: 0, flakes: 0,
};
export interface SimOpts { isEn: boolean; phase: Phase; t: number; baseTemp: number; heated: boolean; cap: number; }

// ---------- helpers ----------
const CLEAR = '#eef6fb';
const charOf = (c: Chemical): Character => c.type === 'acid' ? 'acid' : c.type === 'base' ? 'base' : 'neutral';
const fmt = (n: number, d = 2) => { const v = +n.toFixed(d); return String(v); };
const isSolidLike = (c: Chemical) => c.state === 'solid' || dispenseOf(c) === 'powder';
export function molesOf(c: Chemical, amount: number): number {
  return isSolidLike(c) ? amount / (MOLAR_MASS[c.id] || 100) : (amount / 1000) * CONC;
}
export function unitOf(c: Chemical): string { return isSolidLike(c) ? 'g' : 'mL'; }

function hexToRgb(h: string): [number, number, number] {
  const m = h.replace('#', '');
  const f = m.length === 3 ? m.split('').map(c => c + c).join('') : m;
  return [parseInt(f.slice(0, 2), 16), parseInt(f.slice(2, 4), 16), parseInt(f.slice(4, 6), 16)];
}
function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
}
export function blend(parts: { color: string; w: number }[]): string {
  const tot = parts.reduce((s, p) => s + p.w, 0);
  if (tot <= 0) return CLEAR;
  let r = 0, g = 0, b = 0;
  parts.forEach(p => { const [pr, pg, pb] = hexToRgb(p.color); r += pr * p.w; g += pg * p.w; b += pb * p.w; });
  return rgbToHex(r / tot, g / tot, b / tot);
}
function coefOf(eq: string, marker: string): number {
  const rhs = (eq.split('→')[1] || '').split('+').map(s => s.trim());
  const term = marker ? rhs.find(s => s.includes(marker)) : rhs[rhs.length - 1];
  const m = term?.match(/^(\d+)/);
  return m ? +m[1] : 1;
}

export function findReactionAmong(ids: string[]): Reaction | undefined {
  for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) {
    const key = [ids[i], ids[j]].sort().join('|');
    const r = ALL_REACTIONS.find(x => x.reactants.map(y => y.id).sort().join('|') === key);
    if (r) return r;
  }
  return undefined;
}

function mergeById(list: Content[]): { chem: Chemical; amount: number }[] {
  const map = new Map<string, { chem: Chemical; amount: number }>();
  list.forEach(c => {
    if (!c.chemId) return;
    const chem = getChem(c.chemId);
    if (!chem) return;
    const cur = map.get(c.chemId);
    if (cur) cur.amount += c.amount; else map.set(c.chemId, { chem, amount: c.amount });
  });
  return [...map.values()];
}

interface Info {
  reaction: Reaction | null; part: Record<string, number>; xiMax: number; xi: number; p: number;
  productColor: string; consumedFrac: Record<string, number>; productMl: number;
}

function productColorOf(r: Reaction): string {
  const cc = r.effects.colorChange;
  if (cc === 'blue-to-pale-green' || cc === 'to-pale-green') return '#cfe8cf';
  if (cc === 'to-blue') return '#3f7fd1';
  return r.effects.precipitate ? '#f4f8fb' : CLEAR;
}

// ---------- main analysis ----------
export function analyze(contents: Content[], o: SimOpts): { view: View; info: Info } {
  const en = o.isEn;
  const merged = mergeById(contents);
  const mixes = contents.filter(c => c.mix);
  const mains = merged.filter(m => m.chem.type !== 'indicator');
  const inds = merged.filter(m => m.chem.type === 'indicator');
  const liquidMains = mains.filter(m => !isSolidLike(m.chem));
  const solidMains = mains.filter(m => isSolidLike(m.chem));
  const info: Info = { reaction: null, part: {}, xiMax: 0, xi: 0, p: 0, productColor: CLEAR, consumedFrac: {}, productMl: 0 };

  const baseLiquidMl = liquidMains.reduce((s, m) => s + m.amount, 0) + inds.reduce((s, m) => s + m.amount, 0) + mixes.reduce((s, m) => s + m.amount, 0);

  // ---- ingredient table ----
  const rows: Row[] = merged.map(m => ({
    id: m.chem.id, name: en ? m.chem.nameEn : m.chem.nameBn, formula: m.chem.formula,
    amount: `${fmt(m.amount, m.amount < 1 ? 2 : 1)} ${unitOf(m.chem)}`,
    mol: m.chem.type === 'indicator' ? '—' : `${fmt(molesOf(m.chem, m.amount), 4)} mol`,
  }));
  const mixMl = mixes.reduce((s, m) => s + m.amount, 0);
  if (mixMl > 0 || mixes.length) rows.push({ id: '__mix', name: en ? 'Reaction product solution' : 'বিক্রিয়াজাত দ্রবণ', formula: '', amount: `${fmt(mixMl, 1)} mL`, mol: '—' });
  let precipPrev: View['precip'] = null;
  mixes.forEach(m => { const mp = m.mix!.precip; if (mp) { const prev = precipPrev ? (precipPrev as NonNullable<View['precip']>).amount : 0; precipPrev = { ...mp, amount: prev + mp.amount }; } });
  if (precipPrev) rows.push({ id: '__ppt', name: (precipPrev as NonNullable<View['precip']>).name, formula: '↓', amount: '—', mol: `${fmt((precipPrev as NonNullable<View['precip']>).amount / 1000, 4)} mol` });

  // ---- which reaction applies ----
  let reaction = findReactionAmong(mains.map(m => m.chem.id)) ?? null;
  const knownNoReact = !!reaction && (reaction.category === 'no-reaction' || SURE_NO_REACTION_ID.has(reaction.id));
  if (reaction && !knownNoReact) {
    reaction.reactants.forEach(r => info.part[r.id] = r.part);
  } else { if (knownNoReact) { /* keep reaction for explanation of "why not" */ } }
  const real = reaction && !knownNoReact ? reaction : null;
  info.reaction = real;

  let pairMains: { chem: Chemical; amount: number }[] = [];
  let limiting: Chemical | null = null;
  let excessChem: Chemical | null = null;
  if (real) {
    pairMains = mains.filter(m => info.part[m.chem.id] !== undefined);
    const ratios = pairMains.map(m => molesOf(m.chem, m.amount) / info.part[m.chem.id]);
    info.xiMax = Math.min(...ratios);
    limiting = pairMains[ratios.indexOf(info.xiMax)].chem;
    pairMains.forEach(m => { if (molesOf(m.chem, m.amount) - info.xiMax * info.part[m.chem.id] > 1e-6) excessChem = m.chem; });
  }

  // ---- kinetics & progress ----
  const kin = real ? kineticsOf(real) : null;
  let sizeFactor = 1;
  const metalInPair = pairMains.find(m => m.chem.type === 'metal');
  if (metalInPair) sizeFactor = Math.max(0.6, Math.min(2.5, Math.sqrt(metalInPair.amount / 1)));
  const tempFactor = Math.pow(2, (o.baseTemp - 25) / 10);
  const tauEff = kin ? (kin.tau * sizeFactor) / tempFactor : 1;
  const lagEff = kin?.lag ? kin.lag / tempFactor : 0;
  const tTotal = kin ? lagEff + 5.3 * tauEff : 0;
  const reactingNow = o.phase === 'reacting';
  let p = 0;
  if (real && reactingNow) {
    p = o.t <= lagEff ? 0 : 1 - Math.exp(-(o.t - lagEff) / tauEff);
    if (p >= 0.995) p = 1;
  }
  info.p = p;
  info.xi = info.xiMax * p;
  const done = reactingNow && (!real || p >= 1);

  // ---- consumption ----
  solidMains.forEach(() => { /* handled below */ });
  const solids: SolidView[] = solidMains.map(m => ({ id: m.chem.id, color: m.chem.color, remaining: 1, count: Math.min(6, Math.max(1, Math.ceil(m.amount * 2))), deposit: 0, depositColor: '#b5651d', tree: false }));
  let productMl = 0;
  const liquidRemainParts: { color: string; w: number }[] = [];
  if (real) {
    pairMains.forEach(m => {
      const f = Math.min(1, (info.part[m.chem.id] * info.xi) / molesOf(m.chem, m.amount));
      info.consumedFrac[m.chem.id] = f;
      const s = solids.find(x => x.id === m.chem.id);
      if (s) {
        s.remaining = 1 - f;
        if (real.category === 'displacement' && real.effects.precipitate) {
          s.deposit = Math.min(1, info.p * 1.2); s.depositColor = real.effects.precipitate.color; s.tree = real.id === 'disp-cu-agno3';
          s.remaining = Math.max(s.remaining, 0.55); // the metal piece is coated, not gone
        }
      }
    });
  }
  liquidMains.forEach(m => {
    const f = info.consumedFrac[m.chem.id] || 0;
    productMl += m.amount * f;
    liquidRemainParts.push({ color: m.chem.color, w: m.amount * (1 - f) });
  });
  info.productMl = productMl;
  info.productColor = real ? productColorOf(real) : CLEAR;

  // ---- character (for indicators) ----
  let character: Character;
  if (real) character = excessChem ? charOf(excessChem) : 'neutral';
  else {
    const hasAcid = mains.some(m => m.chem.type === 'acid') || mixes.some(m => m.mix!.character === 'acid');
    const hasBase = mains.some(m => m.chem.type === 'base') || mixes.some(m => m.mix!.character === 'base');
    character = hasAcid && !hasBase ? 'acid' : hasBase && !hasAcid ? 'base' : 'neutral';
  }

  // ---- colour ----
  const colorParts = [...liquidRemainParts];
  if (productMl > 0) colorParts.push({ color: info.productColor, w: productMl });
  mixes.forEach(m => colorParts.push({ color: m.mix!.color, w: m.amount }));
  let color = colorParts.some(c => c.w > 0) ? blend(colorParts) : CLEAR;
  const ind = inds[0]?.chem;
  const indMl = inds.reduce((s, m) => s + m.amount, 0);
  if (ind) {
    const indColor = INDICATOR_BEHAVIOR[ind.id][character].color;
    const reactIndicatorApplies = !real || real.category === 'neutralization' || real.category.startsWith('gas-');
    if (o.phase === 'fresh') {
      color = blend([{ color, w: Math.max(baseLiquidMl - indMl, 0.01) }, { color: ind.color, w: indMl * 2 }]);
    } else if (reactIndicatorApplies && baseLiquidMl > 0) {
      const w = real && reactingNow ? p : 1;
      color = blend([{ color: blend([{ color, w: Math.max(baseLiquidMl - indMl, 0.01) }, { color: ind.color, w: indMl * 2 }]), w: 1 - w + 0.0001 }, { color: indColor, w: w + 0.0001 }]);
    } else if (baseLiquidMl > 0) {
      color = blend([{ color, w: Math.max(baseLiquidMl - indMl, 0.01) }, { color: ind.color, w: indMl * 2 }]);
    }
  }

  // ---- quantities / effects ----
  const eff = real?.effects;
  const gasCoef = real ? coefOf(real.equation, '↑') : 0;
  const gasMlMax = real && eff?.gas ? info.xiMax * gasCoef * GAS_MOLAR_VOLUME_ML : 0;
  const gasMl = real && eff?.gas ? info.xi * gasCoef * GAS_MOLAR_VOLUME_ML : 0;
  const pCoef = real && eff?.precipitate ? coefOf(real.equation, real.equation.includes('↓') ? '↓' : '') : 0;
  let precip = precipPrev as View['precip'];
  if (real && eff?.precipitate && info.xi > 0) {
    const prev = precip ? (precip as NonNullable<View['precip']>).amount : 0;
    precip = { color: eff.precipitate.color, name: eff.precipitate.name, amount: prev + info.xi * pCoef * 1000 };
  }
  const heatMass = Math.max(baseLiquidMl, 2);
  const dTmax = real && kin ? Math.min(60, (info.xiMax * kin.dH * 1000) / (heatMass * 4.18)) : 0;
  const dT = real && kin ? Math.min(60, (info.xi * kin.dH * 1000) / (heatMass * 4.18)) : 0;
  const temp = o.baseTemp + dT;

  const vigorN: Record<string, number> = { none: 0, low: 4, medium: 9, high: 15 };
  let bubbles = 0;
  if (real && eff?.gas && reactingNow && p < 1 && p > 0) {
    const rate = Math.exp(-(o.t - lagEff) / tauEff);
    const scale = Math.max(0.4, Math.min(1.5, Math.sqrt((info.xiMax * 1000) / 5)));
    bubbles = Math.max(2, Math.round((vigorN[eff.vigor || 'medium'] ?? 9) * scale * (0.3 + 0.7 * rate)));
  } else if (real && eff?.gas && reactingNow && p === 0 && o.t > 0) bubbles = 0;
  if (o.heated && o.baseTemp > 60 && baseLiquidMl > 0) bubbles = Math.max(bubbles, Math.min(14, Math.round((o.baseTemp - 55) / 3)));

  const gas = real && eff?.gas && gasMl > 0.05 ? `${eff.gas} ${en ? 'gas' : 'গ্যাস'} ≈ ${fmt(gasMl, gasMl < 10 ? 1 : 0)} mL ↑` : '';
  const smell = real && reactingNow && p > 0.05
    ? (eff?.smell === 'pungent' ? (en ? '👃 Pungent smell' : '👃 ঝাঁঝালো গন্ধ') : eff?.smell === 'vinegar' ? (en ? '👃 Vinegar-like smell' : '👃 ভিনেগারের মতো গন্ধ') : '') : '';
  const warm = dT > 1;

  // ---- visual cues: fumes, foam, cloudiness of a forming precipitate ----
  let fumes: View['fumes'] = '';
  if (o.baseTemp >= 75 && baseLiquidMl > 0) fumes = 'steam';
  if (real && reactingNow && p > 0 && p < 1) {
    if (eff?.gas === 'NH₃') fumes = 'pungent';
    if (real.id === 'neut-hcl-nh4oh') fumes = 'white';
  }
  const foam = real && reactingNow && eff?.gas && p > 0 && p < 1 ? Math.min(1, bubbles / 16) * (real.category === 'gas-carbonate' ? 1 : 0.35) : 0;
  const pptMmolNow = precip ? (precip as NonNullable<View['precip']>).amount : 0;
  const suspension = real && reactingNow && eff?.precipitate && real.category === 'precipitation' && baseLiquidMl > 0
    ? Math.min(0.85, (pptMmolNow / baseLiquidMl) * 1.4) : 0;
  const flakes = suspension > 0.05 ? 12 : 0;

  // ---- explanation ----
  let explain: Explain | null = null;
  if (reactingNow) {
    if (real && kin) {
      const txt = textFor(real);
      const nm = (c: Chemical) => `${c.nameBn} (${c.formula})`;
      const qty: string[] = [];
      pairMains.forEach(m => qty.push(`${nm(m.chem)}: ${fmt(m.amount, 2)} ${unitOf(m.chem)} = ${fmt(molesOf(m.chem, m.amount), 4)} mol — সমীকরণে অনুপাত ${info.part[m.chem.id]}`));
      qty.push(`সীমাবদ্ধ বিক্রিয়ক (limiting): ${limiting ? nm(limiting) : '—'} — এটি আগে শেষ হয়, তাই উৎপাদ এর পরিমাণের উপর নির্ভর করে।`);
      if (excessChem) {
        const ex = pairMains.find(m => m.chem.id === (excessChem as Chemical).id)!;
        const left = molesOf(ex.chem, ex.amount) - info.xiMax * info.part[ex.chem.id];
        const leftAmt = ex.amount * (left / molesOf(ex.chem, ex.amount));
        qty.push(`অতিরিক্ত বিক্রিয়ক: ${nm(ex.chem)} — বিক্রিয়ার পরে প্রায় ${fmt(left, 4)} mol (${fmt(leftAmt, 2)} ${unitOf(ex.chem)}) অবশিষ্ট থাকবে।`);
      } else qty.push('দুটি বিক্রিয়ক প্রায় সঠিক অনুপাতে আছে — দুটোই প্রায় সম্পূর্ণ শেষ হবে।');
      if (eff?.gas) qty.push(`উৎপন্ন ${eff.gas}: সর্বোচ্চ ${fmt(info.xiMax * gasCoef, 4)} mol ≈ ${fmt(gasMlMax, 0)} mL (২৫°C-এ ২৪ L/mol ধরে)। এখন পর্যন্ত ≈ ${fmt(gasMl, 0)} mL।`);
      if (eff?.precipitate) qty.push(`অধঃক্ষেপ: সর্বোচ্চ ${fmt(info.xiMax * pCoef * 1000, 2)} mmol (${eff.precipitate.name})।`);
      if (kin.dH > 0) qty.push(`আনুমানিক তাপমাত্রা বৃদ্ধি: সর্বোচ্চ +${fmt(dTmax, 1)}°C (ΔH ≈ ${kin.dH} kJ/mol ধরে; এটি আনুমানিক হিসাব)।`);
      qty.push('ধরে নেওয়া হয়েছে: সব দ্রবণ ১ mol/L, ঘরের তাপমাত্রা ২৫°C।');
      if (gasMlMax < 2 && !eff?.precipitate && dTmax < 2) qty.push('⚠️ পরিমাণ খুব কম — বিক্রিয়া ঘটলেও পর্যবেক্ষণ করা কঠিন। আরও বেশি নিন।');
      const time: string[] = [`গতি: ${kin.note}।`, `সম্পূর্ণ হতে প্রায় ${fmt(tTotal, 0)} সেকেন্ড লাগবে (বর্তমান তাপমাত্রা ${fmt(o.baseTemp, 0)}°C-এ)।`];
      if (sizeFactor > 1.2) time.push(`ধাতুর টুকরা বড় (${fmt(metalInPair!.amount, 1)} g) → পৃষ্ঠতল তুলনামূলক কম → বিক্রিয়া ধীর।`);
      else if (sizeFactor < 0.9 && metalInPair) time.push('ধাতুর টুকরা ছোট → পৃষ্ঠতল বেশি → বিক্রিয়া দ্রুত।');
      time.push('তাপমাত্রা প্রতি ১০°C বাড়লে বিক্রিয়ার গতি প্রায় দ্বিগুণ হয় — বার্নার জ্বালালে সময় কমবে (কিন্তু ঝুঁকিও বাড়ে)।');
      if (kin.lag) time.push('শুরুতে কিছুক্ষণ বিক্রিয়া দেখা যাবে না — ধাতুর অক্সাইড স্তর ক্ষয় হওয়ার সময়।');
      explain = {
        kind: 'reaction', title: real.nameBn, equation: real.equation, ionic: txt.ionic,
        what: [real.observationBn, ...(ind && (real.category === 'neutralization' || real.category.startsWith('gas-')) ? [`${ind.nameBn}: ${INDICATOR_BEHAVIOR[ind.id][character].label} (বিক্রিয়ার পরের দ্রবণ ${character === 'acid' ? 'অম্লীয়' : character === 'base' ? 'ক্ষারীয়' : 'প্রায় নিরপেক্ষ'})`] : [])], why: txt.why, how: txt.how, qty, time, use: real.useBn !== '—' ? real.useBn : undefined, safety: real.safetyBn,
      };
    } else if (mains.length >= 2) {
      const ids = mains.map(m => m.chem.id);
      const r2 = reaction && knownNoReact ? reaction : null;
      const rr = noReactionReason(ids[0], ids[1]);
      const names = mains.map(m => m.chem.nameBn).join(' + ');
      const unm = !r2 && !rr.sure;
      explain = {
        kind: unm ? 'unmodelled' : 'no-reaction',
        title: unm ? 'এই জোড়ার বিক্রিয়া ল্যাবের ডেটায় নেই' : 'কোনো বিক্রিয়া ঘটেনি',
        equation: r2 ? (r2.equation.includes('→') && r2.equation !== 'কোনো বিক্রিয়া নেই' ? r2.equation : `${names} → কোনো বিক্রিয়া নেই`) : `${names} → কোনো বিক্রিয়া নেই`,
        what: [r2 ? r2.observationBn : (unm ? 'এই ল্যাবে এই বিক্রিয়াটি মডেল করা হয়নি, তাই কোনো পরিবর্তন দেখানো হচ্ছে না।' : 'কোনো গ্যাস, অধঃক্ষেপ, রং বা তাপের পরিবর্তন দেখা যায়নি — শুধু মিশ্রণ হয়েছে।')],
        why: r2 && ['no-cu-hcl', 'no-nacl-na2so4'].includes(r2.id) ? noReactionReason(...((r2.reactants.map(x => x.id)) as [string, string])).why : rr.why,
        how: r2 && ['no-cu-hcl', 'no-nacl-na2so4'].includes(r2.id) ? noReactionReason(...((r2.reactants.map(x => x.id)) as [string, string])).how : rr.how,
        qty: mains.map(m => `${m.chem.nameBn} (${m.chem.formula}): ${fmt(m.amount, 2)} ${unitOf(m.chem)} = ${fmt(molesOf(m.chem, m.amount), 4)} mol — এই পরিমাণেও বিক্রিয়া হয় না, কারণ সমস্যা পরিমাণের নয় — পদার্থের ধর্মের।`),
        time: ['বেশি সময় বা বেশি পরিমাণ নিলেও এই ক্ষেত্রে বিক্রিয়া শুরু হবে না।'],
        use: r2?.useBn && r2.useBn !== '—' ? r2.useBn : undefined, safety: r2?.safetyBn,
      };
    } else if (mains.length === 1 && ind) {
      const m = mains[0].chem; const b = INDICATOR_BEHAVIOR[ind.id][character];
      const cn = character === 'acid' ? 'এসিড' : character === 'base' ? 'ক্ষার' : 'নিরপেক্ষ পদার্থ';
      explain = {
        kind: 'indicator', title: `${ind.nameBn} পরীক্ষা`, equation: `${m.nameBn} + ${ind.nameBn}`,
        what: [`${ind.nameBn} ${b.label}।`, `এ থেকে প্রমাণ হয় ${m.nameBn} একটি ${cn}।`],
        why: ['নির্দেশক এমন রঞ্জক পদার্থ যার অণুর গঠন H⁺ (এসিড) বা OH⁻ (ক্ষার)-এর উপস্থিতিতে বদলে যায়, ফলে রং বদলায়।', character === 'neutral' ? 'নিরপেক্ষ পদার্থে H⁺ ও OH⁻ সমান, তাই কোনো উল্লেখযোগ্য রং পরিবর্তন হয় না।' : `এখানে দ্রবণ ${cn} হওয়ায় নির্দেশকের রং ${b.label}।`],
        how: ['১) নির্দেশকের ফোঁটা দ্রবণে মেশে।', '২) দ্রবণের H⁺/OH⁻ নির্দেশক অণুর সাথে যুক্ত হয়ে তার গঠন বদলায়।', '৩) গঠন বদলালে আলো শোষণ বদলায় — তাই আমরা ভিন্ন রং দেখি।'],
        qty: [`${m.nameBn}: ${fmt(mains[0].amount, 2)} ${unitOf(m)} | নির্দেশক: ${fmt(indMl / DROP_ML, 0)} ফোঁটা (${fmt(indMl, 2)} mL)`, 'নির্দেশক কেবল শনাক্ত করে; এটি বিক্রিয়ায় উল্লেখযোগ্য পরিমাণে অংশ নেয় না — তাই অল্প ফোঁটাই যথেষ্ট।'],
        time: ['রং পরিবর্তন প্রায় তাৎক্ষণিক।'],
      };
    } else {
      const only = ind && !mains.length;
      explain = {
        kind: 'incomplete', title: only ? 'শুধু নির্দেশক দিয়ে পরীক্ষা সম্ভব নয়' : 'বিক্রিয়ার জন্য আরও একটি পদার্থ দরকার',
        what: [only ? 'পাত্রে শুধু নির্দেশক আছে।' : 'পাত্রে মাত্র একটি পদার্থ আছে।'],
        why: only ? ['নির্দেশকের রং বদলাতে এসিড বা ক্ষার দরকার — যেটি পরীক্ষা করবেন সেটি আগে পাত্রে নিন।'] : ['রাসায়নিক বিক্রিয়ার জন্য কমপক্ষে দুটি ভিন্ন বিক্রিয়ক লাগে (অথবা একটি পদার্থ ও একটি নির্দেশক)।'],
        how: ['আলমারি থেকে আরেকটি রাসায়নিক বেছে একই পাত্রে যোগ করুন, তারপর আবার "বিক্রিয়া ঘটান" চাপুন।'], qty: [], time: [],
      };
    }
  }

  // ---- risks ----
  const risks: Risk[] = [];
  const hasGas = (g: string) => !!real && real.effects.gas === g;
  const pred = real ?? null;
  const flame = o.heated;
  if (pred && hasGas('H₂')) {
    if (flame) risks.push({ level: 'danger', text: '🔥 বার্নার জ্বলছে অথচ হাইড্রোজেন (H₂) উৎপন্ন হবে/হচ্ছে — H₂ অত্যন্ত দাহ্য, বাতাসের সাথে মিশে বিস্ফোরণ ঘটাতে পারে! এখনই বার্নার নিভান।' });
    else risks.push({ level: 'info', text: 'H₂ গ্যাস দাহ্য — বার্নার/খোলা আগুনের কাছে বিক্রিয়া করাবেন না।' });
    if (pred.effects.vigor === 'high') risks.push({ level: 'warn', text: 'তীব্র বিক্রিয়া: প্রচুর তাপ ও দ্রুত গ্যাস — অল্প পরিমাণ নিন, মুখ সরিয়ে রাখুন।' });
  }
  if (pred && hasGas('NH₃')) risks.push({ level: flame ? 'danger' : 'warn', text: flame ? '☣️ গরম অবস্থায় প্রচুর অ্যামোনিয়া (NH₃) নির্গত হবে — ঝাঁঝালো ও শ্বাসকষ্টকর; ফিউম হুডে কাজ করুন, মুখ দূরে রাখুন।' : '☣️ অ্যামোনিয়া (NH₃) ঝাঁঝালো ও চোখ-নাকে জ্বালাকর গ্যাস — সরাসরি শুঁকবেন না।' });
  if (pred && pred.category === 'gas-carbonate') {
    const fill = baseLiquidMl / o.cap;
    if (fill > 0.8) risks.push({ level: 'danger', text: '🫧 পাত্র প্রায় ভর্তি — CO₂-এর ফেনা উপচে পড়বে! কম পরিমাণ নিন বা বড় পাত্র ব্যবহার করুন।' });
    else if (fill > 0.5) risks.push({ level: 'warn', text: '🫧 CO₂ ফেনা তৈরি করে — পাত্র অর্ধেকের বেশি ভরা থাকলে উপচে পড়তে পারে।' });
  }
  if (pred && dTmax >= 35) risks.push({ level: 'danger', text: `🌡️ তাপমাত্রা প্রায় +${fmt(dTmax, 0)}°C বাড়বে — ফুটে ছিটকে পড়ার ও পোড়ার ঝুঁকি! কম পরিমাণ নিন।` });
  else if (pred && dTmax >= 15) risks.push({ level: 'warn', text: `🌡️ পাত্র বেশ গরম হবে (+${fmt(dTmax, 0)}°C) — হাত দিয়ে ধরবেন না, টেস্ট টিউব হোল্ডার ব্যবহার করুন।` });
  if (o.baseTemp >= 90) risks.push({ level: 'danger', text: '♨️ তরল প্রায় ফুটছে — ছিটকে পড়তে পারে। মুখ পাত্রের দিকে/কারো দিকে রাখবেন না; বার্নার নিভান।' });
  if (o.heated && baseLiquidMl === 0 && contents.length) risks.push({ level: 'warn', text: '⚠️ খালি/শুকনো পাত্র গরম করলে কাচ ফেটে যেতে পারে — আগে তরল যোগ করুন।' });
  if (o.heated && o.cap <= 20 && baseLiquidMl / o.cap > 0.6) risks.push({ level: 'warn', text: '⚠️ গরম করার সময় টেস্ট টিউবে এক-তৃতীয়াংশের বেশি তরল নেবেন না — ফুটে ছিটকে পড়তে পারে।' });
  const seen = new Set<string>();
  [...mains.map(m => m.chem.id), ...inds.map(m => m.chem.id)].forEach(id => {
    const h = HAZARD[id];
    if (h && h.level >= 2 && !seen.has(id)) { seen.add(id); risks.push({ level: h.level === 3 ? 'danger' : 'warn', text: `☠️ ${h.bn}` }); }
  });
  if (pred && pred.category === 'neutralization' && (liquidMains.reduce((s, m) => s + m.amount, 0) > 30)) risks.push({ level: 'warn', text: 'বেশি পরিমাণ এসিড-ক্ষার একসাথে মেশালে অনেক তাপ ছাড়ে — অল্প অল্প করে মেশান।' });
  const order = { danger: 0, warn: 1, info: 2 };
  risks.sort((a, b) => order[a.level] - order[b.level]);

  const view: View = {
    color, liquidAmount: baseLiquidMl, precip, solids, bubbles, gas, smell, warm, character, explain,
    reactionId: real?.id ?? null, rows, risks, progress: p, done, tTotal, temp, gasMl, reacting: reactingNow && !done, hasReaction: !!real,
    fumes, foam, suspension, flakes,
  };
  return { view, info };
}

export function evaluate(contents: Content[], o: SimOpts): View {
  if (!contents.length) return { ...EMPTY_VIEW, temp: o.baseTemp };
  return analyze(contents, o).view;
}

/** When a reaction has run to completion: replace reactants by what is left (excess) + one inert product mixture. */
export function commitReaction(contents: Content[], o: SimOpts): Content[] {
  const { view, info } = analyze(contents, { ...o, phase: 'reacting', t: 1e9 });
  if (!info.reaction) return contents;
  const out: Content[] = [];
  const prevMix = contents.filter(c => c.mix);
  const merged = mergeById(contents);
  let productMl = info.productMl;
  const colorParts: { color: string; w: number }[] = [{ color: info.productColor, w: productMl }];
  prevMix.forEach(m => { productMl += m.amount; colorParts.push({ color: m.mix!.color, w: m.amount }); });
  merged.forEach(m => {
    const f = info.consumedFrac[m.chem.id] || 0;
    const left = m.amount * (1 - f);
    const keep = isSolidLike(m.chem) ? left > 0.02 : (m.chem.type === 'indicator' ? true : left > 0.05);
    if (keep) out.push({ chemId: m.chem.id, amount: +left.toFixed(3) });
  });
  out.push({ amount: +productMl.toFixed(3), mix: { color: blend(colorParts), character: 'neutral', precip: view.precip } });
  return out;
}

/** Everything liquid in a vessel as one inert mixture (used when pouring one vessel into another). */
export function toMix(view: View, keepPrecip: boolean): Mix {
  return { color: view.color, character: view.character, precip: keepPrecip ? view.precip : null };
}

// ---------- Quick reaction (menu): type a reaction, give amounts, get the full result ----------
const norm = (s: string) => s.toLowerCase().replace(/[₀-₉]/g, d => String('₀₁₂₃₄₅₆₇₈₉'.indexOf(d))).replace(/[^a-z0-9ঀ-৿]/g, '');
export function parseReactionText(text: string): string[] {
  const tokens = text.split(/\+|,|&|→|->|=|এবং|\band\b|\bও\b/i).map(t => norm(t)).filter(Boolean);
  const ids: string[] = [];
  tokens.forEach(tok => {
    const c = CHEMICALS.find(c => norm(c.id) === tok || norm(c.formula) === tok || norm(c.nameEn) === tok
      || (tok.length >= 4 && (norm(c.nameEn).includes(tok) || norm(c.nameBn).includes(tok))));
    if (c && !ids.includes(c.id)) ids.push(c.id);
  });
  return ids;
}
export function defaultAmount(c: Chemical): number {
  return c.type === 'indicator' ? 0.5 : c.type === 'metal' ? 0.5 : isSolidLike(c) ? 1 : 8;
}

export const SHELF_ORDER: { key: string; bn: string; en: string }[] = [
  { key: 'acid', bn: 'এসিড', en: 'Acids' }, { key: 'base', bn: 'ক্ষার', en: 'Bases' },
  { key: 'salt', bn: 'লবণ', en: 'Salts' }, { key: 'metal', bn: 'ধাতু', en: 'Metals' },
  { key: 'indicator', bn: 'নির্দেশক', en: 'Indicators' },
];
export { CHEMICALS };
