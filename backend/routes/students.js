const express = require('express');
const pool = require('../config/database');
const { verifyToken, requireRole, requireOwnStudentOrStaff } = require('../middleware/auth');
const { logAudit } = require('../middleware/audit');

const router = express.Router();

// Shared next-student-id generator, also used by bulk import to keep numbering
// sequential within a single request without re-querying the DB per row.
async function nextStudentId(lastKnownId) {
  const year = new Date().getFullYear();
  let last = lastKnownId;
  if (last === undefined) {
    const r = await pool.query(
      "SELECT student_id FROM students WHERE student_id LIKE $1 ORDER BY student_id DESC LIMIT 1",
      [`S-${year}-%`]
    );
    last = r.rows.length ? r.rows[0].student_id : null;
  }
  let nextNum = 1;
  if (last) {
    const parts = last.split('-');
    nextNum = parseInt(parts[2] || '0') + 1;
  }
  return `S-${year}-${String(nextNum).padStart(3, '0')}`;
}

router.get('/', verifyToken, requireRole('admin', 'teacher'), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT s.*, c.class_name, c.section as class_section
      FROM students s
      LEFT JOIN classes c ON s.class_id = c.id
      ORDER BY c.class_name, s.roll_number
    `);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:id', verifyToken, requireOwnStudentOrStaff(req => req.params.id), async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT s.*, c.class_name, c.section as class_section FROM students s LEFT JOIN classes c ON s.class_id = c.id WHERE s.id = $1',
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ message: 'Student not found' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Auto-generate next student ID
router.get('/meta/next-id', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    res.json({ next_id: await nextStudentId() });
  } catch (error) {
    console.error(error);
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
    const effectiveId = student_id || await nextStudentId();

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

    logAudit(req, 'create', 'student', result.rows[0].id, { student_id: effectiveId, name_en });
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// #4 Bulk import — accepts an array of student rows (as parsed client-side from a CSV).
// Each row uses the same fields as POST /, minus auto-generated defaults. Best-effort:
// invalid rows are skipped and reported back rather than failing the whole batch.
router.post('/bulk-import', verifyToken, requireRole('admin'), async (req, res) => {
  const { rows } = req.body;
  if (!Array.isArray(rows) || !rows.length) {
    return res.status(400).json({ message: 'rows array is required' });
  }

  const created = [];
  const failed = [];
  let lastId = null;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      if (!row.name_en || !row.class_id) {
        failed.push({ row: i + 1, reason: 'name_en and class_id are required' });
        continue;
      }
      const effectiveId = row.student_id || await nextStudentId(lastId || undefined);
      const result = await pool.query(`
        INSERT INTO students (
          student_id, name_bn, name_en, father_name, mother_name,
          date_of_birth, gender, blood_group, phone, address,
          class_id, section, roll_number, photo
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING id, student_id
      `, [
        effectiveId,
        row.name_bn || row.name_en,
        row.name_en,
        row.father_name || '',
        row.mother_name || '',
        row.date_of_birth || '2010-01-01',
        row.gender || 'male',
        row.blood_group, row.phone, row.address,
        row.class_id, row.section, row.roll_number, row.photo || null
      ]);
      lastId = result.rows[0].student_id;
      created.push(result.rows[0]);
    } catch (error) {
      console.error(error);
      failed.push({ row: i + 1, reason: error.code === '23505' ? 'Duplicate student_id' : 'Server error' });
    }
  }

  logAudit(req, 'bulk-import', 'student', null, { created: created.length, failed: failed.length });
  res.status(created.length ? 201 : 400).json({ created, failed });
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
    logAudit(req, 'update', 'student', id, filtered);
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM students WHERE id = $1 RETURNING id', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ message: 'Student not found' });
    logAudit(req, 'delete', 'student', req.params.id);
    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// #1 Guardian (parent-portal) links — admin manages which 'parent' user accounts
// can see which student(s).
router.get('/:id/guardians', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const r = await pool.query(`
      SELECT u.id, u.username, u.full_name, u.phone
      FROM guardian_students gs JOIN users u ON u.id = gs.guardian_user_id
      WHERE gs.student_id = $1
    `, [req.params.id]);
    res.json(r.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/:id/guardians', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { guardian_user_id } = req.body;
    if (!guardian_user_id) return res.status(400).json({ message: 'guardian_user_id is required' });
    const u = await pool.query('SELECT role FROM users WHERE id = $1', [guardian_user_id]);
    if (!u.rows.length || u.rows[0].role !== 'parent') {
      return res.status(400).json({ message: 'guardian_user_id must belong to a parent-role user' });
    }
    const r = await pool.query(
      'INSERT INTO guardian_students (guardian_user_id, student_id) VALUES ($1,$2) ON CONFLICT DO NOTHING RETURNING *',
      [guardian_user_id, req.params.id]
    );
    logAudit(req, 'create', 'guardian_link', req.params.id, { guardian_user_id });
    res.status(201).json(r.rows[0] || { message: 'Already linked' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id/guardians/:guardianUserId', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM guardian_students WHERE student_id = $1 AND guardian_user_id = $2',
      [req.params.id, req.params.guardianUserId]
    );
    logAudit(req, 'delete', 'guardian_link', req.params.id, { guardian_user_id: req.params.guardianUserId });
    res.json({ message: 'Unlinked' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
