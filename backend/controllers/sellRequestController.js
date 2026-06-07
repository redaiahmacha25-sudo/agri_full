const db = require('../config/database');

const getSellRequests = async (req, res, next) => {
  try {
    const { role, id } = req.user;
    let query = `
      SELECT sr.*, u.name as farmer_name, u.phone as farmer_phone, u.village as farmer_village,
             c.name as crop_name, c.govt_price, c.unit,
             v.name as verifier_name, a.name as approver_name
      FROM sell_requests sr
      JOIN users u ON sr.farmer_id = u.id
      JOIN crops c ON sr.crop_id = c.id
      LEFT JOIN users v ON sr.verified_by = v.id
      LEFT JOIN users a ON sr.approved_by = a.id
    `;
    const params = [];
    if (role === 'farmer') { query += ' WHERE sr.farmer_id = ?'; params.push(id); }
    else if (role === 'employee') { query += ' WHERE sr.status IN ("pending","verified","rejected") OR sr.verified_by = ?'; params.push(id); }
    query += ' ORDER BY sr.created_at DESC';
    const [requests] = await db.query(query, params);
    res.json({ success: true, requests });
  } catch (err) { next(err); }
};

const getSellRequestById = async (req, res, next) => {
  try {
    const [rows] = await db.query(`
      SELECT sr.*, u.name as farmer_name, u.phone as farmer_phone, u.village as farmer_village,
             c.name as crop_name, c.govt_price, c.unit,
             v.name as verifier_name, a.name as approver_name
      FROM sell_requests sr
      JOIN users u ON sr.farmer_id = u.id
      JOIN crops c ON sr.crop_id = c.id
      LEFT JOIN users v ON sr.verified_by = v.id
      LEFT JOIN users a ON sr.approved_by = a.id
      WHERE sr.id = ?`, [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Request not found.' });
    const [remarks] = await db.query(`
      SELECT r.*, u.name as author FROM remarks r
      JOIN users u ON r.created_by = u.id
      WHERE r.entity_type = 'sell_request' AND r.entity_id = ?
      ORDER BY r.created_at ASC`, [req.params.id]);
    res.json({ success: true, request: rows[0], remarks });
  } catch (err) { next(err); }
};

const createSellRequest = async (req, res, next) => {
  try {
    const { crop_id, quantity, village, harvest_date, notes, geo_lat, geo_lng } = req.body;
    if (!crop_id || !quantity) return res.status(400).json({ success: false, message: 'Crop and quantity required.' });
    const image_url = req.file ? `/uploads/${req.file.filename}` : null;
    const [result] = await db.query(
      'INSERT INTO sell_requests (farmer_id, crop_id, quantity, image_url, village, harvest_date, notes, geo_lat, geo_lng) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [req.user.id, crop_id, quantity, image_url, village || null, harvest_date || null, notes || null, geo_lat || null, geo_lng || null]
    );
    await db.query('INSERT INTO notifications (user_id, title, message, type) SELECT id, "New Sell Request", "A new sell request requires verification.", "info" FROM users WHERE role = "employee"');
    res.status(201).json({ success: true, message: 'Sell request submitted successfully.', id: result.insertId });
  } catch (err) { next(err); }
};

const verifySellRequest = async (req, res, next) => {
  try {
    const { action, rejection_reason, remarks } = req.body;
    const [rows] = await db.query('SELECT * FROM sell_requests WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Request not found.' });
    if (rows[0].status !== 'pending') return res.status(400).json({ success: false, message: 'Request already processed.' });
    const newStatus = action === 'verify' ? 'verified' : 'rejected';
    await db.query(
      'UPDATE sell_requests SET status=?, verified_by=?, verified_at=NOW(), rejection_reason=? WHERE id=?',
      [newStatus, req.user.id, rejection_reason || null, req.params.id]
    );
    if (remarks) {
      await db.query('INSERT INTO remarks (entity_type, entity_id, message, created_by) VALUES ("sell_request", ?, ?, ?)',
        [req.params.id, remarks, req.user.id]);
    }
    const msg = action === 'verify' ? 'Your sell request has been verified and forwarded for approval.' : `Your sell request was rejected. Reason: ${rejection_reason}`;
    await db.query('INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)',
      [rows[0].farmer_id, `Sell Request ${action === 'verify' ? 'Verified' : 'Rejected'}`, msg, action === 'verify' ? 'success' : 'error']);
    res.json({ success: true, message: `Request ${newStatus} successfully.` });
  } catch (err) { next(err); }
};

const approveSellRequest = async (req, res, next) => {
  try {
    const { action, procurement_date, rejection_reason, remarks } = req.body;
    const [rows] = await db.query('SELECT * FROM sell_requests WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Request not found.' });
    if (rows[0].status !== 'verified') return res.status(400).json({ success: false, message: 'Request must be verified first.' });
    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    await db.query(
      'UPDATE sell_requests SET status=?, approved_by=?, approved_at=NOW(), procurement_date=?, rejection_reason=? WHERE id=?',
      [newStatus, req.user.id, procurement_date || null, rejection_reason || null, req.params.id]
    );
    if (action === 'approve' && procurement_date) {
      await db.query('INSERT INTO procurement (request_id, schedule_date) VALUES (?, ?)', [req.params.id, procurement_date]);
    }
    if (remarks) {
      await db.query('INSERT INTO remarks (entity_type, entity_id, message, created_by) VALUES ("sell_request", ?, ?, ?)',
        [req.params.id, remarks, req.user.id]);
    }
    const msg = action === 'approve' ? `Your sell request has been approved. Procurement scheduled on ${procurement_date}.` : `Admin rejected your sell request. Reason: ${rejection_reason}`;
    await db.query('INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)',
      [rows[0].farmer_id, `Sell Request ${action === 'approve' ? 'Approved' : 'Rejected'}`, msg, action === 'approve' ? 'success' : 'error']);
    res.json({ success: true, message: `Request ${newStatus} successfully.` });
  } catch (err) { next(err); }
};

const markPaymentDone = async (req, res, next) => {
  try {
    const { payment_amount, transaction_ref } = req.body;
    const [rows] = await db.query('SELECT * FROM sell_requests WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Request not found.' });
    await db.query(
      'UPDATE sell_requests SET status="payment_done", payment_status="done", payment_amount=?, transaction_ref=?, payment_date=NOW() WHERE id=?',
      [payment_amount, transaction_ref, req.params.id]
    );
    await db.query('UPDATE procurement SET payment_status="done", payment_amount=?, transaction_ref=?, payment_date=NOW() WHERE request_id=?',
      [payment_amount, transaction_ref, req.params.id]);
    await db.query('INSERT INTO notifications (user_id, title, message, type) VALUES (?, "Payment Processed", ?, "success")',
      [rows[0].farmer_id, `Payment of ₹${payment_amount} has been credited. Ref: ${transaction_ref}`]);
    res.json({ success: true, message: 'Payment marked successfully.' });
  } catch (err) { next(err); }
};

module.exports = { getSellRequests, getSellRequestById, createSellRequest, verifySellRequest, approveSellRequest, markPaymentDone };
