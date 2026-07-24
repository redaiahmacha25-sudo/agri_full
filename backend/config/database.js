module.exports = pool;const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  max: 10, // connection limit
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,

  ssl: {
    rejectUnauthorized: false
  }
});

// Test connection
pool.connect()
  .then(client => {
    console.log('✅ PostgreSQL Database connected successfully');
    client.release();
  })
  .catch(err => {
    console.error('❌ PostgreSQL Database connection failed:', err.message);
  });

module.exports = pool;