const User = require('../models/User');
const Message = require('../models/Message');

// @route   GET /api/admin/stats
// @access  Admin
const getStats = async (req, res) => {
  try {
    const totalUsers     = await User.countDocuments();
    const activeUsers    = await User.countDocuments({ isActive: true });
    const verifiedUsers  = await User.countDocuments({ verified: true });
    const pendingVerify  = await User.countDocuments({ verified: false, onboardingDone: true });
    const totalMessages  = await Message.countDocuments();
    const newUsersToday  = await User.countDocuments({
      createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
    });

    // Last 7 days user registrations
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const dailySignups = await User.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      success: true,
      stats: {
        totalUsers,
        activeUsers,
        verifiedUsers,
        pendingVerify,
        totalMessages,
        newUsersToday,
        dailySignups,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route   GET /api/admin/users
// @access  Admin
const getAllUsers = async (req, res) => {
  try {
    const { search, status } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } },
      ];
    }
    if (status === 'suspended') query.isActive = false;
    if (status === 'active')    query.isActive = true;
    if (status === 'verified')  query.verified = true;
    if (status === 'unverified') query.verified = false;

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route   PUT /api/admin/users/:id/suspend
// @access  Admin
const toggleSuspend = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Prevent suspending yourself
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot suspend your own account' });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.json({
      success: true,
      message: user.isActive ? 'User unsuspended' : 'User suspended',
      user,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route   PUT /api/admin/users/:id/verify
// @access  Admin
const toggleVerify = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.verified = !user.verified;
    await user.save();

    // Real-time notification — agar user online hai
    try {
      const { getIO, getOnlineUsers } = require('../server');
      const io = getIO();
      const onlineUsers = getOnlineUsers();
      const targetSocketId = onlineUsers.get(user._id.toString());
      if (io && targetSocketId) {
        io.to(targetSocketId).emit('user:verified', { verified: user.verified });
      }
    } catch (e) {
      // socket emit fail hone pe response block nahi hoga
    }

    res.json({
      success: true,
      message: user.verified ? 'User verified ✅' : 'Verification removed',
      user,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// @route   PUT /api/admin/users/:id/role
// @access  Admin
const changeRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select('-password');

    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route   DELETE /api/admin/users/:id
// @access  Admin
const deleteUser = async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route   GET /api/admin/messages
// @access  Admin
const getAllMessages = async (req, res) => {
  try {
    const messages = await Message.find()
      .populate('senderId', 'name avatar photos email')
      .populate('receiverId', 'name avatar photos email')
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({ success: true, messages, count: messages.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getStats, getAllUsers, getAllMessages, toggleSuspend, toggleVerify, changeRole, deleteUser };

