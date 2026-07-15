const express = require('express');
const pool = require('../config/database');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// FR-3.3 — track reading progress per chapter, resume where left off
router.put('/progress/:chapterId', verifyToken, async (req, res) => {
  try {
    const { percentComplete, lastPosition } = req.body;
    const result = await pool.query(
      `INSERT INTO chapter_progress (user_id, chapter_id, percent_complete, last_position, updated_at)
       VALUES ($1,$2,$3,$4, now())
       ON CONFLICT (user_id, chapter_id)
       DO UPDATE SET
         percent_complete = GREATEST(chapter_progress.percent_complete, EXCLUDED.percent_complete),
         last_position = EXCLUDED.last_position,
         updated_at = now()
       RETURNING *`,
      [req.user.userId, req.params.chapterId, percentComplete ?? 0, lastPosition || null]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// FR-3.5 — bookmark chapters and personal notes
router.put('/progress/:chapterId/bookmark', verifyToken, async (req, res) => {
  try {
    const { bookmarked } = req.body;
    const result = await pool.query(
      `INSERT INTO chapter_progress (user_id, chapter_id, bookmarked, updated_at)
       VALUES ($1,$2,$3, now())
       ON CONFLICT (user_id, chapter_id) DO UPDATE SET bookmarked = EXCLUDED.bookmarked, updated_at = now()
       RETURNING *`,
      [req.user.userId, req.params.chapterId, !!bookmarked]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/progress/:chapterId/notes', verifyToken, async (req, res) => {
  try {
    const { notes } = req.body;
    const result = await pool.query(
      `INSERT INTO chapter_progress (user_id, chapter_id, notes, updated_at)
       VALUES ($1,$2,$3, now())
       ON CONFLICT (user_id, chapter_id) DO UPDATE SET notes = EXCLUDED.notes, updated_at = now()
       RETURNING *`,
      [req.user.userId, req.params.chapterId, notes || null]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/bookmarks', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT cp.*, c.title_bn, c.title_en, c.subject_id
       FROM chapter_progress cp JOIN chapters c ON c.id = cp.chapter_id
       WHERE cp.user_id = $1 AND cp.bookmarked = true`,
      [req.user.userId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// FR-3.4 — searchable formula sheet / glossary per subject
router.get('/glossary/:subjectId', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT lc.* FROM learning_content lc
       JOIN chapters c ON c.id = lc.chapter_id
       WHERE c.subject_id = $1 AND lc.content_type IN ('formula','glossary') AND lc.status = 'published'
       ORDER BY lc.order_index`,
      [req.params.subjectId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
