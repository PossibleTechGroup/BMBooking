const bcrypt = require("bcryptjs");
const prisma = require("../lib/prisma");

const AdminHospitalService = {
  listHospitals: async (page = 1, limit = 12) => {
    const skip = (page - 1) * limit;
    const [hospitals, total] = await Promise.all([
      prisma.hospital.findMany({
        skip,
        take: limit,
        orderBy: { name: "asc" },
        include: {
          serviceFee: {
            select: { amount: true },
          },
          _count: {
            select: {
              doctors: true,
              receptionists: true,
              equipment: true,
            },
          },
        },
      }),
      prisma.hospital.count(),
    ]);
    return {
      data: hospitals.map((h) => ({
        id: h.id,
        name: h.name,
        address: h.address,
        phone: h.phone,
        email: h.email,
        latitude: h.latitude,
        longitude: h.longitude,
        image: h.image,
        cardPrice: h.cardPrice,
        serviceFee: h.serviceFee?.amount || null,
        createdAt: h.createdAt,
        updatedAt: h.updatedAt,
        _count: h._count,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  createHospital: async (data) => {
    const existing = await prisma.hospital.findUnique({
      where: { name: data.name },
    });
    if (existing) {
      throw new Error("A hospital with this name already exists");
    }

    return prisma.hospital.create({
      data: {
        name: data.name,
        address: data.address || null,
        phone: data.phone || null,
        email: data.email || null,
        latitude: data.latitude ?? null,
        longitude: data.longitude ?? null,
        image: data.image || null,
        cardPrice: data.cardPrice,
      },
    });
  },

  updateHospital: async (id, data) => {
    const hospital = await prisma.hospital.findUnique({ where: { id } });
    if (!hospital) {
      throw new Error("Hospital not found");
    }

    if (data.name && data.name !== hospital.name) {
      const existing = await prisma.hospital.findUnique({
        where: { name: data.name },
      });
      if (existing) {
        throw new Error("A hospital with this name already exists");
      }
    }

    const updateData = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.latitude !== undefined) updateData.latitude = data.latitude;
    if (data.longitude !== undefined) updateData.longitude = data.longitude;
    if (data.image !== undefined) updateData.image = data.image;
    if (data.cardPrice !== undefined) updateData.cardPrice = data.cardPrice;

    return prisma.hospital.update({
      where: { id },
      data: updateData,
    });
  },

  listReceptionists: async () => {
    const profiles = await prisma.receptionistProfile.findMany({
      include: {
        user: {
          select: { id: true, username: true, phone: true, email: true, createdAt: true },
        },
        hospital: {
          select: { id: true, name: true, cardPrice: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return profiles;
  },

  deleteHospital: async (id) => {
    const hospital = await prisma.hospital.findUnique({ where: { id } });
    if (!hospital) {
      throw new Error("Hospital not found");
    }

    return prisma.$transaction(async (tx) => {
      await tx.equipmentBooking.deleteMany({ where: { hospitalId: id } });
      await tx.equipmentAnnouncement.deleteMany({ where: { hospitalId: id } });
      const receptionists = await tx.receptionistProfile.findMany({
        where: { hospitalId: id },
        select: { userId: true },
      });
      const receptionUserIds = receptionists.map((r) => r.userId);
      await tx.receptionistProfile.deleteMany({ where: { hospitalId: id } });
      if (receptionUserIds.length > 0) {
        await tx.user.deleteMany({ where: { id: { in: receptionUserIds } } });
      }
      await tx.doctorProfile.updateMany({ where: { hospitalId: id }, data: { hospitalId: null } });
      return tx.hospital.delete({ where: { id } });
    });
  },

  updateReceptionist: async (id, data) => {
    const profile = await prisma.receptionistProfile.findUnique({
      where: { id },
      include: { user: true },
    });
    if (!profile) throw new Error("Receptionist not found");

    return prisma.$transaction(async (tx) => {
      const updateUserData = {};
      if (data.username !== undefined) updateUserData.username = data.username;
      if (data.password) {
        updateUserData.password = await bcrypt.hash(data.password, 10);
      }
      if (data.phone !== undefined) updateUserData.phone = data.phone || null;
      if (data.email !== undefined) updateUserData.email = data.email || null;
      if (data.hospitalId !== undefined) {
        const hospital = await tx.hospital.findUnique({ where: { id: data.hospitalId } });
        if (!hospital) throw new Error("Hospital not found");
      }

      if (Object.keys(updateUserData).length > 0) {
        await tx.user.update({ where: { id: profile.userId }, data: updateUserData });
      }

      const updateProfileData = {};
      if (data.hospitalId !== undefined) updateProfileData.hospitalId = data.hospitalId;

      if (Object.keys(updateProfileData).length > 0) {
        await tx.receptionistProfile.update({ where: { id }, data: updateProfileData });
      }

      return tx.receptionistProfile.findUnique({
        where: { id },
        include: {
          user: { select: { id: true, username: true, phone: true, email: true, createdAt: true } },
          hospital: { select: { id: true, name: true, cardPrice: true } },
        },
      });
    });
  },

  deleteReceptionist: async (id) => {
    const profile = await prisma.receptionistProfile.findUnique({
      where: { id },
    });
    if (!profile) throw new Error("Receptionist not found");

    return prisma.$transaction(async (tx) => {
      await tx.receptionistProfile.delete({ where: { id } });
      return tx.user.delete({ where: { id: profile.userId } });
    });
  },

  createReceptionist: async (data) => {
    const hospital = await prisma.hospital.findUnique({
      where: { id: data.hospitalId },
    });
    if (!hospital) {
      throw new Error("Hospital not found");
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
          hospitalId: data.hospitalId,
        },
        include: {
          user: {
            select: { id: true, username: true, phone: true, email: true },
          },
          hospital: {
            select: { id: true, name: true, cardPrice: true },
          },
        },
      });

      return profile;
    });
  },

  assignHospitalToDoctor: async (doctorId, hospitalId) => {
    const doctor = await prisma.doctorProfile.findUnique({ where: { id: doctorId } });
    if (!doctor) throw new Error("Doctor not found");

    if (hospitalId) {
      const hospital = await prisma.hospital.findUnique({ where: { id: hospitalId } });
      if (!hospital) throw new Error("Hospital not found");
    }

    return prisma.doctorProfile.update({
      where: { id: doctorId },
      data: { hospitalId: hospitalId || null },
      include: {
        user: { select: { id: true, phone: true, email: true, username: true } },
        hospital: { select: { id: true, name: true } },
      },
    });
  },

  listHospitalDoctors: async (hospitalId) => {
    const hospital = await prisma.hospital.findUnique({ where: { id: hospitalId } });
    if (!hospital) throw new Error("Hospital not found");

    return prisma.doctorProfile.findMany({
      where: { hospitalId },
      select: {
        id: true,
        fullName: true,
        specialization: true,
        status: true,
        user: { select: { id: true, phone: true, email: true } },
      },
      orderBy: { fullName: "asc" },
    });
  },

  setServiceFee: async (hospitalId, amount) => {
    const hospital = await prisma.hospital.findUnique({ where: { id: hospitalId } });
    if (!hospital) throw new Error("Hospital not found");

    if (amount === null) {
      await prisma.serviceFee.deleteMany({ where: { hospitalId } });
      return { hospitalId, amount: null };
    }

    return prisma.serviceFee.upsert({
      where: { hospitalId },
      create: { hospitalId, amount },
      update: { amount },
    });
  },
};

module.exports = AdminHospitalService;
