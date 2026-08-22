const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    // ── Auth fields ───────────────────────────────────────────────────────
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/\S+@\S+\.\S+/, 'Please enter a valid email'],
    },
    password: {
      type: String,
      required: false,          // Google users ke liye optional hai
      minlength: [6, 'Password must be at least 6 characters'],
    },

    // ── Google OAuth ──────────────────────────────────────────────────────
    googleId: { type: String, default: null }, // Firebase UID

    // ── Profile fields ────────────────────────────────────────────────────
    avatar: { type: String, default: '' },
    photos: [{ type: String }],
    bio: { type: String, default: '' },

    // ── Personal info ─────────────────────────────────────────────────────
    age: { type: Number, default: null },
    gender: { type: String, default: '' },
    nationality: { type: String, default: '' },
    city: { type: String, default: '' },
    phone: { type: String, default: '' },

    // ── Travel preferences ────────────────────────────────────────────────
    travelStyle: { type: String, default: '' },
    budget: { type: String, default: '' },
    interests: [{ type: String }],
    languages: [{ type: String }],

    // ── App metadata ──────────────────────────────────────────────────────
    onboardingDone: { type: Boolean, default: false },
    verified: { type: Boolean, default: false },
    phoneVerified: { type: Boolean, default: false },
    idVerified: { type: Boolean, default: false },
    idDocumentType: { type: String, default: '' },
    phoneOtp: { type: String, default: null },
    phoneOtpExpires: { type: Date, default: null },
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },

    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true, // createdAt aur updatedAt auto
  }
);

// Password save karne se pehle hash karo (Mongoose v9 async style)
userSchema.pre('save', async function () {
  // Google users ke paas password nahi hoga — skip karo
  if (!this.password || !this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Login ke waqt password compare karne ka method
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Response mein password hide karo
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  return user;
};

module.exports = mongoose.model('User', userSchema);
