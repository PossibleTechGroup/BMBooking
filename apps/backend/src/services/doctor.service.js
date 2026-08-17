const Doctor = require('../models/doctor.model');
const prisma = require('../lib/prisma');
const ReceptionistService = require('./receptionist.service');

const DAY_NAME_TO_NUM = {
  sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
  thursday: 4, friday: 5, saturday: 6
};

async function generateSchedulesFromAvailability(profileId, hospitalId, availability) {
  if (!Array.isArray(availability) || availability.length === 0) return;

  await prisma.$transaction(async (tx) => {
    for (const entry of availability) {
      if (!entry.startTime || !entry.endTime) continue;

      let dates = [];

      if (entry.isRecurring && entry.day) {
        const targetDay = DAY_NAME_TO_NUM[entry.day.toLowerCase()];
        if (targetDay === undefined) continue;

        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);

        for (let i = 0; i < 56; i++) {
          const d = new Date(today);
          d.setUTCDate(d.getUTCDate() + i);
          if (d.getUTCDay() === targetDay) {
            dates.push(d.toISOString().split('T')[0]);
          }
        }
      } else if (entry.date) {
        dates = [entry.date.split('T')[0]];
      }

      const entryHospitalId = entry.hospitalId || hospitalId;
      const entrySlotDuration = entry.slotDuration || 30;

      for (const dateStr of dates) {
        const dateObj = new Date(`${dateStr}T00:00:00.000Z`);
        const schedStart = new Date(`${dateStr}T${entry.startTime}:00+03:00`);
        const schedEnd = new Date(`${dateStr}T${entry.endTime}:00+03:00`);

        const schedule = await tx.doctorSchedule.create({
          data: {
            doctorId: profileId,
            hospitalId: entryHospitalId,
            date: dateObj,
            startTime: schedStart,
            endTime: schedEnd,
            slotDuration: entrySlotDuration,
            maxPatientsPerSlot: 1,
            isActive: true,
          }
        });

        const slots = [];
        let slotStart = new Date(schedStart);
        while (slotStart < schedEnd) {
          const slotEnd = new Date(slotStart.getTime() + entrySlotDuration * 60000);
          const slotStartUTC = `${String(slotStart.getUTCHours()).padStart(2,'0')}:${String(slotStart.getUTCMinutes()).padStart(2,'0')}`;
          const slotEndUTC = `${String(slotEnd.getUTCHours()).padStart(2,'0')}:${String(slotEnd.getUTCMinutes()).padStart(2,'0')}`;
          slots.push({
            scheduleId: schedule.id,
            startTime: new Date(`${dateStr}T${slotStartUTC}:00.000Z`),
            endTime: new Date(`${dateStr}T${slotEndUTC}:00.000Z`),
            maxPatients: 1,
          });
          slotStart = slotEnd;
        }

        if (slots.length > 0) {
          await tx.scheduleSlot.createMany({ data: slots });
        }
      }
    }
  });
}

