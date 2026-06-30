const express = require('express');
const pool = require('../config/database');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', verifyToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM teachers ORDER BY name_en');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:id', verifyToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM teachers WHERE id = $1', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ message: 'Teacher not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const {
      teacher_id, name_bn, name_en, designation, subject,
      phone, email, address, salary
    } = req.body;

    if (!name_en) return res.status(400).json({ message: 'Teacher name is required' });

    const result = await pool.query(`
      INSERT INTO teachers (teacher_id, name_bn, name_en, designation, subject, phone, email, address, salary)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [
      teacher_id || `T-${Date.now()}`,
      name_bn || name_en,
      name_en,
      designation, subject, phone, email, address, salary
    ]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const allowedFields = [
      'teacher_id','name_bn','name_en','designation','subject',
      'phone','email','address','salary'
    ];
    const filtered = Object.fromEntries(
      Object.entries(updates).filter(([k]) => allowedFields.includes(k))
    );

    if (!Object.keys(filtered).length) {
      return res.status(400).json({ message: 'No valid fields to update' });
    }

    const setClause = Object.keys(filtered).map((key, i) => `${key} = $${i + 2}`).join(', ');
    const values = [id, ...Object.values(filtered)];

    const result = await pool.query(
      `UPDATE teachers SET ${setClause} WHERE id = $1 RETURNING *`, values
    );
    if (!result.rows.length) return res.status(404).json({ message: 'Teacher not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM teachers WHERE id = $1 RETURNING id', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ message: 'Teacher not found' });
    res.json({ message: 'Teacher deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
