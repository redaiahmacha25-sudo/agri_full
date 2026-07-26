const db = require('../config/database');

const getAdminStats = async (req, res, next) => {
  try {
    const [[{ totalfarmers }]] = await db.query(
      "SELECT COUNT(*)::int as totalfarmers FROM users WHERE role = 'farmer'"
    );

    const [[{ totalemployees }]] = await db.query(
      "SELECT COUNT(*)::int as totalemployees FROM users WHERE role = 'employee'"
    );

    const [[{ totalsellrequests }]] = await db.query(
      'SELECT COUNT(*)::int as totalsellrequests FROM sell_requests'
    );

    const [[{ pendingsell }]] = await db.query(
      "SELECT COUNT(*)::int as pendingsell FROM sell_requests WHERE status = 'pending'"
    );

    const [[{ verifiedsell }]] = await db.query(
      "SELECT COUNT(*)::int as verifiedsell FROM sell_requests WHERE status = 'verified'"
    );

    const [[{ approvedsell }]] = await db.query(
      "SELECT COUNT(*)::int as approvedsell FROM sell_requests WHERE status = 'approved'"
    );

    const [[{ completedsell }]] = await db.query(
      `
      SELECT COUNT(*)::int as completedsell 
      FROM sell_requests 
      WHERE status IN ('completed', 'payment_done')
      `
    );

    const [[{ totalservicerequests }]] = await db.query(
      'SELECT COUNT(*)::int as totalservicerequests FROM service_requests'
    );

    const [[{ pendingservice }]] = await db.query(
      "SELECT COUNT(*)::int as pendingservice FROM service_requests WHERE status = 'pending'"
    );

    const [[{ escalatedservice }]] = await db.query(
      "SELECT COUNT(*)::int as escalatedservice FROM service_requests WHERE status = 'escalated'"
    );

    const [[{ totalpayments }]] = await db.query(
      `
      SELECT COALESCE(SUM(payment_amount), 0)::numeric as totalpayments
      FROM sell_requests
      WHERE payment_status = 'done'
      `
    );

    const [recentActivity] = await db.query(
      `
      SELECT 'sell' as type, id, status, created_at
      FROM sell_requests
      UNION ALL
      SELECT 'service' as type, id, status, created_at
      FROM service_requests
      ORDER BY created_at DESC
      LIMIT 10
      `
    );

    const [cropStats] = await db.query(
      `
      SELECT 
        c.name,
        COUNT(sr.id)::int as requests,
        SUM(sr.quantity)::numeric as total_qty
      FROM sell_requests sr
      JOIN crops c ON sr.crop_id = c.id
      GROUP BY c.id, c.name
      ORDER BY requests DESC
      LIMIT 6
      `
    );

    res.json({
      success: true,
      stats: {
        totalFarmers: totalfarmers || 0,
        totalEmployees: totalemployees || 0,
        totalSellRequests: totalsellrequests || 0,
        pendingSell: pendingsell || 0,
        verifiedSell: verifiedsell || 0,
        approvedSell: approvedsell || 0,
        completedSell: completedsell || 0,
        totalServiceRequests: totalservicerequests || 0,
        pendingService: pendingservice || 0,
        escalatedService: escalatedservice || 0,
        totalPayments: totalpayments || 0
      },
      recentActivity,
      cropStats
    });

  } catch (err) {
    next(err);
  }
};

const getEmployeeStats = async (req, res, next) => {
  try {
    const id = req.user.id;

    const [[{ pending }]] = await db.query(
      "SELECT COUNT(*)::int as pending FROM sell_requests WHERE status = 'pending'"
    );

    const [[{ verified }]] = await db.query(
      'SELECT COUNT(*)::int as verified FROM sell_requests WHERE verified_by = $1',
      [id]
    );

    const [[{ serviceassigned }]] = await db.query(
      'SELECT COUNT(*)::int as serviceassigned FROM service_requests WHERE handled_by = $1',
      [id]
    );

    const [[{ serviceresolved }]] = await db.query(
      `
      SELECT COUNT(*)::int as serviceresolved
      FROM service_requests
      WHERE handled_by = $1 AND status = 'resolved'
      `,
      [id]
    );

    const [recentSell] = await db.query(
      `
      SELECT 
        sr.*,
        u.name as farmer_name,
        c.name as crop_name
      FROM sell_requests sr
      JOIN users u ON sr.farmer_id = u.id
      JOIN crops c ON sr.crop_id = c.id
      WHERE sr.status = 'pending'
      ORDER BY sr.created_at DESC
      LIMIT 5
      `
    );

    res.json({
      success: true,
      stats: {
        pending: pending || 0,
        verified: verified || 0,
        serviceAssigned: serviceassigned || 0,
        serviceResolved: serviceresolved || 0
      },
      recentSell
    });

  } catch (err) {
    next(err);
  }
};

