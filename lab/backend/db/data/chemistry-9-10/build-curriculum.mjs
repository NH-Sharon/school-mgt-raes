// Builds frontend/src/app/data/chem-curriculum-9-10.generated.ts from the per-chapter extraction files
// (reactions/chNN.json — each item cites the printed textbook page).
//   node build-curriculum.mjs
// Items that cannot be modelled on the bench (unknown chemicals, gases, ions, strong heating, 3+ reactants,
// unbalanced equations …) are turned into explanation cards instead — nothing is invented.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(here, '../../../../frontend/src/app/data/chem-curriculum-9-10.generated.ts');

const CHAPTER_TOPICS = [
  ['রসায়ন পরিচিতি', 'রসায়নের পরিধি', 'অন্যান্য বিজ্ঞানের সাথে সম্পর্ক', 'রসায়ন পাঠের গুরুত্ব', 'বৈজ্ঞানিক পদ্ধতি ও গবেষণা', 'পরীক্ষাগার নিরাপত্তা ও বিপদ চিহ্ন'],
  ['কণার গতিতত্ত্ব', 'পদার্থের তিন অবস্থা', 'অবস্থার পরিবর্তন', 'গলনাঙ্ক ও স্ফুটনাঙ্ক', 'ঊর্ধ্বপাতন', 'ব্যাপন ও নিঃসরণ'],
  ['মৌল, যৌগ ও মিশ্রণ', 'পরমাণুর গঠন', 'পারমাণবিক সংখ্যা ও ভরসংখ্যা', 'আইসোটোপ', 'ইলেকট্রন বিন্যাস', 'তেজস্ক্রিয়তা ও আইসোটোপের ব্যবহার'],
  ['পর্যায় সারণির ইতিহাস', 'আধুনিক পর্যায় সূত্র', 'গ্রুপ ও পর্যায়', 'পর্যায়বৃত্ত ধর্ম', 'ধাতু, অধাতু ও অপধাতু', 'অবস্থান ও ইলেকট্রন বিন্যাস'],
  ['নিষ্ক্রিয় গ্যাস ও স্থিতিশীলতা', 'যোজনী ও আয়ন গঠন', 'আয়নিক বন্ধন', 'সমযোজী বন্ধন', 'ধাতব বন্ধন', 'আয়নিক ও সমযোজী যৌগের ধর্ম'],
  ['মোল ধারণা', 'অ্যাভোগাড্রো সংখ্যা', 'মোলার ভর', 'শতকরা সংযুতি', 'স্থূল ও আণবিক সংকেত', 'মোলার আয়তন ও গাণিতিক হিসাব'],
  ['রাসায়নিক বিক্রিয়ার লক্ষণ', 'সমীকরণ ও সমতাকরণ', 'বিক্রিয়ার প্রকারভেদ', 'জারণ-বিজারণ', 'তাপোৎপাদী ও তাপহারী বিক্রিয়া', 'বিক্রিয়ার হার ও প্রভাবক'],
  ['রাসায়নিক শক্তির উৎস', 'তাপোৎপাদী ও তাপহারী পরিবর্তন', 'বন্ধন শক্তি', 'রাসায়নিক থেকে বৈদ্যুতিক শক্তি', 'তড়িৎ বিশ্লেষণ', 'কোষ, ব্যাটারি ও জ্বালানি'],
  ['এসিড ও ক্ষারক', 'pH স্কেল', 'নির্দেশক', 'প্রশমন বিক্রিয়া', 'লবণ', 'দৈনন্দিন জীবনে এসিড-ক্ষার'],
  ['খনিজ ও আকরিক', 'সক্রিয়তা সিরিজ', 'ধাতু নিষ্কাশন', 'ধাতু ও অধাতুর ধর্ম', 'সংকর ধাতু', 'ক্ষয় ও প্রতিরোধ'],
  ['জীবাশ্ম জ্বালানি', 'কয়লা', 'খনিজ তেল ও পরিশোধন', 'প্রাকৃতিক গ্যাস', 'হাইড্রোকার্বন', 'পলিমার'],
  ['সার', 'সাবান ও ডিটারজেন্ট', 'কাচ, সিমেন্ট ও সিরামিক', 'খাদ্য সংরক্ষণ', 'ওষুধ ও প্রসাধনী', 'রসায়ন ও পরিবেশ'],
];

