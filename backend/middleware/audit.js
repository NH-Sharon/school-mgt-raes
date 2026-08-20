const pool = require('../config/database');

// Fire-and-forget audit trail for admin write actions. Never blocks or fails the request.
const logAudit = (req, action, entity, entityId, details) => {
  const userId = req.user && req.user.userId;
  pool.query(
    `INSERT INTO audit_log (user_id, username, action, entity, entity_id, details)
     VALUES ($1, (SELECT username FROM users WHERE id = $1), $2, $3, $4, $5)`,
    [userId || null, action, entity, entityId != null ? String(entityId) : null, details ? JSON.stringify(details) : null]
  ).catch(error => console.error('audit log failed:', error));
};

module.exports = { logAudit };
