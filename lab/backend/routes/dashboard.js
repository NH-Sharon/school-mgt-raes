const express = require('express');
const pool = require('../config/database');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// FR-5.1/5.2/5.3 — student dashboard: counts, trends, calendar heatmap, timeline, mastery
router.get('/student', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const simCount = await pool.query("SELECT COUNT(*) FROM simulation_attempts WHERE user_id = $1 AND status = 'completed'", [userId]);
    const examStats = await pool.query(
      "SELECT COUNT(*) AS exams_taken, AVG(score/NULLIF(max_score,0)) AS avg_ratio FROM exam_attempts WHERE user_id = $1 AND status != 'in_progress'",
      [userId]
    );
    const chaptersStudied = await pool.query('SELECT COUNT(DISTINCT chapter_id) FROM chapter_progress WHERE user_id = $1 AND percent_complete > 0', [userId]);
    const studyTime = await pool.query('SELECT COALESCE(SUM(duration_seconds),0) AS total FROM simulation_attempts WHERE user_id = $1', [userId]);
    const user = await pool.query('SELECT points, streak_days FROM users WHERE id = $1', [userId]);
    const badges = await pool.query(
      `SELECT b.key, b.title_bn, b.title_en, b.icon, ub.earned_at
       FROM user_badges ub JOIN badges b ON b.id = ub.badge_id WHERE ub.user_id = $1`,
      [userId]
    );

    // per-subject mastery: % of published chapters at >=80% progress
    const mastery = await pool.query(
      `SELECT s.id AS subject_id, s.name_bn, s.name_en,
              COUNT(c.id) AS total_chapters,
              COUNT(cp.id) FILTER (WHERE cp.percent_complete >= 80) AS mastered,
              COUNT(cp.id) FILTER (WHERE cp.percent_complete > 0 AND cp.percent_complete < 80) AS in_progress
       FROM subjects s
       LEFT JOIN chapters c ON c.subject_id = s.id AND c.status = 'published'
       LEFT JOIN chapter_progress cp ON cp.chapter_id = c.id AND cp.user_id = $1
       GROUP BY s.id ORDER BY s.id`,
      [userId]
    );

    // score trend (last 10 exams) for a line chart
    const scoreTrend = await pool.query(
      `SELECT id, score, max_score, submitted_at FROM exam_attempts
       WHERE user_id = $1 AND status != 'in_progress' ORDER BY submitted_at DESC LIMIT 10`,
      [userId]
    );

    // activity calendar heatmap: attempts per day, last 90 days
    const heatmap = await pool.query(
      `SELECT day::date, COUNT(*) AS count FROM (
         SELECT started_at::date AS day FROM simulation_attempts WHERE user_id = $1
         UNION ALL
         SELECT started_at::date AS day FROM exam_attempts WHERE user_id = $1
       ) x WHERE day > now() - interval '90 days' GROUP BY day ORDER BY day`,
      [userId]
    );

    // chronological activity timeline
    const timeline = await pool.query(
      `SELECT * FROM (
         SELECT 'simulation' AS kind, sa.id, s.title_bn, s.title_en, sa.duration_seconds, sa.hints_used, sa.status, sa.started_at AS at, NULL::numeric AS score, NULL::numeric AS max_score
         FROM simulation_attempts sa JOIN simulations s ON s.id = sa.simulation_id WHERE sa.user_id = $1
         UNION ALL
         SELECT 'exam' AS kind, ea.id, NULL, NULL, NULL, NULL, ea.status, ea.started_at AS at, ea.score, ea.max_score
         FROM exam_attempts ea WHERE ea.user_id = $1
       ) t ORDER BY at DESC LIMIT 20`,
      [userId]
    );

    res.json({
      simulationsCompleted: Number(simCount.rows[0].count),
      examsTaken: Number(examStats.rows[0].exams_taken),
      avgScoreRatio: examStats.rows[0].avg_ratio ? Number(examStats.rows[0].avg_ratio) : null,
      chaptersStudied: Number(chaptersStudied.rows[0].count),
      totalStudySeconds: Number(studyTime.rows[0].total),
      points: user.rows[0]?.points ?? 0,
      streakDays: user.rows[0]?.streak_days ?? 0,
      badges: badges.rows,
      mastery: mastery.rows,
      scoreTrend: scoreTrend.rows.reverse(),
      heatmap: heatmap.rows,
      timeline: timeline.rows,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// FR-5.5 — teacher class dashboard
router.get('/teacher/class/:classLevel', verifyToken, requireRole('teacher', 'system_admin'), async (req, res) => {
  try {
    const classLevel = req.params.classLevel;
    const students = await pool.query(
      `SELECT u.id, u.full_name, u.username,
              COUNT(DISTINCT ea.id) FILTER (WHERE ea.status != 'in_progress') AS exams_taken,
              AVG(ea.score/NULLIF(ea.max_score,0)) FILTER (WHERE ea.status != 'in_progress') AS avg_ratio,
              COUNT(DISTINCT sa.id) FILTER (WHERE sa.status = 'completed') AS sims_completed
       FROM users u
       LEFT JOIN exam_attempts ea ON ea.user_id = u.id
       LEFT JOIN simulation_attempts sa ON sa.user_id = u.id
       WHERE u.role = 'student' AND u.class_level = $1
       GROUP BY u.id ORDER BY u.full_name`,
      [classLevel]
    );

    const weakestChapters = await pool.query(
      `SELECT c.id, c.title_bn, c.title_en, AVG(ea.score/NULLIF(ea.max_score,0)) AS avg_ratio, COUNT(*) AS attempts
       FROM exam_attempts ea
       JOIN users u ON u.id = ea.user_id
       CROSS JOIN LATERAL jsonb_array_elements_text(ea.chapter_ids) AS ch(chapter_id)
       JOIN chapters c ON c.id = ch.chapter_id::int
       WHERE u.class_level = $1 AND ea.status != 'in_progress'
       GROUP BY c.id ORDER BY avg_ratio ASC LIMIT 5`,
      [classLevel]
    );

    res.json({ students: students.rows, weakestChapters: weakestChapters.rows });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// FR-5.6 — guardian weekly summary of a linked (confirmed) child
router.get('/guardian/student/:studentId', verifyToken, requireRole('guardian'), async (req, res) => {
  try {
    const link = await pool.query(
      'SELECT * FROM guardian_links WHERE guardian_user_id = $1 AND student_user_id = $2 AND confirmed = true',
      [req.user.userId, req.params.studentId]
    );
    if (!link.rows.length) return res.status(403).json({ message: 'No confirmed link to this student' });

    const weekly = await pool.query(
      `SELECT
         (SELECT COUNT(*) FROM simulation_attempts WHERE user_id = $1 AND started_at > now() - interval '7 days') AS simulations,
         (SELECT COUNT(*) FROM exam_attempts WHERE user_id = $1 AND started_at > now() - interval '7 days' AND status != 'in_progress') AS exams,
         (SELECT AVG(score/NULLIF(max_score,0)) FROM exam_attempts WHERE user_id = $1 AND started_at > now() - interval '7 days' AND status != 'in_progress') AS avg_ratio,
         (SELECT COALESCE(SUM(duration_seconds),0) FROM simulation_attempts WHERE user_id = $1 AND started_at > now() - interval '7 days') AS study_seconds`,
      [req.params.studentId]
    );
    res.json(weekly.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// FR-5.7 — opt-in leaderboard, privacy-respecting
router.get('/leaderboard/:classLevel', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT full_name, points FROM users
       WHERE role = 'student' AND class_level = $1 AND leaderboard_opt_in = true
       ORDER BY points DESC LIMIT 20`,
      [req.params.classLevel]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