// ------------------------------------------------------------------ chemicals
// key = normalised formula (ascii, no parentheses/states).  existing: id already on the shelf.
const EXISTING = {
  HCl: 'HCl', H2SO4: 'H2SO4', CH3COOH: 'CH3COOH', NaOH: 'NaOH', CaOH2: 'CaOH2', NH4OH: 'NH4OH', NaCl: 'NaCl', AgNO3: 'AgNO3',
  BaCl2: 'BaCl2', Na2SO4: 'Na2SO4', PbNO32: 'PbNO3', KI: 'KI', CuSO4: 'CuSO4', Na2CO3: 'Na2CO3', NH4Cl: 'NH4Cl',
  Zn: 'Zn', Mg: 'Mg', Fe: 'Fe', Cu: 'Cu', Al: 'Al',
};
const C = (id, nameBn, nameEn, formula, type, state, color, category, extra = {}) => ({ id, nameBn, nameEn, formula, type, state, color, category, ...extra });
const NEW = {
  H2O: C('H2O', 'পানি', 'Water', 'H₂O', 'other', 'liquid', '#eef6fb', 'organic', { conc: 55.5, dispense: 'bottle' }),
  CaCO3: C('CaCO3', 'ক্যালসিয়াম কার্বনেট (মার্বেল/চুনাপাথর)', 'Calcium carbonate', 'CaCO₃', 'salt', 'solid', '#f3f1ea', 'salt', { dispense: 'powder', molarMass: 100 }),
  MgCO3: C('MgCO3', 'ম্যাগনেসিয়াম কার্বনেট', 'Magnesium carbonate', 'MgCO₃', 'salt', 'solid', '#f6f6f4', 'salt', { dispense: 'powder', molarMass: 84.3 }),
  NaHCO3: C('NaHCO3', 'সোডিয়াম বাইকার্বনেট (বেকিং সোডা)', 'Sodium bicarbonate', 'NaHCO₃', 'salt', 'solid', '#f8f8f6', 'salt', { dispense: 'powder', molarMass: 84 }),
  CaO: C('CaO', 'ক্যালসিয়াম অক্সাইড (চুন)', 'Calcium oxide (quicklime)', 'CaO', 'base', 'solid', '#f4f1ea', 'oxide', { dispense: 'powder', molarMass: 56 }),
  Al2O3: C('Al2O3', 'অ্যালুমিনিয়াম অক্সাইড', 'Aluminium oxide', 'Al₂O₃', 'oxide', 'solid', '#ececec', 'oxide', { dispense: 'powder', molarMass: 102 }),
  CuO: C('CuO', 'কপার(II) অক্সাইড', 'Copper(II) oxide', 'CuO', 'base', 'solid', '#2c2c2c', 'oxide', { dispense: 'powder', molarMass: 79.5 }),
  AlOH3: C('AlOH3', 'অ্যালুমিনিয়াম হাইড্রক্সাইড (অ্যান্টাসিড)', 'Aluminium hydroxide', 'Al(OH)₃', 'base', 'solid', '#f7f7f7', 'base', { dispense: 'powder', molarMass: 78 }),
  MgOH2: C('MgOH2', 'ম্যাগনেসিয়াম হাইড্রক্সাইড (অ্যান্টাসিড)', 'Magnesium hydroxide', 'Mg(OH)₂', 'base', 'solid', '#f7f7f5', 'base', { dispense: 'powder', molarMass: 58.3 }),
  KOH: C('KOH', 'পটাসিয়াম হাইড্রক্সাইড দ্রবণ', 'Potassium hydroxide', 'KOH', 'base', 'liquid', '#eef6fb', 'base'),
  AlNO33: C('AlNO33', 'অ্যালুমিনিয়াম নাইট্রেট দ্রবণ', 'Aluminium nitrate', 'Al(NO₃)₃', 'salt', 'liquid', '#eef6fb', 'salt'),
  FeNO32: C('FeNO32', 'ফেরাস নাইট্রেট দ্রবণ', 'Iron(II) nitrate', 'Fe(NO₃)₂', 'salt', 'liquid', '#d4ecd4', 'salt'),
  FeNO33: C('FeNO33', 'ফেরিক নাইট্রেট দ্রবণ', 'Iron(III) nitrate', 'Fe(NO₃)₃', 'salt', 'liquid', '#e8c98a', 'salt'),
  CuNO32: C('CuNO32', 'কপার(II) নাইট্রেট দ্রবণ', 'Copper(II) nitrate', 'Cu(NO₃)₂', 'salt', 'liquid', '#4a86d8', 'salt'),
  ZnNO32: C('ZnNO32', 'জিংক নাইট্রেট দ্রবণ', 'Zinc nitrate', 'Zn(NO₃)₂', 'salt', 'liquid', '#eef6fb', 'salt'),
  FeSO4: C('FeSO4', 'ফেরাস সালফেট দ্রবণ', 'Iron(II) sulphate', 'FeSO₄', 'salt', 'liquid', '#cfe8cf', 'salt'),
  ZnSO4: C('ZnSO4', 'জিংক সালফেট দ্রবণ', 'Zinc sulphate', 'ZnSO₄', 'salt', 'liquid', '#eef6fb', 'salt'),
  CaCl2: C('CaCl2', 'ক্যালসিয়াম ক্লোরাইড দ্রবণ', 'Calcium chloride', 'CaCl₂', 'salt', 'liquid', '#eef6fb', 'salt'),
  MgCl2: C('MgCl2', 'ম্যাগনেসিয়াম ক্লোরাইড দ্রবণ', 'Magnesium chloride', 'MgCl₂', 'salt', 'liquid', '#eef6fb', 'salt'),
  C4H6O6: C('C4H6O6', 'টারটারিক এসিড', 'Tartaric acid', 'C₄H₆O₆', 'acid', 'solid', '#f8f6f0', 'acid', { dispense: 'powder', molarMass: 150, weak: true }),
  KMnO4: C('KMnO4', 'পটাশিয়াম পারম্যাঙ্গানেট', 'Potassium permanganate', 'KMnO₄', 'salt', 'solid', '#5b1a74', 'salt', { dispense: 'powder', molarMass: 158, solubleIn: ['water'], solColor: '#9a2bb8' }),
  NaClS: C('NaClS', 'খাদ্য লবণ (কঠিন)', 'Table salt (solid)', 'NaCl', 'salt', 'solid', '#f8f8f6', 'salt', { dispense: 'powder', molarMass: 58.5, solubleIn: ['water'] }),
  CuSO4H2O: C('CuSO4H2O', 'তুঁতে (CuSO₄·5H₂O)', 'Blue vitriol', 'CuSO₄·5H₂O', 'salt', 'solid', '#4a86d8', 'salt', { dispense: 'powder', molarMass: 249.7, solubleIn: ['water'], solColor: '#4a86d8' }),
  AgCl: C('AgCl', 'সিলভার ক্লোরাইড', 'Silver chloride', 'AgCl', 'salt', 'solid', '#f5f5f0', 'salt', { dispense: 'powder', molarMass: 143.5, solubleIn: [] }),
  Naphthalene: C('Naphthalene', 'ন্যাপথালিন', 'Naphthalene', 'C₁₀H₈', 'organic', 'solid', '#f4f4ee', 'organic', { dispense: 'powder', molarMass: 128, solubleIn: ['kerosene'] }),
  Kerosene: C('Kerosene', 'কেরোসিন', 'Kerosene', '—', 'organic', 'liquid', '#f2e9c9', 'organic', { conc: 8, dispense: 'bottle' }),
  Ink: C('Ink', 'নীল কালি (তরল নীল)', 'Blue ink', '—', 'organic', 'liquid', '#2d4fa8', 'organic', { dispense: 'indicator' }),
  LemonJuice: C('LemonJuice', 'লেবুর রস', 'Lemon juice', '—', 'acid', 'liquid', '#f6e27a', 'acid', { weak: true, conc: 0.3, acid: { h: 1, ka: 7.4e-4 } }),
  SoapSol: C('SoapSol', 'সাবানের দ্রবণ', 'Soap solution', '—', 'base', 'liquid', '#eef2f6', 'base', { weak: true, conc: 0.1, base: { oh: 1, kb: 1e-4 } }),
  CaC2: C('CaC2', 'ক্যালসিয়াম কার্বাইড', 'Calcium carbide', 'CaC₂', 'salt', 'solid', '#6b6b66', 'salt', { dispense: 'powder', molarMass: 64 }),
};

