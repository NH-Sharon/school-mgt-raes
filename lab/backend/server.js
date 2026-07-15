const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const subjectsRoutes = require('./routes/subjects');
const contentRoutes = require('./routes/content');
const simulationsRoutes = require('./routes/simulations');
const examsRoutes = require('./routes/exams');
const dashboardRoutes = require('./routes/dashboard');
const adminRoutes = require('./routes/admin');
const notificationsRoutes = require('./routes/notifications');

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL ? [process.env.FRONTEND_URL, 'http://localhost:4300'] : true,
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/api/auth', authRoutes);
app.use('/api/subjects', subjectsRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/simulations', simulationsRoutes);
app.use('/api/exams', examsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationsRoutes);

const pool = require('./config/database');
app.get('/api/ping', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', time: new Date().toISOString() });
  } catch {
    res.status(500).json({ status: 'db_error' });
  }
});

if (process.env.NODE_ENV !== 'production' || process.env.PORT) {
  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => console.log(`BdVirtualLab backend running on port ${PORT}`));
}

module.exports = app;
