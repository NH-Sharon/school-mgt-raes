const express = require('express');
const pool = require('../config/database');
const { verifyToken, requireRole } = require('../middleware/auth');
const router = express.Router();

async function ensureTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS admissions (
      id SERIAL PRIMARY KEY,
      student_name_en VARCHAR(100) NOT NULL,
      student_name_bn VARCHAR(100),
      date_of_birth DATE,
      gender VARCHAR(10),
      class_applying VARCHAR(50) NOT NULL,
      guardian_name VARCHAR(100),
      guardian_phone VARCHAR(20),
      guardian_email VARCHAR(100),
      address TEXT,
      photo TEXT,
      status VARCHAR(20) DEFAULT 'pending',
      notes TEXT,
      applied_at TIMESTAMP DEFAULT NOW(),
      reviewed_at TIMESTAMP,
      reviewed_by INTEGER
    )
  `);
}
ensureTable().catch(console.error);

// Public: submit application
router.post('/', async (req, res) => {
  try {
    const { student_name_en, student_name_bn, date_of_birth, gender, class_applying, guardian_name, guardian_phone, guardian_email, address, photo } = req.body;
    if (!student_name_en || !class_applying || !guardian_phone) {
      return res.status(400).json({ message: 'শিক্ষার্থীর নাম, ভর্তিচ্ছু শ্রেণী ও অভিভাবকের ফোন আবশ্যক' });
    }
    const r = await pool.query(
      `INSERT INTO admissions (student_name_en, student_name_bn, date_of_birth, gender, class_applying, guardian_name, guardian_phone, guardian_email, address, photo)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id, student_name_en, applied_at`,
      [student_name_en, student_name_bn || '', date_of_birth || null, gender || '', class_applying, guardian_name || '', guardian_phone, guardian_email || '', address || '', photo || null]
    );
    res.status(201).json({ message: 'আবেদন সফলভাবে জমা হয়েছে। আমরা শীঘ্রই যোগাযোগ করব।', id: r.rows[0].id });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// Admin: get all applications
router.get('/', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { status } = req.query;
    let query = 'SELECT * FROM admissions';
    const params = [];
    if (status && status !== 'all') { params.push(status); query += ` WHERE status = $1`; }
    query += ' ORDER BY applied_at DESC';
    const r = await pool.query(query, params);
    res.json(r.rows);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// Admin: update status
router.put('/:id/status', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { status, notes } = req.body;
    const allowed = ['pending', 'approved', 'rejected', 'admitted'];
    if (!allowed.includes(status)) return res.status(400).json({ message: 'Invalid status' });
    const r = await pool.query(
      `UPDATE admissions SET status=$1, notes=$2, reviewed_at=NOW(), reviewed_by=$3 WHERE id=$4 RETURNING *`,
      [status, notes || null, req.user.userId, req.params.id]
    );
    if (!r.rows.length) return res.status(404).json({ message: 'Application not found' });
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// Admin: delete
router.delete('/:id', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    await pool.query('DELETE FROM admissions WHERE id=$1', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;
