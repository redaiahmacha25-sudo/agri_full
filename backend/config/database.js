const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,

    ssl: {
        rejectUnauthorized: false
    },

    max: 5,

    idleTimeoutMillis: 30000,

    connectionTimeoutMillis: 10000,

    keepAlive: true,

    keepAliveInitialDelayMillis: 10000
});

// Test database connection
pool.on('connect', () => {
    console.log('✅ New PostgreSQL connection established');
});

pool.on('error', (err) => {
    console.error('❌ PostgreSQL pool error:', err.message);
});

// Initial connection test
(async () => {
    try {
        const result = await pool.query('SELECT NOW() AS current_time');

        console.log('✅ Neon PostgreSQL connected successfully');
        console.log('🕒 Database time:', result.rows[0].current_time);
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
    }
})();

module.exports = pool;