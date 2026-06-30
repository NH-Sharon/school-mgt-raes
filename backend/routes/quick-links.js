const express = require('express');
const pool = require('../config/database');
const { verifyToken, requireRole } = require('../middleware/auth');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM quick_links WHERE is_active=true ORDER BY sort_order ASC');
    res.json(r.rows);
  } catch { res.status(500).json({ message: 'Server error' }); }
});

router.post('/', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { label_en, label_bn, icon, link_type, sort_order } = req.body;
    const r = await pool.query(
      'INSERT INTO quick_links (label_en,label_bn,icon,link_type,sort_order,is_active) VALUES ($1,$2,$3,$4,$5,true) RETURNING *',
      [label_en, label_bn||'', icon||'🔗', link_type||'login', sort_order||0]
    );
    res.status(201).json(r.rows[0]);
  } catch(e) { res.status(500).json({ message: e.message }); }
});

router.put('/:id', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { label_en, label_bn, icon, link_type, sort_order, is_active } = req.body;
    const r = await pool.query(
      'UPDATE quick_links SET label_en=$1,label_bn=$2,icon=$3,link_type=$4,sort_order=$5,is_active=$6 WHERE id=$7 RETURNING *',
      [label_en, label_bn, icon, link_type, sort_order, is_active, req.params.id]
    );
    res.json(r.rows[0]);
  } catch(e) { res.status(500).json({ message: e.message }); }
});

router.delete('/:id', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    await pool.query('DELETE FROM quick_links WHERE id=$1', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch { res.status(500).json({ message: 'Server error' }); }
});

module.exports = router;
