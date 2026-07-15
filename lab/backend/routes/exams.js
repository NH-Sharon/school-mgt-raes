const express = require('express');
const pool = require('../config/database');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = express.Router();

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function publicQuestion(q) {
  // Security NFR: never send correct_answers/explanations while the exam is in progress
  return {
    id: q.id,
    chapterId: q.chapter_id,
    questionBn: q.question_bn,
    questionEn: q.question_en,
    options: q.options,
    questionType: q.question_type,
    difficulty: q.difficulty,
  };
}

// FR-4.2/4.3 — start exam: configurable count/timer/negative-marking/difficulty, randomized bank
router.post('/start', verifyToken, async (req, res) => {
  try {
    const {
      chapterIds, examMode = 'exam', numQuestions = 25,
      timeLimitSec = 1500, negativeMarking = false, difficultyMix = null, assignmentId = null,
    } = req.body;
    if (!Array.isArray(chapterIds) || !chapterIds.length) {
      return res.status(400).json({ message: 'chapterIds is required' });
    }

    const bank = await pool.query(
      `SELECT * FROM questions WHERE chapter_id = ANY($1::int[]) AND status = 'published'`,
      [chapterIds]
    );
    if (!bank.rows.length) return res.status(404).json({ message: 'No published questions for these chapters yet' });

    let pool_ = bank.rows;
    if (difficultyMix && typeof difficultyMix === 'object') {
      const picked = [];
      for (const [level, count] of Object.entries(difficultyMix)) {
        picked.push(...shuffle(bank.rows.filter(q => q.difficulty === level)).slice(0, count));
      }
      pool_ = picked.length ? picked : bank.rows;
    }
    const selected = shuffle(pool_).slice(0, Math.min(numQuestions, pool_.length));
    const questionsServed = selected.map(q => q.id);

    const result = await pool.query(
      `INSERT INTO exam_attempts (user_id, chapter_ids, exam_mode, config, questions_served, assignment_id)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [
        req.user.userId, JSON.stringify(chapterIds), examMode,
        JSON.stringify({ numQuestions: selected.length, timeLimitSec, negativeMarking, difficultyMix }),
        JSON.stringify(questionsServed), assignmentId,
      ]
    );

    res.status(201).json({
      attempt: result.rows[0],
      questions: selected.map(publicQuestion),
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Resume an in-progress attempt (Reliability NFR: remaining time preserved)
router.get('/:attemptId', verifyToken, async (req, res) => {
  try {
    const attempt = await pool.query('SELECT * FROM exam_attempts WHERE id = $1 AND user_id = $2', [req.params.attemptId, req.user.userId]);
    if (!attempt.rows.length) return res.status(404).json({ message: 'Attempt not found' });
    const a = attempt.rows[0];
    const questions = await pool.query('SELECT * FROM questions WHERE id = ANY($1::int[])', [a.questions_served]);
    const byId = Object.fromEntries(questions.rows.map(q => [q.id, q]));
    const orderedQuestions = a.questions_served.map(id => byId[id]).filter(Boolean);

    if (a.status === 'in_progress') {
      const elapsed = Math.round((Date.now() - new Date(a.started_at).getTime()) / 1000);
      const remainingSec = Math.max(0, (a.config.timeLimitSec || 0) - elapsed);
      return res.json({ attempt: a, remainingSec, questions: orderedQuestions.map(publicQuestion) });
    }
    // Submitted: reveal correct answers + explanations for review
    return res.json({
      attempt: a,
      questions: orderedQuestions.map(q => ({
        ...publicQuestion(q),
        correctAnswers: q.correct_answers,
        explanationBn: q.explanation_bn,
        explanationEn: q.explanation_en,
        chosen: a.answers[q.id] || [],
      })),
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Auto-save an answer as the student works (FR-4.4 navigation between questions)
router.put('/:attemptId/answer', verifyToken, async (req, res) => {
  try {
    const { questionId, chosenOptionIds, timeSpentSec } = req.body;
    const attempt = await pool.query('SELECT answers, time_per_question FROM exam_attempts WHERE id = $1 AND user_id = $2 AND status = $3', [req.params.attemptId, req.user.userId, 'in_progress']);
    if (!attempt.rows.length) return res.status(404).json({ message: 'Attempt not found or already submitted' });
    const answers = { ...attempt.rows[0].answers, [questionId]: chosenOptionIds };
    const timePerQuestion = { ...attempt.rows[0].time_per_question, [questionId]: timeSpentSec };
    const result = await pool.query(
      'UPDATE exam_attempts SET answers = $1, time_per_question = $2 WHERE id = $3 RETURNING *',
      [JSON.stringify(answers), JSON.stringify(timePerQuestion), req.params.attemptId]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// FR-4.5 — submit (or timeout) -> instant score + correct answers + explanations
router.post('/:attemptId/submit', verifyToken, async (req, res) => {
  try {
    const { answers: finalAnswers, timedOut = false } = req.body;
    const attempt = await pool.query('SELECT * FROM exam_attempts WHERE id = $1 AND user_id = $2', [req.params.attemptId, req.user.userId]);
    if (!attempt.rows.length) return res.status(404).json({ message: 'Attempt not found' });
    const a = attempt.rows[0];
    if (a.status !== 'in_progress') return res.status(409).json({ message: 'Already submitted' });

    const answers = finalAnswers || a.answers;
    const questions = await pool.query('SELECT * FROM questions WHERE id = ANY($1::int[])', [a.questions_served]);
    const byId = Object.fromEntries(questions.rows.map(q => [q.id, q]));

    const negativeMarking = a.config.negativeMarking;
    let score = 0;
    const maxScore = a.questions_served.length;
    for (const qid of a.questions_served) {
      const q = byId[qid];
      if (!q) continue;
      const chosen = (answers[qid] || []).slice().sort();
      const correct = (q.correct_answers || []).slice().sort();
      const isCorrect = chosen.length === correct.length && chosen.every((v, i) => v === correct[i]);
      if (isCorrect) score += 1;
      else if (chosen.length > 0 && negativeMarking) score -= 0.25;
    }

    const result = await pool.query(
      `UPDATE exam_attempts SET answers = $1, score = $2, max_score = $3, submitted_at = now(),
         status = $4 WHERE id = $5 RETURNING *`,
      [JSON.stringify(answers), score, maxScore, timedOut ? 'timed_out' : 'submitted', req.params.attemptId]
    );

    // FR-5.4 — award a badge for a strong score
    if (maxScore > 0 && score / maxScore >= 0.9) {
      const badge = await pool.query("SELECT id FROM badges WHERE key = 'high_scorer'");
      if (badge.rows.length) {
        await pool.query('INSERT INTO user_badges (user_id, badge_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [req.user.userId, badge.rows[0].id]);
      }
    }

    res.json({
      attempt: result.rows[0],
      review: a.questions_served.map(qid => ({
        ...publicQuestion(byId[qid]),
        correctAnswers: byId[qid].correct_answers,
        explanationBn: byId[qid].explanation_bn,
        explanationEn: byId[qid].explanation_en,
        chosen: answers[qid] || [],
      })),
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/history/mine', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, chapter_ids, exam_mode, score, max_score, started_at, submitted_at, status
       FROM exam_attempts WHERE user_id = $1 AND status != 'in_progress' ORDER BY started_at DESC LIMIT 100`,
      [req.user.userId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// FR-4.6 — identify weak chapters automatically
router.get('/weak-chapters/mine', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT jsonb_array_elements_text(chapter_ids)::int AS chapter_id,
              AVG(score / NULLIF(max_score,0)) AS avg_ratio, COUNT(*) AS attempts
       FROM exam_attempts
       WHERE user_id = $1 AND status != 'in_progress'
       GROUP BY chapter_id
       HAVING AVG(score / NULLIF(max_score,0)) < 0.6
       ORDER BY avg_ratio ASC`,
      [req.user.userId]
    );
    const chapterIds = result.rows.map(r => r.chapter_id);
    const chapters = chapterIds.length
      ? await pool.query('SELECT id, title_bn, title_en, subject_id FROM chapters WHERE id = ANY($1::int[])', [chapterIds])
      : { rows: [] };
    const chapterById = Object.fromEntries(chapters.rows.map(c => [c.id, c]));
    res.json(result.rows.map(r => ({ ...r, chapter: chapterById[r.chapter_id] })));
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// FR-4.9 — teacher creates & assigns a custom exam
router.post('/assignments', verifyToken, requireRole('teacher'), async (req, res) => {
  try {
    const { titleBn, titleEn, classLevel, chapterIds, config, dueAt } = req.body;
    const result = await pool.query(
      `INSERT INTO exam_assignments (teacher_user_id, title_bn, title_en, class_level, chapter_ids, config, due_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [req.user.userId, titleBn, titleEn, classLevel, JSON.stringify(chapterIds), JSON.stringify(config || {}), dueAt || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/assignments/for-my-class', verifyToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM exam_assignments WHERE class_level = $1 ORDER BY created_at DESC', [req.user.classLevel]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
