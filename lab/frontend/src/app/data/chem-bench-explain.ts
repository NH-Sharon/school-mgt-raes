// Chemistry Bench — explanations (Bangla), kinetics and hazard data.
// Sources: NCTB Class 9-10 Chemistry syllabus concepts; ΔH values are textbook-level APPROXIMATIONS (kJ per mole of reaction
// as written) used only to estimate temperature rise — they are derived/teaching values, not measurements.
import { Reaction, REACTIONS, getChem } from './chemistry-lab-data';

export const MOLAR_MASS: Record<string, number> = { Na2CO3: 106, NH4Cl: 53.5, Zn: 65.4, Mg: 24.3, Fe: 55.8, Cu: 63.5, Al: 27 };
export const CONC = 1.0; // mol/L — every solution on the shelf is treated as 1 M (dilute) in this lab
export const GAS_MOLAR_VOLUME_ML = 24000; // mL/mol at ~25 °C

// ---------- extra reactions generated for completeness (acid + base, acid + carbonate/metal with H₂SO₄) ----------
const SUB = '₀₁₂₃₄₅₆₇₈₉';
const sub = (n: number) => n === 1 ? '' : String(n).split('').map(d => SUB[+d]).join('');
const gcd = (a: number, b: number): number => b ? gcd(b, a % b) : a;

const ACIDS: Record<string, { basicity: number; anion: string; anionCharge: number; parts: (n: number) => string }> = {
  HCl: { basicity: 1, anion: 'Cl', anionCharge: 1, parts: n => n === 1 ? 'Cl' : `Cl${sub(n)}` },
  H2SO4: { basicity: 2, anion: 'SO₄', anionCharge: 2, parts: n => 'SO₄' },
  CH3COOH: { basicity: 1, anion: 'CH₃COO', anionCharge: 1, parts: n => n === 1 ? 'CH₃COO' : `(CH₃COO)${sub(n)}` },
};
const BASES: Record<string, { acidity: number; cation: string; charge: number; label: string; formula: string }> = {
  NaOH: { acidity: 1, cation: 'Na', charge: 1, label: 'NaOH', formula: 'NaOH' },
  CaOH2: { acidity: 2, cation: 'Ca', charge: 2, label: 'Ca(OH)₂', formula: 'Ca(OH)₂' },
  NH4OH: { acidity: 1, cation: 'NH₄', charge: 1, label: 'NH₄OH', formula: 'NH₄OH' },
};
function saltFormula(cation: string, cCharge: number, anion: string, aCharge: number, anionIsPoly: boolean, cationIsPoly: boolean): string {
  const g = gcd(cCharge, aCharge);
  const nc = aCharge / g, na = cCharge / g;
  const c = nc === 1 ? cation : (cationIsPoly ? `(${cation})${sub(nc)}` : `${cation}${sub(nc)}`);
  const a = na === 1 ? anion : (anionIsPoly ? `(${anion})${sub(na)}` : `${anion}${sub(na)}`);
  return c + a;
}
const coef = (n: number) => n === 1 ? '' : String(n);

