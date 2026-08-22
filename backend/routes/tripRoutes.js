const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getCommunityTrips, getMyTrips, createTrip, deleteTrip } = require('../controllers/tripController');

router.get('/community', protect, getCommunityTrips);
router.get('/mine', protect, getMyTrips);
router.post('/', protect, createTrip);
router.delete('/:id', protect, deleteTrip);

module.exports = router;
