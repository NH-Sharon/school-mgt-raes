const jwt = require('jsonwebtoken');

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

module.exports = { verifyToken, requireRole, requirePermission };
