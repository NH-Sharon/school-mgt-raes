/* Class 11 / 12 Chemistry study content + question bank, built from the textbook pages
   (db/data/chemistry-11/bank/*.json, db/data/chemistry-12/bank/*.json — authored offline, see docs).
   Per chapter: chapter row, one topic per book section, study notes (learning_content), MCQs, CQs.
   Idempotent: re-running replaces the content of the chapters it manages.
   Usage: node db/seed-chemistry-hsc.js 11    (or 12) */
require('dotenv').config();
const fs = require('fs');
const path = require('path');

const BOOKS = {
  11: { dir: 'chemistry-11', chapters: {
    1: ['ল্যাবরেটরির নিরাপদ ব্যবহার', 'Safe Use of the Laboratory'],
    2: ['গুণগত রসায়ন', 'Qualitative Chemistry'],
    3: ['মৌলের পর্যায়বৃত্ত ধর্ম ও রাসায়নিক বন্ধন', 'Periodic Properties of Elements and Chemical Bonding'],
    4: ['রাসায়নিক পরিবর্তন', 'Chemical Changes'],
    5: ['কর্মমুখী রসায়ন', 'Vocational Chemistry'],
  } },
  12: { dir: 'chemistry-12', chapters: {
    1: ['গ্রুপ-V ও গ্রুপ-VI মৌলের রসায়ন', 'Chemistry of Group V and Group VI Elements'],
    2: ['হ্যালোজেন গ্রুপ', 'The Halogen Group'],
    3: ['d-ব্লক মৌল', 'd-Block Elements'],
    4: ['জৈব রসায়নের সূচনা', 'Introduction to Organic Chemistry'],
    5: ['হাইড্রোকার্বন', 'Hydrocarbons'],
    6: ['হ্যালোজেন জাতক', 'Halogen Derivatives'],
    7: ['অ্যালকোহল, ফেনল ও ইথার', 'Alcohols, Phenols and Ethers'],
    8: ['অ্যালডিহাইড ও কিটোন', 'Aldehydes and Ketones'],
    9: ['কার্বক্সিলিক এসিড', 'Carboxylic Acids'],
    10: ['অ্যামিন', 'Amines'],
    11: ['বায়োঅণুসমূহের রসায়ন', 'Chemistry of Biomolecules'],
    12: ['জৈব যৌগের শনাক্তকরণ ও বিশ্লেষণ', 'Identification and Analysis of Organic Compounds'],
  } },
};
const num = (s) => String(s).split('.').map(Number);
const cmp = (a, b) => { const x = num(a), y = num(b); return x[0] - y[0] || x[1] - y[1]; };

function load(cls) {
  const dir = path.join(__dirname, 'data', BOOKS[cls].dir, 'bank');
  const byCh = {};
  for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.json')).sort()) {
    const d = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    const ch = byCh[d.chapter_no] ||= { topics: [], cq: [] };
    ch.topics.push(...(d.topics || []));
    ch.cq.push(...(d.cq || []));
  }
  Object.values(byCh).forEach(c => c.topics.sort((a, b) => cmp(a.section_no, b.section_no)));
  return byCh;
}

