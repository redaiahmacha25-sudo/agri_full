console.log("🔥 SERVER ACTIVE - NEW CODE RUNNING");

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

const { errorHandler, notFound } = require('./middleware/errorHandler');
const db = require('./config/database');

const app = express();

// ============================================================
// CORS CONFIGURATION
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
// DATABASE TEST ROUTE
// ============================================================

app.get('/test-db', async (req, res) => {

    try {

        console.log('🔄 Testing PostgreSQL connection...');

        const result = await db.query(
            'SELECT NOW() AS current_time'
        );

        console.log('✅ PostgreSQL connection successful');

        res.json({
            success: true,
            message: 'PostgreSQL DB connection successful',
            database: 'Neon PostgreSQL',
            time: result.rows[0].current_time
        });

    } catch (err) {

        console.error('❌ TEST DB ERROR:', err.message);

        res.status(500).json({
            success: false,
            message: 'PostgreSQL DB connection failed',
            error: err.message,
            code: err.code || null
        });
    }
});

// ============================================================
// SAFE DATABASE ENVIRONMENT DEBUG
// ============================================================
app.get('/debug-db', (req, res) => {
    try {
        const url = new URL(process.env.NEON_DATABASE_URL);

        res.json({
            exists: true,
            host: url.hostname,
            port: url.port || '5432',
            database: url.pathname.replace('/', ''),
            user: url.username,
            sslmode: url.searchParams.get('sslmode'),
            is_pooler: url.hostname.includes('-pooler'),
            url_length: process.env.NEON_DATABASE_URL.length,
            environment: process.env.NODE_ENV || 'development'
        });

    } catch (error) {
        res.status(500).json({
            exists: false,
            error: 'NEON_DATABASE_URL is missing or invalid'
        });
    }
});
// ============================================================
// HEALTH CHECK
// ============================================================

app.get('/api/health', (req, res) => {

    res.json({

        success: true,

        message:
            'AgriConnect API is running',

        timestamp:
            new Date().toISOString()

    });

});

// ============================================================
// ROOT ROUTE
// ============================================================

app.get('/', (req, res) => {

    res.json({

        success: true,

        message:
            'AgriConnect Backend Running'

    });

});

// ============================================================
// SIMPLE SERVER TEST
// ============================================================

app.get('/test', (req, res) => {

    res.json({

        ok: true,

        message:
            'Server is working'

    });

});

// ============================================================
// SERVE FRONTEND
// ============================================================

app.use(
    express.static(
        path.join(
            __dirname,
            '../frontend'
        )
    )
);

// ============================================================
// FRONTEND FALLBACK
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
// START SERVER
// ============================================================

const PORT =
    process.env.PORT || 5000;

console.log(
    "🔥 BACKEND VERSION 3.0 LOADED"
);

app.listen(PORT, () => {

    console.log(`
╔════════════════════════════════════════╗
║   🌾 AGRICONNECT API SERVER STARTED   ║
║   Port: ${PORT}
║   Environment: ${process.env.NODE_ENV || 'development'}
╚════════════════════════════════════════╝
`);

});

// ============================================================
// EXPORT APP
// ============================================================

module.exports = app;