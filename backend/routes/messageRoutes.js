const express = require('express');
const router = express.Router();
const { getThreads, getConversation, sendMessage } = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');

router.get('/threads', protect, getThreads);          // GET /api/messages/threads
router.get('/:userId', protect, getConversation);   // GET /api/messages/:userId
router.post('/', protect, sendMessage);              // POST /api/messages

module.exports = router;
