const express = require('express');
const pool = require('../config/database');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get all homework (admin)
router.get('/', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT h.*, s.subject_name, t.name_en as teacher_name, c.class_name
      FROM homework h
      JOIN subjects s ON h.subject_id = s.id
      JOIN teachers t ON h.teacher_id = t.id
      LEFT JOIN classes c ON h.class_id = c.id
      ORDER BY h.assigned_date DESC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get homework by class
router.get('/class/:classId', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT h.*, s.subject_name, t.name_en as teacher_name
      FROM homework h
      JOIN subjects s ON h.subject_id = s.id
      JOIN teachers t ON h.teacher_id = t.id
      WHERE h.class_id = $1
      ORDER BY h.assigned_date DESC
    `, [req.params.classId]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', verifyToken, requireRole('admin', 'teacher'), async (req, res) => {
  try {
    const {
      class_id, subject_id, teacher_id, title,
      description, due_date, attachment_url
    } = req.body;

    if (!class_id) {
      return res.status(400).json({ message: 'Class is required' });
    }
    const effectiveTitle = title || description || 'Homework';

    const defaultDue = new Date();
    defaultDue.setDate(defaultDue.getDate() + 7);
    const effectiveDue = due_date || defaultDue.toISOString().split('T')[0];

    const result = await pool.query(`
      INSERT INTO homework (class_id, subject_id, teacher_id, title, description, due_date, attachment_url)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [class_id, subject_id, teacher_id, effectiveTitle, description, effectiveDue, attachment_url]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id', verifyToken, requireRole('admin', 'teacher'), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, due_date } = req.body;

    const result = await pool.query(`
      UPDATE homework SET
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        due_date = COALESCE($3, due_date)
      WHERE id = $4
      RETURNING *
    `, [title, description, due_date, id]);

    if (!result.rows.length) return res.status(404).json({ message: 'Homework not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', verifyToken, requireRole('admin', 'teacher'), async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM homework WHERE id = $1 RETURNING id', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ message: 'Homework not found' });
    res.json({ message: 'Homework deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/submit', verifyToken, async (req, res) => {
  try {
    const { homework_id, student_id, submission_text, attachment_url } = req.body;

    const existing = await pool.query(
      'SELECT id FROM homework_submissions WHERE homework_id=$1 AND student_id=$2',
      [homework_id, student_id]
    );
    let result;
    if (existing.rows.length) {
      result = await pool.query(
        'UPDATE homework_submissions SET submission_text=$1, attachment_url=$2, submitted_at=NOW() WHERE id=$3 RETURNING *',
        [submission_text, attachment_url, existing.rows[0].id]
      );
    } else {
      result = await pool.query(`
        INSERT INTO homework_submissions (homework_id, student_id, submission_text, attachment_url)
        VALUES ($1, $2, $3, $4) RETURNING *
      `, [homework_id, student_id, submission_text, attachment_url]);
    }

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:homeworkId/submissions', verifyToken, requireRole('admin', 'teacher'), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT hs.*, s.name_en, s.roll_number
      FROM homework_submissions hs
      JOIN students s ON hs.student_id = s.id
      WHERE hs.homework_id = $1
      ORDER BY s.roll_number
    `, [req.params.homeworkId]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
