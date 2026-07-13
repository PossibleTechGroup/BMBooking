const AnnouncementService = require('../services/announcement.service');

const AnnouncementController = {
  create: async (req, res) => {
    try {
      const { title, message, audience } = req.body;
      const announcement = await AnnouncementService.create({ title, message, audience });
      res.status(201).json({ status: 'success', data: announcement });
    } catch (err) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  },

  getAll: async (req, res) => {
    try {
      const announcements = await AnnouncementService.getAll();
      res.status(200).json({ status: 'success', data: announcements });
    } catch (err) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  },

  getById: async (req, res) => {
    try {
      const announcement = await AnnouncementService.getById(parseInt(req.params.id));
      if (!announcement) return res.status(404).json({ status: 'fail', message: 'Announcement not found' });
      res.status(200).json({ status: 'success', data: announcement });
    } catch (err) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  },

  update: async (req, res) => {
    try {
      const { title, message, audience } = req.body;
      const announcement = await AnnouncementService.update(parseInt(req.params.id), { title, message, audience });
      res.status(200).json({ status: 'success', data: announcement });
    } catch (err) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  },

  delete: async (req, res) => {
    try {
      await AnnouncementService.delete(parseInt(req.params.id));
      res.status(200).json({ status: 'success', message: 'Announcement deleted' });
    } catch (err) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  },

  resend: async (req, res) => {
    try {
      await AnnouncementService.resend(parseInt(req.params.id));
      res.status(200).json({ status: 'success', message: 'Announcement resent' });
    } catch (err) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  },

  publish: async (req, res) => {
    try {
      const announcement = await AnnouncementService.publish(parseInt(req.params.id));
      res.status(200).json({ status: 'success', data: announcement });
    } catch (err) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  },

  getForUser: async (req, res) => {
    try {
      const role = req.user.role;
      const announcements = await AnnouncementService.getForUser(role);
      res.status(200).json({ status: 'success', data: announcements });
    } catch (err) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  }
};

module.exports = AnnouncementController;
