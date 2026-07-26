const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

pool.on('error', (err) => {
  console.error('⚠️ Unexpected PostgreSQL pool error:', err);
});

pool.connect()
  .then(client => {
    console.log('✅ Connected to Neon PostgreSQL!');
    client.release();
  })
  .catch(err => {
    console.error('❌ Neon connection failed:', err.message);
  });

const query = async (text, params = []) => {
  // Convert MySQL ? placeholders to PostgreSQL $1, $2...
  if (text.includes('?') && !/\$\d+/.test(text)) {
    let i = 1;
    text = text.replace(/\?/g, () => `$${i++}`);
  }

  const result = await pool.query(text, params);

  const rows = result.rows || [];

  if (rows.length > 0 && rows[0].id !== undefined) {
    rows.insertId = rows[0].id;
  }

  const response = [rows, result];
  response.rows = rows;
  response.rowCount = result.rowCount;
  response.insertId = rows.insertId;

  return response;
};

module.exports = {
  pool,
  query,
  execute: query
};