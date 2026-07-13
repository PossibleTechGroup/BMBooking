const prisma = require("../lib/prisma");
const { NotificationService } = require("./notification.service");
const SmsService = require("./sms.service");
const { generateConfirmationCode } = require("../utils/confirmationCode");

const DAY_MAP = {
  0: "sunday",
  1: "monday",
  2: "tuesday",
  3: "wednesday",
  4: "thursday",
  5: "friday",
  6: "saturday",
};

const ETHIOPIA_OFFSET = 3 * 60; // UTC+3 in minutes

const DEFAULT_OPERATING_HOURS = {
  monday: { open: "08:00", close: "17:00" },
  tuesday: { open: "08:00", close: "17:00" },
  wednesday: { open: "08:00", close: "17:00" },
  thursday: { open: "08:00", close: "17:00" },
  friday: { open: "08:00", close: "17:00" },
  saturday: { open: "08:00", close: "13:00" },
  sunday: { open: "08:00", close: "13:00" },
};

const EquipmentBookingService = {
  getOperatingHoursForDay: (equipment, date) => {
    const stored = equipment.operatingHours || {};
    const dayName = DAY_MAP[date.getDay()];
    const storedDay = stored[dayName];
    if (storedDay && storedDay.enabled === false) return null;
    const hours = { ...DEFAULT_OPERATING_HOURS, ...stored };
    const day = hours[dayName];
    if (!day) return null;
    return {
      open: day.open || day.start,
      close: day.close || day.end,
      duration: day.duration ? Number(day.duration) : equipment.duration,
    };
  },

  parseTime: (timeStr) => {
    const [hours, minutes] = timeStr.split(":").map(Number);
    return hours * 60 + minutes;
  },

  minutesToTime: (totalMinutes) => {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  },

  getAvailability: async (equipmentId, dateStr) => {
    const equipment = await prisma.medicalEquipment.findUnique({
      where: { id: equipmentId },
    });
    if (!equipment) throw new Error("Equipment not found");
    if (!equipment.isOperational) throw new Error("Equipment is not operational");

    const date = new Date(dateStr);
    const dayHours = EquipmentBookingService.getOperatingHoursForDay(equipment, date);
    if (!dayHours) {
      return { date: dateStr, operatingHours: null, slots: [] };
    }

    const openMinutes = EquipmentBookingService.parseTime(dayHours.open);
    const closeMinutes = EquipmentBookingService.parseTime(dayHours.close);
    const duration = dayHours.duration;

    const startOfDay = new Date(dateStr);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(dateStr);
    endOfDay.setHours(23, 59, 59, 999);

    const existingBookings = await prisma.equipmentBooking.findMany({
      where: {
        equipmentId,
        status: { in: ["pending", "confirmed"] },
        dateTime: { gte: startOfDay, lte: endOfDay },
      },
      orderBy: { dateTime: "asc" },
    });

    const slots = [];
    let current = openMinutes;
    while (current + duration <= closeMinutes) {
      const ethiopiaMinutes = current;
      const utcMinutes = ((ethiopiaMinutes - ETHIOPIA_OFFSET) % 1440 + 1440) % 1440;
      const slotStartUTC = new Date(dateStr);
      slotStartUTC.setUTCHours(Math.floor(utcMinutes / 60), utcMinutes % 60, 0, 0);
      const slotEndUTC = new Date(slotStartUTC.getTime() + duration * 60000);

      const conflicts = existingBookings.some((booking) => {
        const bookingStart = new Date(booking.dateTime);
        const bookingEnd = new Date(bookingStart.getTime() + duration * 60000);
        return slotStartUTC < bookingEnd && slotEndUTC > bookingStart;
      });

      slots.push({
        start: EquipmentBookingService.minutesToTime(current),
        end: EquipmentBookingService.minutesToTime(current + duration),
        booked: !!conflicts,
      });

      current += duration;
    }

    return {
      date: dateStr,
      operatingHours: dayHours,
      slots,
    };
  },

  createBooking: async (patientId, data) => {
    const equipment = await prisma.medicalEquipment.findUnique({
      where: { id: data.equipmentId },
      include: { hospital: true },
    });
    if (!equipment) throw new Error("Equipment not found");
    if (!equipment.isOperational) throw new Error("Equipment is not operational");

    const requestedDate = new Date(data.dateTime);
    const dayHours = EquipmentBookingService.getOperatingHoursForDay(equipment, requestedDate);
    if (!dayHours) throw new Error("Equipment is not available on this day");

    const requestMinutes =
      ((requestedDate.getUTCHours() * 60 + requestedDate.getUTCMinutes()) + ETHIOPIA_OFFSET) % 1440;
    const openMinutes = EquipmentBookingService.parseTime(dayHours.open);
    const closeMinutes = EquipmentBookingService.parseTime(dayHours.close);

    if (requestMinutes < openMinutes || requestMinutes + dayHours.duration > closeMinutes) {
      throw new Error("Requested time is outside operating hours");
    }

    const bookingEnd = new Date(requestedDate.getTime() + dayHours.duration * 60000);

    const conflict = await prisma.equipmentBooking.findFirst({
      where: {
        equipmentId: equipment.id,
        status: { in: ["pending", "confirmed"] },
        dateTime: { lt: bookingEnd },
        OR: [
          {
            dateTime: { gte: requestedDate },
          },
        ],
      },
    });

    if (conflict) {
      throw new Error(
        "Time slot is not available. Another booking overlaps with the requested time.",
      );
    }

    // Payment enforcement
    const equipmentPrice = equipment.price ? Number(equipment.price) : 0;
    const expectedFee = equipmentPrice > 0 ? equipmentPrice : 0;

    const fee = data.fee != null ? Math.round(Number(data.fee) * 100) / 100 : expectedFee;

    if (expectedFee > 0 && fee !== expectedFee) {
      throw new Error(
        `Payment of ${expectedFee} ETB is required for this booking.`,
      );
    }

    const code = generateConfirmationCode();
    const booking = await prisma.equipmentBooking.create({
      data: {
        patientId,
        equipmentId: equipment.id,
        hospitalId: equipment.hospitalId,
        dateTime: requestedDate,
        fee: fee > 0 ? fee : null,
        notes: data.notes || null,
        confirmationCode: code,
        status: "confirmed",
      },
      include: {
        equipment: {
          select: {
            id: true,
            name: true,
            category: true,
          },
        },
        hospital: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    try {
      const patientUser = await prisma.user.findUnique({
        where: { id: patientId },
        select: { phone: true, patientProfile: { select: { fullName: true } } },
      });
      if (patientUser) {
        await NotificationService.notifyBookingConfirmed(
          patientId,
          equipment.name,
          booking.id,
          code,
        );
        if (patientUser.phone) {
          await SmsService.sendBookingConfirmed(
            patientUser.phone,
            patientUser.patientProfile?.fullName || 'Patient',
            equipment.name,
            data.dateTime,
            equipment.hospital?.name || '',
            code,
          );
        }
      }
    } catch (err) {
      console.error("[NOTIFICATION] Failed to notify on equipment booking:", err.message);
    }

    return booking;
  },

  createBookingByReceptionist: async (data, receptionistProfile) => {
    const equipment = await prisma.medicalEquipment.findUnique({
      where: { id: data.equipmentId },
    });
    if (!equipment) throw new Error("Equipment not found");
    if (equipment.hospitalId !== receptionistProfile.hospitalId)
      throw new Error("Equipment does not belong to receptionist's hospital");
    if (!equipment.isOperational) throw new Error("Equipment is not operational");

    const requestedDate = new Date(data.dateTime);
    const duration = equipment.duration || 30;
    const bookingEnd = new Date(requestedDate.getTime() + duration * 60000);
    const lowerBound = new Date(requestedDate.getTime() - duration * 60000);

    const conflict = await prisma.equipmentBooking.findFirst({
      where: {
        equipmentId: equipment.id,
        status: { in: ["pending", "confirmed"] },
        dateTime: { gt: lowerBound, lt: bookingEnd },
      },
    });

    if (conflict) {
      throw new Error("Time slot conflicts with an existing booking");
    }

    const code = generateConfirmationCode();
    const booking = await prisma.equipmentBooking.create({
      data: {
        patientId: data.patientId,
        equipmentId: equipment.id,
        hospitalId: equipment.hospitalId,
        dateTime: requestedDate,
        fee: data.fee !== undefined ? Number(data.fee) : undefined,
        notes: data.notes || null,
        confirmationCode: code,
        status: "confirmed",
      },
      include: {
        patient: {
          select: {
            id: true,
            phone: true,
            patientProfile: { select: { fullName: true } },
          },
        },
        equipment: {
          select: { id: true, name: true, category: true, isOperational: true },
        },
        hospital: {
          select: { id: true, name: true },
        },
      },
    });

    try {
      const patientName = booking.patient?.patientProfile?.fullName || 'Patient';
      await NotificationService.notifyBookingConfirmed(
        booking.patient.id,
        booking.equipment.name,
        booking.id,
        code,
      );
      if (booking.patient.phone) {
        await SmsService.sendBookingConfirmed(
          booking.patient.phone,
          patientName,
          booking.equipment.name,
          data.dateTime,
          booking.hospital?.name || '',
          code,
        );
      }
    } catch (err) {
      console.error("[NOTIFICATION] Failed to notify on equipment booking:", err.message);
    }

    return booking;
  },

  getPatientBookings: async (patientId, filters = {}) => {
    const where = { patientId };

    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.date) {
      const start = new Date(filters.date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(filters.date);
      end.setHours(23, 59, 59, 999);
      where.dateTime = { gte: start, lte: end };
    }
    if (filters.from && filters.to) {
      where.dateTime = {
        gte: new Date(filters.from),
        lte: new Date(filters.to),
      };
    }

    return await prisma.equipmentBooking.findMany({
      where,
      include: {
        equipment: {
          select: {
            id: true,
            name: true,
            category: true,
            isOperational: true,
            hospitalId: true,
          },
        },
        hospital: {
          select: {
            id: true,
            name: true,
            address: true,
            phone: true,
          },
        },
      },
      orderBy: { dateTime: "desc" },
    });
  },

  cancelBooking: async (bookingId, patientId) => {
    const booking = await prisma.equipmentBooking.findFirst({
      where: { id: bookingId, patientId },
      include: {
        equipment: { select: { id: true, name: true, category: true } },
        patient: { select: { phone: true, patientProfile: { select: { fullName: true } } } },
      },
    });
    if (!booking) throw new Error("Booking not found");
    if (!["pending", "confirmed"].includes(booking.status)) {
      throw new Error("Only pending or confirmed bookings can be cancelled");
    }

    const result = await prisma.equipmentBooking.update({
      where: { id: bookingId },
      data: { status: "cancelled" },
      include: {
        equipment: {
          select: { id: true, name: true, category: true },
        },
        hospital: {
          select: { id: true, name: true },
        },
      },
    });

    try {
      await NotificationService.notifyBookingCancelled(
        patientId,
        booking.equipment?.name,
        bookingId,
      );
    } catch (err) {
      console.error("[NOTIFICATION] Failed on booking cancel:", err.message);
    }

    try {
      const name = booking.patient?.patientProfile?.fullName || "Patient";
      await SmsService.sendBookingCancelled(
        booking.patient?.phone,
        name,
        booking.equipment?.name,
      );
    } catch (err) {
      console.error("[SMS] Failed to send cancel SMS:", err.message);
    }

    return result;
  },

  getHospitalBookings: async (filters = {}, hospitalId) => {
    const where = { hospitalId };

    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.equipmentId) {
      where.equipmentId = filters.equipmentId;
    }
    if (filters.date) {
      const start = new Date(filters.date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(filters.date);
      end.setHours(23, 59, 59, 999);
      where.dateTime = { gte: start, lte: end };
    }
    if (filters.from && filters.to) {
      where.dateTime = {
        gte: new Date(filters.from),
        lte: new Date(filters.to),
      };
    }

    return await prisma.equipmentBooking.findMany({
      where,
      include: {
        patient: {
          select: {
            id: true,
            phone: true,
            patientProfile: {
              select: {
                fullName: true,
                gender: true,
                bloodType: true,
                dateOfBirth: true,
              },
            },
          },
        },
        equipment: {
          select: {
            id: true,
            name: true,
            category: true,
            isOperational: true,
          },
        },
      },
      orderBy: [{ dateTime: "asc" }],
    });
  },

  confirmBooking: async (bookingId, receptionistProfile) => {
    const booking = await prisma.equipmentBooking.findUnique({
      where: { id: bookingId },
      include: {
        equipment: true,
        patient: {
          select: {
            id: true,
            phone: true,
            patientProfile: { select: { fullName: true } },
          },
        },
      },
    });
    if (!booking) throw new Error("Booking not found");
    if (booking.hospitalId !== receptionistProfile.hospitalId) {
      throw new Error("Booking does not belong to receptionist's hospital");
    }
    if (booking.status !== "pending")
      throw new Error("Booking is not pending");
    if (booking.reviewedByReceptionistId) {
      throw new Error("Booking already reviewed by receptionist");
    }

    const duration = booking.equipment.duration;
    const bookingStart = new Date(booking.dateTime);
    const conflictWindowStart = new Date(
      bookingStart.getTime() - duration * 60000,
    );
    const conflictWindowEnd = new Date(
      bookingStart.getTime() + duration * 60000,
    );

    const conflict = await prisma.equipmentBooking.findFirst({
      where: {
        id: { not: bookingId },
        equipmentId: booking.equipmentId,
        status: "confirmed",
        dateTime: { gt: conflictWindowStart, lt: conflictWindowEnd },
      },
    });

    if (conflict) {
      throw new Error(
        "Time slot is no longer available. Another booking was confirmed for this time.",
      );
    }

    const updated = await prisma.equipmentBooking.update({
      where: { id: bookingId },
      data: {
        status: "confirmed",
        reviewedByReceptionistId: receptionistProfile.id,
        reviewedAt: new Date(),
      },
      include: {
        patient: {
          select: {
            id: true,
            phone: true,
            patientProfile: { select: { fullName: true } },
          },
        },
        equipment: {
          select: { id: true, name: true, category: true },
        },
        hospital: {
          select: { id: true, name: true },
        },
      },
    });

    // Notify patient via SMS (only after receptionist confirms)
    try {
      const phone = booking.patient?.phone || updated.patient?.phone;
      const patientName =
        booking.patient?.patientProfile?.fullName ||
        updated.patient?.patientProfile?.fullName ||
        "Patient";
      if (phone) {
        await SmsService.sendBookingConfirmed(
          phone,
          patientName,
          updated.equipment?.name || booking.equipment.name,
          booking.dateTime,
          updated.hospital?.name || '',
          updated.confirmationCode || '',
        );
      }
    } catch (err) {
      console.error("[SMS] Failed to notify patient on confirmation:", err.message);
    }

    return updated;
  },

  declineBooking: async (bookingId, reason, receptionistProfile) => {
    const booking = await prisma.equipmentBooking.findUnique({
      where: { id: bookingId },
      include: { equipment: true },
    });
    if (!booking) throw new Error("Booking not found");
    if (booking.hospitalId !== receptionistProfile.hospitalId) {
      throw new Error("Booking does not belong to receptionist's hospital");
    }
    if (booking.status !== "pending")
      throw new Error("Booking is not pending");
    if (booking.reviewedByReceptionistId) {
      throw new Error("Booking already reviewed by receptionist");
    }

    return await prisma.equipmentBooking.update({
      where: { id: bookingId },
      data: {
        status: "declined",
        declineReason: reason || null,
        reviewedByReceptionistId: receptionistProfile.id,
        reviewedAt: new Date(),
      },
      include: {
        equipment: {
          select: { id: true, name: true, category: true },
        },
        hospital: {
          select: { id: true, name: true },
        },
      },
    });
  },

  completeBooking: async (bookingId, receptionistProfile) => {
    const booking = await prisma.equipmentBooking.findUnique({
      where: { id: bookingId },
    });
    if (!booking) throw new Error("Booking not found");
    if (booking.hospitalId !== receptionistProfile.hospitalId) {
      throw new Error("Booking does not belong to receptionist's hospital");
    }
    if (booking.status !== "confirmed")
      throw new Error("Booking is not confirmed");

    return await prisma.equipmentBooking.update({
      where: { id: bookingId },
      data: { status: "completed" },
      include: {
        equipment: {
          select: { id: true, name: true, category: true },
        },
        hospital: {
          select: { id: true, name: true },
        },
      },
    });
  },

  cancelBookingByReceptionist: async (bookingId, receptionistProfile) => {
    const booking = await prisma.equipmentBooking.findUnique({
      where: { id: bookingId },
      include: {
        equipment: true,
        patient: {
          select: {
            id: true,
            phone: true,
            patientProfile: { select: { fullName: true } },
          },
        },
      },
    });
    if (!booking) throw new Error("Booking not found");
    if (booking.hospitalId !== receptionistProfile.hospitalId)
      throw new Error("Booking does not belong to receptionist's hospital");
    if (!["pending", "confirmed"].includes(booking.status))
      throw new Error("Only pending or confirmed bookings can be cancelled");

    const result = await prisma.equipmentBooking.update({
      where: { id: bookingId },
      data: { status: "cancelled" },
      include: {
        patient: {
          select: {
            id: true,
            phone: true,
            patientProfile: { select: { fullName: true } },
          },
        },
        equipment: { select: { id: true, name: true, category: true } },
      },
    });

    try {
      await NotificationService.notifyBookingCancelled(
        result.patient.id,
        result.equipment?.name,
        bookingId,
      );
    } catch (err) {
      console.error("[NOTIFICATION] Failed on booking cancel:", err.message);
    }

    try {
      const name = result.patient?.patientProfile?.fullName || 'Patient';
      if (result.patient?.phone) {
        await SmsService.sendBookingCancelled(
          result.patient.phone,
          name,
          result.equipment?.name || 'equipment',
        );
      }
    } catch (err) {
      console.error("[SMS] Failed to send cancel SMS:", err.message);
    }

    return result;
  },

  rescheduleBooking: async (bookingId, newDateTime, receptionistProfile) => {
    const booking = await prisma.equipmentBooking.findUnique({
      where: { id: bookingId },
      include: {
        equipment: true,
        patient: { select: { id: true } },
      },
    });
    if (!booking) throw new Error("Booking not found");
    if (booking.hospitalId !== receptionistProfile.hospitalId)
      throw new Error("Booking does not belong to receptionist's hospital");
    if (!["pending", "confirmed"].includes(booking.status))
      throw new Error("Only pending or confirmed bookings can be rescheduled");

    const newDate = new Date(newDateTime);
    const dayHours = EquipmentBookingService.getOperatingHoursForDay(booking.equipment, newDate);
    const duration = dayHours ? dayHours.duration : booking.equipment.duration;
    if (!dayHours)
      throw new Error("Equipment is not available on this day");

    const requestMinutes = ((newDate.getUTCHours() * 60 + newDate.getUTCMinutes()) + ETHIOPIA_OFFSET) % 1440;
    const openMinutes = EquipmentBookingService.parseTime(dayHours.open);
    const closeMinutes = EquipmentBookingService.parseTime(dayHours.close);

    if (requestMinutes < openMinutes || requestMinutes + duration > closeMinutes)
      throw new Error("New time is outside operating hours");

    const bookingEnd = new Date(newDate.getTime() + duration * 60000);
    const conflict = await prisma.equipmentBooking.findFirst({
      where: {
        id: { not: bookingId },
        equipmentId: booking.equipmentId,
        status: { in: ["pending", "confirmed"] },
        dateTime: { lt: bookingEnd },
        OR: [{ dateTime: { gte: newDate } }],
      },
    });
    if (conflict) throw new Error("New time slot conflicts with another booking");

    const updateData = { dateTime: newDate };

    if (booking.status === "confirmed") {
    }

    const result = await prisma.equipmentBooking.update({
      where: { id: bookingId },
      data: updateData,
      include: {
        patient: {
          select: {
            id: true,
            phone: true,
            patientProfile: { select: { fullName: true } },
          },
        },
        equipment: { select: { id: true, name: true, category: true } },
        hospital: { select: { name: true } },
      },
    });

    try {
      await NotificationService.notifyBookingRescheduled(
        result.patient.id,
        result.equipment?.name,
        newDateTime,
        bookingId,
        result.confirmationCode || '',
      );
    } catch (err) {
      console.error("[NOTIFICATION] Failed on booking reschedule:", err.message);
    }

    try {
      const name = result.patient?.patientProfile?.fullName || 'Patient';
      if (result.patient?.phone) {
        await SmsService.sendBookingRescheduled(
          result.patient.phone,
          name,
          result.equipment?.name || 'equipment',
          newDateTime,
          result.hospital?.name || '',
          result.confirmationCode || '',
        );
      }
    } catch (err) {
      console.error("[SMS] Failed to send reschedule SMS:", err.message);
    }

    return result;
  },

  updateBookingNotes: async (bookingId, notes, receptionistProfile) => {
    const booking = await prisma.equipmentBooking.findUnique({
      where: { id: bookingId },
    });
    if (!booking) throw new Error("Booking not found");
    if (booking.hospitalId !== receptionistProfile.hospitalId)
      throw new Error("Booking does not belong to receptionist's hospital");

    return await prisma.equipmentBooking.update({
      where: { id: bookingId },
      data: { notes: notes || null },
      include: {
        equipment: { select: { id: true, name: true, category: true } },
        hospital: { select: { id: true, name: true } },
      },
    });
  },

  rescheduleBookingForPatient: async (bookingId, patientId, newDateTime) => {
    const booking = await prisma.equipmentBooking.findFirst({
      where: { id: bookingId, patientId },
      include: {
        equipment: { select: { id: true, name: true, category: true } },
        patient: { select: { phone: true, patientProfile: { select: { fullName: true } } } },
      },
    });
    if (!booking) throw new Error("Booking not found");
    if (!["pending", "confirmed"].includes(booking.status))
      throw new Error("Only pending or confirmed bookings can be rescheduled");

    const result = await prisma.equipmentBooking.update({
      where: { id: bookingId },
      data: { dateTime: new Date(newDateTime) },
      include: {
        patient: {
          select: {
            id: true,
            phone: true,
            patientProfile: { select: { fullName: true } },
          },
        },
        equipment: { select: { id: true, name: true, category: true } },
        hospital: { select: { id: true, name: true } },
      },
    });

    try {
      await NotificationService.notifyBookingRescheduled(
        result.patient.id,
        result.equipment?.name,
        newDateTime,
        bookingId,
        result.confirmationCode || '',
      );
    } catch (err) {
      console.error("[NOTIFICATION] Failed on booking reschedule:", err.message);
    }

    try {
      const name = result.patient?.patientProfile?.fullName || "Patient";
      await SmsService.sendBookingRescheduled(
        result.patient?.phone,
        name,
        result.equipment?.name,
        newDateTime,
        result.hospital?.name || '',
        result.confirmationCode || '',
      );
    } catch (err) {
      console.error("[SMS] Failed to send reschedule SMS:", err.message);
    }

    return result;
  },
};

module.exports = EquipmentBookingService;
