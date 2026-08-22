const Message = require('../models/Message');

// GET /api/messages/threads — Logged-in user ke saare real database chat threads
const getThreads = async (req, res) => {
  try {
    const me = req.user._id;

    // Current user ke saare sent/received messages fetch karo
    const messages = await Message.find({
      $or: [{ senderId: me }, { receiverId: me }],
    })
      .sort({ createdAt: -1 })
      .populate('senderId', 'name email avatar photos city country verified role interests travelStyle')
      .populate('receiverId', 'name email avatar photos city country verified role interests travelStyle');

    // Group by conversation partner
    const threadMap = new Map();

    for (const msg of messages) {
      if (!msg.senderId || !msg.receiverId) continue;

      const isMeSender = msg.senderId._id.toString() === me.toString();
      const partner = isMeSender ? msg.receiverId : msg.senderId;
      const partnerId = partner._id.toString();

      if (!threadMap.has(partnerId)) {
        const preview = msg.type === 'image' ? '📷 Photo'
          : msg.type === 'location' ? '📍 Shared Location'
          : msg.type === 'itinerary' ? `✈️ Trip: ${msg.itineraryData?.destination || 'Itinerary'}`
          : msg.type === 'voice' ? '🎤 Voice Note'
          : msg.type === 'document' ? `📄 ${msg.fileName || 'Document'}`
          : msg.content;

        threadMap.set(partnerId, {
          id: `conv_${partnerId}`,
          userId: partnerId,
          user: partner,
          lastMessage: preview,
          lastMessageTime: msg.createdAt,
          unread: (!msg.read && !isMeSender) ? 1 : 0,
          status: 'active',
          compatibility: Math.floor(Math.random() * 20) + 78,
        });
      } else {
        const existing = threadMap.get(partnerId);
        if (!msg.read && !isMeSender) {
          existing.unread = (existing.unread || 0) + 1;
        }
      }
    }

    const threads = Array.from(threadMap.values());
    res.json({ success: true, threads });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/messages/:userId — Dono users ke beech ki conversation
const getConversation = async (req, res) => {
  try {
    const me = req.user._id;
    const other = req.params.userId;

    const messages = await Message.find({
      $or: [
        { senderId: me, receiverId: other },
        { senderId: other, receiverId: me },
      ],
    }).sort({ createdAt: 1 });

    // Mark received messages as read
    await Message.updateMany(
      { senderId: other, receiverId: me, read: false },
      { read: true }
    );

    res.json({ success: true, messages });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/messages — Naya message save karo (REST fallback)
const sendMessage = async (req, res) => {
  try {
    const { receiverId, content, type = 'text', mediaUrl = '', fileName = '', fileSize = '', locationData = null, itineraryData = null } = req.body;
    const msg = await Message.create({
      senderId: req.user._id,
      receiverId,
      content: content || '',
      type,
      mediaUrl,
      fileName,
      fileSize,
      locationData,
      itineraryData,
    });
    res.status(201).json({ success: true, message: msg });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getThreads, getConversation, sendMessage };