const getFarmerStats = async (req, res, next) => {
  try {
    const id = req.user.id;

    const [[{ totalsell }]] = await db.query(
      'SELECT COUNT(*)::int as totalsell FROM sell_requests WHERE farmer_id = $1',
      [id]
    );

    const [[{ pendingsell }]] = await db.query(
      `
      SELECT COUNT(*)::int as pendingsell 
      FROM sell_requests 
      WHERE farmer_id = $1 AND status = 'pending'
      `,
      [id]
    );

    const [[{ approvedsell }]] = await db.query(
      `
      SELECT COUNT(*)::int as approvedsell
      FROM sell_requests
      WHERE farmer_id = $1 AND status IN ('approved', 'scheduled')
      `,
      [id]
    );

    const [[{ completedsell }]] = await db.query(
      `
      SELECT COUNT(*)::int as completedsell
      FROM sell_requests
      WHERE farmer_id = $1 AND status IN ('completed', 'payment_done')
      `,
      [id]
    );

    const [[{ totalearned }]] = await db.query(
      `
      SELECT COALESCE(SUM(payment_amount), 0)::numeric as totalearned
      FROM sell_requests
      WHERE farmer_id = $1 AND payment_status = 'done'
      `,
      [id]
    );

    const [[{ totalservice }]] = await db.query(
      `
      SELECT COUNT(*)::int as totalservice
      FROM service_requests
      WHERE farmer_id = $1
      `,
      [id]
    );

    const [recentSell] = await db.query(
      `
      SELECT 
        sr.*,
        c.name as crop_name,
        c.govt_price
      FROM sell_requests sr
      JOIN crops c ON sr.crop_id = c.id
      WHERE sr.farmer_id = $1
      ORDER BY sr.created_at DESC
      LIMIT 5
      `,
      [id]
    );

    const [announcements] = await db.query(
      `
      SELECT *
      FROM announcements
      WHERE is_active = TRUE
        AND (target_role = 'all' OR target_role = 'farmer')
        AND (expires_at IS NULL OR expires_at >= CURRENT_DATE)
      ORDER BY created_at DESC
      LIMIT 3
      `
    );

    res.json({
      success: true,
      stats: {
        totalSell: totalsell || 0,
        pendingSell: pendingsell || 0,
        approvedSell: approvedsell || 0,
        completedSell: completedsell || 0,
        totalEarned: totalearned || 0,
        totalService: totalservice || 0
      },
      recentSell,
      announcements
    });

  } catch (err) {
    next(err);
  }
};

const getNotifications = async (req, res, next) => {
  try {
    const [notifications] = await db.query(
      `
      SELECT *
      FROM notifications
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 20
      `,
      [req.user.id]
    );

    await db.query(
      `
      UPDATE notifications
      SET is_read = TRUE
      WHERE user_id = $1 AND is_read = FALSE
      `,
      [req.user.id]
    );

    res.json({
      success: true,
      notifications
    });

  } catch (err) {
    next(err);
  }
};

const getAnnouncements = async (req, res, next) => {
  try {
    const role = req.user.role;

    const [announcements] = await db.query(
      `
      SELECT 
        a.*,
        u.name as created_by_name
      FROM announcements a
      JOIN users u ON a.created_by = u.id
      WHERE a.is_active = TRUE
        AND (a.target_role = 'all' OR a.target_role = $1::target_role)
        AND (a.expires_at IS NULL OR a.expires_at >= CURRENT_DATE)
      ORDER BY a.created_at DESC
      `,
      [role]
    );

    res.json({
      success: true,
      announcements
    });

  } catch (err) {
    next(err);
  }
};

const getUsers = async (req, res, next) => {
  try {
    const { role } = req.query;

    let queryStr = `
      SELECT 
        id, name, phone, email, role,
        village, district, is_active, created_at
      FROM users
    `;

    const params = [];

    if (role) {
      queryStr += ' WHERE role = $1::user_role';
      params.push(role);
    }

    queryStr += ' ORDER BY created_at DESC';

    const [users] = await db.query(queryStr, params);

    res.json({
      success: true,
      users
    });

  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAdminStats,
  getEmployeeStats,
  getFarmerStats,
  getNotifications,
  getAnnouncements,
  getUsers
};