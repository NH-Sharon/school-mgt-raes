const express = require('express');
const pool = require('../config/database');
const { verifyToken, requireRole } = require('../middleware/auth');
const { logAudit } = require('../middleware/audit');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM school_events ORDER BY event_date DESC LIMIT 10');
    res.json(r.rows);
  } catch (error) { console.error(error); res.status(500).json({ message: 'Server error' }); }
});

router.post('/', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { title_en, title_bn, description_en, description_bn, event_date, image_data, category } = req.body;
    const r = await pool.query(
      'INSERT INTO school_events (title_en,title_bn,description_en,description_bn,event_date,image_data,category) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
      [title_en, title_bn||'', description_en||'', description_bn||'', event_date, image_data||null, category||'general']
    );
    logAudit(req, 'create', 'school_event', r.rows[0].id, { title_en });
    res.status(201).json(r.rows[0]);
  } catch (e) { console.error(e); res.status(500).json({ message: 'Server error' }); }
});

router.put('/:id', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { title_en, title_bn, description_en, description_bn, event_date, image_data, category } = req.body;
    const r = await pool.query(
      'UPDATE school_events SET title_en=$1,title_bn=$2,description_en=$3,description_bn=$4,event_date=$5,image_data=$6,category=$7 WHERE id=$8 RETURNING *',
      [title_en, title_bn, description_en, description_bn, event_date, image_data, category, req.params.id]
    );
    logAudit(req, 'update', 'school_event', req.params.id, { title_en });
    res.json(r.rows[0]);
  } catch (e) { console.error(e); res.status(500).json({ message: 'Server error' }); }
});

router.delete('/:id', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    await pool.query('DELETE FROM school_events WHERE id=$1', [req.params.id]);
    logAudit(req, 'delete', 'school_event', req.params.id);
    res.json({ message: 'Deleted' });
  } catch (error) { console.error(error); res.status(500).json({ message: 'Server error' }); }
});

module.exports = router;
