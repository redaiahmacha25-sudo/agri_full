const db = require('../config/database');

// GET ALL SERVICE REQUESTS
const getServiceRequests = async (req, res, next) => {
  try {
    const { role, id } = req.user;
    let queryStr = `
      SELECT 
        sr.*,
        u.name as farmer_name,
        u.phone as farmer_phone,
        u.village as farmer_village,
        h.name as handler_name,
        e.name as escalated_to_name
      FROM service_requests sr
      JOIN users u ON sr.farmer_id = u.id
      LEFT JOIN users h ON sr.handled_by = h.id
      LEFT JOIN users e ON sr.escalated_to = e.id
    `;

    const params = [];

    if (role === 'farmer') {
      queryStr += ' WHERE sr.farmer_id = $1';
      params.push(id);
    } else if (role === 'employee') {
      queryStr += " WHERE sr.handled_by = $1 OR sr.status = 'pending'";
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

// GET SERVICE REQUEST BY ID
const getServiceRequestById = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `
      SELECT 
        sr.*,
        u.name as farmer_name,
        u.phone as farmer_phone,
        h.name as handler_name,
        e.name as escalated_to_name
      FROM service_requests sr
      JOIN users u ON sr.farmer_id = u.id
      LEFT JOIN users h ON sr.handled_by = h.id
      LEFT JOIN users e ON sr.escalated_to = e.id
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
      WHERE r.entity_type = 'service_request'
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

// CREATE SERVICE REQUEST
const createServiceRequest = async (req, res, next) => {
  try {
    const {
      type,
      subject,
      description,
      priority
    } = req.body;

    if (!type || !subject || !description) {
      return res.status(400).json({
        success: false,
        message: 'Type, subject, and description required.'
      });
    }

    const media_url = req.file ? `/uploads/${req.file.filename}` : null;

    // Calling PostgreSQL Stored Function sp_create_service_request
    const [result] = await db.query(
      `SELECT sp_create_service_request($1, $2::service_type, $3, $4, $5, $6::priority_level) AS id`,
      [
        req.user.id,
        type,
        subject,
        description,
        media_url,
        priority || 'medium'
      ]
    );

    const requestId = result[0]?.id;

    res.status(201).json({
      success: true,
      message: 'Service request submitted successfully.',
      id: requestId
    });

  } catch (err) {
    next(err);
  }
};

// UPDATE SERVICE REQUEST
const updateServiceRequest = async (req, res, next) => {
  try {
    const {
      action,
      resolution_notes,
      escalation_reason,
      remarks
    } = req.body;

    const [rows] = await db.query(
      'SELECT * FROM service_requests WHERE id = $1',
      [req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({
        success: false,
        message: 'Request not found.'
      });
    }

    // Calling PostgreSQL Stored Function sp_update_service_request
    const [resStatus] = await db.query(
      `SELECT sp_update_service_request($1, $2, $3, $4, $5, $6) AS status`,
      [
        req.params.id,
        req.user.id,
        action,
        resolution_notes || null,
        escalation_reason || null,
        remarks || null
      ]
    );

    const updatedStatus = resStatus[0]?.status;

    res.json({
      success: true,
      message: `Service request ${action}d successfully.`,
      status: updatedStatus
    });

  } catch (err) {
    next(err);
  }
};

module.exports = {
  getServiceRequests,
  getServiceRequestById,
  createServiceRequest,
  updateServiceRequest
};