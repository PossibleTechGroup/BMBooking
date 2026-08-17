const prisma = require("../lib/prisma");

const User = {
  create: async (phone, role) => {
    return await prisma.user.create({
      data: { phone, role },
    });
  },

  findByPhone: async (phone) => {
    return await prisma.user.findUnique({
      where: { phone },
      include: {
        doctorProfile: {
          include: { paymentMethods: true },
        },
        patientProfile: true,
        hospitalProfile: {
          include: { hospital: true },
        },
      },
    });
  },

  findByUsername: async (username) => {
    return await prisma.user.findUnique({
      where: { username },
    });
  },

  findByEmail: async (email) => {
    return await prisma.user.findUnique({
      where: { email },
    });
  },

  createAdmin: async (email, password) => {
    return await prisma.user.create({
      data: {
        email,
        password,
        role: "admin",
      },
    });
  },

  findById: async (id) => {
    return await prisma.user.findUnique({
      where: { id },
    });
  },

  lockAccount: async (id, until) => {
    return await prisma.user.update({
      where: { id },
      data: { isLocked: true, lockedUntil: until },
    });
  },

  unlockAccount: async (id) => {
    return await prisma.user.update({
      where: { id },
      data: { isLocked: false, lockedUntil: null },
    });
  },
};

module.exports = User;
