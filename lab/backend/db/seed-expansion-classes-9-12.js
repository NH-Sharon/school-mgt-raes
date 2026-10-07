/* BdVirtualLab content expansion: 5 new chapters each for Classes 9, 10, 11, 12
   (20 chapters total), reusing the existing 4 subjects. These chapters have
   learning content + MCQ questions but no attached simulation (the app's 4
   simulations are fixed, code-level engines — see the Content Admin Guide).
   Run: node db/seed-expansion-classes-9-12.js (uses DATABASE_URL if set, else local .env) */
require('dotenv').config();
const pool = require('../config/database');

async function getSubjectId(code) {
  const r = await pool.query('SELECT id FROM subjects WHERE code = $1', [code]);
  if (!r.rows.length) throw new Error(`Subject ${code} not found — run db:seed first`);
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
  const existing = await pool.query('SELECT id FROM learning_content WHERE chapter_id=$1 AND title_en=$2', [chapterId, titleEn]);
  if (existing.rows.length) return;
  await pool.query(
    `INSERT INTO learning_content (chapter_id, content_type, title_bn, title_en, body_bn, body_en, order_index, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,'published')`,
    [chapterId, contentType, titleBn, titleEn, bodyBn, bodyEn, orderIndex]
  );
}

// SRS tiers are basic/medium/advanced; remap legacy easy/hard authored in this file.
const DIFFICULTY_MAP = { easy: 'basic', hard: 'advanced' };
function normDifficulty(d) {
  return DIFFICULTY_MAP[d] || d || 'medium';
}

async function addQuestion(chapterId, q) {
  await pool.query(
    `INSERT INTO questions (chapter_id, question_bn, question_en, options, correct_answers, question_type, explanation_bn, explanation_en, difficulty, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'published')`,
    [chapterId, q.bn, q.en, JSON.stringify(q.options), JSON.stringify(q.correct), q.type || 'single', q.explBn, q.explEn, normDifficulty(q.difficulty)]
  );
}

async function buildChapter(subjectCode, classLevel, titleBn, titleEn, orderIndex, notes, questions) {
  const subjectId = await getSubjectId(subjectCode);
  const chapterId = await upsertChapter(subjectId, classLevel, titleBn, titleEn, orderIndex);
  await addContent(chapterId, 'notes', notes.titleBn, notes.titleEn, notes.bodyBn, notes.bodyEn, 1);
  if (notes.formula) {
    await addContent(chapterId, 'formula', notes.formula.titleBn, notes.formula.titleEn, notes.formula.bodyBn, notes.formula.bodyEn, 2);
  }
  const existingQs = await pool.query('SELECT COUNT(*) FROM questions WHERE chapter_id=$1', [chapterId]);
  if (Number(existingQs.rows[0].count) === 0) {
    for (const q of questions) await addQuestion(chapterId, q);
  }
  console.log(`  ✓ ${titleEn} (Class ${classLevel}) — chapter #${chapterId}`);
}

