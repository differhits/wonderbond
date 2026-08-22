const Trip = require('../models/Trip');

// @route  GET /api/trips/community — all public trips
const getCommunityTrips = async (req, res) => {
  try {
    const trips = await Trip.find({ isPublic: true })
      .populate('userId', 'name avatar photos city nationality verified')
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(trips);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route  GET /api/trips/mine — current user's trips
const getMyTrips = async (req, res) => {
  try {
    const trips = await Trip.find({ userId: req.user._id })
      .sort({ createdAt: -1 });
    res.json(trips);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route  POST /api/trips — create trip
const createTrip = async (req, res) => {
  try {
    const { destination, departureCity, startDate, endDate, duration, budget, purpose, description, activities } = req.body;

    if (!destination || !startDate || !endDate) {
      return res.status(400).json({ message: 'Destination, startDate and endDate are required' });
    }

    const trip = await Trip.create({
      userId: req.user._id,
      destination,
      departureCity: departureCity || req.user.city || '',
      startDate,
      endDate,
      duration: duration || Math.ceil((new Date(endDate) - new Date(startDate)) / 86400000),
      budget: budget || 'Mid-range',
      purpose: purpose || '',
      description: description || '',
      activities: activities || [],
      isPublic: true,
    });

    const populated = await trip.populate('userId', 'name avatar photos city nationality verified');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route  DELETE /api/trips/:id
const deleteTrip = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ message: 'Trip not found' });
    if (trip.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    await trip.deleteOne();
    res.json({ message: 'Trip deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getCommunityTrips, getMyTrips, createTrip, deleteTrip };
