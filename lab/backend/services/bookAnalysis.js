/* Book Analysis engine (FR-6).
   Extracts text from a page range of a book PDF, asks Claude to structure it into
   Chapters -> Topics with notes + leveled MCQs + Creative Questions, and persists
   everything as draft content for admin review. */
const path = require('path');
const fs = require('fs');
const Anthropic = require('@anthropic-ai/sdk');
const { PDFDocument } = require('pdf-lib');
const pool = require('../config/database');

const BACKEND_ROOT = path.join(__dirname, '..');
const MODEL = process.env.ANALYSIS_MODEL || 'claude-opus-4-8';
// NCTB PDFs are usually scanned images (no text layer); cap vision slices so the
// base64 request stays well under the API's 32 MB / 100-page limits.
const MAX_VISION_PAGES = 20;

// Structured-output schema (no recursion, no numeric constraints — per API limits).
const OPTION = {
  type: 'object',
  properties: { id: { type: 'string' }, bn: { type: 'string' }, en: { type: 'string' } },
  required: ['id', 'bn', 'en'], additionalProperties: false,
};
const MCQ = {
  type: 'object',
  properties: {
    question_bn: { type: 'string' }, question_en: { type: 'string' },
    options: { type: 'array', items: OPTION },
    correct: { type: 'array', items: { type: 'string' } },
    explanation_bn: { type: 'string' }, explanation_en: { type: 'string' },
    difficulty: { type: 'string', enum: ['basic', 'medium', 'advanced'] },
  },
  required: ['question_bn', 'question_en', 'options', 'correct', 'explanation_bn', 'explanation_en', 'difficulty'],
  additionalProperties: false,
};
const CQ_PART = {
  type: 'object',
  properties: {
    level: { type: 'string', enum: ['knowledge', 'comprehension', 'application', 'higher'] },
    question_bn: { type: 'string' }, question_en: { type: 'string' },
    model_answer_bn: { type: 'string' }, model_answer_en: { type: 'string' },
    marks: { type: 'integer' },
  },
  required: ['level', 'question_bn', 'question_en', 'model_answer_bn', 'model_answer_en', 'marks'],
  additionalProperties: false,
};
const CQ = {
  type: 'object',
  properties: {
    stimulus_bn: { type: 'string' }, stimulus_en: { type: 'string' },
    difficulty: { type: 'string', enum: ['basic', 'medium', 'advanced'] },
    parts: { type: 'array', items: CQ_PART },
  },
  required: ['stimulus_bn', 'stimulus_en', 'difficulty', 'parts'], additionalProperties: false,
};
const TOPIC = {
  type: 'object',
  properties: {
    title_bn: { type: 'string' }, title_en: { type: 'string' },
    notes_bn: { type: 'string' }, notes_en: { type: 'string' },
    mcqs: { type: 'array', items: MCQ },
    cqs: { type: 'array', items: CQ },
  },
  required: ['title_bn', 'title_en', 'notes_bn', 'notes_en', 'mcqs', 'cqs'], additionalProperties: false,
};
const CHAPTER = {
  type: 'object',
  properties: {
    title_bn: { type: 'string' }, title_en: { type: 'string' },
    topics: { type: 'array', items: TOPIC },
  },
  required: ['title_bn', 'title_en', 'topics'], additionalProperties: false,
};
const SCHEMA = {
  type: 'object',
  properties: { chapters: { type: 'array', items: CHAPTER } },
  required: ['chapters'], additionalProperties: false,
};

const SYSTEM_PROMPT = `You are a curriculum expert building study material from NCTB (Bangladesh) science textbook pages.
From the supplied textbook text, produce a clean Chapter -> Topic structure with study notes and practice questions.
Rules:
- Output ONLY content grounded in the supplied text — do not invent facts not present.
- Provide every field in BOTH Bangla (bn) and English (en).
- For each topic write concise study notes (3-6 sentences).
- For each topic write 4 MCQs spanning difficulties: at least one 'basic', one 'medium', one 'advanced'. Each MCQ has exactly 4 options with ids "a","b","c","d"; "correct" lists the correct option id(s).
- For each topic write 1 Creative Question (CQ): a short stimulus plus 4 parts at levels knowledge(1 mark), comprehension(2), application(3), higher(4), each with a model answer.
- Keep 1-3 chapters and 2-4 topics per chapter for the supplied slice. Prefer fewer, well-formed items over many shallow ones.`;

