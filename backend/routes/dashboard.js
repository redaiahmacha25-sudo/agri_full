const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/dashboardController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/admin/stats', authenticate, authorize('admin'), ctrl.getAdminStats);
router.get('/employee/stats', authenticate, authorize('employee'), ctrl.getEmployeeStats);
router.get('/farmer/stats', authenticate, authorize('farmer'), ctrl.getFarmerStats);
router.get('/notifications', authenticate, ctrl.getNotifications);
router.get('/announcements', authenticate, ctrl.getAnnouncements);
router.get('/users', authenticate, authorize('admin'), ctrl.getUsers);

module.exports = router;
  