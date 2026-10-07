// NCTB Class 9-10 Chemistry — reactions, explanations, kinetics and guided experiments.
// Every entry cites the textbook page it came from (page = printed book page, not PDF page).
import type { Reaction } from './chemistry-lab-data';
import type { Tool } from './chem-bench-engine';

export interface CurText { why: string[]; how: string[]; ionic: string; }
export interface CurKin { tau: number; lag?: number; dH: number; note: string; }

export interface ExpMaterial { chem: string; amount: number; unit: 'mL' | 'g' | 'drops'; tool?: Tool; note?: string; }
export interface BenchExperiment {
  id: string; chapter: number; topic: number; titleBn: string; page: number;
  reactionIds?: string[];
  materials: ExpMaterial[];
  heat?: boolean; filter?: boolean;
  demo?: boolean;               // observation-only (no reaction table entry)
  noReact?: boolean;            // skip the "react" step (e.g. boiling water)
  needTemp?: number;            // observe step unlocks when the vessel reaches this temperature (°C)
  vessel?: string;              // 't1' (default) or 'b1' (beaker)
  observeBn: string[];          // what the book says should be observed
  aimBn?: string;
  verified: boolean;            // false = could not be matched exactly to the book yet
}
export interface InfoCard {
  id: string; chapter: number; topic: number; titleBn: string; page: number;
  equation?: string; bodyBn: string[]; verified: boolean;
}

import { GEN_REACTIONS, GEN_KIN, GEN_EXPERIMENTS, GEN_CARDS, GEN_SECTIONS } from './chem-curriculum-9-10.generated';

export const CURRICULUM_REACTIONS: Reaction[] = GEN_REACTIONS;
export const CURRICULUM_KIN: Record<string, CurKin> = GEN_KIN;
export const EXPERIMENTS: BenchExperiment[] = GEN_EXPERIMENTS;
export const CARDS: InfoCard[] = GEN_CARDS;

