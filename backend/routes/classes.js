const express = require('express');
const pool = require('../config/database');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.*, t.name_en as teacher_name,
             COUNT(s.id) as student_count
      FROM classes c
      LEFT JOIN teachers t ON c.class_teacher_id = t.id
      LEFT JOIN students s ON s.class_id = c.id
      GROUP BY c.id, t.name_en
      ORDER BY
        CASE c.class_name
          WHEN 'Play Group' THEN 1
          WHEN 'Nursery'    THEN 2
          WHEN 'Class 1'    THEN 3
          WHEN 'Class 2'    THEN 4
          WHEN 'Class 3'    THEN 5
          WHEN 'Class 4'    THEN 6
          WHEN 'Class 5'    THEN 7
          ELSE 8
        END, c.section
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:id', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT c.*, t.name_en as teacher_name FROM classes c LEFT JOIN teachers t ON c.class_teacher_id = t.id WHERE c.id = $1',
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ message: 'Class not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { class_name, class_name_bn, section, class_teacher_id, room_number, capacity } = req.body;

    if (!class_name) return res.status(400).json({ message: 'Class name is required' });

    const result = await pool.query(`
      INSERT INTO classes (class_name, class_name_bn, section, class_teacher_id, room_number, capacity)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [class_name, class_name_bn, section, class_teacher_id, room_number, capacity]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { class_name, class_name_bn, section, class_teacher_id, room_number, capacity } = req.body;

    const result = await pool.query(`
      UPDATE classes SET
        class_name = COALESCE($1, class_name),
        class_name_bn = COALESCE($2, class_name_bn),
        section = COALESCE($3, section),
        class_teacher_id = COALESCE($4, class_teacher_id),
        room_number = COALESCE($5, room_number),
        capacity = COALESCE($6, capacity)
      WHERE id = $7
      RETURNING *
    `, [class_name, class_name_bn, section, class_teacher_id, room_number, capacity, id]);

    if (!result.rows.length) return res.status(404).json({ message: 'Class not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM classes WHERE id = $1 RETURNING id', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ message: 'Class not found' });
    res.json({ message: 'Class deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
