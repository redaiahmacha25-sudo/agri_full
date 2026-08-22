const db = require('../config/database');

// =====================================================
// ADMIN STATS
// =====================================================
const getAdminStats = async (req, res, next) => {
  try {
    const totalfarmers = await db.query(
      "SELECT COUNT(*)::int AS totalfarmers FROM users WHERE role = 'farmer'"
    );

    const totalemployees = await db.query(
      "SELECT COUNT(*)::int AS totalemployees FROM users WHERE role = 'employee'"
    );

    const totalsellrequests = await db.query(
      'SELECT COUNT(*)::int AS totalsellrequests FROM sell_requests'
    );

    const pendingsell = await db.query(
      "SELECT COUNT(*)::int AS pendingsell FROM sell_requests WHERE status = 'pending'"
    );

    const verifiedsell = await db.query(
      "SELECT COUNT(*)::int AS verifiedsell FROM sell_requests WHERE status = 'verified'"
    );

    const approvedsell = await db.query(
      "SELECT COUNT(*)::int AS approvedsell FROM sell_requests WHERE status = 'approved'"
    );

    const completedsell = await db.query(`
      SELECT COUNT(*)::int AS completedsell
      FROM sell_requests
      WHERE status IN ('completed', 'payment_done')
    `);

    const totalservicerequests = await db.query(
      'SELECT COUNT(*)::int AS totalservicerequests FROM service_requests'
    );

    const pendingservice = await db.query(
      "SELECT COUNT(*)::int AS pendingservice FROM service_requests WHERE status = 'pending'"
    );

    const escalatedservice = await db.query(
      "SELECT COUNT(*)::int AS escalatedservice FROM service_requests WHERE status = 'escalated'"
    );

    const totalpayments = await db.query(`
      SELECT COALESCE(SUM(payment_amount), 0)::numeric AS totalpayments
      FROM sell_requests
      WHERE payment_status = 'done'
    `);

    // Recent activity
    const recentActivityResult = await db.query(`
      SELECT
        'sell' AS type,
        id,
        status,
        created_at
      FROM sell_requests

      UNION ALL

      SELECT
        'service' AS type,
        id,
        status,
        created_at
      FROM service_requests

      ORDER BY created_at DESC
      LIMIT 10
    `);

    // Crop statistics
    const cropStatsResult = await db.query(`
      SELECT
        c.name,
        COUNT(sr.id)::int AS requests,
        COALESCE(SUM(sr.quantity), 0)::numeric AS total_qty
      FROM sell_requests sr
      JOIN crops c ON sr.crop_id = c.id
      GROUP BY c.id, c.name
      ORDER BY requests DESC
      LIMIT 6
    `);

    res.json({
      success: true,

      stats: {
        totalFarmers: totalfarmers.rows[0].totalfarmers || 0,
        totalEmployees: totalemployees.rows[0].totalemployees || 0,
        totalSellRequests: totalsellrequests.rows[0].totalsellrequests || 0,
        pendingSell: pendingsell.rows[0].pendingsell || 0,
        verifiedSell: verifiedsell.rows[0].verifiedsell || 0,
        approvedSell: approvedsell.rows[0].approvedsell || 0,
        completedSell: completedsell.rows[0].completedsell || 0,

        totalServiceRequests:
          totalservicerequests.rows[0].totalservicerequests || 0,

        pendingService:
          pendingservice.rows[0].pendingservice || 0,

        escalatedService:
          escalatedservice.rows[0].escalatedservice || 0,

        totalPayments:
          totalpayments.rows[0].totalpayments || 0
      },

      recentActivity: recentActivityResult.rows,
      cropStats: cropStatsResult.rows
    });

  } catch (err) {
    next(err);
  }
};


