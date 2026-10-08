// Builds frontend/src/app/data/chem-curriculum-11-12.generated.ts from the Class 11 / Class 12 extraction files
// (chemistry-11/reactions/c11-NN.json, chemistry-12/reactions/c12-NN.json — every item cites the printed page).
//   node build-curriculum-11-12.mjs
// Items that cannot be modelled on the bench become explanation cards — nothing is invented.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EXISTING, NEW as NEW9, C } from './chem-dict.mjs';
import { keyOf, splitEquations, parseEq, dH, PPT_COLORS } from './chem-helpers.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(here, '../../../frontend/src/app/data/chem-curriculum-11-12.generated.ts');

const P = { dispense: 'powder' };
const S = (id, bn, en, f, color, extra = {}) => C(id, bn, en, f, 'salt', 'liquid', color, 'salt', extra);
const NEW2 = {
  FeCl3: S('FeCl3', 'ফেরিক ক্লোরাইড দ্রবণ', 'Iron(III) chloride', 'FeCl₃', '#e8c98a', { hydrolysis: { type: 'acid', K: 1e-3 } }),
  HNO3: C('HNO3', 'নাইট্রিক এসিড', 'Nitric acid', 'HNO₃', 'acid', 'liquid', '#eef6fb', 'acid', { acid: { h: 1 } }),
  HF: C('HF', 'হাইড্রোফ্লুরিক এসিড', 'Hydrofluoric acid', 'HF', 'acid', 'liquid', '#eef6fb', 'acid', { weak: true, acid: { h: 1, ka: 6.6e-4 } }),
  HI: C('HI', 'হাইড্রোআয়োডিক এসিড', 'Hydroiodic acid', 'HI', 'acid', 'liquid', '#eef6fb', 'acid', { acid: { h: 1 } }),
  HBr: C('HBr', 'হাইড্রোব্রোমিক এসিড', 'Hydrobromic acid', 'HBr', 'acid', 'liquid', '#eef6fb', 'acid', { acid: { h: 1 } }),
  H3PO4: C('H3PO4', 'ফসফরিক এসিড', 'Phosphoric acid', 'H₃PO₄', 'acid', 'liquid', '#eef6fb', 'acid', { weak: true, acid: { h: 1, ka: 7.5e-3 } }),
  Li2O: C('Li2O', 'লিথিয়াম অক্সাইড', 'Lithium oxide', 'Li₂O', 'base', 'solid', '#f4f4f0', 'oxide', { ...P, molarMass: 30 }),
  Na2O: C('Na2O', 'সোডিয়াম অক্সাইড', 'Sodium oxide', 'Na₂O', 'base', 'solid', '#f4f4f0', 'oxide', { ...P, molarMass: 62 }),
  K2O: C('K2O', 'পটাসিয়াম অক্সাইড', 'Potassium oxide', 'K₂O', 'base', 'solid', '#f4f4f0', 'oxide', { ...P, molarMass: 94 }),
  MgO: C('MgO', 'ম্যাগনেসিয়াম অক্সাইড', 'Magnesium oxide', 'MgO', 'base', 'solid', '#f6f6f4', 'oxide', { ...P, molarMass: 40.3 }),
  ZnO: C('ZnO', 'জিংক অক্সাইড', 'Zinc oxide', 'ZnO', 'oxide', 'solid', '#f8f8f4', 'oxide', { ...P, molarMass: 81.4 }),
  Fe2O3: C('Fe2O3', 'ফেরিক অক্সাইড', 'Iron(III) oxide', 'Fe₂O₃', 'base', 'solid', '#8b3a1c', 'oxide', { ...P, molarMass: 159.7 }),
  K2Cr2O7: C('K2Cr2O7', 'পটাসিয়াম ডাইক্রোমেট', 'Potassium dichromate', 'K₂Cr₂O₇', 'salt', 'solid', '#e8641a', 'salt', { ...P, molarMass: 294, solubleIn: ['water'], solColor: '#e8841a' }),
  Na2S: S('Na2S', 'সোডিয়াম সালফাইড দ্রবণ', 'Sodium sulphide', 'Na₂S', '#eef6fb'),
  NaF: S('NaF', 'সোডিয়াম ফ্লুরাইড দ্রবণ', 'Sodium fluoride', 'NaF', '#eef6fb'),
  NaBr: S('NaBr', 'সোডিয়াম ব্রোমাইড দ্রবণ', 'Sodium bromide', 'NaBr', '#eef6fb'),
  NaI: S('NaI', 'সোডিয়াম আয়োডাইড দ্রবণ', 'Sodium iodide', 'NaI', '#eef6fb'),
  KBr: S('KBr', 'পটাসিয়াম ব্রোমাইড দ্রবণ', 'Potassium bromide', 'KBr', '#eef6fb'),
  KOH: NEW9.KOH,
  K3FeCN6: S('K3FeCN6', 'পটাসিয়াম ফেরিসায়ানাইড দ্রবণ', 'Potassium ferricyanide', 'K₃[Fe(CN)₆]', '#e0b030'),
  K4FeCN6: S('K4FeCN6', 'পটাসিয়াম ফেরোসায়ানাইড দ্রবণ', 'Potassium ferrocyanide', 'K₄[Fe(CN)₆]', '#eadf8a'),
  CoCl2: S('CoCl2', 'কোবাল্ট(II) ক্লোরাইড দ্রবণ', 'Cobalt(II) chloride', 'CoCl₂', '#d86a8a'),
  BaNO32: S('BaNO32', 'বেরিয়াম নাইট্রেট দ্রবণ', 'Barium nitrate', 'Ba(NO₃)₂', '#eef6fb'),
  SnCl2: S('SnCl2', 'টিন(II) ক্লোরাইড দ্রবণ', 'Tin(II) chloride', 'SnCl₂', '#eef6fb'),
  FeCl2: S('FeCl2', 'ফেরাস ক্লোরাইড দ্রবণ', 'Iron(II) chloride', 'FeCl₂', '#cfe8cf'),
  AlCl3: S('AlCl3', 'অ্যালুমিনিয়াম ক্লোরাইড দ্রবণ', 'Aluminium chloride', 'AlCl₃', '#eef6fb', { hydrolysis: { type: 'acid', K: 1e-5 } }),
  Na2SO3: S('Na2SO3', 'সোডিয়াম সালফাইট দ্রবণ', 'Sodium sulphite', 'Na₂SO₃', '#eef6fb'),
  K2CrO4: S('K2CrO4', 'পটাসিয়াম ক্রোমেট দ্রবণ', 'Potassium chromate', 'K₂CrO₄', '#f2d21a'),
  HgNO32: S('HgNO32', 'মারকিউরাস নাইট্রেট দ্রবণ', 'Mercury(I) nitrate', 'Hg₂(NO₃)₂', '#eef6fb'),
  KSCN: S('KSCN', 'পটাসিয়াম থায়োসায়ানেট দ্রবণ', 'Potassium thiocyanate', 'KSCN', '#eef6fb'),
  H2O2: C('H2O2', 'হাইড্রোজেন পার-অক্সাইড', 'Hydrogen peroxide', 'H₂O₂', 'other', 'liquid', '#eef6fb', 'organic', {}),
  C2H5OH: C('C2H5OH', 'ইথানল', 'Ethanol', 'C₂H₅OH', 'organic', 'liquid', '#f4f6f8', 'organic', { conc: 17 }),
};
// keys are normalised formulas (see keyOf) — add the ones whose id differs
const KEYMAP = { Ba: null, BaNO32: 'BaNO32', Hg2NO32: 'HgNO32', 'K3[FeCN6]': 'K3FeCN6', 'K4[FeCN6]': 'K4FeCN6' };
const NEW = { ...NEW9, ...NEW2 };
const byKey = (k) => (KEYMAP[k] ? NEW[KEYMAP[k]] : NEW[k]);
const TYPE_EXISTING = { HCl: 'acid', H2SO4: 'acid', CH3COOH: 'acid', NaOH: 'base', CaOH2: 'base', NH4OH: 'base', Zn: 'metal', Mg: 'metal', Fe: 'metal', Cu: 'metal', Al: 'metal' };
const SOLID_EXISTING = { Zn: 65.4, Mg: 24.3, Fe: 55.8, Cu: 63.5, Al: 27, Na2CO3: 106, NH4Cl: 53.5 };

