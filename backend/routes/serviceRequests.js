const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/serviceRequestController');
const { authenticate, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', authenticate, ctrl.getServiceRequests);
router.get('/:id', authenticate, ctrl.getServiceRequestById);
router.post('/', authenticate, authorize('farmer'), upload.single('media'), ctrl.createServiceRequest);
router.put('/:id/update', authenticate, authorize('employee', 'admin'), ctrl.updateServiceRequest);

module.exports = router;
