const jwt = require('jsonwebtoken');
const pool = require('../config/database');

const verifyToken = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }
  try {
    const decoded = jwt.verify(auth.split(' ')[1], process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
};

const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Insufficient permissions' });
  }
  next();
};

// Allows admin always, OR user with specific permission key in their JWT
const requirePermission = (permission) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
  if (req.user.role === 'admin') return next();
  const perms = (req.user.permissions || '').split(',').filter(p => p);
  if (perms.includes(permission)) return next();
  return res.status(403).json({ message: 'Insufficient permissions' });
};

// Allows admin/teacher always. A 'student' user may only proceed if the studentId
// resolved by getStudentId(req) matches the students row linked to their own account.
// A 'parent' user may only proceed if the studentId is one of their linked children
// (guardian_students).
const requireOwnStudentOrStaff = (getStudentId) => async (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
  if (req.user.role === 'admin' || req.user.role === 'teacher') return next();
  if (req.user.role !== 'student' && req.user.role !== 'parent') {
    return res.status(403).json({ message: 'Insufficient permissions' });
  }
  try {
    const requestedId = getStudentId(req);
    if (req.user.role === 'student') {
      const r = await pool.query('SELECT id FROM students WHERE user_id = $1', [req.user.userId]);
      const ownId = r.rows[0] && r.rows[0].id;
      if (!ownId || String(ownId) !== String(requestedId)) {
        return res.status(403).json({ message: 'Insufficient permissions' });
      }
    } else {
      const r = await pool.query(
        'SELECT 1 FROM guardian_students WHERE guardian_user_id = $1 AND student_id = $2',
        [req.user.userId, requestedId]
      );
      if (!r.rows.length) {
        return res.status(403).json({ message: 'Insufficient permissions' });
      }
    }
    next();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Allows admin always. A 'teacher' user is allowed if EITHER they have no rows at all
// in class_subject_teachers yet (backward-compatible: unassigned teachers keep the
// pre-existing broad access) OR the classId resolved by getClassId(req) is one of
// their assigned classes. getClassId may return a value or a Promise.
const requireOwnClassOrAdmin = (getClassId) => async (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
  if (req.user.role === 'admin') return next();
  if (req.user.role !== 'teacher') return res.status(403).json({ message: 'Insufficient permissions' });
  try {
    const anyAssignment = await pool.query(`
      SELECT 1 FROM class_subject_teachers cst JOIN teachers t ON t.id = cst.teacher_id
      WHERE t.user_id = $1 LIMIT 1
    `, [req.user.userId]);
    if (!anyAssignment.rows.length) return next(); // no assignments configured — legacy broad access

    const classId = await getClassId(req);
    const ownClass = await pool.query(`
      SELECT 1 FROM class_subject_teachers cst JOIN teachers t ON t.id = cst.teacher_id
      WHERE t.user_id = $1 AND cst.class_id = $2
    `, [req.user.userId, classId]);
    if (!ownClass.rows.length) return res.status(403).json({ message: 'Insufficient permissions' });
    next();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { verifyToken, requireRole, requirePermission, requireOwnStudentOrStaff, requireOwnClassOrAdmin };
