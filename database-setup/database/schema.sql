-- Drop existing database and recreate
-- Run: sudo -u postgres psql -c "DROP DATABASE IF EXISTS school_management;"
-- Then run this script

-- Create database (run separately if needed)
-- CREATE DATABASE school_management;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100),
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'teacher', 'student', 'parent')),
    full_name VARCHAR(150),
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Students table
CREATE TABLE IF NOT EXISTS students (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    student_id VARCHAR(20) UNIQUE NOT NULL,
    name_bn VARCHAR(100) NOT NULL,
    name_en VARCHAR(100) NOT NULL,
    father_name VARCHAR(100) NOT NULL,
    mother_name VARCHAR(100) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender VARCHAR(10) NOT NULL,
    blood_group VARCHAR(5),
    phone VARCHAR(15),
    address TEXT,
    class_id INTEGER,
    section VARCHAR(10),
    roll_number INTEGER,
    admission_date DATE DEFAULT CURRENT_DATE,
    status VARCHAR(20) DEFAULT 'active'
);

-- Teachers table
CREATE TABLE IF NOT EXISTS teachers (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    teacher_id VARCHAR(20) UNIQUE NOT NULL,
    name_bn VARCHAR(100) NOT NULL,
    name_en VARCHAR(100) NOT NULL,
    designation VARCHAR(50),
    subject VARCHAR(50),
    phone VARCHAR(15),
    email VARCHAR(100),
    address TEXT,
    joining_date DATE DEFAULT CURRENT_DATE,
    salary DECIMAL(10,2),
    status VARCHAR(20) DEFAULT 'active'
);

-- Classes table
CREATE TABLE IF NOT EXISTS classes (
    id SERIAL PRIMARY KEY,
    class_name VARCHAR(50) NOT NULL,
    class_name_bn VARCHAR(50) NOT NULL,
    section VARCHAR(10),
    class_teacher_id INTEGER REFERENCES teachers(id),
    room_number VARCHAR(20),
    capacity INTEGER DEFAULT 40
);

-- Subjects table
CREATE TABLE IF NOT EXISTS subjects (
    id SERIAL PRIMARY KEY,
    subject_name VARCHAR(100) NOT NULL,
    subject_name_bn VARCHAR(100) NOT NULL,
    subject_code VARCHAR(20) UNIQUE,
    class_id INTEGER REFERENCES classes(id)
);

-- Attendance table
CREATE TABLE IF NOT EXISTS attendance (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id),
    class_id INTEGER REFERENCES classes(id),
    date DATE NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('present', 'absent', 'late')),
    remarks TEXT,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, date)
);

-- Exams table
CREATE TABLE IF NOT EXISTS exams (
    id SERIAL PRIMARY KEY,
    exam_name VARCHAR(100) NOT NULL,
    exam_name_bn VARCHAR(100) NOT NULL,
    exam_type VARCHAR(50) NOT NULL,
    class_id INTEGER REFERENCES classes(id),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_marks INTEGER DEFAULT 100,
    pass_marks INTEGER DEFAULT 40,
    status VARCHAR(20) DEFAULT 'scheduled'
);

-- Exam results table
CREATE TABLE IF NOT EXISTS exam_results (
    id SERIAL PRIMARY KEY,
    exam_id INTEGER REFERENCES exams(id),
    student_id INTEGER REFERENCES students(id),
    subject_id INTEGER REFERENCES subjects(id),
    marks_obtained DECIMAL(5,2),
    grade VARCHAR(5),
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id),
    payment_type VARCHAR(50) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_date DATE DEFAULT CURRENT_DATE,
    due_date DATE,
    status VARCHAR(20) DEFAULT 'pending',
    payment_method VARCHAR(50),
    transaction_id VARCHAR(100),
    remarks TEXT
);

-- Homework table
CREATE TABLE IF NOT EXISTS homework (
    id SERIAL PRIMARY KEY,
    class_id INTEGER REFERENCES classes(id),
    subject_id INTEGER REFERENCES subjects(id),
    teacher_id INTEGER REFERENCES teachers(id),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    assigned_date DATE DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    attachment_url VARCHAR(500),
    status VARCHAR(20) DEFAULT 'active'
);

