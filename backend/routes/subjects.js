const express = require('express');
const pool = require('../config/database');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', verifyToken, async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM subjects ORDER BY class_id, subject_name');
    res.json(r.rows);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { subject_name, subject_name_bn, subject_code, class_id } = req.body;

    if (!subject_name) return res.status(400).json({ message: 'Subject name is required' });

    const r = await pool.query(
      'INSERT INTO subjects (subject_name, subject_name_bn, subject_code, class_id) VALUES ($1,$2,$3,$4) RETURNING *',
      [subject_name, subject_name_bn || '', subject_code || '', class_id]
    );
    res.status(201).json(r.rows[0]);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.put('/:id', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { subject_name, subject_name_bn, subject_code, class_id } = req.body;
    const r = await pool.query(
      `UPDATE subjects SET
        subject_name = COALESCE($1, subject_name),
        subject_name_bn = COALESCE($2, subject_name_bn),
        subject_code = COALESCE($3, subject_code),
        class_id = COALESCE($4, class_id)
       WHERE id = $5 RETURNING *`,
      [subject_name, subject_name_bn, subject_code, class_id, req.params.id]
    );
    if (!r.rows.length) return res.status(404).json({ message: 'Subject not found' });
    res.json(r.rows[0]);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.delete('/:id', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const r = await pool.query('DELETE FROM subjects WHERE id=$1 RETURNING id', [req.params.id]);
    if (!r.rows.length) return res.status(404).json({ message: 'Subject not found' });
    res.json({ message: 'Deleted' });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
