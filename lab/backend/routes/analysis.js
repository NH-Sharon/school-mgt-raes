const express = require('express');
const pool = require('../config/database');
const { verifyToken, requireRole } = require('../middleware/auth');
const { runAnalysis, resolveBookAbsPath } = require('../services/bookAnalysis');

const router = express.Router();
const admins = ['content_admin', 'system_admin'];

// Trigger a Book Analysis job over a page range (FR-6).
router.post('/admin/:bookId', verifyToken, requireRole(...admins), async (req, res) => {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(400).json({ message: 'ANTHROPIC_API_KEY is not configured on the server.' });
    }
    const bookRow = await pool.query('SELECT * FROM books WHERE id = $1', [req.params.bookId]);
    if (!bookRow.rows.length) return res.status(404).json({ message: 'Book not found' });
    const book = bookRow.rows[0];
    const absPath = resolveBookAbsPath(book.file_path);
    if (!absPath) return res.status(404).json({ message: 'Book file missing on server' });

    const startPage = parseInt(req.body.startPage, 10) || 1;
    const endPage = parseInt(req.body.endPage, 10) || (startPage + 24);

    const jobRow = await pool.query(
      `INSERT INTO book_analysis_jobs (book_id, status, progress, created_by)
       VALUES ($1,'pending',$2,$3) RETURNING *`,
      [book.id, JSON.stringify({ phase: 'pending', startPage, endPage }), req.user.userId]
    );
    const job = jobRow.rows[0];

    // Fire-and-forget (local dev). Note: on serverless the process may not
    // survive the request; documented in README.
    runAnalysis(job.id, book, absPath, startPage, endPage);

    res.status(202).json(job);
  } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

router.get('/admin/jobs', verifyToken, requireRole(...admins), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT j.*, b.title_en AS book_title FROM book_analysis_jobs j
       JOIN books b ON b.id = j.book_id ORDER BY j.created_at DESC LIMIT 50`
    );
    res.json(result.rows);
  } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

router.get('/admin/jobs/:jobId', verifyToken, requireRole(...admins), async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM book_analysis_jobs WHERE id = $1', [req.params.jobId]);
    if (!r.rows.length) return res.status(404).json({ message: 'Job not found' });
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

// Nested draft tree for review: chapters -> topics -> {notes, mcqs, cqs}
router.get('/admin/review/:bookId', verifyToken, requireRole(...admins), async (req, res) => {
  try {
    const bookId = req.params.bookId;
    const chapters = (await pool.query(
      `SELECT id, title_bn, title_en, status, order_index FROM chapters WHERE book_id = $1 ORDER BY order_index`,
      [bookId]
    )).rows;
    for (const ch of chapters) {
      ch.topics = (await pool.query(
        'SELECT id, title_bn, title_en, status, order_index FROM topics WHERE chapter_id = $1 ORDER BY order_index',
        [ch.id]
      )).rows;
      ch.mcqCount = (await pool.query('SELECT count(*)::int c FROM questions WHERE chapter_id = $1', [ch.id])).rows[0].c;
      ch.cqCount = (await pool.query('SELECT count(*)::int c FROM cq_questions WHERE chapter_id = $1', [ch.id])).rows[0].c;
      ch.mcqs = (await pool.query(
        'SELECT id, question_bn, question_en, options, correct_answers, difficulty, status FROM questions WHERE chapter_id = $1 ORDER BY id',
        [ch.id]
      )).rows;
      ch.cqs = (await pool.query(
        'SELECT id, stimulus_bn, stimulus_en, parts, difficulty, status FROM cq_questions WHERE chapter_id = $1 ORDER BY id',
        [ch.id]
      )).rows;
    }
    res.json(chapters);
  } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

// Publish an entire generated chapter (cascade to its topics/content/questions/cqs).
router.post('/admin/publish-chapter/:chapterId', verifyToken, requireRole(...admins), async (req, res) => {
  const client = await pool.connect();
  try {
    const id = req.params.chapterId;
    await client.query('BEGIN');
    await client.query(`UPDATE chapters SET status='published' WHERE id=$1`, [id]);
    await client.query(`UPDATE topics SET status='published' WHERE chapter_id=$1`, [id]);
    await client.query(`UPDATE learning_content SET status='published' WHERE chapter_id=$1`, [id]);
    await client.query(`UPDATE questions SET status='published' WHERE chapter_id=$1`, [id]);
    await client.query(`UPDATE cq_questions SET status='published' WHERE chapter_id=$1`, [id]);
    await client.query('COMMIT');
    res.json({ ok: true });
  } catch (e) { await client.query('ROLLBACK'); res.status(500).json({ message: 'Server error' }); }
  finally { client.release(); }
});

// Discard a generated chapter and its children.
router.delete('/admin/chapter/:chapterId', verifyToken, requireRole(...admins), async (req, res) => {
  try {
    await pool.query('DELETE FROM chapters WHERE id = $1', [req.params.chapterId]); // cascades
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

module.exports = router;
