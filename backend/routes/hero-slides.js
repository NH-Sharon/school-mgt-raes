const express = require('express');
const pool = require('../config/database');
const { verifyToken, requireRole } = require('../middleware/auth');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM hero_slides WHERE is_active=true ORDER BY sort_order ASC');
    res.json(r.rows);
  } catch { res.status(500).json({ message: 'Server error' }); }
});

router.get('/all', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM hero_slides ORDER BY sort_order ASC');
    res.json(r.rows);
  } catch { res.status(500).json({ message: 'Server error' }); }
});

router.post('/', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { title_en, title_bn, subtitle_en, subtitle_bn, image_data, sort_order, is_active } = req.body;
    const r = await pool.query(
      'INSERT INTO hero_slides (title_en,title_bn,subtitle_en,subtitle_bn,image_data,sort_order,is_active) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
      [title_en||'', title_bn||'', subtitle_en||'', subtitle_bn||'', image_data||null, sort_order||0, is_active!==false]
    );
    res.status(201).json(r.rows[0]);
  } catch(e) { res.status(500).json({ message: e.message }); }
});

router.put('/:id', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { title_en, title_bn, subtitle_en, subtitle_bn, image_data, sort_order, is_active } = req.body;
    const r = await pool.query(
      'UPDATE hero_slides SET title_en=$1,title_bn=$2,subtitle_en=$3,subtitle_bn=$4,image_data=$5,sort_order=$6,is_active=$7 WHERE id=$8 RETURNING *',
      [title_en, title_bn, subtitle_en, subtitle_bn, image_data, sort_order, is_active, req.params.id]
    );
    res.json(r.rows[0]);
  } catch(e) { res.status(500).json({ message: e.message }); }
});

router.delete('/:id', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    await pool.query('DELETE FROM hero_slides WHERE id=$1', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch { res.status(500).json({ message: 'Server error' }); }
});

module.exports = router;
