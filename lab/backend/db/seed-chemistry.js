/* Chemistry vertical-slice seed for the SRS build:
   - Safety equipment catalog (FR-8)
   - Safety requirements for the chemistry simulations
   - Book records for the Class 9-10 / 11 / 12 chemistry PDFs (FR-5)
   - Lab sequence ordering on the chemistry simulations (FR-7)
   Idempotent. Run after: npm run db:seed && node db/seed-expansion-classes-9-12.js && node db/seed-simulations-round2.js
   Usage: node db/seed-chemistry.js */
require('dotenv').config();

// Safety equipment catalog — keyed, bilingual, emoji icon.
const EQUIPMENT = [
  { key: 'goggles',    icon: '🥽', bn: 'সুরক্ষা চশমা',        en: 'Safety Goggles' },
  { key: 'gloves',     icon: '🧤', bn: 'হ্যান্ড গ্লাভস',       en: 'Hand Gloves' },
  { key: 'apron',      icon: '🥼', bn: 'ল্যাব অ্যাপ্রন',        en: 'Lab Apron' },
  { key: 'mask',       icon: '😷', bn: 'ফেস মাস্ক',           en: 'Face Mask' },
  { key: 'fume_hood',  icon: '🌫️', bn: 'ফিউম হুড',           en: 'Fume Hood' },
  { key: 'tongs',      icon: '🩹', bn: 'টেস্টটিউব হোল্ডার',    en: 'Test-tube Holder / Tongs' },
  { key: 'shoes',      icon: '👟', bn: 'বন্ধ জুতা',           en: 'Closed-toe Shoes' },
  { key: 'first_aid',  icon: '🧰', bn: 'ফার্স্ট এইড বক্স',      en: 'First-aid Box' },
];

// Which equipment each chemistry lab requires (by simulation key).
const REQUIREMENTS = {
  'chem-mixing':    ['goggles', 'gloves', 'apron', 'fume_hood'],
  'chem-titration': ['goggles', 'gloves', 'apron'],
};

// Chemistry textbooks (paths are relative to the backend directory).
const BOOKS = [
  { class: 9,  bn: 'রসায়ন (নবম-দশম শ্রেণি)',      en: 'Chemistry (Class 9-10)',        path: '../text-books/class-9-10/Chemistry_class_9_and_10.pdf' },
  { class: 11, bn: 'রসায়ন ১ম পত্র (একাদশ শ্রেণি)', en: 'Chemistry First Part (Class 11)', path: '../text-books/class-11-12/Chemistry_First_part_Class_11.pdf' },
  { class: 12, bn: 'রসায়ন ২য় পত্র (দ্বাদশ শ্রেণি)', en: 'Chemistry Second Part (Class 12)', path: '../text-books/class-11-12/Chemistry_Second_part_Class_12.pdf' },
];

