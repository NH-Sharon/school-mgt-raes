const request = require('supertest');
const bcrypt = require('bcryptjs');
const app = require('../server');
const pool = require('../config/database');

// Exercises requireOwnStudentOrStaff (backend/middleware/auth.js): a student may
// only read their own records, a parent only their linked child's, staff read anything.
describe('student/parent data isolation (IDOR regression)', () => {
  const suffix = Date.now().toString().slice(-8);
  let classId, studentAId, studentBId;
  let studentUsername, studentPassword;
  let parentUsername, parentPassword;
  let studentToken, parentToken, adminToken, teacherToken;

  beforeAll(async () => {
    const classRes = await pool.query(
      "INSERT INTO classes (class_name, class_name_bn, section) VALUES ($1, $1, 'জ') RETURNING id",
      [`JestClass${suffix}`]
    );
    classId = classRes.rows[0].id;

    const mkStudent = async (tag, name) => {
      const r = await pool.query(`
        INSERT INTO students (student_id, name_bn, name_en, father_name, mother_name, date_of_birth, gender, class_id, roll_number)
        VALUES ($1,$2,$3,'F','M','2015-01-01','male',$4,1) RETURNING id
      `, [`J${suffix}${tag}`, name, name, classId]);
      return r.rows[0].id;
    };
    studentAId = await mkStudent('A', 'Jest Student A');
    studentBId = await mkStudent('B', 'Jest Student B');

    studentUsername = `jest_student_${suffix}`;
    studentPassword = 'studentpass1';
    const hash1 = await bcrypt.hash(studentPassword, 10);
    const studentUserRes = await pool.query(
      "INSERT INTO users (username, email, password, role) VALUES ($1,$2,$3,'student') RETURNING id",
      [studentUsername, `${studentUsername}@example.com`, hash1]
    );
    await pool.query('UPDATE students SET user_id = $1 WHERE id = $2', [studentUserRes.rows[0].id, studentAId]);

    parentUsername = `jest_parent_${suffix}`;
    parentPassword = 'parentpass1';
    const hash2 = await bcrypt.hash(parentPassword, 10);
    const parentUserRes = await pool.query(
      "INSERT INTO users (username, email, password, role) VALUES ($1,$2,$3,'parent') RETURNING id",
      [parentUsername, `${parentUsername}@example.com`, hash2]
    );
    await pool.query(
      'INSERT INTO guardian_students (guardian_user_id, student_id) VALUES ($1,$2)',
      [parentUserRes.rows[0].id, studentAId]
    );

    const login = async (username, password) => {
      const res = await request(app).post('/api/auth/login').send({ username, password });
      return res.body.token;
    };
    studentToken = await login(studentUsername, studentPassword);
    parentToken = await login(parentUsername, parentPassword);
    adminToken = await login('admin', 'password');
    teacherToken = await login('teacher1', 'password');
  });

  afterAll(async () => {
    await pool.query('DELETE FROM guardian_students WHERE student_id IN ($1,$2)', [studentAId, studentBId]);
    await pool.query('DELETE FROM students WHERE id IN ($1,$2)', [studentAId, studentBId]);
    await pool.query('DELETE FROM users WHERE username IN ($1,$2)', [studentUsername, parentUsername]);
    await pool.query('DELETE FROM classes WHERE id = $1', [classId]);
  });

  test('a student can read their own payment record', async () => {
    const res = await request(app).get(`/api/payments/student/${studentAId}`).set('Authorization', `Bearer ${studentToken}`);
    expect(res.status).toBe(200);
  });

  test('a student CANNOT read another student\'s payment record', async () => {
    const res = await request(app).get(`/api/payments/student/${studentBId}`).set('Authorization', `Bearer ${studentToken}`);
    expect(res.status).toBe(403);
  });

  test('a student CANNOT list the full student roster', async () => {
    const res = await request(app).get('/api/students').set('Authorization', `Bearer ${studentToken}`);
    expect(res.status).toBe(403);
  });

  test('a parent can read their linked child\'s attendance summary', async () => {
    const res = await request(app).get(`/api/attendance/student-summary/${studentAId}`).set('Authorization', `Bearer ${parentToken}`);
    expect(res.status).toBe(200);
  });

  test('a parent CANNOT read an unlinked student\'s attendance summary', async () => {
    const res = await request(app).get(`/api/attendance/student-summary/${studentBId}`).set('Authorization', `Bearer ${parentToken}`);
    expect(res.status).toBe(403);
  });

  test('a student CANNOT submit homework on behalf of another student', async () => {
    const res = await request(app)
      .post('/api/homework/submit')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ homework_id: 1, student_id: studentBId, submission_text: 'hijack attempt' });
    expect(res.status).toBe(403);
  });

  test('admin can read any student\'s payment record', async () => {
    const res = await request(app).get(`/api/payments/student/${studentBId}`).set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
  });

  test('teacher can read any student\'s exam results', async () => {
    const res = await request(app).get(`/api/exams/student-results/${studentBId}`).set('Authorization', `Bearer ${teacherToken}`);
    expect(res.status).toBe(200);
  });

  test('no token at all is rejected', async () => {
    const res = await request(app).get(`/api/payments/student/${studentAId}`);
    expect(res.status).toBe(401);
  });
});
