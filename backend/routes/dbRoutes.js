const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
  getTables,
  getTableData,
  insertTableData,
  initDatabase
} = require('../controllers/dbController');

// All DB admin endpoints require authentication and admin role
router.use(authenticate, authorize('admin'));

router.get('/tables', getTables);
router.get('/tables/:tableName', getTableData);
router.post('/tables/:tableName/insert', insertTableData);
router.post('/init', initDatabase);

module.exports = router;