async function run(pool, cls = 11, only = null) {
  const byCh = load(cls);
  const client = await pool.connect();
  const summary = { chapters: 0, topics: 0, notes: 0, mcqs: 0, cqs: 0 };
  try {
    const subj = await client.query(`SELECT id FROM subjects WHERE code = 'CHE'`);
    if (!subj.rows.length) throw new Error('Chemistry subject missing');
    const subjectId = subj.rows[0].id;
    await client.query('BEGIN');
    for (const [no, data] of Object.entries(byCh)) {
      if (only && +no !== +only) continue;
      const names = BOOKS[cls].chapters[no]; if (!names || !data.topics.length) continue;
      const [bn, en] = names;
      let row = await client.query(`SELECT id FROM chapters WHERE subject_id=$1 AND class_level=$2 AND title_en=$3`, [subjectId, cls, en]);
      let chapterId;
      if (row.rows.length) {
        chapterId = row.rows[0].id;
        await client.query(`UPDATE chapters SET title_bn=$1, order_index=$2, status='published' WHERE id=$3`, [bn, +no, chapterId]);
        await client.query('DELETE FROM cq_questions WHERE chapter_id=$1', [chapterId]);
        await client.query('DELETE FROM questions WHERE chapter_id=$1', [chapterId]);
        await client.query('DELETE FROM learning_content WHERE chapter_id=$1', [chapterId]);
        await client.query('DELETE FROM topics WHERE chapter_id=$1', [chapterId]);
      } else {
        chapterId = (await client.query(
          `INSERT INTO chapters (subject_id, class_level, title_bn, title_en, order_index, status) VALUES ($1,$2,$3,$4,$5,'published') RETURNING id`,
          [subjectId, cls, bn, en, +no])).rows[0].id;
      }
      summary.chapters++;
      // bulk inserts (one statement per table per chapter) so a remote database stays fast
      const tps = data.topics;
      const tr = await client.query(
        `INSERT INTO topics (chapter_id, title_bn, title_en, order_index, status)
         SELECT $1, t.bn, t.en, t.ord, 'published' FROM unnest($2::text[], $3::text[], $4::int[]) AS t(bn, en, ord) RETURNING id, order_index`,
        [chapterId, tps.map(t => `${t.section_no} ${t.title_bn}`), tps.map(t => `${t.section_no} ${t.title_en || t.title_bn}`), tps.map((_, i) => i + 1)]);
      const topicIdBySec = {};
      tr.rows.forEach(r => { topicIdBySec[tps[r.order_index - 1].section_no] = r.id; });
      summary.topics += tps.length;

      const notes = tps.map((t, i) => ({ t, i })).filter(x => x.t.notes_bn);
      if (notes.length) {
        await client.query(
          `INSERT INTO learning_content (chapter_id, content_type, title_bn, title_en, body_bn, body_en, order_index, status)
           SELECT $1, 'notes', n.tbn, n.ten, n.bbn, NULLIF(n.ben, ''), n.ord, 'published' FROM unnest($2::text[], $3::text[], $4::text[], $5::text[], $6::int[]) AS n(tbn, ten, bbn, ben, ord)`,
          [chapterId, notes.map(x => `${x.t.section_no} ${x.t.title_bn}`), notes.map(x => `${x.t.section_no} ${x.t.title_en || x.t.title_bn}`),
            notes.map(x => x.t.notes_bn), notes.map(x => x.t.notes_en || ''), notes.map(x => x.i + 1)]);
        summary.notes += notes.length;
      }

      const qs = [];
      for (const tp of tps) for (const q of tp.mcqs || []) {
        const correct = Array.isArray(q.correct) ? q.correct : [q.correct];
        qs.push({ topic: topicIdBySec[tp.section_no], bn: q.question_bn, en: q.question_en || q.question_bn, opts: JSON.stringify(q.options), cor: JSON.stringify(correct),
          type: correct.length > 1 ? 'multiple' : 'single', ebn: q.explanation_bn || '', een: q.explanation_en || '',
          diff: ['basic', 'medium', 'advanced'].includes(q.difficulty) ? q.difficulty : 'medium' });
      }
      if (qs.length) {
        await client.query(
          `INSERT INTO questions (chapter_id, topic_id, question_bn, question_en, options, correct_answers, question_type, explanation_bn, explanation_en, difficulty, status)
           SELECT $1, q.topic, q.bn, q.en, q.opts::jsonb, q.cor::jsonb, q.type, q.ebn, q.een, q.diff, 'published'
           FROM unnest($2::int[], $3::text[], $4::text[], $5::text[], $6::text[], $7::text[], $8::text[], $9::text[], $10::text[]) AS q(topic, bn, en, opts, cor, type, ebn, een, diff)`,
          [chapterId, qs.map(q => q.topic), qs.map(q => q.bn), qs.map(q => q.en), qs.map(q => q.opts), qs.map(q => q.cor), qs.map(q => q.type), qs.map(q => q.ebn), qs.map(q => q.een), qs.map(q => q.diff)]);
        summary.mcqs += qs.length;
      }

      const dmap = { hard: 'advanced', easy: 'basic' };
      const cqs = data.cq.map(cq => ({ topic: topicIdBySec[cq.topic_section] || Object.values(topicIdBySec)[0], sbn: cq.stimulus_bn, sen: cq.stimulus_en || cq.stimulus_bn,
        parts: JSON.stringify(cq.parts), diff: dmap[cq.difficulty] || (['basic', 'medium', 'advanced'].includes(cq.difficulty) ? cq.difficulty : 'medium') }));
      if (cqs.length) {
        await client.query(
          `INSERT INTO cq_questions (chapter_id, topic_id, stimulus_bn, stimulus_en, parts, difficulty, status)
           SELECT $1, c.topic, c.sbn, c.sen, c.parts::jsonb, c.diff, 'published' FROM unnest($2::int[], $3::text[], $4::text[], $5::text[], $6::text[]) AS c(topic, sbn, sen, parts, diff)`,
          [chapterId, cqs.map(c => c.topic), cqs.map(c => c.sbn), cqs.map(c => c.sen), cqs.map(c => c.parts), cqs.map(c => c.diff)]);
        summary.cqs += cqs.length;
      }
    }
    await client.query('COMMIT');
    return summary;
  } catch (e) { await client.query('ROLLBACK'); throw e; } finally { client.release(); }
}
module.exports = { run };
if (require.main === module) {
  const pool = require('../config/database');
  run(pool, +(process.argv[2] || 11)).then(s => { console.log('✓ seeded', JSON.stringify(s)); return pool.end(); }).catch(e => { console.error(e); process.exit(1); });
}
