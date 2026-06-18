const express = require('express');
const router = express.Router();
const { getAllCrops, getCropById, createCrop, updateCrop } = require('../controllers/cropController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, getAllCrops);
router.get('/:id', authenticate, getCropById);
router.post('/', authenticate, authorize('admin'), createCrop);
router.put('/:id', authenticate, authorize('admin'), updateCrop);

module.exports = router;

