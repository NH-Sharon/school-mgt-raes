const express = require('express');
const pool = require('../config/database');
const { verifyToken, requireRole } = require('../middleware/auth');
const { logAudit } = require('../middleware/audit');

const router = express.Router();

router.get('/', verifyToken, requireRole('admin', 'teacher'), async (req, res) => {
  try {
    const r = await pool.query(`
      SELECT fs.*, c.class_name, c.section
      FROM fee_structures fs LEFT JOIN classes c ON c.id = fs.class_id
      ORDER BY c.class_name, fs.fee_type
    `);
    res.json(r.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { class_id, fee_type, amount, recurrence } = req.body;
    if (!fee_type || !amount) {
      return res.status(400).json({ message: 'fee_type and amount are required' });
    }
    const r = await pool.query(
      'INSERT INTO fee_structures (class_id, fee_type, amount, recurrence) VALUES ($1,$2,$3,$4) RETURNING *',
      [class_id || null, fee_type, amount, recurrence || 'monthly']
    );
    logAudit(req, 'create', 'fee_structure', r.rows[0].id, { fee_type, amount, class_id });
    res.status(201).json(r.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { class_id, fee_type, amount, recurrence, is_active } = req.body;
    const r = await pool.query(`
      UPDATE fee_structures SET
        class_id = COALESCE($1, class_id),
        fee_type = COALESCE($2, fee_type),
        amount = COALESCE($3, amount),
        recurrence = COALESCE($4, recurrence),
        is_active = COALESCE($5, is_active)
      WHERE id = $6 RETURNING *
    `, [class_id, fee_type, amount, recurrence, is_active, req.params.id]);
    if (!r.rows.length) return res.status(404).json({ message: 'Fee structure not found' });
    logAudit(req, 'update', 'fee_structure', req.params.id, req.body);
    res.json(r.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const r = await pool.query('DELETE FROM fee_structures WHERE id = $1 RETURNING id', [req.params.id]);
    if (!r.rows.length) return res.status(404).json({ message: 'Fee structure not found' });
    logAudit(req, 'delete', 'fee_structure', req.params.id);
    res.json({ message: 'Deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Generate this month's dues from active 'monthly' fee structures — one payments
// row per (student, fee_structure), skipping any that already exist for the month.
router.post('/generate-dues', verifyToken, requireRole('admin'), async (req, res) => {
  const client = await pool.connect();
  try {
    const { month } = req.body; // 'YYYY-MM', defaults to current month
    const targetMonth = month || new Date().toISOString().slice(0, 7);
    const dueDate = `${targetMonth}-10`; // due on the 10th of the month, matches typical school billing

    const structures = await client.query(
      "SELECT * FROM fee_structures WHERE is_active = true AND recurrence = 'monthly'"
    );

    let generated = 0;
    for (const fs of structures.rows) {
      const students = fs.class_id
        ? await client.query('SELECT id FROM students WHERE class_id = $1 AND status = $2', [fs.class_id, 'active'])
        : await client.query("SELECT id FROM students WHERE status = 'active'");

      for (const s of students.rows) {
        const existing = await client.query(
          `SELECT id FROM payments
           WHERE student_id = $1 AND payment_type = $2 AND to_char(due_date, 'YYYY-MM') = $3`,
          [s.id, fs.fee_type, targetMonth]
        );
        if (existing.rows.length) continue;
        await client.query(
          'INSERT INTO payments (student_id, payment_type, amount, due_date, status) VALUES ($1,$2,$3,$4,$5)',
          [s.id, fs.fee_type, fs.amount, dueDate, 'pending']
        );
        generated++;
      }
    }

    logAudit(req, 'generate-dues', 'payments', null, { month: targetMonth, generated });
    res.json({ message: `Generated ${generated} due(s) for ${targetMonth}`, generated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  } finally {
    client.release();
  }
});

module.exports = router;
