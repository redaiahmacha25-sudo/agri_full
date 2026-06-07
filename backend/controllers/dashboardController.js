const db = require('../config/database');

const getAdminStats = async (req, res, next) => {
  try {
    const [[{ totalFarmers }]] = await db.query('SELECT COUNT(*) as totalFarmers FROM users WHERE role="farmer"');
    const [[{ totalEmployees }]] = await db.query('SELECT COUNT(*) as totalEmployees FROM users WHERE role="employee"');
    const [[{ totalSellRequests }]] = await db.query('SELECT COUNT(*) as totalSellRequests FROM sell_requests');
    const [[{ pendingSell }]] = await db.query('SELECT COUNT(*) as pendingSell FROM sell_requests WHERE status="pending"');
    const [[{ verifiedSell }]] = await db.query('SELECT COUNT(*) as verifiedSell FROM sell_requests WHERE status="verified"');
    const [[{ approvedSell }]] = await db.query('SELECT COUNT(*) as approvedSell FROM sell_requests WHERE status="approved"');
    const [[{ completedSell }]] = await db.query('SELECT COUNT(*) as completedSell FROM sell_requests WHERE status IN ("completed","payment_done")');
    const [[{ totalServiceRequests }]] = await db.query('SELECT COUNT(*) as totalServiceRequests FROM service_requests');
    const [[{ pendingService }]] = await db.query('SELECT COUNT(*) as pendingService FROM service_requests WHERE status="pending"');
    const [[{ escalatedService }]] = await db.query('SELECT COUNT(*) as escalatedService FROM service_requests WHERE status="escalated"');
    const [[{ totalPayments }]] = await db.query('SELECT COALESCE(SUM(payment_amount),0) as totalPayments FROM sell_requests WHERE payment_status="done"');
    const [recentActivity] = await db.query(`
      SELECT 'sell' as type, id, status, created_at FROM sell_requests
      UNION ALL
      SELECT 'service' as type, id, status, created_at FROM service_requests
      ORDER BY created_at DESC LIMIT 10`);
    const [cropStats] = await db.query(`
      SELECT c.name, COUNT(sr.id) as requests, SUM(sr.quantity) as total_qty
      FROM sell_requests sr JOIN crops c ON sr.crop_id = c.id
      GROUP BY c.id, c.name ORDER BY requests DESC LIMIT 6`);
    res.json({
      success: true,
      stats: { totalFarmers, totalEmployees, totalSellRequests, pendingSell, verifiedSell, approvedSell, completedSell,
               totalServiceRequests, pendingService, escalatedService, totalPayments },
      recentActivity, cropStats
    });
  } catch (err) { next(err); }
};

const getEmployeeStats = async (req, res, next) => {
  try {
    const id = req.user.id;
    const [[{ pending }]] = await db.query('SELECT COUNT(*) as pending FROM sell_requests WHERE status="pending"');
    const [[{ verified }]] = await db.query('SELECT COUNT(*) as verified FROM sell_requests WHERE verified_by=?', [id]);
    const [[{ serviceAssigned }]] = await db.query('SELECT COUNT(*) as serviceAssigned FROM service_requests WHERE handled_by=?', [id]);
    const [[{ serviceResolved }]] = await db.query('SELECT COUNT(*) as serviceResolved FROM service_requests WHERE handled_by=? AND status="resolved"', [id]);
    const [recentSell] = await db.query(`
      SELECT sr.*, u.name as farmer_name, c.name as crop_name
      FROM sell_requests sr JOIN users u ON sr.farmer_id=u.id JOIN crops c ON sr.crop_id=c.id
      WHERE sr.status="pending" ORDER BY sr.created_at DESC LIMIT 5`);
    res.json({ success: true, stats: { pending, verified, serviceAssigned, serviceResolved }, recentSell });
  } catch (err) { next(err); }
};

const getFarmerStats = async (req, res, next) => {
  try {
    const id = req.user.id;
    const [[{ totalSell }]] = await db.query('SELECT COUNT(*) as totalSell FROM sell_requests WHERE farmer_id=?', [id]);
    const [[{ pendingSell }]] = await db.query('SELECT COUNT(*) as pendingSell FROM sell_requests WHERE farmer_id=? AND status="pending"', [id]);
    const [[{ approvedSell }]] = await db.query('SELECT COUNT(*) as approvedSell FROM sell_requests WHERE farmer_id=? AND status IN ("approved","scheduled")', [id]);
    const [[{ completedSell }]] = await db.query('SELECT COUNT(*) as completedSell FROM sell_requests WHERE farmer_id=? AND status IN ("completed","payment_done")', [id]);
    const [[{ totalEarned }]] = await db.query('SELECT COALESCE(SUM(payment_amount),0) as totalEarned FROM sell_requests WHERE farmer_id=? AND payment_status="done"', [id]);
    const [[{ totalService }]] = await db.query('SELECT COUNT(*) as totalService FROM service_requests WHERE farmer_id=?', [id]);
    const [recentSell] = await db.query(`
      SELECT sr.*, c.name as crop_name, c.govt_price FROM sell_requests sr
      JOIN crops c ON sr.crop_id=c.id WHERE sr.farmer_id=? ORDER BY sr.created_at DESC LIMIT 5`, [id]);
    const [announcements] = await db.query(`
      SELECT * FROM announcements WHERE is_active=1 AND (target_role="all" OR target_role="farmer")
      AND (expires_at IS NULL OR expires_at >= CURDATE()) ORDER BY created_at DESC LIMIT 3`);
    res.json({ success: true, stats: { totalSell, pendingSell, approvedSell, completedSell, totalEarned, totalService }, recentSell, announcements });
  } catch (err) { next(err); }
};

const getNotifications = async (req, res, next) => {
  try {
    const [notifications] = await db.query('SELECT * FROM notifications WHERE user_id=? ORDER BY created_at DESC LIMIT 20', [req.user.id]);
    await db.query('UPDATE notifications SET is_read=1 WHERE user_id=? AND is_read=0', [req.user.id]);
    res.json({ success: true, notifications });
  } catch (err) { next(err); }
};

const getAnnouncements = async (req, res, next) => {
  try {
    const role = req.user.role;
    const [announcements] = await db.query(
      'SELECT a.*, u.name as created_by_name FROM announcements a JOIN users u ON a.created_by=u.id WHERE a.is_active=1 AND (a.target_role="all" OR a.target_role=?) AND (a.expires_at IS NULL OR a.expires_at >= CURDATE()) ORDER BY a.created_at DESC',
      [role]
    );
    res.json({ success: true, announcements });
  } catch (err) { next(err); }
};

const getUsers = async (req, res, next) => {
  try {
    const { role } = req.query;
    let query = 'SELECT id, name, phone, email, role, village, district, is_active, created_at FROM users';
    const params = [];
    if (role) { query += ' WHERE role=?'; params.push(role); }
    query += ' ORDER BY created_at DESC';
    const [users] = await db.query(query, params);
    res.json({ success: true, users });
  } catch (err) { next(err); }
};

module.exports = { getAdminStats, getEmployeeStats, getFarmerStats, getNotifications, getAnnouncements, getUsers };
