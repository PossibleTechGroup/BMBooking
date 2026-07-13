const prisma = require('../lib/prisma');

const Announcement = {
  create: async (data) => {
    return await prisma.announcement.create({ data });
  },

  findAll: async () => {
    return await prisma.announcement.findMany({
      orderBy: { createdAt: 'desc' }
    });
  },

  findById: async (id) => {
    return await prisma.announcement.findUnique({ where: { id } });
  },

  update: async (id, data) => {
    return await prisma.announcement.update({ where: { id }, data });
  },

  delete: async (id) => {
    return await prisma.announcement.delete({ where: { id } });
  },

  findByAudience: async (audiences) => {
    return await prisma.announcement.findMany({
      where: {
        isPublished: true,
        OR: audiences.map(audience => ({ audience }))
      },
      orderBy: { publishedAt: 'desc' }
    });
  }
};

module.exports = Announcement;
