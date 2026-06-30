const express = require('express');
const pool = require('../config/database');
const { verifyToken, requireRole } = require('../middleware/auth');
const router = express.Router();

// Public
router.get('/public', async (req, res) => {
  try {
    const r = await pool.query('SELECT id,title_en,title_bn,content_en,content_bn,image_data,type,created_at FROM public_notices WHERE published=true ORDER BY created_at DESC LIMIT 20');
    res.json(r.rows);
  } catch { res.status(500).json({ message: 'Server error' }); }
});

// Admin - all
router.get('/', verifyToken, async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM public_notices ORDER BY created_at DESC');
    res.json(r.rows);
  } catch { res.status(500).json({ message: 'Server error' }); }
});

// Create
router.post('/', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { title_en, title_bn, content_en, content_bn, image_data, type, published } = req.body;
    const r = await pool.query(
      'INSERT INTO public_notices (title_en,title_bn,content_en,content_bn,image_data,type,published) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
      [title_en, title_bn, content_en || '', content_bn || '', image_data || null, type || 'general', published || false]
    );
    res.status(201).json(r.rows[0]);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// Update
router.put('/:id', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { title_en, title_bn, content_en, content_bn, image_data, type, published } = req.body;
    const r = await pool.query(
      'UPDATE public_notices SET title_en=$1,title_bn=$2,content_en=$3,content_bn=$4,image_data=$5,type=$6,published=$7,updated_at=NOW() WHERE id=$8 RETURNING *',
      [title_en, title_bn, content_en, content_bn, image_data, type, published, req.params.id]
    );
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// Delete
router.delete('/:id', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    await pool.query('DELETE FROM public_notices WHERE id=$1', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch { res.status(500).json({ message: 'Server error' }); }
});

module.exports = router;
