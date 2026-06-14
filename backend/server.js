console.log("🔥 SERVER ACTIVE - NEW CODE RUNNING");
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { errorHandler, notFound } = require('./middleware/errorHandler');

const app = express();

// CORS Configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/crops', require('./routes/crops'));
app.use('/api/sell-requests', require('./routes/sellRequests'));
app.use('/api/service-requests', require('./routes/serviceRequests'));
app.use('/api/dashboard', require('./routes/dashboard'));

// TEMP DEBUG ROUTE
app.get('/debug-db', (req, res) => {
  res.json({
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    passwordLength: process.env.DB_PASSWORD?.length || 0
  });
});

const mysql = require('mysql2/promise');

app.get('/test-db', async (req, res) => {
  try {
    const conn = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });

    await conn.query('SELECT 1');
    await conn.end();

    res.json({
      success: true,
      message: 'DB connection successful'
    });
  } catch (err) {
    res.json({
      success: false,
      error: err.message,
      code: err.code
    });
  }
});


// Serve frontend static assets
app.use(express.static(path.join(__dirname, '../frontend')));


// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'AgriConnect API is running', timestamp: new Date().toISOString() });
});
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'AgriConnect Backend Running'
  });
});

app.get('/test', (req, res) => {
  res.json({ ok: true });
});

// Frontend fallback for SPA routes
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Error handling
app.use(notFound);
app.use(errorHandler);
console.log("🔥 BACKEND VERSION 1.0 LOADED");

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`
  ╔════════════════════════════════════════╗
  ║   🌾 AGRICONNECT API SERVER STARTED   ║
  ║   Port: ${PORT}                           ║
  ║   Environment: ${process.env.NODE_ENV || 'development'}          ║
  ╚════════════════════════════════════════╝
  `);
});

module.exports = app;
