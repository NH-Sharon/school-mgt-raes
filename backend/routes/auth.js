const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');

const router = express.Router();

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const user = result.rows[0];
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const token = jwt.sign(
      { userId: user.id, role: user.role, permissions: user.permissions || '' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        permissions: user.permissions || ''
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const result = await pool.query(
      'INSERT INTO users (username, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, username, email, role',
      [username, email, hashedPassword, role]
    );
    
    res.status(201).json({ user: result.rows[0] });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/auth/me — returns current user profile + linked teacher/student id
const { verifyToken } = require('../middleware/auth');
router.get('/me', verifyToken, async (req, res) => {
  try {
    const { userId, role } = req.user;
    const userRes = await pool.query('SELECT id, username, email, role, full_name, permissions FROM users WHERE id = $1', [userId]);
    if (!userRes.rows.length) return res.status(404).json({ message: 'User not found' });
    const user = userRes.rows[0];

    let linkedId = null;
    let linkedData = null;
    if (role === 'teacher') {
      const t = await pool.query('SELECT id, name_en, name_bn FROM teachers WHERE user_id = $1', [userId]);
      if (t.rows.length) { linkedId = t.rows[0].id; linkedData = t.rows[0]; }
    } else if (role === 'student') {
      const s = await pool.query('SELECT id, name_en, name_bn, class_id, roll_number FROM students WHERE user_id = $1', [userId]);
      if (s.rows.length) { linkedId = s.rows[0].id; linkedData = s.rows[0]; }
    }

    res.json({ ...user, linkedId, linkedData });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
