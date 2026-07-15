const express = require('express');
const pool = require('../config/database');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// FR-3.x navigation: Class -> Subject -> Chapter, max 3 taps
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM subjects ORDER BY id');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:subjectId/chapters', async (req, res) => {
  try {
    const { classLevel } = req.query;
    const params = [req.params.subjectId];
    let query = `SELECT * FROM chapters WHERE subject_id = $1 AND status = 'published'`;
    if (classLevel) {
      params.push(classLevel);
      query += ` AND class_level = $2`;
    }
    query += ' ORDER BY order_index';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/chapters/:chapterId', verifyToken, async (req, res) => {
  try {
    const chapter = await pool.query('SELECT * FROM chapters WHERE id = $1', [req.params.chapterId]);
    if (!chapter.rows.length) return res.status(404).json({ message: 'Chapter not found' });

    const content = await pool.query(
      `SELECT * FROM learning_content WHERE chapter_id = $1 AND status = 'published' ORDER BY order_index`,
      [req.params.chapterId]
    );
    const simulations = await pool.query(
      `SELECT * FROM simulations WHERE chapter_id = $1 AND status = 'published'`,
      [req.params.chapterId]
    );
    const progress = await pool.query(
      'SELECT * FROM chapter_progress WHERE user_id = $1 AND chapter_id = $2',
      [req.user.userId, req.params.chapterId]
    );

    res.json({
      chapter: chapter.rows[0],
      content: content.rows,
      simulations: simulations.rows,
      progress: progress.rows[0] || null,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
