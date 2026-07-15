// Virtual Chemistry Lab — Chemical & Reaction Database (NCTB Class 9-10 syllabus)
// Ported from the original static prototype (lab/data.js) verbatim.

export interface Chemical {
  id: string;
  nameBn: string;
  nameEn: string;
  formula: string;
  type: 'acid' | 'base' | 'salt' | 'metal' | 'indicator';
  state: 'liquid' | 'solid';
  color: string;
  category: string;
  weak?: boolean;
}

export const CHEMICALS: Chemical[] = [
  { id: 'HCl', nameBn: 'হাইড্রোক্লোরিক এসিড', nameEn: 'Hydrochloric Acid', formula: 'HCl', type: 'acid', state: 'liquid', color: '#eef6fb', category: 'acid' },
  { id: 'H2SO4', nameBn: 'সালফিউরিক এসিড', nameEn: 'Sulphuric Acid', formula: 'H₂SO₄', type: 'acid', state: 'liquid', color: '#eef6fb', category: 'acid' },
  { id: 'CH3COOH', nameBn: 'এসিটিক এসিড (ভিনেগার)', nameEn: 'Acetic Acid', formula: 'CH₃COOH', type: 'acid', state: 'liquid', color: '#f6f3e7', category: 'acid', weak: true },

  { id: 'NaOH', nameBn: 'সোডিয়াম হাইড্রক্সাইড', nameEn: 'Sodium Hydroxide', formula: 'NaOH', type: 'base', state: 'liquid', color: '#eef6fb', category: 'base' },
  { id: 'CaOH2', nameBn: 'চুনের পানি (ক্যালসিয়াম হাইড্রক্সাইড)', nameEn: 'Lime Water', formula: 'Ca(OH)₂', type: 'base', state: 'liquid', color: '#f3fbf6', category: 'base' },
  { id: 'NH4OH', nameBn: 'অ্যামোনিয়াম হাইড্রক্সাইড', nameEn: 'Ammonium Hydroxide', formula: 'NH₄OH', type: 'base', state: 'liquid', color: '#eef6fb', category: 'base' },

  { id: 'NaCl', nameBn: 'সোডিয়াম ক্লোরাইড দ্রবণ', nameEn: 'Sodium Chloride', formula: 'NaCl', type: 'salt', state: 'liquid', color: '#eef6fb', category: 'salt' },
  { id: 'AgNO3', nameBn: 'সিলভার নাইট্রেট দ্রবণ', nameEn: 'Silver Nitrate', formula: 'AgNO₃', type: 'salt', state: 'liquid', color: '#f7f7f2', category: 'salt' },
  { id: 'BaCl2', nameBn: 'বেরিয়াম ক্লোরাইড দ্রবণ', nameEn: 'Barium Chloride', formula: 'BaCl₂', type: 'salt', state: 'liquid', color: '#eef6fb', category: 'salt' },
  { id: 'Na2SO4', nameBn: 'সোডিয়াম সালফেট দ্রবণ', nameEn: 'Sodium Sulphate', formula: 'Na₂SO₄', type: 'salt', state: 'liquid', color: '#eef6fb', category: 'salt' },
  { id: 'PbNO3', nameBn: 'লেড নাইট্রেট দ্রবণ', nameEn: 'Lead Nitrate', formula: 'Pb(NO₃)₂', type: 'salt', state: 'liquid', color: '#f7f7f2', category: 'salt' },
  { id: 'KI', nameBn: 'পটাসিয়াম আয়োডাইড দ্রবণ', nameEn: 'Potassium Iodide', formula: 'KI', type: 'salt', state: 'liquid', color: '#eef6fb', category: 'salt' },
  { id: 'CuSO4', nameBn: 'কপার সালফেট দ্রবণ', nameEn: 'Copper Sulphate', formula: 'CuSO₄', type: 'salt', state: 'liquid', color: '#3f7fd1', category: 'salt' },
  { id: 'Na2CO3', nameBn: 'সোডিয়াম কার্বনেট দ্রবণ', nameEn: 'Sodium Carbonate', formula: 'Na₂CO₃', type: 'salt', state: 'liquid', color: '#eef6fb', category: 'salt' },
  { id: 'NH4Cl', nameBn: 'অ্যামোনিয়াম ক্লোরাইড দ্রবণ', nameEn: 'Ammonium Chloride', formula: 'NH₄Cl', type: 'salt', state: 'liquid', color: '#eef6fb', category: 'salt' },

  { id: 'Zn', nameBn: 'দস্তা (জিংক) টুকরা', nameEn: 'Zinc', formula: 'Zn', type: 'metal', state: 'solid', color: '#b7bec4', category: 'metal' },
  { id: 'Mg', nameBn: 'ম্যাগনেসিয়াম ফিতা', nameEn: 'Magnesium', formula: 'Mg', type: 'metal', state: 'solid', color: '#d7dade', category: 'metal' },
  { id: 'Fe', nameBn: 'লোহার পেরেক', nameEn: 'Iron', formula: 'Fe', type: 'metal', state: 'solid', color: '#8a8f94', category: 'metal' },
  { id: 'Cu', nameBn: 'তামার তার', nameEn: 'Copper', formula: 'Cu', type: 'metal', state: 'solid', color: '#b5651d', category: 'metal' },
  { id: 'Al', nameBn: 'অ্যালুমিনিয়াম ফয়েল', nameEn: 'Aluminium', formula: 'Al', type: 'metal', state: 'solid', color: '#c9ccd1', category: 'metal' },

  { id: 'LitmusRed', nameBn: 'লাল লিটমাস দ্রবণ', nameEn: 'Red Litmus', formula: '—', type: 'indicator', state: 'liquid', color: '#e05c5c', category: 'indicator' },
  { id: 'LitmusBlue', nameBn: 'নীল লিটমাস দ্রবণ', nameEn: 'Blue Litmus', formula: '—', type: 'indicator', state: 'liquid', color: '#4b6fd1', category: 'indicator' },
  { id: 'Phenolphthalein', nameBn: 'ফেনলফথ্যালিন', nameEn: 'Phenolphthalein', formula: '—', type: 'indicator', state: 'liquid', color: '#f5f2e9', category: 'indicator' },
  { id: 'UniversalIndicator', nameBn: 'ইউনিভার্সাল ইন্ডিকেটর', nameEn: 'Universal Indicator', formula: '—', type: 'indicator', state: 'liquid', color: '#7fbf7f', category: 'indicator' },
];

