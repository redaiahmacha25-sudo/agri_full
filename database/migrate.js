const fs = require('fs');
const path = require('path');
const { Client } = require(path.join(__dirname, '../backend/node_modules/pg'));
require(path.join(__dirname, '../backend/node_modules/dotenv')).config({ path: path.join(__dirname, '../backend/.env') });

async function runMigration() {
  const client = new Client({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: { rejectUnauthorized: false }
  });

  console.log(`📡 Connecting to Render PostgreSQL database (${process.env.DB_NAME} at ${process.env.DB_HOST})...`);
  
  try {
    await client.connect();
    console.log('✅ Connected to Render PostgreSQL DB successfully!');

    const schemaPath = path.join(__dirname, 'schema.sql');
    console.log(`📄 Reading schema from ${schemaPath}...`);
    const sql = fs.readFileSync(schemaPath, 'utf8');

    console.log('⚡ Executing schema & stored procedures on Render database...');
    await client.query(sql);

    console.log('🎉 Database migration completed successfully on Render PostgreSQL!');

    // Verify tables created
    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log('📊 Tables present in database:', res.rows.map(r => r.table_name).join(', '));

    // Verify stored procedures created
    const procRes = await client.query(`
      SELECT routine_name 
      FROM information_schema.routines 
      WHERE routine_schema = 'public' AND routine_type = 'FUNCTION'
    `);
    console.log('⚙️ Functions/Procedures present in database:', procRes.rows.map(r => r.routine_name).join(', '));

  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    console.error(err);
  } finally {
    await client.end();
  }
}

runMigration();
