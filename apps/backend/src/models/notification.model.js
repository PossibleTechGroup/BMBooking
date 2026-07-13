const prisma = require('../lib/prisma');

const Notification = {
  create: async (userId, type, title, message, metadata = null) => {
    return await prisma.notification.create({
      data: { userId, type, title, message, metadata }
    });
  },

  findByUserId: async (userId, { limit = 50, offset = 0 } = {}) => {
    return await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    });
  },

  countUnread: async (userId) => {
    return await prisma.notification.count({
      where: { userId, isRead: false }
    });
  },

  markAsRead: async (id, userId) => {
    return await prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true }
    });
  },

  markAllAsRead: async (userId) => {
    return await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true }
    });
  },

  deleteById: async (id, userId) => {
    return await prisma.notification.deleteMany({
      where: { id, userId }
    });
  }
};

module.exports = Notification;