export function getChem(id: string): Chemical | undefined {
  return CHEMICALS.find(c => c.id === id);
}

export interface ReactionEffects {
  colorChange: boolean | string;
  gas: boolean | string;
  precipitate: { color: string; name: string } | null;
  temp: string;
  smell: string | null;
  vigor?: string;
  coating?: boolean;
}

export interface Reaction {
  id: string;
  reactants: { id: string; part: number }[];
  category: string;
  equation: string;
  nameBn: string;
  effects: ReactionEffects;
  observationBn: string;
  useBn: string;
  safetyBn: string;
}

export const REACTIONS: Reaction[] = [
  { id: 'neut-hcl-naoh', reactants: [{ id: 'HCl', part: 1 }, { id: 'NaOH', part: 1 }], category: 'neutralization',
    equation: 'HCl + NaOH → NaCl + H₂O', nameBn: 'নিরপেক্ষীকরণ বিক্রিয়া',
    effects: { colorChange: true, gas: false, precipitate: null, temp: 'rises', smell: null },
    observationBn: 'এসিড ও ক্ষার বিক্রিয়া করে লবণ (NaCl) এবং পানি উৎপন্ন করে। হালকা তাপ উৎপন্ন হয় (এক্সোথার্মিক বিক্রিয়া)।',
    useBn: 'এই বিক্রিয়ার মূলনীতি ব্যবহার হয় এসিড-ক্ষার টাইট্রেশন ও এন্টাসিড ওষুধ তৈরিতে।',
    safetyBn: 'গাঢ় এসিড ও ক্ষার ত্বকে লাগলে জ্বালা করতে পারে — গ্লাভস পরিধান করা উচিত।' },
  { id: 'neut-h2so4-naoh', reactants: [{ id: 'H2SO4', part: 1 }, { id: 'NaOH', part: 2 }], category: 'neutralization',
    equation: 'H₂SO₄ + 2NaOH → Na₂SO₄ + 2H₂O', nameBn: 'নিরপেক্ষীকরণ বিক্রিয়া',
    effects: { colorChange: true, gas: false, precipitate: null, temp: 'rises', smell: null },
    observationBn: 'সালফিউরিক এসিড ক্ষারের সাথে বিক্রিয়া করে সোডিয়াম সালফেট লবণ ও পানি উৎপন্ন করে।',
    useBn: 'শিল্পে সোডিয়াম সালফেট উৎপাদনে ব্যবহৃত হয়।',
    safetyBn: 'গাঢ় H₂SO₄ অত্যন্ত ক্ষয়কারী — সরাসরি স্পর্শ এড়িয়ে চলুন।' },
  { id: 'neut-hcl-caoh2', reactants: [{ id: 'HCl', part: 2 }, { id: 'CaOH2', part: 1 }], category: 'neutralization',
    equation: '2HCl + Ca(OH)₂ → CaCl₂ + 2H₂O', nameBn: 'নিরপেক্ষীকরণ বিক্রিয়া',
    effects: { colorChange: true, gas: false, precipitate: null, temp: 'rises', smell: null },
    observationBn: 'চুনের পানি এসিডের সাথে বিক্রিয়া করে ক্যালসিয়াম ক্লোরাইড ও পানি উৎপন্ন করে, ঘোলাভাব দূর হয়ে যায়।',
    useBn: 'মাটির অম্লত্ব কমাতে কৃষিক্ষেত্রে চুন ব্যবহারের পেছনের রসায়ন এটি।',
    safetyBn: 'চুনের পানি চোখে গেলে সাথে সাথে পানি দিয়ে ধুয়ে ফেলুন।' },

  { id: 'gas-zn-hcl', reactants: [{ id: 'Zn', part: 1 }, { id: 'HCl', part: 2 }], category: 'gas-metal',
    equation: 'Zn + 2HCl → ZnCl₂ + H₂↑', nameBn: 'জিংক ও হাইড্রোক্লোরিক এসিডের বিক্রিয়া',
    effects: { colorChange: false, gas: 'H₂', precipitate: null, temp: 'rises slightly', smell: null, vigor: 'medium' },
    observationBn: 'দস্তার পৃষ্ঠে বুদবুদ আকারে হাইড্রোজেন গ্যাস নির্গত হয়। জ্বলন্ত কাঠি ধরলে "পপ" শব্দে গ্যাস জ্বলে ওঠে (Pop Test)।',
    useBn: 'ল্যাবে হাইড্রোজেন গ্যাস প্রস্তুতির প্রচলিত পদ্ধতি।',
    safetyBn: 'H₂ গ্যাস দাহ্য — খোলা আগুনের কাছে বেশি পরিমাণে জমতে দেওয়া নিরাপদ নয়।' },
  { id: 'gas-mg-hcl', reactants: [{ id: 'Mg', part: 1 }, { id: 'HCl', part: 2 }], category: 'gas-metal',
    equation: 'Mg + 2HCl → MgCl₂ + H₂↑', nameBn: 'ম্যাগনেসিয়াম ও হাইড্রোক্লোরিক এসিডের বিক্রিয়া',
    effects: { colorChange: false, gas: 'H₂', precipitate: null, temp: 'rises', smell: null, vigor: 'high' },
    observationBn: 'ম্যাগনেসিয়াম অত্যন্ত দ্রুত ও তীব্রভাবে বিক্রিয়া করে প্রচুর বুদবুদসহ H₂ গ্যাস উৎপন্ন করে — সক্রিয়তা সিরিজে Mg জিংকের চেয়ে বেশি সক্রিয়।',
    useBn: 'ধাতুর সক্রিয়তা সিরিজ (Reactivity Series) প্রমাণে ব্যবহৃত ক্লাসিক পরীক্ষা।',
    safetyBn: 'বিক্রিয়া দ্রুত তাপ উৎপন্ন করে — পাত্র গরম হয়ে যেতে পারে।' },
  { id: 'gas-fe-hcl', reactants: [{ id: 'Fe', part: 1 }, { id: 'HCl', part: 2 }], category: 'gas-metal',
    equation: 'Fe + 2HCl → FeCl₂ + H₂↑', nameBn: 'লোহা ও হাইড্রোক্লোরিক এসিডের বিক্রিয়া',
    effects: { colorChange: 'to-pale-green', gas: 'H₂', precipitate: null, temp: 'rises slightly', smell: null, vigor: 'low' },
    observationBn: 'লোহা ধীরে ধীরে বিক্রিয়া করে (Zn, Mg অপেক্ষা কম সক্রিয়), সামান্য বুদবুদ দেখা যায় এবং দ্রবণ ফ্যাকাশে সবুজ (FeCl₂) বর্ণ ধারণ করে।',
    useBn: 'সক্রিয়তা সিরিজে লোহার অবস্থান নির্ধারণে ব্যবহৃত হয়।',
    safetyBn: 'দীর্ঘ সময় বিক্রিয়া চলতে পারে — ধৈর্য ধরে পর্যবেক্ষণ করুন।' },
  { id: 'gas-al-hcl', reactants: [{ id: 'Al', part: 2 }, { id: 'HCl', part: 6 }], category: 'gas-metal',
    equation: '2Al + 6HCl → 2AlCl₃ + 3H₂↑', nameBn: 'অ্যালুমিনিয়াম ও হাইড্রোক্লোরিক এসিডের বিক্রিয়া',
    effects: { colorChange: false, gas: 'H₂', precipitate: null, temp: 'rises', smell: null, vigor: 'medium' },
    observationBn: 'অ্যালুমিনিয়ামের উপরিভাগের অক্সাইড স্তর ভাঙার পর দ্রুত বুদবুদসহ বিক্রিয়া শুরু হয়।',
    useBn: 'হালকা ধাতুর সক্রিয়তা যাচাইয়ে ব্যবহৃত হয়।',
    safetyBn: 'শুরুতে বিক্রিয়া ধীর হলেও পরে দ্রুত হতে পারে — সতর্ক থাকুন।' },
  { id: 'no-cu-hcl', reactants: [{ id: 'Cu', part: 1 }, { id: 'HCl', part: 1 }], category: 'no-reaction',
    equation: 'Cu + HCl → কোনো বিক্রিয়া নেই', nameBn: 'তামা ও হাইড্রোক্লোরিক এসিড',
    effects: { colorChange: false, gas: false, precipitate: null, temp: 'none', smell: null },
    observationBn: 'তামা হাইড্রোজেনের চেয়ে কম সক্রিয় হওয়ায় লঘু HCl-এর সাথে কোনো দৃশ্যমান বিক্রিয়া ঘটে না।',
    useBn: 'সক্রিয়তা সিরিজে হাইড্রোজেনের নিচে থাকা ধাতুগুলো এসিডের সাথে বিক্রিয়া করে না — এটি তারই প্রমাণ।',
    safetyBn: 'বিশেষ কোনো ঝুঁকি নেই।' },

  { id: 'gas-na2co3-hcl', reactants: [{ id: 'Na2CO3', part: 1 }, { id: 'HCl', part: 2 }], category: 'gas-carbonate',
    equation: 'Na₂CO₃ + 2HCl → 2NaCl + H₂O + CO₂↑', nameBn: 'সোডিয়াম কার্বনেট ও হাইড্রোক্লোরিক এসিডের বিক্রিয়া',
    effects: { colorChange: false, gas: 'CO₂', precipitate: null, temp: 'none', smell: null, vigor: 'high' },
    observationBn: 'তীব্র ফেনাসহ CO₂ গ্যাসের বুদবুদ নির্গত হয়। এই গ্যাস চুনের পানিতে চালনা করলে পানি দুধের মতো ঘোলা হয়ে যায় (CaCO₃ অধঃক্ষেপ)।',
    useBn: 'কার্বনেট শনাক্তকরণ ও CO₂ পরীক্ষায় ব্যবহৃত হয়।',
    safetyBn: 'বেশি পরিমাণে করলে দ্রুত ফেনা উপচে পড়তে পারে — ছোট পাত্রে অল্প পরিমাণে করুন।' },
  { id: 'gas-na2co3-ch3cooh', reactants: [{ id: 'Na2CO3', part: 1 }, { id: 'CH3COOH', part: 2 }], category: 'gas-carbonate',
    equation: 'Na₂CO₃ + 2CH₃COOH → 2CH₃COONa + H₂O + CO₂↑', nameBn: 'সোডিয়াম কার্বনেট ও এসিটিক এসিডের বিক্রিয়া',
    effects: { colorChange: false, gas: 'CO₂', precipitate: null, temp: 'none', smell: 'vinegar', vigor: 'low' },
    observationBn: 'দুর্বল এসিড (ভিনেগার) হওয়ায় তুলনামূলক ধীরে ও কম তীব্রভাবে CO₂ গ্যাস উৎপন্ন হয়।',
    useBn: 'শক্তিশালী ও দুর্বল এসিডের বিক্রিয়ার গতি তুলনা করতে ব্যবহৃত হয়।',
    safetyBn: 'বিশেষ কোনো ঝুঁকি নেই — নিরাপদ পরীক্ষা।' },

  { id: 'gas-nh4cl-caoh2', reactants: [{ id: 'NH4Cl', part: 2 }, { id: 'CaOH2', part: 1 }], category: 'gas-ammonia',
    equation: '2NH₄Cl + Ca(OH)₂ → CaCl₂ + 2H₂O + 2NH₃↑', nameBn: 'অ্যামোনিয়াম ক্লোরাইড ও চুনের পানির বিক্রিয়া',
    effects: { colorChange: false, gas: 'NH₃', precipitate: null, temp: 'none', smell: 'pungent', vigor: 'low' },
    observationBn: 'ঝাঁঝালো গন্ধযুক্ত অ্যামোনিয়া গ্যাস নির্গত হয়, যা আর্দ্র লাল লিটমাস কাগজকে নীল করে দেয়।',
    useBn: 'পরীক্ষাগারে অ্যামোনিয়া গ্যাস প্রস্তুতির প্রচলিত পদ্ধতি।',
    safetyBn: 'সরাসরি গ্যাস শুঁকবেন না — হাত দিয়ে বাতাস করে ঘ্রাণ নিন।' },

  { id: 'ppt-agno3-nacl', reactants: [{ id: 'AgNO3', part: 1 }, { id: 'NaCl', part: 1 }], category: 'precipitation',
    equation: 'AgNO₃ + NaCl → AgCl↓ + NaNO₃', nameBn: 'সিলভার নাইট্রেট ও সোডিয়াম ক্লোরাইডের বিক্রিয়া',
    effects: { colorChange: false, gas: false, precipitate: { color: '#f5f5f0', name: 'সাদা দইয়ের মতো (curdy) AgCl' }, temp: 'none', smell: null },
    observationBn: 'তৎক্ষণাৎ সাদা দইয়ের মতো অধঃক্ষেপ পড়ে, যা আলোর সংস্পর্শে ধীরে ধীরে ধূসর/বেগুনি-কালো রঙ ধারণ করে।',
    useBn: 'ক্লোরাইড আয়ন শনাক্তকরণের আদর্শ পরীক্ষা (ফটোগ্রাফিক ফিল্মেও ব্যবহৃত রসায়ন)।',
    safetyBn: 'AgNO₃ ত্বক/কাপড়ে কালো দাগ ফেলে — সাবধানে ব্যবহার করুন।' },
  { id: 'ppt-bacl2-na2so4', reactants: [{ id: 'BaCl2', part: 1 }, { id: 'Na2SO4', part: 1 }], category: 'precipitation',
    equation: 'BaCl₂ + Na₂SO₄ → BaSO₄↓ + 2NaCl', nameBn: 'বেরিয়াম ক্লোরাইড ও সোডিয়াম সালফেটের বিক্রিয়া',
    effects: { colorChange: false, gas: false, precipitate: { color: '#f7f7f2', name: 'সাদা BaSO₄' }, temp: 'none', smell: null },
    observationBn: 'ঘন সাদা অধঃক্ষেপ তৎক্ষণাৎ পড়ে যা এসিডেও দ্রবীভূত হয় না — এটি সালফেট আয়ন শনাক্তকরণের নিশ্চিত পরীক্ষা।',
    useBn: 'সালফেট আয়ন (SO₄²⁻) শনাক্তকরণের প্রমিত পরীক্ষা।',
    safetyBn: 'বেরিয়াম যৌগ বিষাক্ত — হাতে লাগলে ধুয়ে ফেলুন।' },
  { id: 'ppt-pbno3-ki', reactants: [{ id: 'PbNO3', part: 1 }, { id: 'KI', part: 2 }], category: 'precipitation',
    equation: 'Pb(NO₃)₂ + 2KI → PbI₂↓ + 2KNO₃', nameBn: 'সোনালী বৃষ্টি পরীক্ষা (Golden Rain)',
    effects: { colorChange: false, gas: false, precipitate: { color: '#f4c430', name: 'উজ্জ্বল হলুদ PbI₂' }, temp: 'none', smell: null },
    observationBn: 'উজ্জ্বল হলুদ রঙের অধঃক্ষেপ তৈরি হয় যা গরম করলে দ্রবীভূত হয়ে ঠান্ডা হওয়ার সময় চকচকে সোনালী কেলাসের মতো ঝরে পড়ে — একে "সোনালী বৃষ্টি" (Golden Rain) বলা হয়।',
    useBn: 'সবচেয়ে জনপ্রিয় প্রদর্শনীমূলক রাসায়নিক পরীক্ষাগুলোর একটি।',
    safetyBn: 'লেড যৌগ বিষাক্ত — মুখে/চোখে যেন না লাগে।' },
  { id: 'ppt-cuso4-naoh', reactants: [{ id: 'CuSO4', part: 1 }, { id: 'NaOH', part: 2 }], category: 'precipitation',
    equation: 'CuSO₄ + 2NaOH → Cu(OH)₂↓ + Na₂SO₄', nameBn: 'কপার সালফেট ও সোডিয়াম হাইড্রক্সাইডের বিক্রিয়া',
    effects: { colorChange: false, gas: false, precipitate: { color: '#8fc4e8', name: 'হালকা নীল জেলটিনাস Cu(OH)₂' }, temp: 'none', smell: null },
    observationBn: 'নীল CuSO₄ দ্রবণে NaOH যোগ করলে হালকা নীল রঙের জেলির মতো অধঃক্ষেপ পড়ে।',
    useBn: 'ধাতব হাইড্রক্সাইড শনাক্তকরণে ব্যবহৃত হয়।',
    safetyBn: 'NaOH ক্ষয়কারী — সরাসরি স্পর্শ এড়িয়ে চলুন।' },

  { id: 'disp-fe-cuso4', reactants: [{ id: 'Fe', part: 1 }, { id: 'CuSO4', part: 1 }], category: 'displacement',
    equation: 'Fe + CuSO₄ → FeSO₄ + Cu', nameBn: 'লোহা কর্তৃক তামার প্রতিস্থাপন',
    effects: { colorChange: 'blue-to-pale-green', gas: false, precipitate: { color: '#b5651d', name: 'তামার লালচে-বাদামি প্রলেপ (ধাতব, পাত্রে জমা হয়)' }, temp: 'none', smell: null, coating: true },
    observationBn: 'লোহার পেরেকের গায়ে লালচে-বাদামি তামার প্রলেপ পড়ে এবং নীল CuSO₄ দ্রবণ ধীরে ধীরে ফ্যাকাশে সবুজ (FeSO₄) হয়ে যায় — লোহা তামার চেয়ে বেশি সক্রিয়।',
    useBn: 'ধাতুর সক্রিয়তা সিরিজ যাচাইয়ের ক্লাসিক পরীক্ষা।',
    safetyBn: 'বিশেষ কোনো ঝুঁকি নেই।' },
  { id: 'disp-zn-cuso4', reactants: [{ id: 'Zn', part: 1 }, { id: 'CuSO4', part: 1 }], category: 'displacement',
    equation: 'Zn + CuSO₄ → ZnSO₄ + Cu', nameBn: 'জিংক কর্তৃক তামার প্রতিস্থাপন',
    effects: { colorChange: 'blue-to-colorless', gas: false, precipitate: { color: '#b5651d', name: 'তামার লালচে-বাদামি প্রলেপ' }, temp: 'rises slightly', smell: null, coating: true },
    observationBn: 'দস্তার টুকরায় লালচে-বাদামি তামা জমা হয় এবং নীল রঙ সম্পূর্ণ ফিকে হয়ে বর্ণহীন ZnSO₄ দ্রবণে পরিণত হয়।',
    useBn: 'জিংক তামার চেয়ে বেশি সক্রিয় — সক্রিয়তা সিরিজে এই অবস্থান প্রমাণ করে।',
    safetyBn: 'বিশেষ কোনো ঝুঁকি নেই।' },
  { id: 'disp-al-cuso4', reactants: [{ id: 'Al', part: 2 }, { id: 'CuSO4', part: 3 }], category: 'displacement',
    equation: '2Al + 3CuSO₄ → Al₂(SO₄)₃ + 3Cu', nameBn: 'অ্যালুমিনিয়াম কর্তৃক তামার প্রতিস্থাপন',
    effects: { colorChange: 'blue-to-colorless', gas: false, precipitate: { color: '#b5651d', name: 'তামার প্রলেপ' }, temp: 'rises', smell: null, coating: true },
    observationBn: 'অ্যালুমিনিয়ামের গায়ে তামার প্রলেপ পড়ে ও নীল রঙ ফিকে হয়ে যায়।',
    useBn: 'হালকা ধাতুর উচ্চ সক্রিয়তা প্রদর্শনের পরীক্ষা।',
    safetyBn: 'বিশেষ কোনো ঝুঁকি নেই।' },
  { id: 'disp-cu-agno3', reactants: [{ id: 'Cu', part: 1 }, { id: 'AgNO3', part: 2 }], category: 'displacement',
    equation: 'Cu + 2AgNO₃ → Cu(NO₃)₂ + 2Ag', nameBn: 'রূপার গাছ পরীক্ষা (Silver Tree)',
    effects: { colorChange: 'to-blue', gas: false, precipitate: { color: '#d9d9d9', name: 'রূপালী স্ফটিক (Ag), গাছের ডালের মতো আকৃতিতে জমা হয়' }, temp: 'none', smell: null, coating: true },
    observationBn: 'তামার তারের গায়ে চকচকে রূপালী স্ফটিক গাছের ডালের মতো আকারে জমতে থাকে এবং দ্রবণ ধীরে ধীরে নীল (Cu(NO₃)₂) বর্ণ ধারণ করে।',
    useBn: 'একটি জনপ্রিয় দৃশ্যমান প্রদর্শনী পরীক্ষা — একে "Silver Tree" পরীক্ষা বলা হয়।',
    safetyBn: 'AgNO₃ দাগ ফেলতে পারে — সাবধানে পরিচালনা করুন।' },

  { id: 'no-nacl-na2so4', reactants: [{ id: 'NaCl', part: 1 }, { id: 'Na2SO4', part: 1 }], category: 'no-reaction',
    equation: 'কোনো বিক্রিয়া নেই', nameBn: 'দুটি নিরপেক্ষ লবণের মিশ্রণ',
    effects: { colorChange: false, gas: false, precipitate: null, temp: 'none', smell: null },
    observationBn: 'উভয়ই দ্রবণীয় নিরপেক্ষ লবণ হওয়ায় কোনো দৃশ্যমান পরিবর্তন ঘটে না — শুধু দুই দ্রবণ মিশে যায়।',
    useBn: '—', safetyBn: 'বিশেষ কোনো ঝুঁকি নেই।' },
];

