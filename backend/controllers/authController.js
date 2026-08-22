const jwt = require('jsonwebtoken');
const User = require('../models/User');
const admin = require('../config/firebaseAdmin');

// JWT Token generate karne ka helper
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// @route   POST /api/auth/register
// @desc    Naya user register karo
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check karo kya user pehle se exist karta hai
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'Email already registered!' });
    }

    // Naya user banao
    const user = await User.create({ name, email, password });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route   POST /api/auth/login
// @desc    User login karo
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Email se user dhoondo
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Password match karo
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route   GET /api/auth/me
// @desc    Current logged-in user ki info laao
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route   POST /api/auth/google
// @desc    Firebase Google token verify karo aur user login/register karo
const googleLogin = async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ message: 'idToken required hai' });
    }

    // Firebase Admin se token verify karo
    const decoded = await admin.auth().verifyIdToken(idToken);
    const { uid, email, name, picture } = decoded;

    // User dhoondo ya banao
    let user = await User.findOne({ email });

    if (!user) {
      // Naya Google user — create karo
      user = await User.create({
        name: name || email.split('@')[0],
        email,
        googleId: uid,
        avatar: picture || '',
        // password nahi dena — Google user hai
      });
    } else if (!user.googleId) {
      // Pehle se email se registered tha — googleId link karo
      user.googleId = uid;
      if (!user.avatar && picture) user.avatar = picture;
      await user.save();
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        onboardingDone: user.onboardingDone,
      },
    });
  } catch (error) {
    console.error('Google login error:', error.message);
    res.status(401).json({
      message: error.message && error.message.includes('Firebase Admin not initialized')
        ? error.message
        : (error.message || 'Invalid Google token'),
    });
  }
};

module.exports = { registerUser, loginUser, getMe, googleLogin };
