const prisma = require('../lib/prisma');

const OTP = {
  create: async (phone, code, expiresAt) => {
    // Invalidate all previous OTPs for this phone before creating a new one
    // This prevents old delayed SMS codes from confusing the user
    await prisma.oTP.updateMany({
      where: { phone, verified: false },
      data: { verified: true }
    });
    return await prisma.oTP.create({
      data: { phone, code, expiresAt }
    });
  },

  findLatestByPhone: async (phone) => {
    return await prisma.oTP.findFirst({
      where: { phone },
      orderBy: { createdAt: 'desc' }
    });
  },

  verify: async (id) => {
    return await prisma.oTP.update({
      where: { id },
      data: { verified: true }
    });
  },

  incrementAttempts: async (id) => {
    return await prisma.oTP.update({
      where: { id },
      data: { attempts: { increment: 1 } }
    });
  }
};

module.exports = OTP;
