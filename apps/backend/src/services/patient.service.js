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
};

module.exports = PatientService;
