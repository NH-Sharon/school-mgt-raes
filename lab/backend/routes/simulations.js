const express = require('express');
const pool = require('../config/database');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Labs open to every class 9-12 even if the DB row has no config.classLevels yet
// (so a fresh deploy works without a data migration). Others can opt in via config.classLevels.
const SHARED_9_12_KEYS = ['chem-mixing', 'chem-titration'];

// FR-7 — lab catalog ordered by class -> subject -> chapter -> topic -> sim order.
// Access control: students see only their own class; guardians see their linked
// students' classes; teachers/content_admin/system_admin (moderators) see all.
// Registered before '/:key' so it is not shadowed by the key route.
router.get('/catalog/list', verifyToken, async (req, res) => {
  try {
    const clauses = [`s.status = 'published'`, `c.status = 'published'`];
    const params = [];

    // Determine which class levels this user may see.
    let allowedClasses = null; // null = all
    if (req.user.role === 'student') {
      allowedClasses = req.user.classLevel ? [req.user.classLevel] : [-1]; // -1 => none
    } else if (req.user.role === 'guardian') {
      const linked = await pool.query(
        `SELECT DISTINCT u.class_level FROM guardian_links gl
         JOIN users u ON u.id = gl.student_user_id
         WHERE gl.guardian_user_id = $1 AND gl.confirmed = true AND u.class_level IS NOT NULL`,
        [req.user.userId]
      );
      allowedClasses = linked.rows.map(r => r.class_level);
      if (!allowedClasses.length) allowedClasses = [-1];
    }
    // teacher / content_admin / system_admin => allowedClasses stays null (all)

    // A lab can be shared across classes: simulations.config.classLevels = [9,10,11,12]
    // makes it visible to every listed class (shown under the viewer's own class).
    let classParam = null, keysParam = 0;
    const shared = (a) => `(s.config->'classLevels' @> to_jsonb(${a}) OR (s.key = ANY($${keysParam}::text[]) AND ${a} BETWEEN 9 AND 12))`;
    if (allowedClasses) {
      params.push(allowedClasses);
      classParam = params.length;
      params.push(SHARED_9_12_KEYS); keysParam = params.length;
      clauses.push(`(c.class_level = ANY($${classParam}::int[])
        OR EXISTS (SELECT 1 FROM unnest($${classParam}::int[]) a WHERE ${shared('a')}))`);
    }
    // Optional narrowing filters (used by the staff class/subject selectors).
    if (req.query.subjectId) { params.push(req.query.subjectId); clauses.push(`c.subject_id = $${params.length}`); }
    if (req.query.classLevel && !allowedClasses) {
      params.push(Number(req.query.classLevel)); classParam = params.length;
      params.push(SHARED_9_12_KEYS); keysParam = params.length;
      clauses.push(`(c.class_level = $${classParam} OR ${shared(`$${classParam}::int`)})`);
    }
    // class shown for a shared lab = the class the viewer asked for / belongs to
    const shownClass = classParam
      ? (allowedClasses
          ? `COALESCE((SELECT MIN(a) FROM unnest($${classParam}::int[]) a WHERE a = c.class_level OR ${shared('a')}), c.class_level)`
          : `$${classParam}::int`)
      : 'c.class_level';

    const result = await pool.query(
      `SELECT s.id, s.key, s.title_bn, s.title_en, s.supports_guided, s.supports_free, s.order_index,
              c.id AS chapter_id, c.title_bn AS chapter_bn, c.title_en AS chapter_en,
              c.order_index AS chapter_order, c.subject_id, ${shownClass} AS class_level,
              t.title_bn AS topic_bn, t.title_en AS topic_en, t.order_index AS topic_order,
              sub.name_bn AS subject_bn, sub.name_en AS subject_en
       FROM simulations s
       JOIN chapters c ON c.id = s.chapter_id
       JOIN subjects sub ON sub.id = c.subject_id
       LEFT JOIN topics t ON t.id = s.topic_id
       WHERE ${clauses.join(' AND ')}
       ORDER BY ${shownClass}, sub.name_en, c.order_index, COALESCE(t.order_index, 0), s.order_index, s.id`,
      params
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// FR-8 — required safety equipment for a lab + the full catalog (for the checklist).
router.get('/:key/safety', verifyToken, async (req, res) => {
  try {
    const sim = await pool.query('SELECT id FROM simulations WHERE key = $1', [req.params.key]);
    if (!sim.rows.length) return res.status(404).json({ message: 'Simulation not found' });
    const required = await pool.query(
      `SELECT e.key FROM lab_safety_requirements r JOIN safety_equipment e ON e.id = r.equipment_id
       WHERE r.simulation_id = $1 AND r.required = true`,
      [sim.rows[0].id]
    );
    const all = await pool.query('SELECT key, name_bn, name_en, icon FROM safety_equipment ORDER BY id');
    res.json({ requiredKeys: required.rows.map(r => r.key), equipment: all.rows });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:key', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM simulations WHERE key = $1', [req.params.key]);
    if (!result.rows.length) return res.status(404).json({ message: 'Simulation not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// FR-2.8 — every simulation attempt logged: date, time, duration, steps, mistakes, hints, completion
router.post('/:key/attempts', verifyToken, async (req, res) => {
  try {
    const sim = await pool.query('SELECT id FROM simulations WHERE key = $1', [req.params.key]);
    if (!sim.rows.length) return res.status(404).json({ message: 'Simulation not found' });
    const simId = sim.rows[0].id;
    const { mode, safetySelection } = req.body;

    // FR-8 — verify the safety checklist was satisfied before the lab is entered.
    const required = await pool.query(
      `SELECT e.key FROM lab_safety_requirements r JOIN safety_equipment e ON e.id = r.equipment_id
       WHERE r.simulation_id = $1 AND r.required = true`,
      [simId]
    );
    const requiredKeys = required.rows.map(r => r.key);
    const selection = Array.isArray(safetySelection) ? safetySelection : [];
    const safetyPassed = requiredKeys.every(k => selection.includes(k));
    if (requiredKeys.length && !safetyPassed) {
      return res.status(400).json({ message: 'Safety checklist not completed', requiredKeys });
    }

    const result = await pool.query(
      `INSERT INTO simulation_attempts (user_id, simulation_id, mode, safety_selection, safety_passed)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [req.user.userId, simId, mode === 'free' ? 'free' : 'guided', JSON.stringify(selection), safetyPassed]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Incrementally record steps/observations while the student works (auto-save, Reliability NFR)
router.put('/attempts/:attemptId', verifyToken, async (req, res) => {
  try {
    const { steps, mistakes, hintsUsed, observationData } = req.body;
    const result = await pool.query(
      `UPDATE simulation_attempts SET
         steps = COALESCE($1, steps),
         mistakes = COALESCE($2, mistakes),
         hints_used = COALESCE($3, hints_used),
         observation_data = COALESCE($4, observation_data)
       WHERE id = $5 AND user_id = $6 RETURNING *`,
      [steps ? JSON.stringify(steps) : null, mistakes, hintsUsed, observationData ? JSON.stringify(observationData) : null, req.params.attemptId, req.user.userId]
    );
    if (!result.rows.length) return res.status(404).json({ message: 'Attempt not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// FR-2.7 — completion generates the data behind a printable lab report
router.put('/attempts/:attemptId/complete', verifyToken, async (req, res) => {
  try {
    const { resultSummary, observationData } = req.body;
    const attempt = await pool.query('SELECT started_at FROM simulation_attempts WHERE id = $1 AND user_id = $2', [req.params.attemptId, req.user.userId]);
    if (!attempt.rows.length) return res.status(404).json({ message: 'Attempt not found' });
    const durationSeconds = Math.max(1, Math.round((Date.now() - new Date(attempt.rows[0].started_at).getTime()) / 1000));
    const result = await pool.query(
      `UPDATE simulation_attempts SET
         completed_at = now(), duration_seconds = $1, result_summary = $2,
         observation_data = COALESCE($3, observation_data), status = 'completed'
       WHERE id = $4 AND user_id = $5 RETURNING *`,
      [durationSeconds, resultSummary || null, observationData ? JSON.stringify(observationData) : null, req.params.attemptId, req.user.userId]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/attempts/history', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT sa.*, s.title_bn, s.title_en, s.key
       FROM simulation_attempts sa JOIN simulations s ON s.id = sa.simulation_id
       WHERE sa.user_id = $1 ORDER BY sa.started_at DESC LIMIT 100`,
      [req.user.userId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
