const express = require('express');
const pool = require('../config/database');
const { verifyToken, requireRole, requirePermission } = require('../middleware/auth');

const router = express.Router();

router.get('/', verifyToken, requirePermission('hr.employees'), async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM employees ORDER BY name_en');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:id', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM employees WHERE id = $1', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ message: 'Employee not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const {
      emp_id, name_en, name_bn, designation, department,
      phone, email, address, join_date, salary, nid, status, photo
    } = req.body;

    if (!name_en) return res.status(400).json({ message: 'Employee name is required' });

    const result = await pool.query(`
      INSERT INTO employees (emp_id, name_en, name_bn, designation, department, phone, email, address, join_date, salary, nid, status, photo)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `, [
      emp_id || `EMP-${Date.now()}`,
      name_en,
      name_bn || name_en,
      designation, department || 'Academic',
      phone, email, address,
      join_date || new Date().toISOString().split('T')[0],
      salary, nid, status || 'active', photo
    ]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const allowed = ['name_en','name_bn','designation','department','phone','email','address','join_date','salary','nid','status','photo'];
    const fields = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)));
    if (!Object.keys(fields).length) return res.status(400).json({ message: 'No valid fields' });
    const setClause = Object.keys(fields).map((k, i) => `${k} = $${i + 2}`).join(', ');
    const result = await pool.query(
      `UPDATE employees SET ${setClause} WHERE id = $1 RETURNING *`,
      [id, ...Object.values(fields)]
    );
    if (!result.rows.length) return res.status(404).json({ message: 'Employee not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM employees WHERE id = $1 RETURNING id', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ message: 'Employee not found' });
    res.json({ message: 'Employee deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