function buildNeutralizations(): Reaction[] {
  const out: Reaction[] = [];
  Object.entries(ACIDS).forEach(([aid, a]) => Object.entries(BASES).forEach(([bid, b]) => {
    const id = `neut-${aid.toLowerCase()}-${bid.toLowerCase()}`;
    if (REACTIONS.some(r => r.reactants.some(x => x.id === aid) && r.reactants.some(x => x.id === bid))) return;
    const g = gcd(a.basicity, b.acidity);
    const pa = b.acidity / g, pb = a.basicity / g;
    const water = a.basicity * pa;
    const salt = saltFormula(b.cation, b.charge, a.anion, a.anionCharge, a.anion !== 'Cl', b.cation === 'NH₄');
    const acidF = getChem(aid)!.formula, baseF = b.formula;
    out.push({
      id, category: 'neutralization', reactants: [{ id: aid, part: pa }, { id: bid, part: pb }],
      equation: `${coef(pa)}${acidF} + ${coef(pb)}${baseF} → ${salt} + ${coef(water)}H₂O`,
      nameBn: 'নিরপেক্ষীকরণ বিক্রিয়া',
      effects: { colorChange: true, gas: false, precipitate: null, temp: 'rises', smell: aid === 'CH3COOH' ? 'vinegar' : null },
      observationBn: `${getChem(aid)!.nameBn} ও ${getChem(bid)!.nameBn} বিক্রিয়া করে লবণ (${salt}) ও পানি উৎপন্ন করে। দ্রবণ গরম হয়।`,
      useBn: 'এসিড-ক্ষার নিরপেক্ষীকরণ — টাইট্রেশন ও এন্টাসিড/মাটির অম্লত্ব সংশোধনের মূলনীতি।',
      safetyBn: 'এসিড ও ক্ষার উভয়ই ত্বকে/চোখে ক্ষতিকর — গ্লাভস ও চশমা ব্যবহার করুন।',
    });
  }));
  return out;
}
function buildMetalSulphuric(): Reaction[] {
  const mk = (m: string, eq: string, mp: number, ap: number, vig: string, col: boolean | string, name: string): Reaction => ({
    id: `gas-${m.toLowerCase()}-h2so4`, category: 'gas-metal', reactants: [{ id: m, part: mp }, { id: 'H2SO4', part: ap }], equation: eq,
    nameBn: name, effects: { colorChange: col, gas: 'H₂', precipitate: null, temp: 'rises', smell: null, vigor: vig },
    observationBn: 'ধাতুর পৃষ্ঠে বুদবুদ আকারে হাইড্রোজেন গ্যাস নির্গত হয়। জ্বলন্ত কাঠি ধরলে "পপ" শব্দ হয়।',
    useBn: 'ল্যাবে হাইড্রোজেন গ্যাস প্রস্তুতি।', safetyBn: 'H₂ গ্যাস দাহ্য — আগুন থেকে দূরে রাখুন।',
  });
  return [
    mk('Zn', 'Zn + H₂SO₄ → ZnSO₄ + H₂↑', 1, 1, 'medium', false, 'জিংক ও সালফিউরিক এসিডের বিক্রিয়া'),
    mk('Mg', 'Mg + H₂SO₄ → MgSO₄ + H₂↑', 1, 1, 'high', false, 'ম্যাগনেসিয়াম ও সালফিউরিক এসিডের বিক্রিয়া'),
    mk('Fe', 'Fe + H₂SO₄ → FeSO₄ + H₂↑', 1, 1, 'low', 'to-pale-green', 'লোহা ও সালফিউরিক এসিডের বিক্রিয়া'),
    mk('Al', '2Al + 3H₂SO₄ → Al₂(SO₄)₃ + 3H₂↑', 2, 3, 'medium', false, 'অ্যালুমিনিয়াম ও সালফিউরিক এসিডের বিক্রিয়া'),
  ];
}
const EXTRA: Reaction[] = [
  ...buildNeutralizations(),
  ...buildMetalSulphuric(),
  { id: 'gas-na2co3-h2so4', category: 'gas-carbonate', reactants: [{ id: 'Na2CO3', part: 1 }, { id: 'H2SO4', part: 1 }],
    equation: 'Na₂CO₃ + H₂SO₄ → Na₂SO₄ + H₂O + CO₂↑', nameBn: 'সোডিয়াম কার্বনেট ও সালফিউরিক এসিডের বিক্রিয়া',
    effects: { colorChange: false, gas: 'CO₂', precipitate: null, temp: 'none', smell: null, vigor: 'high' },
    observationBn: 'তীব্র ফেনা ও বুদবুদসহ CO₂ গ্যাস নির্গত হয়। গ্যাসটি চুনের পানি ঘোলা করে।', useBn: 'কার্বনেট শনাক্তকরণ পরীক্ষা।', safetyBn: 'ফেনা উপচে পড়তে পারে — অল্প পরিমাণ নিন।' },
  { id: 'ppt-agno3-hcl', category: 'precipitation', reactants: [{ id: 'AgNO3', part: 1 }, { id: 'HCl', part: 1 }],
    equation: 'AgNO₃ + HCl → AgCl↓ + HNO₃', nameBn: 'সিলভার নাইট্রেট ও হাইড্রোক্লোরিক এসিডের বিক্রিয়া',
    effects: { colorChange: false, gas: false, precipitate: { color: '#f5f5f0', name: 'সাদা দইয়ের মতো (curdy) AgCl' }, temp: 'none', smell: null },
    observationBn: 'তৎক্ষণাৎ সাদা দইয়ের মতো AgCl অধঃক্ষেপ পড়ে।', useBn: 'ক্লোরাইড আয়ন শনাক্তকরণ।', safetyBn: 'AgNO₃ ত্বকে কালো দাগ ফেলে — গ্লাভস পরুন।' },
  { id: 'ppt-h2so4-bacl2', category: 'precipitation', reactants: [{ id: 'H2SO4', part: 1 }, { id: 'BaCl2', part: 1 }],
    equation: 'H₂SO₄ + BaCl₂ → BaSO₄↓ + 2HCl', nameBn: 'সালফিউরিক এসিড ও বেরিয়াম ক্লোরাইডের বিক্রিয়া',
    effects: { colorChange: false, gas: false, precipitate: { color: '#f7f7f2', name: 'সাদা BaSO₄' }, temp: 'none', smell: null },
    observationBn: 'তৎক্ষণাৎ ঘন সাদা BaSO₄ অধঃক্ষেপ পড়ে, যা এসিডেও দ্রবীভূত হয় না।', useBn: 'সালফেট আয়ন শনাক্তকরণ।', safetyBn: 'Ba²⁺ বিষাক্ত — গ্লাভস পরুন, মুখে নেবেন না।' },
  { id: 'ppt-pbno3-na2so4', category: 'precipitation', reactants: [{ id: 'PbNO3', part: 1 }, { id: 'Na2SO4', part: 1 }],
    equation: 'Pb(NO₃)₂ + Na₂SO₄ → PbSO₄↓ + 2NaNO₃', nameBn: 'লেড নাইট্রেট ও সোডিয়াম সালফেটের বিক্রিয়া',
    effects: { colorChange: false, gas: false, precipitate: { color: '#f4f4ef', name: 'সাদা PbSO₄' }, temp: 'none', smell: null },
    observationBn: 'সাদা PbSO₄ অধঃক্ষেপ পড়ে।', useBn: 'সীসা (Pb²⁺) আয়ন শনাক্তকরণ।', safetyBn: 'সীসার যৌগ বিষাক্ত — গ্লাভস পরুন, বর্জ্য আলাদা রাখুন।' },
];
export const ALL_REACTIONS: Reaction[] = [...REACTIONS, ...EXTRA];

