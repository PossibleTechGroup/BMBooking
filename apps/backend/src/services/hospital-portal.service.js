const bcrypt = require("bcryptjs");
const prisma = require("../lib/prisma");
const { resolveServiceLabel } = require("../config/services.config");

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

    const services =
      Array.isArray(data.services) && data.services.length > 0
        ? data.services.map((s) => ({ name: resolveServiceLabel(s) || String(s) }))
        : [];

    return prisma.$transaction(async (tx) => {
      const hospital = await tx.hospital.create({
        data: {
          name: data.name,
          address: data.address || null,
          phone: data.phone || null,
          email: data.email || null,
          image: data.image || data.logo || null,
          cardPrice: 0,
          latitude: data.latitude || null,
          longitude: data.longitude || null,
          services: services.length > 0 ? { create: services } : undefined,
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
        hospital: {
          id: hospital.id,
          name: hospital.name,
          services: services.map((s) => s.name),
        },
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
        services: { select: { id: true, name: true, category: true }, orderBy: { id: "asc" } },
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
    if (data.image !== undefined) updateData.image = data.image;
    else if (data.logo !== undefined) updateData.image = data.logo;

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

  getOverview: async (hospitalId) => {
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);

    const baseWhere = { doctor: { hospitalId } };

    const [
      todayAppointments,
      newBookings30,
      newPatients30,
      pending,
      confirmed,
      completed,
      cancelled,
      doctorsApproved,
      receiptsSum,
      activeCards,
      expiredCards,
    ] = await Promise.all([
      prisma.appointment.count({ where: { ...baseWhere, createdAt: { gte: startOfToday, lte: endOfToday } } }),
      prisma.appointment.count({ where: { ...baseWhere, createdAt: { gte: new Date(Date.now() - 30 * 24 * 3600 * 1000) } } }),
      prisma.appointment.count({
        where: { ...baseWhere, createdAt: { gte: new Date(Date.now() - 30 * 24 * 3600 * 1000) } },
      }),
      prisma.appointment.count({ where: { ...baseWhere, status: "pending" } }),
      prisma.appointment.count({ where: { ...baseWhere, status: "accepted" } }),
      prisma.appointment.count({ where: { ...baseWhere, status: "completed" } }),
      prisma.appointment.count({ where: { ...baseWhere, status: "cancelled" } }),
      prisma.doctorProfile.count({ where: { hospitalId, status: "Approved" } }),
      prisma.appointment.aggregate({
        where: { ...baseWhere, isPaid: true },
        _sum: { fee: true },
      }),
      prisma.card.count({ where: { hospitalId, isActive: true, expiresAt: { gt: now }, isPaid: true } }),
      prisma.card.count({ where: { hospitalId, OR: [{ expiresAt: { lte: now } }, { isActive: false }] } }),
    ]);

    const [slotsWithCount, allSlots] = await Promise.all([
      prisma.scheduleSlot.findMany({
        where: { schedule: { hospitalId } },
        include: { _count: { select: { bookings: true } } },
      }),
      prisma.scheduleSlot.count({ where: { schedule: { hospitalId } } }),
    ]);

    const fullSlots = slotsWithCount.filter((s) => s._count.bookings >= s.maxPatients).length;
    const availableSlots = allSlots - fullSlots;

    return {
      todayAppointments,
      newBookings: newBookings30,
      newPatients: newPatients30,
      pending,
      confirmed,
      completed,
      cancelled,
      totalAppointments: pending + confirmed + completed + cancelled,
      doctors: doctorsApproved,
      revenue: Number(receiptsSum?._sum?.fee || 0),
      availableSlots,
      fullSlots,
      totalSlots: allSlots,
      activeCards,
      expiredCards,
    };
  },

  getAnalytics: async (hospitalId, { period = 'month' } = {}) => {
    const baseWhere = { doctor: { hospitalId } };

    // Status breakdown
    const [pending, confirmed, completed, cancelled, paid, unpaid] = await Promise.all([
      prisma.appointment.count({ where: { ...baseWhere, status: "pending" } }),
      prisma.appointment.count({ where: { ...baseWhere, status: "accepted" } }),
      prisma.appointment.count({ where: { ...baseWhere, status: "completed" } }),
      prisma.appointment.count({ where: { ...baseWhere, status: "cancelled" } }),
      prisma.appointment.count({ where: { ...baseWhere, isPaid: true } }),
      prisma.appointment.count({ where: { ...baseWhere, isPaid: false } }),
    ]);

    // Revenue aggregate
    const paidAgg = await prisma.appointment.aggregate({
      where: { ...baseWhere, isPaid: true },
      _sum: { fee: true },
    });

    // Bookings by day (last 30 days)
    const sinceDays = period === 'week' ? 7 : period === 'year' ? 365 : 30;
    const since = new Date(Date.now() - sinceDays * 24 * 3600 * 1000);
    const dayRows = await prisma.appointment.findMany({
      where: { ...baseWhere, createdAt: { gte: since } },
      select: { createdAt: true },
    });
    const byDay = {};
    dayRows.forEach((r) => {
      const k = r.createdAt.toISOString().slice(0, 10);
      byDay[k] = (byDay[k] || 0) + 1;
    });

    // Per doctor
    const doctorRows = await prisma.appointment.groupBy({
      by: ['doctorId'],
      _count: { _all: true },
      where: baseWhere,
    });
    const doctorNames = await prisma.doctorProfile.findMany({
      where: { hospitalId },
      select: { id: true, fullName: true },
    });
    const nameMap = {};
    doctorNames.forEach((d) => { nameMap[d.id] = d.fullName; });
    const byDoctor = doctorRows.map((r) => ({
      doctorId: r.doctorId,
      doctorName: nameMap[r.doctorId] || 'Unknown',
      bookings: r._count._all,
    })).sort((a, b) => b.bookings - a.bookings);

    // Per service (specialization)
    const serviceRows = await prisma.appointment.findMany({
      where: baseWhere,
      select: { doctor: { select: { specialization: true } } },
    });
    const byService = {};
    serviceRows.forEach((r) => {
      const s = r.doctor?.specialization || 'General';
      byService[s] = (byService[s] || 0) + 1;
    });

    // Card usage
    const cardsAgg = await prisma.card.aggregate({
      where: { hospitalId },
      _count: true,
      _sum: { price: true },
    });
    const activeNow = await prisma.card.count({
      where: { hospitalId, isActive: true, expiresAt: { gt: new Date() }, isPaid: true },
    });
    const expiredNow = await prisma.card.count({
      where: { hospitalId, OR: [{ expiresAt: { lte: new Date() } }, { isActive: false }] },
    });

    return {
      status: { pending, confirmed, completed, cancelled },
      payments: { paid, unpaid, revenue: Number(paidAgg?._sum?.fee || 0) },
      byDay: Object.keys(byDay).sort().map((k) => ({ date: k, count: byDay[k] })),
      period,
      byDoctor,
      byService: Object.keys(byService).map((k) => ({ service: k, count: byService[k] }))
        .sort((a, b) => b.count - a.count),
      cards: {
        total: cardsAgg._count,
        issuedValue: Number(cardsAgg._sum?.price || 0),
        active: activeNow,
        expired: expiredNow,
      },
    };
  },

  listAppointments: async (hospitalId, filters = {}) => {
    const { status, search, doctorId, from, to } = filters;
    const where = { doctor: { hospitalId } };

    if (status) where.status = status;
    if (doctorId) where.doctorId = Number(doctorId);

    if (from || to) {
      where.dateTime = {};
      if (from) where.dateTime.gte = new Date(from);
      if (to) where.dateTime.lte = new Date(to);
    }

    if (search) {
      where.OR = [
        { patient: { phone: { contains: search, mode: 'insensitive' } } },
        { patient: { patientProfile: { fullName: { contains: search, mode: 'insensitive' } } } },
        { confirmationCode: { contains: search, mode: 'insensitive' } },
      ];
    }

    const page = Math.max(1, parseInt(filters.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(filters.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        include: {
          doctor: {
            select: {
              id: true,
              fullName: true,
              specialization: true,
            },
          },
          patient: {
            select: {
              id: true,
              phone: true,
              createdAt: true,
              patientProfile: { select: { fullName: true, gender: true, bloodType: true } },
            },
          },
          slot: {
            select: { startTime: true, endTime: true, maxPatients: true },
          },
          card: {
            select: {
              id: true,
              code: true,
              name: true,
              price: true,
              isPaid: true,
              issuedAt: true,
              activatedAt: true,
              expiresAt: true,
              isActive: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.appointment.count({ where }),
    ]);

    return {
      items: appointments.map((a) => ({
        id: a.id,
        doctorId: a.doctor?.id,
        doctorName: a.doctor?.fullName,
        specialization: a.doctor?.specialization,
        patientId: a.patient?.id,
        patientPhone: a.patient?.phone,
        patientJoinedAt: a.patient?.createdAt,
        patientName: a.patient?.patientProfile?.fullName || a.patient?.phone || "Patient",
        patientGender: a.patient?.patientProfile?.gender,
        patientBloodType: a.patient?.patientProfile?.bloodType,
        dateTime: a.dateTime,
        status: a.status,
        fee: Number(a.fee),
        isPaid: a.isPaid,
        paymentMethod: a.paymentMethod,
        reason: a.reason,
        confirmationCode: a.confirmationCode,
        slotStart: a.slot?.startTime || null,
        slotEnd: a.slot?.endTime || null,
        slotMaxPatients: a.slot?.maxPatients || null,
        card: a.card
          ? {
              id: a.card.id,
              code: a.card.code,
              name: a.card.name,
              price: Number(a.card.price),
              isPaid: a.card.isPaid,
              issuedAt: a.card.issuedAt,
              activatedAt: a.card.activatedAt,
              expiresAt: a.card.expiresAt,
              isActive: a.card.isActive,
            }
          : null,
        createdAt: a.createdAt,
      })),
      total,
      page,
      limit,
    };
  },

  listPatients: async (hospitalId, { search } = {}) => {
    const where = { appointments: { some: { doctor: { hospitalId } } } };
    if (search) {
      where.OR = [
        { phone: { contains: search, mode: 'insensitive' } },
        { patientProfile: { fullName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const patients = await prisma.user.findMany({
      where,
      select: {
        id: true,
        phone: true,
        createdAt: true,
        patientProfile: {
          select: { fullName: true, gender: true, bloodType: true, dateOfBirth: true, emergencyContact: true },
        },
        _count: {
          select: {
            patientAppointments: { where: { doctor: { hospitalId } } },
            cards: { where: { hospitalId } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    return patients.map((p) => ({
      id: p.id,
      phone: p.phone,
      fullName: p.patientProfile?.fullName || p.phone || 'Patient',
      gender: p.patientProfile?.gender,
      bloodType: p.patientProfile?.bloodType,
      dateOfBirth: p.patientProfile?.dateOfBirth,
      emergencyContact: p.patientProfile?.emergencyContact,
      joinedAt: p.createdAt,
      bookings: p._count.patientAppointments,
      cards: p._count.cards,
    }));
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
          fullName: data.fullName || null,
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

      await tx.receptionistProfile.update({
        where: { id: receptionistId },
        data: { fullName: data.fullName || null },
      });

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

  createCardTemplate: async (data, hospitalId) => {
    return prisma.cardTemplate.create({
      data: {
        name: data.name,
        hospitalId,
        price: data.price,
        validityDays: data.validityDays != null ? Number(data.validityDays) : null,
        isActive: true,
      },
    });
  },

  listCardTemplates: async (hospitalId) => {
    return prisma.cardTemplate.findMany({
      where: { hospitalId },
      orderBy: { createdAt: "desc" },
    });
  },

  updateCardTemplate: async (cardId, data, hospitalId) => {
    const template = await prisma.cardTemplate.findUnique({ where: { id: cardId } });
    if (!template) throw new Error("Card template not found");
    if (template.hospitalId !== hospitalId) throw new Error("Card template does not belong to this hospital");

    const updateData = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.price !== undefined) updateData.price = data.price;
    if (data.validityDays !== undefined) updateData.validityDays = data.validityDays != null ? Number(data.validityDays) : null;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    return prisma.cardTemplate.update({
      where: { id: cardId },
      data: updateData,
    });
  },

  deleteCardTemplate: async (cardId, hospitalId) => {
    const template = await prisma.cardTemplate.findUnique({ where: { id: cardId } });
    if (!template) throw new Error("Card template not found");
    if (template.hospitalId !== hospitalId) throw new Error("Card template does not belong to this hospital");

    return prisma.cardTemplate.delete({ where: { id: cardId } });
  },

  listServices: async (hospitalId) => {
    return prisma.hospitalService.findMany({
      where: { hospitalId },
      orderBy: { id: "asc" },
      select: { id: true, name: true, category: true },
    });
  },

  addService: async (hospitalId, data) => {
    const name = resolveServiceLabel(data.name) || String(data.name || "").trim();
    if (!name) throw new Error("Service name is required");
    const category = data.category || null;
    const existing = await prisma.hospitalService.findFirst({
      where: { hospitalId, name: { equals: name, mode: "insensitive" } },
    });
    if (existing) throw new Error("This service is already added to the hospital");
    return prisma.hospitalService.create({
      data: { hospitalId, name, category },
    });
  },

  setServices: async (hospitalId, names) => {
    if (!Array.isArray(names)) throw new Error("services must be an array of names");
    const resolved = names.map((n) => resolveServiceLabel(n) || String(n).trim()).filter(Boolean);
    const unique = [...new Set(resolved.map((n) => n.toLowerCase()))].map((k) => resolved.find((n) => n.toLowerCase() === k));
    return prisma.$transaction(async (tx) => {
      await tx.hospitalService.deleteMany({ where: { hospitalId } });
      return tx.hospitalService.createMany({
        data: unique.map((name) => ({ hospitalId, name })),
      });
    });
  },

  removeService: async (hospitalId, serviceId) => {
    const service = await prisma.hospitalService.findUnique({ where: { id: Number(serviceId) } });
    if (!service) throw new Error("Service not found");
    if (service.hospitalId !== hospitalId) throw new Error("Service does not belong to this hospital");
    return prisma.hospitalService.delete({ where: { id: service.id } });
  },

  setLogo: async (hospitalId, imageUrl) => {
    if (!imageUrl) throw new Error("image is required");
    return prisma.hospital.update({
      where: { id: hospitalId },
      data: { image: imageUrl },
      select: { id: true, name: true, image: true },
    });
  },
};

module.exports = HospitalPortalService;
