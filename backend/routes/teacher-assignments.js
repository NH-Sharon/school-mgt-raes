const express = require('express');
const pool = require('../config/database');
const { verifyToken, requireRole } = require('../middleware/auth');
const { logAudit } = require('../middleware/audit');

const router = express.Router();

// List assignments — optionally filter to the logged-in teacher's own classes.
router.get('/', verifyToken, requireRole('admin', 'teacher'), async (req, res) => {
  try {
    let query = `
      SELECT cst.*, c.class_name, c.section, s.subject_name, t.name_en as teacher_name
      FROM class_subject_teachers cst
      JOIN classes c ON c.id = cst.class_id
      JOIN subjects s ON s.id = cst.subject_id
      JOIN teachers t ON t.id = cst.teacher_id
    `;
    const params = [];
    if (req.user.role === 'teacher' && req.query.mine === 'true') {
      const t = await pool.query('SELECT id FROM teachers WHERE user_id = $1', [req.user.userId]);
      if (!t.rows.length) return res.json([]);
      params.push(t.rows[0].id);
      query += ' WHERE cst.teacher_id = $1';
    }
    query += ' ORDER BY c.class_name, s.subject_name';
    const r = await pool.query(query, params);
    res.json(r.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { class_id, subject_id, teacher_id } = req.body;
    if (!class_id || !subject_id || !teacher_id) {
      return res.status(400).json({ message: 'class_id, subject_id and teacher_id are required' });
    }
    const r = await pool.query(`
      INSERT INTO class_subject_teachers (class_id, subject_id, teacher_id) VALUES ($1,$2,$3)
      ON CONFLICT (class_id, subject_id) DO UPDATE SET teacher_id = EXCLUDED.teacher_id
      RETURNING *
    `, [class_id, subject_id, teacher_id]);
    logAudit(req, 'create', 'class_subject_teacher', r.rows[0].id, { class_id, subject_id, teacher_id });
    res.status(201).json(r.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const r = await pool.query('DELETE FROM class_subject_teachers WHERE id = $1 RETURNING id', [req.params.id]);
    if (!r.rows.length) return res.status(404).json({ message: 'Assignment not found' });
    logAudit(req, 'delete', 'class_subject_teacher', req.params.id);
    res.json({ message: 'Deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