// ---------- kinetics (time constants τ in seconds at 25 °C, lag before start, ΔH in kJ per reaction as written) ----------
interface Kin { tau: number; lag?: number; dH: number; note: string; }
const KIN_BY_ID: Record<string, Kin> = {
  'gas-zn-hcl': { tau: 28, dH: 153, note: 'মাঝারি গতি' },
  'gas-mg-hcl': { tau: 6, dH: 462, note: 'দ্রুত ও তীব্র' },
  'gas-fe-hcl': { tau: 95, dH: 87, note: 'ধীর' },
  'gas-al-hcl': { tau: 40, lag: 25, dH: 1050, note: 'শুরুতে ধীর (অক্সাইড স্তর), পরে মাঝারি' },
  'gas-na2co3-hcl': { tau: 5, dH: 0, note: 'দ্রুত' },
  'gas-na2co3-ch3cooh': { tau: 14, dH: 0, note: 'মাঝারি (দুর্বল এসিড)' },
  'gas-nh4cl-caoh2': { tau: 55, dH: 0, note: 'ধীর (গরম করলে দ্রুত হয়)' },
  'disp-fe-cuso4': { tau: 70, dH: 153, note: 'ধীর' },
  'disp-zn-cuso4': { tau: 35, dH: 219, note: 'মাঝারি' },
  'disp-al-cuso4': { tau: 50, lag: 15, dH: 1700, note: 'শুরুতে ধীর (অক্সাইড স্তর), পরে মাঝারি' },
  'disp-cu-agno3': { tau: 120, dH: 146, note: 'ধীর' },
};
export function kineticsOf(r: Reaction): Kin {
  if (KIN_BY_ID[r.id]) return KIN_BY_ID[r.id];
  if (r.category === 'neutralization') {
    const water = r.equation.split('→')[1]?.match(/(\d*)H₂O/);
    return { tau: 3, dH: 57 * (water && water[1] ? +water[1] : 1), note: 'প্রায় তাৎক্ষণিক (আয়নিক বিক্রিয়া)' };
  }
  if (r.category === 'precipitation') return { tau: 1.5, dH: 0, note: 'প্রায় তাৎক্ষণিক (আয়ন মিলিত হয়ে অধঃক্ষেপ)' };
  if (r.category === 'gas-metal') return { tau: r.effects.vigor === 'high' ? 6 : r.effects.vigor === 'low' ? 90 : 28, dH: 150, note: 'ধাতুর সক্রিয়তার উপর নির্ভরশীল' };
  if (r.category === 'gas-carbonate') return { tau: 6, dH: 0, note: 'দ্রুত' };
  return { tau: 30, dH: 100, note: 'মাঝারি' };
}

