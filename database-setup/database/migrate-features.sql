-- Migration for feature roadmap items #1-6, #8-10 (2026-08-20)
-- Safe to run against an existing database — every statement is idempotent.

-- #1 Parent portal — links a 'parent' role user account to their child(ren)
CREATE TABLE IF NOT EXISTS guardian_students (
    id SERIAL PRIMARY KEY,
    guardian_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(guardian_user_id, student_id)
);

-- #2 Self-service password reset (dev returns the token directly, mirrors lab/'s pattern)
CREATE TABLE IF NOT EXISTS password_resets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(80) UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- #6 Structured fee plans — per-class fee types that auto-generate monthly dues
CREATE TABLE IF NOT EXISTS fee_structures (
    id SERIAL PRIMARY KEY,
    class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
    fee_type VARCHAR(100) NOT NULL,
    amount NUMERIC(10,2) NOT NULL,
    recurrence VARCHAR(20) NOT NULL DEFAULT 'monthly' CHECK (recurrence IN ('monthly', 'one_time', 'yearly')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- #9 Formal class + subject -> teacher assignment
CREATE TABLE IF NOT EXISTS class_subject_teachers (
    id SERIAL PRIMARY KEY,
    class_id INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    teacher_id INTEGER NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(class_id, subject_id)
);

-- #10 Exam seat plan
CREATE TABLE IF NOT EXISTS exam_seat_plans (
    id SERIAL PRIMARY KEY,
    exam_id INTEGER NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    room VARCHAR(50) NOT NULL,
    seat_number INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(exam_id, student_id)
);

-- #5 Audit log for admin write actions
CREATE TABLE IF NOT EXISTS audit_log (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    username VARCHAR(100),
    action VARCHAR(20) NOT NULL,
    entity VARCHAR(50) NOT NULL,
    entity_id VARCHAR(50),
    details JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- #3 File uploads — student photo / homework attachment now store a real uploaded file's path
CREATE TABLE IF NOT EXISTS uploads (
    id SERIAL PRIMARY KEY,
    original_name VARCHAR(255),
    stored_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100),
    size_bytes INTEGER,
    uploaded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
