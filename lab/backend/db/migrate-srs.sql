-- SRS_Lab_Learning_Platform migration — additive, idempotent.
-- Applied by db/setup.js after schema.sql. Safe to run repeatedly.

-- ── Books (FR-5) ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS books (
  id SERIAL PRIMARY KEY,
  subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  class_level SMALLINT NOT NULL CHECK (class_level BETWEEN 6 AND 12),
  title_bn VARCHAR(200) NOT NULL,
  title_en VARCHAR(200) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  original_name VARCHAR(300),
  page_count INTEGER,
  size_bytes BIGINT,
  status VARCHAR(20) NOT NULL DEFAULT 'published' CHECK (status IN ('draft','review','published')),
  uploaded_by INTEGER REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Topics (FR-6.1, Chapter → Topic) ────────────────────────────
CREATE TABLE IF NOT EXISTS topics (
  id SERIAL PRIMARY KEY,
  chapter_id INTEGER NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  title_bn VARCHAR(300) NOT NULL,
  title_en VARCHAR(300) NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'published' CHECK (status IN ('draft','review','published')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Reading progress (FR-5.4) ───────────────────────────────────
CREATE TABLE IF NOT EXISTS reading_progress (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  last_page INTEGER NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, book_id)
);

-- ── Safety equipment (FR-8.1) ───────────────────────────────────
CREATE TABLE IF NOT EXISTS safety_equipment (
  id SERIAL PRIMARY KEY,
  key VARCHAR(50) UNIQUE NOT NULL,
  name_bn VARCHAR(120) NOT NULL,
  name_en VARCHAR(120) NOT NULL,
  icon VARCHAR(10) NOT NULL DEFAULT '🧪'
);

CREATE TABLE IF NOT EXISTS lab_safety_requirements (
  id SERIAL PRIMARY KEY,
  simulation_id INTEGER NOT NULL REFERENCES simulations(id) ON DELETE CASCADE,
  equipment_id INTEGER NOT NULL REFERENCES safety_equipment(id) ON DELETE CASCADE,
  required BOOLEAN NOT NULL DEFAULT true,
  UNIQUE (simulation_id, equipment_id)
);

-- ── Creative Questions (FR-3.2) ─────────────────────────────────
CREATE TABLE IF NOT EXISTS cq_questions (
  id SERIAL PRIMARY KEY,
  chapter_id INTEGER NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  topic_id INTEGER REFERENCES topics(id) ON DELETE SET NULL,
  stimulus_bn TEXT NOT NULL,
  stimulus_en TEXT NOT NULL,
  parts JSONB NOT NULL DEFAULT '[]', -- [{level:'knowledge'|'comprehension'|'application'|'higher', question_bn, question_en, model_answer_bn, model_answer_en, marks}]
  difficulty VARCHAR(10) NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('basic','medium','advanced')),
  status VARCHAR(20) NOT NULL DEFAULT 'published' CHECK (status IN ('draft','review','published')),
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Book analysis jobs (FR-6, async LLM pipeline) ───────────────
CREATE TABLE IF NOT EXISTS book_analysis_jobs (
  id SERIAL PRIMARY KEY,
  book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','extracting','generating','ready','failed')),
  progress JSONB NOT NULL DEFAULT '{}', -- {phase, pagesDone, pagesTotal, chaptersDone, message}
  error TEXT,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Password resets (FR-1.2) ────────────────────────────────────
CREATE TABLE IF NOT EXISTS password_resets (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(80) UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Column additions to existing tables ─────────────────────────
ALTER TABLE chapters             ADD COLUMN IF NOT EXISTS book_id INTEGER REFERENCES books(id) ON DELETE SET NULL;
ALTER TABLE questions            ADD COLUMN IF NOT EXISTS topic_id INTEGER REFERENCES topics(id) ON DELETE SET NULL;
ALTER TABLE simulations          ADD COLUMN IF NOT EXISTS topic_id INTEGER REFERENCES topics(id) ON DELETE SET NULL;
ALTER TABLE simulations          ADD COLUMN IF NOT EXISTS order_index INTEGER NOT NULL DEFAULT 0;
ALTER TABLE simulation_attempts  ADD COLUMN IF NOT EXISTS safety_selection JSONB NOT NULL DEFAULT '[]';
ALTER TABLE simulation_attempts  ADD COLUMN IF NOT EXISTS safety_passed BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE exam_attempts        ADD COLUMN IF NOT EXISTS level_breakdown JSONB NOT NULL DEFAULT '{}';

-- ── Difficulty standardization: easy→basic, hard→advanced (FR-4.1) ──
-- Safe on fresh DBs (no rows yet) and on existing DBs (remaps legacy values).
ALTER TABLE questions DROP CONSTRAINT IF EXISTS questions_difficulty_check;
UPDATE questions SET difficulty = 'basic'    WHERE difficulty = 'easy';
UPDATE questions SET difficulty = 'advanced' WHERE difficulty = 'hard';
ALTER TABLE questions ADD CONSTRAINT questions_difficulty_check CHECK (difficulty IN ('basic','medium','advanced'));

-- ── Indexes ─────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_topics_chapter ON topics(chapter_id);
CREATE INDEX IF NOT EXISTS idx_books_subject_class ON books(subject_id, class_level);
CREATE INDEX IF NOT EXISTS idx_cq_questions_chapter ON cq_questions(chapter_id);
CREATE INDEX IF NOT EXISTS idx_reading_progress_user ON reading_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_lab_safety_sim ON lab_safety_requirements(simulation_id);
CREATE INDEX IF NOT EXISTS idx_analysis_jobs_book ON book_analysis_jobs(book_id);
