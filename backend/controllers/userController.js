const User = require('../models/User');

// @route   GET /api/users
// @desc    Discover ke liye saare users (current user ko chhod ke)
// @access  Protected
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({
      _id: { $ne: req.user._id }, // apne aap ko mat dikhaao
      isActive: true,
      onboardingDone: true,        // sirf jinhoNe onboarding complete ki ho
    }).select('-password');

    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route   GET /api/users/:id
// @desc    Kisi ek user ki full profile
// @access  Protected
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route   PUT /api/users/profile
// @desc    Apna profile update karo (onboarding + edit profile)
// @access  Protected
const updateProfile = async (req, res) => {
  try {
    const allowedFields = [
      'name', 'bio', 'avatar', 'photos',
      'age', 'gender', 'nationality', 'city', 'phone',
      'travelStyle', 'budget', 'interests', 'languages',
      'onboardingDone', 'phoneVerified', 'idVerified', 'idDocumentType', 'verified',
    ];

    const updates = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route   POST /api/users/otp/send
// @desc    Generate real dynamic 6-digit OTP and store on user
// @access  Protected
const sendPhoneOtp = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone || phone.trim().length < 8) {
      return res.status(400).json({ message: 'Valid phone number is required' });
    }

    // Generate random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

    await User.findByIdAndUpdate(
      req.user._id,
      {
        phone: phone.trim(),
        phoneOtp: otp,
        phoneOtpExpires: expiresAt,
      },
      { new: true }
    );

    console.log(`📱 Real Phone OTP generated for ${phone}: ${otp}`);

    res.json({
      success: true,
      message: `OTP sent successfully to ${phone}`,
      otp: otp,
      phone: phone.trim(),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route   POST /api/users/otp/verify
// @desc    Verify 6-digit phone OTP
// @access  Protected
const verifyPhoneOtp = async (req, res) => {
  try {
    const { otp, phone } = req.body;
    if (!otp) {
      return res.status(400).json({ message: 'OTP code is required' });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (!user.phoneOtp || user.phoneOtp !== String(otp).trim()) {
      return res.status(400).json({ message: 'Invalid OTP code. Please check and try again.' });
    }

    if (user.phoneOtpExpires && new Date() > new Date(user.phoneOtpExpires)) {
      return res.status(400).json({ message: 'OTP code has expired. Please request a new code.' });
    }

    user.phoneVerified = true;
    if (phone) user.phone = phone.trim();
    user.phoneOtp = null;
    user.phoneOtpExpires = null;
    await user.save();

    res.json({
      success: true,
      message: 'Phone verified successfully! ✅',
      user,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route   DELETE /api/users/me
// @desc    Apna account permanently delete karo
// @access  Protected
const deleteMyAccount = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.user._id);
    res.json({ success: true, message: 'Account deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getAllUsers, getUserById, updateProfile, deleteMyAccount, sendPhoneOtp, verifyPhoneOtp };
