const express = require('express');
const PDFDocument = require('pdfkit');
const pool = require('../config/database');
const { verifyToken, requireRole, requireOwnStudentOrStaff, requireOwnClassOrAdmin } = require('../middleware/auth');
const { logAudit } = require('../middleware/audit');

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
    console.error(error);
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

    logAudit(req, 'create', 'exam', result.rows[0].id, { exam_name, class_id });
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
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
    logAudit(req, 'update', 'exam', id, req.body);
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM exams WHERE id = $1 RETURNING id', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ message: 'Exam not found' });
    logAudit(req, 'delete', 'exam', req.params.id);
    res.json({ message: 'Exam deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all results for a specific student
router.get('/student-results/:studentId', verifyToken, requireOwnStudentOrStaff(req => req.params.studentId), async (req, res) => {
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
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:examId/results', verifyToken, requireRole('admin', 'teacher'), async (req, res) => {
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
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/results', verifyToken, requireOwnClassOrAdmin(async req => {
  const r = await pool.query('SELECT class_id FROM exams WHERE id = $1', [req.body.exam_id]);
  return r.rows[0] && r.rows[0].class_id;
}), async (req, res) => {
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

    logAudit(req, existing.rows.length ? 'update' : 'create', 'exam_result', result.rows[0].id, { exam_id, student_id, subject_id, marks_obtained });
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// #10 Seat plan — auto-assign the exam's class roster into rooms, in roll-number order.
router.post('/:examId/seat-plan/generate', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { rooms, capacity_per_room } = req.body; // rooms: string[], capacity_per_room: number
    if (!Array.isArray(rooms) || !rooms.length || !capacity_per_room) {
      return res.status(400).json({ message: 'rooms (array) and capacity_per_room are required' });
    }

    const exam = await pool.query('SELECT class_id FROM exams WHERE id = $1', [req.params.examId]);
    if (!exam.rows.length) return res.status(404).json({ message: 'Exam not found' });

    const students = await pool.query(
      'SELECT id FROM students WHERE class_id = $1 ORDER BY roll_number',
      [exam.rows[0].class_id]
    );
    if (students.rows.length > rooms.length * capacity_per_room) {
      return res.status(400).json({ message: 'Not enough room capacity for all students in this class' });
    }

    await pool.query('DELETE FROM exam_seat_plans WHERE exam_id = $1', [req.params.examId]);

    const assignments = students.rows.map((s, i) => ({
      student_id: s.id,
      room: rooms[Math.floor(i / capacity_per_room)],
      seat_number: (i % capacity_per_room) + 1,
    }));

    for (const a of assignments) {
      await pool.query(
        'INSERT INTO exam_seat_plans (exam_id, student_id, room, seat_number) VALUES ($1,$2,$3,$4)',
        [req.params.examId, a.student_id, a.room, a.seat_number]
      );
    }

    logAudit(req, 'generate', 'seat_plan', req.params.examId, { rooms, capacity_per_room, count: assignments.length });
    res.status(201).json({ message: `Seated ${assignments.length} student(s)`, count: assignments.length });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Whole-class seat plan — staff only. Students/parents use the /mine/:studentId
// lookup below instead, which only reveals their own seat.
router.get('/:examId/seat-plan', verifyToken, requireRole('admin', 'teacher'), async (req, res) => {
  try {
    const r = await pool.query(`
      SELECT esp.*, s.name_en, s.roll_number
      FROM exam_seat_plans esp JOIN students s ON s.id = esp.student_id
      WHERE esp.exam_id = $1
      ORDER BY esp.room, esp.seat_number
    `, [req.params.examId]);
    res.json(r.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:examId/seat-plan/mine/:studentId', verifyToken, requireOwnStudentOrStaff(req => req.params.studentId), async (req, res) => {
  try {
    const r = await pool.query(
      'SELECT room, seat_number FROM exam_seat_plans WHERE exam_id = $1 AND student_id = $2',
      [req.params.examId, req.params.studentId]
    );
    if (!r.rows.length) return res.status(404).json({ message: 'No seat assigned yet' });
    res.json(r.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// #8 Report card — a single student's per-subject marks for one exam, as a PDF.
router.get('/:examId/report-card/:studentId', verifyToken, requireOwnStudentOrStaff(req => req.params.studentId), async (req, res) => {
  try {
    const examRes = await pool.query('SELECT * FROM exams WHERE id = $1', [req.params.examId]);
    if (!examRes.rows.length) return res.status(404).json({ message: 'Exam not found' });
    const exam = examRes.rows[0];

    const studentRes = await pool.query(
      'SELECT s.*, c.class_name, c.section FROM students s LEFT JOIN classes c ON c.id = s.class_id WHERE s.id = $1',
      [req.params.studentId]
    );
    if (!studentRes.rows.length) return res.status(404).json({ message: 'Student not found' });
    const student = studentRes.rows[0];

    const resultsRes = await pool.query(`
      SELECT er.marks_obtained, er.grade, sub.subject_name
      FROM exam_results er JOIN subjects sub ON sub.id = er.subject_id
      WHERE er.exam_id = $1 AND er.student_id = $2
      ORDER BY sub.subject_name
    `, [req.params.examId, req.params.studentId]);

    const totalObtained = resultsRes.rows.reduce((sum, r) => sum + Number(r.marks_obtained || 0), 0);
    const totalPossible = resultsRes.rows.length * exam.total_marks;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="report-card-${student.student_id}-${exam.id}.pdf"`);

    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(res);

    doc.fontSize(18).text('Report Card', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(12).text(exam.exam_name, { align: 'center' });
    doc.moveDown();

    doc.fontSize(11);
    doc.text(`Student: ${student.name_en}  (${student.student_id})`);
    doc.text(`Class: ${student.class_name || '-'} ${student.section || ''}   Roll: ${student.roll_number || '-'}`);
    doc.moveDown();

    doc.font('Helvetica-Bold');
    doc.text('Subject', 50, doc.y, { continued: true, width: 250 });
    doc.text('Marks Obtained', 300, doc.y, { continued: true, width: 150 });
    doc.text('Grade', 450);
    doc.font('Helvetica');
    doc.moveDown(0.3);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(0.3);

    resultsRes.rows.forEach(r => {
      const y = doc.y;
      doc.text(r.subject_name, 50, y, { continued: true, width: 250 });
      doc.text(`${r.marks_obtained} / ${exam.total_marks}`, 300, y, { continued: true, width: 150 });
      doc.text(r.grade || '-', 450);
    });

    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(0.3);
    doc.font('Helvetica-Bold').text(`Total: ${totalObtained} / ${totalPossible}`);

    doc.end();
  } catch (error) {
    console.error(error);
    if (!res.headersSent) res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
