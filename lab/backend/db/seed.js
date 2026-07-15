/* BdVirtualLab representative seed data.
   One full learn -> simulate -> exam path per subject (Chemistry/Physics/Biology/ICT)
   so every functional requirement can be exercised end-to-end. Run: npm run db:seed */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('../config/database');

async function upsertSubject(code, nameBn, nameEn) {
  const existing = await pool.query('SELECT id FROM subjects WHERE code = $1', [code]);
  if (existing.rows.length) return existing.rows[0].id;
  const r = await pool.query('INSERT INTO subjects (code, name_bn, name_en) VALUES ($1,$2,$3) RETURNING id', [code, nameBn, nameEn]);
  return r.rows[0].id;
}

async function upsertChapter(subjectId, classLevel, titleBn, titleEn, orderIndex) {
  const existing = await pool.query('SELECT id FROM chapters WHERE subject_id=$1 AND title_en=$2', [subjectId, titleEn]);
  if (existing.rows.length) return existing.rows[0].id;
  const r = await pool.query(
    `INSERT INTO chapters (subject_id, class_level, title_bn, title_en, order_index, status) VALUES ($1,$2,$3,$4,$5,'published') RETURNING id`,
    [subjectId, classLevel, titleBn, titleEn, orderIndex]
  );
  return r.rows[0].id;
}

async function addContent(chapterId, contentType, titleBn, titleEn, bodyBn, bodyEn, orderIndex) {
  await pool.query(
    `INSERT INTO learning_content (chapter_id, content_type, title_bn, title_en, body_bn, body_en, order_index, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,'published')`,
    [chapterId, contentType, titleBn, titleEn, bodyBn, bodyEn, orderIndex]
  );
}

async function upsertSimulation(chapterId, key, titleBn, titleEn, config) {
  const existing = await pool.query('SELECT id FROM simulations WHERE key = $1', [key]);
  if (existing.rows.length) return existing.rows[0].id;
  const r = await pool.query(
    `INSERT INTO simulations (chapter_id, key, title_bn, title_en, config, status) VALUES ($1,$2,$3,$4,$5,'published') RETURNING id`,
    [chapterId, key, titleBn, titleEn, JSON.stringify(config || {})]
  );
  return r.rows[0].id;
}

async function addQuestion(chapterId, q) {
  await pool.query(
    `INSERT INTO questions (chapter_id, question_bn, question_en, options, correct_answers, question_type, explanation_bn, explanation_en, difficulty, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'published')`,
    [chapterId, q.bn, q.en, JSON.stringify(q.options), JSON.stringify(q.correct), q.type || 'single', q.explBn, q.explEn, q.difficulty || 'medium']
  );
}

async function upsertUser(username, fullName, role, classLevel, medium, passwordHash) {
  const existing = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
  if (existing.rows.length) return existing.rows[0].id;
  const r = await pool.query(
    `INSERT INTO users (username, password, role, full_name, medium, class_level, leaderboard_opt_in)
     VALUES ($1,$2,$3,$4,$5,$6,true) RETURNING id`,
    [username, passwordHash, role, fullName, medium, classLevel]
  );
  return r.rows[0].id;
}

async function upsertBadge(key, titleBn, titleEn, icon, criteria) {
  const existing = await pool.query('SELECT id FROM badges WHERE key = $1', [key]);
  if (existing.rows.length) return;
  await pool.query('INSERT INTO badges (key, title_bn, title_en, icon, criteria) VALUES ($1,$2,$3,$4,$5)', [key, titleBn, titleEn, icon, criteria]);
}

