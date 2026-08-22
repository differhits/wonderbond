const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getMe, googleLogin } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Public routes
router.post('/register', registerUser);  // POST /api/auth/register
router.post('/login', loginUser);         // POST /api/auth/login
router.post('/google', googleLogin);      // POST /api/auth/google

// Protected route (login karna zaroori hai)
router.get('/me', protect, getMe);        // GET /api/auth/me

module.exports = router;
