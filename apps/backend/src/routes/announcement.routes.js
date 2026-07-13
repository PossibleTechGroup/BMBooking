const express = require('express');
const AnnouncementController = require('../controllers/announcement.controller');
const authMiddleware = require('../middleware/auth.middleware');

const router = express.Router();

// Protected route for authenticated users to get relevant announcements
router.get('/', authMiddleware, AnnouncementController.getForUser);

module.exports = router;
