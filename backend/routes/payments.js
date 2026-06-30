const express = require('express');
const pool = require('../config/database');
const { verifyToken, requireRole, requirePermission } = require('../middleware/auth');

const router = express.Router();

router.get('/', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, s.name_en, s.name_bn, s.student_id as student_code, s.roll_number,
             c.class_name, c.section
      FROM payments p
      JOIN students s ON p.student_id = s.id
      LEFT JOIN classes c ON s.class_id = c.id
      ORDER BY p.payment_date DESC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Class-wise payment stats (per class: total students, paid, due, collection)
router.get('/class-stats', verifyToken, requirePermission('finance.view'), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        c.id as class_id,
        c.class_name,
        c.section,
        COUNT(DISTINCT s.id) as total_students,
        COUNT(DISTINCT CASE WHEN p.status='paid' THEN p.student_id END) as paid_students,
        COUNT(DISTINCT CASE WHEN p.status<>'paid' OR p.id IS NULL THEN s.id END) as due_students,
        COALESCE(SUM(CASE WHEN p.status='paid' THEN p.amount ELSE 0 END), 0) as collected,
        COALESCE(SUM(CASE WHEN p.status<>'paid' THEN p.amount ELSE 0 END), 0) as due_amount
      FROM classes c
      LEFT JOIN students s ON s.class_id = c.id
      LEFT JOIN payments p ON p.student_id = s.id
      GROUP BY c.id, c.class_name, c.section
      ORDER BY c.class_name, c.section
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/student/:studentId', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM payments WHERE student_id = $1 ORDER BY payment_date DESC',
      [req.params.studentId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Look up student by class_id + roll_number for payment form
router.get('/lookup-student', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { class_id, roll_number, student_id } = req.query;
    let result;
    if (student_id) {
      result = await pool.query(
        'SELECT id, name_en, name_bn, student_id, roll_number, class_id FROM students WHERE student_id = $1',
        [student_id]
      );
    } else if (class_id && roll_number) {
      result = await pool.query(
        'SELECT id, name_en, name_bn, student_id, roll_number, class_id FROM students WHERE class_id = $1 AND roll_number = $2',
        [class_id, roll_number]
      );
    } else {
      return res.status(400).json({ message: 'Provide student_id or class_id+roll_number' });
    }
    if (!result.rows.length) return res.status(404).json({ message: 'Student not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const {
      student_id, payment_type, amount, due_date,
      payment_method, transaction_id, remarks
    } = req.body;

    if (!student_id || !payment_type || !amount) {
      return res.status(400).json({ message: 'Student, payment type and amount are required' });
    }

    const result = await pool.query(`
      INSERT INTO payments (student_id, payment_type, amount, due_date, payment_method, transaction_id, remarks)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [student_id, payment_type, amount, due_date, payment_method, transaction_id, remarks]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id/status', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { status } = req.body;

    if (!['pending', 'paid', 'overdue'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const result = await pool.query(
      'UPDATE payments SET status = $1, payment_date = NOW() WHERE id = $2 RETURNING *',
      [status, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ message: 'Payment not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM payments WHERE id = $1 RETURNING id', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ message: 'Payment not found' });
    res.json({ message: 'Payment deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
