const express = require('express');
const ReviewController = require('../controllers/review.controller');
const authMiddleware = require('../middleware/auth.middleware');

const router = express.Router();

// Public: Get reviews for a doctor
router.get('/doctor/:id', ReviewController.getDoctorReviews);

// Protected: Add a review
router.post('/', authMiddleware, ReviewController.addReview);

module.exports = router;
