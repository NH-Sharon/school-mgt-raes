const express = require('express');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const pool = require('../config/database');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = express.Router();

const ALLOWED_MIME = new Set([
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'application/pdf',
]);

const storage = multer.diskStorage({
  destination: path.join(__dirname, '..', 'uploads'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).slice(0, 10);
    cb(null, `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME.has(file.mimetype)) {
      return cb(new Error('Unsupported file type'));
    }
    cb(null, true);
  },
});

// Admin/teacher upload a photo or document (student photo, homework attachment, etc).
// Returns a URL the caller stores on the relevant record (students.photo, homework.attachment_url, ...).
router.post('/', verifyToken, requireRole('admin', 'teacher'), (req, res) => {
  upload.single('file')(req, res, async (err) => {
    if (err) return res.status(400).json({ message: err.message });
    if (!req.file) return res.status(400).json({ message: 'file is required' });
    try {
      const r = await pool.query(
        'INSERT INTO uploads (original_name, stored_name, mime_type, size_bytes, uploaded_by) VALUES ($1,$2,$3,$4,$5) RETURNING id',
        [req.file.originalname, req.file.filename, req.file.mimetype, req.file.size, req.user.userId]
      );
      res.status(201).json({ id: r.rows[0].id, url: `/uploads/${req.file.filename}` });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  });
});

module.exports = router;