// Try to pull a text layer from the page range (works for digital PDFs).
async function extractText(absPath, from, to) {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const data = new Uint8Array(fs.readFileSync(absPath));
  const doc = await pdfjs.getDocument({ data, isEvalSupported: false, useSystemFonts: true }).promise;
  const total = doc.numPages;
  const hi = Math.min(total, to);
  const parts = [];
  for (let i = from; i <= hi; i++) {
    const page = await doc.getPage(i);
    const tc = await page.getTextContent();
    const text = tc.items.map(it => it.str).join(' ').replace(/\s+/g, ' ').trim();
    if (text) parts.push(`\n\n=== Page ${i} ===\n${text}`);
  }
  await doc.destroy();
  return { text: parts.join(''), total };
}

// Build a small PDF containing only [from..to] so scanned pages can be sent to
// Claude's vision (document) input. Returns base64 + page count.
async function buildPdfSlice(absPath, from, to) {
  const src = await PDFDocument.load(fs.readFileSync(absPath), { ignoreEncryption: true });
  const total = src.getPageCount();
  const hi = Math.min(total, to);
  const out = await PDFDocument.create();
  const indices = [];
  for (let i = from - 1; i <= hi - 1 && i < total; i++) indices.push(i);
  const copied = await out.copyPages(src, indices);
  copied.forEach(p => out.addPage(p));
  const bytes = await out.save();
  return { b64: Buffer.from(bytes).toString('base64'), pages: indices.length, total };
}

async function setJob(jobId, fields) {
  const cols = Object.keys(fields);
  const sets = cols.map((c, i) => `${c} = $${i + 1}`).join(', ');
  const vals = cols.map(c => (c === 'progress' ? JSON.stringify(fields[c]) : fields[c]));
  vals.push(jobId);
  await pool.query(`UPDATE book_analysis_jobs SET ${sets}, updated_at = now() WHERE id = $${vals.length}`, vals);
}

// source is either {mode:'text', text} or {mode:'vision', b64}
async function callClaude(source) {
  const client = new Anthropic(); // reads ANTHROPIC_API_KEY from env
  const content = source.mode === 'vision'
    ? [
        { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: source.b64 } },
        { type: 'text', text: 'Structure the attached textbook pages per the rules.' },
      ]
    : [{ type: 'text', text: `Textbook pages to structure:\n${source.text}` }];

  const stream = client.messages.stream({
    model: MODEL,
    max_tokens: 32000,
    thinking: { type: 'adaptive' },
    output_config: { format: { type: 'json_schema', schema: SCHEMA } },
    system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content }],
  });
  const msg = await stream.finalMessage();
  if (msg.stop_reason === 'refusal') throw new Error('The model declined to process this content.');
  const block = msg.content.find(b => b.type === 'text');
  if (!block) throw new Error('No content returned by the model.');
  return JSON.parse(block.text);
}

