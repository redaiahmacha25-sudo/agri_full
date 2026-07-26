const fs = require('fs');
const path = require('path');
const db = require('../config/database');

// List all tables and row counts
const getTables = async (req, res, next) => {
  try {
    const [tables] = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    const tableList = [];
    for (const t of tables) {
      const tableName = t.table_name;
      const [[{ count }]] = await db.query(`SELECT COUNT(*)::int as count FROM "${tableName}"`);
      
      const [columns] = await db.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1
        ORDER BY ordinal_position
      `, [tableName]);

      tableList.push({
        name: tableName,
        rowCount: count || 0,
        columns
      });
    }

    res.json({
      success: true,
      tables: tableList
    });
  } catch (err) {
    next(err);
  }
};

// Get data rows and column schema for a specific table
const getTableData = async (req, res, next) => {
  try {
    const { tableName } = req.params;

    // Validate table name to prevent SQL injection
    const [validTable] = await db.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = $1
    `, [tableName]);

    if (!validTable.length) {
      return res.status(404).json({ success: false, message: 'Table not found' });
    }

    const [columns] = await db.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = $1
      ORDER BY ordinal_position
    `, [tableName]);

    const [rows] = await db.query(`SELECT * FROM "${tableName}" ORDER BY 1 DESC LIMIT 100`);

    res.json({
      success: true,
      tableName,
      columns,
      rows
    });
  } catch (err) {
    next(err);
  }
};

// Insert a new row into any table
const insertTableData = async (req, res, next) => {
  try {
    const { tableName } = req.params;
    const rowData = req.body;

    if (!rowData || typeof rowData !== 'object' || Object.keys(rowData).length === 0) {
      return res.status(400).json({ success: false, message: 'Row data is required' });
    }

    // Validate table name
    const [validTable] = await db.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = $1
    `, [tableName]);

    if (!validTable.length) {
      return res.status(404).json({ success: false, message: 'Table not found' });
    }

    const keys = Object.keys(rowData);
    const values = Object.values(rowData);
    const cols = keys.map(k => `"${k}"`).join(', ');
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');

    const sql = `INSERT INTO "${tableName}" (${cols}) VALUES (${placeholders}) RETURNING *`;
    const [insertedRows] = await db.query(sql, values);

    res.status(201).json({
      success: true,
      message: `Record inserted successfully into ${tableName}`,
      row: insertedRows[0]
    });
  } catch (err) {
    next(err);
  }
};

// Initialize database schema and insert initial seed data
const initDatabase = async (req, res, next) => {
  try {
    const schemaPath = path.join(__dirname, '../../database/schema.sql');
    if (!fs.existsSync(schemaPath)) {
      return res.status(404).json({ success: false, message: 'schema.sql file not found' });
    }

    const sql = fs.readFileSync(schemaPath, 'utf8');
    await db.query(sql);

    const [tables] = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    `);

    res.json({
      success: true,
      message: 'Database initialized successfully with tables and sample data!',
      tables: tables.map(t => t.table_name)
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getTables,
  getTableData,
  insertTableData,
  initDatabase
};
