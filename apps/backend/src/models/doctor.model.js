const prisma = require('../lib/prisma');

const Doctor = {
  createProfile: async (userId, profileData) => {
    const data = {
      userId,
      fullName: profileData.fullName,
      profilePicture: profileData.profilePicture,
      introVideo: profileData.introVideo,
      specialization: profileData.specialization,
      licenseNumber: profileData.licenseNumber,
      experienceYears: profileData.experienceYears ? parseInt(profileData.experienceYears) : null,
      bio: profileData.bio,
      clinicName: profileData.clinicName,
      clinicAddress: profileData.clinicAddress,
      languages: profileData.languages,
      baseHourlyRate: profileData.baseHourlyRate ? parseFloat(profileData.baseHourlyRate) : null,
      hospitalId: profileData.hospitalId ? parseInt(profileData.hospitalId) : null,
      status: 'PendingReview'
    };
    if (profileData.specializations) {
      data.specializations = typeof profileData.specializations === 'string'
        ? JSON.parse(profileData.specializations)
        : profileData.specializations;
    }
    return await prisma.doctorProfile.create({ data });
  },

  updateProfile: async (userId, profileData) => {
    const data = {
      fullName: profileData.fullName,
      profilePicture: profileData.profilePicture,
      introVideo: profileData.introVideo,
      specialization: profileData.specialization,
      licenseNumber: profileData.licenseNumber,
      experienceYears: profileData.experienceYears ? parseInt(profileData.experienceYears) : undefined,
      bio: profileData.bio,
      clinicName: profileData.clinicName,
      clinicAddress: profileData.clinicAddress,
      languages: profileData.languages,
      baseHourlyRate: profileData.baseHourlyRate ? parseFloat(profileData.baseHourlyRate) : undefined,
      hospitalId: profileData.hospitalId ? parseInt(profileData.hospitalId) : undefined,
      status: 'PendingReview',
      rejectionReason: null
    };
    if (profileData.specializations) {
      data.specializations = typeof profileData.specializations === 'string'
        ? JSON.parse(profileData.specializations)
        : profileData.specializations;
    }
    return await prisma.doctorProfile.update({
      where: { userId },
      data
    });
  },

  findByUserId: async (userId) => {
    return await prisma.doctorProfile.findUnique({
      where: { userId },
      include: { hospital: true }
    });
  }
};

module.exports = Doctor;