// ------------------------------------------------------------------ helpers
const SUB = '₀₁₂₃₄₅₆₇₈₉';
const ascii = (s) => s.replace(/[₀-₉]/g, (d) => String(SUB.indexOf(d)));
const keyOf = (f) => ascii(f).replace(/\(s\)|\(l\)|\(g\)|\(aq\)|[()\s]/g, '').replace(/↑|↓/g, '');
const norm = (s) => ascii(s).replace(/\s+/g, ' ').trim();

function atoms(formula) {
  // supports parentheses, subscripts and hydrates with ·
  const f = ascii(formula).replace(/\((s|l|g|aq)\)/g, '').replace(/↑|↓/g, '').trim();
  const parts = f.split('·');
  const total = {};
  const add = (el, n) => { total[el] = (total[el] || 0) + n; };
  const parse = (str, mult) => {
    const stack = [{}];
    let i = 0;
    while (i < str.length) {
      const ch = str[i];
      if (ch === '(') { stack.push({}); i++; }
      else if (ch === ')' && stack.length < 2) { i++; }
      else if (ch === ')') {
        i++; let n = ''; while (/\d/.test(str[i] || '')) n += str[i++];
        const top = stack.pop(); const m = n ? +n : 1;
        for (const [k, v] of Object.entries(top)) stack[stack.length - 1][k] = (stack[stack.length - 1][k] || 0) + v * m;
      } else if (/[A-Z]/.test(ch)) {
        let el = ch; i++; while (/[a-z]/.test(str[i] || '')) el += str[i++];
        let n = ''; while (/\d/.test(str[i] || '')) n += str[i++];
        stack[stack.length - 1][el] = (stack[stack.length - 1][el] || 0) + (n ? +n : 1);
      } else i++;
    }
    for (const [k, v] of Object.entries(stack[0])) add(k, v * mult);
  };
  parts.forEach((p, idx) => {
    let m = 1; let body = p.trim();
    const lead = body.match(/^(\d+)(?=[A-Z(])/); if (idx > 0 && lead) { m = +lead[1]; body = body.slice(lead[0].length); }
    parse(body, m);
  });
  return total;
}
const side = (terms) => terms.reduce((acc, t) => { for (const [k, v] of Object.entries(atoms(t.f))) acc[k] = (acc[k] || 0) + v * t.coef; return acc; }, {});
const sameAtoms = (a, b) => { const ks = new Set([...Object.keys(a), ...Object.keys(b)]); return [...ks].every((k) => (a[k] || 0) === (b[k] || 0)); };

function parseEq(raw) {
  if (!raw) return null;
  let s = raw.replace(/\s*\+\s*তাপ\s*$/, '').split('  (')[0].split(' (বইয়ে')[0].split(' ; ΔH')[0].replace(/\s+/g, ' ').trim();
  if (!s.includes('→') || /⁺|⁻|e⁻|·\+|\+\s*e/.test(s)) return null;
  const [l, r] = s.split('→');
  const mk = (str) => str.split(/\s\+\s/).map((t) => {
    const m = t.trim().match(/^(\d*)\s*(.+)$/); if (!m) return null;
    return { coef: m[1] ? +m[1] : 1, f: m[2].trim() };
  });
  const L = mk(l), R = mk(r);
  if (L.some((x) => !x) || R.some((x) => !x)) return null;
  return { text: s, L, R, balanced: sameAtoms(side(L), side(R)) };
}
function splitEquations(raw) {
  if (!raw) return [];
  const parts = raw.split(/;|\n/).map((x) => x.trim()).filter((x) => x.includes('→'));
  return parts.length ? parts : [];
}
const dH = (s) => { const m = (s || '').match(/ΔH\s*=\s*([−+-]?\s*[\d.]+)/); return m ? parseFloat(m[1].replace('−', '-').replace(/\s/g, '')) : null; };

const ACIDS_ = ['HCl', 'H2SO4', 'CH3COOH'], BASES_ = ['NaOH', 'CaOH2', 'NH4OH'];
const BASE_PAIRS = new Set([
  ...ACIDS_.flatMap((a) => BASES_.map((b) => [a, b].sort().join('|'))),
  ...['Zn', 'Mg', 'Fe', 'Al'].map((m) => [m, 'HCl'].sort().join('|')), ...['Zn', 'Mg', 'Fe', 'Al'].map((m) => [m, 'H2SO4'].sort().join('|')),
  'Cu|HCl', 'HCl|Na2CO3', 'CH3COOH|Na2CO3', 'H2SO4|Na2CO3', 'CaOH2|NH4Cl', 'AgNO3|NaCl', 'AgNO3|HCl', 'BaCl2|Na2SO4', 'BaCl2|H2SO4', 'KI|PbNO3', 'Na2SO4|PbNO3',
  'CuSO4|NaOH', 'CuSO4|Fe', 'CuSO4|Zn', 'Al|CuSO4', 'AgNO3|Cu', 'NaCl|Na2SO4',
].map((x) => x.split('|').sort().join('|')));
// numbers taken from the textbook (ΔH in kJ, + = heat released) where the book gives them
const OVERRIDES = { 'CaO|H2O': { dH: 63.95, tau: 6, note: 'বইয়ের ΔH = −৬৩.৯৫ kJ (পৃ. ১৭৩)' } };
const PPT_COLORS = { AgCl: ['#f5f5f0', 'সাদা AgCl'], BaSO4: ['#f7f7f2', 'সাদা BaSO₄'], PbI2: ['#f4c430', 'হলুদ PbI₂'], CuOH2: ['#8fc4e8', 'নীল Cu(OH)₂'],
  AlOH3: ['#f6f6f6', 'সাদা জেলের মতো Al(OH)₃'], FeOH2: ['#9dc7a0', 'সবুজ Fe(OH)₂'], FeOH3: ['#b5651d', 'লালচে-বাদামি Fe(OH)₃'], ZnOH2: ['#f3f3f0', 'সাদা Zn(OH)₂'], CaSO4: ['#f6f6f2', 'সাদা CaSO₄'] };

// ------------------------------------------------------------------ sections (real book headings)
const sectionsOf = {};
for (let n = 1; n <= 12; n++) {
  const f = path.join(here, 'reactions', `ch${String(n).padStart(2, '0')}.sections.json`);
  let arr = []; try { arr = JSON.parse(fs.readFileSync(f, 'utf8')); } catch { /* none */ }
  let top = arr.filter((x) => /^\d+\.\d+$/.test(String(x.no).trim())).map((x) => ({ no: String(x.no).trim(), titleBn: String(x.title_bn).trim(), page: +x.start_page }));
  if (!top.length) top = arr.map((x) => ({ no: String(x.no || '').trim(), titleBn: String(x.title_bn).trim(), page: +x.start_page }));
  top.sort((a, b) => a.page - b.page);
  sectionsOf[n] = top;
}
const sectionIdx = (ch, page) => {
  const list = sectionsOf[ch] || []; let idx = 1;
  list.forEach((s, i) => { if (page >= s.page) idx = i + 1; });
  return idx;
};

// ------------------------------------------------------------------ read inputs
const files = fs.readdirSync(here + '/reactions').filter((f) => /^ch\d+\.json$/.test(f)).sort();
const needed = new Map(); // id -> chem def
const reactions = [], experiments = [], cards = [], kin = {}, texts = {};
const stats = { bench: 0, benchModelled: 0, cards: 0 };

const topicIndex = (ch, title) => {
  const t = (title || '').replace(/^\d+[.\s]*/, '').trim();
  const list = CHAPTER_TOPICS[ch - 1];
  let i = list.findIndex((x) => x === t);
  if (i < 0) i = list.findIndex((x) => t.includes(x) || x.includes(t));
  return i < 0 ? 1 : i + 1;
};
const idFor = (f) => {
  const k = keyOf(f);
  if (EXISTING[k]) return { id: EXISTING[k], existing: true };
  if (NEW[k]) { needed.set(NEW[k].id, NEW[k]); return { id: NEW[k].id, existing: false }; }
  return null;
};
const isGas = (f) => /↑/.test(f);

const srcItems = {};
for (const file of files) {
  const d = JSON.parse(fs.readFileSync(path.join(here, 'reactions', file), 'utf8'));
  const ch = d.chapter;
  d.experiments.forEach((x) => { srcItems[x.id] = { ...x, ch }; });
  for (const e of d.experiments) {
    const A = (x) => (Array.isArray(x) ? x.map((y) => (typeof y === 'string' ? y : JSON.stringify(y))) : x ? [String(x)] : []);
    e.materials_bn = A(e.materials_bn); e.procedure_bn = A(e.procedure_bn);
    e.reactants = Array.isArray(e.reactants) ? e.reactants.filter((r) => r && typeof r === 'object') : [];
    e.title_bn = String(e.title_bn || ''); e.observations_bn = e.observations_bn ? String(e.observations_bn) : ''; e.conditions = e.conditions ? String(e.conditions) : '';
    e.equation = typeof e.equation === 'string' ? e.equation : (Array.isArray(e.equation) ? e.equation.join('; ') : '');
    const topic = sectionsOf[ch]?.length ? sectionIdx(ch, +e.book_page || 0) : topicIndex(ch, e.topic_title_bn);
    const verified = e.confidence === 'read';
    const mkCard = (why) => {
      const body = [];
      if (e.observations_bn) body.push(e.observations_bn);
      if (e.conditions) body.push(`শর্ত: ${e.conditions}`);
      (e.procedure_bn || []).forEach((p, i) => body.push(`${i + 1}. ${p}`));
      if ((e.materials_bn || []).length) body.push(`উপকরণ: ${e.materials_bn.join(', ')}`);
      if (why) body.push(`ℹ️ ${why}`);
      cards.push({ id: e.id, chapter: ch, topic, titleBn: e.title_bn, page: e.book_page, equation: e.equation || undefined, bodyBn: body.filter(Boolean), verified });
      stats.cards++;
    };
    if (e.type !== 'bench') { mkCard('এই পরীক্ষা ল্যাব বেঞ্চে করা যায় না (বেশি তাপ/আগুন/তড়িৎ/শিল্প-প্রক্রিয়া বা গ্যাস লাগে) — তাই ব্যাখ্যা-কার্ড।'); continue; }
    stats.bench++;

    // ---- try to model it
    const eqs = splitEquations(e.equation).map(parseEq).filter(Boolean);
    let modelled = false; let reason = 'এই ল্যাবে প্রয়োজনীয় রাসায়নিক/ধরন নেই।';
    const text = `${e.title_bn} ${(e.materials_bn || []).join(' ')} ${e.conditions || ''}`;
    const strong = /বার্নার|গরম|তাপ দ|ফুটন|heat/.test(e.conditions || '') && !/ঘরের|কক্ষ/.test(e.conditions || '');

    eqs.forEach((q, qi) => {
      if (modelled && qi > 0 && !/(অ্যান্টাসিড)/.test(e.title_bn)) return;
      if (q.R.some((t) => /·/.test(t.f)) || q.L.some((t) => /·/.test(t.f))) { reason = 'ক্রিস্টালীয় পানি (হাইড্রেট) সংক্রান্ত — বেঞ্চে দ্রবণের মডেলে নেই।'; return; }
      if (!q.balanced) { reason = 'বইয়ে সমীকরণটি সমতাকৃত নয়/পড়া যায়নি — যাচাই বাকি।'; return; }
      if (q.L.length !== 2) { reason = 'বিক্রিয়ক দুটির বেশি/কম — বেঞ্চের মডেলে ঢোকে না।'; return; }
      const ids = q.L.map((t) => idFor(t.f));
      if (ids.some((x) => !x)) { reason = 'একটি বিক্রিয়ক (যেমন গ্যাস বা জৈব যৌগ) এই ল্যাবে নেই।'; return; }
      if (ids[0].id === ids[1].id) return;
      if (q.L.some((t) => /\(g\)|↑/.test(t.f))) { reason = 'গ্যাসীয় বিক্রিয়ক বেঞ্চে ঢালা যায় না।'; return; }
      const pairKey = ids.map((x) => x.id).sort().join('|');
      const rid = `c${ch}-${e.id.split('-e')[1]}${eqs.length > 1 ? 'abc'[qi] : ''}`;
      const baseKnown = BASE_PAIRS.has(pairKey);
      const prior = reactions.find((r) => r.pairKey === pairKey);
      const defOf = (cid) => NEW[Object.keys(NEW).find((k) => NEW[k].id === cid)] || null;
      const typeOf = (x) => (x.existing ? ({ HCl: 'acid', H2SO4: 'acid', CH3COOH: 'acid', NaOH: 'base', CaOH2: 'base', NH4OH: 'base', Zn: 'metal', Mg: 'metal', Fe: 'metal', Cu: 'metal', Al: 'metal' }[x.id] || 'salt') : defOf(x.id).type);
      const types = ids.map(typeOf);
      const has = (t) => types.includes(t);
      const prodGas = q.R.find((t) => isGas(t.f));
      const prodPpt = q.R.find((t) => /↓/.test(t.f));
      const carbonate = q.L.some((t) => /CO3|HCO3/.test(keyOf(t.f)));
      let category = 'other';
      if (has('acid') && carbonate) category = 'gas-carbonate';
      else if (has('acid') && has('metal')) category = 'gas-metal';
      else if (has('acid') && (has('base') || has('oxide'))) category = 'neutralization';
      else if (prodPpt) category = 'precipitation';
      else if (has('metal') && has('salt')) category = 'displacement';
      else if (prodGas) category = 'gas-other';
      if (strong && !['neutralization', 'precipitation'].includes(category)) { reason = 'বেশি তাপ লাগে — ১০০°C-এর বেঞ্চে সম্ভব নয়।'; return; }
      const gas = prodGas ? ({ 'CH≡CH': 'C₂H₂' }[prodGas.f.replace(/\(g\)|↑|\s/g, '')] || prodGas.f.replace(/\(g\)|↑|\s/g, '')) : false;
      const ppt = prodPpt ? (PPT_COLORS[keyOf(prodPpt.f)] || ['#f4f4ef', `${prodPpt.f.replace(/\(s\)|↓/g, '')} (অধঃক্ষেপ)`]) : null;
      const eqShow = q.text.replace(/\((s|l|aq)\)/g, '').replace(/\(g\)/g, '').replace(/\s+/g, ' ');
      const dh = OVERRIDES[pairKey]?.dH ?? dH(e.equation) ?? dH(e.observations_bn) ?? null;
      const obs = e.observations_bn || (category === 'neutralization' ? 'এসিড ও ক্ষার/ক্ষারীয় অক্সাইড বিক্রিয়া করে লবণ ও পানি উৎপন্ন করে।' : gas ? `${gas} গ্যাস উৎপন্ন হয়।` : ppt ? `${ppt[1]} অধঃক্ষেপ পড়ে।` : 'বিক্রিয়া ঘটে।');
      let reactionId = null;
      if (!baseKnown && !prior) {
        const parts = q.L.map((t, i) => ({ id: ids[i].id, part: t.coef }));
        const rx = {
          id: rid, pairKey, reactants: parts, category, equation: eqShow, nameBn: e.title_bn,
          effects: { colorChange: category === 'neutralization', gas, precipitate: ppt ? { color: ppt[0], name: ppt[1] } : null,
            temp: dh != null && dh > 0 ? 'rises' : category === 'neutralization' ? 'rises' : 'none', smell: gas === 'NH₃' ? 'pungent' : null,
            vigor: category === 'gas-carbonate' ? 'high' : 'medium' },
          observationBn: obs, useBn: '—', safetyBn: e.safety_bn || '',
        };
        reactions.push(rx);
        if (OVERRIDES[pairKey]) kin[rid] = { tau: OVERRIDES[pairKey].tau, dH: OVERRIDES[pairKey].dH, note: OVERRIDES[pairKey].note };
        else if (dh != null) kin[rid] = { tau: category === 'precipitation' ? 1.5 : 8, dH: dh, note: 'বইয়ের ΔH মান ধরে হিসাব' };
        else if (['gas-other', 'other'].includes(category)) kin[rid] = { tau: 30, dH: 0, note: 'গতি আনুমানিক; তাপের পরিবর্তন বইয়ে নেই বলে মডেল করা হয়নি' };
        reactionId = rid;
      } else if (prior) reactionId = prior.id;

      if (experiments.some((x) => x.chapter === ch && x.pairKey === pairKey)) { modelled = true; return; }
      const mats = [];
      q.L.forEach((t, i) => {
        const cid = ids[i].id; const def = ids[i].existing ? null : defOf(cid);
        const solid = def ? def.state === 'solid' : ['Zn', 'Mg', 'Fe', 'Cu', 'Al', 'Na2CO3', 'NH4Cl'].includes(cid);
        const mm = def?.molarMass || { Zn: 65.4, Mg: 24.3, Fe: 55.8, Cu: 63.5, Al: 27, Na2CO3: 106, NH4Cl: 53.5 }[cid] || 60;
        if (solid) {
          const g = Math.max(0.2, Math.round(t.coef * 0.005 * mm * (category.startsWith('gas') ? 1.4 : 1) * 10) / 10);
          const metal = ['Zn', 'Mg', 'Fe', 'Cu', 'Al'].includes(cid) || def?.dispense === 'metal';
          mats.push({ chem: cid, amount: g, unit: 'g', tool: metal ? 'forceps' : 'spoon' });
        } else mats.push({ chem: cid, amount: cid === 'H2O' ? 10 : Math.min(15, t.coef * 5), unit: 'mL', tool: 'pour' });
      });
      if (/লিটমাস/.test(text)) mats.push({ chem: 'LitmusBlue', amount: 5, unit: 'drops', tool: 'dropper' });
      if (/ইউনিভার্সাল/.test(text)) mats.push({ chem: 'UniversalIndicator', amount: 5, unit: 'drops', tool: 'dropper' });
      experiments.push({ id: `x-${rid}`, pairKey, chapter: ch, topic, titleBn: e.title_bn, page: e.book_page, ...(reactionId ? { reactionIds: [reactionId] } : {}),
        materials: mats, observeBn: [obs], aimBn: e.title_bn, verified });
      modelled = true;
    });

    // ---- indicator tests without an equation (litmus / universal indicator with one reagent)
    if (!modelled && !eqs.length && /লিটমাস|ইউনিভার্সাল/.test(text)) {
      const mains = (e.reactants || []).map((r) => idFor(r.formula || '')).filter(Boolean).filter((x) => !['H2O'].includes(x.id));
      if (mains.length === 1 && (e.reactants || []).length <= 3) {
        const ind = /ইউনিভার্সাল/.test(text) ? 'UniversalIndicator' : /লাল লিটমাস/.test(e.title_bn) ? 'LitmusRed' : 'LitmusBlue';
        experiments.push({ id: `x-${e.id}`, chapter: ch, topic, titleBn: e.title_bn, page: e.book_page,
          materials: [{ chem: mains[0].id, amount: 5, unit: 'mL', tool: 'pour' }, { chem: ind, amount: 5, unit: 'drops', tool: 'dropper' }],
          observeBn: [e.observations_bn || 'নির্দেশকের রং লক্ষ করুন।'], aimBn: e.title_bn, verified });
        modelled = true;
      }
    }
    if (modelled) stats.benchModelled++; else mkCard(reason);
  }
}

{
  const d1 = JSON.parse(fs.readFileSync(path.join(here, 'reactions', 'ch01.json'), 'utf8')).experiments.find((x) => x.id === 'c1-e1');
  if (d1) {
    NEW.NH4Cl_ = null;
    reactions.push({ id: 'c1-1', pairKey: 'H2O|NH4Cl', reactants: [{ id: 'NH4Cl', part: 1 }, { id: 'H2O', part: 10 }], category: 'dissolution',
      equation: 'NH₄Cl(s) + aq → NH₄Cl(aq)', nameBn: d1.title_bn, effects: { colorChange: false, gas: false, precipitate: null, temp: 'drops', smell: null },
      observationBn: String(d1.observations_bn || 'দ্রবীভূত হওয়ার সময় তাপ শোষিত হয়, দ্রবণের তাপমাত্রা কমে যায়।'), useBn: '—', safetyBn: '' });
    kin['c1-1'] = { tau: 6, dH: -14.8, note: 'তাপহারী দ্রবণ; ΔH-এর মান (≈ +১৪.৮ kJ/mol) আনুমানিক, বইয়ে তাপমাত্রার তালিকা আছে (পৃ. ১০-১১)' };
    needed.set('H2O', NEW.H2O);
    experiments.push({ id: 'x-c1-1', pairKey: 'H2O|NH4Cl', chapter: 1, topic: 5, titleBn: d1.title_bn, page: d1.book_page, reactionIds: ['c1-1'],
      materials: [{ chem: 'H2O', amount: 10, unit: 'mL', tool: 'pour' }, { chem: 'NH4Cl', amount: 1.5, unit: 'g', tool: 'spoon' }],
      observeBn: [String(d1.observations_bn || 'দ্রবণের তাপমাত্রা কমে যায় (তাপহারী)।')], aimBn: d1.title_bn, verified: true });
    delete NEW.NH4Cl_;
    // the card version of the same item is replaced
    const i = cards.findIndex((c) => c.id === 'c1-e1'); if (i >= 0) cards.splice(i, 1);
  }
}

// ------------------------------------------------------------------ observation-only (demo) experiments
// Physical changes, solubility, pH and rate experiments from the book that need no reaction table entry.
// amounts are scaled to the bench vessels (test tube 20 mL / beaker 100 mL); the book page and its observation text are cited.
{
  const M = (chem, amount, unit, tool) => ({ chem, amount, unit, tool });
  const W = (ml) => M('H2O', ml, 'mL', 'pour');
  const UI = M('UniversalIndicator', 5, 'drops', 'dropper');
  const demo = (src, title, materials, flags = {}, obs = null, verified = null) => {
    const it = srcItems[src]; if (!it) return;
    const o = obs || (it.observations_bn ? [String(it.observations_bn)] : []);
    experiments.push({ id: `d-${src}-${experiments.length}`, pairKey: `demo:${title}`, chapter: it.ch, topic: sectionsOf[it.ch]?.length ? sectionIdx(it.ch, +it.book_page) : 1,
      titleBn: title, page: +it.book_page, materials, observeBn: Array.isArray(o) ? o : [o], aimBn: title, demo: true, verified: verified ?? (it.confidence === 'read'), ...flags });
    const k = cards.findIndex((c) => c.id === src && flags.dropCard !== false && !flags.keepCard); if (k >= 0 && !flags.keepCard) cards.splice(k, 1);
  };
  demo('c2-e1', 'পানিতে KMnO₄-এর ব্যাপন — ঠান্ডা পানিতে', [W(15), M('KMnO4', 0.1, 'g', 'spoon')], { keepCard: true });
  demo('c2-e1', 'পানিতে KMnO₄-এর ব্যাপন — গরম পানিতে (তুলনা)', [W(15), M('KMnO4', 0.1, 'g', 'spoon')], { heat: true });
  demo('c2-e2', 'পানিতে তরল নীলের (কালির) ব্যাপন', [W(15), M('Ink', 4, 'drops', 'dropper')]);
  demo('c2-e9', 'পানির স্ফুটনাঙ্ক নির্ণয়', [W(15)], { heat: true, noReact: true, needTemp: 98 }, ['পানি গরম করতে করতে থার্মোমিটারে তাপমাত্রা ১০০°C-এর কাছাকাছি পৌঁছালে ফুটতে শুরু করে; ফোটার সময় তাপমাত্রা স্থির থাকে — এটিই স্ফুটনাঙ্ক (বই: পৃ. ২৭, চিত্র ২.০৮)।']);
  demo('c5-e13', 'দ্রাব্যতা: খাদ্য লবণ (আয়নিক) পানিতে', [W(10), M('NaClS', 1, 'g', 'spoon')], {}, ['NaCl পানিতে দ্রবীভূত হয় (বই: পৃ. ১০১)।']);
  demo('c5-e13', 'দ্রাব্যতা: তুঁতে (CuSO₄·5H₂O, আয়নিক) পানিতে', [W(10), M('CuSO4H2O', 1, 'g', 'spoon')], {}, ['CuSO₄·5H₂O পানিতে দ্রবীভূত হয়ে নীল দ্রবণ তৈরি করে (বই: পৃ. ১০১)।']);
  demo('c5-e13', 'দ্রাব্যতা: সিলভার ক্লোরাইড (আয়নিক) পানিতে', [W(10), M('AgCl', 0.5, 'g', 'spoon')], {}, ['সিলভার ক্লোরাইড আয়নিক যৌগ হলেও পানিতে দ্রবীভূত হয় না (বই: পৃ. ১০১)।']);
  demo('c5-e13', 'দ্রাব্যতা: ন্যাপথালিন (সমযোজী) পানিতে', [W(10), M('Naphthalene', 0.5, 'g', 'spoon')], {}, ['ন্যাপথালিন পানিতে দ্রবীভূত হয় না (বই: পৃ. ১০১)।']);
  demo('c5-e13', 'তুলনা: ন্যাপথালিন কেরোসিনে (অতিরিক্ত — বইয়ে এই পরীক্ষা নেই)', [M('Kerosene', 10, 'mL', 'pour'), M('Naphthalene', 0.5, 'g', 'spoon')], { keepCard: true }, ['অপোলার (সমযোজী) যৌগ অপোলার দ্রাবকে দ্রবীভূত হয়। — এই তুলনামূলক পরীক্ষাটি বইয়ে সরাসরি নেই, সদৃশ-সদৃশ নীতি বোঝার জন্য যোগ করা হয়েছে।'], false);
  demo('c6-e14', '০.২ মোলার NaCl দ্রবণ প্রস্তুতি (বইয়ের ২৫০ mL-এর ১/১০ ভাগ: ২৫ mL)', [M('NaClS', 0.29, 'g', 'spoon'), W(25)], { vessel: 'b1' }, ['w = S×V×M/1000 = ০.২ × ২৫ × ৫৮.৫ / ১০০০ ≈ ০.২৯ g NaCl। (বইয়ে ২৫০ mL-এ ২.৯২৫ g — বই: পৃ. ১১৭।) দ্রবণের ঘনমাত্রা ডানের প্যানেলে হিসাব করে দেখানো হবে।']);
  demo('c6-e16', '০.১ মোলার Na₂CO₃ দ্রবণ প্রস্তুতি (বইয়ের ২৫০ mL-এর ১/১০ ভাগ: ২৫ mL)', [M('Na2CO3', 0.27, 'g', 'spoon'), W(25)], { vessel: 'b1' }, ['w = ০.১ × ২৫ × ১০৬ / ১০০০ ≈ ০.২৭ g Na₂CO₃। (বইয়ে ২৫০ mL-এ ২.৬৫ g — বই: পৃ. ১৩৬।)']);
  demo('c8-e1', 'পানিতে অ্যামোনিয়াম ক্লোরাইড দ্রবীভূত করে তাপমাত্রা পর্যবেক্ষণ (বইয়ের পরিমাণ)', [W(50), M('NH4Cl', 10, 'g', 'spoon')], { vessel: 'b1' });
  const ph = (name, chem, ml, page) => demo('c9-e32', `pH পরিমাপ: ${name} + ইউনিভার্সাল নির্দেশক`, [M(chem, ml, 'mL', 'pour'), UI], {}, ['ইউনিভার্সাল নির্দেশক ভিন্ন pH-এ ভিন্ন রং দেয়; রং কালার চার্টের সাথে মিলিয়ে pH জানা যায় (বই: পৃ. ২২১, চিত্র ৯.০১)। ডানের প্যানেলে গণনা করা pH দেখুন।']);
  ph('হাইড্রোক্লোরিক এসিড (তীব্র এসিড)', 'HCl', 5); ph('এসিটিক এসিড/ভিনেগার (মৃদু এসিড)', 'CH3COOH', 5); ph('লেবুর রস', 'LemonJuice', 5);
  ph('পানি (নিরপেক্ষ)', 'H2O', 5); ph('সাবানের দ্রবণ (মৃদু ক্ষার)', 'SoapSol', 5); ph('অ্যামোনিয়াম হাইড্রক্সাইড (মৃদু ক্ষার)', 'NH4OH', 5); ph('সোডিয়াম হাইড্রক্সাইড (তীব্র ক্ষার)', 'NaOH', 5);
  demo('c9-e34', 'লিটমাস পরীক্ষা: লেবুর রস (অম্লীয়)', [M('LemonJuice', 5, 'mL', 'pour'), M('LitmusBlue', 5, 'drops', 'dropper')], {}, ['pH ৭-এর কম হলে লিটমাস লাল হয় (বই: পৃ. ২২২, চিত্র ৯.০৩)।']);
  demo('c9-e34', 'লিটমাস পরীক্ষা: সাবানের দ্রবণ (ক্ষারীয়)', [M('SoapSol', 5, 'mL', 'pour'), M('LitmusRed', 5, 'drops', 'dropper')], {}, ['pH ৭-এর বেশি হলে লিটমাস নীল হয় (বই: পৃ. ২২২, চিত্র ৯.০৩)।']);
  const salt = (name, chem, g, kind) => demo('c9-e41', `লবণের দ্রবণের প্রকৃতি: ${name}`, [W(10), M(chem, g, 'g', 'spoon'), UI], {}, [kind + ' (বই: পৃ. ২২৪)। ডানের প্যানেলে গণনা করা pH দেখুন।']);
  salt('NaCl (তীব্র এসিড + তীব্র ক্ষার থেকে — নিরপেক্ষ)', 'NaClS', 0.5, 'তীব্র এসিড ও তীব্র ক্ষার থেকে তৈরি লবণ (NaCl) নিরপেক্ষ প্রকৃতির');
  salt('Na₂CO₃ (তীব্র ক্ষার + মৃদু এসিড থেকে — ক্ষারীয়)', 'Na2CO3', 0.5, 'তীব্র ক্ষার ও মৃদু এসিড থেকে তৈরি লবণ (Na₂CO₃) ক্ষারীয় প্রকৃতির');
  salt('NH₄Cl (তীব্র এসিড + মৃদু ক্ষার থেকে — অম্লীয়)', 'NH4Cl', 0.5, 'তীব্র এসিড ও মৃদু ক্ষার থেকে তৈরি লবণ অম্লীয় প্রকৃতির (যেমন Zn(NO₃)₂, FeCl₃; NH₄Cl-ও একই শ্রেণির)');
  demo('c7-e41', 'বিক্রিয়ার হার: Na₂CO₃ + ভিনেগার — স্বাভাবিক তাপমাত্রায়', [M('Na2CO3', 0.5, 'g', 'spoon'), M('CH3COOH', 10, 'mL', 'pour')], { keepCard: true }, ['গ্যাসের (CO₂) বুদবুদ লক্ষ করুন (বই: পৃ. ১৬১)।']);
  demo('c7-e41', 'বিক্রিয়ার হার: Na₂CO₃ + ভিনেগার — গরম অবস্থায় (তাপমাত্রা বাড়ালে হার বাড়ে)', [M('Na2CO3', 0.5, 'g', 'spoon'), M('CH3COOH', 10, 'mL', 'pour')], { heat: true }, ['গরম অবস্থায় বুদবুদ বেশি ও দ্রুত হয় — তাপমাত্রা বাড়লে বিক্রিয়ার হার বাড়ে (বই: পৃ. ১৬১)।']);
}

// keep experiment order by chapter/topic/page
experiments.sort((a, b) => a.chapter - b.chapter || a.topic - b.topic || a.page - b.page);
cards.sort((a, b) => a.chapter - b.chapter || a.topic - b.topic || a.page - b.page);

const used = new Set([...reactions.flatMap((r) => r.reactants.map((x) => x.id)), ...experiments.flatMap((x) => x.materials.map((m) => m.chem))]);
needed.clear(); Object.values(NEW).forEach((c) => { if (used.has(c.id)) needed.set(c.id, c); });
const out = `// AUTO-GENERATED by lab/backend/db/data/chemistry-9-10/build-curriculum.mjs — do not edit by hand.
// Source: NCTB Class 9-10 Chemistry textbook (printed page numbers are cited on every item).
/* eslint-disable */
export const GEN_CHEMICALS: any[] = ${JSON.stringify([...needed.values()], null, 1)};
export const GEN_REACTIONS: any[] = ${JSON.stringify(reactions, null, 1)};
export const GEN_KIN: Record<string, any> = ${JSON.stringify(kin, null, 1)};
export const GEN_EXPERIMENTS: any[] = ${JSON.stringify(experiments, null, 1)};
export const GEN_CARDS: any[] = ${JSON.stringify(cards, null, 1)};
export const GEN_SECTIONS: Record<string, any[]> = ${JSON.stringify(sectionsOf, null, 1)};
`;
fs.writeFileSync(OUT, out);
console.log(JSON.stringify({ ...stats, reactions: reactions.length, experiments: experiments.length, cards: cards.length, newChemicals: needed.size }));
