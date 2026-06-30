const express = require('express');
const pool = require('../config/database');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT e.*, c.class_name, c.section
      FROM exams e
      LEFT JOIN classes c ON e.class_id = c.id
      ORDER BY e.start_date DESC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const {
      exam_name, exam_name_bn, exam_type, class_id,
      start_date, end_date, total_marks, pass_marks
    } = req.body;

    if (!exam_name || !exam_type || !start_date || !end_date) {
      return res.status(400).json({ message: 'Exam name, type, start date, and end date are required' });
    }

    const result = await pool.query(`
      INSERT INTO exams (exam_name, exam_name_bn, exam_type, class_id, start_date, end_date, total_marks, pass_marks)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [exam_name, exam_name_bn || exam_name, exam_type, class_id, start_date, end_date, total_marks || 100, pass_marks || 40]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { exam_name, exam_name_bn, exam_type, class_id, start_date, end_date, total_marks, pass_marks } = req.body;

    const result = await pool.query(`
      UPDATE exams SET
        exam_name = COALESCE($1, exam_name),
        exam_name_bn = COALESCE($2, exam_name_bn),
        exam_type = COALESCE($3, exam_type),
        class_id = COALESCE($4, class_id),
        start_date = COALESCE($5, start_date),
        end_date = COALESCE($6, end_date),
        total_marks = COALESCE($7, total_marks),
        pass_marks = COALESCE($8, pass_marks)
      WHERE id = $9
      RETURNING *
    `, [exam_name, exam_name_bn, exam_type, class_id, start_date, end_date, total_marks, pass_marks, id]);

    if (!result.rows.length) return res.status(404).json({ message: 'Exam not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM exams WHERE id = $1 RETURNING id', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ message: 'Exam not found' });
    res.json({ message: 'Exam deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all results for a specific student
router.get('/student-results/:studentId', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT er.*, sub.subject_name, e.exam_name
      FROM exam_results er
      JOIN subjects sub ON er.subject_id = sub.id
      JOIN exams e ON er.exam_id = e.id
      WHERE er.student_id = $1
      ORDER BY e.exam_name, sub.subject_name
    `, [req.params.studentId]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:examId/results', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT er.*, s.name_en, s.roll_number, sub.subject_name
      FROM exam_results er
      JOIN students s ON er.student_id = s.id
      JOIN subjects sub ON er.subject_id = sub.id
      WHERE er.exam_id = $1
      ORDER BY s.roll_number, sub.subject_name
    `, [req.params.examId]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/results', verifyToken, requireRole('admin', 'teacher'), async (req, res) => {
  try {
    const { exam_id, student_id, subject_id, marks_obtained, grade, remarks } = req.body;

    const existing = await pool.query(
      'SELECT id FROM exam_results WHERE exam_id=$1 AND student_id=$2 AND subject_id=$3',
      [exam_id, student_id, subject_id]
    );
    let result;
    if (existing.rows.length) {
      result = await pool.query(
        'UPDATE exam_results SET marks_obtained=$1, grade=$2, remarks=$3 WHERE id=$4 RETURNING *',
        [marks_obtained, grade, remarks, existing.rows[0].id]
      );
    } else {
      result = await pool.query(`
        INSERT INTO exam_results (exam_id, student_id, subject_id, marks_obtained, grade, remarks)
        VALUES ($1, $2, $3, $4, $5, $6) RETURNING *
      `, [exam_id, student_id, subject_id, marks_obtained, grade, remarks]);
    }

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
