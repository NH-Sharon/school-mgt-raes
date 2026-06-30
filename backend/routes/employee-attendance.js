const express = require('express');
const pool = require('../config/database');
const { verifyToken, requireRole, requirePermission } = require('../middleware/auth');
const router = express.Router();

// Ensure table exists
async function ensureTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS employee_attendance (
      id SERIAL PRIMARY KEY,
      employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
      date DATE NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'present',
      remarks TEXT,
      created_by INTEGER,
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(employee_id, date)
    )
  `);
}
ensureTable().catch(console.error);

// GET /api/employee-attendance?date=YYYY-MM-DD&department=xxx
router.get('/', verifyToken, requirePermission('hr.attendance'), async (req, res) => {
  try {
    const { date, department } = req.query;
    const d = date || new Date().toISOString().split('T')[0];
    let query = `
      SELECT e.id as emp_db_id, e.emp_id, e.name_en, e.name_bn, e.designation, e.department,
             COALESCE(ea.status, 'absent') as status, ea.remarks
      FROM employees e
      LEFT JOIN employee_attendance ea ON ea.employee_id = e.id AND ea.date = $1
      WHERE e.status = 'Active'
    `;
    const params = [d];
    if (department && department !== '') {
      query += ` AND e.department = $2`;
      params.push(department);
    }
    query += ` ORDER BY e.department, e.name_en`;
    const r = await pool.query(query, params);
    res.json(r.rows);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// GET /api/employee-attendance/report?employee_id=&month=YYYY-MM
router.get('/report', verifyToken, requirePermission('hr.attendance'), async (req, res) => {
  try {
    const { employee_id, month } = req.query;
    let query = `
      SELECT ea.date, ea.status, ea.remarks, e.name_en, e.emp_id, e.department
      FROM employee_attendance ea
      JOIN employees e ON ea.employee_id = e.id
      WHERE 1=1
    `;
    const params = [];
    if (employee_id) { params.push(employee_id); query += ` AND ea.employee_id = $${params.length}`; }
    if (month) { params.push(month + '%'); query += ` AND ea.date::text LIKE $${params.length}`; }
    query += ` ORDER BY ea.date DESC`;
    const r = await pool.query(query, params);
    res.json(r.rows);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// GET /api/employee-attendance/summary — summary per employee for a month
router.get('/summary', verifyToken, requirePermission('hr.attendance'), async (req, res) => {
  try {
    const { month } = req.query;
    const m = month || new Date().toISOString().slice(0, 7);
    const r = await pool.query(`
      SELECT e.id, e.emp_id, e.name_en, e.department,
             COUNT(ea.id) FILTER (WHERE ea.status = 'present') as present,
             COUNT(ea.id) FILTER (WHERE ea.status = 'absent')  as absent,
             COUNT(ea.id) FILTER (WHERE ea.status = 'late')    as late,
             COUNT(ea.id) as total
      FROM employees e
      LEFT JOIN employee_attendance ea ON ea.employee_id = e.id AND ea.date::text LIKE $1
      WHERE e.status = 'Active'
      GROUP BY e.id, e.emp_id, e.name_en, e.department
      ORDER BY e.department, e.name_en
    `, [m + '%']);
    res.json(r.rows);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// POST /api/employee-attendance — bulk save attendance for a date
router.post('/', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { date, records } = req.body;
    if (!date || !records?.length) return res.status(400).json({ message: 'date and records required' });
    for (const r of records) {
      await pool.query(`
        INSERT INTO employee_attendance (employee_id, date, status, remarks, created_by)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (employee_id, date) DO UPDATE SET status=$3, remarks=$4
      `, [r.emp_db_id, date, r.status || 'absent', r.remarks || null, req.user.userId]);
    }
    res.json({ message: 'Attendance saved' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;
