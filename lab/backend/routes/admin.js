const express = require('express');
const multer = require('multer');
const pool = require('../config/database');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

const contentAdminRoles = ['content_admin', 'system_admin'];

async function logAudit(entityType, entityId, action, userId, snapshot) {
  await pool.query(
    'INSERT INTO content_audit_log (entity_type, entity_id, action, user_id, snapshot) VALUES ($1,$2,$3,$4,$5)',
    [entityType, entityId, action, userId, JSON.stringify(snapshot)]
  );
}

// ---- Chapters (FR-6.1/6.4) ----
router.post('/chapters', verifyToken, requireRole(...contentAdminRoles), async (req, res) => {
  try {
    const { subjectId, classLevel, titleBn, titleEn, orderIndex, syllabusYear } = req.body;
    const result = await pool.query(
      `INSERT INTO chapters (subject_id, class_level, title_bn, title_en, order_index, syllabus_year, status, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,'draft',$7) RETURNING *`,
      [subjectId, classLevel, titleBn, titleEn, orderIndex || 0, syllabusYear || 2026, req.user.userId]
    );
    await logAudit('chapter', result.rows[0].id, 'create', req.user.userId, result.rows[0]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/chapters', verifyToken, requireRole(...contentAdminRoles), async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM chapters ORDER BY subject_id, class_level, order_index');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// FR-6.3 — draft -> review -> publish workflow
router.put('/chapters/:id/status', verifyToken, requireRole(...contentAdminRoles), async (req, res) => {
  try {
    const { status } = req.body;
    if (!['draft', 'review', 'published'].includes(status)) return res.status(400).json({ message: 'Invalid status' });
    const result = await pool.query('UPDATE chapters SET status = $1 WHERE id = $2 RETURNING *', [status, req.params.id]);
    if (!result.rows.length) return res.status(404).json({ message: 'Chapter not found' });
    await logAudit('chapter', result.rows[0].id, status === 'published' ? 'publish' : 'update', req.user.userId, result.rows[0]);
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/chapters/:id', verifyToken, requireRole(...contentAdminRoles), async (req, res) => {
  try {
    const { titleBn, titleEn, orderIndex, syllabusYear } = req.body;
    const result = await pool.query(
      `UPDATE chapters SET title_bn = COALESCE($1,title_bn), title_en = COALESCE($2,title_en),
         order_index = COALESCE($3,order_index), syllabus_year = COALESCE($4,syllabus_year)
       WHERE id = $5 RETURNING *`,
      [titleBn, titleEn, orderIndex, syllabusYear, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ message: 'Chapter not found' });
    await logAudit('chapter', result.rows[0].id, 'update', req.user.userId, result.rows[0]);
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ---- Learning content ----
router.post('/content', verifyToken, requireRole(...contentAdminRoles), async (req, res) => {
  try {
    const { chapterId, contentType, titleBn, titleEn, bodyBn, bodyEn, mediaUrl, orderIndex } = req.body;
    const result = await pool.query(
      `INSERT INTO learning_content (chapter_id, content_type, title_bn, title_en, body_bn, body_en, media_url, order_index, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'draft') RETURNING *`,
      [chapterId, contentType, titleBn, titleEn, bodyBn, bodyEn, mediaUrl || null, orderIndex || 0]
    );
    await logAudit('learning_content', result.rows[0].id, 'create', req.user.userId, result.rows[0]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/content/:id/status', verifyToken, requireRole(...contentAdminRoles), async (req, res) => {
  try {
    const { status } = req.body;
    const result = await pool.query('UPDATE learning_content SET status = $1 WHERE id = $2 RETURNING *', [status, req.params.id]);
    if (!result.rows.length) return res.status(404).json({ message: 'Content not found' });
    await logAudit('learning_content', result.rows[0].id, status === 'published' ? 'publish' : 'update', req.user.userId, result.rows[0]);
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ---- Simulations (metadata only — engine logic ships with the frontend) ----
router.post('/simulations', verifyToken, requireRole(...contentAdminRoles), async (req, res) => {
  try {
    const { chapterId, key, titleBn, titleEn, supportsGuided, supportsFree, config } = req.body;
    const result = await pool.query(
      `INSERT INTO simulations (chapter_id, key, title_bn, title_en, supports_guided, supports_free, config, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'draft') RETURNING *`,
      [chapterId, key, titleBn, titleEn, supportsGuided ?? true, supportsFree ?? true, JSON.stringify(config || {})]
    );
    await logAudit('simulation', result.rows[0].id, 'create', req.user.userId, result.rows[0]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ message: 'Simulation key already exists' });
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/simulations/:id/status', verifyToken, requireRole(...contentAdminRoles), async (req, res) => {
  try {
    const { status } = req.body;
    const result = await pool.query('UPDATE simulations SET status = $1 WHERE id = $2 RETURNING *', [status, req.params.id]);
    if (!result.rows.length) return res.status(404).json({ message: 'Simulation not found' });
    await logAudit('simulation', result.rows[0].id, status === 'published' ? 'publish' : 'update', req.user.userId, result.rows[0]);
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ---- Question bank (FR-6.1/6.2) ----
router.post('/questions', verifyToken, requireRole(...contentAdminRoles, 'teacher'), async (req, res) => {
  try {
    const { chapterId, questionBn, questionEn, options, correctAnswers, questionType, explanationBn, explanationEn, difficulty } = req.body;
    const result = await pool.query(
      `INSERT INTO questions (chapter_id, question_bn, question_en, options, correct_answers, question_type, explanation_bn, explanation_en, difficulty, status, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'draft',$10) RETURNING *`,
      [chapterId, questionBn, questionEn, JSON.stringify(options), JSON.stringify(correctAnswers), questionType || 'single', explanationBn, explanationEn, difficulty || 'medium', req.user.userId]
    );
    await logAudit('question', result.rows[0].id, 'create', req.user.userId, result.rows[0]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/questions/chapter/:chapterId', verifyToken, requireRole(...contentAdminRoles, 'teacher'), async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM questions WHERE chapter_id = $1 ORDER BY id', [req.params.chapterId]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/questions/:id/status', verifyToken, requireRole(...contentAdminRoles), async (req, res) => {
  try {
    const { status } = req.body;
    const result = await pool.query('UPDATE questions SET status = $1 WHERE id = $2 RETURNING *', [status, req.params.id]);
    if (!result.rows.length) return res.status(404).json({ message: 'Question not found' });
    await logAudit('question', result.rows[0].id, status === 'published' ? 'publish' : 'update', req.user.userId, result.rows[0]);
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// FR-6.2 — bulk MCQ import via CSV template:
// question_bn,question_en,option_a_bn,option_a_en,option_b_bn,option_b_en,option_c_bn,option_c_en,option_d_bn,option_d_en,correct(a|b|c|d or a;c),explanation_bn,explanation_en,difficulty
router.post('/questions/bulk-import/:chapterId', verifyToken, requireRole(...contentAdminRoles), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'CSV file is required (field name "file")' });
    const text = req.file.buffer.toString('utf-8').trim();
    const lines = text.split(/\r?\n/);
    const header = lines[0].split(',').map(h => h.trim());
    const required = ['question_bn', 'question_en', 'option_a_bn', 'option_a_en', 'option_b_bn', 'option_b_en', 'correct'];
    for (const col of required) {
      if (!header.includes(col)) return res.status(400).json({ message: `Missing required column: ${col}` });
    }

    const inserted = [];
    const errors = [];
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      const cells = lines[i].split(',').map(c => c.trim());
      const row = Object.fromEntries(header.map((h, idx) => [h, cells[idx] || '']));
      if (!row.question_bn || !row.correct) { errors.push({ line: i + 1, message: 'Missing question or correct answer' }); continue; }

      const options = [];
      for (const letter of ['a', 'b', 'c', 'd']) {
        if (row[`option_${letter}_bn`]) options.push({ id: letter, bn: row[`option_${letter}_bn`], en: row[`option_${letter}_en`] || row[`option_${letter}_bn`] });
      }
      const correctAnswers = row.correct.split(';').map(s => s.trim()).filter(Boolean);

      try {
        const result = await pool.query(
          `INSERT INTO questions (chapter_id, question_bn, question_en, options, correct_answers, question_type, explanation_bn, explanation_en, difficulty, status, created_by)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'draft',$10) RETURNING id`,
          [
            req.params.chapterId, row.question_bn, row.question_en || row.question_bn, JSON.stringify(options),
            JSON.stringify(correctAnswers), correctAnswers.length > 1 ? 'multiple' : 'single',
            row.explanation_bn || null, row.explanation_en || null, row.difficulty || 'medium', req.user.userId,
          ]
        );
        inserted.push(result.rows[0].id);
      } catch (e) {
        errors.push({ line: i + 1, message: 'Insert failed' });
      }
    }
    await logAudit('question', 0, 'bulk_import', req.user.userId, { chapterId: req.params.chapterId, insertedCount: inserted.length });
    res.status(201).json({ insertedCount: inserted.length, insertedIds: inserted, errors });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ---- Users (System Admin — FR: manage users/roles) ----
router.get('/users', verifyToken, requireRole('system_admin'), async (req, res) => {
  try {
    const result = await pool.query('SELECT id, username, email, role, full_name, class_level, medium, created_at FROM users ORDER BY id DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/users/:id/role', verifyToken, requireRole('system_admin'), async (req, res) => {
  try {
    const { role } = req.body;
    const result = await pool.query('UPDATE users SET role = $1 WHERE id = $2 RETURNING id, username, role', [role, req.params.id]);
    if (!result.rows.length) return res.status(404).json({ message: 'User not found' });
    await logAudit('user', result.rows[0].id, 'update_role', req.user.userId, result.rows[0]);
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Audit log (Security NFR)
router.get('/audit-log', verifyToken, requireRole('system_admin'), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT cal.*, u.username AS actor FROM content_audit_log cal LEFT JOIN users u ON u.id = cal.user_id
       ORDER BY cal.created_at DESC LIMIT 200`
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