export interface PresetItem { labelBn: string; slots: (string | null)[]; }
export interface PresetGroup { level: string; titleBn: string; items: PresetItem[]; }

export const PRESET_GROUPS: PresetGroup[] = [
  { level: 'বেসিক', titleBn: 'এসিড-ক্ষার শনাক্তকরণ (নির্দেশক পরীক্ষা)', items: [
    { labelBn: '🔴 HCl + লাল লিটমাস', slots: ['HCl', null, 'LitmusRed'] },
    { labelBn: '🔵 NaOH + ফেনলফথ্যালিন', slots: ['NaOH', null, 'Phenolphthalein'] },
    { labelBn: '🌈 CH₃COOH + ইউনিভার্সাল ইন্ডিকেটর', slots: ['CH3COOH', null, 'UniversalIndicator'] },
  ]},
  { level: 'বেসিক', titleBn: 'নিরপেক্ষীকরণ বিক্রিয়া (Neutralization)', items: [
    { labelBn: '🧪 HCl + NaOH (+ ফেনলফথ্যালিন)', slots: ['HCl', 'NaOH', 'Phenolphthalein'] },
    { labelBn: '🧪 H₂SO₄ + NaOH', slots: ['H2SO4', 'NaOH', null] },
    { labelBn: '🧪 HCl + চুনের পানি', slots: ['HCl', 'CaOH2', null] },
  ]},
  { level: 'মধ্যম', titleBn: 'ধাতু + এসিড (গ্যাস ও সক্রিয়তা)', items: [
    { labelBn: '💨 Zn + HCl (Pop Test)', slots: ['Zn', 'HCl', null] },
    { labelBn: '🔥 Mg + HCl (তীব্র বিক্রিয়া)', slots: ['Mg', 'HCl', null] },
    { labelBn: '🐢 Fe + HCl (ধীর বিক্রিয়া)', slots: ['Fe', 'HCl', null] },
    { labelBn: '⚙️ Al + HCl', slots: ['Al', 'HCl', null] },
    { labelBn: '🚫 Cu + HCl (বিক্রিয়া হয় না)', slots: ['Cu', 'HCl', null] },
  ]},
  { level: 'মধ্যম', titleBn: 'গ্যাস উৎপাদন পরীক্ষা (CO₂ / NH₃)', items: [
    { labelBn: '🫧 Na₂CO₃ + HCl (CO₂)', slots: ['Na2CO3', 'HCl', null] },
    { labelBn: '🍶 Na₂CO₃ + ভিনেগার (দুর্বল এসিড)', slots: ['Na2CO3', 'CH3COOH', null] },
    { labelBn: '👃 NH₄Cl + চুনের পানি (NH₃)', slots: ['NH4Cl', 'CaOH2', null] },
  ]},
  { level: 'উচ্চতর', titleBn: 'অধঃক্ষেপণ বিক্রিয়া (আয়ন শনাক্তকরণ)', items: [
    { labelBn: '⚪ AgNO₃ + NaCl (ক্লোরাইড শনাক্ত)', slots: ['AgNO3', 'NaCl', null] },
    { labelBn: '⚪ BaCl₂ + Na₂SO₄ (সালফেট শনাক্ত)', slots: ['BaCl2', 'Na2SO4', null] },
    { labelBn: '🌟 Pb(NO₃)₂ + KI (সোনালী বৃষ্টি)', slots: ['PbNO3', 'KI', null] },
    { labelBn: '🔵 CuSO₄ + NaOH', slots: ['CuSO4', 'NaOH', null] },
  ]},
  { level: 'উচ্চতর', titleBn: 'ধাতুর প্রতিস্থাপন ও সক্রিয়তা সিরিজ', items: [
    { labelBn: '🥇 Fe + CuSO₄', slots: ['Fe', 'CuSO4', null] },
    { labelBn: '🥈 Zn + CuSO₄', slots: ['Zn', 'CuSO4', null] },
    { labelBn: '🥉 Al + CuSO₄', slots: ['Al', 'CuSO4', null] },
    { labelBn: '🌳 Cu + AgNO₃ (রূপার গাছ)', slots: ['Cu', 'AgNO3', null] },
  ]},
  { level: 'বিবিধ', titleBn: 'নিয়ন্ত্রণ পরীক্ষা (কোনো বিক্রিয়া নেই)', items: [
    { labelBn: '➖ NaCl + Na₂SO₄ (কোনো পরিবর্তন নেই)', slots: ['NaCl', 'Na2SO4', null] },
  ]},
];

export const INDICATOR_BEHAVIOR: Record<string, Record<string, { color: string; label: string }>> = {
  LitmusRed: { acid: { color: '#e05c5c', label: 'লাল-ই থাকে' }, base: { color: '#4b6fd1', label: 'নীল হয়ে যায়' }, neutral: { color: '#e05c5c', label: 'লাল-ই থাকে' } },
  LitmusBlue: { acid: { color: '#e05c5c', label: 'লাল হয়ে যায়' }, base: { color: '#4b6fd1', label: 'নীল-ই থাকে' }, neutral: { color: '#4b6fd1', label: 'নীল-ই থাকে' } },
  Phenolphthalein: { acid: { color: '#f5f2e9', label: 'বর্ণহীন থাকে' }, base: { color: '#e87fc4', label: 'গোলাপি হয়ে যায়' }, neutral: { color: '#f5f2e9', label: 'বর্ণহীন থাকে' } },
  UniversalIndicator: { acid: { color: '#e8622a', label: 'লাল-কমলা (pH < 7)' }, base: { color: '#3a4fd1', label: 'নীল-বেগুনি (pH > 7)' }, neutral: { color: '#4caf50', label: 'সবুজ (pH = 7)' } },
};
