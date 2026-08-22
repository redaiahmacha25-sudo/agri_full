const path = require('path');
const { Client } = require(path.join(__dirname, '../backend/node_modules/pg'));
require(path.join(__dirname, '../backend/node_modules/dotenv')).config({ path: path.join(__dirname, '../backend/.env') });

const cropsTeluguMap = [
  { id: 1, name: 'Paddy (Common)', name_telugu: 'వరి (సాధారణ)' },
  { id: 2, name: 'Paddy (Grade A)', name_telugu: 'వరి (గ్రేడ్ A)' },
  { id: 3, name: 'Wheat', name_telugu: 'గోధుమ' },
  { id: 4, name: 'Maize', name_telugu: 'మొక్కజొన్న' },
  { id: 5, name: 'Groundnut', name_telugu: 'వేరుశనగ' },
  { id: 6, name: 'Sunflower', name_telugu: 'పొద్దుతిరుగుడు' },
  { id: 7, name: 'Red Gram (Tur)', name_telugu: 'కంది పప్పు' },
  { id: 8, name: 'Black Gram', name_telugu: 'మినప పప్పు' },
  { id: 9, name: 'Green Gram', name_telugu: 'పెసర పప్పు' },
  { id: 10, name: 'Cotton (Medium)', name_telugu: 'పత్తి (మీడియం)' },
  { id: 11, name: 'Cotton (Long)', name_telugu: 'పత్తి (లాంగ్)' },
  { id: 12, name: 'Soybean', name_telugu: 'సోయాబీన్' }
];

async function fixTeluguNames() {
  const client = new Client({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected to Render PostgreSQL DB');

    await client.query("SET client_encoding = 'UTF8';");

    for (const crop of cropsTeluguMap) {
      await client.query(
        'UPDATE crops SET name_telugu = $1 WHERE id = $2 OR name = $3',
        [crop.name_telugu, crop.id, crop.name]
      );
      console.log(`Updated ID ${crop.id} (${crop.name}) -> ${crop.name_telugu}`);
    }

    const res = await client.query('SELECT id, name, name_telugu FROM crops ORDER BY id');
    console.log('\n🎉 ALL TELUGU NAMES UPDATED SUCCESSFULLY IN RENDER POSTGRESQL DB:');
    console.table(res.rows);

  } catch (err) {
    console.error('❌ Error updating Telugu names:', err);
  } finally {
    await client.end();
  }
}

fixTeluguNames();