async function run(pool) {
  const chem = await pool.query(`SELECT id FROM subjects WHERE code = 'CHE'`);
  if (!chem.rows.length) throw new Error('Chemistry subject not found — run npm run db:seed first');
  const chemId = chem.rows[0].id;

  // 1. Equipment catalog
  for (const e of EQUIPMENT) {
    await pool.query(
      `INSERT INTO safety_equipment (key, name_bn, name_en, icon) VALUES ($1,$2,$3,$4)
       ON CONFLICT (key) DO UPDATE SET name_bn=EXCLUDED.name_bn, name_en=EXCLUDED.name_en, icon=EXCLUDED.icon`,
      [e.key, e.bn, e.en, e.icon]
    );
  }
  console.log(`✓ ${EQUIPMENT.length} safety equipment items`);

  // 2. Requirements per simulation
  for (const [simKey, keys] of Object.entries(REQUIREMENTS)) {
    const sim = await pool.query('SELECT id FROM simulations WHERE key = $1', [simKey]);
    if (!sim.rows.length) { console.log(`  = simulation ${simKey} not found, skipping`); continue; }
    const simId = sim.rows[0].id;
    for (const eqKey of keys) {
      const eq = await pool.query('SELECT id FROM safety_equipment WHERE key = $1', [eqKey]);
      await pool.query(
        `INSERT INTO lab_safety_requirements (simulation_id, equipment_id, required) VALUES ($1,$2,true)
         ON CONFLICT (simulation_id, equipment_id) DO NOTHING`,
        [simId, eq.rows[0].id]
      );
    }
    console.log(`  ✓ ${simKey} requires: ${keys.join(', ')}`);
  }

  // 3. Book records
  for (const b of BOOKS) {
    const existing = await pool.query('SELECT id FROM books WHERE file_path = $1', [b.path]);
    if (existing.rows.length) { console.log(`  = book ${b.en} already registered`); continue; }
    await pool.query(
      `INSERT INTO books (subject_id, class_level, title_bn, title_en, file_path, original_name, status)
       VALUES ($1,$2,$3,$4,$5,$6,'published')`,
      [chemId, b.class, b.bn, b.en, b.path, b.path.split('/').pop()]
    );
    console.log(`  ✓ book: ${b.en}`);
  }

  // 4. Lab sequence ordering (chem-mixing first, then titration)
  await pool.query(`UPDATE simulations SET order_index = 1 WHERE key = 'chem-mixing'`);
  await pool.query(`UPDATE simulations SET order_index = 2 WHERE key = 'chem-titration'`);
  console.log('✓ chemistry lab ordering set');

  // 5. Guided step scripts (FR-2.2) merged into simulations.config
  const GUIDED = {
    'chem-mixing': [
      { instruction_bn: 'শেলফ থেকে একটি এসিড নির্বাচন করে প্রথম পাত্রে যোগ করুন।', instruction_en: 'Select an acid from the shelf and add it to the first vessel.', hint_bn: 'যেমন HCl বা H₂SO₄।', hint_en: 'e.g. HCl or H₂SO₄.' },
      { instruction_bn: 'দ্বিতীয় পাত্রে একটি ক্ষার যোগ করুন।', instruction_en: 'Add a base to the second vessel.', hint_bn: 'যেমন NaOH বা Ca(OH)₂।', hint_en: 'e.g. NaOH or Ca(OH)₂.' },
      { instruction_bn: 'একটি নির্দেশক যোগ করুন যাতে বিক্রিয়া পর্যবেক্ষণ করা যায়।', instruction_en: 'Add an indicator so you can observe the reaction.', hint_bn: 'ইউনিভার্সাল ইন্ডিকেটর নিরপেক্ষে সবুজ দেখায়।', hint_en: 'Universal indicator shows green at neutral pH.' },
      { instruction_bn: 'বিক্রিয়া চালান এবং রঙ/গ্যাস/অধঃক্ষেপ পর্যবেক্ষণ করুন।', instruction_en: 'Run the reaction and observe colour, gas or precipitate.', hint_bn: 'নিরপেক্ষীকরণে লবণ ও পানি তৈরি হয়।', hint_en: 'Neutralization forms a salt and water.' },
      { instruction_bn: 'পর্যবেক্ষণ ল্যাব নোটবুকে লিখে "সমাপ্ত করুন" চাপুন।', instruction_en: 'Record your observation in the notebook, then press Finish.', hint_bn: 'রিপোর্ট সংরক্ষণ করলে ড্যাশবোর্ডে দেখা যাবে।', hint_en: 'Saved reports appear on your dashboard.' },
    ],
    'chem-titration': [
      { instruction_bn: 'ব্যুরেটটি ক্ষার দ্রবণ দিয়ে পূর্ণ করুন এবং প্রাথমিক পাঠ নিন।', instruction_en: 'Fill the burette with the base solution and take the initial reading.', hint_bn: 'চোখ পাঠের সমতলে রাখুন।', hint_en: 'Keep your eye level with the meniscus.' },
      { instruction_bn: 'কনিক্যাল ফ্লাস্কে নির্দিষ্ট আয়তনের এসিড ও কয়েক ফোঁটা নির্দেশক নিন।', instruction_en: 'Add a measured volume of acid and a few drops of indicator to the flask.', hint_bn: 'ফেনলফথ্যালিন এসিডে বর্ণহীন থাকে।', hint_en: 'Phenolphthalein is colourless in acid.' },
      { instruction_bn: 'নাড়তে নাড়তে ধীরে ধীরে ক্ষার যোগ করুন।', instruction_en: 'Slowly add base while swirling the flask.', hint_bn: 'শেষ বিন্দুর কাছে ফোঁটায় ফোঁটায় যোগ করুন।', hint_en: 'Add drop by drop near the endpoint.' },
      { instruction_bn: 'রঙ পরিবর্তনের বিন্দুতে (শেষ বিন্দু) থামুন এবং আয়তন পড়ুন।', instruction_en: 'Stop at the colour change (endpoint) and read the volume used.', hint_bn: 'স্থায়ী হালকা গোলাপি রঙই শেষ বিন্দু।', hint_en: 'A lasting pale pink marks the endpoint.' },
      { instruction_bn: 'M₁V₁ = M₂V₂ ব্যবহার করে অজানা ঘনমাত্রা নির্ণয় করে রেকর্ড করুন।', instruction_en: 'Use M₁V₁ = M₂V₂ to find the unknown concentration and record it.', hint_bn: 'একক মিলিয়ে নিন।', hint_en: 'Keep your units consistent.' },
    ],
  };
  for (const [simKey, steps] of Object.entries(GUIDED)) {
    await pool.query(
      `UPDATE simulations SET config = COALESCE(config,'{}'::jsonb) || jsonb_build_object('guidedSteps', $1::jsonb) WHERE key = $2`,
      [JSON.stringify(steps), simKey]
    );
  }
  console.log('✓ guided step scripts seeded');
}

module.exports = { run };

if (require.main === module) {
  const pool = require('../config/database');
  run(pool)
    .then(() => { console.log('\nChemistry seed complete.'); return pool.end(); })
    .catch(err => { console.error(err); process.exit(1); });
}
