/* Registers 5 new genuinely-interactive simulation labs, attached to chapters
   created in seed-expansion-classes-9-12.js. Run: node db/seed-simulations-round2.js */
require('dotenv').config();
const pool = require('../config/database');

async function getChapterId(titleEn) {
  const r = await pool.query('SELECT id FROM chapters WHERE title_en = $1', [titleEn]);
  if (!r.rows.length) throw new Error(`Chapter "${titleEn}" not found — run seed-expansion-classes-9-12.js first`);
  return r.rows[0].id;
}

async function upsertSimulation(chapterId, key, titleBn, titleEn, config) {
  const existing = await pool.query('SELECT id FROM simulations WHERE key = $1', [key]);
  if (existing.rows.length) { console.log(`  = ${titleEn} already exists`); return; }
  await pool.query(
    `INSERT INTO simulations (chapter_id, key, title_bn, title_en, config, status) VALUES ($1,$2,$3,$4,$5,'published')`,
    [chapterId, key, titleBn, titleEn, JSON.stringify(config || {})]
  );
  console.log(`  ✓ ${titleEn} (key: ${key})`);
}

async function main() {
  await upsertSimulation(
    await getChapterId('Electric Current and Circuits'),
    'phy-circuit', 'ওহমের সূত্র বর্তনী ল্যাব', "Ohm's Law Circuit Lab",
    { seriesParallel: true, voltageRange: [1, 12], resistanceRange: [1, 100] }
  );

  await upsertSimulation(
    await getChapterId('Refraction of Light and Lenses'),
    'phy-lens', 'উত্তল লেন্সের ফোকাস দূরত্ব নির্ণয়', 'Convex Lens Focal Length Lab',
    { focalLengthCm: 12 }
  );

  await upsertSimulation(
    await getChapterId('Acids, Bases and Salts'),
    'chem-titration', 'এসিড-ক্ষার টাইট্রেশন', 'Acid-Base Titration Lab',
    { acidVolumeMl: 25, acidConcentrationM: 0.1, baseConcentrationM: 0.1 }
  );

  await upsertSimulation(
    await getChapterId('Photosynthesis'),
    'bio-photosynthesis', 'সালোকসংশ্লেষণে আলোর প্রভাব', 'Effect of Light on Photosynthesis',
    { distanceRangeCm: [5, 100] }
  );

  await upsertSimulation(
    await getChapterId('HTML and Web Pages'),
    'ict-html-editor', 'লাইভ HTML/CSS এডিটর', 'Live HTML/CSS Editor',
    { starterHtml: '<h1>Hello!</h1>\n<p>Edit me.</p>', starterCss: 'h1 { color: teal; }' }
  );

  console.log('\nDone.');
  await pool.end();
}

main().catch(err => { console.error(err); process.exit(1); });
