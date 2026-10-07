-- BdVirtualLab database schema
-- Run against a fresh Postgres database, e.g.: psql -d bdvirtuallab -f schema.sql

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(150),
  mobile VARCHAR(30),
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('student','teacher','guardian','content_admin','system_admin')),
  full_name VARCHAR(150) NOT NULL,
  medium VARCHAR(10) NOT NULL DEFAULT 'bn' CHECK (medium IN ('bn','en')),
  class_level SMALLINT CHECK (class_level BETWEEN 6 AND 12),
  institution VARCHAR(200),
  points INTEGER NOT NULL DEFAULT 0,
  streak_days INTEGER NOT NULL DEFAULT 0,
  last_active_date DATE,
  leaderboard_opt_in BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS guardian_links (
  id SERIAL PRIMARY KEY,
  guardian_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  student_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  confirmed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (guardian_user_id, student_user_id)
);

CREATE TABLE IF NOT EXISTS subjects (
  id SERIAL PRIMARY KEY,
  code VARCHAR(20) UNIQUE NOT NULL,
  name_bn VARCHAR(100) NOT NULL,
  name_en VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS chapters (
  id SERIAL PRIMARY KEY,
  subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  class_level SMALLINT NOT NULL CHECK (class_level BETWEEN 6 AND 12),
  title_bn VARCHAR(200) NOT NULL,
  title_en VARCHAR(200) NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  syllabus_year INTEGER NOT NULL DEFAULT 2026,
  status VARCHAR(20) NOT NULL DEFAULT 'published' CHECK (status IN ('draft','review','published')),
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS learning_content (
  id SERIAL PRIMARY KEY,
  chapter_id INTEGER NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  content_type VARCHAR(20) NOT NULL CHECK (content_type IN ('notes','diagram','video','formula','glossary')),
  title_bn VARCHAR(200),
  title_en VARCHAR(200),
  body_bn TEXT,
  body_en TEXT,
  media_url VARCHAR(500),
  order_index INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'published' CHECK (status IN ('draft','review','published')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS chapter_progress (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  chapter_id INTEGER NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  percent_complete SMALLINT NOT NULL DEFAULT 0,
  bookmarked BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  last_position VARCHAR(100),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, chapter_id)
);

CREATE TABLE IF NOT EXISTS simulations (
  id SERIAL PRIMARY KEY,
  chapter_id INTEGER NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  key VARCHAR(50) UNIQUE NOT NULL,
  title_bn VARCHAR(200) NOT NULL,
  title_en VARCHAR(200) NOT NULL,
  supports_guided BOOLEAN NOT NULL DEFAULT true,
  supports_free BOOLEAN NOT NULL DEFAULT true,
  config JSONB NOT NULL DEFAULT '{}',
  status VARCHAR(20) NOT NULL DEFAULT 'published' CHECK (status IN ('draft','review','published'))
);

CREATE TABLE IF NOT EXISTS simulation_attempts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  simulation_id INTEGER NOT NULL REFERENCES simulations(id) ON DELETE CASCADE,
  mode VARCHAR(10) NOT NULL DEFAULT 'guided' CHECK (mode IN ('guided','free')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  steps JSONB NOT NULL DEFAULT '[]',
  mistakes INTEGER NOT NULL DEFAULT 0,
  hints_used INTEGER NOT NULL DEFAULT 0,
  observation_data JSONB NOT NULL DEFAULT '{}',
  result_summary TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress','completed'))
);

CREATE TABLE IF NOT EXISTS questions (
  id SERIAL PRIMARY KEY,
  chapter_id INTEGER NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  question_bn TEXT NOT NULL,
  question_en TEXT NOT NULL,
  options JSONB NOT NULL, -- [{id:'a', bn:'..', en:'..'}, ...]
  correct_answers JSONB NOT NULL, -- ['a'] or ['a','c'] for multiple-completion
  question_type VARCHAR(20) NOT NULL DEFAULT 'single' CHECK (question_type IN ('single','multiple')),
  explanation_bn TEXT,
  explanation_en TEXT,
  difficulty VARCHAR(10) NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('basic','medium','advanced')),
  status VARCHAR(20) NOT NULL DEFAULT 'published' CHECK (status IN ('draft','review','published')),
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS exam_assignments (
  id SERIAL PRIMARY KEY,
  teacher_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title_bn VARCHAR(200) NOT NULL,
  title_en VARCHAR(200) NOT NULL,
  class_level SMALLINT NOT NULL,
  chapter_ids JSONB NOT NULL,
  config JSONB NOT NULL DEFAULT '{}',
  due_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS exam_attempts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  chapter_ids JSONB NOT NULL, -- supports single-chapter or model tests across many
  exam_mode VARCHAR(10) NOT NULL DEFAULT 'exam' CHECK (exam_mode IN ('practice','exam')),
  config JSONB NOT NULL DEFAULT '{}', -- {numQuestions, timeLimitSec, negativeMarking, difficultyMix}
  questions_served JSONB NOT NULL, -- ordered array of question ids
  answers JSONB NOT NULL DEFAULT '{}', -- {questionId: [chosenOptionIds]}
  time_per_question JSONB NOT NULL DEFAULT '{}',
  score NUMERIC(6,2),
  max_score NUMERIC(6,2),
  assignment_id INTEGER REFERENCES exam_assignments(id), -- set when started from a teacher-assigned exam
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  submitted_at TIMESTAMPTZ,
  status VARCHAR(20) NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress','submitted','timed_out'))
);

CREATE TABLE IF NOT EXISTS badges (
  id SERIAL PRIMARY KEY,
  key VARCHAR(50) UNIQUE NOT NULL,
  title_bn VARCHAR(150) NOT NULL,
  title_en VARCHAR(150) NOT NULL,
  icon VARCHAR(10) NOT NULL DEFAULT '🏅',
  criteria VARCHAR(200)
);

CREATE TABLE IF NOT EXISTS user_badges (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_id INTEGER NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, badge_id)
);

CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(30) NOT NULL,
  message_bn VARCHAR(300) NOT NULL,
  message_en VARCHAR(300) NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS announcements (
  id SERIAL PRIMARY KEY,
  teacher_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  class_level SMALLINT,
  subject_id INTEGER REFERENCES subjects(id),
  message_bn VARCHAR(500) NOT NULL,
  message_en VARCHAR(500) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS content_audit_log (
  id SERIAL PRIMARY KEY,
  entity_type VARCHAR(30) NOT NULL, -- 'chapter' | 'learning_content' | 'simulation' | 'question'
  entity_id INTEGER NOT NULL,
  action VARCHAR(20) NOT NULL, -- 'create' | 'update' | 'publish' | 'delete'
  user_id INTEGER REFERENCES users(id),
  snapshot JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chapters_subject_class ON chapters(subject_id, class_level);
CREATE INDEX IF NOT EXISTS idx_learning_content_chapter ON learning_content(chapter_id);
CREATE INDEX IF NOT EXISTS idx_questions_chapter ON questions(chapter_id);
CREATE INDEX IF NOT EXISTS idx_simulation_attempts_user ON simulation_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_exam_attempts_user ON exam_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_chapter_progress_user ON chapter_progress(user_id);
