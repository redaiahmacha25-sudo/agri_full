const db = require('../config/database');

// =====================================================
// GET ALL CROPS
// =====================================================
const getAllCrops = async (req, res, next) => {
  try {
    const result = await db.query(`
      SELECT *
      FROM crops
      WHERE is_active = TRUE
      ORDER BY category, name
    `);

    res.json({
      success: true,
      crops: result.rows
    });

  } catch (err) {
    next(err);
  }
};


// =====================================================
// GET CROP BY ID
// =====================================================
const getCropById = async (req, res, next) => {
  try {
    const result = await db.query(
      `
      SELECT *
      FROM crops
      WHERE id = $1
      `,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Crop not found.'
      });
    }

    res.json({
      success: true,
      crop: result.rows[0]
    });

  } catch (err) {
    next(err);
  }
};


// =====================================================
// CREATE CROP
// =====================================================
const createCrop = async (req, res, next) => {
  try {
    const {
      name,
      name_telugu,
      category,
      govt_price,
      unit,
      season
    } = req.body;

    // Validation
    if (!name || govt_price === undefined || govt_price === null) {
      return res.status(400).json({
        success: false,
        message: 'Name and price required.'
      });
    }

    // Insert crop
    const result = await db.query(
      `
      INSERT INTO crops
      (
        name,
        name_telugu,
        category,
        govt_price,
        unit,
        season,
        updated_by
      )
      VALUES
      (
        $1,
        $2,
        $3::crop_category,
        $4,
        $5,
        $6::crop_season,
        $7
      )
      RETURNING id
      `,
      [
        name,
        name_telugu || null,
        category || 'cereal',
        govt_price,
        unit || 'quintal',
        season || 'all',
        req.user.id
      ]
    );

    const cropId = result.rows[0].id;

    // Notify all farmers
    await db.query(
      `
      INSERT INTO notifications
      (
        user_id,
        title,
        message,
        type
      )
      SELECT
        id,
        'New Crop MSP Added',
        $1,
        'info'::notification_type
      FROM users
      WHERE role = 'farmer'
      `,
      [
        `${name} has been added with MSP ₹${govt_price}/quintal`
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Crop added successfully.',
      id: cropId
    });

  } catch (err) {
    next(err);
  }
};


// =====================================================
// UPDATE CROP
// =====================================================
const updateCrop = async (req, res, next) => {
  try {
    const {
      name,
      name_telugu,
      category,
      govt_price,
      unit,
      season,
      is_active
    } = req.body;

    // Check crop exists
    const existingResult = await db.query(
      `
      SELECT *
      FROM crops
      WHERE id = $1
      `,
      [req.params.id]
    );

    if (existingResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Crop not found.'
      });
    }

    const crop = existingResult.rows[0];

    // Update crop
    await db.query(
      `
      UPDATE crops
      SET
        name = $1,
        name_telugu = $2,
        category = $3::crop_category,
        govt_price = $4,
        unit = $5,
        season = $6::crop_season,
        is_active = $7,
        updated_by = $8
      WHERE id = $9
      `,
      [
        name ?? crop.name,
        name_telugu ?? crop.name_telugu,
        category ?? crop.category,
        govt_price ?? crop.govt_price,
        unit ?? crop.unit,
        season ?? crop.season,
        is_active !== undefined ? is_active : crop.is_active,
        req.user.id,
        req.params.id
      ]
    );

    res.json({
      success: true,
      message: 'Crop updated successfully.'
    });

  } catch (err) {
    next(err);
  }
};


// =====================================================
// EXPORT
// =====================================================
module.exports = {
  getAllCrops,
  getCropById,
  createCrop,
  updateCrop
};