const express = require('express');
const cors = require('cors');
const { initDB } = require('./src/database');

const authRoutes = require('./src/routes/auth');
const recordsRoutes = require('./src/routes/records');
const usersRoutes = require('./src/routes/users');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Database
initDB().then(() => {
  console.log("Database initialized");
}).catch(err => {
  console.error("Database initialization failed", err);
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/records', recordsRoutes);
app.use('/api/users', usersRoutes);

// Simple health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Export for Vercel serverless functions
module.exports = app;
