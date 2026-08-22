const express = require('express');
const router = express.Router();
const { protect, isAdmin } = require('../middleware/authMiddleware');
const {
  getStats,
  getAllUsers,
  getAllMessages,
  toggleSuspend,
  toggleVerify,
  changeRole,
  deleteUser,
} = require('../controllers/adminController');

// All admin & management routes: user must be logged in
router.use(protect);

router.get('/stats',              getStats);       // GET  /api/admin/stats
router.get('/users',              getAllUsers);     // GET  /api/admin/users?search=&status=
router.get('/messages',           getAllMessages);  // GET  /api/admin/messages
router.put('/users/:id/suspend',  toggleSuspend);  // PUT  /api/admin/users/:id/suspend
router.put('/users/:id/verify',   toggleVerify);   // PUT  /api/admin/users/:id/verify
router.put('/users/:id/role',     changeRole);     // PUT  /api/admin/users/:id/role
router.delete('/users/:id',       deleteUser);     // DELETE /api/admin/users/:id

module.exports = router;