// Hand-written explanations for the reactions whose category has no ready-made template.
export const CURRICULUM_TEXT: Record<string, CurText> = {
  'c1-1': { ionic: 'NH₄Cl(s) + aq → NH₄⁺(aq) + Cl⁻(aq)  (তাপ শোষিত)',
    why: ['কঠিন NH₄Cl-এর কেলাস ভাঙতে যে শক্তি লাগে তা পানির অণুর সাথে আয়ন যুক্ত হয়ে (আর্দ্রায়ন) যে শক্তি ছাড়ে তার চেয়ে বেশি।', 'ঘাটতি শক্তি পানি ও পাত্র থেকে আসে — তাই তাপমাত্রা কমে যায়; একে তাপহারী (এন্ডোথার্মিক) পরিবর্তন বলে।'],
    how: ['NH₄Cl-এর আয়নিক কেলাস পানিতে ঢুকলে NH₄⁺ ও Cl⁻ আলাদা হয়ে যায়।', 'আয়ন আলাদা করতে শক্তি লাগে — এটি পরিবেশ থেকে শোষিত হয়।', 'যত বেশি NH₄Cl দ্রবীভূত হয়, তাপমাত্রা তত কমে (বইয়ের টেবিল ১.০৩: ০ g-এ ২৫°C, ১৫ g-এ ১০°C)।'] },
  'c1-2': { ionic: 'CaO + H₂O → Ca(OH)₂ + তাপ',
    why: ['চুন (CaO) পানির সাথে মিলে ক্যালসিয়াম হাইড্রক্সাইড (Ca(OH)₂) তৈরি করে — একে চুন "নেভানো" বলে।', 'নতুন বন্ধন গঠনে ছাড়া শক্তি বেশি, তাই বিক্রিয়াটি তাপোৎপাদী (বইয়ে ΔH ≈ −৬৩.৯৫ kJ, পৃ. ১৭৩)।'],
    how: ['CaO-এর O²⁻ আয়ন পানির H⁺ নিয়ে OH⁻ গঠন করে।', 'Ca²⁺ ও দুটি OH⁻ মিলে Ca(OH)₂ হয় — সামান্য দ্রবীভূত হয়ে ক্ষারীয় দ্রবণ (চুনের পানি) দেয়।', 'প্রচুর তাপ ছাড়ে — পানি গরম হয়ে ফুটে ছিটকে পড়তে পারে, তাই অল্প CaO নিন।'] },
  'c6-3': { ionic: 'Al₂O₃ + 6H⁺ → 2Al³⁺ + 3H₂O',
    why: ['অ্যালুমিনিয়াম অক্সাইড একটি ধাতব অক্সাইড; এসিডের সাথে বিক্রিয়ায় লবণ ও পানি দেয়।', 'এটি গ্যাস ছাড়ে না — তাই বুদবুদ দেখা যাবে না।'],
    how: ['Al₂O₃-এর O²⁻ আয়ন এসিডের H⁺ গ্রহণ করে পানি (H₂O) গঠন করে।', 'Al³⁺ ও Cl⁻ দ্রবণে থেকে AlCl₃ লবণ দেয়।', 'সমীকরণে অনুপাত ১ : ৬ — ১ মোল Al₂O₃-এর জন্য ৬ মোল HCl লাগে।'] },
  'c9-12a': { ionic: 'CuO + 2H⁺ → Cu²⁺ + H₂O',
    why: ['কপার(II) অক্সাইড ক্ষারীয় অক্সাইড, তাই এসিডকে প্রশমিত করে লবণ ও পানি দেয়।', 'Cu²⁺ আয়নের কারণে দ্রবণ নীল হয়ে যায়।'],
    how: ['কালো CuO কঠিন কণা এসিডে ধীরে ধীরে দ্রবীভূত হয়।', 'O²⁻ + 2H⁺ → H₂O; Cu²⁺ দ্রবণে এসে নীল রং দেয়।', 'মৃদু গরম করলে বিক্রিয়া দ্রুত হয়।'] },
  'c9-24a': { ionic: 'NH₄⁺ + OH⁻ → NH₃↑ + H₂O',
    why: ['ক্ষার (OH⁻) অ্যামোনিয়াম আয়ন থেকে H⁺ কেড়ে নেয়, ফলে অ্যামোনিয়া (NH₃) গ্যাস তৈরি হয়।', 'এই গ্যাসের ঝাঁঝালো গন্ধ থেকেই অ্যামোনিয়াম লবণ শনাক্ত করা যায়।'],
    how: ['NH₄Cl দ্রবণে NH₄⁺ ও Cl⁻ আয়ন থাকে; NaOH থেকে OH⁻ আসে।', 'NH₄⁺ একটি H⁺ ছাড়ে যা OH⁻-এর সাথে মিলে H₂O হয়।', 'অবশিষ্ট NH₃ গ্যাস হিসেবে বেরিয়ে যায় (ভেজা লাল লিটমাস নীল করে)।'] },
  'c12-18a': { ionic: '2NH₄Cl + CaO → 2NH₃↑ + CaCl₂ + H₂O',
    why: ['ক্ষারীয় অক্সাইড CaO অ্যামোনিয়াম লবণ থেকে অ্যামোনিয়া গ্যাস মুক্ত করে — পরীক্ষাগারে NH₃ প্রস্তুতির পদ্ধতি।'],
    how: ['CaO পানি ও NH₄Cl-এর সাথে বিক্রিয়ায় O²⁻ দেয়, যা NH₄⁺ থেকে H⁺ নিয়ে পানি গঠন করে।', 'মুক্ত NH₃ গ্যাস ঝাঁঝালো গন্ধযুক্ত; মৃদু তাপে দ্রুত বের হয়।', 'গ্যাস বিষাক্ত — মুখ দূরে রেখে ফিউম হুডে কাজ করুন।'] },
  'c11-16': { ionic: 'CaC₂ + 2H₂O → C₂H₂↑ + Ca(OH)₂',
    why: ['ক্যালসিয়াম কার্বাইড পানির সাথে বিক্রিয়া করে ইথাইন (অ্যাসিটিলিন) গ্যাস ও চুনের পানি তৈরি করে।', 'ইথাইন অত্যন্ত দাহ্য — আগুনের কাছে বিপজ্জনক।'],
    how: ['CaC₂-এর C₂²⁻ আয়ন পানির H⁺ গ্রহণ করে C₂H₂ হয়।', 'অবশিষ্ট Ca²⁺ ও OH⁻ মিলে Ca(OH)₂ দেয়।', 'গ্যাসটি বুদবুদ আকারে বেরিয়ে আসে।'] },
};

