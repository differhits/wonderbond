const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, default: '', trim: true },
    type: {
      type: String,
      enum: ['text', 'image', 'location', 'itinerary', 'voice', 'document'],
      default: 'text',
    },
    mediaUrl: { type: String, default: '' },
    fileName: { type: String, default: '' },
    fileSize: { type: String, default: '' },
    locationData: {
      city: String,
      country: String,
      address: String,
      lat: Number,
      lng: Number,
    },
    itineraryData: {
      destination: String,
      departureCity: String,
      startDate: String,
      endDate: String,
      duration: Number,
      budget: String,
      purpose: String,
      activities: [String],
    },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Index for fast conversation lookup
messageSchema.index({ senderId: 1, receiverId: 1 });

module.exports = mongoose.model('Message', messageSchema);

