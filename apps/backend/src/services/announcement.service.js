const Announcement = require('../models/announcement.model');
const prisma = require('../lib/prisma');
const NotificationService = require('./notification.service');
const SmsService = require('./sms.service');

const AnnouncementService = {
  create: async (data) => {
    return await Announcement.create({
      title: data.title,
      message: data.message,
      audience: data.audience,
      isPublished: false
    });
  },

  getAll: async () => {
    return await Announcement.findAll();
  },

  getById: async (id) => {
    return await Announcement.findById(id);
  },

  update: async (id, data) => {
    const updateData = {};
    if (data.title) updateData.title = data.title;
    if (data.message) updateData.message = data.message;
    if (data.audience) updateData.audience = data.audience;
    return await Announcement.update(id, updateData);
  },

  delete: async (id) => {
    return await Announcement.delete(id);
  },

  resend: async (id) => {
    const announcement = await Announcement.findById(id);
    if (!announcement) throw new Error('Announcement not found');
    await AnnouncementService._notifyUsers(announcement);
    return announcement;
  },

  publish: async (id) => {
    const announcement = await Announcement.findById(id);
    if (!announcement) throw new Error('Announcement not found');

    const isNowPublished = !announcement.isPublished;
    const updated = await Announcement.update(id, {
      isPublished: isNowPublished,
      publishedAt: isNowPublished ? new Date() : null
    });

    if (isNowPublished) {
      await AnnouncementService._notifyUsers(announcement);
    }

    return updated;
  },

  getForUser: async (role) => {
    const audiences = role === 'doctor' ? ['doctor', 'all'] : ['patient', 'all'];
    return await Announcement.findByAudience(audiences);
  },

  _notifyUsers: async (announcement) => {
    const audienceFilter = {};
    if (announcement.audience === 'doctor') {
      audienceFilter.role = 'doctor';
    } else if (announcement.audience === 'patient') {
      audienceFilter.role = 'patient';
    }

    const users = await prisma.user.findMany({
      where: audienceFilter,
      select: { id: true, phone: true, expoPushToken: true },
    });

    for (const user of users) {
      try {
        if (user.expoPushToken) {
          await NotificationService.create(
            user.id,
            'SYSTEM',
            announcement.title,
            announcement.message,
            { type: 'ANNOUNCEMENT', announcementId: announcement.id }
          );
        }
        if (user.phone) {
          const smsMsg = `BM Booking: ${announcement.title}. ${announcement.message}`;
          SmsService.sendSms(user.phone, smsMsg).catch(() => {});
        }
      } catch (err) {
        console.error(`Failed to notify user ${user.id}:`, err.message);
      }
    }
  }
};

module.exports = AnnouncementService;