/** The 12 chapters / 72 topics of the NCTB Class 9-10 Chemistry book (printed page = first page of the chapter). */
const CHAPTERS_BASE: { no: number; bn: string; page: number; topics: string[] }[] = [
  { no: 1, bn: 'রসায়নের ধারণা', page: 1, topics: ['রসায়ন পরিচিতি', 'রসায়নের পরিধি', 'অন্যান্য বিজ্ঞানের সাথে সম্পর্ক', 'রসায়ন পাঠের গুরুত্ব', 'বৈজ্ঞানিক পদ্ধতি ও গবেষণা', 'পরীক্ষাগার নিরাপত্তা ও বিপদ চিহ্ন'] },
  { no: 2, bn: 'পদার্থের অবস্থা', page: 17, topics: ['কণার গতিতত্ত্ব', 'পদার্থের তিন অবস্থা', 'অবস্থার পরিবর্তন', 'গলনাঙ্ক ও স্ফুটনাঙ্ক', 'ঊর্ধ্বপাতন', 'ব্যাপন ও নিঃসরণ'] },
  { no: 3, bn: 'পদার্থের গঠন', page: 35, topics: ['মৌল, যৌগ ও মিশ্রণ', 'পরমাণুর গঠন', 'পারমাণবিক সংখ্যা ও ভরসংখ্যা', 'আইসোটোপ', 'ইলেকট্রন বিন্যাস', 'তেজস্ক্রিয়তা ও আইসোটোপের ব্যবহার'] },
  { no: 4, bn: 'পর্যায় সারণি', page: 59, topics: ['পর্যায় সারণির ইতিহাস', 'আধুনিক পর্যায় সূত্র', 'গ্রুপ ও পর্যায়', 'পর্যায়বৃত্ত ধর্ম', 'ধাতু, অধাতু ও অপধাতু', 'অবস্থান ও ইলেকট্রন বিন্যাস'] },
  { no: 5, bn: 'রাসায়নিক বন্ধন', page: 82, topics: ['নিষ্ক্রিয় গ্যাস ও স্থিতিশীলতা', 'যোজনী ও আয়ন গঠন', 'আয়নিক বন্ধন', 'সমযোজী বন্ধন', 'ধাতব বন্ধন', 'আয়নিক ও সমযোজী যৌগের ধর্ম'] },
  { no: 6, bn: 'মোলের ধারণা ও রাসায়নিক গণনা', page: 109, topics: ['মোল ধারণা', 'অ্যাভোগাড্রো সংখ্যা', 'মোলার ভর', 'শতকরা সংযুতি', 'স্থূল ও আণবিক সংকেত', 'মোলার আয়তন ও গাণিতিক হিসাব'] },
  { no: 7, bn: 'রাসায়নিক বিক্রিয়া', page: 142, topics: ['রাসায়নিক বিক্রিয়ার লক্ষণ', 'সমীকরণ ও সমতাকরণ', 'বিক্রিয়ার প্রকারভেদ', 'জারণ-বিজারণ', 'তাপোৎপাদী ও তাপহারী বিক্রিয়া', 'বিক্রিয়ার হার ও প্রভাবক'] },
  { no: 8, bn: 'রসায়ন ও শক্তি', page: 168, topics: ['রাসায়নিক শক্তির উৎস', 'তাপোৎপাদী ও তাপহারী পরিবর্তন', 'বন্ধন শক্তি', 'রাসায়নিক থেকে বৈদ্যুতিক শক্তি', 'তড়িৎ বিশ্লেষণ', 'কোষ, ব্যাটারি ও জ্বালানি'] },
  { no: 9, bn: 'এসিড-ক্ষারক সমতা', page: 206, topics: ['এসিড ও ক্ষারক', 'pH স্কেল', 'নির্দেশক', 'প্রশমন বিক্রিয়া', 'লবণ', 'দৈনন্দিন জীবনে এসিড-ক্ষার'] },
  { no: 10, bn: 'খনিজ সম্পদ: ধাতু-অধাতু', page: 233, topics: ['খনিজ ও আকরিক', 'সক্রিয়তা সিরিজ', 'ধাতু নিষ্কাশন', 'ধাতু ও অধাতুর ধর্ম', 'সংকর ধাতু', 'ক্ষয় ও প্রতিরোধ'] },
  { no: 11, bn: 'খনিজ সম্পদ: জীবাশ্ম', page: 261, topics: ['জীবাশ্ম জ্বালানি', 'কয়লা', 'খনিজ তেল ও পরিশোধন', 'প্রাকৃতিক গ্যাস', 'হাইড্রোকার্বন', 'পলিমার'] },
  { no: 12, bn: 'আমাদের জীবনে রসায়ন', page: 287, topics: ['সার', 'সাবান ও ডিটারজেন্ট', 'কাচ, সিমেন্ট ও সিরামিক', 'খাদ্য সংরক্ষণ', 'ওষুধ ও প্রসাধনী', 'রসায়ন ও পরিবেশ'] },
];

/** Real section headings from the book (printed start page); falls back to the generic topic list if a chapter has none. */
export interface ChapterInfo { no: number; bn: string; page: number; topics: string[]; sections: { no: string; titleBn: string; page: number }[]; }
export const CHAPTERS: ChapterInfo[] = CHAPTERS_BASE.map(c => {
  const sec: { no: string; titleBn: string; page: number }[] = (GEN_SECTIONS as any)[c.no] || [];
  return { ...c, sections: sec, topics: sec.length ? sec.map(x => `${x.no} ${x.titleBn}`) : c.topics };
});
