const express = require('express');
const pool = require('../config/database');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get summary stats (admin)
router.get('/', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT a.date, a.status, COUNT(*) as count
      FROM attendance a
      GROUP BY a.date, a.status
      ORDER BY a.date DESC
      LIMIT 100
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get student attendance summary — must come before /:classId/:date
router.get('/student-summary/:studentId', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE status = 'present') AS present,
        COUNT(*) FILTER (WHERE status = 'absent')  AS absent,
        COUNT(*) FILTER (WHERE status = 'late')    AS late,
        COUNT(*) AS total
      FROM attendance
      WHERE student_id = $1
    `, [req.params.studentId]);
    const row = result.rows[0];
    const total = parseInt(row.total) || 0;
    const present = parseInt(row.present) || 0;
    const absent = parseInt(row.absent) || 0;
    const late = parseInt(row.late) || 0;
    const pct = total > 0 ? Math.round(((present + late) / total) * 100) : 0;
    res.json({ present, absent, late, total, pct });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get attendance report for a student by month — must come before /:classId/:date
router.get('/report/:studentId/:month', verifyToken, async (req, res) => {
  try {
    const { studentId, month } = req.params;

    const result = await pool.query(`
      SELECT date, status, remarks
      FROM attendance
      WHERE student_id = $1 AND EXTRACT(MONTH FROM date) = $2
      ORDER BY date
    `, [studentId, month]);

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Attendance report summary per student for a month — for teacher report view
router.get('/report-summary', verifyToken, async (req, res) => {
  try {
    const { month, class_id } = req.query;
    const m = month || new Date().toISOString().slice(0, 7);
    let query = `
      SELECT s.id, s.student_id, s.name_en, s.name_bn, s.roll_number,
             COUNT(a.id) FILTER (WHERE a.status = 'present') AS present,
             COUNT(a.id) FILTER (WHERE a.status = 'absent')  AS absent,
             COUNT(a.id) FILTER (WHERE a.status = 'late')    AS late,
             COUNT(a.id) AS total
      FROM students s
      LEFT JOIN attendance a ON a.student_id = s.id AND a.date::text LIKE $1
      WHERE 1=1
    `;
    const params = [m + '%'];
    if (class_id) { params.push(class_id); query += ` AND s.class_id = $${params.length}`; }
    query += ` GROUP BY s.id, s.student_id, s.name_en, s.name_bn, s.roll_number ORDER BY s.roll_number`;
    const result = await pool.query(query, params);
    const rows = result.rows.map(r => ({
      ...r,
      pct: r.total > 0 ? Math.round(((+r.present + +r.late) / +r.total) * 100) : 0
    }));
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get attendance by class and date (admin & teacher)
router.get('/:classId/:date', verifyToken, async (req, res) => {
  try {
    const { classId, date } = req.params;

    const result = await pool.query(`
      SELECT s.id as student_id, s.student_id, s.name_en, s.name_bn, s.roll_number,
             COALESCE(a.status, 'absent') as status, a.remarks
      FROM students s
      LEFT JOIN attendance a ON s.id = a.student_id AND a.date = $1
      WHERE s.class_id = $2
      ORDER BY s.roll_number
    `, [date, classId]);

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark attendance — frontend sends POST /:classId/:date with { records }
router.post('/:classId/:date', verifyToken, requireRole('admin', 'teacher'), async (req, res) => {
  try {
    const { classId, date } = req.params;
    const { records } = req.body;

    if (!records || !Array.isArray(records)) {
      return res.status(400).json({ message: 'records array is required' });
    }

    for (const record of records) {
      await pool.query(`
        INSERT INTO attendance (student_id, class_id, date, status, remarks, created_by)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (student_id, date)
        DO UPDATE SET status = $4, remarks = $5
      `, [record.student_id, classId, date, record.status || 'absent', record.remarks || null, req.user.userId]);
    }

    res.json({ message: 'Attendance marked successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
