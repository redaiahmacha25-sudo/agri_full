const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 5,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
    keepAlive: true
});

pool.on('connect', () => {
    console.log('✅ PostgreSQL connection established');
});

pool.on('error', (err) => {
    console.error('❌ PostgreSQL pool error:', err.message);
});

async function testDatabase() {
    try {
        const result = await pool.query('SELECT NOW() AS current_time');

        console.log('✅ Neon PostgreSQL connected successfully');
        console.log('🕒 Database time:', result.rows[0].current_time);

    } catch (error) {
        console.error(
            '❌ Database connection failed:',
            error.message
        );
    }
}

testDatabase();

module.exports = pool;