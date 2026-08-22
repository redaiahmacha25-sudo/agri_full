const fs = require('fs');
const path = require('path');
const db = require('../config/database');


// =====================================================
// LIST ALL TABLES AND ROW COUNTS
// =====================================================
const getTables = async (req, res, next) => {
  try {
    const tablesResult = await db.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    const tableList = [];

    for (const t of tablesResult.rows) {
      const tableName = t.table_name;

      const countResult = await db.query(
        `SELECT COUNT(*)::int AS count FROM "${tableName}"`
      );

      const columnsResult = await db.query(
        `
        SELECT
          column_name,
          data_type,
          is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = $1
        ORDER BY ordinal_position
        `,
        [tableName]
      );

      tableList.push({
        name: tableName,
        rowCount: countResult.rows[0].count || 0,
        columns: columnsResult.rows
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


// =====================================================
// GET DATA ROWS AND COLUMN SCHEMA
// =====================================================
const getTableData = async (req, res, next) => {
  try {
    const { tableName } = req.params;

    // Validate table name
    const validTableResult = await db.query(
      `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = $1
      `,
      [tableName]
    );

    if (validTableResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Table not found'
      });
    }

    // Get columns
    const columnsResult = await db.query(
      `
      SELECT
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = $1
      ORDER BY ordinal_position
      `,
      [tableName]
    );

    // Get rows
    const rowsResult = await db.query(
      `SELECT * FROM "${tableName}" ORDER BY 1 DESC LIMIT 100`
    );

    res.json({
      success: true,
      tableName,
      columns: columnsResult.rows,
      rows: rowsResult.rows
    });

  } catch (err) {
    next(err);
  }
};


// =====================================================
// INSERT NEW ROW INTO ANY TABLE
// =====================================================
const insertTableData = async (req, res, next) => {
  try {
    const { tableName } = req.params;
    const rowData = req.body;

    // Validate request body
    if (
      !rowData ||
      typeof rowData !== 'object' ||
      Array.isArray(rowData) ||
      Object.keys(rowData).length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: 'Row data is required'
      });
    }

    // Validate table name
    const validTableResult = await db.query(
      `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = $1
      `,
      [tableName]
    );

    if (validTableResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Table not found'
      });
    }

    const keys = Object.keys(rowData);
    const values = Object.values(rowData);

    const cols = keys
      .map(key => `"${key.replace(/"/g, '""')}"`)
      .join(', ');

    const placeholders = keys
      .map((_, index) => `$${index + 1}`)
      .join(', ');

    const sql = `
      INSERT INTO "${tableName}" (${cols})
      VALUES (${placeholders})
      RETURNING *
    `;

    const insertedResult = await db.query(sql, values);

    res.status(201).json({
      success: true,
      message: `Record inserted successfully into ${tableName}`,
      row: insertedResult.rows[0]
    });

  } catch (err) {
    next(err);
  }
};


// =====================================================
// INITIALIZE DATABASE
// =====================================================
const initDatabase = async (req, res, next) => {
  try {
    const schemaPath = path.join(
      __dirname,
      '../../database/schema.sql'
    );

    if (!fs.existsSync(schemaPath)) {
      return res.status(404).json({
        success: false,
        message: 'schema.sql file not found'
      });
    }

    const sql = fs.readFileSync(schemaPath, 'utf8');

    // Execute PostgreSQL schema
    await db.query(sql);

    const tablesResult = await db.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    res.json({
      success: true,
      message: 'Database initialized successfully with tables and sample data!',
      tables: tablesResult.rows.map(
        table => table.table_name
      )
    });

  } catch (err) {
    next(err);
  }
};


// =====================================================
// EXPORT
// =====================================================
module.exports = {
  getTables,
  getTableData,
  insertTableData,
  initDatabase
};