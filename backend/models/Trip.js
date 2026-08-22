const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    destination: { type: String, required: true, trim: true },
    departureCity: { type: String, default: '', trim: true },
    startDate: { type: String, required: true },
    endDate: { type: String, required: true },
    duration: { type: Number, default: 0 },
    budget: { type: String, default: 'Mid-range' },
    purpose: { type: String, default: '' },
    description: { type: String, default: '' },
    activities: [{ type: String }],
    isPublic: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Trip', tripSchema);
