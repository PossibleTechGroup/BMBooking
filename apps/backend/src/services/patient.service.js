const prisma = require('../lib/prisma');

const PatientService = {
  createProfile: async (userId, data) => {
    return await prisma.patientProfile.create({
      data: {
        userId,
        fullName: data.fullName,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        gender: data.gender,
        bloodType: data.bloodType,
        emergencyContact: data.emergencyContact
      }
    });
  },

  updateProfile: async (userId, data) => {
    return await prisma.patientProfile.update({
      where: { userId },
      data: {
        fullName: data.fullName,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        gender: data.gender,
        bloodType: data.bloodType,
        emergencyContact: data.emergencyContact
      }
    });
  },

  getProfile: async (userId) => {
    return await prisma.patientProfile.findUnique({
      where: { userId }
    });
  },

  checkPhone: async (userId, phone) => {
    const user = await prisma.user.findUnique({
      where: { phone },
      include: { patientProfile: true },
    });

    if (!user) {
      return { exists: false };
    }

    const bookedByMe = await prisma.appointment.findFirst({
      where: {
        patientId: user.id,
        bookedById: userId,
      },
    });

    return {
      exists: true,
      patient: {
        fullName: user.patientProfile?.fullName || null,
        gender: user.patientProfile?.gender || null,
        dateOfBirth: user.patientProfile?.dateOfBirth || null,
        bloodType: user.patientProfile?.bloodType || null,
      },
      registeredByMe: !!bookedByMe,
    };
  },

  deleteAccount: async (userId) => {
    // Delete patient profile
    await prisma.patientProfile.deleteMany({
      where: { userId },
    });
    // Remove or anonymize user record
    try {
      await prisma.user.delete({
        where: { id: userId },
      });
    } catch {
      await prisma.user.update({
        where: { id: userId },
        data: {
          phone: `deleted_${userId}_${Date.now()}`,
          isLocked: true,
          expoPushToken: null,
        },
      });
    }
    return true;
  },
};

module.exports = PatientService;
