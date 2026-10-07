const express = require('express');
const pool = require('../config/database');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// FR-7.1 — in-app reminders (assigned exams, incomplete experiments, streaks)
router.get('/', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
      [req.user.userId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id/read', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      'UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2 RETURNING *',
      [req.params.id, req.user.userId]
    );
    if (!result.rows.length) return res.status(404).json({ message: 'Notification not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/read-all', verifyToken, async (req, res) => {
  try {
    await pool.query('UPDATE notifications SET is_read = true WHERE user_id = $1', [req.user.userId]);
    res.json({ message: 'ok' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// FR-7.2 — teacher broadcasts an announcement to their class
router.post('/announcements', verifyToken, requireRole('teacher', 'system_admin'), async (req, res) => {
  try {
    const { classLevel, subjectId, messageBn, messageEn } = req.body;
    const announcement = await pool.query(
      `INSERT INTO announcements (teacher_user_id, class_level, subject_id, message_bn, message_en)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [req.user.userId, classLevel, subjectId || null, messageBn, messageEn]
    );

    const students = await pool.query("SELECT id FROM users WHERE role = 'student' AND class_level = $1", [classLevel]);
    for (const s of students.rows) {
      await pool.query(
        `INSERT INTO notifications (user_id, type, message_bn, message_en) VALUES ($1,'announcement',$2,$3)`,
        [s.id, messageBn, messageEn]
      );
    }
    res.status(201).json(announcement.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/announcements/for-my-class', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM announcements WHERE class_level = $1 ORDER BY created_at DESC LIMIT 20',
      [req.user.classLevel]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