// ---------- explanations ----------
export interface ReactionText { why: string[]; how: string[]; ionic: string; }
const TXT: Record<string, ReactionText> = {
  'gas-zn-hcl': { ionic: 'Zn + 2H⁺ → Zn²⁺ + H₂↑',
    why: ['জিংক সক্রিয়তা সিরিজে হাইড্রোজেনের উপরে আছে, তাই এসিডের H⁺-কে সরিয়ে নিজে দ্রবণে যেতে পারে।', 'ফলে হাইড্রোজেন গ্যাস (H₂) তৈরি হয়।'],
    how: ['HCl পানিতে ভেঙে H⁺ ও Cl⁻ আয়ন দেয়।', 'জিংক পরমাণু ২টি ইলেকট্রন ছেড়ে Zn²⁺ হয়ে দ্রবণে যায়।', 'ইলেকট্রন নিয়ে ২টি H⁺ মিলে H₂ অণু হয়ে বুদবুদ আকারে বেরিয়ে যায়।', 'Cl⁻ আয়ন কিছুই করে না (দর্শক আয়ন); দ্রবণে ZnCl₂ থাকে।'] },
  'gas-mg-hcl': { ionic: 'Mg + 2H⁺ → Mg²⁺ + H₂↑',
    why: ['ম্যাগনেসিয়াম জিংকের চেয়েও বেশি সক্রিয়, তাই এসিড থেকে H⁺ আরও দ্রুত সরায়।', 'প্রচুর তাপ ও দ্রুত H₂ উৎপন্ন হয়।'],
    how: ['Mg পরমাণু ২টি ইলেকট্রন ছেড়ে Mg²⁺ হয়।', 'H⁺ আয়ন ইলেকট্রন গ্রহণ করে H₂ গ্যাস হয়।', 'বিক্রিয়া তীব্র তাপ ছাড়ে (এক্সোথার্মিক) — তাই পাত্র বেশ গরম হয়।'] },
  'gas-fe-hcl': { ionic: 'Fe + 2H⁺ → Fe²⁺ + H₂↑',
    why: ['লোহা হাইড্রোজেনের উপরে কিন্তু জিংকের নিচে — অল্প সক্রিয়, তাই বিক্রিয়া ধীর।'],
    how: ['Fe পরমাণু ২টি ইলেকট্রন ছেড়ে Fe²⁺ (হালকা সবুজ) হয়।', 'H⁺ ইলেকট্রন নিয়ে H₂ হয় — বুদবুদ অল্প অল্প নির্গত হয়।', 'গরম করলে বা গুঁড়া করলে বিক্রিয়া দ্রুত হয়।'] },
  'gas-al-hcl': { ionic: '2Al + 6H⁺ → 2Al³⁺ + 3H₂↑',
    why: ['অ্যালুমিনিয়াম সক্রিয় ধাতু, কিন্তু পৃষ্ঠে Al₂O₃-এর পাতলা স্তর থাকে বলে শুরুতে বিক্রিয়া হয় না।', 'অক্সাইড স্তর এসিডে গলে গেলে বিক্রিয়া শুরু হয়।'],
    how: ['প্রথমে HCl অক্সাইড স্তরকে দ্রবীভূত করে।', 'এরপর Al পরমাণু ৩টি ইলেকট্রন ছেড়ে Al³⁺ হয়।', 'প্রতি ২টি Al-এর জন্য ৩টি H₂ অণু উৎপন্ন হয়।'] },
  'gas-na2co3-hcl': { ionic: 'CO₃²⁻ + 2H⁺ → H₂O + CO₂↑',
    why: ['কার্বনেট আয়ন (CO₃²⁻) এসিডের H⁺-এর সাথে মিলে অস্থিতিশীল কার্বনিক এসিড (H₂CO₃) তৈরি করে।', 'এটি তৎক্ষণাৎ ভেঙে পানি ও CO₂ গ্যাস হয়ে যায়।'],
    how: ['Na₂CO₃ দ্রবণে ২Na⁺ ও CO₃²⁻ আয়ন থাকে।', 'H⁺ + CO₃²⁻ → HCO₃⁻, তারপর HCO₃⁻ + H⁺ → H₂O + CO₂↑।', 'ফেনা বা বুদবুদ হলো CO₂ গ্যাস; চুনের পানি ঘোলা করলে CO₂ নিশ্চিত হয়।'] },
  'gas-na2co3-ch3cooh': { ionic: 'CO₃²⁻ + 2CH₃COOH → 2CH₃COO⁻ + H₂O + CO₂↑',
    why: ['এসিটিক এসিড দুর্বল এসিড — অল্প H⁺ দেয়, তাই বিক্রিয়া HCl-এর চেয়ে ধীর।', 'তবু এটি কার্বনেট থেকে CO₂ বের করতে সক্ষম।'],
    how: ['দুর্বল এসিড অল্প অংশ আয়নিত হয় বলে H⁺ ধীরে ধীরে সরবরাহ হয়।', 'CO₃²⁻ ক্রমে H₂CO₃ হয়ে H₂O ও CO₂-তে ভেঙে যায়।', 'ভিনেগারের মতো গন্ধ পাওয়া যায়।'] },
  'gas-nh4cl-caoh2': { ionic: 'NH₄⁺ + OH⁻ → NH₃↑ + H₂O',
    why: ['ক্ষার (OH⁻) অ্যামোনিয়াম আয়ন (NH₄⁺) থেকে H⁺ কেড়ে নেয়।', 'ফলে অ্যামোনিয়া (NH₃) গ্যাস তৈরি হয় — এটি ক্ষারীয় গ্যাস।'],
    how: ['NH₄Cl দ্রবণে NH₄⁺ ও Cl⁻ আয়ন থাকে; Ca(OH)₂ থেকে OH⁻ আসে।', 'NH₄⁺ একটি H⁺ ছেড়ে দেয় যা OH⁻-এর সাথে মিলে H₂O হয়।', 'অবশিষ্ট NH₃ ঝাঁঝালো গন্ধযুক্ত গ্যাস হিসেবে নির্গত হয়; গরম করলে বেশি দ্রুত বের হয়।'] },
  'ppt-agno3-nacl': { ionic: 'Ag⁺ + Cl⁻ → AgCl↓',
    why: ['Ag⁺ ও Cl⁻ মিলে যে AgCl তৈরি হয় তা পানিতে অদ্রবণীয়।', 'অদ্রবণীয় হওয়ায় সাদা কণা হিসেবে দ্রবণ থেকে আলাদা হয়ে পড়ে যায় (অধঃক্ষেপ)।'],
    how: ['দুটি দ্রবণই আয়নে ভাঙা থাকে: Ag⁺, NO₃⁻, Na⁺, Cl⁻।', 'Ag⁺ ও Cl⁻ পরস্পরকে আকর্ষণ করে AgCl গঠন করে।', 'Na⁺ ও NO₃⁻ দ্রবণে থেকে যায় (দর্শক আয়ন)।'] },
  'ppt-bacl2-na2so4': { ionic: 'Ba²⁺ + SO₄²⁻ → BaSO₄↓',
    why: ['BaSO₄ পানিতে প্রায় অদ্রবণীয়, তাই Ba²⁺ ও SO₄²⁻ মিলে সাদা অধঃক্ষেপ দেয়।'],
    how: ['দ্রবণে Ba²⁺, Cl⁻, Na⁺, SO₄²⁻ আয়ন থাকে।', 'Ba²⁺ + SO₄²⁻ → BaSO₄ (কঠিন কণা, নিচে জমে)।', 'Na⁺ ও Cl⁻ দ্রবণে থাকে (NaCl দ্রবণ)।'] },
  'ppt-pbno3-ki': { ionic: 'Pb²⁺ + 2I⁻ → PbI₂↓',
    why: ['PbI₂ ঠান্ডা পানিতে প্রায় অদ্রবণীয় এবং উজ্জ্বল হলুদ — তাই হলুদ অধঃক্ষেপ দেখা যায়।'],
    how: ['Pb²⁺ ও I⁻ আয়ন মিলিত হয়: প্রতি ১টি Pb²⁺-এ ২টি I⁻ লাগে।', 'হলুদ কণাগুলো ধীরে ধীরে নিচে জমে (গরম করলে গলে যায়, ঠান্ডায় সোনালি স্ফটিক হয় — "Golden Rain")।'] },
  'ppt-cuso4-naoh': { ionic: 'Cu²⁺ + 2OH⁻ → Cu(OH)₂↓',
    why: ['Cu(OH)₂ পানিতে অদ্রবণীয় ও হালকা নীল জেলের মতো — তাই নীল অধঃক্ষেপ পড়ে।'],
    how: ['নীল দ্রবণের Cu²⁺ আয়ন OH⁻-এর সাথে মেলে।', 'প্রতি ১টি Cu²⁺-এ ২টি OH⁻ লাগে।', 'Na⁺ ও SO₄²⁻ দ্রবণে থেকে যায়।'] },
  'disp-fe-cuso4': { ionic: 'Fe + Cu²⁺ → Fe²⁺ + Cu',
    why: ['লোহা তামার চেয়ে বেশি সক্রিয়, তাই Cu²⁺ থেকে ইলেকট্রন দিয়ে তামাকে ধাতু হিসেবে বের করে দেয়।', 'এটিই প্রতিস্থাপন বিক্রিয়া।'],
    how: ['Fe পরমাণু ২টি ইলেকট্রন ছেড়ে Fe²⁺ (হালকা সবুজ) হয়ে দ্রবণে যায়।', 'Cu²⁺ ঐ ইলেকট্রন নিয়ে লালচে-বাদামি Cu ধাতু হয়ে লোহার গায়ে জমা হয়।', 'নীল রং কমে সবুজাভ হয় কারণ Cu²⁺ কমে Fe²⁺ বাড়ে।'] },
  'disp-zn-cuso4': { ionic: 'Zn + Cu²⁺ → Zn²⁺ + Cu',
    why: ['জিংক তামার চেয়ে বেশি সক্রিয়, তাই Cu²⁺-কে প্রতিস্থাপন করতে পারে।'],
    how: ['Zn ২টি ইলেকট্রন ছেড়ে Zn²⁺ (বর্ণহীন) হয়।', 'Cu²⁺ ইলেকট্রন নিয়ে Cu ধাতু হিসেবে জমা হয়।', 'Cu²⁺ কমে যাওয়ায় নীল রং ম্লান হয়ে বর্ণহীন হয়ে যায়।'] },
  'disp-al-cuso4': { ionic: '2Al + 3Cu²⁺ → 2Al³⁺ + 3Cu',
    why: ['অ্যালুমিনিয়াম অনেক সক্রিয়, কিন্তু Al₂O₃ স্তর থাকায় শুরুতে ধীর।'],
    how: ['অক্সাইড স্তর ক্ষয় হলে Al ৩টি ইলেকট্রন ছেড়ে Al³⁺ হয়।', 'Cu²⁺ ইলেকট্রন নিয়ে Cu ধাতু হয়ে জমা হয়।', '২টি Al-এর বিপরীতে ৩টি Cu তৈরি হয়।'] },
  'disp-cu-agno3': { ionic: 'Cu + 2Ag⁺ → Cu²⁺ + 2Ag',
    why: ['তামা রূপার চেয়ে বেশি সক্রিয়, তাই Ag⁺ থেকে রূপা বের করে দেয়।'],
    how: ['Cu ২টি ইলেকট্রন ছেড়ে Cu²⁺ (নীল) হয়।', '২টি Ag⁺ ঐ ইলেকট্রন নিয়ে ২টি Ag ধাতু হয় — গাছের ডালের মতো স্ফটিক হিসেবে জমে।', 'দ্রবণ ধীরে ধীরে নীল হয়ে ওঠে।'] },
};

