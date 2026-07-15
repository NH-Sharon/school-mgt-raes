const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// FR-1.1 / FR-1.2 — register with role-based accounts
router.post('/register', async (req, res) => {
  try {
    const { username, password, fullName, role, medium, classLevel, institution, mobile, email } = req.body;
    if (!username || !password || !fullName || !role) {
      return res.status(400).json({ message: 'username, password, fullName and role are required' });
    }
    if (!['student', 'teacher', 'guardian', 'content_admin', 'system_admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }
    const hashed = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (username, email, mobile, password, role, full_name, medium, class_level, institution)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING id, username, email, role, full_name, medium, class_level, institution`,
      [username, email || null, mobile || null, hashed, role, fullName, medium || 'bn', classLevel || null, institution || null]
    );
    res.status(201).json({ user: result.rows[0] });
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ message: 'Username already exists' });
    res.status(500).json({ message: 'Server error' });
  }
});

// FR-1.5 — secure login
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

    // FR-5.4 streak tracking on login/activity
    const today = new Date().toISOString().slice(0, 10);
    if (user.last_active_date !== today) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      const lastActiveStr = user.last_active_date ? new Date(user.last_active_date).toISOString().slice(0, 10) : null;
      const newStreak = lastActiveStr === yesterday ? user.streak_days + 1 : 1;
      await pool.query('UPDATE users SET streak_days = $1, last_active_date = $2 WHERE id = $3', [newStreak, today, user.id]);
      user.streak_days = newStreak;
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role, classLevel: user.class_level, medium: user.medium },
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
        fullName: user.full_name,
        medium: user.medium,
        classLevel: user.class_level,
        institution: user.institution,
        points: user.points,
        streakDays: user.streak_days,
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/me', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, username, email, role, full_name, medium, class_level, institution, points, streak_days, leaderboard_opt_in
       FROM users WHERE id = $1`,
      [req.user.userId]
    );
    if (!result.rows.length) return res.status(404).json({ message: 'User not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// FR-1.4 — change class/medium
router.put('/profile', verifyToken, async (req, res) => {
  try {
    const { classLevel, medium, fullName, institution, leaderboardOptIn } = req.body;
    const result = await pool.query(
      `UPDATE users SET
         class_level = COALESCE($1, class_level),
         medium = COALESCE($2, medium),
         full_name = COALESCE($3, full_name),
         institution = COALESCE($4, institution),
         leaderboard_opt_in = COALESCE($5, leaderboard_opt_in)
       WHERE id = $6
       RETURNING id, username, email, role, full_name, medium, class_level, institution, leaderboard_opt_in`,
      [classLevel, medium, fullName, institution, leaderboardOptIn, req.user.userId]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// FR-1.3 — guardian <-> student linking
router.post('/guardian-links', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'guardian') return res.status(403).json({ message: 'Only guardians can request a link' });
    const { studentUsername } = req.body;
    const student = await pool.query("SELECT id FROM users WHERE username = $1 AND role = 'student'", [studentUsername]);
    if (!student.rows.length) return res.status(404).json({ message: 'Student not found' });
    const result = await pool.query(
      `INSERT INTO guardian_links (guardian_user_id, student_user_id, confirmed) VALUES ($1,$2,false)
       ON CONFLICT (guardian_user_id, student_user_id) DO NOTHING RETURNING *`,
      [req.user.userId, student.rows[0].id]
    );
    res.status(201).json(result.rows[0] || { message: 'Link already requested' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/guardian-links/:id/confirm', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'student') return res.status(403).json({ message: 'Only the linked student can confirm' });
    const result = await pool.query(
      `UPDATE guardian_links SET confirmed = true WHERE id = $1 AND student_user_id = $2 RETURNING *`,
      [req.params.id, req.user.userId]
    );
    if (!result.rows.length) return res.status(404).json({ message: 'Link not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/guardian-links/my-students', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'guardian') return res.status(403).json({ message: 'Guardian role required' });
    const result = await pool.query(
      `SELECT gl.id as link_id, gl.confirmed, u.id as student_id, u.full_name, u.class_level, u.username
       FROM guardian_links gl JOIN users u ON u.id = gl.student_user_id
       WHERE gl.guardian_user_id = $1`,
      [req.user.userId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
