const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/sellRequestController');
const { authenticate, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', authenticate, ctrl.getSellRequests);
router.get('/:id', authenticate, ctrl.getSellRequestById);
router.post('/', authenticate, authorize('farmer'), upload.single('image'), ctrl.createSellRequest);
router.put('/:id/verify', authenticate, authorize('employee'), ctrl.verifySellRequest);
router.put('/:id/approve', authenticate, authorize('admin'), ctrl.approveSellRequest);
router.put('/:id/payment', authenticate, authorize('admin'), ctrl.markPaymentDone);

module.exports = router;

