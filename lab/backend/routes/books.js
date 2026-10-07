const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pool = require('../config/database');
const { verifyToken, requireRole, verifyTokenFlexible } = require('../middleware/auth');

const router = express.Router();

const BACKEND_ROOT = path.join(__dirname, '..');
const UPLOADS_DIR = path.join(BACKEND_ROOT, 'uploads');
const TEXTBOOKS_DIR = path.join(BACKEND_ROOT, '..', 'text-books');
const ALLOWED_ROOTS = [UPLOADS_DIR, path.resolve(TEXTBOOKS_DIR)];

if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// Resolve a stored (relative) file_path to an absolute path, verifying it stays
// inside an allowed root — books are addressed by id (never by client-supplied
// path), so this is defence-in-depth.
function resolveBookPath(filePath) {
  const abs = path.resolve(BACKEND_ROOT, filePath);
  const ok = ALLOWED_ROOTS.some(root => abs === root || abs.startsWith(root + path.sep));
  return ok ? abs : null;
}

// ── Multer disk storage for admin uploads (separate from the CSV memory upload) ──
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const safe = file.originalname.replace(/[^\w.\-]+/g, '_');
    cb(null, `${Date.now()}_${safe}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 600 * 1024 * 1024 }, // 600 MB — textbook PDFs are large
  fileFilter: (req, file, cb) => cb(null, file.mimetype === 'application/pdf'),
});

const contentAdminRoles = ['content_admin', 'system_admin'];

// ── Student-facing: browse published books ──────────────────────
router.get('/', verifyToken, async (req, res) => {
  try {
    const { classLevel, subjectId } = req.query;
    const clauses = [`b.status = 'published'`];
    const params = [];
    if (classLevel) { params.push(classLevel); clauses.push(`b.class_level = $${params.length}`); }
    if (subjectId) { params.push(subjectId); clauses.push(`b.subject_id = $${params.length}`); }
    const result = await pool.query(
      `SELECT b.id, b.subject_id, b.class_level, b.title_bn, b.title_en, b.page_count,
              s.name_bn AS subject_bn, s.name_en AS subject_en
       FROM books b JOIN subjects s ON s.id = b.subject_id
       WHERE ${clauses.join(' AND ')}
       ORDER BY b.class_level, s.name_en, b.title_en`,
      params
    );
    res.json(result.rows);
  } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

// ── Stream the PDF with HTTP Range (res.sendFile handles partial content) ──
router.get('/:id/file', verifyTokenFlexible, async (req, res) => {
  try {
    const r = await pool.query('SELECT file_path FROM books WHERE id = $1', [req.params.id]);
    if (!r.rows.length) return res.status(404).json({ message: 'Book not found' });
    const abs = resolveBookPath(r.rows[0].file_path);
    if (!abs || !fs.existsSync(abs)) return res.status(404).json({ message: 'File missing on server' });
    res.setHeader('Content-Type', 'application/pdf');
    res.sendFile(abs); // Express sets Accept-Ranges and serves 206 for Range requests
  } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

// ── Reading progress (FR-5.4) ───────────────────────────────────
router.get('/:id/progress/mine', verifyToken, async (req, res) => {
  try {
    const r = await pool.query(
      'SELECT last_page FROM reading_progress WHERE user_id = $1 AND book_id = $2',
      [req.user.userId, req.params.id]
    );
    res.json({ lastPage: r.rows.length ? r.rows[0].last_page : 1 });
  } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

router.post('/:id/progress', verifyToken, async (req, res) => {
  try {
    const lastPage = Math.max(1, parseInt(req.body.lastPage, 10) || 1);
    await pool.query(
      `INSERT INTO reading_progress (user_id, book_id, last_page, updated_at)
       VALUES ($1,$2,$3,now())
       ON CONFLICT (user_id, book_id) DO UPDATE SET last_page = EXCLUDED.last_page, updated_at = now()`,
      [req.user.userId, req.params.id, lastPage]
    );
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

// ── Admin: list all (incl. drafts), upload, delete ──────────────
router.get('/admin/all', verifyToken, requireRole(...contentAdminRoles), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT b.*, s.name_en AS subject_en FROM books b JOIN subjects s ON s.id = b.subject_id
       ORDER BY b.created_at DESC`
    );
    res.json(result.rows);
  } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

router.post('/admin', verifyToken, requireRole(...contentAdminRoles), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'A PDF file is required' });
    const { subjectId, classLevel, titleBn, titleEn } = req.body;
    if (!subjectId || !classLevel || !titleEn) {
      fs.unlink(req.file.path, () => {});
      return res.status(400).json({ message: 'subjectId, classLevel and titleEn are required' });
    }
    const relPath = path.join('uploads', req.file.filename); // relative to backend root
    const result = await pool.query(
      `INSERT INTO books (subject_id, class_level, title_bn, title_en, file_path, original_name, size_bytes, status, uploaded_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'published',$8) RETURNING *`,
      [subjectId, classLevel, titleBn || titleEn, titleEn, relPath, req.file.originalname, req.file.size, req.user.userId]
    );
    res.status(201).json(result.rows[0]);
  } catch (e) {
    if (req.file) fs.unlink(req.file.path, () => {});
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/admin/:id', verifyToken, requireRole(...contentAdminRoles), async (req, res) => {
  try {
    const r = await pool.query('SELECT file_path FROM books WHERE id = $1', [req.params.id]);
    if (!r.rows.length) return res.status(404).json({ message: 'Book not found' });
    await pool.query('DELETE FROM books WHERE id = $1', [req.params.id]);
    // Only remove the file if it lives under uploads/ (never delete seeded textbooks)
    const abs = resolveBookPath(r.rows[0].file_path);
    if (abs && abs.startsWith(UPLOADS_DIR + path.sep)) fs.unlink(abs, () => {});
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

module.exports = router;