async function persist(book, generated, jobId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const orderBase = await client.query(
      'SELECT COALESCE(MAX(order_index),0) AS m FROM chapters WHERE subject_id = $1 AND class_level = $2',
      [book.subject_id, book.class_level]
    );
    let order = orderBase.rows[0].m;
    const summary = { chapters: 0, topics: 0, mcqs: 0, cqs: 0 };

    for (const ch of generated.chapters || []) {
      order += 1;
      const chRow = await client.query(
        `INSERT INTO chapters (subject_id, class_level, title_bn, title_en, order_index, status, book_id)
         VALUES ($1,$2,$3,$4,$5,'draft',$6) RETURNING id`,
        [book.subject_id, book.class_level, ch.title_bn, ch.title_en, order, book.id]
      );
      const chapterId = chRow.rows[0].id;
      summary.chapters++;
      let topicOrder = 0;
      for (const tp of ch.topics || []) {
        topicOrder += 1;
        const tpRow = await client.query(
          `INSERT INTO topics (chapter_id, title_bn, title_en, order_index, status)
           VALUES ($1,$2,$3,$4,'draft') RETURNING id`,
          [chapterId, tp.title_bn, tp.title_en, topicOrder]
        );
        const topicId = tpRow.rows[0].id;
        summary.topics++;
        await client.query(
          `INSERT INTO learning_content (chapter_id, content_type, title_bn, title_en, body_bn, body_en, order_index, status)
           VALUES ($1,'notes',$2,$3,$4,$5,$6,'draft')`,
          [chapterId, tp.title_bn, tp.title_en, tp.notes_bn, tp.notes_en, topicOrder]
        );
        for (const q of tp.mcqs || []) {
          const type = (q.correct || []).length > 1 ? 'multiple' : 'single';
          await client.query(
            `INSERT INTO questions (chapter_id, topic_id, question_bn, question_en, options, correct_answers, question_type, explanation_bn, explanation_en, difficulty, status)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'draft')`,
            [chapterId, topicId, q.question_bn, q.question_en, JSON.stringify(q.options), JSON.stringify(q.correct), type, q.explanation_bn, q.explanation_en, q.difficulty]
          );
          summary.mcqs++;
        }
        for (const cq of tp.cqs || []) {
          await client.query(
            `INSERT INTO cq_questions (chapter_id, topic_id, stimulus_bn, stimulus_en, parts, difficulty, status)
             VALUES ($1,$2,$3,$4,$5,$6,'draft')`,
            [chapterId, topicId, cq.stimulus_bn, cq.stimulus_en, JSON.stringify(cq.parts), cq.difficulty]
          );
          summary.cqs++;
        }
      }
    }
    await client.query('COMMIT');
    return summary;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

// Fire-and-forget async runner. Errors are captured on the job row.
async function runAnalysis(jobId, book, absPath, startPage, endPage) {
  try {
    const from = Math.max(1, startPage || 1);
    // Clamp the page window so scanned-PDF vision slices stay within API limits.
    const requestedTo = endPage || (from + MAX_VISION_PAGES - 1);
    const to = Math.min(requestedTo, from + MAX_VISION_PAGES - 1);
    const clamped = to < requestedTo;

    await setJob(jobId, { status: 'extracting', progress: { phase: 'extracting', from, to, clamped } });
    const { text, total } = await extractText(absPath, from, to);

    let source, mode;
    if (text && text.length >= 500) {
      mode = 'text';
      source = { mode: 'text', text };
    } else {
      // Scanned pages — no text layer. Send the page slice to Claude's PDF vision.
      mode = 'vision';
      const slice = await buildPdfSlice(absPath, from, to);
      if (!slice.pages) throw new Error('No pages available in that range.');
      source = { mode: 'vision', b64: slice.b64 };
    }

    await setJob(jobId, { status: 'generating', progress: { phase: 'generating', from, to, total, mode, clamped } });
    const generated = await callClaude(source);

    const summary = await persist(book, generated, jobId);
    await setJob(jobId, { status: 'ready', progress: { phase: 'ready', from, to, total, mode, clamped, ...summary } });
  } catch (e) {
    await setJob(jobId, { status: 'failed', error: String(e.message || e) });
  }
}

module.exports = { runAnalysis, resolveBookAbsPath };

function resolveBookAbsPath(filePath) {
  const abs = path.resolve(BACKEND_ROOT, filePath);
  const uploads = path.join(BACKEND_ROOT, 'uploads');
  const textbooks = path.resolve(path.join(BACKEND_ROOT, '..', 'text-books'));
  const ok = [uploads, textbooks].some(root => abs === root || abs.startsWith(root + path.sep));
  return ok && fs.existsSync(abs) ? abs : null;
}
