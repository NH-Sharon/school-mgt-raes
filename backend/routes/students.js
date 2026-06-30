const express = require('express');
const pool = require('../config/database');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT s.*, c.class_name, c.section as class_section
      FROM students s
      LEFT JOIN classes c ON s.class_id = c.id
      ORDER BY c.class_name, s.roll_number
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:id', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT s.*, c.class_name, c.section as class_section FROM students s LEFT JOIN classes c ON s.class_id = c.id WHERE s.id = $1',
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ message: 'Student not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Auto-generate next student ID
router.get('/meta/next-id', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const year = new Date().getFullYear();
    const result = await pool.query(
      "SELECT student_id FROM students WHERE student_id LIKE $1 ORDER BY student_id DESC LIMIT 1",
      [`S-${year}-%`]
    );
    let nextNum = 1;
    if (result.rows.length) {
      const last = result.rows[0].student_id;
      const parts = last.split('-');
      nextNum = parseInt(parts[2] || '0') + 1;
    }
    const nextId = `S-${year}-${String(nextNum).padStart(3, '0')}`;
    res.json({ next_id: nextId });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const {
      student_id, name_bn, name_en, father_name, mother_name,
      date_of_birth, gender, blood_group, phone, address,
      class_id, section, roll_number, photo
    } = req.body;

    if (!name_en || !class_id) {
      return res.status(400).json({ message: 'Name (English) and class are required' });
    }

    // Auto-generate ID if not provided
    let effectiveId = student_id;
    if (!effectiveId) {
      const year = new Date().getFullYear();
      const r = await pool.query(
        "SELECT student_id FROM students WHERE student_id LIKE $1 ORDER BY student_id DESC LIMIT 1",
        [`S-${year}-%`]
      );
      let nextNum = 1;
      if (r.rows.length) {
        const parts = r.rows[0].student_id.split('-');
        nextNum = parseInt(parts[2] || '0') + 1;
      }
      effectiveId = `S-${year}-${String(nextNum).padStart(3, '0')}`;
    }

    const result = await pool.query(`
      INSERT INTO students (
        student_id, name_bn, name_en, father_name, mother_name,
        date_of_birth, gender, blood_group, phone, address,
        class_id, section, roll_number, photo
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `, [
      effectiveId,
      name_bn || name_en,
      name_en,
      father_name || '',
      mother_name || '',
      date_of_birth || '2010-01-01',
      gender || 'male',
      blood_group, phone, address,
      class_id, section, roll_number, photo || null
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
      'student_id','name_bn','name_en','father_name','mother_name',
      'date_of_birth','gender','blood_group','phone','address',
      'class_id','section','roll_number','photo'
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
      `UPDATE students SET ${setClause} WHERE id = $1 RETURNING *`, values
    );
    if (!result.rows.length) return res.status(404).json({ message: 'Student not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM students WHERE id = $1 RETURNING id', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ message: 'Student not found' });
    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
