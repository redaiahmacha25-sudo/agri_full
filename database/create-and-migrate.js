const fs = require('fs');
const path = require('path');
const { Client } = require(path.join(__dirname, '../backend/node_modules/pg'));
require(path.join(__dirname, '../backend/node_modules/dotenv')).config({ path: path.join(__dirname, '../backend/.env') });

async function setupRenderDatabase() {
  const baseConfig = {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: { rejectUnauthorized: false }
  };

  let targetDb = 'schema_rt3m';

  // Connect to postgres default DB first
  const adminClient = new Client({ ...baseConfig, database: 'postgres' });
  try {
    await adminClient.connect();
    console.log('✅ Connected to Render default "postgres" DB.');

    // Try creating agriconnect DB
    try {
      console.log('Attempting to create database "agriconnect"...');
      await adminClient.query('CREATE DATABASE agriconnect;');
      console.log('🎉 Database "agriconnect" created successfully!');
      targetDb = 'agriconnect';
    } catch (createErr) {
      console.log(`Note: CREATE DATABASE failed (${createErr.message}). Using existing database "${targetDb}".`);
    }
  } catch (adminErr) {
    console.log(`Could not connect to postgres DB: ${adminErr.message}`);
  } finally {
    await adminClient.end();
  }

  // Connect to target DB
  console.log(`📡 Connecting to target database "${targetDb}" on Render...`);
  const client = new Client({ ...baseConfig, database: targetDb });

  try {
    await client.connect();
    console.log(`✅ Connected to database "${targetDb}"!`);

    const schemaPath = path.join(__dirname, 'schema.sql');
    console.log(`📄 Reading schema from ${schemaPath}...`);
    const sql = fs.readFileSync(schemaPath, 'utf8');

    console.log(`⚡ Executing tables, functions, triggers, seed data & PL/pgSQL procedures on Render database "${targetDb}"...`);
    await client.query(sql);

    console.log(`🎉 ALL TABLES AND PROCEDURES INSTALLED SUCCESSFULLY IN "${targetDb}" ON RENDER!`);

    // Verify tables
    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log('\n📊 Installed Tables:', res.rows.map(r => r.table_name).join(', '));

    // Verify functions/procedures
    const procRes = await client.query(`
      SELECT routine_name 
      FROM information_schema.routines 
      WHERE routine_schema = 'public' AND routine_type = 'FUNCTION'
    `);
    console.log('\n⚙️ Installed Functions/Procedures:', procRes.rows.map(r => r.routine_name).join(', '));

    return targetDb;
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    console.error(err);
    throw err;
  } finally {
    await client.end();
  }
}

setupRenderDatabase();
