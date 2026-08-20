const express = require('express');
const pool = require('../config/database');
const { verifyToken, requireRole } = require('../middleware/auth');
const { logAudit } = require('../middleware/audit');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM gallery ORDER BY created_at DESC');
    res.json(r.rows);
  } catch (error) { console.error(error); res.status(500).json({ message: 'Server error' }); }
});

router.post('/', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { title, image_data, category } = req.body;
    const r = await pool.query(
      'INSERT INTO gallery (title,image_data,category) VALUES ($1,$2,$3) RETURNING *',
      [title, image_data, category || 'general']
    );
    logAudit(req, 'create', 'gallery', r.rows[0].id, { title });
    res.status(201).json(r.rows[0]);
  } catch (e) { console.error(e); res.status(500).json({ message: 'Server error' }); }
});

router.delete('/:id', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    await pool.query('DELETE FROM gallery WHERE id=$1', [req.params.id]);
    logAudit(req, 'delete', 'gallery', req.params.id);
    res.json({ message: 'Deleted' });
  } catch (error) { console.error(error); res.status(500).json({ message: 'Server error' }); }
});

module.exports = router;