const NAME_BN: Record<string, string> = { Zn: 'জিংক', Mg: 'ম্যাগনেসিয়াম', Fe: 'লোহা', Al: 'অ্যালুমিনিয়াম', Cu: 'তামা', Ag: 'রূপা', Pb: 'সীসা' };

export function textFor(r: Reaction): ReactionText {
  if (TXT[r.id]) return TXT[r.id];
  const names = r.reactants.map(x => getChem(x.id)?.nameBn ?? x.id).join(' ও ');
  switch (r.category) {
    case 'neutralization':
      return { ionic: 'H⁺ + OH⁻ → H₂O',
        why: ['এসিড H⁺ আয়ন দেয় এবং ক্ষার OH⁻ আয়ন দেয়; H⁺ ও OH⁻ মিলে পানি (H₂O) গঠন করে — এটিই নিরপেক্ষীকরণ।', 'বিক্রিয়ায় তাপ ছাড়ে (এক্সোথার্মিক), তাই দ্রবণ গরম হয়।'],
        how: [`${names} পানিতে আয়নে ভেঙে থাকে।`, 'H⁺ + OH⁻ → H₂O (মূল বিক্রিয়া)।', 'অবশিষ্ট আয়ন মিলে লবণ গঠন করে; পানি বাষ্প করলে লবণ পাওয়া যায়।', 'এসিড বেশি থাকলে দ্রবণ অম্লীয়, ক্ষার বেশি থাকলে ক্ষারীয়, সমান হলে প্রায় নিরপেক্ষ — নির্দেশক দিয়ে বোঝা যায়।'] };
    case 'gas-metal': {
      const m = r.reactants.find(x => getChem(x.id)?.type === 'metal')?.id ?? '';
      return { ionic: `${m} + H⁺ → ${m}ⁿ⁺ + H₂↑`,
        why: [`${NAME_BN[m] ?? m} হাইড্রোজেনের চেয়ে সক্রিয়, তাই এসিডের H⁺ সরিয়ে H₂ গ্যাস তৈরি করে।`],
        how: ['ধাতু ইলেকট্রন ছেড়ে ধনাত্মক আয়ন হয়ে দ্রবণে যায়।', 'H⁺ ইলেকট্রন নিয়ে H₂ গ্যাস হয়ে বুদবুদ আকারে বেরোয়।'] };
    }
    case 'gas-carbonate':
      return { ionic: 'CO₃²⁻ + 2H⁺ → H₂O + CO₂↑',
        why: ['কার্বনেট এসিডের সাথে বিক্রিয়ায় অস্থিতিশীল H₂CO₃ তৈরি করে, যা ভেঙে CO₂ গ্যাস দেয়।'],
        how: ['CO₃²⁻ + H⁺ → HCO₃⁻; HCO₃⁻ + H⁺ → H₂O + CO₂↑।', 'ফেনা/বুদবুদ = CO₂।'] };
    case 'precipitation':
      return { ionic: 'ক্যাটায়ন + অ্যানায়ন → অদ্রবণীয় লবণ↓',
        why: ['দুই দ্রবণের আয়ন মিলে যে নতুন লবণ গঠন করে তা পানিতে অদ্রবণীয়, তাই কঠিন কণা হিসেবে আলাদা হয়ে পড়ে।'],
        how: ['দুটি লবণ দ্রবণে আয়নে ভাঙা থাকে।', 'যে দুটি আয়ন অদ্রবণীয় যৌগ গঠন করতে পারে তারা মিলে কঠিন হয়।', 'বাকি আয়ন দ্রবণে থাকে।'] };
    default:
      return { ionic: r.equation, why: [`${names} বিক্রিয়া করে নতুন পদার্থ তৈরি করে।`], how: ['বিস্তারিত ব্যাখ্যা এই বিক্রিয়ার জন্য এখনও যোগ করা হয়নি।'] };
  }
}

