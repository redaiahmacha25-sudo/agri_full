const express = require('express');
const router = express.Router();
const { login, register, getProfile } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

router.post('/login', login);
router.post('/login', (req, res) => {
  console.log("🔥 LOGIN ROUTE HIT");
  res.json({ ok: true });
});
router.post('/register', register);
router.get('/profile', authenticate, getProfile);

module.exports = router;