// =====================================================
// EMPLOYEE STATS
// =====================================================
const getEmployeeStats = async (req, res, next) => {
  try {
    const id = req.user.id;

    const pendingResult = await db.query(
      "SELECT COUNT(*)::int AS pending FROM sell_requests WHERE status = 'pending'"
    );

    const verifiedResult = await db.query(
      `
      SELECT COUNT(*)::int AS verified
      FROM sell_requests
      WHERE verified_by = $1
      `,
      [id]
    );

    const serviceAssignedResult = await db.query(
      `
      SELECT COUNT(*)::int AS serviceassigned
      FROM service_requests
      WHERE handled_by = $1
      `,
      [id]
    );

    const serviceResolvedResult = await db.query(
      `
      SELECT COUNT(*)::int AS serviceresolved
      FROM service_requests
      WHERE handled_by = $1
        AND status = 'resolved'
      `,
      [id]
    );

    const recentSellResult = await db.query(
      `
      SELECT
        sr.*,
        u.name AS farmer_name,
        c.name AS crop_name
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
        pending: pendingResult.rows[0].pending || 0,
        verified: verifiedResult.rows[0].verified || 0,
        serviceAssigned:
          serviceAssignedResult.rows[0].serviceassigned || 0,
        serviceResolved:
          serviceResolvedResult.rows[0].serviceresolved || 0
      },

      recentSell: recentSellResult.rows
    });

  } catch (err) {
    next(err);
  }
};


// =====================================================
// FARMER STATS
// =====================================================
const getFarmerStats = async (req, res, next) => {
  try {
    const id = req.user.id;

    const totalsellResult = await db.query(
      `
      SELECT COUNT(*)::int AS totalsell
      FROM sell_requests
      WHERE farmer_id = $1
      `,
      [id]
    );

    const pendingsellResult = await db.query(
      `
      SELECT COUNT(*)::int AS pendingsell
      FROM sell_requests
      WHERE farmer_id = $1
        AND status = 'pending'
      `,
      [id]
    );

    const approvedsellResult = await db.query(
      `
      SELECT COUNT(*)::int AS approvedsell
      FROM sell_requests
      WHERE farmer_id = $1
        AND status IN ('approved', 'scheduled')
      `,
      [id]
    );

    const completedsellResult = await db.query(
      `
      SELECT COUNT(*)::int AS completedsell
      FROM sell_requests
      WHERE farmer_id = $1
        AND status IN ('completed', 'payment_done')
      `,
      [id]
    );

    const totalearnedResult = await db.query(
      `
      SELECT COALESCE(SUM(payment_amount), 0)::numeric AS totalearned
      FROM sell_requests
      WHERE farmer_id = $1
        AND payment_status = 'done'
      `,
      [id]
    );

    const totalserviceResult = await db.query(
      `
      SELECT COUNT(*)::int AS totalservice
      FROM service_requests
      WHERE farmer_id = $1
      `,
      [id]
    );

    const recentSellResult = await db.query(
      `
      SELECT
        sr.*,
        c.name AS crop_name,
        c.govt_price
      FROM sell_requests sr
      JOIN crops c ON sr.crop_id = c.id
      WHERE sr.farmer_id = $1
      ORDER BY sr.created_at DESC
      LIMIT 5
      `,
      [id]
    );

    const announcementsResult = await db.query(`
      SELECT *
      FROM announcements
      WHERE is_active = TRUE
        AND (target_role = 'all' OR target_role = 'farmer')
        AND (
          expires_at IS NULL
          OR expires_at >= CURRENT_DATE
        )
      ORDER BY created_at DESC
      LIMIT 3
    `);

    res.json({
      success: true,

      stats: {
        totalSell: totalsellResult.rows[0].totalsell || 0,
        pendingSell: pendingsellResult.rows[0].pendingsell || 0,
        approvedSell: approvedsellResult.rows[0].approvedsell || 0,
        completedSell: completedsellResult.rows[0].completedsell || 0,
        totalEarned: totalearnedResult.rows[0].totalearned || 0,
        totalService: totalserviceResult.rows[0].totalservice || 0
      },

      recentSell: recentSellResult.rows,
      announcements: announcementsResult.rows
    });

  } catch (err) {
    next(err);
  }
};


// =====================================================
// GET NOTIFICATIONS
// =====================================================
const getNotifications = async (req, res, next) => {
  try {
    const notificationsResult = await db.query(
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
      WHERE user_id = $1
        AND is_read = FALSE
      `,
      [req.user.id]
    );

    res.json({
      success: true,
      notifications: notificationsResult.rows
    });

  } catch (err) {
    next(err);
  }
};


// =====================================================
// GET ANNOUNCEMENTS
// =====================================================
const getAnnouncements = async (req, res, next) => {
  try {
    const role = req.user.role;

    const announcementsResult = await db.query(
      `
      SELECT
        a.*,
        u.name AS created_by_name
      FROM announcements a
      JOIN users u ON a.created_by = u.id
      WHERE a.is_active = TRUE
        AND (
          a.target_role = 'all'
          OR a.target_role = $1::target_role
        )
        AND (
          a.expires_at IS NULL
          OR a.expires_at >= CURRENT_DATE
        )
      ORDER BY a.created_at DESC
      `,
      [role]
    );

    res.json({
      success: true,
      announcements: announcementsResult.rows
    });

  } catch (err) {
    next(err);
  }
};


// =====================================================
// GET USERS
// =====================================================
const getUsers = async (req, res, next) => {
  try {
    const { role } = req.query;

    let queryStr = `
      SELECT
        id,
        name,
        phone,
        email,
        role,
        village,
        district,
        is_active,
        created_at
      FROM users
    `;

    const params = [];

    if (role) {
      queryStr += ' WHERE role = $1::user_role';
      params.push(role);
    }

    queryStr += ' ORDER BY created_at DESC';

    const usersResult = await db.query(queryStr, params);

    res.json({
      success: true,
      users: usersResult.rows
    });

  } catch (err) {
    next(err);
  }
};


// =====================================================
// EXPORT
// =====================================================
module.exports = {
  getAdminStats,
  getEmployeeStats,
  getFarmerStats,
  getNotifications,
  getAnnouncements,
  getUsers
};