async function main() {
  // ---------- Subjects ----------
  const chemId = await upsertSubject('CHE', 'রসায়ন', 'Chemistry');
  const phyId = await upsertSubject('PHY', 'পদার্থবিজ্ঞান', 'Physics');
  const bioId = await upsertSubject('BIO', 'জীববিজ্ঞান', 'Biology');
  const ictId = await upsertSubject('ICT', 'তথ্য ও যোগাযোগ প্রযুক্তি', 'ICT');

  // ---------- Chemistry: Acids, Bases & Salts (Class 9-10) ----------
  const chemChapter = await upsertChapter(chemId, 9, 'এসিড, ক্ষার ও লবণ', 'Acids, Bases and Salts', 1);
  await addContent(chemChapter, 'notes', 'এসিড, ক্ষার ও লবণের ধর্ম', 'Properties of Acids, Bases and Salts',
    'এসিড টক স্বাদযুক্ত এবং নীল লিটমাসকে লাল করে; উদাহরণ: HCl, H₂SO₄, CH₃COOH। ক্ষার তেতো ও পিচ্ছিল, লাল লিটমাসকে নীল করে; উদাহরণ: NaOH, Ca(OH)₂। এসিড ও ক্ষার বিক্রিয়া করে লবণ ও পানি উৎপন্ন করে — একে নিরপেক্ষীকরণ বিক্রিয়া বলে। ধাতুর সাথে এসিডের বিক্রিয়ায় সাধারণত হাইড্রোজেন গ্যাস উৎপন্ন হয়, আর কার্বনেটের সাথে বিক্রিয়ায় কার্বন-ডাই-অক্সাইড গ্যাস উৎপন্ন হয়।',
    'Acids taste sour and turn blue litmus red; examples: HCl, H2SO4, CH3COOH. Bases taste bitter and feel soapy, turning red litmus blue; examples: NaOH, Ca(OH)2. An acid and a base react to form a salt and water — this is called a neutralization reaction. Metals reacting with acids usually release hydrogen gas, while carbonates reacting with acids release carbon dioxide gas.',
    1);
  await addContent(chemChapter, 'formula', 'গুরুত্বপূর্ণ সমীকরণ', 'Key Equations',
    'নিরপেক্ষীকরণ: এসিড + ক্ষার → লবণ + পানি\nধাতু + এসিড: ধাতু + এসিড → লবণ + H₂↑\nকার্বনেট + এসিড: কার্বনেট + এসিড → লবণ + পানি + CO₂↑',
    'Neutralization: Acid + Base -> Salt + Water\nMetal + Acid: Metal + Acid -> Salt + H2 (gas)\nCarbonate + Acid: Carbonate + Acid -> Salt + Water + CO2 (gas)',
    2);
  await upsertSimulation(chemChapter, 'chem-mixing', 'রাসায়নিক পদার্থ মিশ্রণ পরীক্ষাগার', 'Chemical Mixing Lab', { ported: true, difficulty: 'basic-to-advanced' });

  const chemQuestions = [
    { bn: 'নিচের কোনটি এসিডের ধর্ম নয়?', en: 'Which of the following is NOT a property of an acid?',
      options: [{ id: 'a', bn: 'টক স্বাদ', en: 'Sour taste' }, { id: 'b', bn: 'নীল লিটমাসকে লাল করে', en: 'Turns blue litmus red' }, { id: 'c', bn: 'পিচ্ছিল অনুভূতি', en: 'Slippery/soapy feel' }, { id: 'd', bn: 'ধাতুর সাথে বিক্রিয়ায় H₂ গ্যাস উৎপন্ন করে', en: 'Produces H2 gas with metals' }],
      correct: ['c'], explBn: 'পিচ্ছিল অনুভূতি ক্ষারের বৈশিষ্ট্য, এসিডের নয়।', explEn: 'A slippery/soapy feel is a property of bases, not acids.' },
    { bn: 'Zn + 2HCl → ZnCl₂ + H₂↑ বিক্রিয়ায় কোন গ্যাস উৎপন্ন হয়?', en: 'In the reaction Zn + 2HCl -> ZnCl2 + H2, which gas is produced?',
      options: [{ id: 'a', bn: 'অক্সিজেন', en: 'Oxygen' }, { id: 'b', bn: 'হাইড্রোজেন', en: 'Hydrogen' }, { id: 'c', bn: 'কার্বন-ডাই-অক্সাইড', en: 'Carbon dioxide' }, { id: 'd', bn: 'নাইট্রোজেন', en: 'Nitrogen' }],
      correct: ['b'], explBn: 'দস্তা ও হাইড্রোক্লোরিক এসিডের বিক্রিয়ায় হাইড্রোজেন গ্যাস নির্গত হয়, যা জ্বলন্ত কাঠি দিয়ে "পপ" শব্দে শনাক্ত করা যায়।', explEn: 'Zinc and hydrochloric acid react to release hydrogen gas, detectable by a "pop" sound with a burning splint.' },
    { bn: 'সক্রিয়তা সিরিজে হাইড্রোজেনের নিচে থাকা ধাতু নিচের কোনটি?', en: 'Which of the following metals lies below hydrogen in the reactivity series?',
      options: [{ id: 'a', bn: 'দস্তা (Zn)', en: 'Zinc (Zn)' }, { id: 'b', bn: 'ম্যাগনেসিয়াম (Mg)', en: 'Magnesium (Mg)' }, { id: 'c', bn: 'তামা (Cu)', en: 'Copper (Cu)' }, { id: 'd', bn: 'লোহা (Fe)', en: 'Iron (Fe)' }],
      correct: ['c'], explBn: 'তামা হাইড্রোজেনের চেয়ে কম সক্রিয়, তাই এটি লঘু এসিডের সাথে বিক্রিয়া করে না।', explEn: 'Copper is less reactive than hydrogen, so it does not react with dilute acids.' },
    { bn: 'Na₂CO₃ + 2HCl বিক্রিয়ায় কোন গ্যাস নির্গত হয়?', en: 'Which gas is released in the reaction Na2CO3 + 2HCl?',
      options: [{ id: 'a', bn: 'CO₂', en: 'CO2' }, { id: 'b', bn: 'H₂', en: 'H2' }, { id: 'c', bn: 'NH₃', en: 'NH3' }, { id: 'd', bn: 'Cl₂', en: 'Cl2' }],
      correct: ['a'], explBn: 'কার্বনেটের সাথে এসিডের বিক্রিয়ায় সবসময় CO₂ গ্যাস উৎপন্ন হয়, যা চুনের পানিকে ঘোলা করে।', explEn: 'Carbonates always release CO2 gas with acids, which turns limewater milky.' },
    { bn: 'AgNO₃ ও NaCl দ্রবণ মেশালে কী ধরনের অধঃক্ষেপ পড়ে?', en: 'What kind of precipitate forms when AgNO3 and NaCl solutions are mixed?',
      options: [{ id: 'a', bn: 'হলুদ', en: 'Yellow' }, { id: 'b', bn: 'সাদা দইয়ের মতো', en: 'White, curdy' }, { id: 'c', bn: 'নীল জেলটিনাস', en: 'Blue gelatinous' }, { id: 'd', bn: 'কোনো অধঃক্ষেপ পড়ে না', en: 'No precipitate' }],
      correct: ['b'], explBn: 'AgCl সাদা দইয়ের মতো অধঃক্ষেপ হিসেবে তৎক্ষণাৎ পড়ে — ক্লোরাইড আয়ন শনাক্তকরণের পরীক্ষা।', explEn: 'AgCl forms an instant white curdy precipitate — a standard test for chloride ions.' },
    { bn: 'Pb(NO₃)₂ + 2KI বিক্রিয়ায় "সোনালী বৃষ্টি" পরীক্ষায় কোন রঙের অধঃক্ষেপ পড়ে?', en: 'In the "golden rain" reaction Pb(NO3)2 + 2KI, what color precipitate forms?',
      options: [{ id: 'a', bn: 'সাদা', en: 'White' }, { id: 'b', bn: 'হলুদ', en: 'Yellow' }, { id: 'c', bn: 'কালো', en: 'Black' }, { id: 'd', bn: 'সবুজ', en: 'Green' }],
      correct: ['b'], explBn: 'PbI₂ উজ্জ্বল হলুদ অধঃক্ষেপ তৈরি করে যা গরম করে ঠান্ডা করলে চকচকে কেলাসের মতো ঝরে পড়ে।', explEn: 'PbI2 forms a bright yellow precipitate that recrystallizes spectacularly on cooling after heating.' },
    { bn: 'Fe + CuSO₄ বিক্রিয়ায় কোন ধাতু অধিক সক্রিয়?', en: 'In the reaction Fe + CuSO4, which metal is more reactive?',
      options: [{ id: 'a', bn: 'লোহা (Fe)', en: 'Iron (Fe)' }, { id: 'b', bn: 'তামা (Cu)', en: 'Copper (Cu)' }, { id: 'c', bn: 'উভয়ই সমান', en: 'Both are equal' }, { id: 'd', bn: 'নির্ধারণ করা যায় না', en: 'Cannot be determined' }],
      correct: ['a'], explBn: 'লোহা তামাকে প্রতিস্থাপন করে বলে দ্রবণে জমা হয় — প্রমাণ করে Fe বেশি সক্রিয়।', explEn: 'Iron displaces copper from the solution, proving iron is more reactive.' },
    { bn: 'কোন নির্দেশক ক্ষারীয় দ্রবণে গোলাপি রঙ ধারণ করে?', en: 'Which indicator turns pink in a basic solution?',
      options: [{ id: 'a', bn: 'লাল লিটমাস', en: 'Red litmus' }, { id: 'b', bn: 'ফেনলফথ্যালিন', en: 'Phenolphthalein' }, { id: 'c', bn: 'নীল লিটমাস', en: 'Blue litmus' }, { id: 'd', bn: 'ইউনিভার্সাল ইন্ডিকেটর', en: 'Universal indicator' }],
      correct: ['b'], explBn: 'ফেনলফথ্যালিন এসিডে বর্ণহীন থাকে, কিন্তু ক্ষারে গোলাপি রঙ ধারণ করে।', explEn: 'Phenolphthalein is colorless in acid but turns pink in base.' },
    { bn: 'HCl + NaOH → NaCl + H₂O বিক্রিয়াটি কোন ধরনের বিক্রিয়া?', en: 'The reaction HCl + NaOH -> NaCl + H2O is what type of reaction?',
      options: [{ id: 'a', bn: 'নিরপেক্ষীকরণ', en: 'Neutralization' }, { id: 'b', bn: 'প্রতিস্থাপন', en: 'Displacement' }, { id: 'c', bn: 'পচন', en: 'Decomposition' }, { id: 'd', bn: 'জারণ', en: 'Oxidation' }],
      correct: ['a'], explBn: 'এসিড ও ক্ষারের বিক্রিয়ায় লবণ ও পানি উৎপন্ন হওয়াকে নিরপেক্ষীকরণ বলে।', explEn: 'The reaction of an acid and a base producing salt and water is called neutralization.' },
    { bn: 'কোন ধাতুটি লঘু HCl-এর সাথে সবচেয়ে তীব্রভাবে বিক্রিয়া করে?', en: 'Which metal reacts most vigorously with dilute HCl?',
      options: [{ id: 'a', bn: 'তামা (Cu)', en: 'Copper (Cu)' }, { id: 'b', bn: 'ম্যাগনেসিয়াম (Mg)', en: 'Magnesium (Mg)' }, { id: 'c', bn: 'লোহা (Fe)', en: 'Iron (Fe)' }, { id: 'd', bn: 'রূপা (Ag)', en: 'Silver (Ag)' }],
      correct: ['b'], explBn: 'সক্রিয়তা সিরিজে ম্যাগনেসিয়াম দস্তা ও লোহার চেয়ে বেশি সক্রিয়, তাই সবচেয়ে তীব্রভাবে বিক্রিয়া করে।', explEn: 'Magnesium is more reactive than zinc and iron in the reactivity series, so it reacts most vigorously.' },
    { bn: 'BaCl₂ + Na₂SO₄ বিক্রিয়ায় সাদা অধঃক্ষেপ কীসের প্রমাণ দেয়?', en: 'The white precipitate in BaCl2 + Na2SO4 confirms the presence of which ion?',
      options: [{ id: 'a', bn: 'ক্লোরাইড আয়ন', en: 'Chloride ion' }, { id: 'b', bn: 'সালফেট আয়ন', en: 'Sulphate ion' }, { id: 'c', bn: 'কার্বনেট আয়ন', en: 'Carbonate ion' }, { id: 'd', bn: 'নাইট্রেট আয়ন', en: 'Nitrate ion' }],
      correct: ['b'], explBn: 'BaSO₄ সাদা অধঃক্ষেপ সালফেট আয়ন শনাক্তকরণের প্রমিত পরীক্ষা।', explEn: 'A white BaSO4 precipitate is the standard confirmatory test for sulphate ions.' },
    { bn: 'তামার তার AgNO₃ দ্রবণে রাখলে কী ঘটে?', en: 'What happens when a copper wire is placed in AgNO3 solution?',
      options: [{ id: 'a', bn: 'কোনো পরিবর্তন হয় না', en: 'No change occurs' }, { id: 'b', bn: 'রূপার স্ফটিক জমা হয় ও দ্রবণ নীল হয়', en: 'Silver crystals deposit and the solution turns blue' }, { id: 'c', bn: 'তারটি গলে যায়', en: 'The wire melts' }, { id: 'd', bn: 'গ্যাস নির্গত হয়', en: 'Gas is released' }],
      correct: ['b'], explBn: 'তামা রূপাকে প্রতিস্থাপন করে ("Silver Tree" পরীক্ষা) — তামা রূপার চেয়ে বেশি সক্রিয়।', explEn: 'Copper displaces silver (the "Silver Tree" test) — copper is more reactive than silver.' },
    { bn: 'ভিনেগার (CH₃COOH) কী ধরনের এসিড?', en: 'What type of acid is vinegar (CH3COOH)?',
      options: [{ id: 'a', bn: 'তীব্র এসিড', en: 'Strong acid' }, { id: 'b', bn: 'দুর্বল এসিড', en: 'Weak acid' }, { id: 'c', bn: 'ক্ষার', en: 'A base' }, { id: 'd', bn: 'নিরপেক্ষ', en: 'Neutral' }],
      correct: ['b'], explBn: 'এসিটিক এসিড একটি দুর্বল এসিড, তাই বিক্রিয়া তুলনামূলক ধীরে ঘটে।', explEn: 'Acetic acid is a weak acid, so its reactions proceed comparatively slowly.' },
    { bn: 'NH₄Cl + Ca(OH)₂ বিক্রিয়ায় কোন গ্যাস উৎপন্ন হয়?', en: 'Which gas is produced in the reaction NH4Cl + Ca(OH)2?',
      options: [{ id: 'a', bn: 'অ্যামোনিয়া (NH₃)', en: 'Ammonia (NH3)' }, { id: 'b', bn: 'হাইড্রোজেন', en: 'Hydrogen' }, { id: 'c', bn: 'কার্বন-ডাই-অক্সাইড', en: 'Carbon dioxide' }, { id: 'd', bn: 'অক্সিজেন', en: 'Oxygen' }],
      correct: ['a'], explBn: 'এই বিক্রিয়া পরীক্ষাগারে অ্যামোনিয়া গ্যাস প্রস্তুতির প্রচলিত পদ্ধতি — ঝাঁঝালো গন্ধযুক্ত গ্যাস।', explEn: 'This is a standard lab preparation of ammonia gas, identifiable by its pungent smell.' },
    { bn: 'লাল লিটমাস কাগজ ক্ষারীয় দ্রবণে কী রঙ ধারণ করে?', en: 'What color does red litmus paper turn in a basic solution?',
      options: [{ id: 'a', bn: 'লাল-ই থাকে', en: 'Stays red' }, { id: 'b', bn: 'নীল হয়ে যায়', en: 'Turns blue' }, { id: 'c', bn: 'সবুজ হয়ে যায়', en: 'Turns green' }, { id: 'd', bn: 'বর্ণহীন হয়ে যায়', en: 'Becomes colorless' }],
      correct: ['b'], explBn: 'লাল লিটমাস ক্ষারীয় দ্রবণে নীল রঙ ধারণ করে — এটি ক্ষার শনাক্তকরণের সহজ পরীক্ষা।', explEn: 'Red litmus turns blue in a basic solution — a simple test for identifying bases.' },
    { bn: 'CuSO₄ + 2NaOH বিক্রিয়ায় কোন রঙের অধঃক্ষেপ পড়ে?', en: 'What color precipitate forms in the reaction CuSO4 + 2NaOH?',
      options: [{ id: 'a', bn: 'হালকা নীল জেলটিনাস', en: 'Light blue, gelatinous' }, { id: 'b', bn: 'সাদা', en: 'White' }, { id: 'c', bn: 'হলুদ', en: 'Yellow' }, { id: 'd', bn: 'কালো', en: 'Black' }],
      correct: ['a'], explBn: 'Cu(OH)₂ হালকা নীল রঙের জেলির মতো অধঃক্ষেপ হিসেবে তৈরি হয়।', explEn: 'Cu(OH)2 forms as a light blue, jelly-like precipitate.' },
    { bn: 'সক্রিয়তা সিরিজে সবচেয়ে বেশি সক্রিয় ধাতু কোনটি (নিচের অপশনগুলোর মধ্যে)?', en: 'Which is the most reactive metal among the following (in the reactivity series)?',
      options: [{ id: 'a', bn: 'তামা (Cu)', en: 'Copper (Cu)' }, { id: 'b', bn: 'রূপা (Ag)', en: 'Silver (Ag)' }, { id: 'c', bn: 'ম্যাগনেসিয়াম (Mg)', en: 'Magnesium (Mg)' }, { id: 'd', bn: 'সোনা (Au)', en: 'Gold (Au)' }],
      correct: ['c'], explBn: 'ম্যাগনেসিয়াম তালিকার অন্য ধাতুগুলোর চেয়ে সক্রিয়তা সিরিজে অনেক উপরে অবস্থিত।', explEn: 'Magnesium sits much higher in the reactivity series than the other listed metals.' },
    { bn: 'সাধারণ লবণ (NaCl) কীভাবে উৎপন্ন হয়?', en: 'How is common salt (NaCl) typically produced?',
      options: [{ id: 'a', bn: 'HCl + NaOH বিক্রিয়ায়', en: 'From the reaction HCl + NaOH' }, { id: 'b', bn: 'H₂ ও O₂ বিক্রিয়ায়', en: 'From the reaction of H2 and O2' }, { id: 'c', bn: 'শুধু পানি বাষ্পীভবনে', en: 'By evaporating water alone' }, { id: 'd', bn: 'সূর্যালোক থেকে', en: 'Directly from sunlight' }],
      correct: ['a'], explBn: 'হাইড্রোক্লোরিক এসিড ও সোডিয়াম হাইড্রক্সাইডের নিরপেক্ষীকরণে সোডিয়াম ক্লোরাইড ও পানি উৎপন্ন হয়।', explEn: 'Neutralizing hydrochloric acid with sodium hydroxide produces sodium chloride and water.' },
    { bn: 'দুইটি নিরপেক্ষ লবণ (যেমন NaCl ও Na₂SO₄) মেশালে কী ঘটে?', en: 'What happens when two neutral salts (e.g. NaCl and Na2SO4) are mixed?',
      options: [{ id: 'a', bn: 'গ্যাস নির্গত হয়', en: 'Gas is released' }, { id: 'b', bn: 'অধঃক্ষেপ পড়ে', en: 'A precipitate forms' }, { id: 'c', bn: 'দৃশ্যমান কোনো বিক্রিয়া ঘটে না', en: 'No visible reaction occurs' }, { id: 'd', bn: 'রঙ পরিবর্তন হয়', en: 'The color changes' }],
      correct: ['c'], explBn: 'উভয়ই দ্রবণীয় নিরপেক্ষ লবণ হওয়ায় শুধু দ্রবণ দুটি মিশে যায়, কোনো নতুন যৌগ তৈরি হয় না।', explEn: 'Since both are soluble neutral salts, the solutions simply mix without forming any new compound.' },
    { bn: 'Mg + 2HCl বিক্রিয়ায় উৎপন্ন গ্যাসকে কীভাবে শনাক্ত করা যায়?', en: 'How can the gas produced in Mg + 2HCl be identified?',
      options: [{ id: 'a', bn: 'জ্বলন্ত কাঠি দিয়ে "পপ" শব্দ শুনে', en: 'By hearing a "pop" sound with a burning splint' }, { id: 'b', bn: 'চুনের পানি ঘোলা করে', en: 'By turning limewater milky' }, { id: 'c', bn: 'লাল লিটমাসকে নীল করে', en: 'By turning red litmus blue' }, { id: 'd', bn: 'গন্ধ শুঁকে', en: 'By its smell' }],
      correct: ['a'], explBn: 'হাইড্রোজেন গ্যাস জ্বলন্ত কাঠি ধরলে "পপ" শব্দে জ্বলে ওঠে — এটিই আদর্শ শনাক্তকরণ পরীক্ষা।', explEn: 'Hydrogen gas ignites with a characteristic "pop" sound near a burning splint — the standard test.' },
    { bn: 'অ্যালুমিনিয়াম ফয়েল HCl-এ দিলে প্রথমে বিক্রিয়া ধীর হওয়ার কারণ কী?', en: 'Why does the reaction of aluminium foil with HCl start slowly?',
      options: [{ id: 'a', bn: 'অ্যালুমিনিয়াম নিষ্ক্রিয় ধাতু', en: 'Aluminium is an inert metal' }, { id: 'b', bn: 'উপরিভাগে অক্সাইড স্তর থাকে', en: 'It has a surface oxide layer' }, { id: 'c', bn: 'HCl দুর্বল এসিড', en: 'HCl is a weak acid' }, { id: 'd', bn: 'তাপমাত্রা কম থাকে', en: 'The temperature is low' }],
      correct: ['b'], explBn: 'অ্যালুমিনিয়ামের উপরিভাগের প্রাকৃতিক অক্সাইড স্তর ভাঙার পর বিক্রিয়া দ্রুত হয়।', explEn: 'The reaction speeds up once the natural surface oxide layer on aluminium is broken down.' },
    { bn: 'কোন পরীক্ষায় "Silver Tree" নামে পরিচিত প্রতিক্রিয়া দেখা যায়?', en: 'Which reaction is known as the "Silver Tree" test?',
      options: [{ id: 'a', bn: 'Cu + 2AgNO₃', en: 'Cu + 2AgNO3' }, { id: 'b', bn: 'Zn + CuSO₄', en: 'Zn + CuSO4' }, { id: 'c', bn: 'Fe + HCl', en: 'Fe + HCl' }, { id: 'd', bn: 'Na₂CO₃ + HCl', en: 'Na2CO3 + HCl' }],
      correct: ['a'], explBn: 'তামার তারে রূপার স্ফটিক গাছের ডালের মতো জমে বলে একে "Silver Tree" বলা হয়।', explEn: 'Silver crystals deposit on the copper wire in a branching, tree-like pattern, hence the name.' },
    { bn: 'সালফিউরিক এসিড ক্ষারের সাথে বিক্রিয়ায় কোন লবণ উৎপন্ন করে (NaOH সহ)?', en: 'What salt does sulphuric acid produce when reacting with NaOH?',
      options: [{ id: 'a', bn: 'সোডিয়াম সালফেট', en: 'Sodium sulphate' }, { id: 'b', bn: 'সোডিয়াম ক্লোরাইড', en: 'Sodium chloride' }, { id: 'c', bn: 'সোডিয়াম কার্বনেট', en: 'Sodium carbonate' }, { id: 'd', bn: 'সোডিয়াম নাইট্রেট', en: 'Sodium nitrate' }],
      correct: ['a'], explBn: 'H₂SO₄ + 2NaOH → Na₂SO₄ + 2H₂O।', explEn: 'H2SO4 + 2NaOH -> Na2SO4 + 2H2O.' },
    { bn: 'ইউনিভার্সাল ইন্ডিকেটর নিরপেক্ষ দ্রবণে (pH=7) কী রঙ দেখায়?', en: 'What color does universal indicator show in a neutral solution (pH=7)?',
      options: [{ id: 'a', bn: 'লাল', en: 'Red' }, { id: 'b', bn: 'সবুজ', en: 'Green' }, { id: 'c', bn: 'নীল-বেগুনি', en: 'Blue-violet' }, { id: 'd', bn: 'হলুদ', en: 'Yellow' }],
      correct: ['b'], explBn: 'নিরপেক্ষ pH=7-এ ইউনিভার্সাল ইন্ডিকেটর সবুজ রঙ দেখায়।', explEn: 'Universal indicator shows green at a neutral pH of 7.', difficulty: 'easy' },
    { bn: 'চুনের পানিতে CO₂ গ্যাস চালনা করলে কী ঘটে?', en: 'What happens when CO2 gas is passed through limewater?',
      options: [{ id: 'a', bn: 'পানি দুধের মতো ঘোলা হয়ে যায়', en: 'It turns milky' }, { id: 'b', bn: 'পানি রঙহীন থাকে', en: 'It stays colorless' }, { id: 'c', bn: 'গ্যাস বুদবুদ আকারে বেরিয়ে যায় কোনো পরিবর্তন ছাড়াই', en: 'The gas bubbles out with no change' }, { id: 'd', bn: 'পানি নীল হয়ে যায়', en: 'It turns blue' }],
      correct: ['a'], explBn: 'CO₂ চুনের পানিতে CaCO₃ অধঃক্ষেপ তৈরি করে বলে পানি ঘোলা দেখায় — এটিই CO₂ শনাক্তকরণের আদর্শ পরীক্ষা।', explEn: 'CO2 forms a CaCO3 precipitate in limewater, making it turn milky — the standard test for CO2.' },
  ];
  for (const q of chemQuestions) await addQuestion(chemChapter, q);

  // ---------- Physics: Simple Pendulum / SHM (Class 9-10) ----------
  const phyChapter = await upsertChapter(phyId, 9, 'সরল দোলক ও সরল ছন্দিত স্পন্দন', 'Simple Pendulum and SHM', 1);
  await addContent(phyChapter, 'notes', 'সরল দোলকের গতি', 'Motion of a Simple Pendulum',
    'একটি হালকা, অপ্রসারণযোগ্য সুতায় ঝুলানো ভারী বস্তুকণাকে সাম্যাবস্থান থেকে সামান্য সরিয়ে ছেড়ে দিলে তা সরল ছন্দিত স্পন্দনে দুলতে থাকে। দোলকের দৈর্ঘ্য (L) ও অভিকর্ষজ ত্বরণ (g) এর উপর দোলনকাল (T) নির্ভর করে, কিন্তু বস্তুর ভরের উপর নির্ভর করে না।',
    'A heavy point mass suspended from a light, inextensible string, when displaced slightly from its equilibrium position and released, oscillates in simple harmonic motion. The time period (T) depends on the pendulum length (L) and gravitational acceleration (g), but not on the mass of the bob.',
    1);
  await addContent(phyChapter, 'formula', 'দোলনকালের সূত্র', 'Time Period Formula',
    'T = 2π√(L/g)\nএখানে, T = দোলনকাল (সেকেন্ড), L = দোলকের দৈর্ঘ্য (মিটার), g = অভিকর্ষজ ত্বরণ (9.8 m/s²)।\nT² বনাম L লেখচিত্র একটি সরলরেখা — এই রেখার ঢাল থেকে g নির্ণয় করা যায়।',
    'T = 2 pi * sqrt(L/g)\nWhere T = time period (seconds), L = pendulum length (meters), g = gravitational acceleration (9.8 m/s^2).\nA graph of T^2 vs L is a straight line — g can be determined from its slope.',
    2);
  await upsertSimulation(phyChapter, 'phy-pendulum', 'সরল দোলক পরীক্ষাগার', 'Simple Pendulum Lab', { lengthRangeM: [0.2, 1.5], gDefault: 9.8 });

  const phyQuestions = [
    { bn: 'সরল দোলকের দোলনকাল কোন রাশির উপর নির্ভর করে না?', en: 'The time period of a simple pendulum does NOT depend on which quantity?',
      options: [{ id: 'a', bn: 'দোলকের দৈর্ঘ্য', en: 'Length of the pendulum' }, { id: 'b', bn: 'অভিকর্ষজ ত্বরণ', en: 'Gravitational acceleration' }, { id: 'c', bn: 'বস্তুর ভর', en: 'Mass of the bob' }, { id: 'd', bn: 'দোলনের বিস্তার (ছোট হলে)', en: 'Amplitude (for small angles)' }],
      correct: ['c'], explBn: 'সরল দোলকের দোলনকাল T=2π√(L/g), যাতে ভরের কোনো পদ নেই।', explEn: 'The period T = 2 pi sqrt(L/g) has no mass term, so mass does not affect it.' },
    { bn: 'দোলকের দৈর্ঘ্য চারগুণ বাড়ালে দোলনকাল কতগুণ বাড়বে?', en: 'If the pendulum length is increased 4 times, by what factor does the time period increase?',
      options: [{ id: 'a', bn: '২ গুণ', en: '2 times' }, { id: 'b', bn: '৪ গুণ', en: '4 times' }, { id: 'c', bn: '১৬ গুণ', en: '16 times' }, { id: 'd', bn: 'অপরিবর্তিত', en: 'Unchanged' }],
      correct: ['a'], explBn: 'T ∝ √L, তাই L চারগুণ হলে T দ্বিগুণ হয়।', explEn: 'Since T is proportional to sqrt(L), quadrupling L doubles T.' },
    { bn: 'T² বনাম L লেখচিত্র কী আকৃতির হয়?', en: 'What is the shape of a T^2 vs L graph?',
      options: [{ id: 'a', bn: 'সরলরেখা', en: 'A straight line' }, { id: 'b', bn: 'প্যারাবোলা', en: 'A parabola' }, { id: 'c', bn: 'বৃত্ত', en: 'A circle' }, { id: 'd', bn: 'অতিপরাবৃত্ত', en: 'A hyperbola' }],
      correct: ['a'], explBn: 'T² = (4π²/g) L সমীকরণটি L-এর সরলরৈখিক ফাংশন, তাই লেখচিত্র সরলরেখা।', explEn: 'T^2 = (4 pi^2 / g) L is linear in L, so the graph is a straight line.' },
    { bn: 'সরলরেখার ঢাল থেকে কোন রাশি নির্ণয় করা যায়?', en: 'Which quantity can be determined from the slope of that line?',
      options: [{ id: 'a', bn: 'অভিকর্ষজ ত্বরণ (g)', en: 'Gravitational acceleration (g)' }, { id: 'b', bn: 'ভর', en: 'Mass' }, { id: 'c', bn: 'বিস্তার', en: 'Amplitude' }, { id: 'd', bn: 'কম্পাঙ্ক', en: 'Frequency' }],
      correct: ['a'], explBn: 'ঢাল = 4π²/g, এখান থেকে g নির্ণয় করা যায়।', explEn: 'The slope equals 4 pi^2 / g, from which g can be calculated.' },
    { bn: 'দোলকের একবার সম্পূর্ণ দোলনের জন্য সময়কে কী বলে?', en: 'The time for one complete oscillation of a pendulum is called what?',
      options: [{ id: 'a', bn: 'কম্পাঙ্ক', en: 'Frequency' }, { id: 'b', bn: 'দোলনকাল', en: 'Time period' }, { id: 'c', bn: 'বিস্তার', en: 'Amplitude' }, { id: 'd', bn: 'বেগ', en: 'Velocity' }],
      correct: ['b'], explBn: 'সম্পূর্ণ এক দোলনের জন্য প্রয়োজনীয় সময়কে দোলনকাল (Time Period) বলে।', explEn: 'The time taken for one full oscillation is called the time period.', difficulty: 'easy' },
    { bn: 'কম্পাঙ্ক (frequency) ও দোলনকালের (period) সম্পর্ক কী?', en: 'What is the relationship between frequency and period?',
      options: [{ id: 'a', bn: 'f = 1/T', en: 'f = 1/T' }, { id: 'b', bn: 'f = T', en: 'f = T' }, { id: 'c', bn: 'f = T²', en: 'f = T^2' }, { id: 'd', bn: 'f = 2T', en: 'f = 2T' }],
      correct: ['a'], explBn: 'কম্পাঙ্ক দোলনকালের ব্যস্তানুপাতিক — f = 1/T।', explEn: 'Frequency is the reciprocal of the period: f = 1/T.' },
    { bn: 'দোলকের বিস্তার (amplitude) ছোট রাখার প্রয়োজন কেন?', en: 'Why must the amplitude of a pendulum be kept small?',
      options: [{ id: 'a', bn: 'সরল ছন্দিত স্পন্দনের সূত্র তখনই সঠিক থাকে', en: 'The SHM formula holds accurately only then' }, { id: 'b', bn: 'দৈর্ঘ্য বদলে যায়', en: 'The length would change' }, { id: 'c', bn: 'ভর বদলে যায়', en: 'The mass would change' }, { id: 'd', bn: 'কোনো কারণ নেই', en: 'There is no reason' }],
      correct: ['a'], explBn: 'ছোট কোণের জন্য sinθ ≈ θ ধরা যায়, যা T=2π√(L/g) সূত্রের ভিত্তি।', explEn: 'For small angles, sin(theta) ~ theta, which is the basis of the T=2 pi sqrt(L/g) formula.' },
    { bn: 'একই দোলককে চাঁদে নিয়ে গেলে দোলনকালের কী পরিবর্তন হবে (চাঁদে g কম)?', en: 'If the same pendulum is taken to the Moon (lower g), how does the time period change?',
      options: [{ id: 'a', bn: 'বেড়ে যাবে', en: 'It will increase' }, { id: 'b', bn: 'কমে যাবে', en: 'It will decrease' }, { id: 'c', bn: 'অপরিবর্তিত থাকবে', en: 'It will stay the same' }, { id: 'd', bn: 'শূন্য হয়ে যাবে', en: 'It will become zero' }],
      correct: ['a'], explBn: 'T ∝ 1/√g, তাই g কমলে T বেড়ে যায়।', explEn: 'Since T is inversely proportional to sqrt(g), a smaller g increases T.' },
    { bn: 'দোলকের দৈর্ঘ্য বলতে কী বোঝায়?', en: 'What is meant by the "length" of a pendulum?',
      options: [{ id: 'a', bn: 'সুতার দৈর্ঘ্য শুধু', en: 'Only the string length' }, { id: 'b', bn: 'সাসপেনশন বিন্দু থেকে বব-এর কেন্দ্র পর্যন্ত দূরত্ব', en: 'Distance from the suspension point to the center of the bob' }, { id: 'c', bn: 'বব-এর ব্যাস', en: 'The diameter of the bob' }, { id: 'd', bn: 'বব-এর ভর', en: 'The mass of the bob' }],
      correct: ['b'], explBn: 'কার্যকর দৈর্ঘ্য (effective length) হলো সাসপেনশন বিন্দু থেকে বব-এর কেন্দ্র (center of mass) পর্যন্ত দূরত্ব।', explEn: 'The effective length is the distance from the point of suspension to the center of mass of the bob.' },
    { bn: 'এই পরীক্ষার মূল উদ্দেশ্য কী?', en: 'What is the main objective of this experiment?',
      options: [{ id: 'a', bn: 'দোলকের ভর নির্ণয়', en: 'To determine the mass of the pendulum' }, { id: 'b', bn: 'L ও T² এর সম্পর্ক থেকে g নির্ণয়', en: 'To determine g from the relationship between L and T^2' }, { id: 'c', bn: 'সুতার রঙ পর্যবেক্ষণ', en: 'To observe the color of the string' }, { id: 'd', bn: 'তাপমাত্রা পরিমাপ', en: 'To measure temperature' }],
      correct: ['b'], explBn: 'বিভিন্ন দৈর্ঘ্যে দোলনকাল মেপে T² বনাম L লেখচিত্র থেকে g নির্ণয়ই এই পরীক্ষার মূল লক্ষ্য।', explEn: 'The main goal is measuring the period at different lengths and determining g from the T^2 vs L graph.' },
  ];
  for (const q of phyQuestions) await addQuestion(phyChapter, q);

  // ---------- Biology: Cell & Tissue (Class 9-10) ----------
  const bioChapter = await upsertChapter(bioId, 9, 'কোষ ও টিস্যু', 'Cell and Tissue', 1);
  await addContent(bioChapter, 'notes', 'কোষের গঠন', 'Structure of the Cell',
    'কোষ হলো জীবদেহের গঠন ও কার্যের একক। উদ্ভিদ কোষে কোষপ্রাচীর, বৃহৎ কোষগহ্বর ও ক্লোরোপ্লাস্ট থাকে, যা প্রাণী কোষে থাকে না। উভয় কোষেই কোষঝিল্লি, সাইটোপ্লাজম ও নিউক্লিয়াস থাকে। পেঁয়াজের ছাল (onion peel) হলো উদ্ভিদ কোষ পর্যবেক্ষণের একটি সহজ ও জনপ্রিয় নমুনা — এতে আয়োডিন দ্রবণ দিয়ে রং করলে নিউক্লিয়াস স্পষ্ট দেখা যায়।',
    'The cell is the structural and functional unit of life. Plant cells have a cell wall, a large central vacuole, and chloroplasts, which animal cells lack. Both have a cell membrane, cytoplasm, and nucleus. Onion peel is a simple, popular sample for observing plant cells — staining with iodine solution makes the nucleus clearly visible.',
    1);
  await addContent(bioChapter, 'diagram', 'টিস্যুর প্রকারভেদ', 'Types of Tissue',
    'উদ্ভিদ টিস্যু প্রধানত দুই প্রকার: ভাজক টিস্যু (মেরিস্টেম, যা বিভাজিত হয়ে নতুন কোষ তৈরি করে) ও স্থায়ী টিস্যু (যা বিভাজিত হয় না, নির্দিষ্ট কাজ করে - যেমন সরল ও জটিল টিস্যু)।',
    'Plant tissues are mainly of two types: meristematic tissue (which divides to produce new cells) and permanent tissue (which does not divide and performs specific functions - simple and complex tissues).',
    2);
  await upsertSimulation(bioChapter, 'bio-microscope', 'ভার্চুয়াল অণুবীক্ষণ যন্ত্র', 'Virtual Microscope', { slide: 'onion-peel', magnifications: [40, 100, 400] });

  const bioQuestions = [
    { bn: 'উদ্ভিদ কোষে থাকে কিন্তু প্রাণী কোষে থাকে না — এমন অঙ্গাণু কোনটি?', en: 'Which organelle is present in plant cells but absent in animal cells?',
      options: [{ id: 'a', bn: 'নিউক্লিয়াস', en: 'Nucleus' }, { id: 'b', bn: 'কোষপ্রাচীর', en: 'Cell wall' }, { id: 'c', bn: 'মাইটোকন্ড্রিয়া', en: 'Mitochondria' }, { id: 'd', bn: 'কোষঝিল্লি', en: 'Cell membrane' }],
      correct: ['b'], explBn: 'কোষপ্রাচীর সেলুলোজ দিয়ে তৈরি এবং শুধু উদ্ভিদ কোষে থাকে, যা কোষকে দৃঢ়তা দেয়।', explEn: 'The cell wall, made of cellulose, is present only in plant cells and provides rigidity.' },
    { bn: 'পেঁয়াজের ছালের কোষ পর্যবেক্ষণে কোন দ্রবণ ব্যবহার করা হয়?', en: 'Which solution is used to stain onion peel cells for observation?',
      options: [{ id: 'a', bn: 'আয়োডিন দ্রবণ', en: 'Iodine solution' }, { id: 'b', bn: 'লবণ পানি', en: 'Salt water' }, { id: 'c', bn: 'চিনির দ্রবণ', en: 'Sugar solution' }, { id: 'd', bn: 'তেল', en: 'Oil' }],
      correct: ['a'], explBn: 'আয়োডিন দ্রবণ নিউক্লিয়াস ও কোষের অন্যান্য অংশকে স্পষ্ট করে দেখায়।', explEn: 'Iodine solution stains the nucleus and other cell parts, making them clearly visible under the microscope.' },
    { bn: 'কোষের কোন অংশ বংশগতির তথ্য বহন করে?', en: 'Which part of the cell carries hereditary information?',
      options: [{ id: 'a', bn: 'সাইটোপ্লাজম', en: 'Cytoplasm' }, { id: 'b', bn: 'নিউক্লিয়াস', en: 'Nucleus' }, { id: 'c', bn: 'কোষপ্রাচীর', en: 'Cell wall' }, { id: 'd', bn: 'কোষগহ্বর', en: 'Vacuole' }],
      correct: ['b'], explBn: 'নিউক্লিয়াসে ডিএনএ থাকে, যা বংশগতির তথ্য বহন করে।', explEn: 'The nucleus contains DNA, which carries hereditary information.', difficulty: 'easy' },
    { bn: 'ভাজক টিস্যুর (meristematic tissue) প্রধান কাজ কী?', en: "What is the main function of meristematic tissue?",
      options: [{ id: 'a', bn: 'নতুন কোষ উৎপাদন করা', en: 'Producing new cells' }, { id: 'b', bn: 'খাদ্য সঞ্চয় করা', en: 'Storing food' }, { id: 'c', bn: 'পানি পরিবহন করা', en: 'Transporting water' }, { id: 'd', bn: 'সালোকসংশ্লেষণ করা', en: 'Performing photosynthesis' }],
      correct: ['a'], explBn: 'ভাজক টিস্যুর কোষ বারবার বিভাজিত হয়ে নতুন কোষ তৈরি করে, যা উদ্ভিদের বৃদ্ধি ঘটায়।', explEn: 'Meristematic cells divide repeatedly to produce new cells, driving plant growth.' },
    { bn: 'ক্লোরোপ্লাস্ট কোন কোষে পাওয়া যায়?', en: 'In which type of cell is the chloroplast found?',
      options: [{ id: 'a', bn: 'শুধু প্রাণী কোষে', en: 'Only in animal cells' }, { id: 'b', bn: 'সবুজ উদ্ভিদ কোষে', en: 'In green plant cells' }, { id: 'c', bn: 'ব্যাকটেরিয়া কোষে', en: 'In bacterial cells' }, { id: 'd', bn: 'কোনো কোষেই থাকে না', en: 'In no cells' }],
      correct: ['b'], explBn: 'ক্লোরোপ্লাস্ট সালোকসংশ্লেষণের স্থান, যা সবুজ উদ্ভিদ কোষে পাওয়া যায়।', explEn: 'The chloroplast, the site of photosynthesis, is found in green plant cells.' },
    { bn: 'কোষের কোন অংশ কোষের ভেতরে-বাইরে পদার্থ চলাচল নিয়ন্ত্রণ করে?', en: 'Which cell part controls the movement of materials in and out of the cell?',
      options: [{ id: 'a', bn: 'কোষঝিল্লি', en: 'Cell membrane' }, { id: 'b', bn: 'নিউক্লিয়াস', en: 'Nucleus' }, { id: 'c', bn: 'কোষপ্রাচীর', en: 'Cell wall' }, { id: 'd', bn: 'রাইবোজোম', en: 'Ribosome' }],
      correct: ['a'], explBn: 'কোষঝিল্লি অর্ধভেদ্য পর্দা হিসেবে কাজ করে পদার্থের চলাচল নিয়ন্ত্রণ করে।', explEn: 'The cell membrane acts as a semi-permeable barrier, regulating the movement of substances.' },
    { bn: 'অণুবীক্ষণ যন্ত্রে ফোকাস ঠিক করার প্রধান কারণ কী?', en: 'Why is focusing important when using a microscope?',
      options: [{ id: 'a', bn: 'নমুনার স্পষ্ট প্রতিবিম্ব পেতে', en: 'To get a clear image of the sample' }, { id: 'b', bn: 'আলো বন্ধ করতে', en: 'To turn off the light' }, { id: 'c', bn: 'নমুনা রঙিন করতে', en: 'To color the sample' }, { id: 'd', bn: 'লেন্স পরিষ্কার করতে', en: 'To clean the lens' }],
      correct: ['a'], explBn: 'সঠিক ফোকাস ছাড়া কোষের গঠন স্পষ্টভাবে দেখা যায় না।', explEn: 'Without proper focus, the cell structure cannot be clearly observed.', difficulty: 'easy' },
    { bn: 'উদ্ভিদ কোষের বড় কোষগহ্বর (vacuole) এর প্রধান কাজ কী?', en: "What is the main function of the large vacuole in a plant cell?",
      options: [{ id: 'a', bn: 'পানি ও খাদ্য সঞ্চয় করা', en: 'Storing water and food' }, { id: 'b', bn: 'বংশগতির তথ্য বহন করা', en: 'Carrying hereditary information' }, { id: 'c', bn: 'শক্তি উৎপাদন করা', en: 'Producing energy' }, { id: 'd', bn: 'প্রোটিন তৈরি করা', en: 'Making proteins' }],
      correct: ['a'], explBn: 'কোষগহ্বর পানি, খাদ্য ও বর্জ্য পদার্থ সঞ্চয় করে এবং কোষকে দৃঢ়তা দেয়।', explEn: 'The vacuole stores water, food, and waste, and helps maintain the cell’s rigidity.' },
    { bn: 'টিস্যু বলতে কী বোঝায়?', en: 'What is meant by "tissue"?',
      options: [{ id: 'a', bn: 'একই কাজ সম্পাদনকারী একগুচ্ছ একই ধরনের কোষ', en: 'A group of similar cells performing the same function' }, { id: 'b', bn: 'একটি একক কোষ', en: 'A single cell' }, { id: 'c', bn: 'একটি সম্পূর্ণ অঙ্গ', en: 'A whole organ' }, { id: 'd', bn: 'একটি অণু', en: 'A molecule' }],
      correct: ['a'], explBn: 'একই গঠন ও কাজবিশিষ্ট কোষের সমষ্টিকে টিস্যু বলে।', explEn: 'A tissue is a group of cells with similar structure and function.' },
    { bn: 'কোষের কোন অংশে শ্বসন প্রক্রিয়ার মাধ্যমে শক্তি উৎপন্ন হয়?', en: 'In which cell part is energy produced through respiration?',
      options: [{ id: 'a', bn: 'মাইটোকন্ড্রিয়া', en: 'Mitochondria' }, { id: 'b', bn: 'নিউক্লিয়াস', en: 'Nucleus' }, { id: 'c', bn: 'কোষপ্রাচীর', en: 'Cell wall' }, { id: 'd', bn: 'ক্লোরোপ্লাস্ট', en: 'Chloroplast' }],
      correct: ['a'], explBn: 'মাইটোকন্ড্রিয়াকে "কোষের শক্তিঘর" বলা হয় কারণ এখানে শ্বসনের মাধ্যমে শক্তি (ATP) উৎপন্ন হয়।', explEn: 'Mitochondria are called the "powerhouse of the cell" because respiration generates energy (ATP) there.' },
  ];
  for (const q of bioQuestions) await addQuestion(bioChapter, q);

  // ---------- ICT: Number Systems & Logic Gates (Class 11-12) ----------
  const ictChapter = await upsertChapter(ictId, 11, 'সংখ্যা পদ্ধতি ও লজিক গেট', 'Number Systems and Logic Gates', 1);
  await addContent(ictChapter, 'notes', 'বাইনারি সংখ্যা পদ্ধতি ও লজিক গেট', 'Binary Number System and Logic Gates',
    'কম্পিউটার শুধুমাত্র বাইনারি (০ ও ১) সংখ্যা বোঝে। AND, OR, NOT, NAND, NOR, XOR — এই মৌলিক লজিক গেটগুলো দিয়ে ডিজিটাল বর্তনী তৈরি হয়। প্রতিটি গেটের একটি নির্দিষ্ট ট্রুথ টেবিল (Truth Table) থাকে যা ইনপুট অনুযায়ী আউটপুট নির্ধারণ করে।',
    'Computers understand only binary (0 and 1) numbers. Digital circuits are built from basic logic gates: AND, OR, NOT, NAND, NOR, and XOR. Each gate has a defined truth table that determines its output for every combination of inputs.',
    1);
  await addContent(ictChapter, 'formula', 'ট্রুথ টেবিল সারসংক্ষেপ', 'Truth Table Summary',
    'AND: উভয় ইনপুট ১ হলে আউটপুট ১\nOR: যেকোনো একটি ইনপুট ১ হলে আউটপুট ১\nNOT: ইনপুটের বিপরীত মান দেয়\nXOR: ইনপুট দুটি ভিন্ন হলে আউটপুট ১',
    'AND: output is 1 only if both inputs are 1\nOR: output is 1 if either input is 1\nNOT: outputs the inverse of the input\nXOR: output is 1 only if the inputs differ',
    2);
  await upsertSimulation(ictChapter, 'ict-logic-gates', 'লজিক গেট বিল্ডার', 'Logic Gate Builder', { gates: ['AND', 'OR', 'NOT', 'NAND', 'NOR', 'XOR'] });

  const ictQuestions = [
    { bn: 'কম্পিউটার মূলত কোন সংখ্যা পদ্ধতি ব্যবহার করে?', en: 'Which number system does a computer fundamentally use?',
      options: [{ id: 'a', bn: 'দশমিক', en: 'Decimal' }, { id: 'b', bn: 'বাইনারি', en: 'Binary' }, { id: 'c', bn: 'অক্টাল', en: 'Octal' }, { id: 'd', bn: 'রোমান', en: 'Roman' }],
      correct: ['b'], explBn: 'কম্পিউটার সার্কিট দুটি অবস্থা (ON/OFF) বোঝে, যা বাইনারি ০ ও ১ দিয়ে উপস্থাপিত হয়।', explEn: 'Computer circuits understand two states (ON/OFF), represented by binary 0 and 1.', difficulty: 'easy' },
    { bn: 'দশমিক সংখ্যা ৫ এর বাইনারি রূপ কোনটি?', en: 'What is the binary form of the decimal number 5?',
      options: [{ id: 'a', bn: '101', en: '101' }, { id: 'b', bn: '110', en: '110' }, { id: 'c', bn: '011', en: '011' }, { id: 'd', bn: '100', en: '100' }],
      correct: ['a'], explBn: '৫ = ৪+১ = 2² + 2⁰ = 101 (বাইনারি)।', explEn: '5 = 4+1 = 2^2 + 2^0 = 101 in binary.' },
    { bn: 'AND গেটের আউটপুট ১ হয় কখন?', en: 'When is the output of an AND gate 1?',
      options: [{ id: 'a', bn: 'উভয় ইনপুট ১ হলে', en: 'Only when both inputs are 1' }, { id: 'b', bn: 'যেকোনো একটি ইনপুট ১ হলে', en: 'When either input is 1' }, { id: 'c', bn: 'উভয় ইনপুট ০ হলে', en: 'When both inputs are 0' }, { id: 'd', bn: 'সবসময়', en: 'Always' }],
      correct: ['a'], explBn: 'AND গেটের ট্রুথ টেবিল অনুযায়ী শুধু উভয় ইনপুট ১ হলেই আউটপুট ১ হয়।', explEn: "According to the AND gate's truth table, the output is 1 only when both inputs are 1." },
    { bn: 'NOT গেট কী কাজ করে?', en: 'What does a NOT gate do?',
      options: [{ id: 'a', bn: 'ইনপুটের বিপরীত মান দেয়', en: 'Inverts the input value' }, { id: 'b', bn: 'দুটি ইনপুট যোগ করে', en: 'Adds two inputs' }, { id: 'c', bn: 'ইনপুট অপরিবর্তিত রাখে', en: 'Leaves the input unchanged' }, { id: 'd', bn: 'ইনপুট সংখ্যা গুণ করে', en: 'Multiplies the inputs' }],
      correct: ['a'], explBn: 'NOT গেট একে ইনভার্টারও বলা হয় — ০ কে ১ এবং ১ কে ০ করে দেয়।', explEn: 'A NOT gate, also called an inverter, turns 0 into 1 and 1 into 0.', difficulty: 'easy' },
    { bn: 'XOR গেটের আউটপুট ১ হয় কখন?', en: 'When is the output of an XOR gate 1?',
      options: [{ id: 'a', bn: 'ইনপুট দুটি ভিন্ন হলে', en: 'When the two inputs differ' }, { id: 'b', bn: 'ইনপুট দুটি একই হলে', en: 'When the two inputs are the same' }, { id: 'c', bn: 'উভয় ইনপুট ০ হলে', en: 'When both inputs are 0' }, { id: 'd', bn: 'কখনোই না', en: 'Never' }],
      correct: ['a'], explBn: 'XOR (Exclusive OR) গেট ইনপুট দুটি ভিন্ন হলেই আউটপুট ১ দেয়।', explEn: 'An XOR (Exclusive OR) gate outputs 1 only when its two inputs are different.' },
    { bn: 'NAND গেট আসলে কোন দুটি গেটের সমন্বয়?', en: 'A NAND gate is essentially a combination of which two gates?',
      options: [{ id: 'a', bn: 'AND ও NOT', en: 'AND and NOT' }, { id: 'b', bn: 'OR ও NOT', en: 'OR and NOT' }, { id: 'c', bn: 'AND ও OR', en: 'AND and OR' }, { id: 'd', bn: 'XOR ও AND', en: 'XOR and AND' }],
      correct: ['a'], explBn: 'NAND = NOT + AND, অর্থাৎ AND গেটের আউটপুটকে উল্টে দেয়।', explEn: 'NAND = NOT + AND — it inverts the output of an AND gate.' },
    { bn: 'OR গেটের আউটপুট ০ হয় কখন?', en: 'When is the output of an OR gate 0?',
      options: [{ id: 'a', bn: 'উভয় ইনপুট ০ হলে', en: 'Only when both inputs are 0' }, { id: 'b', bn: 'যেকোনো একটি ইনপুট ১ হলে', en: 'When either input is 1' }, { id: 'c', bn: 'সবসময়', en: 'Always' }, { id: 'd', bn: 'কখনোই না', en: 'Never' }],
      correct: ['a'], explBn: 'OR গেটে শুধু উভয় ইনপুট ০ হলেই আউটপুট ০ হয়, অন্য সব ক্ষেত্রে ১।', explEn: 'An OR gate outputs 0 only when both inputs are 0; otherwise it outputs 1.' },
    { bn: '৪-বিট বাইনারি সংখ্যা দিয়ে সর্বোচ্চ কত পর্যন্ত দশমিক মান প্রকাশ করা যায়?', en: 'What is the maximum decimal value representable with a 4-bit binary number?',
      options: [{ id: 'a', bn: '১৫', en: '15' }, { id: 'b', bn: '১৬', en: '16' }, { id: 'c', bn: '৭', en: '7' }, { id: 'd', bn: '৩১', en: '31' }],
      correct: ['a'], explBn: '৪-বিট দিয়ে ২⁴=১৬টি মান (০ থেকে ১৫) প্রকাশ করা যায়, তাই সর্বোচ্চ মান ১৫।', explEn: '4 bits give 2^4 = 16 possible values (0 to 15), so the maximum value is 15.' },
    { bn: 'লজিক গেট বাস্তবে কী দিয়ে তৈরি হয়?', en: 'What are logic gates physically built from?',
      options: [{ id: 'a', bn: 'ট্রানজিস্টর', en: 'Transistors' }, { id: 'b', bn: 'কাগজ', en: 'Paper' }, { id: 'c', bn: 'কাঠ', en: 'Wood' }, { id: 'd', bn: 'জল', en: 'Water' }],
      correct: ['a'], explBn: 'আধুনিক লজিক গেট মূলত সেমিকন্ডাক্টর ট্রানজিস্টর দিয়ে তৈরি হয়।', explEn: 'Modern logic gates are built primarily from semiconductor transistors.' },
    { bn: 'দুইটি ইনপুট গেটে মোট কতগুলো সম্ভাব্য ইনপুট সমন্বয় থাকে?', en: 'How many possible input combinations exist for a two-input gate?',
      options: [{ id: 'a', bn: '৪', en: '4' }, { id: 'b', bn: '২', en: '2' }, { id: 'c', bn: '৮', en: '8' }, { id: 'd', bn: '১৬', en: '16' }],
      correct: ['a'], explBn: 'দুটি ইনপুট, প্রতিটির ২টি সম্ভাব্য মান (০/১), তাই মোট 2×2=৪টি সমন্বয়।', explEn: 'With two inputs each having 2 possible values (0/1), there are 2x2=4 total combinations.' },
  ];
  for (const q of ictQuestions) await addQuestion(ictChapter, q);

  // ---------- Badges ----------
  await upsertBadge('first_simulation', 'প্রথম পরীক্ষা', 'First Simulation', '🧪', 'Complete your first simulation');
  await upsertBadge('streak_7', '৭ দিনের ধারাবাহিকতা', '7-Day Streak', '🔥', '7 consecutive active days');
  await upsertBadge('high_scorer', 'উচ্চ স্কোরার', 'High Scorer', '🏆', 'Score 90%+ on an exam');
  await upsertBadge('chapter_master', 'অধ্যায় সম্পন্নকারী', 'Chapter Master', '🎓', 'Reach 100% progress in a chapter');

  // ---------- Demo users (password: Test@1234 for all) ----------
  const passwordHash = await bcrypt.hash('Test@1234', 10);
  const studentId = await upsertUser('student1', 'রাফি আহমেদ', 'student', 9, 'bn', passwordHash);
  await upsertUser('teacher1', 'নাসরিন সুলতানা', 'teacher', 9, 'bn', passwordHash);
  const guardianId = await upsertUser('guardian1', 'আব্দুল করিম', 'guardian', null, 'bn', passwordHash);
  await upsertUser('contentadmin1', 'Content Admin', 'content_admin', null, 'en', passwordHash);
  await upsertUser('sysadmin1', 'System Admin', 'system_admin', null, 'en', passwordHash);

  const link = await pool.query('SELECT id FROM guardian_links WHERE guardian_user_id=$1 AND student_user_id=$2', [guardianId, studentId]);
  if (!link.rows.length) {
    await pool.query('INSERT INTO guardian_links (guardian_user_id, student_user_id, confirmed) VALUES ($1,$2,true)', [guardianId, studentId]);
  }

  console.log('Seed complete.');
  console.log('Demo logins (password: Test@1234): student1, teacher1, guardian1, contentadmin1, sysadmin1');
  await pool.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