const BOOKS = [
  { id: '11', dir: 'chemistry-11', prefix: 'k11', chapters: { 1: 'ল্যাবরেটরির নিরাপদ ব্যবহার', 2: 'গুণগত রসায়ন', 3: 'মৌলের পর্যায়বৃত্ত ধর্ম ও রাসায়নিক বন্ধন', 4: 'রাসায়নিক পরিবর্তন', 5: 'কর্মমুখী রসায়ন' } },
  { id: '12', dir: 'chemistry-12', prefix: 'k12', chapters: { 1: 'গ্রুপ-V ও গ্রুপ-VI মৌলের রসায়ন', 2: 'হ্যালোজেন গ্রুপ', 3: 'd-ব্লক মৌল', 4: 'জৈব রসায়নের সূচনা', 5: 'হাইড্রোকার্বন', 6: 'হ্যালোজেন জাতক', 7: 'অ্যালকোহল, ফেনল ও ইথার', 8: 'অ্যালডিহাইড ও কিটোন', 9: 'কার্বক্সিলিক এসিড', 10: 'অ্যামিন', 11: 'বায়োঅণুসমূহের রসায়ন', 12: 'জৈব যৌগের শনাক্তকরণ ও বিশ্লেষণ' } },
];
const A = (x) => (Array.isArray(x) ? x.map((y) => (typeof y === 'string' ? y : JSON.stringify(y))) : x ? [String(x)] : []);
const BASE_PAIRS = new Set(['HCl|NaOH', 'H2SO4|NaOH', 'CH3COOH|NaOH', 'HCl|NH4OH', 'CaOH2|HCl', 'AgNO3|NaCl', 'AgNO3|HCl', 'BaCl2|Na2SO4', 'BaCl2|H2SO4', 'HCl|Na2CO3', 'CH3COOH|Na2CO3', 'H2SO4|Na2CO3', 'HCl|Zn', 'HCl|Mg', 'Fe|HCl', 'Al|HCl', 'H2SO4|Zn', 'H2SO4|Mg', 'CuSO4|NaOH', 'CuSO4|Zn', 'CuSO4|Fe', 'Al|CuSO4', 'KI|PbNO3', 'Na2SO4|PbNO3'].map((x) => x.split('|').sort().join('|')));
const INDICATORS = [['ফেনলফথ্যালিন|phenolphthalein', 'Phenolphthalein'], ['ইউনিভার্সাল', 'UniversalIndicator'], ['লাল লিটমাস', 'LitmusRed'], ['লিটমাস|litmus', 'LitmusBlue']];