async function main() {
  console.log('Class 9 chapters:');
  await buildChapter('CHE', 9, 'মৌল ও পর্যায় সারণি', 'Elements and the Periodic Table', 2,
    {
      titleBn: 'পর্যায় সারণির গঠন', titleEn: 'Structure of the Periodic Table',
      bodyBn: 'মৌলসমূহকে পারমাণবিক সংখ্যা অনুযায়ী সাজিয়ে পর্যায় সারণি তৈরি করা হয়েছে। সারিকে পর্যায় (period) এবং কলামকে শ্রেণি বা গ্রুপ (group) বলে। একই গ্রুপের মৌলগুলোর রাসায়নিক ধর্ম কাছাকাছি হয় কারণ তাদের সর্ববহিঃস্থ শেলে ইলেকট্রন সংখ্যা একই।',
      bodyEn: 'Elements are arranged in the periodic table by increasing atomic number. Rows are called periods and columns are called groups. Elements in the same group share similar chemical properties because they have the same number of electrons in their outermost shell.',
    },
    [
      { bn: 'পর্যায় সারণিতে মৌলসমূহ কীসের ভিত্তিতে সাজানো?', en: 'Elements in the periodic table are arranged based on which property?',
        options: [{ id: 'a', bn: 'পারমাণবিক সংখ্যা', en: 'Atomic number' }, { id: 'b', bn: 'ভর', en: 'Mass alone' }, { id: 'c', bn: 'রঙ', en: 'Color' }, { id: 'd', bn: 'ঘনত্ব', en: 'Density' }],
        correct: ['a'], explBn: 'আধুনিক পর্যায় সূত্র অনুযায়ী মৌলগুলো ক্রমবর্ধমান পারমাণবিক সংখ্যা অনুযায়ী সাজানো হয়।', explEn: 'The modern periodic law arranges elements by increasing atomic number.' },
      { bn: 'একই গ্রুপের মৌলগুলোর ধর্ম কাছাকাছি হওয়ার কারণ কী?', en: 'Why do elements in the same group have similar properties?',
        options: [{ id: 'a', bn: 'একই পারমাণবিক ভর', en: 'Same atomic mass' }, { id: 'b', bn: 'সর্ববহিঃস্থ শেলে একই ইলেকট্রন সংখ্যা', en: 'Same number of outer-shell electrons' }, { id: 'c', bn: 'একই রঙ', en: 'Same color' }, { id: 'd', bn: 'একই অবস্থা (কঠিন/তরল)', en: 'Same physical state' }],
        correct: ['b'], explBn: 'সর্ববহিঃস্থ শেলের ইলেকট্রন সংখ্যা রাসায়নিক ধর্ম নির্ধারণ করে।', explEn: 'The number of outer-shell electrons determines chemical behavior.' },
      { bn: 'পর্যায় সারণির একটি অনুভূমিক সারিকে কী বলে?', en: 'A horizontal row in the periodic table is called a:',
        options: [{ id: 'a', bn: 'গ্রুপ', en: 'Group' }, { id: 'b', bn: 'পর্যায়', en: 'Period' }, { id: 'c', bn: 'ব্লক', en: 'Block' }, { id: 'd', bn: 'সিরিজ', en: 'Series' }],
        correct: ['b'], explBn: 'অনুভূমিক সারিকে পর্যায় (period) এবং উলম্ব কলামকে গ্রুপ বলে।', explEn: 'A horizontal row is a period; a vertical column is a group.', difficulty: 'easy' },
      { bn: 'নিচের কোনটি একটি নিষ্ক্রিয় গ্যাস (noble gas)?', en: 'Which of the following is a noble gas?',
        options: [{ id: 'a', bn: 'নিয়ন (Ne)', en: 'Neon (Ne)' }, { id: 'b', bn: 'সোডিয়াম (Na)', en: 'Sodium (Na)' }, { id: 'c', bn: 'ক্লোরিন (Cl)', en: 'Chlorine (Cl)' }, { id: 'd', bn: 'ম্যাগনেসিয়াম (Mg)', en: 'Magnesium (Mg)' }],
        correct: ['a'], explBn: 'নিয়ন পর্যায় সারণির শেষ গ্রুপের (গ্রুপ ১৮) একটি নিষ্ক্রিয় গ্যাস।', explEn: 'Neon is a noble gas in group 18, the last group of the periodic table.' },
      { bn: 'বাম থেকে ডানে একটি পর্যায় বরাবর মৌলের ধর্ম কীভাবে পরিবর্তিত হয়?', en: 'How do element properties change from left to right across a period?',
        options: [{ id: 'a', bn: 'ধাতব ধর্ম কমে, অধাতব ধর্ম বাড়ে', en: 'Metallic character decreases, non-metallic character increases' }, { id: 'b', bn: 'কোনো পরিবর্তন হয় না', en: 'No change occurs' }, { id: 'c', bn: 'ধাতব ধর্ম বাড়ে', en: 'Metallic character increases' }, { id: 'd', bn: 'পারমাণবিক সংখ্যা কমে', en: 'Atomic number decreases' }],
        correct: ['a'], explBn: 'পর্যায় বরাবর বাম থেকে ডানে গেলে ধাতব ধর্ম ক্রমশ কমে এবং অধাতব ধর্ম বাড়ে।', explEn: 'Across a period from left to right, metallic character decreases while non-metallic character increases.' },
      { bn: 'আধুনিক পর্যায় সূত্রটি কে প্রস্তাব করেন?', en: 'Who proposed the modern periodic law?',
        options: [{ id: 'a', bn: 'হেনরি মোসলে', en: 'Henry Moseley' }, { id: 'b', bn: 'আইজ্যাক নিউটন', en: 'Isaac Newton' }, { id: 'c', bn: 'চার্লস ডারউইন', en: 'Charles Darwin' }, { id: 'd', bn: 'আলবার্ট আইনস্টাইন', en: 'Albert Einstein' }],
        correct: ['a'], explBn: 'হেনরি মোসলে পারমাণবিক সংখ্যার ভিত্তিতে আধুনিক পর্যায় সূত্র প্রতিষ্ঠা করেন।', explEn: 'Henry Moseley established the modern periodic law based on atomic number.', difficulty: 'hard' },
    ]);

  await buildChapter('PHY', 9, 'বল ও নিউটনের সূত্র', 'Force and Newton\'s Laws of Motion', 2,
    {
      titleBn: 'নিউটনের গতিসূত্র', titleEn: "Newton's Laws of Motion",
      bodyBn: 'প্রথম সূত্র: বাহ্যিক বল প্রয়োগ না করলে স্থির বস্তু স্থির এবং গতিশীল বস্তু সমবেগে সরলরেখায় চলতে থাকে (জড়তা)। দ্বিতীয় সূত্র: বলের পরিমাণ ভর ও ত্বরণের গুণফলের সমান (F=ma)। তৃতীয় সূত্র: প্রতিটি ক্রিয়ার সমান ও বিপরীত প্রতিক্রিয়া থাকে।',
      bodyEn: "First law: an object at rest stays at rest, and a moving object keeps moving at constant velocity, unless acted on by an external force (inertia). Second law: force equals mass times acceleration (F=ma). Third law: every action has an equal and opposite reaction.",
      formula: { titleBn: 'সূত্র', titleEn: 'Formula', bodyBn: 'F = ma\nএখানে F = বল (নিউটন), m = ভর (কেজি), a = ত্বরণ (m/s²)', bodyEn: 'F = ma\nWhere F = force (Newton), m = mass (kg), a = acceleration (m/s^2)' },
    },
    [
      { bn: 'নিউটনের প্রথম সূত্রকে আর কী নামে ডাকা হয়?', en: "Newton's first law is also known as the law of:",
        options: [{ id: 'a', bn: 'জড়তা', en: 'Inertia' }, { id: 'b', bn: 'মহাকর্ষ', en: 'Gravitation' }, { id: 'c', bn: 'ভরবেগ', en: 'Momentum' }, { id: 'd', bn: 'শক্তি', en: 'Energy' }],
        correct: ['a'], explBn: 'নিউটনের প্রথম সূত্র জড়তার সূত্র নামেও পরিচিত।', explEn: "Newton's first law is also called the law of inertia.", difficulty: 'easy' },
      { bn: 'F = ma সূত্রে m এবং a স্থির রেখে F দ্বিগুণ করলে কী হবে?', en: 'In F=ma, if F is doubled while m stays fixed, what happens to a?',
        options: [{ id: 'a', bn: 'a দ্বিগুণ হবে', en: 'a doubles' }, { id: 'b', bn: 'a অর্ধেক হবে', en: 'a halves' }, { id: 'c', bn: 'a অপরিবর্তিত থাকবে', en: 'a stays the same' }, { id: 'd', bn: 'a শূন্য হবে', en: 'a becomes zero' }],
        correct: ['a'], explBn: 'a = F/m, তাই m স্থির রেখে F দ্বিগুণ করলে a-ও দ্বিগুণ হয়।', explEn: 'Since a = F/m, doubling F while m is constant doubles a.' },
      { bn: 'নিউটনের তৃতীয় সূত্র অনুযায়ী প্রতিটি ক্রিয়ার প্রতিক্রিয়া কেমন?', en: "According to Newton's third law, the reaction to every action is:",
        options: [{ id: 'a', bn: 'সমান ও বিপরীত', en: 'Equal and opposite' }, { id: 'b', bn: 'সমান ও একই দিকে', en: 'Equal and in the same direction' }, { id: 'c', bn: 'দ্বিগুণ', en: 'Double' }, { id: 'd', bn: 'শূন্য', en: 'Zero' }],
        correct: ['a'], explBn: 'প্রতিটি ক্রিয়ার একটি সমান মানের কিন্তু বিপরীতমুখী প্রতিক্রিয়া থাকে।', explEn: 'Every action has an equal-magnitude but oppositely directed reaction.', difficulty: 'easy' },
      { bn: 'বলের একক কী?', en: 'What is the SI unit of force?',
        options: [{ id: 'a', bn: 'নিউটন', en: 'Newton' }, { id: 'b', bn: 'জুল', en: 'Joule' }, { id: 'c', bn: 'ওয়াট', en: 'Watt' }, { id: 'd', bn: 'প্যাসকেল', en: 'Pascal' }],
        correct: ['a'], explBn: 'বলের SI একক নিউটন (N) = kg·m/s²।', explEn: 'The SI unit of force is the Newton (N) = kg*m/s^2.', difficulty: 'easy' },
      { bn: 'স্থির অবস্থায় থাকা একটি বস্তু নিজে থেকে গতিশীল হতে পারে না — এটি কোন সূত্রের উদাহরণ?', en: 'An object at rest cannot start moving on its own — this illustrates which law?',
        options: [{ id: 'a', bn: 'প্রথম সূত্র (জড়তা)', en: 'First law (inertia)' }, { id: 'b', bn: 'দ্বিতীয় সূত্র', en: 'Second law' }, { id: 'c', bn: 'তৃতীয় সূত্র', en: 'Third law' }, { id: 'd', bn: 'মহাকর্ষ সূত্র', en: 'Law of gravitation' }],
        correct: ['a'], explBn: 'বাহ্যিক বল প্রয়োগ ছাড়া স্থির বস্তুর গতিশীল হওয়া জড়তার সূত্রের বিরুদ্ধে যায়।', explEn: 'Without an external force, a resting object staying at rest is exactly the law of inertia.' },
      { bn: 'একটি গাড়ি ও ট্রাকের সংঘর্ষে উভয়ে সমান বল অনুভব করে কেন?', en: 'In a car-truck collision, why do both experience equal forces?',
        options: [{ id: 'a', bn: 'নিউটনের তৃতীয় সূত্র অনুযায়ী', en: "Because of Newton's third law" }, { id: 'b', bn: 'কারণ উভয়ের ভর সমান', en: 'Because both have equal mass' }, { id: 'c', bn: 'কারণ উভয়ের বেগ সমান', en: 'Because both have equal velocity' }, { id: 'd', bn: 'এটি সত্য নয়', en: 'This is not true' }],
        correct: ['a'], explBn: 'ক্রিয়া-প্রতিক্রিয়া জোড়ায় বল সবসময় সমান মানের হয়, ভরনির্বিশেষে — নিউটনের তৃতীয় সূত্র।', explEn: "Action-reaction pairs always have equal magnitude forces regardless of mass — Newton's third law.", difficulty: 'hard' },
    ]);

  await buildChapter('PHY', 9, 'কাজ, শক্তি ও ক্ষমতা', 'Work, Energy and Power', 3,
    {
      titleBn: 'কাজ ও শক্তির সংজ্ঞা', titleEn: 'Definitions of Work and Energy',
      bodyBn: 'বল প্রয়োগে বস্তু সরণ ঘটলে কাজ সম্পন্ন হয়েছে বলা হয়। শক্তি হলো কাজ করার সামর্থ্য। গতিশক্তি (গতির কারণে) ও অবস্থিত শক্তি (অবস্থানের কারণে) হলো যান্ত্রিক শক্তির দুই প্রধান রূপ। ক্ষমতা হলো কাজ করার হার (সময়ের সাপেক্ষে)।',
      bodyEn: 'Work is done when a force causes displacement of an object. Energy is the capacity to do work. Kinetic energy (due to motion) and potential energy (due to position) are the two main forms of mechanical energy. Power is the rate at which work is done.',
      formula: { titleBn: 'সূত্র', titleEn: 'Formulas', bodyBn: 'কাজ, W = F × d\nগতিশক্তি, KE = ½mv²\nক্ষমতা, P = W/t', bodyEn: 'Work, W = F x d\nKinetic energy, KE = (1/2)mv^2\nPower, P = W/t' },
    },
    [
      { bn: 'কাজ সম্পন্ন হওয়ার জন্য কী প্রয়োজন?', en: 'What is required for work to be done?',
        options: [{ id: 'a', bn: 'বল প্রয়োগে সরণ', en: 'Force causing displacement' }, { id: 'b', bn: 'শুধু বল প্রয়োগ', en: 'Force alone, no displacement' }, { id: 'c', bn: 'শুধু সরণ', en: 'Displacement alone, no force' }, { id: 'd', bn: 'সময়ের অতিবাহন', en: 'Time passing' }],
        correct: ['a'], explBn: 'কাজ = বল × সরণ; বল প্রয়োগে বাস্তব সরণ না হলে কাজ শূন্য।', explEn: 'Work = force x displacement; without actual displacement, no work is done.', difficulty: 'easy' },
      { bn: 'গতিশক্তির সূত্র কোনটি?', en: 'Which is the formula for kinetic energy?',
        options: [{ id: 'a', bn: 'KE = ½mv²', en: 'KE = (1/2)mv^2' }, { id: 'b', bn: 'KE = mgh', en: 'KE = mgh' }, { id: 'c', bn: 'KE = F/m', en: 'KE = F/m' }, { id: 'd', bn: 'KE = mv', en: 'KE = mv' }],
        correct: ['a'], explBn: 'গতিশক্তি = ½ × ভর × বেগের বর্গ।', explEn: 'Kinetic energy = half times mass times velocity squared.' },
      { bn: 'বেগ দ্বিগুণ হলে গতিশক্তি কতগুণ হবে?', en: 'If velocity doubles, by what factor does kinetic energy increase?',
        options: [{ id: 'a', bn: '৪ গুণ', en: '4 times' }, { id: 'b', bn: '২ গুণ', en: '2 times' }, { id: 'c', bn: '৮ গুণ', en: '8 times' }, { id: 'd', bn: 'অপরিবর্তিত', en: 'Unchanged' }],
        correct: ['a'], explBn: 'KE ∝ v², তাই বেগ দ্বিগুণ হলে গতিশক্তি চারগুণ হয়।', explEn: 'Since KE is proportional to v^2, doubling velocity quadruples kinetic energy.', difficulty: 'hard' },
      { bn: 'ক্ষমতার একক কী?', en: 'What is the SI unit of power?',
        options: [{ id: 'a', bn: 'ওয়াট', en: 'Watt' }, { id: 'b', bn: 'জুল', en: 'Joule' }, { id: 'c', bn: 'নিউটন', en: 'Newton' }, { id: 'd', bn: 'ক্যালরি', en: 'Calorie' }],
        correct: ['a'], explBn: 'ক্ষমতার একক ওয়াট (W) = জুল/সেকেন্ড।', explEn: 'The unit of power is the Watt (W) = Joule/second.', difficulty: 'easy' },
      { bn: 'উঁচু স্থানে থাকা বস্তুর কোন ধরনের শক্তি থাকে?', en: 'An object at height has which type of energy?',
        options: [{ id: 'a', bn: 'অবস্থিত শক্তি', en: 'Potential energy' }, { id: 'b', bn: 'শুধু গতিশক্তি', en: 'Only kinetic energy' }, { id: 'c', bn: 'তাপ শক্তি', en: 'Heat energy' }, { id: 'd', bn: 'কোনো শক্তি নেই', en: 'No energy' }],
        correct: ['a'], explBn: 'অবস্থানের কারণে সঞ্চিত শক্তিকে অবস্থিত শক্তি (potential energy) বলে।', explEn: 'Energy stored due to position is called potential energy.' },
      { bn: 'শক্তির নিত্যতা সূত্র কী বলে?', en: 'What does the law of conservation of energy state?',
        options: [{ id: 'a', bn: 'শক্তি সৃষ্টি বা ধ্বংস করা যায় না, রূপান্তরিত হয় মাত্র', en: 'Energy cannot be created or destroyed, only transformed' }, { id: 'b', bn: 'শক্তি সবসময় বৃদ্ধি পায়', en: 'Energy always increases' }, { id: 'c', bn: 'শক্তি সবসময় হ্রাস পায়', en: 'Energy always decreases' }, { id: 'd', bn: 'শক্তি স্থির থাকে না', en: 'Energy is never conserved' }],
        correct: ['a'], explBn: 'শক্তির নিত্যতা সূত্র অনুযায়ী মোট শক্তি অপরিবর্তিত থাকে, শুধু রূপ পরিবর্তন হয়।', explEn: 'The law of conservation of energy states total energy remains constant, only its form changes.' },
    ]);

  await buildChapter('BIO', 9, 'উদ্ভিদ ও প্রাণীর শ্রেণিবিন্যাস', 'Classification of Plants and Animals', 2,
    {
      titleBn: 'শ্রেণিবিন্যাসের ভিত্তি', titleEn: 'Basis of Classification',
      bodyBn: 'জীবজগৎকে সাদৃশ্য ও পার্থক্যের ভিত্তিতে বিভিন্ন দলে ভাগ করাকে শ্রেণিবিন্যাস বলে। প্রধান স্তরগুলো হলো: জগৎ, পর্ব, শ্রেণি, বর্গ, গোত্র, গণ ও প্রজাতি। উদ্ভিদজগৎকে সপুষ্পক ও অপুষ্পক এবং প্রাণিজগৎকে মেরুদণ্ডী ও অমেরুদণ্ডী — এভাবে প্রধানত ভাগ করা হয়।',
      bodyEn: 'Classification is the grouping of organisms based on their similarities and differences. The main taxonomic ranks are: Kingdom, Phylum, Class, Order, Family, Genus, and Species. Plants are broadly divided into flowering and non-flowering, and animals into vertebrates and invertebrates.',
    },
    [
      { bn: 'শ্রেণিবিন্যাসের সর্বোচ্চ স্তর কোনটি?', en: 'What is the highest rank in taxonomic classification?',
        options: [{ id: 'a', bn: 'জগৎ (Kingdom)', en: 'Kingdom' }, { id: 'b', bn: 'প্রজাতি (Species)', en: 'Species' }, { id: 'c', bn: 'গণ (Genus)', en: 'Genus' }, { id: 'd', bn: 'পর্ব (Phylum)', en: 'Phylum' }],
        correct: ['a'], explBn: 'জগৎ (Kingdom) হলো শ্রেণিবিন্যাসের সর্বোচ্চ ও সবচেয়ে বিস্তৃত স্তর।', explEn: 'Kingdom is the highest and broadest taxonomic rank.', difficulty: 'easy' },
      { bn: 'মেরুদণ্ডী প্রাণীর বৈশিষ্ট্য কী?', en: 'What is the defining feature of vertebrates?',
        options: [{ id: 'a', bn: 'একটি মেরুদণ্ড থাকে', en: 'They have a backbone' }, { id: 'b', bn: 'পাখা থাকে', en: 'They have wings' }, { id: 'c', bn: 'জলে বাস করে', en: 'They live in water' }, { id: 'd', bn: 'সালোকসংশ্লেষণ করে', en: 'They photosynthesize' }],
        correct: ['a'], explBn: 'মেরুদণ্ডী প্রাণীর দেহে একটি মেরুদণ্ড বা কশেরুকা দণ্ড থাকে।', explEn: 'Vertebrates are defined by having a backbone (vertebral column).', difficulty: 'easy' },
      { bn: 'সপুষ্পক উদ্ভিদের বৈশিষ্ট্য কী?', en: 'What characterizes flowering plants?',
        options: [{ id: 'a', bn: 'ফুল উৎপন্ন করে ও বীজের মাধ্যমে বংশবিস্তার করে', en: 'They produce flowers and reproduce via seeds' }, { id: 'b', bn: 'কখনো ফুল হয় না', en: 'They never flower' }, { id: 'c', bn: 'শুধু স্পোরের মাধ্যমে বংশবিস্তার করে', en: 'They reproduce only via spores' }, { id: 'd', bn: 'মূল থাকে না', en: 'They have no roots' }],
        correct: ['a'], explBn: 'সপুষ্পক উদ্ভিদ ফুল উৎপন্ন করে এবং বীজের মাধ্যমে বংশবিস্তার করে।', explEn: 'Flowering plants produce flowers and reproduce through seeds.' },
      { bn: 'কোনটি অমেরুদণ্ডী প্রাণীর উদাহরণ?', en: 'Which of these is an example of an invertebrate?',
        options: [{ id: 'a', bn: 'কেঁচো', en: 'Earthworm' }, { id: 'b', bn: 'মানুষ', en: 'Human' }, { id: 'c', bn: 'পাখি', en: 'Bird' }, { id: 'd', bn: 'মাছ', en: 'Fish' }],
        correct: ['a'], explBn: 'কেঁচোর মেরুদণ্ড নেই, তাই এটি একটি অমেরুদণ্ডী প্রাণী।', explEn: 'An earthworm has no backbone, making it an invertebrate.' },
      { bn: 'শ্রেণিবিন্যাসের সবচেয়ে ছোট (specific) স্তর কোনটি?', en: 'Which is the smallest, most specific taxonomic rank?',
        options: [{ id: 'a', bn: 'প্রজাতি (Species)', en: 'Species' }, { id: 'b', bn: 'জগৎ (Kingdom)', en: 'Kingdom' }, { id: 'c', bn: 'পর্ব (Phylum)', en: 'Phylum' }, { id: 'd', bn: 'শ্রেণি (Class)', en: 'Class' }],
        correct: ['a'], explBn: 'প্রজাতি (Species) শ্রেণিবিন্যাসের সবচেয়ে নির্দিষ্ট ও সংকীর্ণ স্তর।', explEn: 'Species is the narrowest, most specific taxonomic rank.', difficulty: 'easy' },
      { bn: 'দ্বিপদ নামকরণ পদ্ধতি (Binomial Nomenclature) প্রবর্তন করেন কে?', en: 'Who introduced binomial nomenclature?',
        options: [{ id: 'a', bn: 'ক্যারোলাস লিনিয়াস', en: 'Carolus Linnaeus' }, { id: 'b', bn: 'চার্লস ডারউইন', en: 'Charles Darwin' }, { id: 'c', bn: 'গ্রেগর মেন্ডেল', en: 'Gregor Mendel' }, { id: 'd', bn: 'লুই পাস্তুর', en: 'Louis Pasteur' }],
        correct: ['a'], explBn: 'ক্যারোলাস লিনিয়াস প্রতিটি প্রজাতিকে দুটি নাম (গণ + প্রজাতি) দিয়ে নামকরণের পদ্ধতি প্রবর্তন করেন।', explEn: 'Carolus Linnaeus introduced naming each species with two names (genus + species).', difficulty: 'hard' },
    ]);

  await buildChapter('ICT', 9, 'কম্পিউটার ও তথ্য প্রযুক্তির ভূমিকা', 'Introduction to Computers and ICT', 2,
    {
      titleBn: 'কম্পিউটারের মূল উপাদান', titleEn: 'Basic Components of a Computer',
      bodyBn: 'কম্পিউটারের প্রধান অংশ হলো হার্ডওয়্যার (যা স্পর্শ করা যায়, যেমন কীবোর্ড, মনিটর, সিপিইউ) এবং সফটওয়্যার (প্রোগ্রাম ও নির্দেশনা)। ইনপুট ডিভাইস (যেমন কীবোর্ড, মাউস) ডেটা প্রবেশ করায়, প্রসেসর তা প্রক্রিয়া করে, আর আউটপুট ডিভাইস (যেমন মনিটর, প্রিন্টার) ফলাফল প্রদর্শন করে।',
      bodyEn: 'The main parts of a computer are hardware (physical, touchable parts like keyboard, monitor, CPU) and software (programs and instructions). Input devices (keyboard, mouse) feed in data, the processor processes it, and output devices (monitor, printer) display the result.',
    },
    [
      { bn: 'নিচের কোনটি একটি ইনপুট ডিভাইস?', en: 'Which of the following is an input device?',
        options: [{ id: 'a', bn: 'কীবোর্ড', en: 'Keyboard' }, { id: 'b', bn: 'মনিটর', en: 'Monitor' }, { id: 'c', bn: 'প্রিন্টার', en: 'Printer' }, { id: 'd', bn: 'স্পিকার', en: 'Speaker' }],
        correct: ['a'], explBn: 'কীবোর্ড দিয়ে ডেটা কম্পিউটারে প্রবেশ করানো হয়, তাই এটি ইনপুট ডিভাইস।', explEn: 'A keyboard feeds data into the computer, making it an input device.', difficulty: 'easy' },
      { bn: 'কম্পিউটার প্রোগ্রামকে কী বলা হয়?', en: 'A computer program is classified as:',
        options: [{ id: 'a', bn: 'সফটওয়্যার', en: 'Software' }, { id: 'b', bn: 'হার্ডওয়্যার', en: 'Hardware' }, { id: 'c', bn: 'ফার্মওয়্যার শুধু', en: 'Only firmware' }, { id: 'd', bn: 'নেটওয়ার্ক ডিভাইস', en: 'A network device' }],
        correct: ['a'], explBn: 'প্রোগ্রাম ও নির্দেশনার সমষ্টিকে সফটওয়্যার বলে।', explEn: 'A collection of programs and instructions is called software.', difficulty: 'easy' },
      { bn: 'তথ্য প্রক্রিয়াকরণের প্রধান অংশ কোনটি?', en: 'Which part is primarily responsible for data processing?',
        options: [{ id: 'a', bn: 'প্রসেসর (CPU)', en: 'Processor (CPU)' }, { id: 'b', bn: 'কীবোর্ড', en: 'Keyboard' }, { id: 'c', bn: 'স্পিকার', en: 'Speaker' }, { id: 'd', bn: 'মাউস', en: 'Mouse' }],
        correct: ['a'], explBn: 'সিপিইউ (Central Processing Unit) ডেটা প্রক্রিয়াকরণের মূল অংশ।', explEn: 'The CPU (Central Processing Unit) is the main data-processing component.' },
      { bn: 'নিচের কোনটি আউটপুট ডিভাইস?', en: 'Which of the following is an output device?',
        options: [{ id: 'a', bn: 'মনিটর', en: 'Monitor' }, { id: 'b', bn: 'কীবোর্ড', en: 'Keyboard' }, { id: 'c', bn: 'মাউস', en: 'Mouse' }, { id: 'd', bn: 'স্ক্যানার', en: 'Scanner' }],
        correct: ['a'], explBn: 'মনিটর ফলাফল প্রদর্শন করে, তাই এটি আউটপুট ডিভাইস।', explEn: 'A monitor displays results, making it an output device.', difficulty: 'easy' },
      { bn: 'ICT শব্দের পূর্ণরূপ কী?', en: 'What does ICT stand for?',
        options: [{ id: 'a', bn: 'তথ্য ও যোগাযোগ প্রযুক্তি', en: 'Information and Communication Technology' }, { id: 'b', bn: 'ইন্টারনেট কন্ট্রোল টেকনোলজি', en: 'Internet Control Technology' }, { id: 'c', bn: 'ইন্টিগ্রেটেড কম্পিউটার টুল', en: 'Integrated Computer Tool' }, { id: 'd', bn: 'ইনফরমেশন কোডিং টেকনিক', en: 'Information Coding Technique' }],
        correct: ['a'], explBn: 'ICT = Information and Communication Technology (তথ্য ও যোগাযোগ প্রযুক্তি)।', explEn: 'ICT stands for Information and Communication Technology.', difficulty: 'easy' },
      { bn: 'র‍্যাম (RAM) এর প্রধান বৈশিষ্ট্য কী?', en: 'What is the main characteristic of RAM?',
        options: [{ id: 'a', bn: 'এটি অস্থায়ী মেমোরি — বিদ্যুৎ না থাকলে ডেটা মুছে যায়', en: 'It is volatile memory — data is lost when power is off' }, { id: 'b', bn: 'এটি স্থায়ীভাবে ডেটা সংরক্ষণ করে', en: 'It permanently stores data' }, { id: 'c', bn: 'এটি একটি ইনপুট ডিভাইস', en: 'It is an input device' }, { id: 'd', bn: 'এটি প্রিন্ট করতে ব্যবহৃত হয়', en: 'It is used for printing' }],
        correct: ['a'], explBn: 'RAM (Random Access Memory) অস্থায়ী মেমোরি, বিদ্যুৎ সংযোগ বিচ্ছিন্ন হলে এতে থাকা ডেটা মুছে যায়।', explEn: 'RAM is volatile memory — its data is erased when power is disconnected.', difficulty: 'medium' },
    ]);

  console.log('\nClass 10 chapters:');
  await buildChapter('CHE', 10, 'রাসায়নিক বন্ধন', 'Chemical Bonding', 2,
    {
      titleBn: 'আয়নিক ও সমযোজী বন্ধন', titleEn: 'Ionic and Covalent Bonds',
      bodyBn: 'পরমাণুসমূহ স্থিতিশীল ইলেকট্রন বিন্যাস অর্জনের জন্য বন্ধন গঠন করে। ইলেকট্রন হস্তান্তরের মাধ্যমে গঠিত বন্ধনকে আয়নিক বন্ধন বলে (যেমন NaCl), আর ইলেকট্রন ভাগাভাগির মাধ্যমে গঠিত বন্ধনকে সমযোজী বন্ধন বলে (যেমন H₂O)।',
      bodyEn: 'Atoms form bonds to achieve a stable electron configuration. A bond formed by transferring electrons is called an ionic bond (e.g. NaCl); a bond formed by sharing electrons is called a covalent bond (e.g. H2O).',
    },
    [
      { bn: 'NaCl-এ কোন ধরনের বন্ধন থাকে?', en: 'What type of bond exists in NaCl?',
        options: [{ id: 'a', bn: 'আয়নিক বন্ধন', en: 'Ionic bond' }, { id: 'b', bn: 'সমযোজী বন্ধন', en: 'Covalent bond' }, { id: 'c', bn: 'ধাতব বন্ধন', en: 'Metallic bond' }, { id: 'd', bn: 'কোনো বন্ধন নেই', en: 'No bond' }],
        correct: ['a'], explBn: 'Na থেকে Cl-এ ইলেকট্রন হস্তান্তরের মাধ্যমে NaCl-এ আয়নিক বন্ধন গঠিত হয়।', explEn: 'NaCl forms an ionic bond through electron transfer from Na to Cl.', difficulty: 'easy' },
      { bn: 'সমযোজী বন্ধন কীভাবে গঠিত হয়?', en: 'How is a covalent bond formed?',
        options: [{ id: 'a', bn: 'ইলেকট্রন ভাগাভাগির মাধ্যমে', en: 'By sharing electrons' }, { id: 'b', bn: 'ইলেকট্রন সম্পূর্ণ হস্তান্তরের মাধ্যমে', en: 'By fully transferring electrons' }, { id: 'c', bn: 'প্রোটন বিনিময়ের মাধ্যমে', en: 'By exchanging protons' }, { id: 'd', bn: 'নিউট্রন বিনিময়ের মাধ্যমে', en: 'By exchanging neutrons' }],
        correct: ['a'], explBn: 'দুটি পরমাণু ইলেকট্রন জোড় ভাগাভাগি করে সমযোজী বন্ধন গঠন করে।', explEn: 'Two atoms share a pair of electrons to form a covalent bond.' },
      { bn: 'পরমাণু কেন বন্ধন গঠন করে?', en: 'Why do atoms form bonds?',
        options: [{ id: 'a', bn: 'স্থিতিশীল ইলেকট্রন বিন্যাস অর্জনের জন্য', en: 'To achieve a stable electron configuration' }, { id: 'b', bn: 'ভর বাড়ানোর জন্য', en: 'To increase mass' }, { id: 'c', bn: 'রঙ পরিবর্তনের জন্য', en: 'To change color' }, { id: 'd', bn: 'তাপমাত্রা বাড়ানোর জন্য', en: 'To increase temperature' }],
        correct: ['a'], explBn: 'পরমাণু নিষ্ক্রিয় গ্যাসের মতো স্থিতিশীল ইলেকট্রন বিন্যাস অর্জনের জন্য বন্ধন গঠন করে।', explEn: 'Atoms bond to achieve a stable, noble-gas-like electron configuration.', difficulty: 'easy' },
      { bn: 'H₂O অণুতে কোন ধরনের বন্ধন থাকে?', en: 'What type of bond exists in an H2O molecule?',
        options: [{ id: 'a', bn: 'সমযোজী বন্ধন', en: 'Covalent bond' }, { id: 'b', bn: 'আয়নিক বন্ধন', en: 'Ionic bond' }, { id: 'c', bn: 'ধাতব বন্ধন', en: 'Metallic bond' }, { id: 'd', bn: 'হাইড্রোজেন বন্ধন শুধু', en: 'Only hydrogen bonding' }],
        correct: ['a'], explBn: 'অক্সিজেন ও হাইড্রোজেন পরমাণু ইলেকট্রন ভাগাভাগি করে H₂O গঠন করে — এটি সমযোজী বন্ধন।', explEn: 'Oxygen and hydrogen atoms share electrons to form H2O — a covalent bond.' },
      { bn: 'ধাতু ও অধাতুর মধ্যে সাধারণত কোন বন্ধন গঠিত হয়?', en: 'What type of bond typically forms between a metal and a non-metal?',
        options: [{ id: 'a', bn: 'আয়নিক বন্ধন', en: 'Ionic bond' }, { id: 'b', bn: 'সমযোজী বন্ধন', en: 'Covalent bond' }, { id: 'c', bn: 'কোনো বন্ধনই না', en: 'No bond at all' }, { id: 'd', bn: 'নিউক্লিয়ার বন্ধন', en: 'Nuclear bond' }],
        correct: ['a'], explBn: 'ধাতু ইলেকট্রন ত্যাগ করে ও অধাতু গ্রহণ করে, ফলে আয়নিক বন্ধন গঠিত হয়।', explEn: 'Metals lose electrons and non-metals gain them, forming an ionic bond.' },
      { bn: 'আয়নিক যৌগের একটি সাধারণ বৈশিষ্ট্য কী?', en: 'A common property of ionic compounds is:',
        options: [{ id: 'a', bn: 'উচ্চ গলনাঙ্ক', en: 'High melting point' }, { id: 'b', bn: 'নিম্ন গলনাঙ্ক', en: 'Low melting point' }, { id: 'c', bn: 'বিদ্যুৎ পরিবহন করে না কঠিন অবস্থায়ও', en: 'Never conducts electricity even when dissolved' }, { id: 'd', bn: 'সবসময় গ্যাসীয়', en: 'Always gaseous' }],
        correct: ['a'], explBn: 'আয়নিক যৌগে আয়নসমূহের মধ্যে শক্তিশালী আকর্ষণ বল থাকায় এদের গলনাঙ্ক উচ্চ হয়।', explEn: 'Strong electrostatic attraction between ions gives ionic compounds high melting points.', difficulty: 'medium' },
    ]);

  await buildChapter('CHE', 10, 'ধাতুবিদ্যা', 'Metallurgy', 3,
    {
      titleBn: 'ধাতুবিদ্যার ভূমিকা', titleEn: 'Introduction to Metallurgy',
      bodyBn: 'ধাতুবিদ্যা হলো আকরিক থেকে ধাতু নিষ্কাশন ও বিশুদ্ধকরণের বিজ্ঞান। প্রধান ধাপগুলো হলো: আকরিক সংগ্রহ, গুঁড়ো করা ও ঘনীভবন, বিজারণ (ধাতু নিষ্কাশন) এবং বিশুদ্ধকরণ। ধাতুর সক্রিয়তা অনুযায়ী নিষ্কাশন পদ্ধতি ভিন্ন হয় — অতি সক্রিয় ধাতু তড়িৎ বিশ্লেষণে এবং মাঝারি সক্রিয় ধাতু বিজারণ প্রক্রিয়ায় নিষ্কাশিত হয়।',
      bodyEn: 'Metallurgy is the science of extracting and purifying metals from their ores. The main steps are: ore collection, crushing and concentration, reduction (extraction), and purification. The extraction method depends on the metal\'s reactivity — highly reactive metals are extracted by electrolysis, moderately reactive ones by reduction processes.',
    },
    [
      { bn: 'ধাতুবিদ্যা বলতে কী বোঝায়?', en: 'What does metallurgy refer to?',
        options: [{ id: 'a', bn: 'আকরিক থেকে ধাতু নিষ্কাশন ও বিশুদ্ধকরণ', en: 'Extraction and purification of metals from ore' }, { id: 'b', bn: 'শুধু ধাতুর রঙ পরিবর্তন', en: 'Only changing the color of metal' }, { id: 'c', bn: 'উদ্ভিদের শ্রেণিবিন্যাস', en: 'Classification of plants' }, { id: 'd', bn: 'পানি বিশুদ্ধকরণ', en: 'Water purification' }],
        correct: ['a'], explBn: 'ধাতুবিদ্যা (Metallurgy) আকরিক থেকে ধাতু নিষ্কাশন ও প্রক্রিয়াকরণের বিজ্ঞান।', explEn: 'Metallurgy is the science of extracting and processing metals from ore.', difficulty: 'easy' },
      { bn: 'অতি সক্রিয় ধাতু (যেমন সোডিয়াম) কীভাবে নিষ্কাশন করা হয়?', en: 'How are highly reactive metals (e.g. sodium) extracted?',
        options: [{ id: 'a', bn: 'তড়িৎ বিশ্লেষণের মাধ্যমে', en: 'By electrolysis' }, { id: 'b', bn: 'সাধারণ গরম করে', en: 'By simple heating' }, { id: 'c', bn: 'পানিতে দ্রবীভূত করে', en: 'By dissolving in water' }, { id: 'd', bn: 'ছাঁকনির মাধ্যমে', en: 'By filtration' }],
        correct: ['a'], explBn: 'সোডিয়ামের মতো অতি সক্রিয় ধাতু গলিত অবস্থায় তড়িৎ বিশ্লেষণের মাধ্যমে নিষ্কাশিত হয়।', explEn: 'Highly reactive metals like sodium are extracted by electrolysis of their molten compounds.' },
      { bn: 'আকরিক গুঁড়ো করে ঘনীভবনের উদ্দেশ্য কী?', en: 'What is the purpose of crushing and concentrating ore?',
        options: [{ id: 'a', bn: 'অপ্রয়োজনীয় ভেজাল দূর করে ধাতুর অনুপাত বাড়ানো', en: 'To remove unwanted impurities and increase metal proportion' }, { id: 'b', bn: 'ধাতুর রঙ পরিবর্তন করা', en: 'To change the color of the metal' }, { id: 'c', bn: 'ধাতুকে গ্যাসে রূপান্তর করা', en: 'To convert the metal into a gas' }, { id: 'd', bn: 'ওজন বৃদ্ধি করা', en: 'To increase weight' }],
        correct: ['a'], explBn: 'ঘনীভবনের মাধ্যমে আকরিক থেকে অপ্রয়োজনীয় পদার্থ সরিয়ে ধাতব উপাদানের ঘনত্ব বাড়ানো হয়।', explEn: 'Concentration removes unwanted material from ore, increasing the proportion of the metal compound.' },
      { bn: 'নিষ্কাশনের পর ধাতুকে কেন বিশুদ্ধ করা হয়?', en: 'Why is a metal purified after extraction?',
        options: [{ id: 'a', bn: 'ভেজাল দূর করে ব্যবহারযোগ্য বিশুদ্ধ ধাতু পাওয়ার জন্য', en: 'To remove impurities and get usable pure metal' }, { id: 'b', bn: 'ধাতুকে ভারী করার জন্য', en: 'To make the metal heavier' }, { id: 'c', bn: 'রঙ পরিবর্তনের জন্য', en: 'To change its color' }, { id: 'd', bn: 'কোনো কারণ নেই', en: 'There is no reason' }],
        correct: ['a'], explBn: 'নিষ্কাশিত ধাতুতে সাধারণত কিছু ভেজাল থাকে, যা বিশুদ্ধকরণের মাধ্যমে দূর করা হয়।', explEn: 'Extracted metal usually contains impurities, which purification removes.', difficulty: 'easy' },
      { bn: 'নিষ্কাশন পদ্ধতি নির্বাচনে প্রধান নির্ধারক কী?', en: 'What is the main factor determining the extraction method used?',
        options: [{ id: 'a', bn: 'ধাতুর সক্রিয়তা', en: "The metal's reactivity" }, { id: 'b', bn: 'ধাতুর রঙ', en: "The metal's color" }, { id: 'c', bn: 'আকরিকের ওজন', en: "The ore's weight" }, { id: 'd', bn: 'আবহাওয়া', en: 'The weather' }],
        correct: ['a'], explBn: 'ধাতুর সক্রিয়তা সিরিজে অবস্থান অনুযায়ী নিষ্কাশন পদ্ধতি (তড়িৎ বিশ্লেষণ/বিজারণ) নির্ধারিত হয়।', explEn: "A metal's position in the reactivity series determines its extraction method (electrolysis vs. reduction).", difficulty: 'medium' },
      { bn: 'মাঝারি সক্রিয় ধাতু (যেমন লোহা) সাধারণত কোন পদ্ধতিতে নিষ্কাশিত হয়?', en: 'Moderately reactive metals (e.g. iron) are typically extracted by:',
        options: [{ id: 'a', bn: 'বিজারণ প্রক্রিয়া (যেমন কার্বন দ্বারা বিজারণ)', en: 'Reduction process (e.g. reduction with carbon)' }, { id: 'b', bn: 'তড়িৎ বিশ্লেষণ শুধু', en: 'Only electrolysis' }, { id: 'c', bn: 'কোনো প্রক্রিয়াই দরকার নেই', en: 'No process is needed' }, { id: 'd', bn: 'পাতন', en: 'Distillation' }],
        correct: ['a'], explBn: 'লোহার মতো মাঝারি সক্রিয় ধাতু সাধারণত কার্বন দ্বারা বিজারণ প্রক্রিয়ায় নিষ্কাশিত হয় (ব্লাস্ট ফার্নেস)।', explEn: 'Moderately reactive metals like iron are typically extracted via reduction with carbon (blast furnace).', difficulty: 'medium' },
    ]);

  await buildChapter('PHY', 10, 'তড়িৎ প্রবাহ ও বর্তনী', 'Electric Current and Circuits', 2,
    {
      titleBn: 'তড়িৎ প্রবাহ ও ওহমের সূত্র', titleEn: "Electric Current and Ohm's Law",
      bodyBn: 'তড়িৎ প্রবাহ হলো একটি পরিবাহীর মধ্য দিয়ে ইলেকট্রনের প্রবাহের হার। ওহমের সূত্র অনুযায়ী, স্থির তাপমাত্রায় একটি পরিবাহীর প্রান্তদ্বয়ের বিভব পার্থক্য প্রবাহের সমানুপাতিক। সিরিজ বর্তনীতে একই প্রবাহ প্রবাহিত হয়, প্যারালাল বর্তনীতে বিভব পার্থক্য একই থাকে।',
      bodyEn: 'Electric current is the rate of flow of electrons through a conductor. According to Ohm\'s law, at constant temperature, the potential difference across a conductor is proportional to the current through it. In a series circuit the same current flows throughout; in a parallel circuit the voltage across each branch is the same.',
      formula: { titleBn: 'সূত্র', titleEn: 'Formula', bodyBn: 'V = IR\nএখানে V = বিভব পার্থক্য (ভোল্ট), I = প্রবাহ (অ্যাম্পিয়ার), R = রোধ (ওহম)', bodyEn: 'V = IR\nWhere V = voltage (Volts), I = current (Amperes), R = resistance (Ohms)' },
    },
    [
      { bn: 'ওহমের সূত্র অনুযায়ী V, I ও R-এর সম্পর্ক কী?', en: "According to Ohm's law, what is the relationship between V, I, and R?",
        options: [{ id: 'a', bn: 'V = IR', en: 'V = IR' }, { id: 'b', bn: 'V = I/R', en: 'V = I/R' }, { id: 'c', bn: 'V = I + R', en: 'V = I + R' }, { id: 'd', bn: 'V = R/I', en: 'V = R/I' }],
        correct: ['a'], explBn: 'ওহমের সূত্র: V = IR, অর্থাৎ বিভব পার্থক্য প্রবাহ ও রোধের গুণফলের সমান।', explEn: "Ohm's law: V = IR, voltage equals current times resistance.", difficulty: 'easy' },
      { bn: 'সিরিজ বর্তনীর একটি বৈশিষ্ট্য কী?', en: 'A characteristic of a series circuit is:',
        options: [{ id: 'a', bn: 'প্রতিটি উপাদানে একই প্রবাহ প্রবাহিত হয়', en: 'The same current flows through every component' }, { id: 'b', bn: 'প্রতিটি উপাদানে ভিন্ন প্রবাহ প্রবাহিত হয়', en: 'Different current flows through each component' }, { id: 'c', bn: 'বিভব পার্থক্য সব জায়গায় সমান', en: 'Voltage is the same everywhere' }, { id: 'd', bn: 'কোনো প্রবাহ থাকে না', en: 'There is no current' }],
        correct: ['a'], explBn: 'সিরিজ সংযোগে একই পথে প্রবাহ যায় বলে সব উপাদানে প্রবাহ সমান থাকে।', explEn: 'In series, current has only one path, so it is the same through every component.' },
      { bn: 'তড়িৎ প্রবাহের একক কী?', en: 'What is the SI unit of electric current?',
        options: [{ id: 'a', bn: 'অ্যাম্পিয়ার', en: 'Ampere' }, { id: 'b', bn: 'ভোল্ট', en: 'Volt' }, { id: 'c', bn: 'ওহম', en: 'Ohm' }, { id: 'd', bn: 'ওয়াট', en: 'Watt' }],
        correct: ['a'], explBn: 'তড়িৎ প্রবাহের একক অ্যাম্পিয়ার (A)।', explEn: 'The SI unit of electric current is the Ampere (A).', difficulty: 'easy' },
      { bn: 'প্যারালাল বর্তনীতে প্রতিটি শাখায় কী সমান থাকে?', en: 'In a parallel circuit, what remains the same across each branch?',
        options: [{ id: 'a', bn: 'বিভব পার্থক্য', en: 'Voltage' }, { id: 'b', bn: 'প্রবাহ', en: 'Current' }, { id: 'c', bn: 'রোধ', en: 'Resistance' }, { id: 'd', bn: 'ক্ষমতা', en: 'Power' }],
        correct: ['a'], explBn: 'প্যারালাল সংযোগে প্রতিটি শাখার প্রান্তে বিভব পার্থক্য একই থাকে।', explEn: 'In a parallel connection, the voltage across each branch is the same.' },
      { bn: 'একটি পরিবাহীর রোধ বাড়ালে (V স্থির রেখে) প্রবাহের কী হবে?', en: 'If resistance increases (with V constant), what happens to current?',
        options: [{ id: 'a', bn: 'প্রবাহ কমবে', en: 'Current decreases' }, { id: 'b', bn: 'প্রবাহ বাড়বে', en: 'Current increases' }, { id: 'c', bn: 'প্রবাহ অপরিবর্তিত থাকবে', en: 'Current stays the same' }, { id: 'd', bn: 'প্রবাহ শূন্য হবে', en: 'Current becomes zero' }],
        correct: ['a'], explBn: 'I = V/R, তাই V স্থির রেখে R বাড়ালে I কমে।', explEn: 'Since I = V/R, increasing R while V stays constant decreases I.', difficulty: 'medium' },
      { bn: 'ভোল্টমিটার একটি বর্তনীতে কীভাবে সংযুক্ত করা হয়?', en: 'How is a voltmeter connected in a circuit?',
        options: [{ id: 'a', bn: 'প্যারালালে', en: 'In parallel' }, { id: 'b', bn: 'সিরিজে', en: 'In series' }, { id: 'c', bn: 'সংযুক্ত করা যায় না', en: 'It cannot be connected' }, { id: 'd', bn: 'শুধু ব্যাটারির সাথে', en: 'Only with the battery' }],
        correct: ['a'], explBn: 'ভোল্টমিটার সবসময় যে উপাদানের বিভব পার্থক্য মাপা হচ্ছে তার সাথে প্যারালালে সংযুক্ত করা হয়।', explEn: 'A voltmeter is always connected in parallel with the component whose voltage is being measured.', difficulty: 'medium' },
    ]);

  await buildChapter('BIO', 10, 'সালোকসংশ্লেষণ', 'Photosynthesis', 2,
    {
      titleBn: 'সালোকসংশ্লেষণ প্রক্রিয়া', titleEn: 'The Process of Photosynthesis',
      bodyBn: 'সালোকসংশ্লেষণ হলো সেই প্রক্রিয়া যার মাধ্যমে সবুজ উদ্ভিদ সূর্যালোক, পানি ও কার্বন-ডাই-অক্সাইড ব্যবহার করে গ্লুকোজ ও অক্সিজেন উৎপন্ন করে। এই প্রক্রিয়া পাতার ক্লোরোপ্লাস্টে সংঘটিত হয়, যেখানে ক্লোরোফিল সূর্যালোক শোষণ করে।',
      bodyEn: 'Photosynthesis is the process by which green plants use sunlight, water, and carbon dioxide to produce glucose and oxygen. It occurs in the chloroplasts of leaves, where chlorophyll absorbs sunlight.',
      formula: { titleBn: 'সমীকরণ', titleEn: 'Equation', bodyBn: '৬CO₂ + ৬H₂O + সূর্যালোক → C₆H₁₂O₆ + ৬O₂', bodyEn: '6CO2 + 6H2O + sunlight -> C6H12O6 + 6O2' },
    },
    [
      { bn: 'সালোকসংশ্লেষণ কোথায় সংঘটিত হয়?', en: 'Where does photosynthesis take place?',
        options: [{ id: 'a', bn: 'ক্লোরোপ্লাস্টে', en: 'In the chloroplast' }, { id: 'b', bn: 'মাইটোকন্ড্রিয়ায়', en: 'In the mitochondria' }, { id: 'c', bn: 'নিউক্লিয়াসে', en: 'In the nucleus' }, { id: 'd', bn: 'কোষপ্রাচীরে', en: 'In the cell wall' }],
        correct: ['a'], explBn: 'ক্লোরোপ্লাস্টে থাকা ক্লোরোফিল সূর্যালোক শোষণ করে সালোকসংশ্লেষণ ঘটায়।', explEn: 'Chlorophyll in the chloroplast absorbs sunlight to drive photosynthesis.', difficulty: 'easy' },
      { bn: 'সালোকসংশ্লেষণের জন্য কোন গ্যাস প্রয়োজন?', en: 'Which gas is required for photosynthesis?',
        options: [{ id: 'a', bn: 'কার্বন-ডাই-অক্সাইড', en: 'Carbon dioxide' }, { id: 'b', bn: 'নাইট্রোজেন', en: 'Nitrogen' }, { id: 'c', bn: 'হাইড্রোজেন', en: 'Hydrogen' }, { id: 'd', bn: 'অক্সিজেন শুধু', en: 'Only oxygen' }],
        correct: ['a'], explBn: 'উদ্ভিদ বায়ু থেকে কার্বন-ডাই-অক্সাইড গ্রহণ করে সালোকসংশ্লেষণে ব্যবহার করে।', explEn: 'Plants take in carbon dioxide from the air and use it in photosynthesis.', difficulty: 'easy' },
      { bn: 'সালোকসংশ্লেষণের ফলে কোন গ্যাস নির্গত হয়?', en: 'Which gas is released as a result of photosynthesis?',
        options: [{ id: 'a', bn: 'অক্সিজেন', en: 'Oxygen' }, { id: 'b', bn: 'কার্বন-ডাই-অক্সাইড', en: 'Carbon dioxide' }, { id: 'c', bn: 'নাইট্রোজেন', en: 'Nitrogen' }, { id: 'd', bn: 'মিথেন', en: 'Methane' }],
        correct: ['a'], explBn: 'সালোকসংশ্লেষণে পানি বিভাজিত হয়ে অক্সিজেন গ্যাস নির্গত হয়।', explEn: 'Water is split during photosynthesis, releasing oxygen gas as a byproduct.' },
      { bn: 'সালোকসংশ্লেষণে উৎপন্ন খাদ্য কোনটি?', en: 'What food is produced by photosynthesis?',
        options: [{ id: 'a', bn: 'গ্লুকোজ', en: 'Glucose' }, { id: 'b', bn: 'প্রোটিন', en: 'Protein' }, { id: 'c', bn: 'ভিটামিন', en: 'Vitamin' }, { id: 'd', bn: 'চর্বি', en: 'Fat' }],
        correct: ['a'], explBn: 'সালোকসংশ্লেষণের মূল উৎপাদ গ্লুকোজ (একটি শর্করা)।', explEn: 'The main product of photosynthesis is glucose, a sugar.' },
      { bn: 'ক্লোরোফিলের কাজ কী?', en: 'What is the function of chlorophyll?',
        options: [{ id: 'a', bn: 'সূর্যালোক শোষণ করা', en: 'To absorb sunlight' }, { id: 'b', bn: 'পানি সঞ্চয় করা', en: 'To store water' }, { id: 'c', bn: 'বংশগতির তথ্য বহন করা', en: 'To carry hereditary information' }, { id: 'd', bn: 'শ্বসন ঘটানো', en: 'To perform respiration' }],
        correct: ['a'], explBn: 'ক্লোরোফিল সবুজ রঞ্জক পদার্থ যা সূর্যালোক শোষণ করে সালোকসংশ্লেষণে ব্যবহারের জন্য শক্তি সরবরাহ করে।', explEn: 'Chlorophyll is the green pigment that absorbs sunlight to power photosynthesis.', difficulty: 'easy' },
      { bn: 'কোন পরিবেশগত উপাদানের অভাবে সালোকসংশ্লেষণের হার কমে যায়?', en: 'A shortage of which environmental factor reduces the rate of photosynthesis?',
        options: [{ id: 'a', bn: 'সূর্যালোক', en: 'Sunlight' }, { id: 'b', bn: 'অন্ধকার', en: 'Darkness (more of it)' }, { id: 'c', bn: 'অক্সিজেনের আধিক্য', en: 'Excess oxygen' }, { id: 'd', bn: 'তাপমাত্রা শূন্য হলে সবসময় বাড়ে', en: 'Zero temperature always increases it' }],
        correct: ['a'], explBn: 'পর্যাপ্ত সূর্যালোকের অভাবে সালোকসংশ্লেষণের হার উল্লেখযোগ্যভাবে কমে যায়।', explEn: 'Insufficient sunlight significantly reduces the rate of photosynthesis.', difficulty: 'medium' },
    ]);

  await buildChapter('ICT', 10, 'ইন্টারনেট ও যোগাযোগ প্রযুক্তি', 'Internet and Communication Technology', 2,
    {
      titleBn: 'ইন্টারনেট কীভাবে কাজ করে', titleEn: 'How the Internet Works',
      bodyBn: 'ইন্টারনেট হলো বিশ্বব্যাপী সংযুক্ত কম্পিউটার নেটওয়ার্কের সমষ্টি, যা তথ্য আদান-প্রদানের জন্য টিসিপি/আইপি প্রোটোকল ব্যবহার করে। প্রতিটি ডিভাইসের একটি নির্দিষ্ট আইপি ঠিকানা থাকে, যা তাকে নেটওয়ার্কে শনাক্ত করে। ওয়েব ব্রাউজার HTTP/HTTPS প্রোটোকল ব্যবহার করে ওয়েবসাইট থেকে তথ্য আনে।',
      bodyEn: 'The internet is a global network of interconnected computers that uses the TCP/IP protocol to exchange data. Every device has a unique IP address that identifies it on the network. Web browsers use the HTTP/HTTPS protocol to fetch information from websites.',
    },
    [
      { bn: 'ইন্টারনেটে ডেটা আদান-প্রদানের জন্য প্রধান প্রোটোকল কোনটি?', en: 'What is the main protocol used for data exchange on the internet?',
        options: [{ id: 'a', bn: 'TCP/IP', en: 'TCP/IP' }, { id: 'b', bn: 'USB', en: 'USB' }, { id: 'c', bn: 'HDMI', en: 'HDMI' }, { id: 'd', bn: 'Bluetooth', en: 'Bluetooth' }],
        correct: ['a'], explBn: 'ইন্টারনেটে ডেটা আদান-প্রদানের মূল প্রোটোকল TCP/IP।', explEn: 'TCP/IP is the core protocol suite used for data exchange on the internet.', difficulty: 'easy' },
      { bn: 'প্রতিটি ডিভাইসকে নেটওয়ার্কে শনাক্ত করে কী?', en: 'What identifies each device on the network?',
        options: [{ id: 'a', bn: 'আইপি ঠিকানা', en: 'IP address' }, { id: 'b', bn: 'রঙ', en: 'Color' }, { id: 'c', bn: 'ব্র্যান্ড নাম', en: 'Brand name' }, { id: 'd', bn: 'ওজন', en: 'Weight' }],
        correct: ['a'], explBn: 'প্রতিটি ডিভাইসের একটি অনন্য আইপি ঠিকানা থাকে যা নেটওয়ার্কে তাকে শনাক্ত করে।', explEn: 'Each device has a unique IP address that identifies it on the network.', difficulty: 'easy' },
      { bn: 'ওয়েবসাইট থেকে তথ্য আনতে ব্রাউজার কোন প্রোটোকল ব্যবহার করে?', en: 'Which protocol does a browser use to fetch website data?',
        options: [{ id: 'a', bn: 'HTTP/HTTPS', en: 'HTTP/HTTPS' }, { id: 'b', bn: 'FTP শুধু', en: 'Only FTP' }, { id: 'c', bn: 'SMTP', en: 'SMTP' }, { id: 'd', bn: 'POP3', en: 'POP3' }],
        correct: ['a'], explBn: 'ওয়েব ব্রাউজার HTTP বা নিরাপদ HTTPS প্রোটোকলের মাধ্যমে ওয়েবসাইট থেকে তথ্য আনে।', explEn: 'Web browsers fetch website content using the HTTP or secure HTTPS protocol.' },
      { bn: 'HTTPS-এর "S" কী নির্দেশ করে?', en: 'What does the "S" in HTTPS indicate?',
        options: [{ id: 'a', bn: 'নিরাপদ (Secure) সংযোগ', en: 'A secure connection' }, { id: 'b', bn: 'গতি (Speed)', en: 'Speed' }, { id: 'c', bn: 'আকার (Size)', en: 'Size' }, { id: 'd', bn: 'সার্ভার নাম', en: 'Server name' }],
        correct: ['a'], explBn: 'HTTPS-এর S মানে "Secure" — এনক্রিপশনের মাধ্যমে নিরাপদ সংযোগ নির্দেশ করে।', explEn: 'The "S" in HTTPS stands for "Secure," indicating an encrypted connection.', difficulty: 'easy' },
      { bn: 'ইমেইল পাঠানোর জন্য কোন প্রোটোকল ব্যবহৃত হয়?', en: 'Which protocol is used to send email?',
        options: [{ id: 'a', bn: 'SMTP', en: 'SMTP' }, { id: 'b', bn: 'HTTP', en: 'HTTP' }, { id: 'c', bn: 'USB', en: 'USB' }, { id: 'd', bn: 'Bluetooth', en: 'Bluetooth' }],
        correct: ['a'], explBn: 'SMTP (Simple Mail Transfer Protocol) ইমেইল পাঠানোর জন্য ব্যবহৃত হয়।', explEn: 'SMTP (Simple Mail Transfer Protocol) is used to send email.', difficulty: 'medium' },
      { bn: 'ওয়াই-ফাই (Wi-Fi) কী ধরনের প্রযুক্তি?', en: 'What kind of technology is Wi-Fi?',
        options: [{ id: 'a', bn: 'তারবিহীন (wireless) নেটওয়ার্ক সংযোগ', en: 'Wireless network connectivity' }, { id: 'b', bn: 'তারযুক্ত সংযোগ শুধু', en: 'Only wired connectivity' }, { id: 'c', bn: 'একটি প্রিন্টিং প্রযুক্তি', en: 'A printing technology' }, { id: 'd', bn: 'একটি স্টোরেজ ডিভাইস', en: 'A storage device' }],
        correct: ['a'], explBn: 'Wi-Fi রেডিও তরঙ্গ ব্যবহার করে তারবিহীনভাবে ডিভাইসকে নেটওয়ার্কের সাথে সংযুক্ত করে।', explEn: 'Wi-Fi uses radio waves to wirelessly connect devices to a network.', difficulty: 'easy' },
    ]);

  console.log('\nClass 11 chapters:');
  await buildChapter('CHE', 11, 'জৈব রসায়নের ভূমিকা', 'Introduction to Organic Chemistry', 2,
    {
      titleBn: 'কার্বন ও হাইড্রোকার্বন', titleEn: 'Carbon and Hydrocarbons',
      bodyBn: 'জৈব রসায়ন হলো কার্বনযুক্ত যৌগ নিয়ে গবেষণা। কার্বন পরমাণু চারটি বন্ধন গঠন করতে পারে বলে অসংখ্য জৈব যৌগ সম্ভব। শুধু কার্বন ও হাইড্রোজেন দ্বারা গঠিত যৌগকে হাইড্রোকার্বন বলে — এদের প্রধান ভাগ হলো অ্যালকেন, অ্যালকিন ও অ্যালকাইন।',
      bodyEn: 'Organic chemistry is the study of carbon-containing compounds. Because a carbon atom can form four bonds, an enormous variety of organic compounds is possible. Compounds made of only carbon and hydrogen are called hydrocarbons — the main classes are alkanes, alkenes, and alkynes.',
    },
    [
      { bn: 'জৈব রসায়ন প্রধানত কী নিয়ে আলোচনা করে?', en: 'What does organic chemistry primarily study?',
        options: [{ id: 'a', bn: 'কার্বনযুক্ত যৌগ', en: 'Carbon-containing compounds' }, { id: 'b', bn: 'শুধু ধাতু', en: 'Only metals' }, { id: 'c', bn: 'শুধু গ্যাস', en: 'Only gases' }, { id: 'd', bn: 'শুধু পানি', en: 'Only water' }],
        correct: ['a'], explBn: 'জৈব রসায়ন কার্বনযুক্ত যৌগের গঠন ও বিক্রিয়া নিয়ে আলোচনা করে।', explEn: 'Organic chemistry studies the structure and reactions of carbon-containing compounds.', difficulty: 'easy' },
      { bn: 'একটি কার্বন পরমাণু কতটি বন্ধন গঠন করতে পারে?', en: 'How many bonds can a single carbon atom form?',
        options: [{ id: 'a', bn: '৪টি', en: '4' }, { id: 'b', bn: '২টি', en: '2' }, { id: 'c', bn: '৬টি', en: '6' }, { id: 'd', bn: '১টি', en: '1' }],
        correct: ['a'], explBn: 'কার্বনের সর্ববহিঃস্থ শেলে ৪টি ইলেকট্রন থাকায় এটি ৪টি বন্ধন গঠন করতে পারে।', explEn: 'Carbon has 4 electrons in its outer shell, allowing it to form 4 bonds.', difficulty: 'easy' },
      { bn: 'শুধু কার্বন ও হাইড্রোজেন দ্বারা গঠিত যৌগকে কী বলে?', en: 'A compound made only of carbon and hydrogen is called:',
        options: [{ id: 'a', bn: 'হাইড্রোকার্বন', en: 'Hydrocarbon' }, { id: 'b', bn: 'কার্বনেট', en: 'Carbonate' }, { id: 'c', bn: 'অক্সাইড', en: 'Oxide' }, { id: 'd', bn: 'সালফাইড', en: 'Sulfide' }],
        correct: ['a'], explBn: 'শুধু কার্বন ও হাইড্রোজেন দ্বারা গঠিত যৌগকে হাইড্রোকার্বন বলে।', explEn: 'A compound of only carbon and hydrogen is a hydrocarbon.' },
      { bn: 'অ্যালকেনে (যেমন মিথেন) কার্বন পরমাণুর মধ্যে কোন ধরনের বন্ধন থাকে?', en: 'What type of bond exists between carbon atoms in an alkane (e.g. methane)?',
        options: [{ id: 'a', bn: 'একক বন্ধন (single bond)', en: 'Single bond' }, { id: 'b', bn: 'দ্বিবন্ধন', en: 'Double bond' }, { id: 'c', bn: 'ত্রিবন্ধন', en: 'Triple bond' }, { id: 'd', bn: 'কোনো বন্ধন নেই', en: 'No bond' }],
        correct: ['a'], explBn: 'অ্যালকেন হলো সম্পৃক্ত হাইড্রোকার্বন যাতে কার্বন-কার্বন একক বন্ধন থাকে।', explEn: 'Alkanes are saturated hydrocarbons with single carbon-carbon bonds.', difficulty: 'medium' },
      { bn: 'অ্যালকিনে কার্বন-কার্বনের মধ্যে কোন বন্ধন থাকে?', en: 'What bond exists between carbons in an alkene?',
        options: [{ id: 'a', bn: 'দ্বিবন্ধন', en: 'Double bond' }, { id: 'b', bn: 'একক বন্ধন', en: 'Single bond' }, { id: 'c', bn: 'ত্রিবন্ধন', en: 'Triple bond' }, { id: 'd', bn: 'আয়নিক বন্ধন', en: 'Ionic bond' }],
        correct: ['a'], explBn: 'অ্যালকিন হলো অসম্পৃক্ত হাইড্রোকার্বন যাতে অন্তত একটি কার্বন-কার্বন দ্বিবন্ধন থাকে।', explEn: 'Alkenes are unsaturated hydrocarbons containing at least one carbon-carbon double bond.', difficulty: 'medium' },
      { bn: 'মিথেনের রাসায়নিক সংকেত কী?', en: 'What is the chemical formula of methane?',
        options: [{ id: 'a', bn: 'CH₄', en: 'CH4' }, { id: 'b', bn: 'C₂H₆', en: 'C2H6' }, { id: 'c', bn: 'CO₂', en: 'CO2' }, { id: 'd', bn: 'C₆H₆', en: 'C6H6' }],
        correct: ['a'], explBn: 'মিথেন হলো সবচেয়ে সরল অ্যালকেন, সংকেত CH₄।', explEn: 'Methane is the simplest alkane, with the formula CH4.', difficulty: 'easy' },
    ]);

  await buildChapter('PHY', 11, 'আলোর প্রতিসরণ ও লেন্স', 'Refraction of Light and Lenses', 2,
    {
      titleBn: 'প্রতিসরণ ও উত্তল-অবতল লেন্স', titleEn: 'Refraction and Convex/Concave Lenses',
      bodyBn: 'আলো এক মাধ্যম থেকে ভিন্ন ঘনত্বের অন্য মাধ্যমে প্রবেশ করার সময় দিক পরিবর্তন করে — একে প্রতিসরণ বলে। উত্তল লেন্স আলোকরশ্মিকে একত্রিত করে (converging) এবং অবতল লেন্স ছড়িয়ে দেয় (diverging)। লেন্সের ফোকাস দূরত্ব নির্ভর করে তার বক্রতা ও উপাদানের প্রতিসরাঙ্কের উপর।',
      bodyEn: 'Light changes direction when passing from one medium to another of different density — this is called refraction. A convex lens converges light rays, while a concave lens diverges them. A lens\'s focal length depends on its curvature and the refractive index of its material.',
      formula: { titleBn: 'লেন্স সমীকরণ', titleEn: 'Lens Equation', bodyBn: '1/f = 1/v - 1/u\nএখানে f = ফোকাস দূরত্ব, v = প্রতিবিম্ব দূরত্ব, u = বস্তু দূরত্ব', bodyEn: '1/f = 1/v - 1/u\nWhere f = focal length, v = image distance, u = object distance' },
    },
    [
      { bn: 'উত্তল লেন্স আলোকরশ্মির উপর কী প্রভাব ফেলে?', en: 'What effect does a convex lens have on light rays?',
        options: [{ id: 'a', bn: 'একত্রিত করে (converge)', en: 'Converges them' }, { id: 'b', bn: 'ছড়িয়ে দেয় (diverge)', en: 'Diverges them' }, { id: 'c', bn: 'শোষণ করে', en: 'Absorbs them' }, { id: 'd', bn: 'কোনো প্রভাব নেই', en: 'Has no effect' }],
        correct: ['a'], explBn: 'উত্তল লেন্স সমান্তরাল আলোকরশ্মিকে একটি বিন্দুতে একত্রিত করে।', explEn: 'A convex lens converges parallel light rays to a single point.', difficulty: 'easy' },
      { bn: 'অবতল লেন্স আলোকরশ্মির উপর কী প্রভাব ফেলে?', en: 'What effect does a concave lens have on light rays?',
        options: [{ id: 'a', bn: 'ছড়িয়ে দেয় (diverge)', en: 'Diverges them' }, { id: 'b', bn: 'একত্রিত করে', en: 'Converges them' }, { id: 'c', bn: 'প্রতিফলিত করে শুধু', en: 'Only reflects them' }, { id: 'd', bn: 'কোনো প্রভাব নেই', en: 'Has no effect' }],
        correct: ['a'], explBn: 'অবতল লেন্স আলোকরশ্মিকে ছড়িয়ে দেয়, যেন তারা একটি ভার্চুয়াল বিন্দু থেকে আসছে।', explEn: 'A concave lens spreads light rays apart, as if they originate from a virtual point.' },
      { bn: 'প্রতিসরণ কখন ঘটে?', en: 'When does refraction occur?',
        options: [{ id: 'a', bn: 'আলো ভিন্ন ঘনত্বের মাধ্যমে প্রবেশ করলে', en: 'When light enters a medium of different density' }, { id: 'b', bn: 'আলো একই মাধ্যমে থাকলে', en: 'When light stays in the same medium' }, { id: 'c', bn: 'অন্ধকারে', en: 'In darkness' }, { id: 'd', bn: 'শুধু শূন্যস্থানে', en: 'Only in a vacuum' }],
        correct: ['a'], explBn: 'আলো ভিন্ন ঘনত্বের মাধ্যমে প্রবেশ করলে দিক পরিবর্তন করে, একেই প্রতিসরণ বলে।', explEn: 'Light bends when passing into a medium of different density — this bending is refraction.', difficulty: 'easy' },
      { bn: 'লেন্স সমীকরণ 1/f = 1/v - 1/u -তে f কী নির্দেশ করে?', en: 'In the lens equation 1/f = 1/v - 1/u, what does f represent?',
        options: [{ id: 'a', bn: 'ফোকাস দূরত্ব', en: 'Focal length' }, { id: 'b', bn: 'বস্তুর উচ্চতা', en: "Object's height" }, { id: 'c', bn: 'আলোর বেগ', en: 'Speed of light' }, { id: 'd', bn: 'প্রতিসরাঙ্ক', en: 'Refractive index' }],
        correct: ['a'], explBn: 'f হলো লেন্সের ফোকাস দূরত্ব।', explEn: 'f represents the focal length of the lens.', difficulty: 'medium' },
      { bn: 'দূরদৃষ্টি (hypermetropia) সংশোধনে কোন লেন্স ব্যবহৃত হয়?', en: 'Which lens is used to correct hypermetropia (far-sightedness)?',
        options: [{ id: 'a', bn: 'উত্তল লেন্স', en: 'Convex lens' }, { id: 'b', bn: 'অবতল লেন্স', en: 'Concave lens' }, { id: 'c', bn: 'সমতল লেন্স', en: 'Flat lens' }, { id: 'd', bn: 'কোনো লেন্স দরকার নেই', en: 'No lens is needed' }],
        correct: ['a'], explBn: 'দূরদৃষ্টি সংশোধনে উত্তল লেন্স ব্যবহার করে আলোকরশ্মিকে রেটিনার উপর ফোকাস করা হয়।', explEn: 'A convex lens corrects hypermetropia by focusing light rays onto the retina.', difficulty: 'medium' },
      { bn: 'প্রতিসরাঙ্ক (refractive index) কী নির্দেশ করে?', en: 'What does the refractive index indicate?',
        options: [{ id: 'a', bn: 'আলো কতটা বাঁকে তা নির্ধারণকারী মাধ্যমের একটি ধর্ম', en: "A property of a medium that determines how much it bends light" }, { id: 'b', bn: 'বস্তুর ওজন', en: "An object's weight" }, { id: 'c', bn: 'বস্তুর রঙ শুধু', en: "Only an object's color" }, { id: 'd', bn: 'তাপমাত্রা', en: 'Temperature' }],
        correct: ['a'], explBn: 'প্রতিসরাঙ্ক একটি মাধ্যমে আলোর বেগ কতটা পরিবর্তিত হয় এবং আলো কতটা বাঁকে তা নির্দেশ করে।', explEn: "The refractive index indicates how much a medium changes light's speed and bends its path.", difficulty: 'hard' },
    ]);

  await buildChapter('PHY', 11, 'তাপগতিবিদ্যা', 'Thermodynamics', 3,
    {
      titleBn: 'তাপগতিবিদ্যার সূত্রসমূহ', titleEn: 'The Laws of Thermodynamics',
      bodyBn: 'তাপগতিবিদ্যার প্রথম সূত্র হলো শক্তির নিত্যতা সূত্রের একটি রূপ — একটি সিস্টেমে সরবরাহিত তাপ তার আভ্যন্তরীণ শক্তি বৃদ্ধি ও বাহ্যিক কাজে ব্যয় হয়। দ্বিতীয় সূত্র অনুযায়ী তাপ স্বতঃস্ফূর্তভাবে উষ্ণ বস্তু থেকে শীতল বস্তুর দিকে প্রবাহিত হয়, বিপরীতে নয়।',
      bodyEn: "The first law of thermodynamics is a form of energy conservation — heat supplied to a system increases its internal energy and/or does external work. The second law states heat flows spontaneously from a hotter body to a colder one, never the reverse.",
      formula: { titleBn: 'সূত্র', titleEn: 'Formula', bodyBn: 'ΔQ = ΔU + ΔW\nএখানে ΔQ = প্রদত্ত তাপ, ΔU = আভ্যন্তরীণ শক্তির পরিবর্তন, ΔW = কৃত কাজ', bodyEn: 'dQ = dU + dW\nWhere dQ = heat supplied, dU = change in internal energy, dW = work done' },
    },
    [
      { bn: 'তাপগতিবিদ্যার প্রথম সূত্র মূলত কীসের প্রকাশ?', en: 'The first law of thermodynamics is essentially an expression of:',
        options: [{ id: 'a', bn: 'শক্তির নিত্যতা সূত্র', en: 'The law of conservation of energy' }, { id: 'b', bn: 'ভরের নিত্যতা সূত্র', en: 'The law of conservation of mass' }, { id: 'c', bn: 'নিউটনের প্রথম সূত্র', en: "Newton's first law" }, { id: 'd', bn: 'ওহমের সূত্র', en: "Ohm's law" }],
        correct: ['a'], explBn: 'তাপগতিবিদ্যার প্রথম সূত্র শক্তির নিত্যতা সূত্রের প্রয়োগ।', explEn: "The first law of thermodynamics applies the law of conservation of energy.", difficulty: 'medium' },
      { bn: 'তাপগতিবিদ্যার দ্বিতীয় সূত্র অনুযায়ী তাপ স্বতঃস্ফূর্তভাবে কোন দিকে প্রবাহিত হয়?', en: 'According to the second law, heat spontaneously flows in which direction?',
        options: [{ id: 'a', bn: 'উষ্ণ থেকে শীতল বস্তুর দিকে', en: 'From hotter to colder body' }, { id: 'b', bn: 'শীতল থেকে উষ্ণ বস্তুর দিকে', en: 'From colder to hotter body' }, { id: 'c', bn: 'কোনো দিকেই না', en: 'In neither direction' }, { id: 'd', bn: 'এলোমেলোভাবে', en: 'Randomly' }],
        correct: ['a'], explBn: 'তাপ সবসময় স্বতঃস্ফূর্তভাবে উষ্ণ থেকে শীতল বস্তুর দিকে প্রবাহিত হয়।', explEn: 'Heat always flows spontaneously from a hotter body to a colder one.', difficulty: 'easy' },
      { bn: 'ΔQ = ΔU + ΔW সমীকরণে ΔW কী নির্দেশ করে?', en: 'In dQ = dU + dW, what does dW represent?',
        options: [{ id: 'a', bn: 'সিস্টেম কর্তৃক কৃত কাজ', en: 'Work done by the system' }, { id: 'b', bn: 'তাপমাত্রা', en: 'Temperature' }, { id: 'c', bn: 'ভর', en: 'Mass' }, { id: 'd', bn: 'চাপ শুধু', en: 'Pressure alone' }],
        correct: ['a'], explBn: 'ΔW হলো সিস্টেম দ্বারা পারিপার্শ্বিকের উপর কৃত কাজ।', explEn: 'dW is the work done by the system on its surroundings.', difficulty: 'medium' },
      { bn: 'একটি রেফ্রিজারেটর কোন সূত্রের বিরুদ্ধে কাজ করে বলে মনে হলেও আসলে মেনে চলে?', en: 'Which law does a refrigerator seem to violate but actually obeys?',
        options: [{ id: 'a', bn: 'তাপগতিবিদ্যার দ্বিতীয় সূত্র', en: 'The second law of thermodynamics' }, { id: 'b', bn: 'নিউটনের প্রথম সূত্র', en: "Newton's first law" }, { id: 'c', bn: 'ওহমের সূত্র', en: "Ohm's law" }, { id: 'd', bn: 'বয়েলের সূত্র', en: "Boyle's law" }],
        correct: ['a'], explBn: 'রেফ্রিজারেটর বাহ্যিক কাজ (বিদ্যুৎ শক্তি) ব্যয় করে তাপ শীতল থেকে উষ্ণ দিকে সরায়, তাই দ্বিতীয় সূত্র লঙ্ঘিত হয় না।', explEn: 'A refrigerator uses external work (electricity) to move heat from cold to hot, so the second law is not violated.', difficulty: 'hard' },
      { bn: 'তাপগতিবিদ্যায় একটি বিচ্ছিন্ন সিস্টেম (isolated system) বলতে কী বোঝায়?', en: 'What does an "isolated system" mean in thermodynamics?',
        options: [{ id: 'a', bn: 'যেখানে ভর ও শক্তি কোনোটাই বিনিময় হয় না', en: 'One where neither mass nor energy is exchanged' }, { id: 'b', bn: 'যেখানে শুধু ভর বিনিময় হয়', en: 'One where only mass is exchanged' }, { id: 'c', bn: 'যেখানে শুধু তাপ বিনিময় হয়', en: 'One where only heat is exchanged' }, { id: 'd', bn: 'একটি খোলা পাত্র', en: 'An open container' }],
        correct: ['a'], explBn: 'বিচ্ছিন্ন সিস্টেমে পারিপার্শ্বের সাথে ভর বা শক্তি কোনোটাই বিনিময় হয় না।', explEn: 'An isolated system exchanges neither mass nor energy with its surroundings.', difficulty: 'medium' },
      { bn: 'এন্ট্রপি (entropy) কী নির্দেশ করে?', en: 'What does entropy represent?',
        options: [{ id: 'a', bn: 'সিস্টেমের বিশৃঙ্খলার পরিমাণ', en: 'The degree of disorder in a system' }, { id: 'b', bn: 'সিস্টেমের ভর', en: "A system's mass" }, { id: 'c', bn: 'সিস্টেমের আয়তন শুধু', en: "Only a system's volume" }, { id: 'd', bn: 'সিস্টেমের রঙ', en: "A system's color" }],
        correct: ['a'], explBn: 'এন্ট্রপি একটি সিস্টেমের বিশৃঙ্খলা বা এলোমেলোভাবের পরিমাপ, যা বিচ্ছিন্ন সিস্টেমে সময়ের সাথে বৃদ্ধি পায়।', explEn: 'Entropy measures the disorder of a system, which increases over time in an isolated system.', difficulty: 'hard' },
    ]);

  await buildChapter('BIO', 11, 'শ্বসন প্রক্রিয়া', 'Respiration', 2,
    {
      titleBn: 'কোষীয় শ্বসন', titleEn: 'Cellular Respiration',
      bodyBn: 'শ্বসন হলো সেই প্রক্রিয়া যার মাধ্যমে কোষ গ্লুকোজ ভেঙে শক্তি (ATP) উৎপন্ন করে। সবাত শ্বসনে অক্সিজেন ব্যবহৃত হয় এবং কার্বন-ডাই-অক্সাইড ও পানি উৎপন্ন হয়, যা মাইটোকন্ড্রিয়ায় ঘটে। অবাত শ্বসনে অক্সিজেন ছাড়াই কম শক্তি উৎপন্ন হয় (যেমন গাঁজন)।',
      bodyEn: 'Respiration is the process by which cells break down glucose to release energy (ATP). Aerobic respiration uses oxygen and produces carbon dioxide and water, occurring in the mitochondria. Anaerobic respiration produces less energy without oxygen (e.g. fermentation).',
      formula: { titleBn: 'সমীকরণ', titleEn: 'Equation', bodyBn: 'C₆H₁₂O₆ + ৬O₂ → ৬CO₂ + ৬H₂O + শক্তি (ATP)', bodyEn: 'C6H12O6 + 6O2 -> 6CO2 + 6H2O + energy (ATP)' },
    },
    [
      { bn: 'সবাত শ্বসন কোথায় সংঘটিত হয়?', en: 'Where does aerobic respiration take place?',
        options: [{ id: 'a', bn: 'মাইটোকন্ড্রিয়ায়', en: 'In the mitochondria' }, { id: 'b', bn: 'ক্লোরোপ্লাস্টে', en: 'In the chloroplast' }, { id: 'c', bn: 'নিউক্লিয়াসে', en: 'In the nucleus' }, { id: 'd', bn: 'কোষপ্রাচীরে', en: 'In the cell wall' }],
        correct: ['a'], explBn: 'মাইটোকন্ড্রিয়াকে "কোষের শক্তিঘর" বলা হয় কারণ এখানে সবাত শ্বসন ঘটে।', explEn: 'Mitochondria are called the "powerhouse of the cell" because aerobic respiration occurs there.', difficulty: 'easy' },
      { bn: 'শ্বসনের মাধ্যমে উৎপন্ন শক্তির অণুকে কী বলে?', en: 'The energy molecule produced by respiration is called:',
        options: [{ id: 'a', bn: 'ATP', en: 'ATP' }, { id: 'b', bn: 'DNA', en: 'DNA' }, { id: 'c', bn: 'RNA', en: 'RNA' }, { id: 'd', bn: 'গ্লুকোজ', en: 'Glucose' }],
        correct: ['a'], explBn: 'শ্বসনে গ্লুকোজ ভেঙে ATP (এডিনোসিন ট্রাইফসফেট) উৎপন্ন হয়, যা কোষের শক্তির মুদ্রা।', explEn: 'Respiration breaks down glucose to produce ATP (adenosine triphosphate), the energy currency of the cell.' },
      { bn: 'সবাত শ্বসনের জন্য কোন গ্যাস অপরিহার্য?', en: 'Which gas is essential for aerobic respiration?',
        options: [{ id: 'a', bn: 'অক্সিজেন', en: 'Oxygen' }, { id: 'b', bn: 'নাইট্রোজেন', en: 'Nitrogen' }, { id: 'c', bn: 'হিলিয়াম', en: 'Helium' }, { id: 'd', bn: 'আর্গন', en: 'Argon' }],
        correct: ['a'], explBn: 'সবাত শ্বসনে অক্সিজেন ব্যবহৃত হয়ে গ্লুকোজ সম্পূর্ণভাবে ভেঙে শক্তি উৎপন্ন করে।', explEn: 'Aerobic respiration uses oxygen to fully break down glucose and release energy.', difficulty: 'easy' },
      { bn: 'অবাত শ্বসন ও সবাত শ্বসনের মূল পার্থক্য কী?', en: 'What is the key difference between anaerobic and aerobic respiration?',
        options: [{ id: 'a', bn: 'অবাত শ্বসনে অক্সিজেন লাগে না এবং কম শক্তি উৎপন্ন হয়', en: 'Anaerobic respiration needs no oxygen and produces less energy' }, { id: 'b', bn: 'উভয়েই সমান শক্তি উৎপন্ন করে', en: 'Both produce equal energy' }, { id: 'c', bn: 'অবাত শ্বসনে বেশি অক্সিজেন লাগে', en: 'Anaerobic respiration needs more oxygen' }, { id: 'd', bn: 'কোনো পার্থক্য নেই', en: 'There is no difference' }],
        correct: ['a'], explBn: 'অবাত শ্বসন অক্সিজেন ছাড়া ঘটে এবং সবাত শ্বসনের তুলনায় অনেক কম শক্তি (ATP) উৎপন্ন করে।', explEn: 'Anaerobic respiration occurs without oxygen and produces far less energy (ATP) than aerobic respiration.', difficulty: 'medium' },
      { bn: 'ইস্টের গাঁজন প্রক্রিয়া কোন ধরনের শ্বসনের উদাহরণ?', en: 'Yeast fermentation is an example of which type of respiration?',
        options: [{ id: 'a', bn: 'অবাত শ্বসন', en: 'Anaerobic respiration' }, { id: 'b', bn: 'সবাত শ্বসন', en: 'Aerobic respiration' }, { id: 'c', bn: 'সালোকসংশ্লেষণ', en: 'Photosynthesis' }, { id: 'd', bn: 'রেচন', en: 'Excretion' }],
        correct: ['a'], explBn: 'গাঁজন প্রক্রিয়া অক্সিজেন ছাড়া ঘটে, তাই এটি অবাত শ্বসনের একটি উদাহরণ।', explEn: 'Fermentation occurs without oxygen, making it an example of anaerobic respiration.' },
      { bn: 'শ্বসনের ফলে নির্গত গ্যাস কোনটি?', en: 'Which gas is released as a result of respiration?',
        options: [{ id: 'a', bn: 'কার্বন-ডাই-অক্সাইড', en: 'Carbon dioxide' }, { id: 'b', bn: 'অক্সিজেন শুধু', en: 'Only oxygen' }, { id: 'c', bn: 'নাইট্রোজেন', en: 'Nitrogen' }, { id: 'd', bn: 'হাইড্রোজেন', en: 'Hydrogen' }],
        correct: ['a'], explBn: 'সবাত শ্বসনে গ্লুকোজ ভেঙে কার্বন-ডাই-অক্সাইড ও পানি উপজাত হিসেবে নির্গত হয়।', explEn: 'Aerobic respiration releases carbon dioxide and water as byproducts of breaking down glucose.', difficulty: 'easy' },
    ]);

  await buildChapter('ICT', 11, 'প্রোগ্রামিং ভাষার ভূমিকা (C)', 'Introduction to C Programming', 3,
    {
      titleBn: 'C প্রোগ্রামের মূল কাঠামো', titleEn: 'Basic Structure of a C Program',
      bodyBn: 'C একটি স্ট্রাকচার্ড প্রোগ্রামিং ভাষা। প্রতিটি C প্রোগ্রাম main() ফাংশন দিয়ে শুরু হয়। ভেরিয়েবল ডেটা সংরক্ষণ করে, আর printf()/scanf() ফাংশন যথাক্রমে আউটপুট দেখাতে ও ইনপুট নিতে ব্যবহৃত হয়। প্রতিটি স্টেটমেন্ট সেমিকোলন (;) দিয়ে শেষ করতে হয়।',
      bodyEn: 'C is a structured programming language. Every C program begins execution from the main() function. Variables store data, while printf()/scanf() are used to display output and take input respectively. Every statement must end with a semicolon (;).',
      formula: { titleBn: 'উদাহরণ কোড', titleEn: 'Example Code', bodyBn: '#include <stdio.h>\nint main() {\n  printf("Hello, World!");\n  return 0;\n}', bodyEn: '#include <stdio.h>\nint main() {\n  printf("Hello, World!");\n  return 0;\n}' },
    },
    [
      { bn: 'প্রতিটি C প্রোগ্রাম কোন ফাংশন থেকে কার্যকর হওয়া শুরু করে?', en: 'Every C program begins execution from which function?',
        options: [{ id: 'a', bn: 'main()', en: 'main()' }, { id: 'b', bn: 'start()', en: 'start()' }, { id: 'c', bn: 'begin()', en: 'begin()' }, { id: 'd', bn: 'init()', en: 'init()' }],
        correct: ['a'], explBn: 'C প্রোগ্রামের এক্সিকিউশন সবসময় main() ফাংশন থেকে শুরু হয়।', explEn: 'Execution of a C program always starts from the main() function.', difficulty: 'easy' },
      { bn: 'C-তে আউটপুট প্রদর্শনের জন্য কোন ফাংশন ব্যবহৃত হয়?', en: 'Which function is used to display output in C?',
        options: [{ id: 'a', bn: 'printf()', en: 'printf()' }, { id: 'b', bn: 'scanf()', en: 'scanf()' }, { id: 'c', bn: 'input()', en: 'input()' }, { id: 'd', bn: 'read()', en: 'read()' }],
        correct: ['a'], explBn: 'printf() ফাংশন দিয়ে স্ক্রিনে আউটপুট প্রদর্শন করা হয়।', explEn: 'printf() is used to display output on the screen.', difficulty: 'easy' },
      { bn: 'C-তে প্রতিটি স্টেটমেন্ট কী দিয়ে শেষ করতে হয়?', en: 'What must every statement in C end with?',
        options: [{ id: 'a', bn: 'সেমিকোলন (;)', en: 'Semicolon (;)' }, { id: 'b', bn: 'কমা (,)', en: 'Comma (,)' }, { id: 'c', bn: 'কোলন (:)', en: 'Colon (:)' }, { id: 'd', bn: 'ড্যাশ (-)', en: 'Dash (-)' }],
        correct: ['a'], explBn: 'C ভাষায় প্রতিটি স্টেটমেন্টের শেষে সেমিকোলন (;) বসাতে হয়।', explEn: 'Every statement in C must end with a semicolon (;).', difficulty: 'easy' },
      { bn: 'ইনপুট নেওয়ার জন্য C-তে কোন ফাংশন ব্যবহৃত হয়?', en: 'Which function is used to take input in C?',
        options: [{ id: 'a', bn: 'scanf()', en: 'scanf()' }, { id: 'b', bn: 'printf()', en: 'printf()' }, { id: 'c', bn: 'output()', en: 'output()' }, { id: 'd', bn: 'display()', en: 'display()' }],
        correct: ['a'], explBn: 'scanf() ফাংশন ব্যবহারকারীর কাছ থেকে ইনপুট গ্রহণ করে।', explEn: 'scanf() takes input from the user.' },
      { bn: 'ভেরিয়েবল কী কাজে ব্যবহৃত হয়?', en: 'What is a variable used for?',
        options: [{ id: 'a', bn: 'ডেটা সাময়িকভাবে সংরক্ষণ করতে', en: 'To temporarily store data' }, { id: 'b', bn: 'প্রোগ্রাম প্রিন্ট করতে', en: 'To print the program' }, { id: 'c', bn: 'হার্ডওয়্যার নিয়ন্ত্রণ করতে', en: 'To control hardware directly' }, { id: 'd', bn: 'ইন্টারনেট সংযোগ করতে', en: 'To connect to the internet' }],
        correct: ['a'], explBn: 'ভেরিয়েবল মেমোরিতে ডেটা সাময়িকভাবে সংরক্ষণ করে যা প্রোগ্রামে ব্যবহার করা যায়।', explEn: 'A variable temporarily stores data in memory that the program can use.', difficulty: 'easy' },
      { bn: '#include <stdio.h> লাইনটির উদ্দেশ্য কী?', en: 'What is the purpose of the line #include <stdio.h>?',
        options: [{ id: 'a', bn: 'স্ট্যান্ডার্ড ইনপুট/আউটপুট ফাংশন ব্যবহারের সুবিধা যুক্ত করা', en: 'To include standard input/output functions' }, { id: 'b', bn: 'প্রোগ্রাম ডিলিট করা', en: 'To delete the program' }, { id: 'c', bn: 'ইন্টারনেট সংযোগ স্থাপন করা', en: 'To establish an internet connection' }, { id: 'd', bn: 'গ্রাফিক্স আঁকা', en: 'To draw graphics' }],
        correct: ['a'], explBn: 'stdio.h হেডার ফাইল printf(), scanf()-এর মতো স্ট্যান্ডার্ড ইনপুট/আউটপুট ফাংশন সরবরাহ করে।', explEn: 'The stdio.h header file provides standard input/output functions like printf() and scanf().', difficulty: 'medium' },
    ]);

  console.log('\nClass 12 chapters:');
  await buildChapter('CHE', 12, 'তড়িৎ রসায়ন', 'Electrochemistry', 2,
    {
      titleBn: 'জারণ-বিজারণ ও তড়িৎ কোষ', titleEn: 'Redox Reactions and Electrochemical Cells',
      bodyBn: 'তড়িৎ রসায়ন হলো রাসায়নিক বিক্রিয়া ও বিদ্যুৎ শক্তির মধ্যে সম্পর্ক নিয়ে গবেষণা। জারণ হলো ইলেকট্রন ত্যাগ, আর বিজারণ হলো ইলেকট্রন গ্রহণ। গ্যালভানিক কোষে স্বতঃস্ফূর্ত রাসায়নিক বিক্রিয়া থেকে বিদ্যুৎ উৎপন্ন হয়, আর তড়িৎ বিশ্লেষণ কোষে বিদ্যুৎ ব্যবহার করে অস্বতঃস্ফূর্ত বিক্রিয়া ঘটানো হয়।',
      bodyEn: 'Electrochemistry studies the relationship between chemical reactions and electrical energy. Oxidation is the loss of electrons, while reduction is the gain of electrons. In a galvanic cell, a spontaneous chemical reaction produces electricity; in an electrolytic cell, electricity is used to drive a non-spontaneous reaction.',
    },
    [
      { bn: 'জারণ বলতে কী বোঝায়?', en: 'What does oxidation mean?',
        options: [{ id: 'a', bn: 'ইলেকট্রন ত্যাগ', en: 'Loss of electrons' }, { id: 'b', bn: 'ইলেকট্রন গ্রহণ', en: 'Gain of electrons' }, { id: 'c', bn: 'প্রোটন ত্যাগ', en: 'Loss of protons' }, { id: 'd', bn: 'নিউট্রন গ্রহণ', en: 'Gain of neutrons' }],
        correct: ['a'], explBn: 'জারণ হলো কোনো পরমাণু বা আয়ন কর্তৃক ইলেকট্রন ত্যাগ করা।', explEn: 'Oxidation is the loss of electrons by an atom or ion.', difficulty: 'easy' },
      { bn: 'বিজারণ বলতে কী বোঝায়?', en: 'What does reduction mean?',
        options: [{ id: 'a', bn: 'ইলেকট্রন গ্রহণ', en: 'Gain of electrons' }, { id: 'b', bn: 'ইলেকট্রন ত্যাগ', en: 'Loss of electrons' }, { id: 'c', bn: 'ভর হ্রাস', en: 'Loss of mass' }, { id: 'd', bn: 'তাপমাত্রা হ্রাস', en: 'Decrease in temperature' }],
        correct: ['a'], explBn: 'বিজারণ হলো কোনো পরমাণু বা আয়ন কর্তৃক ইলেকট্রন গ্রহণ করা।', explEn: 'Reduction is the gain of electrons by an atom or ion.' },
      { bn: 'গ্যালভানিক কোষে কী ঘটে?', en: 'What happens in a galvanic cell?',
        options: [{ id: 'a', bn: 'স্বতঃস্ফূর্ত বিক্রিয়া থেকে বিদ্যুৎ উৎপন্ন হয়', en: 'A spontaneous reaction generates electricity' }, { id: 'b', bn: 'বিদ্যুৎ দিয়ে বিক্রিয়া ঘটানো হয়', en: 'Electricity is used to drive a reaction' }, { id: 'c', bn: 'কোনো বিক্রিয়া ঘটে না', en: 'No reaction occurs' }, { id: 'd', bn: 'শুধু তাপ উৎপন্ন হয়', en: 'Only heat is produced' }],
        correct: ['a'], explBn: 'গ্যালভানিক (ভোল্টাইক) কোষে স্বতঃস্ফূর্ত রাসায়নিক বিক্রিয়া থেকে বৈদ্যুতিক শক্তি উৎপন্ন হয়।', explEn: 'A galvanic (voltaic) cell converts a spontaneous chemical reaction into electrical energy.' },
      { bn: 'তড়িৎ বিশ্লেষণ কোষে কী ঘটে?', en: 'What happens in an electrolytic cell?',
        options: [{ id: 'a', bn: 'বিদ্যুৎ ব্যবহার করে অস্বতঃস্ফূর্ত বিক্রিয়া ঘটানো হয়', en: 'Electricity is used to drive a non-spontaneous reaction' }, { id: 'b', bn: 'রাসায়নিক বিক্রিয়া থেকে বিদ্যুৎ উৎপন্ন হয়', en: 'Electricity is generated from a chemical reaction' }, { id: 'c', bn: 'কোনো ইলেকট্রন সরে না', en: 'No electrons move' }, { id: 'd', bn: 'তাপমাত্রা কমে যায়', en: 'Temperature always drops' }],
        correct: ['a'], explBn: 'তড়িৎ বিশ্লেষণ কোষে বাহ্যিক বিদ্যুৎ শক্তি ব্যবহার করে অস্বতঃস্ফূর্ত রাসায়নিক বিক্রিয়া ঘটানো হয়।', explEn: 'An electrolytic cell uses external electrical energy to force a non-spontaneous chemical reaction.', difficulty: 'medium' },
      { bn: 'কোষে অ্যানোড কী?', en: 'What is the anode in a cell?',
        options: [{ id: 'a', bn: 'যেখানে জারণ ঘটে', en: 'Where oxidation occurs' }, { id: 'b', bn: 'যেখানে বিজারণ ঘটে', en: 'Where reduction occurs' }, { id: 'c', bn: 'একটি নিরপেক্ষ ইলেকট্রোড', en: 'A neutral electrode' }, { id: 'd', bn: 'কোষের বাইরের অংশ', en: "The cell's outer casing" }],
        correct: ['a'], explBn: 'যে ইলেকট্রোডে জারণ (ইলেকট্রন ত্যাগ) ঘটে তাকে অ্যানোড বলে।', explEn: 'The electrode where oxidation (electron loss) occurs is called the anode.', difficulty: 'medium' },
      { bn: 'ব্যাটারি (galvanic cell) চার্জ ফুরিয়ে গেলে কী বোঝা যায়?', en: 'When a battery (galvanic cell) runs out of charge, what does that indicate?',
        options: [{ id: 'a', bn: 'বিক্রিয়াকারী পদার্থ প্রায় শেষ হয়ে গেছে', en: 'The reactants are nearly used up' }, { id: 'b', bn: 'তাপমাত্রা বৃদ্ধি পেয়েছে', en: 'Temperature has increased' }, { id: 'c', bn: 'ভর বৃদ্ধি পেয়েছে', en: 'Mass has increased' }, { id: 'd', bn: 'রঙ পরিবর্তন হয়েছে শুধু', en: 'Only the color has changed' }],
        correct: ['a'], explBn: 'ব্যাটারিতে স্বতঃস্ফূর্ত বিক্রিয়ার বিক্রিয়ক পদার্থ ফুরিয়ে গেলে আর বিদ্যুৎ উৎপন্ন হয় না।', explEn: "When a battery's spontaneous-reaction reactants are depleted, it can no longer generate electricity.", difficulty: 'hard' },
    ]);

  await buildChapter('PHY', 12, 'আধুনিক পদার্থবিজ্ঞান: পরমাণুর গঠন', 'Modern Physics: Atomic Structure', 2,
    {
      titleBn: 'রাদারফোর্ড ও বোর মডেল', titleEn: 'Rutherford and Bohr Models',
      bodyBn: 'রাদারফোর্ডের পরীক্ষায় দেখা যায় পরমাণুর ভরের বেশিরভাগ ও ধনাত্মক আধান একটি ক্ষুদ্র কেন্দ্রে (নিউক্লিয়াস) কেন্দ্রীভূত থাকে। বোর মডেল অনুযায়ী ইলেকট্রন নির্দিষ্ট শক্তিস্তরে (কক্ষপথে) ঘোরে এবং এক স্তর থেকে অন্য স্তরে গেলে নির্দিষ্ট পরিমাণ শক্তি শোষণ বা বিকিরণ করে।',
      bodyEn: "Rutherford's experiment showed that most of an atom's mass and positive charge is concentrated in a tiny nucleus. According to the Bohr model, electrons orbit in specific energy levels and absorb or emit a fixed amount of energy when jumping between levels.",
    },
    [
      { bn: 'রাদারফোর্ডের পরীক্ষা থেকে কী প্রমাণিত হয়?', en: "What did Rutherford's experiment prove?",
        options: [{ id: 'a', bn: 'পরমাণুর কেন্দ্রে একটি ক্ষুদ্র, ঘন নিউক্লিয়াস আছে', en: 'The atom has a tiny, dense nucleus at its center' }, { id: 'b', bn: 'ইলেকট্রনের কোনো ভর নেই', en: 'Electrons have no mass' }, { id: 'c', bn: 'পরমাণু অবিভাজ্য', en: 'Atoms are indivisible' }, { id: 'd', bn: 'পরমাণুতে কোনো শূন্যস্থান নেই', en: 'Atoms contain no empty space' }],
        correct: ['a'], explBn: 'স্বর্ণপাত পরীক্ষায় রাদারফোর্ড দেখান যে পরমাণুর ভর ও ধনাত্মক আধান একটি ক্ষুদ্র কেন্দ্রে কেন্দ্রীভূত।', explEn: "Rutherford's gold foil experiment showed that an atom's mass and positive charge are concentrated in a tiny center.", difficulty: 'medium' },
      { bn: 'বোর মডেল অনুযায়ী ইলেকট্রন কোথায় থাকে?', en: 'According to the Bohr model, where do electrons exist?',
        options: [{ id: 'a', bn: 'নির্দিষ্ট শক্তিস্তরে (কক্ষপথে)', en: 'In specific energy levels (orbits)' }, { id: 'b', bn: 'নিউক্লিয়াসের ভেতরে', en: 'Inside the nucleus' }, { id: 'c', bn: 'সম্পূর্ণ এলোমেলোভাবে', en: 'Completely randomly' }, { id: 'd', bn: 'পরমাণুর বাইরে', en: 'Outside the atom' }],
        correct: ['a'], explBn: 'বোর মডেল অনুযায়ী ইলেকট্রন নির্দিষ্ট শক্তিস্তর বা কক্ষপথে আবর্তিত হয়।', explEn: 'The Bohr model states electrons orbit in specific, quantized energy levels.', difficulty: 'easy' },
      { bn: 'ইলেকট্রন উচ্চ শক্তিস্তর থেকে নিম্ন শক্তিস্তরে গেলে কী ঘটে?', en: 'What happens when an electron moves from a higher to a lower energy level?',
        options: [{ id: 'a', bn: 'শক্তি বিকিরণ করে (ফোটন নির্গত হয়)', en: 'It emits energy (releases a photon)' }, { id: 'b', bn: 'শক্তি শোষণ করে', en: 'It absorbs energy' }, { id: 'c', bn: 'কোনো পরিবর্তন হয় না', en: 'Nothing changes' }, { id: 'd', bn: 'ভর বৃদ্ধি পায়', en: 'Its mass increases' }],
        correct: ['a'], explBn: 'উচ্চ থেকে নিম্ন শক্তিস্তরে যাওয়ার সময় ইলেকট্রন অতিরিক্ত শক্তি ফোটন আকারে বিকিরণ করে।', explEn: 'Moving to a lower energy level, an electron releases the excess energy as a photon.' },
      { bn: 'নিউক্লিয়াসে কী থাকে?', en: 'What does the nucleus contain?',
        options: [{ id: 'a', bn: 'প্রোটন ও নিউট্রন', en: 'Protons and neutrons' }, { id: 'b', bn: 'শুধু ইলেকট্রন', en: 'Only electrons' }, { id: 'c', bn: 'শুধু ফোটন', en: 'Only photons' }, { id: 'd', bn: 'কিছুই থাকে না', en: 'Nothing at all' }],
        correct: ['a'], explBn: 'নিউক্লিয়াসে প্রোটন (ধনাত্মক) ও নিউট্রন (নিরপেক্ষ) থাকে।', explEn: 'The nucleus contains protons (positive) and neutrons (neutral).', difficulty: 'easy' },
      { bn: 'পরমাণুর ভর সংখ্যা (mass number) কীসের সমষ্টি?', en: "An atom's mass number is the sum of:",
        options: [{ id: 'a', bn: 'প্রোটন ও নিউট্রন সংখ্যা', en: 'The number of protons and neutrons' }, { id: 'b', bn: 'শুধু ইলেকট্রন সংখ্যা', en: 'Only the number of electrons' }, { id: 'c', bn: 'শুধু প্রোটন সংখ্যা', en: 'Only the number of protons' }, { id: 'd', bn: 'শুধু নিউট্রন সংখ্যা', en: 'Only the number of neutrons' }],
        correct: ['a'], explBn: 'ভর সংখ্যা = প্রোটন সংখ্যা + নিউট্রন সংখ্যা।', explEn: 'Mass number = number of protons + number of neutrons.', difficulty: 'medium' },
      { bn: 'রাদারফোর্ডের স্বর্ণপাত পরীক্ষায় বেশিরভাগ আলফা কণা কী করেছিল?', en: "In Rutherford's gold foil experiment, what did most alpha particles do?",
        options: [{ id: 'a', bn: 'বাধাহীনভাবে সরাসরি চলে গিয়েছিল', en: 'Passed straight through undeflected' }, { id: 'b', bn: 'সম্পূর্ণ প্রতিফলিত হয়েছিল', en: 'Were completely reflected back' }, { id: 'c', bn: 'শোষিত হয়েছিল', en: 'Were absorbed' }, { id: 'd', bn: 'ধ্বংস হয়ে গিয়েছিল', en: 'Were destroyed' }],
        correct: ['a'], explBn: 'বেশিরভাগ আলফা কণা বাধাহীনভাবে সরাসরি চলে যায়, যা প্রমাণ করে পরমাণুর বেশিরভাগ অংশ ফাঁকা।', explEn: 'Most alpha particles passed straight through, proving that most of an atom is empty space.', difficulty: 'hard' },
    ]);

  await buildChapter('BIO', 12, 'জিনতত্ত্ব ও বংশগতি', 'Genetics and Heredity', 2,
    {
      titleBn: 'মেন্ডেলের বংশগতি সূত্র', titleEn: "Mendel's Laws of Inheritance",
      bodyBn: 'জিনতত্ত্ব হলো বংশগতি ও বৈচিত্র্যের বিজ্ঞান। গ্রেগর মেন্ডেল মটরশুঁটি নিয়ে পরীক্ষা করে দেখান যে বৈশিষ্ট্য জোড়া জিনের (অ্যালিল) মাধ্যমে সঞ্চারিত হয় — একটি প্রকট (dominant) ও অন্যটি প্রচ্ছন্ন (recessive) হতে পারে। DNA হলো জিনগত তথ্যের বাহক অণু।',
      bodyEn: "Genetics is the science of heredity and variation. Gregor Mendel's experiments with pea plants showed that traits are passed on through pairs of genes (alleles) — one may be dominant and the other recessive. DNA is the molecule that carries genetic information.",
    },
    [
      { bn: 'জিনতত্ত্বের জনক কাকে বলা হয়?', en: 'Who is called the father of genetics?',
        options: [{ id: 'a', bn: 'গ্রেগর মেন্ডেল', en: 'Gregor Mendel' }, { id: 'b', bn: 'চার্লস ডারউইন', en: 'Charles Darwin' }, { id: 'c', bn: 'লুই পাস্তুর', en: 'Louis Pasteur' }, { id: 'd', bn: 'আইজ্যাক নিউটন', en: 'Isaac Newton' }],
        correct: ['a'], explBn: 'গ্রেগর মেন্ডেল মটরশুঁটি নিয়ে পরীক্ষার মাধ্যমে বংশগতির মূল সূত্র আবিষ্কার করেন, তাই তাকে জিনতত্ত্বের জনক বলা হয়।', explEn: 'Gregor Mendel discovered the fundamental laws of inheritance through pea plant experiments, earning him the title "father of genetics".', difficulty: 'easy' },
      { bn: 'জিনগত তথ্য বহনকারী অণু কোনটি?', en: 'Which molecule carries genetic information?',
        options: [{ id: 'a', bn: 'DNA', en: 'DNA' }, { id: 'b', bn: 'গ্লুকোজ', en: 'Glucose' }, { id: 'c', bn: 'ATP', en: 'ATP' }, { id: 'd', bn: 'পানি', en: 'Water' }],
        correct: ['a'], explBn: 'DNA (ডিঅক্সিরাইবোনিউক্লিক এসিড) জিনগত তথ্যের প্রধান বাহক।', explEn: 'DNA (deoxyribonucleic acid) is the primary carrier of genetic information.', difficulty: 'easy' },
      { bn: 'প্রকট (dominant) বৈশিষ্ট্য বলতে কী বোঝায়?', en: 'What does a dominant trait mean?',
        options: [{ id: 'a', bn: 'যে বৈশিষ্ট্য অন্য বৈশিষ্ট্যকে প্রকাশ হতে বাধা দেয়', en: 'A trait that masks the expression of another trait' }, { id: 'b', bn: 'যে বৈশিষ্ট্য কখনো প্রকাশ পায় না', en: 'A trait that never expresses' }, { id: 'c', bn: 'যে বৈশিষ্ট্য শুধু মায়ের থেকে আসে', en: "A trait that comes only from the mother" }, { id: 'd', bn: 'যে বৈশিষ্ট্য পরিবেশ দ্বারা সৃষ্ট', en: 'A trait caused only by environment' }],
        correct: ['a'], explBn: 'প্রকট অ্যালিল উপস্থিত থাকলে প্রচ্ছন্ন অ্যালিলের বৈশিষ্ট্য প্রকাশ পায় না।', explEn: 'When a dominant allele is present, the recessive allele\'s trait is not expressed.', difficulty: 'medium' },
      { bn: 'একটি জীবের একটি বৈশিষ্ট্যের জন্য সাধারণত কতটি অ্যালিল থাকে?', en: 'How many alleles does an organism typically have for one trait?',
        options: [{ id: 'a', bn: '২টি (এক জোড়া)', en: '2 (a pair)' }, { id: 'b', bn: '১টি', en: '1' }, { id: 'c', bn: '৪টি', en: '4' }, { id: 'd', bn: '০টি', en: '0' }],
        correct: ['a'], explBn: 'প্রতিটি বৈশিষ্ট্যের জন্য একটি জীব পিতা-মাতা থেকে একটি করে মোট দুটি অ্যালিল পায়।', explEn: 'For each trait, an organism inherits one allele from each parent, totaling two.', difficulty: 'medium' },
      { bn: 'মেন্ডেল তার পরীক্ষার জন্য কোন উদ্ভিদ ব্যবহার করেন?', en: 'Which plant did Mendel use for his experiments?',
        options: [{ id: 'a', bn: 'মটরশুঁটি', en: 'Pea plant' }, { id: 'b', bn: 'ধান', en: 'Rice' }, { id: 'c', bn: 'গোলাপ', en: 'Rose' }, { id: 'd', bn: 'আম গাছ', en: 'Mango tree' }],
        correct: ['a'], explBn: 'মেন্ডেল মটরশুঁটি উদ্ভিদ নিয়ে পরীক্ষা করে বংশগতির সূত্র আবিষ্কার করেন।', explEn: 'Mendel discovered the laws of inheritance by experimenting with pea plants.', difficulty: 'easy' },
      { bn: 'জিনোটাইপ ও ফিনোটাইপের পার্থক্য কী?', en: 'What is the difference between genotype and phenotype?',
        options: [{ id: 'a', bn: 'জিনোটাইপ জিনগত গঠন, ফিনোটাইপ প্রকাশিত বৈশিষ্ট্য', en: 'Genotype is genetic makeup, phenotype is the expressed trait' }, { id: 'b', bn: 'উভয়ই একই জিনিস', en: 'They are the same thing' }, { id: 'c', bn: 'ফিনোটাইপ জিনগত গঠন নির্দেশ করে', en: 'Phenotype refers to genetic makeup' }, { id: 'd', bn: 'জিনোটাইপ শুধু পরিবেশগত', en: 'Genotype is purely environmental' }],
        correct: ['a'], explBn: 'জিনোটাইপ হলো একটি জীবের জিনগত গঠন, আর ফিনোটাইপ হলো তার দৃশ্যমান/প্রকাশিত বৈশিষ্ট্য।', explEn: "Genotype is an organism's genetic makeup; phenotype is its observable, expressed trait.", difficulty: 'hard' },
    ]);

  await buildChapter('ICT', 12, 'ডেটাবেজের ভূমিকা', 'Introduction to Databases', 2,
    {
      titleBn: 'ডেটাবেজ ও টেবিল', titleEn: 'Databases and Tables',
      bodyBn: 'ডেটাবেজ হলো সুসংগঠিতভাবে সংরক্ষিত তথ্যের সমষ্টি, যা সহজে অনুসন্ধান, সংযোজন ও হালনাগাদ করা যায়। রিলেশনাল ডেটাবেজে তথ্য টেবিলে (row ও column আকারে) সংরক্ষিত হয়। প্রতিটি টেবিলের একটি প্রাইমারি কী (primary key) থাকে যা প্রতিটি সারিকে অনন্যভাবে শনাক্ত করে।',
      bodyEn: 'A database is an organized collection of data that can be easily searched, added to, and updated. In a relational database, data is stored in tables (rows and columns). Each table has a primary key that uniquely identifies every row.',
    },
    [
      { bn: 'রিলেশনাল ডেটাবেজে তথ্য কীভাবে সংরক্ষিত হয়?', en: 'How is data stored in a relational database?',
        options: [{ id: 'a', bn: 'টেবিলে (row ও column আকারে)', en: 'In tables (rows and columns)' }, { id: 'b', bn: 'শুধু ছবিতে', en: 'Only as images' }, { id: 'c', bn: 'শুধু ভিডিওতে', en: 'Only as videos' }, { id: 'd', bn: 'কোনো কাঠামো ছাড়াই', en: 'With no structure at all' }],
        correct: ['a'], explBn: 'রিলেশনাল ডেটাবেজে তথ্য টেবিলে সারি (row) ও কলামে (column) সংরক্ষিত হয়।', explEn: 'In a relational database, data is organized into tables of rows and columns.', difficulty: 'easy' },
      { bn: 'প্রাইমারি কী (primary key) এর কাজ কী?', en: 'What is the function of a primary key?',
        options: [{ id: 'a', bn: 'প্রতিটি সারিকে অনন্যভাবে শনাক্ত করা', en: 'To uniquely identify each row' }, { id: 'b', bn: 'টেবিলের রঙ ঠিক করা', en: "To set the table's color" }, { id: 'c', bn: 'ডেটা মুছে ফেলা', en: 'To delete data' }, { id: 'd', bn: 'টেবিলের নাম পরিবর্তন করা', en: "To rename the table" }],
        correct: ['a'], explBn: 'প্রাইমারি কী প্রতিটি সারির জন্য একটি অনন্য মান নিশ্চিত করে, যাতে সদৃশ সারি এড়ানো যায়।', explEn: 'A primary key ensures each row has a unique value, preventing duplicate rows.', difficulty: 'medium' },
      { bn: 'SQL শব্দের পূর্ণরূপ কী?', en: 'What does SQL stand for?',
        options: [{ id: 'a', bn: 'Structured Query Language', en: 'Structured Query Language' }, { id: 'b', bn: 'Simple Question Language', en: 'Simple Question Language' }, { id: 'c', bn: 'System Quality Level', en: 'System Quality Level' }, { id: 'd', bn: 'Software Query Logic', en: 'Software Query Logic' }],
        correct: ['a'], explBn: 'SQL মানে Structured Query Language — ডেটাবেজ পরিচালনার জন্য ব্যবহৃত ভাষা।', explEn: 'SQL stands for Structured Query Language, used to manage databases.', difficulty: 'easy' },
      { bn: 'ডেটাবেজে "SELECT" কমান্ডের কাজ কী?', en: 'What does the "SELECT" command do in a database?',
        options: [{ id: 'a', bn: 'ডেটা অনুসন্ধান/প্রদর্শন করা', en: 'To retrieve/display data' }, { id: 'b', bn: 'ডেটা মুছে ফেলা', en: 'To delete data' }, { id: 'c', bn: 'টেবিল তৈরি করা', en: 'To create a table' }, { id: 'd', bn: 'ডেটাবেজ বন্ধ করা', en: 'To close the database' }],
        correct: ['a'], explBn: 'SELECT কমান্ড টেবিল থেকে নির্দিষ্ট ডেটা অনুসন্ধান করে প্রদর্শন করে।', explEn: 'The SELECT command retrieves and displays specific data from a table.' },
      { bn: 'দুটি টেবিলের মধ্যে সম্পর্ক স্থাপনের জন্য কী ব্যবহৃত হয়?', en: 'What is used to establish a relationship between two tables?',
        options: [{ id: 'a', bn: 'ফরেন কী (foreign key)', en: 'Foreign key' }, { id: 'b', bn: 'টেবিলের রঙ', en: "The table's color" }, { id: 'c', bn: 'টেবিলের আকার', en: "The table's size" }, { id: 'd', bn: 'ফন্টের ধরন', en: 'Font style' }],
        correct: ['a'], explBn: 'ফরেন কী একটি টেবিলের কলামকে অন্য টেবিলের প্রাইমারি কী-এর সাথে সংযুক্ত করে সম্পর্ক তৈরি করে।', explEn: 'A foreign key links a column in one table to the primary key of another, establishing a relationship.', difficulty: 'medium' },
      { bn: 'ডেটাবেজ ব্যবহারের প্রধান সুবিধা কী?', en: 'What is a main advantage of using a database?',
        options: [{ id: 'a', bn: 'দ্রুত ও সুসংগঠিতভাবে তথ্য খোঁজা ও হালনাগাদ করা যায়', en: 'Data can be searched and updated quickly and in an organized way' }, { id: 'b', bn: 'ডেটা হারিয়ে যাওয়া নিশ্চিত করে', en: 'It guarantees data loss' }, { id: 'c', bn: 'প্রিন্টিং দ্রুত করে', en: 'It speeds up printing' }, { id: 'd', bn: 'ইন্টারনেট প্রয়োজন হয় না কখনোই', en: 'It never requires internet' }],
        correct: ['a'], explBn: 'ডেটাবেজ ব্যবহার করলে বিপুল পরিমাণ তথ্য দ্রুত অনুসন্ধান, সংযোজন ও হালনাগাদ করা যায়।', explEn: 'Databases let large amounts of data be searched, added to, and updated quickly and reliably.', difficulty: 'easy' },
    ]);

  await buildChapter('ICT', 12, 'HTML ও ওয়েব পেজ', 'HTML and Web Pages', 3,
    {
      titleBn: 'HTML ট্যাগ ও গঠন', titleEn: 'HTML Tags and Structure',
      bodyBn: 'HTML (HyperText Markup Language) দিয়ে ওয়েব পেজের কাঠামো তৈরি করা হয়। প্রতিটি HTML ডকুমেন্ট ট্যাগ দিয়ে গঠিত, যেমন <h1> শিরোনামের জন্য, <p> অনুচ্ছেদের জন্য, <a> লিংকের জন্য। CSS দিয়ে HTML-এর ডিজাইন/স্টাইল করা হয়।',
      bodyEn: 'HTML (HyperText Markup Language) is used to build the structure of a web page. Every HTML document is made of tags, such as <h1> for a heading, <p> for a paragraph, and <a> for a link. CSS is used to style/design HTML.',
      formula: { titleBn: 'উদাহরণ', titleEn: 'Example', bodyBn: '<html>\n  <body>\n    <h1>শিরোনাম</h1>\n    <p>একটি অনুচ্ছেদ।</p>\n  </body>\n</html>', bodyEn: '<html>\n  <body>\n    <h1>Heading</h1>\n    <p>A paragraph.</p>\n  </body>\n</html>' },
    },
    [
      { bn: 'HTML শব্দের পূর্ণরূপ কী?', en: 'What does HTML stand for?',
        options: [{ id: 'a', bn: 'HyperText Markup Language', en: 'HyperText Markup Language' }, { id: 'b', bn: 'High-Tech Modern Language', en: 'High-Tech Modern Language' }, { id: 'c', bn: 'Home Tool Markup Language', en: 'Home Tool Markup Language' }, { id: 'd', bn: 'Hyperlink and Text Markup Language', en: 'Hyperlink and Text Markup Language' }],
        correct: ['a'], explBn: 'HTML মানে HyperText Markup Language — ওয়েব পেজের কাঠামো তৈরির ভাষা।', explEn: 'HTML stands for HyperText Markup Language, used to structure web pages.', difficulty: 'easy' },
      { bn: 'একটি শিরোনাম (heading) তৈরি করতে কোন ট্যাগ ব্যবহৃত হয়?', en: 'Which tag is used to create a heading?',
        options: [{ id: 'a', bn: '<h1>', en: '<h1>' }, { id: 'b', bn: '<p>', en: '<p>' }, { id: 'c', bn: '<a>', en: '<a>' }, { id: 'd', bn: '<div> শুধু', en: 'Only <div>' }],
        correct: ['a'], explBn: '<h1> থেকে <h6> পর্যন্ত ট্যাগ বিভিন্ন স্তরের শিরোনাম তৈরিতে ব্যবহৃত হয়।', explEn: 'Tags <h1> through <h6> are used to create headings of different levels.', difficulty: 'easy' },
      { bn: 'HTML-এর ডিজাইন/স্টাইল করার জন্য কী ব্যবহৃত হয়?', en: "What is used to style/design an HTML page's appearance?",
        options: [{ id: 'a', bn: 'CSS', en: 'CSS' }, { id: 'b', bn: 'SQL', en: 'SQL' }, { id: 'c', bn: 'TCP/IP', en: 'TCP/IP' }, { id: 'd', bn: 'SMTP', en: 'SMTP' }],
        correct: ['a'], explBn: 'CSS (Cascading Style Sheets) দিয়ে HTML-এর রঙ, ফন্ট, লেআউট ইত্যাদি স্টাইল করা হয়।', explEn: 'CSS (Cascading Style Sheets) is used to style colors, fonts, layout, etc. of HTML.' },
      { bn: 'লিংক তৈরি করতে কোন ট্যাগ ব্যবহৃত হয়?', en: 'Which tag is used to create a hyperlink?',
        options: [{ id: 'a', bn: '<a>', en: '<a>' }, { id: 'b', bn: '<p>', en: '<p>' }, { id: 'c', bn: '<h1>', en: '<h1>' }, { id: 'd', bn: '<img> শুধু', en: 'Only <img>' }],
        correct: ['a'], explBn: '<a> (anchor) ট্যাগ href অ্যাট্রিবিউটসহ হাইপারলিংক তৈরি করতে ব্যবহৃত হয়।', explEn: 'The <a> (anchor) tag with an href attribute is used to create hyperlinks.', difficulty: 'easy' },
      { bn: 'একটি ছবি (image) যোগ করতে কোন ট্যাগ ব্যবহৃত হয়?', en: 'Which tag is used to add an image?',
        options: [{ id: 'a', bn: '<img>', en: '<img>' }, { id: 'b', bn: '<pic>', en: '<pic>' }, { id: 'c', bn: '<photo>', en: '<photo>' }, { id: 'd', bn: '<image_add>', en: '<image_add>' }],
        correct: ['a'], explBn: '<img> ট্যাগ src অ্যাট্রিবিউটসহ ওয়েব পেজে ছবি প্রদর্শন করে।', explEn: 'The <img> tag with a src attribute displays an image on a web page.', difficulty: 'easy' },
      { bn: 'একটি সম্পূর্ণ HTML ডকুমেন্টের মূল ট্যাগ কোনটি যার মধ্যে বাকি সব ট্যাগ থাকে?', en: 'Which is the root tag of an HTML document that contains all other tags?',
        options: [{ id: 'a', bn: '<html>', en: '<html>' }, { id: 'b', bn: '<body> শুধু', en: 'Only <body>' }, { id: 'c', bn: '<head> শুধু', en: 'Only <head>' }, { id: 'd', bn: '<p>', en: '<p>' }],
        correct: ['a'], explBn: '<html> ট্যাগ সম্পূর্ণ ডকুমেন্টের মূল উপাদান, যার ভেতরে <head> ও <body> থাকে।', explEn: 'The <html> tag is the root element of the whole document, containing <head> and <body>.', difficulty: 'medium' },
    ]);

  console.log('\nAll 20 chapters seeded successfully.');
  await pool.end();
}

main().catch(err => { console.error(err); process.exit(1); });
