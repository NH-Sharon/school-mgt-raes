const express = require('express');
const pool = require('../config/database');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

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
    const { mode } = req.body;
    const result = await pool.query(
      `INSERT INTO simulation_attempts (user_id, simulation_id, mode) VALUES ($1,$2,$3) RETURNING *`,
      [req.user.userId, sim.rows[0].id, mode || 'guided']
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
