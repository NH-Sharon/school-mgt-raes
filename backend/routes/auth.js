const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const pool = require('../config/database');

const router = express.Router();

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'username and password are required' });
    }

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
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Forgot password — issues a short-lived reset token. No email/SMS integration
// exists yet (see FEATURE_ROADMAP.md #7), so outside production the token is
// returned directly in the response for the user to complete the reset flow.
router.post('/forgot-password', async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) return res.status(400).json({ message: 'username is required' });
    const result = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
    // Always respond 200 to avoid leaking which usernames exist.
    if (!result.rows.length) {
      return res.json({ message: 'If that account exists, a reset token has been issued.' });
    }
    const token = crypto.randomBytes(24).toString('hex');
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
    await pool.query(
      'INSERT INTO password_resets (user_id, token, expires_at) VALUES ($1,$2,$3)',
      [result.rows[0].id, token, expiresAt]
    );
    const payload = { message: 'If that account exists, a reset token has been issued.' };
    if (process.env.NODE_ENV !== 'production') payload.devToken = token; // dev convenience
    res.json(payload);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Reset password using a valid, unused, unexpired token.
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ message: 'token and password are required' });
    if (password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });
    const pr = await pool.query(
      'SELECT id, user_id FROM password_resets WHERE token = $1 AND used = false AND expires_at > now()',
      [token]
    );
    if (!pr.rows.length) return res.status(400).json({ message: 'Invalid or expired reset token' });
    const hashed = await bcrypt.hash(password, 10);
    await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashed, pr.rows[0].user_id]);
    await pool.query('UPDATE password_resets SET used = true WHERE id = $1', [pr.rows[0].id]);
    res.json({ message: 'Password reset successful. You can now log in.' });
  } catch (error) {
    console.error(error);
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

    let children = null;
    if (role === 'parent') {
      const c = await pool.query(`
        SELECT s.id, s.name_en, s.name_bn, s.class_id, s.roll_number, cl.class_name, cl.section
        FROM guardian_students gs
        JOIN students s ON s.id = gs.student_id
        LEFT JOIN classes cl ON cl.id = s.class_id
        WHERE gs.guardian_user_id = $1
      `, [userId]);
      children = c.rows;
    }

    res.json({ ...user, linkedId, linkedData, children });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
