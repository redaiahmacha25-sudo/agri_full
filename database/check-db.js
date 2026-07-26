const path = require('path');
const { Client } = require(path.join(__dirname, '../backend/node_modules/pg'));
require(path.join(__dirname, '../backend/node_modules/dotenv')).config({ path: path.join(__dirname, '../backend/.env') });

async function checkDatabases() {
  const dbsToTry = [
    process.env.DB_NAME,
    process.env.DB_NAME ? process.env.DB_NAME.toLowerCase() : null,
    process.env.DB_USER,
    'agriconnect',
    'postgres'
  ].filter(Boolean);

  for (const dbName of dbsToTry) {
    const client = new Client({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432', 10),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: dbName,
      ssl: { rejectUnauthorized: false }
    });

    try {
      console.log(`Trying database "${dbName}"...`);
      await client.connect();
      console.log(`✅ SUCCESS connecting to database "${dbName}"!`);
      
      const res = await client.query(`SELECT datname FROM pg_database WHERE datistemplate = false;`);
      console.log('Available databases on this PostgreSQL server:', res.rows.map(r => r.datname));
      await client.end();
      return dbName;
    } catch (err) {
      console.log(`Failed for "${dbName}": ${err.message}`);
    }
  }
}

checkDatabases();
