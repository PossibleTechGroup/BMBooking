const express = require('express');
const NotificationController = require('../controllers/notification.controller');
const authMiddleware = require('../middleware/auth.middleware');

const router = express.Router();

// All notification routes require authentication
router.use(authMiddleware);

// GET /api/notifications — Get user's notifications (paginated)
router.get('/', NotificationController.getNotifications);

// GET /api/notifications/unread-count — Get unread count for badge
router.get('/unread-count', NotificationController.getUnreadCount);

// PATCH /api/notifications/read-all — Mark all as read (must be before /:id routes)
router.patch('/read-all', NotificationController.markAllAsRead);

// PATCH /api/notifications/:id/read — Mark single as read
router.patch('/:id/read', NotificationController.markAsRead);

// DELETE /api/notifications/:id — Delete a notification
router.delete('/:id', NotificationController.delete);

module.exports = router;
