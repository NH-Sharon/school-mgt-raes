const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../config/database');
const { verifyToken, requireRole } = require('../middleware/auth');
const router = express.Router();

// Get all users (admin only)
router.get('/', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const r = await pool.query('SELECT id, username, email, role, full_name, phone, is_active, permissions, created_at FROM users ORDER BY created_at DESC');
    res.json(r.rows);
  } catch { res.status(500).json({ message: 'Server error' }); }
});

// Create user
router.post('/', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { username, email, password, role, full_name, phone, permissions } = req.body;
    if (!username || !password || !role) return res.status(400).json({ message: 'username, password, role required' });
    const hash = await bcrypt.hash(password, 10);
    const r = await pool.query(
      'INSERT INTO users (username, email, password, role, full_name, phone, permissions) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id, username, email, role, full_name, phone, is_active, permissions',
      [username, email || '', hash, role, full_name || '', phone || '', permissions || '']
    );
    res.status(201).json(r.rows[0]);
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ message: 'Username already exists' });
    res.status(500).json({ message: e.message });
  }
});

// Update user
router.put('/:id', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { username, email, role, full_name, phone, is_active, password, permissions } = req.body;
    let query, values;
    if (password) {
      const hash = await bcrypt.hash(password, 10);
      query = 'UPDATE users SET username=$1,email=$2,role=$3,full_name=$4,phone=$5,is_active=$6,password=$7,permissions=$8 WHERE id=$9 RETURNING id,username,email,role,full_name,phone,is_active,permissions';
      values = [username, email, role, full_name, phone, is_active, hash, permissions || '', req.params.id];
    } else {
      query = 'UPDATE users SET username=$1,email=$2,role=$3,full_name=$4,phone=$5,is_active=$6,permissions=$7 WHERE id=$8 RETURNING id,username,email,role,full_name,phone,is_active,permissions';
      values = [username, email, role, full_name, phone, is_active, permissions || '', req.params.id];
    }
    const r = await pool.query(query, values);
    if (!r.rows.length) return res.status(404).json({ message: 'User not found' });
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// Delete user
router.delete('/:id', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    if (req.params.id == req.user.userId) return res.status(400).json({ message: 'Cannot delete yourself' });
    await pool.query('DELETE FROM users WHERE id=$1', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch { res.status(500).json({ message: 'Server error' }); }
});

// Reset password
router.post('/:id/reset-password', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { password } = req.body;
    const hash = await bcrypt.hash(password, 10);
    await pool.query('UPDATE users SET password=$1 WHERE id=$2', [hash, req.params.id]);
    res.json({ message: 'Password reset' });
  } catch { res.status(500).json({ message: 'Server error' }); }
});

module.exports = router;
