const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/students');
const teacherRoutes = require('./routes/teachers');
const classRoutes = require('./routes/classes');
const examRoutes = require('./routes/exams');
const attendanceRoutes = require('./routes/attendance');
const paymentRoutes = require('./routes/payments');
const homeworkRoutes = require('./routes/homework');
const transportRoutes = require('./routes/transport');
const noticesRoutes = require('./routes/notices');
const galleryRoutes = require('./routes/gallery');
const websiteSettingsRoutes = require('./routes/website-settings');
const usersRoutes = require('./routes/users');
const subjectsRoutes = require('./routes/subjects');
const heroSlidesRoutes = require('./routes/hero-slides');
const schoolEventsRoutes = require('./routes/school-events');
const quickLinksRoutes = require('./routes/quick-links');
const employeesRoutes = require('./routes/employees');
const employeeAttendanceRoutes = require('./routes/employee-attendance');
const admissionsRoutes = require('./routes/admissions');

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL ? [process.env.FRONTEND_URL, 'http://localhost:4200', 'http://localhost:80'] : true,
  credentials: true,
}));
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));
app.use(express.static('public'));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/homework', homeworkRoutes);
app.use('/api/transport', transportRoutes);
app.use('/api/notices', noticesRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/website-settings', websiteSettingsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/subjects', subjectsRoutes);
app.use('/api/hero-slides', heroSlidesRoutes);
app.use('/api/events', schoolEventsRoutes);
app.use('/api/quick-links', quickLinksRoutes);
app.use('/api/employees', employeesRoutes);
app.use('/api/employee-attendance', employeeAttendanceRoutes);
app.use('/api/admissions', admissionsRoutes);

// Local development
if (process.env.NODE_ENV !== 'production' || process.env.PORT) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;