// ---------- "why it did NOT react" ----------
const ACTIVITY = ['Mg', 'Al', 'Zn', 'Fe', 'Pb', 'H', 'Cu', 'Ag'];
const SALT_METAL: Record<string, string> = { CuSO4: 'Cu', AgNO3: 'Ag', PbNO3: 'Pb', NaCl: 'Na', BaCl2: 'Ba', Na2SO4: 'Na', KI: 'K', Na2CO3: 'Na', NH4Cl: 'NH4' };
export const SURE_NO_REACTION_ID = new Set(['no-cu-hcl', 'no-nacl-na2so4']);

/** returns {sure, why[], how[]}; sure=false means "this lab has no data for this pair" (we must not claim there is no reaction in real life). */
export function noReactionReason(aId: string, bId: string): { sure: boolean; why: string[]; how: string[] } {
  const a = getChem(aId)!, b = getChem(bId)!;
  const [x, y] = [a, b].sort((p, q) => p.type.localeCompare(q.type));
  const pair = [a.type, b.type].sort().join('+');
  const key = [aId, bId].sort().join('|');
  if (key === 'Cu|HCl') return { sure: true,
    why: ['তামা সক্রিয়তা সিরিজে হাইড্রোজেনের নিচে অবস্থান করে — অর্থাৎ হাইড্রোজেনের চেয়ে কম সক্রিয়।', 'কম সক্রিয় ধাতু এসিড থেকে H⁺ সরাতে পারে না, তাই H₂ গ্যাস তৈরি হয় না।'],
    how: ['সক্রিয়তা সিরিজ: Mg > Al > Zn > Fe > Pb > H > Cu > Ag।', 'Cu পরমাণু ইলেকট্রন ছাড়তে ততটা প্রস্তুত নয় যতটা H⁺ গ্রহণ করতে চায়।', 'তাই তামা HCl-এ অপরিবর্তিত থাকে (গাঢ় HNO₃/গরম গাঢ় H₂SO₄ হলে ভিন্ন বিক্রিয়া হতো — এই ল্যাবে নেই)।'] };
  if (key === 'NaCl|Na2SO4') return { sure: true,
    why: ['দুটিই দ্রবণীয় লবণ; Na⁺, Cl⁻, SO₄²⁻ কোনো জোড়াই অদ্রবণীয় যৌগ, গ্যাস বা পানি গঠন করে না।', 'এটি একটি "নিয়ন্ত্রণ পরীক্ষা" — কিছু না ঘটাটাই প্রত্যাশিত।'],
    how: ['দ্রবণে আয়নগুলো স্বাধীনভাবে ভাসে: Na⁺, Cl⁻, SO₄²⁻।', 'Na₂SO₄ + NaCl-এ সম্ভাব্য নতুন যৌগ NaCl ও Na₂SO₄ই — যা আগেই দ্রবীভূত, তাই কোনো পরিবর্তন হয় না।'] };
  if (pair === 'acid+acid') return { sure: true,
    why: ['দুটিই এসিড — উভয়েই H⁺ দেয়। নিরপেক্ষীকরণের জন্য OH⁻ (ক্ষার) দরকার, যা এখানে নেই।', 'মিশালে শুধু মিশ্রণ হয়, নতুন পদার্থ তৈরি হয় না।'],
    how: ['দ্রবণে H⁺ ও দুই এসিডের অ্যানায়ন আলাদাভাবে থাকে।', 'অম্লীয় গুণ বজায় থাকে; ঘনত্ব গড় হয়ে যায়।'] };
  if (pair === 'base+base') return { sure: true,
    why: ['দুটিই ক্ষার — উভয়েই OH⁻ দেয়। বিক্রিয়ার জন্য H⁺ (এসিড) দরকার, যা এখানে নেই।'],
    how: ['দ্রবণে OH⁻ ও ক্যাটায়নগুলো আলাদা থাকে; ক্ষারীয় গুণ থাকে।'] };
  if (pair === 'metal+metal') return { sure: true,
    why: ['ধাতু-ধাতু মিশিয়ে সাধারণ তাপমাত্রায় বিক্রিয়া হয় না। রাসায়নিক বিক্রিয়ার জন্য দ্রবণে আয়ন (এসিড/লবণ) থাকা দরকার।'],
    how: ['কঠিন ধাতুর পরমাণু একে অপরের সাথে ইলেকট্রন বিনিময়ের সুযোগ পায় না।'] };
  if (pair === 'metal+salt') {
    const m = x.type === 'metal' ? x : y, s = x.type === 'metal' ? y : x;
    const sm = SALT_METAL[s.id] ?? '';
    if (['Na', 'K', 'Ba', 'NH4'].includes(sm)) return { sure: true,
      why: [`${m.nameBn} ${s.nameBn}-এর ধাতু (${sm}) থেকে কম সক্রিয় — তাই তাকে প্রতিস্থাপন করতে পারে না।`],
      how: ['প্রতিস্থাপন বিক্রিয়ায় বেশি সক্রিয় ধাতুই কম সক্রিয় ধাতুর আয়নকে সরাতে পারে।', `${sm} আয়ন সক্রিয়তা সিরিজে অনেক উপরে, তাই ${m.nameBn} তার ইলেকট্রন দিয়েও ${sm}⁺ কে ধাতুতে পরিণত করতে পারে না।`] };
    const im = ACTIVITY.indexOf(m.id), is = ACTIVITY.indexOf(sm);
    if (im >= 0 && is >= 0 && im >= is) return { sure: true,
      why: [`${m.nameBn} লবণের ধাতুর (${sm}) চেয়ে কম বা সমান সক্রিয় — তাই প্রতিস্থাপন হয় না।`],
      how: ['সক্রিয়তা সিরিজ: Mg > Al > Zn > Fe > Pb > H > Cu > Ag।', 'কম সক্রিয় ধাতু বেশি সক্রিয় ধাতুর আয়নকে সরাতে পারে না।'] };
  }
  if (pair === 'salt+salt' && ['NaCl', 'Na2SO4', 'KI'].includes(aId) && ['NaCl', 'Na2SO4', 'KI'].includes(bId)) {
    return { sure: true,
      why: ['দুটিই দ্রবণীয় লবণ। আয়ন বিনিময়ে যে নতুন জোড়া হতে পারে (যেমন Na⁺ + I⁻, K⁺ + Cl⁻, K⁺ + SO₄²⁻) সবই পানিতে দ্রবণীয় — তাই অধঃক্ষেপ, গ্যাস বা পানি কিছুই তৈরি হয় না।'],
      how: ['দ্রবণে সব আয়ন স্বাধীনভাবে ভাসে এবং কেউ কারো সাথে স্থায়ীভাবে যুক্ত হয় না (দর্শক আয়ন)।', 'বিক্রিয়া ঘটে তখনই যখন অন্তত একটি অদ্রবণীয় কঠিন, গ্যাস বা দুর্বল তড়িৎবিশ্লেষ্য (যেমন H₂O) তৈরি হয়।'] };
  }
  return { sure: false,
    why: ['এই জোড়ার বিক্রিয়া এই ল্যাবের ডেটাবেসে নেই। বাস্তবে কোনো বিক্রিয়া হতেও পারে — আমরা এখানে মডেল করিনি।', 'এটি "বিক্রিয়া হয় না" — এমন দাবি নয়; শিক্ষকের সাথে যাচাই করুন।'],
    how: ['পাঠ্যক্রমভুক্ত পরীক্ষাগুলো (প্রিসেট তালিকা) দিয়ে অনুশীলন করুন।'] };
}

