const express = require('express');
const pool = require('../config/database');
const { verifyToken, requireRole } = require('../middleware/auth');
const { logAudit } = require('../middleware/audit');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const r = await pool.query('SELECT key, value FROM website_settings');
    const settings = {};
    r.rows.forEach(row => { settings[row.key] = row.value; });
    res.json(settings);
  } catch (error) { console.error(error); res.status(500).json({ message: 'Server error' }); }
});

router.put('/', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const settings = req.body;
    for (const [key, value] of Object.entries(settings)) {
      await pool.query(
        'INSERT INTO website_settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value=$2, updated_at=NOW()',
        [key, value]
      );
    }
    logAudit(req, 'update', 'website_settings', null, { keys: Object.keys(settings) });
    res.json({ message: 'Settings saved' });
  } catch (e) { console.error(e); res.status(500).json({ message: 'Server error' }); }
});

module.exports = router;
