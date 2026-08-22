const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getUserById,
  updateProfile,
  deleteMyAccount,
  sendPhoneOtp,
  verifyPhoneOtp
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

// Sabhi routes protected hain (login zaroori)
router.get('/', protect, getAllUsers);                  // GET /api/users
router.get('/:id', protect, getUserById);               // GET /api/users/:id
router.put('/profile', protect, updateProfile);         // PUT /api/users/profile
router.post('/otp/send', protect, sendPhoneOtp);        // POST /api/users/otp/send
router.post('/otp/verify', protect, verifyPhoneOtp);    // POST /api/users/otp/verify
router.delete('/me', protect, deleteMyAccount);          // DELETE /api/users/me

module.exports = router;
