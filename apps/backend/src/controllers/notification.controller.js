const { NotificationService } = require('../services/notification.service');

const NotificationController = {
  /**
   * GET /api/notifications
   * Get the current user's notifications (paginated)
   * Query: ?page=1&limit=50
   */
  getNotifications: async (req, res) => {
    try {
      const userId = req.user.id;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 50;

      const result = await NotificationService.getUserNotifications(userId, { page, limit });
      res.status(200).json({ status: 'success', data: result });
    } catch (err) {
      console.error('❌ [NOTIFICATION] Get error:', err.message);
      res.status(500).json({ status: 'error', message: err.message });
    }
  },

  /**
   * GET /api/notifications/unread-count
   * Get the count of unread notifications (for badge)
   */
  getUnreadCount: async (req, res) => {
    try {
      const userId = req.user.id;
      const count = await NotificationService.getUnreadCount(userId);
      res.status(200).json({ status: 'success', data: { unreadCount: count } });
    } catch (err) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  },

  /**
   * PATCH /api/notifications/:id/read
   * Mark a single notification as read
   */
  markAsRead: async (req, res) => {
    try {
      const userId = req.user.id;
      const notificationId = parseInt(req.params.id);

      await NotificationService.markAsRead(notificationId, userId);
      res.status(200).json({ status: 'success', message: 'Notification marked as read' });
    } catch (err) {
      res.status(400).json({ status: 'fail', message: err.message });
    }
  },

  /**
   * PATCH /api/notifications/read-all
   * Mark all notifications as read
   */
  markAllAsRead: async (req, res) => {
    try {
      const userId = req.user.id;
      const result = await NotificationService.markAllAsRead(userId);
      res.status(200).json({ status: 'success', message: `${result.count} notifications marked as read` });
    } catch (err) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  },

  /**
   * DELETE /api/notifications/:id
   * Delete a notification
   */
  delete: async (req, res) => {
    try {
      const userId = req.user.id;
      const notificationId = parseInt(req.params.id);

      await NotificationService.delete(notificationId, userId);
      res.status(200).json({ status: 'success', message: 'Notification deleted' });
    } catch (err) {
      res.status(400).json({ status: 'fail', message: err.message });
    }
  }
};

module.exports = NotificationController;
