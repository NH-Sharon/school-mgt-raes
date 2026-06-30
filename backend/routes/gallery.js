const express = require('express');
const pool = require('../config/database');
const { verifyToken, requireRole } = require('../middleware/auth');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM gallery ORDER BY created_at DESC');
    res.json(r.rows);
  } catch { res.status(500).json({ message: 'Server error' }); }
});

router.post('/', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { title, image_data, category } = req.body;
    const r = await pool.query(
      'INSERT INTO gallery (title,image_data,category) VALUES ($1,$2,$3) RETURNING *',
      [title, image_data, category || 'general']
    );
    res.status(201).json(r.rows[0]);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.delete('/:id', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    await pool.query('DELETE FROM gallery WHERE id=$1', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch { res.status(500).json({ message: 'Server error' }); }
});

module.exports = router;