-- Homework submissions table
CREATE TABLE IF NOT EXISTS homework_submissions (
    id SERIAL PRIMARY KEY,
    homework_id INTEGER REFERENCES homework(id),
    student_id INTEGER REFERENCES students(id),
    submission_text TEXT,
    attachment_url VARCHAR(500),
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    marks DECIMAL(5,2),
    feedback TEXT,
    status VARCHAR(20) DEFAULT 'submitted'
);

-- Transport table
CREATE TABLE IF NOT EXISTS transport (
    id SERIAL PRIMARY KEY,
    route_name VARCHAR(100) NOT NULL,
    route_name_bn VARCHAR(100) NOT NULL,
    driver_name VARCHAR(100),
    driver_phone VARCHAR(15),
    vehicle_number VARCHAR(20),
    capacity INTEGER DEFAULT 30,
    monthly_fee DECIMAL(8,2),
    status VARCHAR(20) DEFAULT 'active'
);

-- Student transport table
CREATE TABLE IF NOT EXISTS student_transport (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id),
    transport_id INTEGER REFERENCES transport(id),
    pickup_point VARCHAR(200),
    monthly_fee DECIMAL(8,2),
    start_date DATE DEFAULT CURRENT_DATE,
    status VARCHAR(20) DEFAULT 'active'
);

-- =============================================
-- Sample Data for Rowshon Amir Elementary School
-- =============================================