const result = {};
for (const bk of BOOKS) {
  const dir = path.join(here, bk.dir, 'reactions');
  const items = []; const secMap = new Map(); const chapterTitle = { ...bk.chapters };
  for (const f of fs.existsSync(dir) ? fs.readdirSync(dir).sort() : []) {
    if (!/\.json$/.test(f)) continue;
    let d; try { d = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')); } catch { console.error('BAD JSON', f); continue; }
    (d.items || []).forEach((x) => items.push(x));
    (d.sections_seen || []).forEach((s) => { const no = String(s.no || '').trim(); if (/^\d+\.\d+$/.test(no) && !secMap.has(no)) secMap.set(no, { ch: +s.chapter_no, no, titleBn: String(s.title_bn || '').trim(), page: +s.start_page || 0 }); });
  }
  const sectionsOf = {};
  [...secMap.values()].forEach((s) => { (sectionsOf[s.ch] ||= []).push({ no: s.no, titleBn: s.titleBn, page: s.page }); });
  Object.values(sectionsOf).forEach((l) => l.sort((a, b) => a.page - b.page || a.no.localeCompare(b.no, 'en', { numeric: true })));
  const topicOf = (ch, it) => {
    const list = sectionsOf[ch] || []; if (!list.length) return 1;
    const m = String(it.section_no || '').match(/^(\d+\.\d+)/);
    if (m) { const i = list.findIndex((s) => s.no === m[1]); if (i >= 0) return i + 1; }
    let idx = 1; list.forEach((s, i) => { if (+it.book_page >= s.page) idx = i + 1; }); return idx;
  };

  const needed = new Map(); const reactions = [], experiments = [], cards = [], kin = {};
  const stats = { items: items.length, bench: 0, modelled: 0, cards: 0 };
  const idFor = (f) => {
    const k = keyOf(f);
    if (EXISTING[k]) return { id: EXISTING[k], existing: true };
    const n = byKey(k); if (n) { needed.set(n.id, n); return { id: n.id, existing: false }; }
    return null;
  };
  const defOf = (cid) => Object.values(NEW).find((c) => c && c.id === cid) || null;
  const typeOf = (x) => (x.existing ? (TYPE_EXISTING[x.id] || 'salt') : defOf(x.id).type);
  const seen = new Set();

  for (const e of items) {
    const ch = +e.chapter_no; if (!ch) continue;
    if (chapterTitle[ch] === undefined) chapterTitle[ch] = null;
    e.materials_bn = A(e.materials_bn); e.procedure_bn = A(e.procedure_bn);
    e.reactants = Array.isArray(e.reactants) ? e.reactants.filter((r) => r && typeof r === 'object') : [];
    e.title_bn = String(e.title_bn || ''); e.observations_bn = e.observations_bn ? String(e.observations_bn) : ''; e.conditions = e.conditions ? String(e.conditions) : '';
    e.equation = typeof e.equation === 'string' ? e.equation : (Array.isArray(e.equation) ? e.equation.join('; ') : '');
    const topic = topicOf(ch, e); const verified = e.confidence === 'read';
    const mkCard = (why) => {
      const body = [];
      if (e.observations_bn) body.push(e.observations_bn);
      if (e.conditions) body.push(`শর্ত: ${e.conditions}`);
      e.procedure_bn.forEach((p, i) => body.push(`${i + 1}. ${p}`));
      if (e.quantities_bn) body.push(`পরিমাণ: ${e.quantities_bn}`);
      if (e.materials_bn.length) body.push(`উপকরণ: ${e.materials_bn.join(', ')}`);
      if (e.safety_bn) body.push(`⚠️ ${e.safety_bn}`);
      if (why) body.push(`ℹ️ ${why}`);
      cards.push({ id: e.id, book: bk.id, chapter: ch, topic, titleBn: e.title_bn, page: +e.book_page || 0, equation: e.equation || undefined, bodyBn: body.filter(Boolean), verified });
      stats.cards++;
    };
    if (e.type !== 'bench') { mkCard('এই পরীক্ষা ল্যাব বেঞ্চে করা যায় না (বেশি তাপ/আগুন/তড়িৎ/শিল্প-প্রক্রিয়া বা গ্যাস লাগে) — তাই ব্যাখ্যা-কার্ড।'); continue; }
    stats.bench++;
    const eqs = splitEquations(e.equation).map(parseEq).filter(Boolean);
    let modelled = false; let reason = 'এই ল্যাবে প্রয়োজনীয় রাসায়নিক/ধরন নেই (আয়ন, গ্যাস বা জৈব যৌগ)।';
    const text = `${e.title_bn} ${e.materials_bn.join(' ')} ${e.conditions}`;
    const strong = /বার্নার|ফুটন|ঊর্ধ্ব|দহন|আগুন|শিখা|heat|burn|reflux/i.test(e.conditions) && !/ঘরের|কক্ষ|room/i.test(e.conditions);
    const ind = (INDICATORS.find(([re]) => new RegExp(re, 'i').test(text)) || [])[1];

    eqs.forEach((q, qi) => {
      if (modelled) return;
      if (q.R.some((t) => /·/.test(t.f)) || q.L.some((t) => /·/.test(t.f))) { reason = 'ক্রিস্টালীয় পানি (হাইড্রেট) সংক্রান্ত — বেঞ্চে দ্রবণের মডেলে নেই।'; return; }
      if (!q.balanced) { reason = 'বইয়ে সমীকরণটি সমতাকৃত নয়/পড়া যায়নি — যাচাই বাকি।'; return; }
      if (q.L.length !== 2) { reason = 'বিক্রিয়ক দুটির বেশি/কম — বেঞ্চের মডেলে ঢোকে না।'; return; }
      const ids = q.L.map((t) => idFor(t.f));
      if (ids.some((x) => !x)) { reason = 'একটি বিক্রিয়ক (আয়ন, গ্যাস বা জৈব যৌগ) এই ল্যাবে নেই।'; return; }
      if (ids[0].id === ids[1].id) return;
      if (q.L.some((t) => /\(g\)|↑/.test(t.f))) { reason = 'গ্যাসীয় বিক্রিয়ক বেঞ্চে ঢালা যায় না।'; return; }
      const pairKey = ids.map((x) => x.id).sort().join('|');
      const rid = `${e.id}${eqs.length > 1 ? 'abc'[qi] : ''}`;
      const types = ids.map(typeOf); const has = (t) => types.includes(t);
      const prodGas = q.R.find((t) => /↑/.test(t.f)); const prodPpt = q.R.find((t) => /↓/.test(t.f));
      const carbonate = q.L.some((t) => /CO3|HCO3/.test(keyOf(t.f)));
      let category = 'other';
      if (has('acid') && carbonate) category = 'gas-carbonate';
      else if (has('acid') && has('metal')) category = 'gas-metal';
      else if (has('acid') && (has('base') || has('oxide'))) category = 'neutralization';
      else if (prodPpt) category = 'precipitation';
      else if (has('metal') && has('salt')) category = 'displacement';
      else if (prodGas) category = 'gas-other';
      if (strong && !['neutralization', 'precipitation'].includes(category)) { reason = 'বেশি তাপ লাগে — ১০০°C-এর বেঞ্চে সম্ভব নয়।'; return; }
      if (seen.has(pairKey)) { modelled = true; return; }
      const gas = prodGas ? prodGas.f.replace(/\(g\)|↑|\s/g, '') : false;
      const ppt = prodPpt ? (PPT_COLORS[keyOf(prodPpt.f).replace(/\(s\)/g, '')] || ['#f4f4ef', `${prodPpt.f.replace(/\(s\)|↓/g, '')} (অধঃক্ষেপ)`]) : null;
      const eqShow = q.text.replace(/\((s|l|aq)\)/g, '').replace(/\(g\)/g, '').replace(/\s+/g, ' ');
      const dh = dH(e.equation) ?? dH(e.observations_bn) ?? null;
      const obs = e.observations_bn || (category === 'neutralization' ? 'এসিড ও ক্ষার/ক্ষারীয় অক্সাইড বিক্রিয়া করে লবণ ও পানি উৎপন্ন করে।' : gas ? `${gas} গ্যাস উৎপন্ন হয়।` : ppt ? `${ppt[1]} অধঃক্ষেপ পড়ে।` : 'বিক্রিয়া ঘটে।');
      let reactionId = null;
      if (!BASE_PAIRS.has(pairKey) && !reactions.find((r) => r.pairKey === pairKey)) {
        reactions.push({ id: rid, pairKey, reactants: q.L.map((t, i) => ({ id: ids[i].id, part: t.coef })), category, equation: eqShow, nameBn: e.title_bn,
          effects: { colorChange: category === 'neutralization', gas, precipitate: ppt ? { color: ppt[0], name: ppt[1] } : null,
            temp: dh != null && dh > 0 ? 'rises' : category === 'neutralization' ? 'rises' : 'none', smell: gas === 'NH₃' ? 'pungent' : null, vigor: category === 'gas-carbonate' ? 'high' : 'medium' },
          observationBn: obs, useBn: '—', safetyBn: e.safety_bn || '' });
        if (dh != null) kin[rid] = { tau: category === 'precipitation' ? 1.5 : 8, dH: dh, note: 'বইয়ের ΔH মান ধরে হিসাব' };
        else if (['gas-other', 'other', 'displacement'].includes(category)) kin[rid] = { tau: 30, dH: 0, note: 'গতি আনুমানিক; তাপের পরিবর্তন বইয়ে নেই বলে মডেল করা হয়নি' };
        reactionId = rid;
      } else reactionId = reactions.find((r) => r.pairKey === pairKey)?.id ?? null;
      const mats = [];
      q.L.forEach((t, i) => {
        const cid = ids[i].id; const def = ids[i].existing ? null : defOf(cid);
        const solid = def ? def.state === 'solid' : cid in SOLID_EXISTING;
        const mm = def?.molarMass || SOLID_EXISTING[cid] || 60;
        if (solid) {
          const metal = ['Zn', 'Mg', 'Fe', 'Cu', 'Al'].includes(cid) || def?.dispense === 'metal';
          mats.push({ chem: cid, amount: Math.max(0.2, Math.round(t.coef * 0.005 * mm * (category.startsWith('gas') ? 1.4 : 1) * 10) / 10), unit: 'g', tool: metal ? 'forceps' : 'spoon' });
        } else mats.push({ chem: cid, amount: cid === 'H2O' ? 10 : Math.min(15, t.coef * 5), unit: 'mL', tool: 'pour' });
      });
      if (ind) mats.push({ chem: ind, amount: 3, unit: 'drops', tool: 'dropper' });
      seen.add(pairKey);
      experiments.push({ id: `x-${rid}`, book: bk.id, pairKey, chapter: ch, topic, titleBn: e.title_bn, page: +e.book_page || 0, ...(reactionId ? { reactionIds: [reactionId] } : {}),
        materials: mats, observeBn: [obs], aimBn: e.title_bn, verified });
      modelled = true;
    });

    // single reagent + indicator (litmus / universal / phenolphthalein), no equation needed
    if (!modelled && ind && !eqs.some((q) => q.L.length === 2)) {
      const mains = e.reactants.map((r) => idFor(r.formula || '')).filter(Boolean).filter((x) => x.id !== 'H2O');
      if (mains.length === 1) {
        const def = mains[0].existing ? null : defOf(mains[0].id);
        experiments.push({ id: `x-${e.id}`, book: bk.id, chapter: ch, topic, titleBn: e.title_bn, page: +e.book_page || 0, demo: true,
          materials: [def?.state === 'solid' ? { chem: mains[0].id, amount: 0.5, unit: 'g', tool: 'spoon' } : { chem: mains[0].id, amount: 5, unit: 'mL', tool: 'pour' }, { chem: ind, amount: 3, unit: 'drops', tool: 'dropper' }],
          observeBn: [e.observations_bn || 'নির্দেশকের রং লক্ষ করুন।'], aimBn: e.title_bn, verified });
        modelled = true;
      }
    }
    if (modelled) stats.modelled++; else mkCard(reason);
  }

  experiments.sort((a, b) => a.chapter - b.chapter || a.topic - b.topic || a.page - b.page);
  cards.sort((a, b) => a.chapter - b.chapter || a.topic - b.topic || a.page - b.page);
  const used = new Set([...reactions.flatMap((r) => r.reactants.map((x) => x.id)), ...experiments.flatMap((x) => x.materials.map((m) => m.chem))]);
  const chemicals = Object.values(NEW).filter((c) => c && used.has(c.id));
  const chapters = Object.entries(chapterTitle).map(([no, bn]) => ({ no: +no, bn: bn || `অধ্যায় ${no}`, page: sectionsOf[no]?.[0]?.page || 0 })).sort((a, b) => a.no - b.no);
  result[bk.id] = { chemicals, reactions, kin, experiments, cards, sections: sectionsOf, chapters };
  console.log(bk.id, JSON.stringify({ ...stats, reactions: reactions.length, experiments: experiments.length, newChemicals: chemicals.length }));
}

const out = `// AUTO-GENERATED by lab/backend/db/data/build-curriculum-11-12.mjs — do not edit by hand.
// Source: Class 11 NCTB Chemistry textbook; Class 12 = a private publisher's HSC guide (printed page numbers are cited on every item).
/* eslint-disable */
export const GEN_BOOKS: Record<string, { chemicals: any[]; reactions: any[]; kin: Record<string, any>; experiments: any[]; cards: any[]; sections: Record<string, any[]>; chapters: { no: number; bn: string; page: number }[] }> = ${JSON.stringify(result)};
`;
fs.writeFileSync(OUT, out);
