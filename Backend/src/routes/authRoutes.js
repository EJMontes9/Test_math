const express = require('express');
const router = express.Router();
const { login, loginValidation, getMe } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', loginValidation, login);

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', authenticate, getMe);

module.exports = router;
