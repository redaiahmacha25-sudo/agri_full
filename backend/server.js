console.log("🔥 SERVER ACTIVE - NEW CODE RUNNING");

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

const { errorHandler, notFound } = require('./middleware/errorHandler');
const db = require('./config/database');

const app = express();

// ============================================================
// CORS
// ============================================================

const corsOptions = {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

// ============================================================
// MIDDLEWARE
// ============================================================

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
    '/uploads',
    express.static(path.join(__dirname, 'uploads'))
);

// ============================================================
// API ROUTES
// ============================================================

app.use('/api/auth', require('./routes/auth'));
app.use('/api/crops', require('./routes/crops'));
app.use('/api/sell-requests', require('./routes/sellRequests'));
app.use('/api/service-requests', require('./routes/serviceRequests'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/admin/db', require('./routes/dbRoutes'));

// ============================================================
// DATABASE TEST
// ============================================================

app.get('/test-db', async (req, res) => {

    try {

        const result = await db.query(
            'SELECT NOW() AS current_time'
        );

        console.log('✅ TEST DB: PostgreSQL connection successful');

        res.json({
            success: true,
            message: 'PostgreSQL DB connection successful',
            database: 'Neon PostgreSQL',
            time: result.rows[0].current_time
        });

    } catch (err) {

        console.error('❌ TEST DB ERROR:', err);

        res.status(500).json({
            success: false,
            message: 'PostgreSQL DB connection failed',
            error: err.message,
            code: err.code || null
        });
    }
});

// ============================================================
// HEALTH CHECK
// ============================================================

app.get('/api/health', (req, res) => {

    res.json({
        success: true,
        message: 'AgriConnect API is running',
        timestamp: new Date().toISOString()
    });

});

// ============================================================
// ROOT
// ============================================================

app.get('/', (req, res) => {

    res.json({
        success: true,
        message: 'AgriConnect Backend Running'
    });

});

// ============================================================
// SIMPLE TEST
// ============================================================

app.get('/test', (req, res) => {

    res.json({
        ok: true,
        message: 'Server is working'
    });

});

// ============================================================
// DEBUG DATABASE ENVIRONMENT
// ============================================================

app.get('/debug-db', (req, res) => {

    res.json({

        database_url_exists:
            !!process.env.DATABASE_URL,

        database_url_length:
            process.env.DATABASE_URL
                ? process.env.DATABASE_URL.length
                : 0,

        node_environment:
            process.env.NODE_ENV || 'development'

    });

});

// ============================================================
// FRONTEND
// ============================================================

app.use(
    express.static(
        path.join(__dirname, '../frontend')
    )
);

// ============================================================
// SPA FALLBACK
// ============================================================

app.get('*', (req, res, next) => {

    if (req.path.startsWith('/api')) {
        return next();
    }

    res.sendFile(
        path.join(
            __dirname,
            '../frontend/index.html'
        )
    );

});

// ============================================================
// ERROR HANDLING
// ============================================================

app.use(notFound);
app.use(errorHandler);

// ============================================================
// SERVER
// ============================================================

const PORT = process.env.PORT || 5000;

console.log("🔥 BACKEND VERSION 2.0 LOADED");

app.listen(PORT, () => {

    console.log(`
╔════════════════════════════════════════╗
║   🌾 AGRICONNECT API SERVER STARTED   ║
║   Port: ${PORT}
║   Environment: ${process.env.NODE_ENV || 'development'}
╚════════════════════════════════════════╝
`);

});

module.exports = app;