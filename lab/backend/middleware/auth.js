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

// Accepts the JWT from the Authorization header OR a ?token= query param.
// Needed for direct file streaming (e.g. pdf.js range requests) that cannot
// attach an Authorization header via the Angular HTTP interceptor.
const verifyTokenFlexible = (req, res, next) => {
  const auth = req.headers.authorization;
  const raw = auth && auth.startsWith('Bearer ') ? auth.split(' ')[1] : req.query.token;
  if (!raw) return res.status(401).json({ message: 'No token provided' });
  try {
    req.user = jwt.verify(raw, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
};

module.exports = { verifyToken, requireRole, verifyTokenFlexible };
