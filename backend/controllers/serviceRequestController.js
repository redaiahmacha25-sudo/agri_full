const db = require('../config/database');

const getServiceRequests = async (req, res, next) => {
  try {
    const { role, id } = req.user;
    let query = `
      SELECT sr.*, u.name as farmer_name, u.phone as farmer_phone, u.village as farmer_village,
             h.name as handler_name, e.name as escalated_to_name
      FROM service_requests sr
      JOIN users u ON sr.farmer_id = u.id
      LEFT JOIN users h ON sr.handled_by = h.id
      LEFT JOIN users e ON sr.escalated_to = e.id
    `;
    const params = [];
    if (role === 'farmer') { query += ' WHERE sr.farmer_id = ?'; params.push(id); }
    else if (role === 'employee') { query += ' WHERE sr.handled_by = ? OR sr.status = "pending"'; params.push(id); }
    query += ' ORDER BY sr.created_at DESC';
    const [requests] = await db.query(query, params);
    res.json({ success: true, requests });
  } catch (err) { next(err); }
};

const getServiceRequestById = async (req, res, next) => {
  try {
    const [rows] = await db.query(`
      SELECT sr.*, u.name as farmer_name, u.phone as farmer_phone,
             h.name as handler_name, e.name as escalated_to_name
      FROM service_requests sr
      JOIN users u ON sr.farmer_id = u.id
      LEFT JOIN users h ON sr.handled_by = h.id
      LEFT JOIN users e ON sr.escalated_to = e.id
      WHERE sr.id = ?`, [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Request not found.' });
    const [remarks] = await db.query(`
      SELECT r.*, u.name as author FROM remarks r
      JOIN users u ON r.created_by = u.id
      WHERE r.entity_type = 'service_request' AND r.entity_id = ?
      ORDER BY r.created_at ASC`, [req.params.id]);
    res.json({ success: true, request: rows[0], remarks });
  } catch (err) { next(err); }
};

const createServiceRequest = async (req, res, next) => {
  try {
    const { type, subject, description, priority } = req.body;
    if (!type || !subject || !description) return res.status(400).json({ success: false, message: 'Type, subject, and description required.' });
    const media_url = req.file ? `/uploads/${req.file.filename}` : null;
    const [result] = await db.query(
      'INSERT INTO service_requests (farmer_id, type, subject, description, media_url, priority) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user.id, type, subject, description, media_url, priority || 'medium']
    );
    await db.query('INSERT INTO notifications (user_id, title, message, type) SELECT id, "New Service Request", "A new service request requires attention.", "info" FROM users WHERE role IN ("employee","admin")');
    res.status(201).json({ success: true, message: 'Service request submitted successfully.', id: result.insertId });
  } catch (err) { next(err); }
};

const updateServiceRequest = async (req, res, next) => {
  try {
    const { action, resolution_notes, escalation_reason, remarks } = req.body;
    const [rows] = await db.query('SELECT * FROM service_requests WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Request not found.' });
    const req_data = rows[0];
    let newStatus, updateFields = '';
    const params = [];
    if (action === 'accept') {
      newStatus = 'in_progress';
      updateFields = 'status=?, handled_by=?, assigned_at=NOW()';
      params.push(newStatus, req.user.id);
    } else if (action === 'resolve') {
      newStatus = 'resolved';
      updateFields = 'status=?, resolved_at=NOW(), resolution_notes=?';
      params.push(newStatus, resolution_notes || '');
    } else if (action === 'reject') {
      newStatus = 'rejected';
      updateFields = 'status=?, resolved_at=NOW(), resolution_notes=?';
      params.push(newStatus, resolution_notes || '');
    } else if (action === 'escalate') {
      newStatus = 'escalated';
      updateFields = 'status=?, escalated_at=NOW(), escalation_reason=?';
      params.push(newStatus, escalation_reason || '');
    }
    params.push(req.params.id);
    await db.query(`UPDATE service_requests SET ${updateFields} WHERE id=?`, params);
    if (remarks) {
      await db.query('INSERT INTO remarks (entity_type, entity_id, message, created_by) VALUES ("service_request", ?, ?, ?)',
        [req.params.id, remarks, req.user.id]);
    }
    const notifMap = {
      accept: ['Request Accepted', 'Your service request is now being processed.', 'info'],
      resolve: ['Request Resolved', `Your service request has been resolved. ${resolution_notes || ''}`, 'success'],
      reject: ['Request Rejected', `Your service request was rejected. ${resolution_notes || ''}`, 'error'],
      escalate: ['Request Escalated', 'Your service request has been escalated to admin for further action.', 'warning']
    };
    if (notifMap[action]) {
      const [t, m, ty] = notifMap[action];
      await db.query('INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)',
        [req_data.farmer_id, t, m, ty]);
    }
    res.json({ success: true, message: `Service request ${action}d successfully.` });
  } catch (err) { next(err); }
};

module.exports = { getServiceRequests, getServiceRequestById, createServiceRequest, updateServiceRequest };
