const bcrypt = require("bcryptjs");
const prisma = require("../lib/prisma");

const HospitalPortalService = {
  register: async (data) => {
    const existingHospital = await prisma.hospital.findUnique({
      where: { name: data.name },
    });
    if (existingHospital) {
      throw new Error("A hospital with this name is already registered");
    }

    const existingAdmin = await prisma.user.findUnique({
      where: { phone: data.adminPhone },
    });
    if (existingAdmin) {
      throw new Error("This phone number is already registered");
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    return prisma.$transaction(async (tx) => {
      const hospital = await tx.hospital.create({
        data: {
          name: data.name,
          address: data.address || null,
          phone: data.phone || null,
          email: data.email || null,
          cardPrice: 0,
        },
      });

      const user = await tx.user.create({
        data: {
          phone: data.adminPhone,
          email: data.email || null,
          password: hashedPassword,
          role: "hospital",
        },
      });

      const profile = await tx.hospitalProfile.create({
        data: {
          userId: user.id,
          hospitalId: hospital.id,
          status: "PENDING",
        },
        include: {
          hospital: { select: { id: true, name: true } },
        },
      });

      return {
        profile,
        hospital: { id: hospital.id, name: hospital.name },
        adminPhone: user.phone,
        status: "PENDING",
      };
    });
  },

  getProfile: async (hospitalId) => {
    const hospital = await prisma.hospital.findUnique({
      where: { id: hospitalId },
      select: {
        id: true,
        name: true,
        address: true,
        phone: true,
        email: true,
        latitude: true,
        longitude: true,
        image: true,
        cardPrice: true,
        createdAt: true,
        serviceFee: { select: { amount: true } },
      },
    });
    if (!hospital) throw new Error("Hospital not found");
    return hospital;
  },

  updateProfile: async (hospitalId, data) => {
    const hospital = await prisma.hospital.findUnique({ where: { id: hospitalId } });
    if (!hospital) throw new Error("Hospital not found");

    if (data.name && data.name !== hospital.name) {
      const existing = await prisma.hospital.findUnique({
        where: { name: data.name },
      });
      if (existing) throw new Error("A hospital with this name already exists");
    }

    const updateData = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.latitude !== undefined) updateData.latitude = data.latitude;
    if (data.longitude !== undefined) updateData.longitude = data.longitude;

    if (Object.keys(updateData).length === 0) {
      throw new Error("No fields to update");
    }

    return prisma.hospital.update({
      where: { id: hospitalId },
      data: updateData,
    });
  },

  getStats: async (hospitalId) => {
    const [doctors, pendingDoctors, receptionists, appointments] =
      await Promise.all([
        prisma.doctorProfile.count({ where: { hospitalId, status: "Approved" } }),
        prisma.doctorProfile.count({
          where: { hospitalId, status: "PendingReview" },
        }),
        prisma.receptionistProfile.count({ where: { hospitalId } }),
        prisma.appointment.count({ where: { doctor: { hospitalId } } }),
      ]);

    const pendingAppointments = await prisma.appointment.count({
      where: { doctor: { hospitalId }, status: "pending" },
    });

    return {
      doctors,
      pendingDoctors,
      receptionists,
      appointments,
      pendingAppointments,
    };
  },

  listDoctors: async (hospitalId, includeAll = false) => {
    const where = { hospitalId };
    if (!includeAll) where.status = "Approved";

    const doctors = await prisma.doctorProfile.findMany({
      where,
      select: {
        id: true,
        fullName: true,
        specialization: true,
        specializations: true,
        licenseNumber: true,
        experienceYears: true,
        bio: true,
        profilePicture: true,
        status: true,
        rejectionReason: true,
        createdAt: true,
        user: { select: { id: true, phone: true, email: true } },
        _count: { select: { appointments: true } },
      },
      orderBy: { fullName: "asc" },
    });
    return doctors;
  },

  updateDoctorStatus: async (doctorId, hospitalId, status, rejectionReason) => {
    if (!["Approved", "Rejected"].includes(status)) {
      throw new Error("Status must be Approved or Rejected");
    }

    const doctor = await prisma.doctorProfile.findUnique({
      where: { id: doctorId },
    });
    if (!doctor) throw new Error("Doctor not found");
    if (doctor.hospitalId !== hospitalId) {
      throw new Error("Doctor does not belong to this hospital");
    }
    if (doctor.status !== "PendingReview") {
      throw new Error("Only pending doctors can be approved or rejected here");
    }

    return prisma.doctorProfile.update({
      where: { id: doctorId },
      data: {
        status,
        rejectionReason: status === "Rejected" ? rejectionReason || null : null,
      },
      select: {
        id: true,
        fullName: true,
        status: true,
        rejectionReason: true,
      },
    });
  },

  listReceptionists: async (hospitalId) => {
    return prisma.receptionistProfile.findMany({
      where: { hospitalId },
      include: {
        user: {
          select: { id: true, username: true, phone: true, email: true, createdAt: true },
        },
        hospital: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  createReceptionist: async (hospitalId, data) => {
    if (!data.username || !data.password) {
      throw new Error("Username and password are required");
    }
    if (data.password.length < 8) {
      throw new Error("Password must be at least 8 characters");
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username: data.username },
          ...(data.phone ? [{ phone: data.phone }] : []),
          ...(data.email ? [{ email: data.email }] : []),
        ],
      },
    });
    if (existingUser) {
      throw new Error("Username, phone, or email already in use");
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    return prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          username: data.username,
          password: hashedPassword,
          phone: data.phone || null,
          email: data.email || null,
          role: "receptionist",
        },
      });

      const profile = await tx.receptionistProfile.create({
        data: {
          userId: user.id,
          hospitalId,
        },
        include: {
          user: {
            select: { id: true, username: true, phone: true, email: true },
          },
          hospital: { select: { id: true, name: true } },
        },
      });

      return profile;
    });
  },

  updateReceptionist: async (receptionistId, hospitalId, data) => {
    const profile = await prisma.receptionistProfile.findUnique({
      where: { id: receptionistId },
      include: { user: true },
    });
    if (!profile) throw new Error("Receptionist not found");
    if (profile.hospitalId !== hospitalId) {
      throw new Error("Receptionist does not belong to this hospital");
    }

    return prisma.$transaction(async (tx) => {
      const updateUserData = {};
      if (data.username !== undefined) updateUserData.username = data.username;
      if (data.password) {
        if (data.password.length < 8) {
          throw new Error("Password must be at least 8 characters");
        }
        updateUserData.password = await bcrypt.hash(data.password, 10);
      }
      if (data.phone !== undefined) updateUserData.phone = data.phone || null;
      if (data.email !== undefined) updateUserData.email = data.email || null;

      if (Object.keys(updateUserData).length > 0) {
        await tx.user.update({
          where: { id: profile.userId },
          data: updateUserData,
        });
      }

      return tx.receptionistProfile.findUnique({
        where: { id: receptionistId },
        include: {
          user: {
            select: { id: true, username: true, phone: true, email: true, createdAt: true },
          },
          hospital: { select: { id: true, name: true } },
        },
      });
    });
  },

  deleteReceptionist: async (receptionistId, hospitalId) => {
    const profile = await prisma.receptionistProfile.findUnique({
      where: { id: receptionistId },
    });
    if (!profile) throw new Error("Receptionist not found");
    if (profile.hospitalId !== hospitalId) {
      throw new Error("Receptionist does not belong to this hospital");
    }

    return prisma.$transaction(async (tx) => {
      await tx.receptionistProfile.delete({ where: { id: receptionistId } });
      await tx.user.delete({ where: { id: profile.userId } });
    });
  },
};

module.exports = HospitalPortalService;