const DoctorService = {
  setupProfile: async (userId, profileData) => {
    let profile = await Doctor.findByUserId(userId);
    const isNew = !profile;

    if (!profileData.hospitalId && profileData.availability) {
      const avail = typeof profileData.availability === 'string'
        ? JSON.parse(profileData.availability)
        : profileData.availability;
      if (Array.isArray(avail)) {
        const first = avail.find(s => s.hospitalId);
        if (first?.hospitalId) {
          profileData.hospitalId = first.hospitalId;
        }
      }
    }

    if (!profileData.hospitalId && profileData.clinicName) {
      const matchedHospital = await prisma.hospital.findFirst({
        where: { name: { equals: profileData.clinicName, mode: 'insensitive' } },
        select: { id: true },
      });
      if (matchedHospital) {
        profileData.hospitalId = matchedHospital.id;
      }
    }

    if (profile) {
      profile = await Doctor.updateProfile(userId, profileData);
    } else {
      profile = await Doctor.createProfile(userId, profileData);
    }

    if (isNew && profileData.availability) {
      const availability = typeof profileData.availability === 'string'
        ? JSON.parse(profileData.availability)
        : profileData.availability;
      await generateSchedulesFromAvailability(profile.id, profile.hospitalId, availability);
    }

    return profile;
  },

  updateProfile: async (userId, profileData) => {
    if (!profileData.hospitalId && profileData.clinicName) {
      const matchedHospital = await prisma.hospital.findFirst({
        where: { name: { equals: profileData.clinicName, mode: 'insensitive' } },
        select: { id: true },
      });
      if (matchedHospital) {
        profileData.hospitalId = matchedHospital.id;
      }
    }
    return await Doctor.updateProfile(userId, profileData);
  },

  getProfile: async (userId) => {
    return await Doctor.findByUserId(userId);
  },

  getAllDoctors: async () => {
    return await prisma.doctorProfile.findMany({
      where: { status: 'Approved' },
      include: {
        hospital: {
          include: {
            serviceFee: true,
            cardTemplates: true
          }
        },
        reviews: {
          take: 5,
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { rating: 'desc' }
    });
  },

  searchDoctors: async ({ specialty, minRating, name }) => {
    const amharicHelper = require('../lib/amharicHelper');
    const where = { status: 'Approved' };
    const andConditions = [];

    if (specialty) {
      const specialtyTerms = amharicHelper.expandQuery(specialty);
      andConditions.push({
        OR: [
          ...specialtyTerms.map(term => ({
            specialization: { contains: term, mode: 'insensitive' }
          })),
          ...specialtyTerms.map(term => ({
            specializations: { array_contains: term }
          }))
        ]
      });
    }

    if (minRating) {
      where.rating = { gte: parseFloat(minRating) };
    }

    if (name) {
      const nameTerms = amharicHelper.expandQuery(name);
      andConditions.push({
        OR: [
          ...nameTerms.map(term => ({ fullName: { contains: term, mode: 'insensitive' } })),
          ...nameTerms.map(term => ({ clinicName: { contains: term, mode: 'insensitive' } }))
        ]
      });
    }

    if (andConditions.length > 0) {
      where.AND = andConditions;
    }

    return await prisma.doctorProfile.findMany({
      where,
      include: {
        hospital: {
          include: {
            serviceFee: true,
            cardTemplates: true
          }
        },
        reviews: {
          take: 3,
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { rating: 'desc' }
    });
  },

  createDoctorSchedule: async (data, userId) => {
    const profile = await prisma.doctorProfile.findUnique({ where: { userId } });
    if (!profile) throw new Error('Doctor profile not found');
    const hospitalId = data.hospitalId !== undefined ? data.hospitalId : profile.hospitalId;
    return ReceptionistService.createDoctorSchedule(
      { ...data, doctorId: profile.id, hospitalId: undefined },
      hospitalId
    );
  },

  getDoctorSchedules: async (doctorId, filters = {}) => {
    const where = { doctorId };

    const parseDayStart = (value) => {
      if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return new Date(`${value}T00:00:00.000Z`);
      }
      const d = new Date(value);
      d.setHours(0, 0, 0, 0);
      return d;
    };

    const parseDayEnd = (value) => {
      if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return new Date(`${value}T23:59:59.999Z`);
      }
      const d = new Date(value);
      d.setHours(23, 59, 59, 999);
      return d;
    };

    // Only return future schedules by default
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (filters.date) {
      where.date = {
        gte: parseDayStart(filters.date),
        lte: parseDayEnd(filters.date),
      };
    } else if (filters.from && filters.to) {
      where.date = {
        gte: parseDayStart(filters.from),
        lte: parseDayEnd(filters.to),
      };
    } else {
      // Default: all future schedules
      where.date = { gte: today };
    }

    return await prisma.doctorSchedule.findMany({
      where,
      include: {
        slots: {
          include: { _count: { select: { bookings: true } } },
          orderBy: { startTime: 'asc' },
        },
        hospital: {
          select: { name: true },
        },
        createdBy: {
          select: {
            id: true,
            user: {
              select: { username: true },
            },
          },
        },
        doctor: {
          select: {
            fullName: true,
            clinicName: true,
            hospital: {
              select: { name: true },
            },
          },
        },
      },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    });
  },
};

module.exports = DoctorService;
