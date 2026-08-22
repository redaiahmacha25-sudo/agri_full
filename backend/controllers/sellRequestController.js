const db = require('../config/database');

// =====================================================
// GET ALL SELL REQUESTS
// =====================================================
const getSellRequests = async (req, res, next) => {
  try {
    const { role, id } = req.user;

    let queryStr = `
      SELECT
        sr.*,
        u.name AS farmer_name,
        u.phone AS farmer_phone,
        u.village AS farmer_village,
        c.name AS crop_name,
        c.govt_price,
        c.unit,
        v.name AS verifier_name,
        a.name AS approver_name
      FROM sell_requests sr
      JOIN users u ON sr.farmer_id = u.id
      JOIN crops c ON sr.crop_id = c.id
      LEFT JOIN users v ON sr.verified_by = v.id
      LEFT JOIN users a ON sr.approved_by = a.id
    `;

    const params = [];

    if (role === 'farmer') {
      queryStr += ` WHERE sr.farmer_id = $1`;
      params.push(id);

    } else if (role === 'employee') {
      queryStr += `
        WHERE (
          sr.status IN ('pending', 'verified', 'rejected')
          OR sr.verified_by = $1
        )
      `;
      params.push(id);
    }

    queryStr += ` ORDER BY sr.created_at DESC`;

    const result = await db.query(queryStr, params);

    res.json({
      success: true,
      requests: result.rows
    });

  } catch (err) {
    next(err);
  }
};


// =====================================================
// GET SELL REQUEST BY ID
// =====================================================
const getSellRequestById = async (req, res, next) => {
  try {
    const result = await db.query(
      `
      SELECT
        sr.*,
        u.name AS farmer_name,
        u.phone AS farmer_phone,
        u.village AS farmer_village,
        c.name AS crop_name,
        c.govt_price,
        c.unit,
        v.name AS verifier_name,
        a.name AS approver_name
      FROM sell_requests sr
      JOIN users u ON sr.farmer_id = u.id
      JOIN crops c ON sr.crop_id = c.id
      LEFT JOIN users v ON sr.verified_by = v.id
      LEFT JOIN users a ON sr.approved_by = a.id
      WHERE sr.id = $1
      `,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Request not found.'
      });
    }

    const remarksResult = await db.query(
      `
      SELECT
        r.*,
        u.name AS author
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
      request: result.rows[0],
      remarks: remarksResult.rows
    });

  } catch (err) {
    next(err);
  }
};


// =====================================================
// CREATE SELL REQUEST
// =====================================================
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

    // Get crop price
    const cropResult = await db.query(
      `
      SELECT govt_price
      FROM crops
      WHERE id = $1
      `,
      [crop_id]
    );

    if (cropResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Crop not found.'
      });
    }

    const govtPrice = Number(cropResult.rows[0].govt_price);
    const expected_amount = Number(quantity) * govtPrice;

    const image_url = req.file
      ? `/uploads/${req.file.filename}`
      : null;

    // PostgreSQL stored function
    const result = await db.query(
      `
      SELECT sp_create_sell_request(
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8,
        $9,
        $10
      ) AS id
      `,
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

    const requestId = result.rows[0]?.id;

    res.status(201).json({
      success: true,
      message: 'Sell request submitted successfully.',
      id: requestId
    });

  } catch (err) {
    next(err);
  }
};


// =====================================================
// VERIFY SELL REQUEST
// =====================================================
const verifySellRequest = async (req, res, next) => {
  try {
    const {
      action,
      rejection_reason,
      remarks
    } = req.body;

    // Check request
    const requestResult = await db.query(
      `
      SELECT *
      FROM sell_requests
      WHERE id = $1
      `,
      [req.params.id]
    );

    if (requestResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Request not found.'
      });
    }

    if (requestResult.rows[0].status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Request already processed.'
      });
    }

    // PostgreSQL stored function
    const statusResult = await db.query(
      `
      SELECT sp_verify_sell_request(
        $1,
        $2,
        $3,
        $4,
        $5
      ) AS status
      `,
      [
        req.params.id,
        req.user.id,
        action,
        rejection_reason || null,
        remarks || null
      ]
    );

    const updatedStatus = statusResult.rows[0]?.status;

    res.json({
      success: true,
      message: `Request ${updatedStatus} successfully.`
    });

  } catch (err) {
    next(err);
  }
};


// =====================================================
// APPROVE SELL REQUEST
// =====================================================
const approveSellRequest = async (req, res, next) => {
  try {
    const {
      action,
      procurement_date,
      rejection_reason,
      remarks
    } = req.body;

    // Check request
    const requestResult = await db.query(
      `
      SELECT *
      FROM sell_requests
      WHERE id = $1
      `,
      [req.params.id]
    );

    if (requestResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Request not found.'
      });
    }

    // PostgreSQL stored function
    const statusResult = await db.query(
      `
      SELECT sp_approve_sell_request(
        $1,
        $2,
        $3,
        $4,
        $5,
        $6
      ) AS status
      `,
      [
        req.params.id,
        req.user.id,
        action,
        procurement_date || null,
        rejection_reason || null,
        remarks || null
      ]
    );

    const updatedStatus = statusResult.rows[0]?.status;

    res.json({
      success: true,
      message: `Request ${updatedStatus} successfully.`
    });

  } catch (err) {
    next(err);
  }
};


// =====================================================
// MARK PAYMENT DONE
// =====================================================
const markPaymentDone = async (req, res, next) => {
  try {
    const {
      payment_amount,
      transaction_ref
    } = req.body;

    // Check request
    const requestResult = await db.query(
      `
      SELECT *
      FROM sell_requests
      WHERE id = $1
      `,
      [req.params.id]
    );

    if (requestResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Request not found.'
      });
    }

    // PostgreSQL stored function
    await db.query(
      `
      SELECT sp_mark_payment_done(
        $1,
        $2,
        $3
      )
      `,
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


// =====================================================
// EXPORT
// =====================================================
module.exports = {
  getSellRequests,
  getSellRequestById,
  createSellRequest,
  verifySellRequest,
  approveSellRequest,
  markPaymentDone
};