-- Admin & Teacher users (password: "password")
INSERT INTO users (username, email, password, role) VALUES
('admin', 'admin@rowshonamir.edu.bd', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin'),
('karim_sir', 'karim@rowshonamir.edu.bd', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'teacher'),
('fatima_mam', 'fatima@rowshonamir.edu.bd', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'teacher'),
('teacher1', 'teacher1@rowshonamir.edu.bd', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'teacher'),
('student1', 'student1@rowshonamir.edu.bd', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student')
ON CONFLICT (username) DO NOTHING;

-- Teachers
INSERT INTO teachers (teacher_id, name_bn, name_en, designation, subject, phone, email, salary) VALUES
('T001', 'আব্দুল করিম', 'Abdul Karim', 'প্রধান শিক্ষক', 'বাংলা', '01711000001', 'karim@rowshonamir.edu.bd', 30000),
('T002', 'ফাতেমা বেগম', 'Fatema Begum', 'সহকারী শিক্ষক', 'গণিত', '01711000002', 'fatima@rowshonamir.edu.bd', 22000),
('T003', 'রহিমা খাতুন', 'Rahima Khatun', 'সহকারী শিক্ষক', 'ইংরেজি', '01711000003', 'rahima@rowshonamir.edu.bd', 22000),
('T004', 'মোহাম্মদ হাসান', 'Mohammad Hasan', 'সহকারী শিক্ষক', 'বিজ্ঞান', '01711000004', 'hasan@rowshonamir.edu.bd', 22000),
('T005', 'নাজমা আক্তার', 'Najma Akter', 'সহকারী শিক্ষক', 'সমাজ বিজ্ঞান', '01711000005', 'najma@rowshonamir.edu.bd', 20000)
ON CONFLICT (teacher_id) DO NOTHING;

-- Classes (Primary school - Class 1 to 5)
INSERT INTO classes (class_name, class_name_bn, section, room_number, capacity) VALUES
('Class 1', 'প্রথম শ্রেণী', 'ক', '১০১', 40),
('Class 1', 'প্রথম শ্রেণী', 'খ', '১০২', 40),
('Class 2', 'দ্বিতীয় শ্রেণী', 'ক', '২০১', 40),
('Class 2', 'দ্বিতীয় শ্রেণী', 'খ', '২০২', 40),
('Class 3', 'তৃতীয় শ্রেণী', 'ক', '৩০১', 40),
('Class 4', 'চতুর্থ শ্রেণী', 'ক', '৪০১', 40),
('Class 5', 'পঞ্চম শ্রেণী', 'ক', '৫০১', 40);

-- Sample Students
INSERT INTO students (student_id, name_bn, name_en, father_name, mother_name, date_of_birth, gender, blood_group, phone, address, class_id, section, roll_number) VALUES
('S2024001', 'রাহেলা বেগম', 'Rahela Begum', 'আব্দুর রহমান', 'সুফিয়া বেগম', '2017-03-15', 'female', 'A+', '01811000001', 'ঢাকা, বাংলাদেশ', 1, 'ক', 1),
('S2024002', 'মোহাম্মদ রাফি', 'Mohammad Rafi', 'করিম উদ্দিন', 'রোকেয়া বেগম', '2017-05-20', 'male', 'B+', '01811000002', 'ঢাকা, বাংলাদেশ', 1, 'ক', 2),
('S2024003', 'তানজিলা আক্তার', 'Tanzila Akter', 'নূরুল ইসলাম', 'লায়লা বেগম', '2016-08-10', 'female', 'O+', '01811000003', 'ঢাকা, বাংলাদেশ', 2, 'ক', 1),
('S2024004', 'আরিফ হোসেন', 'Arif Hossain', 'রফিকুল ইসলাম', 'জরিনা বেগম', '2016-12-25', 'male', 'AB+', '01811000004', 'ঢাকা, বাংলাদেশ', 2, 'ক', 2),
('S2024005', 'সানজিদা ইসলাম', 'Sanjida Islam', 'শাহজাহান', 'মরিয়ম বেগম', '2015-04-07', 'female', 'B-', '01811000005', 'ঢাকা, বাংলাদেশ', 3, 'ক', 1),
('S2024006', 'তাহমিদ হাসান', 'Tahmid Hasan', 'মাহবুব হোসেন', 'শেফালি বেগম', '2015-09-18', 'male', 'O-', '01811000006', 'ঢাকা, বাংলাদেশ', 3, 'ক', 2),
('S2024007', 'ফারহানা নাজনীন', 'Farhana Nazneen', 'আমিনুল ইসলাম', 'হাসিনা বেগম', '2014-01-30', 'female', 'A-', '01811000007', 'ঢাকা, বাংলাদেশ', 4, 'ক', 1)
ON CONFLICT (student_id) DO NOTHING;

-- Subjects
INSERT INTO subjects (subject_name, subject_name_bn, subject_code, class_id) VALUES
('Bangla', 'বাংলা', 'BAN-1', 1),
('English', 'ইংরেজি', 'ENG-1', 1),
('Mathematics', 'গণিত', 'MAT-1', 1),
('General Knowledge', 'সাধারণ জ্ঞান', 'GK-1', 1),
('Bangla', 'বাংলা', 'BAN-2', 2),
('English', 'ইংরেজি', 'ENG-2', 2),
('Mathematics', 'গণিত', 'MAT-2', 2),
('Science', 'বিজ্ঞান', 'SCI-2', 2)
ON CONFLICT (subject_code) DO NOTHING;

-- Transport routes
INSERT INTO transport (route_name, route_name_bn, driver_name, driver_phone, vehicle_number, capacity, monthly_fee) VALUES
('North Route', 'উত্তর রুট', 'হারুন মিয়া', '01911000001', 'ঢাকা-মেট্রো-১২৩৪', 30, 500),
('South Route', 'দক্ষিণ রুট', 'জামাল উদ্দিন', '01911000002', 'ঢাকা-মেট্রো-৫৬৭৮', 30, 500),
('East Route', 'পূর্ব রুট', 'সালাম মিয়া', '01911000003', 'ঢাকা-মেট্রো-৯০১২', 25, 400)
ON CONFLICT DO NOTHING;

-- Sample exams
INSERT INTO exams (exam_name, exam_name_bn, exam_type, class_id, start_date, end_date, total_marks, pass_marks, status) VALUES
('First Term Examination 2024', 'প্রথম সাময়িক পরীক্ষা ২০২৪', 'প্রথম সাময়িক', 1, '2024-04-01', '2024-04-10', 100, 40, 'completed'),
('Second Term Examination 2024', 'দ্বিতীয় সাময়িক পরীক্ষা ২০২৪', 'দ্বিতীয় সাময়িক', 1, '2024-08-15', '2024-08-25', 100, 40, 'completed'),
('Annual Examination 2024', 'বার্ষিক পরীক্ষা ২০২৪', 'বার্ষিক পরীক্ষা', 1, '2024-11-20', '2024-11-30', 100, 40, 'scheduled')
ON CONFLICT DO NOTHING;

-- Sample payments
INSERT INTO payments (student_id, payment_type, amount, payment_date, status, payment_method) VALUES
(1, 'মাসিক বেতন', 2000, CURRENT_DATE - 5, 'paid', 'নগদ'),
(2, 'মাসিক বেতন', 2000, CURRENT_DATE - 5, 'paid', 'বিকাশ'),
(3, 'মাসিক বেতন', 2000, CURRENT_DATE - 30, 'overdue', 'নগদ'),
(4, 'ভর্তি ফি', 5000, CURRENT_DATE - 60, 'paid', 'ব্যাংক ট্রান্সফার'),
(5, 'পরীক্ষার ফি', 500, CURRENT_DATE - 2, 'pending', NULL)
ON CONFLICT DO NOTHING;

-- =============================================
-- NEW TABLES FOR WEBSITE MANAGEMENT
-- =============================================

-- Public notices (for landing page)
CREATE TABLE IF NOT EXISTS public_notices (
    id SERIAL PRIMARY KEY,
    title_en VARCHAR(255) NOT NULL,
    title_bn VARCHAR(255) NOT NULL,
    content_en TEXT,
    content_bn TEXT,
    image_data TEXT,
    type VARCHAR(30) DEFAULT 'general',
    published BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Gallery
CREATE TABLE IF NOT EXISTS gallery (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255),
    image_data TEXT NOT NULL,
    category VARCHAR(50) DEFAULT 'general',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Website settings (key-value store)
CREATE TABLE IF NOT EXISTS website_settings (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Alter users table to add missing columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name VARCHAR(150);
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Default website settings
INSERT INTO website_settings (key, value) VALUES
('school_name_en', 'Rowshon Amir Elementary School'),
('school_name_bn', 'রওশন আমির প্রাথমিক বিদ্যালয়'),
('tagline_en', 'Nurturing Young Minds, Building Tomorrow''s Leaders'),
('tagline_bn', 'তরুণ মেধার বিকাশ, আগামীর নেতৃত্ব গঠন'),
('phone', '+880 1711-000001'),
('email', 'info@rowshonamir.edu.bd'),
('address_en', 'Mirpur, Dhaka, Bangladesh'),
('address_bn', 'মিরপুর, ঢাকা, বাংলাদেশ'),
('about_en', 'Rowshon Amir Elementary School has been the cornerstone of primary education in our community for four decades. We believe every child carries a unique potential — our role is to nurture it with care, discipline, and joy.'),
('about_bn', 'রওশন আমির প্রাথমিক বিদ্যালয় চার দশক ধরে আমাদের সমাজের প্রাথমিক শিক্ষার মূল ভিত্তি। আমরা বিশ্বাস করি প্রতিটি শিশুর মধ্যে অনন্য প্রতিভা আছে — আমাদের দায়িত্ব যত্ন, শৃঙ্খলা ও আনন্দের মাধ্যমে তা বিকশিত করা।'),
('est_year', '1985'),
('facebook_url', ''),
('office_hours_en', 'Sat – Thu: 8:00 AM – 4:00 PM'),
('office_hours_bn', 'শনি – বৃহস্পতি: সকাল ৮টা – বিকাল ৪টা')
ON CONFLICT (key) DO NOTHING;

-- Sample public notices
INSERT INTO public_notices (title_en, title_bn, content_en, content_bn, type, published) VALUES
('Annual Sports Day 2026', 'বার্ষিক ক্রীড়া দিবস ২০২৬', 'Annual Sports Day will be held on June 30, 2026. All students must attend in school uniform.', 'বার্ষিক ক্রীড়া দিবস ৩০ জুন ২০২৬ তারিখে অনুষ্ঠিত হবে। সকল শিক্ষার্থীকে স্কুল পোশাকে উপস্থিত থাকতে হবে।', 'event', true),
('Second Term Examination', 'দ্বিতীয় সাময়িক পরীক্ষা', 'Second Term Examination begins July 10. Routine available in the student portal.', 'দ্বিতীয় সাময়িক পরীক্ষা ১০ জুলাই থেকে শুরু। রুটিন শিক্ষার্থী পোর্টালে পাওয়া যাবে।', 'exam', true),
('Fee Payment Reminder', 'ফি পরিশোধের অনুরোধ', 'July monthly fees must be submitted by June 30. Late payments incur a 5% surcharge.', 'জুলাই মাসের বেতন ৩০ জুনের মধ্যে পরিশোধ করতে হবে। বিলম্বে ৫% অতিরিক্ত চার্জ প্রযোজ্য।', 'fee', false)
ON CONFLICT DO NOTHING;

-- Hero slides table
CREATE TABLE IF NOT EXISTS hero_slides (
    id SERIAL PRIMARY KEY,
    title_en VARCHAR(200),
    title_bn VARCHAR(200),
    subtitle_en VARCHAR(300),
    subtitle_bn VARCHAR(300),
    image_data TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- School events table
CREATE TABLE IF NOT EXISTS school_events (
    id SERIAL PRIMARY KEY,
    title_en VARCHAR(200) NOT NULL,
    title_bn VARCHAR(200),
    description_en TEXT,
    description_bn TEXT,
    event_date DATE NOT NULL,
    image_data TEXT,
    category VARCHAR(50) DEFAULT 'general',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Quick links table
CREATE TABLE IF NOT EXISTS quick_links (
    id SERIAL PRIMARY KEY,
    label_en VARCHAR(100) NOT NULL,
    label_bn VARCHAR(100),
    icon VARCHAR(10) DEFAULT '🔗',
    link_type VARCHAR(50) DEFAULT 'login',
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true
);

-- Additional website settings for principal info
INSERT INTO website_settings (key, value) VALUES
('principal_name_en', 'Md. Karim Hossain'),
('principal_name_bn', 'মোঃ করিম হোসেন'),
('principal_title_en', 'Principal, Rowshon Amir Elementary School'),
('principal_title_bn', 'প্রধান শিক্ষক, রওশন আমির প্রাথমিক বিদ্যালয়'),
('principal_message_en', 'Welcome to Rowshon Amir Elementary School. Our school is committed to providing quality education that nurtures the whole child — intellectually, morally, and socially. We believe every student has the potential to excel, and our dedicated teachers work tirelessly to unlock that potential. Together with parents and the community, we build a brighter future for every child entrusted to our care.'),
('principal_message_bn', 'রওশন আমির প্রাথমিক বিদ্যালয়ে আপনাকে স্বাগতম। আমাদের বিদ্যালয় প্রতিটি শিশুর সামগ্রিক বিকাশে — মেধায়, নৈতিকতায় ও সামাজিকতায় — গুণমানসম্পন্ন শিক্ষা প্রদানে প্রতিশ্রুতিবদ্ধ। প্রতিটি শিক্ষার্থীর মধ্যে সাফল্যের সম্ভাবনা আছে, আমাদের নিবেদিত শিক্ষকরা তা বিকশিত করতে অক্লান্ত পরিশ্রম করেন। অভিভাবক ও সমাজের সাথে মিলে আমরা প্রতিটি শিশুর উজ্জ্বল ভবিষ্যৎ গড়ে তুলছি।'),
('stat_students', '420'),
('stat_teachers', '32'),
('stat_years', '40'),
('stat_classes', '5'),
('mission_en', 'To provide inclusive, quality primary education that develops every child intellectually, morally, and socially — preparing them to be responsible citizens of Bangladesh.'),
('mission_bn', 'প্রতিটি শিশুকে মেধায়, নৈতিকতায় ও সামাজিকতায় বিকশিত করে মানসম্পন্ন প্রাথমিক শিক্ষা প্রদান করা — যাতে তারা বাংলাদেশের দায়িত্বশীল নাগরিক হয়ে উঠতে পারে।'),
('vision_en', 'To be the leading elementary school in Bangladesh, recognized for academic excellence, character development, and community service.'),
('vision_bn', 'একাডেমিক শ্রেষ্ঠত্ব, চরিত্র গঠন ও সমাজসেবার জন্য বাংলাদেশের শীর্ষস্থানীয় প্রাথমিক বিদ্যালয় হওয়া।')
ON CONFLICT (key) DO NOTHING;

-- Default quick links
INSERT INTO quick_links (label_en, label_bn, icon, link_type, sort_order) VALUES
('Admin Portal', 'অ্যাডমিন পোর্টাল', '🏛️', 'admin', 1),
('Teacher Portal', 'শিক্ষক পোর্টাল', '👨‍🏫', 'teacher', 2),
('Student Portal', 'শিক্ষার্থী পোর্টাল', '👨‍🎓', 'student', 3),
('Notice Board', 'নোটিশ বোর্ড', '📢', 'notice', 4),
('Gallery', 'গ্যালারি', '🖼️', 'gallery', 5),
('Contact Us', 'যোগাযোগ', '📞', 'contact', 6)
ON CONFLICT DO NOTHING;

-- Default hero slides (CSS gradient placeholders - no images)
INSERT INTO hero_slides (title_en, title_bn, subtitle_en, subtitle_bn, sort_order, is_active) VALUES
('Welcome to Rowshon Amir Elementary School', 'রওশন আমির প্রাথমিক বিদ্যালয়ে স্বাগতম', 'Nurturing Young Minds Since 1985', '১৯৮৫ সাল থেকে তরুণ মেধার বিকাশে', 1, true),
('Quality Education for Every Child', 'প্রতিটি শিশুর জন্য মানসম্পন্ন শিক্ষা', 'Building Tomorrow''s Leaders Today', 'আজকের শিশু, আগামীর নেতৃত্ব', 2, true),
('Join Our Family', 'আমাদের পরিবারে যোগ দিন', 'Admission Open for Academic Year 2026', '২০২৬ শিক্ষাবর্ষে ভর্তি চলছে', 3, true)
ON CONFLICT DO NOTHING;

-- Default school events
INSERT INTO school_events (title_en, title_bn, description_en, description_bn, event_date, category) VALUES
('Annual Prize-Giving Ceremony 2026', 'বার্ষিক পুরস্কার বিতরণী ২০২৬', 'Annual prize-giving ceremony celebrating student achievements. Parents are cordially invited.', 'শিক্ষার্থীদের কৃতিত্ব উদযাপনে বার্ষিক পুরস্কার বিতরণী। অভিভাবকরা আমন্ত্রিত।', '2026-07-15', 'ceremony'),
('Annual Sports Day', 'বার্ষিক ক্রীড়া দিবস', 'Annual sports competition for students of all classes. All students must attend.', 'সকল শ্রেণীর শিক্ষার্থীদের জন্য বার্ষিক ক্রীড়া প্রতিযোগিতা।', '2026-06-30', 'sports'),
('Science Fair 2026', 'বিজ্ঞান মেলা ২০২৬', 'Students showcase their science projects and innovations.', 'শিক্ষার্থীরা তাদের বিজ্ঞান প্রকল্প প্রদর্শন করবে।', '2026-08-10', 'academic'),
('Parent-Teacher Meeting', 'অভিভাবক-শিক্ষক সভা', 'Quarterly parent-teacher meeting to discuss student progress.', 'শিক্ষার্থীদের অগ্রগতি নিয়ে আলোচনার জন্য ত্রৈমাসিক সভা।', '2026-07-05', 'meeting')
ON CONFLICT DO NOTHING;
