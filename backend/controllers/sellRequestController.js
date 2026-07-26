const db = require('../config/database');

// GET ALL SELL REQUESTS
const getSellRequests = async (req, res, next) => {
  try {
    const { role, id } = req.user;

    let queryStr = `
      SELECT 
        sr.*,
        u.name as farmer_name,
        u.phone as farmer_phone,
        u.village as farmer_village,
        c.name as crop_name,
        c.govt_price,
        c.unit,
        v.name as verifier_name,
        a.name as approver_name
      FROM sell_requests sr
      JOIN users u ON sr.farmer_id = u.id
      JOIN crops c ON sr.crop_id = c.id
      LEFT JOIN users v ON sr.verified_by = v.id
      LEFT JOIN users a ON sr.approved_by = a.id
    `;

    const params = [];

    if (role === 'farmer') {
      queryStr += ' WHERE sr.farmer_id = $1';
      params.push(id);
    } else if (role === 'employee') {
      queryStr += " WHERE sr.status IN ('pending', 'verified', 'rejected') OR sr.verified_by = $1";
      params.push(id);
    }

    queryStr += ' ORDER BY sr.created_at DESC';

    const [requests] = await db.query(queryStr, params);

    res.json({
      success: true,
      requests
    });

  } catch (err) {
    next(err);
  }
};

// GET SELL REQUEST BY ID
const getSellRequestById = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `
      SELECT 
        sr.*,
        u.name as farmer_name,
        u.phone as farmer_phone,
        u.village as farmer_village,
        c.name as crop_name,
        c.govt_price,
        c.unit,
        v.name as verifier_name,
        a.name as approver_name
      FROM sell_requests sr
      JOIN users u ON sr.farmer_id = u.id
      JOIN crops c ON sr.crop_id = c.id
      LEFT JOIN users v ON sr.verified_by = v.id
      LEFT JOIN users a ON sr.approved_by = a.id
      WHERE sr.id = $1
      `,
      [req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({
        success: false,
        message: 'Request not found.'
      });
    }

    const [remarks] = await db.query(
      `
      SELECT 
        r.*,
        u.name as author
      FROM remarks r
      JOIN users u ON r.created_by = u.id
      WHERE r.entity_type = 'sell_request'
        AND r.entity_id = $1
      ORDER BY r.created_at ASC
      `,
      [req.params.id]
    );

    res.json({
      success: true,
      request: rows[0],
      remarks
    });

  } catch (err) {
    next(err);
  }
};

// CREATE SELL REQUEST
const createSellRequest = async (req, res, next) => {
  try {
    const {
      crop_id,
      quantity,
      village,
      harvest_date,
      notes,
      geo_lat,
      geo_lng
    } = req.body;

    if (!crop_id || !quantity) {
      return res.status(400).json({
        success: false,
        message: 'Crop and quantity required.'
      });
    }

    const [crop] = await db.query(
      'SELECT govt_price FROM crops WHERE id = $1',
      [crop_id]
    );

    if (!crop.length) {
      return res.status(404).json({
        success: false,
        message: 'Crop not found.'
      });
    }

    const expected_amount = Number(quantity) * Number(crop[0].govt_price);
    const image_url = req.file ? `/uploads/${req.file.filename}` : null;

    // Calling PostgreSQL Stored Function sp_create_sell_request
    const [result] = await db.query(
      `SELECT sp_create_sell_request($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) AS id`,
      [
        req.user.id,
        crop_id,
        quantity,
        image_url,
        village || null,
        harvest_date || null,
        notes || null,
        geo_lat || null,
        geo_lng || null,
        expected_amount
      ]
    );

    const requestId = result[0]?.id;

    res.status(201).json({
      success: true,
      message: 'Sell request submitted successfully.',
      id: requestId
    });

  } catch (err) {
    next(err);
  }
};

// VERIFY SELL REQUEST
const verifySellRequest = async (req, res, next) => {
  try {
    const { action, rejection_reason, remarks } = req.body;

    const [rows] = await db.query(
      'SELECT * FROM sell_requests WHERE id = $1',
      [req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({
        success: false,
        message: 'Request not found.'
      });
    }

    if (rows[0].status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Request already processed.'
      });
    }

    // Calling PostgreSQL Stored Function sp_verify_sell_request
    const [resStatus] = await db.query(
      `SELECT sp_verify_sell_request($1, $2, $3, $4, $5) AS status`,
      [
        req.params.id,
        req.user.id,
        action,
        rejection_reason || null,
        remarks || null
      ]
    );

    const updatedStatus = resStatus[0]?.status;

    res.json({
      success: true,
      message: `Request ${updatedStatus} successfully.`
    });

  } catch (err) {
    next(err);
  }
};

// APPROVE SELL REQUEST
const approveSellRequest = async (req, res, next) => {
  try {
    const { action, procurement_date, rejection_reason, remarks } = req.body;

    const [rows] = await db.query(
      'SELECT * FROM sell_requests WHERE id = $1',
      [req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({
        success: false,
        message: 'Request not found.'
      });
    }

    // Calling PostgreSQL Stored Function sp_approve_sell_request
    const [resStatus] = await db.query(
      `SELECT sp_approve_sell_request($1, $2, $3, $4, $5, $6) AS status`,
      [
        req.params.id,
        req.user.id,
        action,
        procurement_date || null,
        rejection_reason || null,
        remarks || null
      ]
    );

    const updatedStatus = resStatus[0]?.status;

    res.json({
      success: true,
      message: `Request ${updatedStatus} successfully.`
    });

  } catch (err) {
    next(err);
  }
};

// PAYMENT DONE
const markPaymentDone = async (req, res, next) => {
  try {
    const { payment_amount, transaction_ref } = req.body;

    const [rows] = await db.query(
      'SELECT * FROM sell_requests WHERE id = $1',
      [req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({
        success: false,
        message: 'Request not found.'
      });
    }

    // Calling PostgreSQL Stored Function sp_mark_payment_done
    await db.query(
      `SELECT sp_mark_payment_done($1, $2, $3)`,
      [
        req.params.id,
        payment_amount,
        transaction_ref
      ]
    );

    res.json({
      success: true,
      message: 'Payment marked successfully.'
    });

  } catch (err) {
    next(err);
  }
};

module.exports = {
  getSellRequests,
  getSellRequestById,
  createSellRequest,
  verifySellRequest,
  approveSellRequest,
  markPaymentDone
};