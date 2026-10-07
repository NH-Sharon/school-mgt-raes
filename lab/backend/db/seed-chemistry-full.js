/* Full NCTB Class 9-10 Chemistry question bank (12 chapters, topic-wise,
   level-tiered MCQs + Creative Questions), authored offline (no LLM at runtime).
   Consumes chem_part1..4.json produced by the authoring step.
   Seeds everything as published, subject = Chemistry, class_level = 9.
   Preserves the chemistry simulations by migrating them to the Acid-Base chapter,
   then removes leftover ad-hoc class-9 chemistry chapters.
   Idempotent (re-running replaces the 12 chapters' content).
   Usage: node db/seed-chemistry-full.js */
require('dotenv').config();
const fs = require('fs');
const path = require('path');

// Authored question-bank JSON lives in the repo so this seed is reproducible.
// Uses the comprehensive `chem_full_part*.json` files (6 topics/chapter).
const PARTS_DIR = process.env.CHEM_PARTS_DIR || path.join(__dirname, 'data', 'chemistry-9-10');

function loadChapters() {
  const files = fs.readdirSync(PARTS_DIR)
    .filter(f => /^chem_full_part\d+\.json$/.test(f))
    .sort();
  if (!files.length) throw new Error(`No chem_full_part*.json in ${PARTS_DIR} — run the authoring step first.`);
  let chapters = [];
  for (const f of files) {
    const arr = JSON.parse(fs.readFileSync(path.join(PARTS_DIR, f), 'utf8'));
    if (!Array.isArray(arr)) throw new Error(`${f} is not a JSON array`);
    chapters = chapters.concat(arr);
  }
  chapters.sort((a, b) => a.order - b.order);
  return chapters;
}

// A chapter's `cq` may be a single object or an array of CQs.
function cqList(ch) {
  if (!ch.cq) return [];
  return Array.isArray(ch.cq) ? ch.cq : [ch.cq];
}

// Core logic, reusable both from the CLI (own pool) and from an in-process
// caller that already holds a pool (e.g. a one-time production migration route).
async function run(pool) {
  const chapters = loadChapters();
  const titles = chapters.map(c => c.title_en);
  const client = await pool.connect();
  try {
    const subj = await client.query(`SELECT id FROM subjects WHERE code = 'CHE'`);
    if (!subj.rows.length) throw new Error('Chemistry subject missing — run npm run db:seed first');
    const subjectId = subj.rows[0].id;

    await client.query('BEGIN');
    let acidBaseChapterId = null;
    const summary = { chapters: 0, topics: 0, mcqs: 0, cqs: 0 };

    for (const ch of chapters) {
      // upsert chapter by (subject, class 9, title_en)
      let row = await client.query(
        `SELECT id FROM chapters WHERE subject_id=$1 AND class_level=9 AND title_en=$2`,
        [subjectId, ch.title_en]
      );
      let chapterId;
      if (row.rows.length) {
        chapterId = row.rows[0].id;
        await client.query(`UPDATE chapters SET title_bn=$1, order_index=$2, status='published' WHERE id=$3`,
          [ch.title_bn, ch.order, chapterId]);
        // clear previous content of this chapter for a clean re-seed
        await client.query('DELETE FROM cq_questions WHERE chapter_id=$1', [chapterId]);
        await client.query('DELETE FROM questions WHERE chapter_id=$1', [chapterId]);
        await client.query('DELETE FROM learning_content WHERE chapter_id=$1', [chapterId]);
        await client.query('DELETE FROM topics WHERE chapter_id=$1', [chapterId]);
      } else {
        const ins = await client.query(
          `INSERT INTO chapters (subject_id, class_level, title_bn, title_en, order_index, status)
           VALUES ($1,9,$2,$3,$4,'published') RETURNING id`,
          [subjectId, ch.title_bn, ch.title_en, ch.order]
        );
        chapterId = ins.rows[0].id;
      }
      summary.chapters++;
      if (ch.order === 9) acidBaseChapterId = chapterId;

      let ti = 0;
      for (const tp of ch.topics || []) {
        ti++;
        const trow = await client.query(
          `INSERT INTO topics (chapter_id, title_bn, title_en, order_index, status)
           VALUES ($1,$2,$3,$4,'published') RETURNING id`,
          [chapterId, tp.title_bn, tp.title_en, ti]
        );
        const topicId = trow.rows[0].id;
        summary.topics++;
        for (const q of tp.mcqs || []) {
          const correct = Array.isArray(q.correct) ? q.correct : [q.correct];
          const type = correct.length > 1 ? 'multiple' : 'single';
          const diff = ['basic', 'medium', 'advanced'].includes(q.difficulty) ? q.difficulty : 'medium';
          await client.query(
            `INSERT INTO questions (chapter_id, topic_id, question_bn, question_en, options, correct_answers, question_type, explanation_bn, explanation_en, difficulty, status)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'published')`,
            [chapterId, topicId, q.question_bn, q.question_en, JSON.stringify(q.options), JSON.stringify(correct), type, q.explanation_bn || '', q.explanation_en || '', diff]
          );
          summary.mcqs++;
        }
      }
      const cqs = cqList(ch);
      if (cqs.length) {
        const firstTopic = await client.query('SELECT id FROM topics WHERE chapter_id=$1 ORDER BY order_index LIMIT 1', [chapterId]);
        for (const cq of cqs) {
          await client.query(
            `INSERT INTO cq_questions (chapter_id, topic_id, stimulus_bn, stimulus_en, parts, difficulty, status)
             VALUES ($1,$2,$3,$4,$5,$6,'published')`,
            [chapterId, firstTopic.rows[0]?.id || null, cq.stimulus_bn, cq.stimulus_en, JSON.stringify(cq.parts), cq.difficulty || 'medium']
          );
          summary.cqs++;
        }
      }
    }

    // Keep the chemistry simulations working: migrate them to the Acid-Base chapter.
    if (acidBaseChapterId) {
      const firstTopic = await client.query('SELECT id FROM topics WHERE chapter_id=$1 ORDER BY order_index LIMIT 1', [acidBaseChapterId]);
      await client.query(
        `UPDATE simulations SET chapter_id=$1, topic_id=$2 WHERE key IN ('chem-mixing','chem-titration')`,
        [acidBaseChapterId, firstTopic.rows[0]?.id || null]
      );
    }

    // The chemistry labs are open to every class 9-12 (catalog reads config.classLevels).
    await client.query(
      `UPDATE simulations SET config = config || '{"classLevels":[9,10,11,12]}'::jsonb WHERE key IN ('chem-mixing','chem-titration')`
    );

    // Remove leftover ad-hoc class-9 chemistry chapters not in the canonical 12
    // (sims already migrated off them, so no cascade harm).
    await client.query(
      `DELETE FROM chapters WHERE subject_id=$1 AND class_level=9 AND title_en <> ALL($2::text[])`,
      [subjectId, titles]
    );

    await client.query('COMMIT');
    return summary;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

module.exports = { run };

if (require.main === module) {
  const pool = require('../config/database');
  run(pool)
    .then(summary => { console.log('✓ Full Chemistry bank seeded:', JSON.stringify(summary)); return pool.end(); })
    .catch(err => { console.error(err); process.exit(1); });
}