// ---------- hazards ----------
export interface Hazard { level: 1 | 2 | 3; bn: string; }
export const HAZARD: Record<string, Hazard> = {
  HCl: { level: 2, bn: 'হাইড্রোক্লোরিক এসিড ক্ষয়কারী — ত্বক/চোখে জ্বালা করে; ধোঁয়া শ্বাসে ক্ষতিকর। গ্লাভস ও চশমা পরুন।' },
  H2SO4: { level: 3, bn: 'সালফিউরিক এসিড অত্যন্ত ক্ষয়কারী — ত্বক পুড়ে যেতে পারে। পানিতে এসিড ঢালবেন, এসিডে পানি নয়।' },
  CH3COOH: { level: 1, bn: 'এসিটিক এসিডের গন্ধ ঝাঁঝালো, চোখে জ্বালা করতে পারে।' },
  NaOH: { level: 3, bn: 'সোডিয়াম হাইড্রক্সাইড তীব্র ক্ষয়কারী — ত্বকে গভীর ক্ষত ও চোখের স্থায়ী ক্ষতি করতে পারে।' },
  CaOH2: { level: 1, bn: 'চুনের পানি চোখে গেলে জ্বালা করে — সাথে সাথে পানিতে ধুয়ে ফেলুন।' },
  NH4OH: { level: 2, bn: 'অ্যামোনিয়াম হাইড্রক্সাইড থেকে ঝাঁঝালো অ্যামোনিয়া গ্যাস বের হয় — ফিউম হুডের কাছে কাজ করুন।' },
  AgNO3: { level: 2, bn: 'সিলভার নাইট্রেট ত্বকে কালো দাগ ফেলে ও চোখে ক্ষতিকর — গ্লাভস পরুন।' },
  BaCl2: { level: 3, bn: 'বেরিয়াম ক্লোরাইড বিষাক্ত — গিলে ফেললে মারাত্মক; মুখে/ত্বকে লাগাবেন না।' },
  PbNO3: { level: 3, bn: 'লেড নাইট্রেট বিষাক্ত (সীসা) — গ্লাভস পরুন; বর্জ্য সাধারণ ড্রেনে ফেলবেন না।' },
  CuSO4: { level: 2, bn: 'কপার সালফেট ক্ষতিকর — গিলবেন না; পরিবেশের জন্য ক্ষতিকর।' },
  Na2CO3: { level: 1, bn: 'সোডিয়াম কার্বনেট চোখে/ত্বকে জ্বালা করতে পারে।' },
  Phenolphthalein: { level: 2, bn: 'ফেনলফথ্যালিন — ত্বকে লাগালে ধুয়ে ফেলুন; পরিমাণ অল্প নিন।' },
  Mg: { level: 1, bn: 'ম্যাগনেসিয়াম দাহ্য — আগুনের কাছে সতর্ক থাকুন।' },
};
