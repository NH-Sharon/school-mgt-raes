const express = require('express');
const pool = require('../config/database');
const { verifyToken, requireRole } = require('../middleware/auth');
const { logAudit } = require('../middleware/audit');

const router = express.Router();

router.get('/', verifyToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM transport ORDER BY route_name');
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const {
      route_name, route_name_bn, driver_name, driver_phone,
      vehicle_number, capacity, monthly_fee
    } = req.body;

    if (!route_name) return res.status(400).json({ message: 'Route name is required' });

    const result = await pool.query(`
      INSERT INTO transport (route_name, route_name_bn, driver_name, driver_phone, vehicle_number, capacity, monthly_fee)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [route_name, route_name_bn || route_name, driver_name, driver_phone, vehicle_number, capacity, monthly_fee]);

    logAudit(req, 'create', 'transport', result.rows[0].id, { route_name });
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { route_name, route_name_bn, driver_name, driver_phone, vehicle_number, capacity, monthly_fee } = req.body;

    const result = await pool.query(`
      UPDATE transport SET
        route_name = COALESCE($1, route_name),
        route_name_bn = COALESCE($2, route_name_bn),
        driver_name = COALESCE($3, driver_name),
        driver_phone = COALESCE($4, driver_phone),
        vehicle_number = COALESCE($5, vehicle_number),
        capacity = COALESCE($6, capacity),
        monthly_fee = COALESCE($7, monthly_fee)
      WHERE id = $8
      RETURNING *
    `, [route_name, route_name_bn, driver_name, driver_phone, vehicle_number, capacity, monthly_fee, id]);

    if (!result.rows.length) return res.status(404).json({ message: 'Transport route not found' });
    logAudit(req, 'update', 'transport', id, req.body);
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM transport WHERE id = $1 RETURNING id', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ message: 'Transport route not found' });
    logAudit(req, 'delete', 'transport', req.params.id);
    res.json({ message: 'Transport route deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/assign', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { student_id, transport_id, pickup_point, monthly_fee } = req.body;

    const result = await pool.query(`
      INSERT INTO student_transport (student_id, transport_id, pickup_point, monthly_fee)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [student_id, transport_id, pickup_point, monthly_fee]);

    logAudit(req, 'create', 'student_transport', result.rows[0].id, { student_id, transport_id });
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
