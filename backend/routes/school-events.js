const express = require('express');
const pool = require('../config/database');
const { verifyToken, requireRole } = require('../middleware/auth');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM school_events ORDER BY event_date DESC LIMIT 10');
    res.json(r.rows);
  } catch { res.status(500).json({ message: 'Server error' }); }
});

router.post('/', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { title_en, title_bn, description_en, description_bn, event_date, image_data, category } = req.body;
    const r = await pool.query(
      'INSERT INTO school_events (title_en,title_bn,description_en,description_bn,event_date,image_data,category) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
      [title_en, title_bn||'', description_en||'', description_bn||'', event_date, image_data||null, category||'general']
    );
    res.status(201).json(r.rows[0]);
  } catch(e) { res.status(500).json({ message: e.message }); }
});

router.put('/:id', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { title_en, title_bn, description_en, description_bn, event_date, image_data, category } = req.body;
    const r = await pool.query(
      'UPDATE school_events SET title_en=$1,title_bn=$2,description_en=$3,description_bn=$4,event_date=$5,image_data=$6,category=$7 WHERE id=$8 RETURNING *',
      [title_en, title_bn, description_en, description_bn, event_date, image_data, category, req.params.id]
    );
    res.json(r.rows[0]);
  } catch(e) { res.status(500).json({ message: e.message }); }
});

router.delete('/:id', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    await pool.query('DELETE FROM school_events WHERE id=$1', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch { res.status(500).json({ message: 'Server error' }); }
});

module.exports = router;
