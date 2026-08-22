const express = require('express');

const router = express.Router();

const {
    login,
    register,
    getProfile
} = require('../controllers/authController');

const {
    authenticate
} = require('../middleware/auth');

// Login
router.post('/login', login);

// Register
router.post('/register', register);

// Profile
router.get('/profile', authenticate, getProfile);

// Test authentication routes
router.get('/test', (req, res) => {
    res.json({
        ok: true,
        message: 'Auth route working'
    });
});

module.exports = router;