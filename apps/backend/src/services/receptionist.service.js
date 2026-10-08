const prisma = require("../lib/prisma");
const bcrypt = require("bcryptjs");
const { NotificationService } = require("./notification.service");
const SmsService = require("./sms.service");
const { formatEthiopianLocalTimeDual } = require("../utils/dateFormat");
function fmtTime(d) {
  return formatEthiopianLocalTimeDual(d);
}
function fmtDate(d) {
  return d.toLocaleDateString('en-US', { timeZone: 'Africa/Nairobi', year: 'numeric', month: 'short', day: 'numeric' });
}

const ReceptionistService = {
  createDoctorSchedule: async (data, hospitalId) => {
    const doctor = await prisma.doctorProfile.findUnique({
      where: { id: data.doctorId },
    });
    if (!doctor) {
      throw new Error("Doctor not found");
    }
    if (doctor.status !== 'Approved') {
      throw new Error("Cannot create schedule for a doctor whose profile is not yet approved");
    }

    const startTime = new Date(data.startTime);
    let endTime = new Date(data.endTime);

    // If end time is on same calendar day but before or equal to start time,
    // assume it's end of day (e.g., 00:00 means end of day midnight-next-day semantics)
    if (endTime <= startTime) {
      endTime = new Date(startTime);
      endTime.setDate(endTime.getDate() + 1);
      endTime.setHours(0, 0, 0, 0);
    }

    const slotDuration = data.slotDuration || 30;
    const maxPatientsPerSlot = data.maxPatientsPerSlot || 1;
    const repeatWeeks = data.repeatWeeks || 1;
    const daysOfWeek = data.daysOfWeek;
    const repeatEndDate = data.repeatEndDate ? new Date(data.repeatEndDate) : null;
    const baseDate = new Date(data.date);

    const createSingleSchedule = async (tx, dateStr) => {
        // dateStr is always a plain "YYYY-MM-DD" string — no timezone ambiguity
        let schedStart = new Date(`${dateStr}T${startTime.toISOString().split("T")[1]}`);
        let schedEnd   = new Date(`${dateStr}T${endTime.toISOString().split("T")[1]}`);
        if (schedEnd <= schedStart) {
          schedEnd = new Date(schedStart);
          schedEnd.setUTCDate(schedEnd.getUTCDate() + 1);
          schedEnd.setUTCHours(0, 0, 0, 0);
        }
        const dateObj    = new Date(`${dateStr}T00:00:00.000Z`);

      const overlap = await tx.doctorSchedule.findFirst({
        where: {
          doctorId: data.doctorId,
          OR: [
            {
              startTime: { lt: schedEnd },
              endTime: { gt: schedStart }
            }
          ]
        }
      });
      if (overlap) {
        throw new Error(
          `Double booking detected: Doctor already has a schedule from ${fmtTime(overlap.startTime)} to ${fmtTime(overlap.endTime)} on ${fmtDate(overlap.date)}`
        );
      }

      const schedule = await tx.doctorSchedule.create({
        data: {
          doctorId: data.doctorId,
          hospitalId: hospitalId || undefined,
          createdById: data.createdById || undefined,
          date: dateObj,
          startTime: schedStart,
          endTime: schedEnd,
          slotDuration,
          maxPatientsPerSlot,
          isActive: data.isActive !== undefined ? data.isActive : true,
          clinicRoom: data.clinicRoom || null,
          notes: data.notes || null,
        },
        include: {
          doctor: {
            select: { id: true, fullName: true, specialization: true },
          },
          hospital: {
            select: { id: true, name: true },
          },
          createdBy: {
            select: {
              id: true,
              user: { select: { username: true } },
            },
          },
        },
      });

      const slots = [];
      let slotStart = new Date(schedStart);
      while (slotStart < schedEnd) {
        const slotEnd = new Date(slotStart.getTime() + slotDuration * 60000);
        const slotStartUTC = `${String(slotStart.getUTCHours()).padStart(2,'0')}:${String(slotStart.getUTCMinutes()).padStart(2,'0')}`;
        const slotEndUTC   = `${String(slotEnd.getUTCHours()).padStart(2,'0')}:${String(slotEnd.getUTCMinutes()).padStart(2,'0')}`;
        slots.push({
          scheduleId: schedule.id,
          startTime: new Date(`${dateStr}T${slotStartUTC}:00.000Z`),
          endTime:   new Date(`${dateStr}T${slotEndUTC}:00.000Z`),
          maxPatients: maxPatientsPerSlot,
        });
        slotStart = slotEnd;
      }

      await tx.scheduleSlot.createMany({ data: slots });
      return schedule;
    };

    const schedules = await prisma.$transaction(async (tx) => {
      const created = [];

      if (daysOfWeek && daysOfWeek.length > 0 && repeatEndDate) {
        // Iterate day-by-day using pure UTC date strings to avoid timezone drift
        const endStr = repeatEndDate.toISOString().split("T")[0];
        let [cy, cm, cd] = baseDate.toISOString().split("T")[0].split("-").map(Number);
        while (true) {
          const curStr = `${cy}-${String(cm).padStart(2,'0')}-${String(cd).padStart(2,'0')}`;
          if (curStr > endStr) break;
          // getUTCDay() on a UTC-midnight date gives correct day-of-week
          const dow = new Date(`${curStr}T00:00:00.000Z`).getUTCDay();
          if (daysOfWeek.includes(dow)) {
            const sched = await createSingleSchedule(tx, curStr);
            created.push(sched.id);
          }
          // advance one day in UTC
          cd++;
          const daysInMonth = new Date(Date.UTC(cy, cm, 0)).getDate();
          if (cd > daysInMonth) { cd = 1; cm++; }
          if (cm > 12) { cm = 1; cy++; }
        }
      } else {
        for (let w = 0; w < repeatWeeks; w++) {
          // advance by weeks using UTC date strings
          const base = baseDate.toISOString().split("T")[0];
          const [by, bm, bd] = base.split("-").map(Number);
          const weekDate = new Date(Date.UTC(by, bm - 1, bd + w * 7));
          const weekStr = weekDate.toISOString().split("T")[0];
          const sched = await createSingleSchedule(tx, weekStr);
          created.push(sched.id);
        }
      }

      return tx.doctorSchedule.findMany({
        where: { id: { in: created } },
        include: {
          doctor: { select: { id: true, fullName: true, specialization: true } },
          hospital: { select: { id: true, name: true } },
          createdBy: {
            select: {
              id: true,
              user: { select: { username: true } },
            },
          },
          slots: {
            include: { _count: { select: { bookings: true } } },
            orderBy: { startTime: "asc" },
          },
        },
        orderBy: { date: "asc" },
      });
    }, {
      maxWait: 15000,
      timeout: 30000,
    });

    return schedules;
  },

  updateDoctorSchedule: async (scheduleId, data, hospitalId) => {
    const existing = await prisma.doctorSchedule.findUnique({
      where: { id: scheduleId },
      include: { doctor: true, slots: { include: { _count: { select: { bookings: true } }, bookings: { select: { id: true, dateTime: true } } } } },
    });
    if (!existing) {
      throw new Error("Schedule not found");
    }
    if (existing.doctor.hospitalId !== hospitalId) {
      throw new Error("Schedule does not belong to receptionist's hospital");
    }

    if (data.doctorId && data.doctorId !== existing.doctorId) {
      const doctor = await prisma.doctorProfile.findUnique({
        where: { id: data.doctorId },
      });
      if (!doctor) {
        throw new Error("Doctor not found");
      }
      if (doctor.hospitalId !== hospitalId) {
        throw new Error("Doctor does not belong to receptionist's hospital");
      }
      if (doctor.status !== 'Approved') {
        throw new Error("Cannot assign schedule to a doctor whose profile is not yet approved");
      }
    }

    const updateData = {};
    if (data.doctorId) updateData.doctorId = data.doctorId;
    if (data.date) updateData.date = new Date(data.date);
    if (data.startTime) updateData.startTime = new Date(data.startTime);
    if (data.endTime) updateData.endTime = new Date(data.endTime);
    if (data.slotDuration !== undefined)
      updateData.slotDuration = data.slotDuration;
    if (data.maxPatientsPerSlot !== undefined)
      updateData.maxPatientsPerSlot = data.maxPatientsPerSlot;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.clinicRoom !== undefined) updateData.clinicRoom = data.clinicRoom;
    if (data.notes !== undefined) updateData.notes = data.notes;

    let finalStart = updateData.startTime || existing.startTime;
    let finalEnd = updateData.endTime || existing.endTime;
    if (finalEnd <= finalStart) {
      finalEnd = new Date(finalStart);
      finalEnd.setDate(finalEnd.getDate() + 1);
      finalEnd.setHours(0, 0, 0, 0);
    }

    const finalDate = updateData.date || existing.date;
    const dayStr = new Date(finalDate).toISOString().split("T")[0];
    let schedStart = new Date(`${dayStr}T${new Date(finalStart).toISOString().split("T")[1]}`);
    let schedEnd = new Date(`${dayStr}T${new Date(finalEnd).toISOString().split("T")[1]}`);
    if (schedEnd <= schedStart) {
      schedEnd = new Date(schedStart);
      schedEnd.setUTCDate(schedEnd.getUTCDate() + 1);
      schedEnd.setUTCHours(0, 0, 0, 0);
    }

    const overlap = await prisma.doctorSchedule.findFirst({
      where: {
        id: { not: scheduleId },
        doctorId: updateData.doctorId || existing.doctorId,
        OR: [
          {
            startTime: { lt: schedEnd },
            endTime: { gt: schedStart }
          }
        ]
      }
    });
    if (overlap) {
      throw new Error(
        `Double booking detected: Doctor already has a schedule from ${fmtTime(overlap.startTime)} to ${fmtTime(overlap.endTime)} on ${fmtDate(overlap.date)}`
      );
    }

    if (updateData.startTime) updateData.startTime = schedStart;
    if (updateData.endTime) updateData.endTime = schedEnd;

    // Regenerate slots if times/duration/maxPatients changed
    const needsSlotRegen =
      data.startTime || data.endTime || data.slotDuration !== undefined || data.maxPatientsPerSlot !== undefined;
    if (needsSlotRegen) {
      // Collect bookings from old slots before deleting
      const existingBookings = existing.slots.flatMap((s) =>
        s.bookings.map((b) => ({ id: b.id, dateTime: new Date(b.dateTime) }))
      );

      await prisma.scheduleSlot.deleteMany({ where: { scheduleId } });

      // Create new slots
      const newSlotData = [];
      let slotStart = new Date(schedStart);
      while (slotStart < schedEnd) {
        const slotEnd = new Date(slotStart.getTime() + (updateData.slotDuration ?? existing.slotDuration) * 60000);
        newSlotData.push({
          scheduleId,
          startTime: new Date(`${dayStr}T${slotStart.toTimeString().slice(0, 5)}:00.000Z`),
          endTime: new Date(`${dayStr}T${slotEnd.toTimeString().slice(0, 5)}:00.000Z`),
          maxPatients: updateData.maxPatientsPerSlot ?? existing.maxPatientsPerSlot,
        });
        slotStart = slotEnd;
      }
      await prisma.scheduleSlot.createMany({ data: newSlotData });

      // Reassign existing bookings to best-matching new slots
      if (existingBookings.length > 0) {
        const createdSlots = await prisma.scheduleSlot.findMany({
          where: { scheduleId },
          orderBy: { startTime: "asc" },
        });

        for (const booking of existingBookings) {
          let bestSlot = createdSlots[0];
          let bestDiff = Infinity;

          for (const newSlot of createdSlots) {
            const ns = { startTime: new Date(newSlot.startTime), endTime: new Date(newSlot.endTime) };
            if (booking.dateTime >= ns.startTime && booking.dateTime < ns.endTime) {
              bestSlot = newSlot;
              break;
            }
            const diff = Math.abs(ns.startTime.getTime() - booking.dateTime.getTime());
            if (diff < bestDiff) {
              bestDiff = diff;
              bestSlot = newSlot;
            }
          }

          await prisma.appointment.update({
            where: { id: booking.id },
            data: { slotId: bestSlot.id },
          });
        }
      }
    }

    return await prisma.doctorSchedule.update({
      where: { id: scheduleId },
      data: updateData,
      include: {
        doctor: {
          select: { id: true, fullName: true, specialization: true },
        },
        slots: {
          include: { _count: { select: { bookings: true } } },
          orderBy: { startTime: "asc" },
        },
      },
    });
  },

  deleteDoctorSchedule: async (scheduleId, hospitalId) => {
    const existing = await prisma.doctorSchedule.findUnique({
      where: { id: scheduleId },
      include: { doctor: true },
    });
    if (!existing) {
      throw new Error("Schedule not found");
    }
    if (existing.doctor.hospitalId !== hospitalId) {
      throw new Error("Schedule does not belong to receptionist's hospital");
    }

    // Check if there are any appointments in any slots under this schedule or for this doctor in this timeframe
    const appointmentsCount = await prisma.appointment.count({
      where: {
        OR: [
          { slot: { scheduleId: scheduleId } },
          {
            doctorId: existing.doctorId,
            dateTime: {
              gte: existing.startTime,
              lte: existing.endTime,
            },
          },
        ],
      },
    });

    if (appointmentsCount > 0) {
      throw new Error("Cannot delete schedule because there are active appointments booked in this timeframe");
    }

    await prisma.doctorSchedule.delete({ where: { id: scheduleId } });
    return { success: true, message: "Schedule deleted successfully" };
  },

  getDoctorSchedule: async (scheduleId, hospitalId) => {
    const schedule = await prisma.doctorSchedule.findUnique({
      where: { id: scheduleId },
      include: {
        doctor: {
          select: {
            id: true,
            fullName: true,
            specialization: true,
            hospitalId: true,
          },
        },
        hospital: {
          select: { id: true, name: true },
        },
        createdBy: {
          select: {
            id: true,
            user: { select: { username: true } },
          },
        },
        slots: {
          include: { _count: { select: { bookings: true } } },
          orderBy: { startTime: "asc" },
        },
      },
    });

    if (!schedule) {
      throw new Error("Schedule not found");
    }

    return schedule;
  },

  getDoctorSchedules: async (filters = {}, hospitalId) => {
    const where = { doctor: { status: 'Approved' }, hospitalId };

    if (filters.doctorId) {
      where.doctorId = filters.doctorId;
    }

    // Schedule dates are stored as `YYYY-MM-DDT00:00:00.000Z` (UTC midnight of
    // the civil date), so day windows must be built in UTC. Local `setHours`
    // produced a window shifted by the server offset and missed the target day.
    const dayStr = (value) => String(value).slice(0, 10);
    const dayStart = (value) => new Date(`${dayStr(value)}T00:00:00.000Z`);
    const dayEnd = (value) => new Date(`${dayStr(value)}T23:59:59.999Z`);

    if (filters.date) {
      where.date = { gte: dayStart(filters.date), lte: dayEnd(filters.date) };
    }

    if (filters.from && filters.to) {
      where.date = { gte: dayStart(filters.from), lte: dayEnd(filters.to) };
    }

    return await prisma.doctorSchedule.findMany({
      where,
      include: {
        doctor: {
          select: {
            id: true,
            fullName: true,
            specialization: true,
          },
        },
        hospital: {
          select: { id: true, name: true },
        },
        createdBy: {
          select: {
            id: true,
            user: { select: { username: true } },
          },
        },
        slots: {
          include: { _count: { select: { bookings: true } } },
          orderBy: { startTime: "asc" },
        },
      },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
    });
  },

  getHospitalAppointments: async (filters = {}, hospitalId) => {
    const where = {
      doctor: { hospitalId },
    };

    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.doctorId) {
      where.doctorId = filters.doctorId;
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
    if (filters.confirmationCode) {
      where.confirmationCode = { startsWith: filters.confirmationCode, mode: 'insensitive' };
    }

    return await prisma.appointment.findMany({
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
        doctor: {
          select: {
            id: true,
            fullName: true,
            specialization: true,
            hospitalId: true,
          },
        },
        slot: {
          select: { id: true, startTime: true },
        },
      },
      orderBy: { dateTime: "asc" },
    });
  },

  getUpcomingAppointments: async (filters = {}, hospitalId) => {
    const now = new Date();
    const where = {
      doctor: { hospitalId },
      dateTime: { gte: now },
      status: { in: ["pending", "accepted"] },
    };

    if (filters.doctorId) {
      where.doctorId = filters.doctorId;
    }
    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.from) {
      where.dateTime = { ...where.dateTime, gte: new Date(filters.from) };
    }
    if (filters.to) {
      where.dateTime = { ...where.dateTime, lte: new Date(filters.to) };
    }

    return await prisma.appointment.findMany({
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
        doctor: {
          select: {
            id: true,
            fullName: true,
            specialization: true,
            hospitalId: true,
          },
        },
        slot: {
          select: { id: true, startTime: true },
        },
      },
      orderBy: { dateTime: "asc" },
    });
  },

  validateSlotCapacity: async (slotId, doctorId, dateTime) => {
    const slot = await prisma.scheduleSlot.findUnique({
      where: { id: slotId },
      include: {
        schedule: true,
        _count: { select: { bookings: true } },
      },
    });
    if (!slot) throw new Error("Slot not found");
    if (slot.schedule.doctorId !== doctorId) {
      throw new Error("Slot does not belong to this doctor");
    }

    const aptTime = new Date(dateTime).getTime();
    const slotStart = new Date(slot.startTime).getTime();
    const slotEnd = new Date(slot.endTime).getTime();
    if (aptTime < slotStart || aptTime >= slotEnd) {
      throw new Error("Appointment time does not fall within this slot");
    }

    if (slot._count.bookings >= slot.maxPatients) {
      throw new Error("This slot is already full");
    }

    return slot;
  },

  approveAppointment: async (appointmentId, receptionistProfile, slotId) => {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { doctor: true },
    });
    if (!appointment) throw new Error("Appointment not found");
    if (appointment.doctor.hospitalId !== receptionistProfile.hospitalId) {
      throw new Error("Appointment does not belong to receptionist's hospital");
    }
    if (appointment.status !== "pending")
      throw new Error("Appointment is not pending");
    if (appointment.reviewedByReceptionistId) {
      throw new Error("Appointment already reviewed by receptionist");
    }

    if (slotId) {
      await ReceptionistService.validateSlotCapacity(
        slotId,
        appointment.doctorId,
        appointment.dateTime,
      );
    }

    const updateData = {
      status: "accepted",
      reviewedByReceptionistId: receptionistProfile.id,
      reviewedAt: new Date(),
    };
    if (slotId) updateData.slotId = slotId;

    const result = await prisma.appointment.update({
      where: { id: appointmentId },
      data: updateData,
      include: {
        patient: {
          select: {
            id: true,
            phone: true,
            patientProfile: { select: { fullName: true } },
          },
        },
        doctor: {
          select: { fullName: true, specialization: true, hospital: { select: { name: true } } },
        },
      },
    });

    try {
      await NotificationService.notifyAppointmentAccepted(
        result.patient.id,
        result.doctor?.fullName,
        appointmentId,
      );
    } catch (err) {
      console.error(
        "[NOTIFICATION] Failed to notify on receptionist approve:",
        err.message,
      );
    }

    // SMS notification to patient
    try {
      if (result.patient?.phone) {
        const patientName = result.patient?.patientProfile?.fullName || 'Patient';
        await SmsService.sendAppointmentConfirmation(
          result.patient.phone,
          patientName,
          result.doctor?.fullName || 'Doctor',
          appointment.dateTime,
          result.doctor?.specialization,
          result.doctor?.hospital?.name,
          Number(appointment.fee),
          appointment.confirmationCode,
        );
      }
    } catch (err) {
      console.error("[SMS] Failed to send approval SMS:", err.message);
    }

    return result;
  },

  denyAppointment: async (appointmentId, reason, receptionistProfile) => {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { doctor: true },
    });
    if (!appointment) throw new Error("Appointment not found");
    if (appointment.doctor.hospitalId !== receptionistProfile.hospitalId) {
      throw new Error("Appointment does not belong to receptionist's hospital");
    }
    if (appointment.status !== "pending")
      throw new Error("Appointment is not pending");
    if (appointment.reviewedByReceptionistId) {
      throw new Error("Appointment already reviewed by receptionist");
    }

    const result = await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: "declined",
        declineReason: reason || null,
        reviewedByReceptionistId: receptionistProfile.id,
        reviewedAt: new Date(),
      },
      include: {
        patient: { select: { id: true } },
        doctor: { select: { fullName: true, specialization: true } },
      },
    });

    try {
      await NotificationService.notifyReceptionistDeclined(
        result.patient.id,
        result.doctor?.fullName,
        appointmentId,
        reason,
      );
    } catch (err) {
      console.error(
        "[NOTIFICATION] Failed to notify on receptionist deny:",
        err.message,
      );
    }

    // SMS notification to patient
    try {
      const patient = await prisma.user.findUnique({
        where: { id: result.patient.id },
        select: { phone: true },
      });
      if (patient?.phone) {
        const patientProfile = await prisma.patientProfile.findUnique({
          where: { userId: result.patient.id },
          select: { fullName: true },
        });
        await SmsService.sendAppointmentDeclined(
          patient.phone,
          patientProfile?.fullName || 'Patient',
          result.doctor?.fullName || 'Doctor',
          reason,
          result.doctor?.specialization,
        );
      }
    } catch (err) {
      console.error("[SMS] Failed to send denial SMS:", err.message);
    }

    return result;
  },

  updateEquipmentStatus: async (equipmentId, isOperational, hospitalId) => {
    const equipment = await prisma.medicalEquipment.findUnique({
      where: { id: equipmentId },
    });
    if (!equipment) throw new Error("Equipment not found");
    if (equipment.hospitalId !== hospitalId)
      throw new Error("Equipment does not belong to receptionist's hospital");

    return await prisma.medicalEquipment.update({
      where: { id: equipmentId },
      data: { isOperational },
      include: {
        hospital: { select: { id: true, name: true } },
      },
    });
  },

  updateEquipmentOperatingHours: async (equipmentId, operatingHours, duration, hospitalId) => {
    const equipment = await prisma.medicalEquipment.findUnique({
      where: { id: equipmentId },
    });
    if (!equipment) throw new Error("Equipment not found");
    if (equipment.hospitalId !== hospitalId)
      throw new Error("Equipment does not belong to receptionist's hospital");

    const data = {};
    if (operatingHours) {
      const normalized = {};
      for (const [day, val] of Object.entries(operatingHours)) {
        if (val && typeof val === 'object') {
          normalized[day] = {
            open: val.open || val.start || '08:00',
            close: val.close || val.end || '17:00',
            ...(val.enabled !== undefined ? { enabled: val.enabled } : {}),
          };
        }
      }
      data.operatingHours = normalized;
    }
    if (duration !== undefined) {
      data.duration = duration;
    }

    return await prisma.medicalEquipment.update({
      where: { id: equipmentId },
      data,
      select: { id: true, name: true, operatingHours: true, duration: true },
    });
  },

  updateEquipment: async (equipmentId, data, hospitalId) => {
    const equipment = await prisma.medicalEquipment.findUnique({
      where: { id: equipmentId },
    });
    if (!equipment) throw new Error("Equipment not found");
    if (equipment.hospitalId !== hospitalId)
      throw new Error("Equipment does not belong to receptionist's hospital");

    const updateData = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.price !== undefined) updateData.price = data.price;
    if (data.isOperational !== undefined) updateData.isOperational = data.isOperational;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.duration !== undefined) updateData.duration = data.duration;

    if (data.operatingHours !== undefined) {
      const merged = equipment.operatingHours ? { ...equipment.operatingHours } : {};
      for (const day of Object.keys(data.operatingHours)) {
        const d = data.operatingHours[day];
        merged[day] = {
          start: d.start,
          end: d.end,
          enabled: d.enabled ?? true,
          duration: d.duration !== undefined ? Number(d.duration) : undefined,
        };
      }
      updateData.operatingHours = merged;
    }

    return await prisma.medicalEquipment.update({
      where: { id: equipmentId },
      data: updateData,
    });
  },

  createEquipment: async (data) => {
    return await prisma.medicalEquipment.create({
      data: {
        name: data.name,
        category: data.category,
        doctorName: data.doctorName || null,
        hospitalId: data.hospitalId,
        price: data.price !== undefined ? Number(data.price) : undefined,
        operatingHours: data.operatingHours || undefined,
        duration: data.duration || 30,
        isOperational: data.isOperational !== undefined ? data.isOperational : true,
        description: data.description || null,
        photo: data.photo || null,
      },
    });
  },

  deleteEquipment: async (equipmentId, hospitalId) => {
    const equipment = await prisma.medicalEquipment.findUnique({
      where: { id: equipmentId },
      include: { bookings: { take: 1, where: { status: { notIn: ["completed", "cancelled"] } } } },
    });
    if (!equipment) throw new Error("Equipment not found");
    if (equipment.hospitalId !== hospitalId)
      throw new Error("Equipment does not belong to receptionist's hospital");
    if (equipment.bookings.length > 0)
      throw new Error("Cannot delete equipment with active or pending bookings");

    return await prisma.medicalEquipment.delete({ where: { id: equipmentId } });
  },

  cancelAppointment: async (appointmentId, hospitalId) => {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        doctor: true,
        patient: { select: { id: true, phone: true } },
      },
    });
    if (!appointment) throw new Error("Appointment not found");
    if (appointment.doctor.hospitalId !== hospitalId)
      throw new Error("Appointment does not belong to receptionist's hospital");
    if (!["pending", "accepted"].includes(appointment.status))
      throw new Error("Only pending or accepted appointments can be cancelled");

    const result = await prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: "cancelled" },
      include: {
        patient: { select: { id: true } },
        doctor: { select: { fullName: true } },
      },
    });

    try {
      await NotificationService.notifyAppointmentCancelled(
        result.patient.id,
        result.doctor?.fullName,
        appointmentId,
      );
    } catch (err) {
      console.error("[NOTIFICATION] Failed on cancel:", err.message);
    }

    // SMS notification to patient
    try {
      if (appointment.patient?.phone) {
        const patientProfile = await prisma.patientProfile.findUnique({
          where: { userId: appointment.patient.id },
          select: { fullName: true },
        });
        await SmsService.sendAppointmentCancelled(
          appointment.patient.phone,
          patientProfile?.fullName || 'Patient',
          appointment.doctor?.fullName || 'Doctor',
          appointment.doctor?.specialization,
        );
      }
    } catch (err) {
      console.error("[SMS] Failed to send cancellation SMS:", err.message);
    }

    return result;
  },

  rescheduleAppointment: async (appointmentId, newDateTime, hospitalId) => {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        doctor: { include: { hospital: true } },
        patient: { select: { id: true } },
      },
    });
    if (!appointment) throw new Error("Appointment not found");
    if (appointment.doctor.hospitalId !== hospitalId)
      throw new Error("Appointment does not belong to receptionist's hospital");
    if (!["pending", "accepted"].includes(appointment.status))
      throw new Error("Only pending or accepted appointments can be rescheduled");

    const newDate = new Date(newDateTime);
    const duration = appointment.duration;
    const newEnd = new Date(newDate.getTime() + duration * 60000);

    const conflict = await prisma.appointment.findFirst({
      where: {
        id: { not: appointmentId },
        doctorId: appointment.doctorId,
        status: { in: ["pending", "accepted"] },
        dateTime: { lt: newEnd },
        OR: [{ dateTime: { gte: newDate } }],
      },
    });
    if (conflict) throw new Error("New time slot conflicts with another appointment");

    const updateData = { dateTime: newDate, slotId: null };

    if (appointment.status === "accepted") {
    }

    const result = await prisma.appointment.update({
      where: { id: appointmentId },
      data: updateData,
      include: {
        patient: { select: { id: true, phone: true } },
        doctor: { select: { fullName: true, specialization: true, hospital: { select: { name: true } } } },
      },
    });

    try {
      // Fetch patient name for notification
      const patientProfile = await prisma.patientProfile.findUnique({
        where: { userId: result.patient.id },
        select: { fullName: true },
      });

      const patientName = patientProfile?.fullName || 'Patient';
      const details = {
        specialization: appointment.doctor.specialization,
        hospitalName: appointment.doctor.hospital?.name,
        hospitalAddress: appointment.doctor.hospital?.address,
        confirmationCode: appointment.confirmationCode,
      };

      await NotificationService.notifyAppointmentRescheduled(
        result.patient.id,
        result.doctor?.fullName,
        patientName,
        newDateTime,
        appointmentId,
        details,
      );
    } catch (err) {
      console.error("[NOTIFICATION] Failed on reschedule:", err.message);
    }

    // SMS notification to patient
    try {
      const patient = await prisma.user.findUnique({
        where: { id: result.patient.id },
        select: { phone: true },
      });
      if (patient?.phone) {
        const patientProfile = await prisma.patientProfile.findUnique({
          where: { userId: result.patient.id },
          select: { fullName: true },
        });
        await SmsService.sendAppointmentRescheduled(
          patient.phone,
          patientProfile?.fullName || 'Patient',
          result.doctor?.fullName || 'Doctor',
          newDateTime,
          result.doctor?.specialization,
          result.doctor?.hospital?.name,
          result.confirmationCode,
        );
      }
    } catch (err) {
      console.error("[SMS] Failed to send reschedule SMS:", err.message);
    }

    return result;
  },

  updateAppointmentInfo: async (appointmentId, data, hospitalId) => {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { doctor: true },
    });
    if (!appointment) throw new Error("Appointment not found");
    if (appointment.doctor.hospitalId !== hospitalId)
      throw new Error("Appointment does not belong to receptionist's hospital");

    const updateData = {};
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.reason !== undefined) updateData.reason = data.reason;
    if (data.issueCategory !== undefined) updateData.issueCategory = data.issueCategory;

    return await prisma.appointment.update({
      where: { id: appointmentId },
      data: updateData,
      include: {
        patient: { select: { id: true, phone: true } },
        doctor: { select: { fullName: true, specialization: true } },
      },
    });
  },

  searchPatients: async (query) => {
    if (!query || query.trim().length < 2) return [];
    const q = query.trim();
    const numeric = Number.isInteger(Number(q)) ? parseInt(q, 10) : null;
    const or = [
      { phone: { contains: q } },
      { patientProfile: { fullName: { contains: q, mode: "insensitive" } } },
      { patientAppointments: { some: { confirmationCode: { contains: q, mode: "insensitive" } } } },
    ];
    if (numeric) or.push({ id: numeric });
    return await prisma.user.findMany({
      where: {
        role: "patient",
        OR: or,
      },
      select: {
        id: true,
        phone: true,
        patientProfile: { select: { fullName: true } },
      },
      take: 20,
    });
  },

  createPatient: async (data) => {
    const existing = await prisma.user.findUnique({ where: { phone: data.phone } });
    if (existing) throw new Error("A user with this phone number already exists");

    const user = await prisma.user.create({
      data: { phone: data.phone, role: "patient" },
    });
    const profile = await prisma.patientProfile.create({
      data: {
        userId: user.id,
        fullName: data.fullName,
        gender: data.gender || null,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        emergencyContact: data.emergencyContact || null,
      },
    });
    return { id: user.id, phone: user.phone, patientProfile: profile };
  },

  searchAllDoctors: async (query, hospitalId, limit = 10) => {
    return await prisma.doctorProfile.findMany({
      where: {
        hospitalId,
        status: 'Approved',
        OR: [
          { fullName: { contains: query, mode: "insensitive" } },
          { specialization: { contains: query, mode: "insensitive" } },
        ]
      },
      take: parseInt(limit, 10) || 10,
      select: {
        id: true,
        fullName: true,
        specialization: true,
        status: true,
        licenseNumber: true,
        experienceYears: true,
        hospital: { select: { id: true, name: true } },
        user: { select: { id: true, phone: true, email: true } },
      }
    });
  },

  getHospitalDoctors: async (hospitalId, page = 1, limit = 20, includeAll = false, status = null) => {
    const where = { hospitalId };
    if (status) where.status = status;
    else if (!includeAll) where.status = 'Approved';
    const skip = (page - 1) * limit;
    const [data, total, counts] = await Promise.all([
      prisma.doctorProfile.findMany({
        where,
        select: {
          id: true,
          fullName: true,
          specialization: true,
          status: true,
          licenseNumber: true,
          experienceYears: true,
          bio: true,
          profilePicture: true,
          introVideo: true,
          rejectionReason: true,
          createdAt: true,
          user: { select: { id: true, phone: true, email: true } },
        },
        skip,
        take: limit,
        orderBy: { fullName: "asc" },
      }),
      prisma.doctorProfile.count({ where }),
      prisma.doctorProfile.groupBy({
        by: ["status"],
        where: { hospitalId },
        _count: { _all: true },
      }),
    ]);
    const stats = { approved: 0, pending: 0, rejected: 0 };
    counts.forEach((c) => {
      if (c.status === "Approved") stats.approved = c._count._all;
      else if (c.status === "PendingReview") stats.pending = c._count._all;
      else if (c.status === "Rejected") stats.rejected = c._count._all;
    });
    return { data, stats, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  },

  reviewHospitalDoctor: async (doctorId, hospitalId, status, rejectionReason = null) => {
    if (!["Approved", "Rejected"].includes(status)) {
      throw new Error("Status must be Approved or Rejected");
    }
    const doctor = await prisma.doctorProfile.findUnique({
      where: { id: doctorId },
    });
    if (!doctor) throw new Error("Doctor not found");
    if (doctor.hospitalId !== hospitalId) {
      throw new Error("Doctor does not belong to receptionist's hospital");
    }
    if (doctor.status !== "PendingReview") {
      throw new Error("Only pending doctors can be approved or rejected");
    }
    if (status === "Rejected" && !rejectionReason) {
      throw new Error("Rejection reason is required");
    }

    return prisma.doctorProfile.update({
      where: { id: doctorId },
      data: {
        status,
        rejectionReason: status === "Rejected" ? rejectionReason : null,
      },
      select: {
        id: true,
        fullName: true,
        status: true,
        rejectionReason: true,
      },
    });
  },

  registerDoctor: async (data, hospitalId) => {
    const tempPassword = Math.random().toString(36).slice(2, 10) + "A1!";

    return prisma.$transaction(async (tx) => {
      let user = await tx.user.findFirst({
        where: {
          OR: [
            { phone: data.phone },
            ...(data.email ? [{ email: data.email }] : []),
          ],
        },
      });

      let createdUser = false;
      if (!user) {
        user = await tx.user.create({
          data: {
            phone: data.phone,
            email: data.email || null,
            role: "doctor",
            password: await bcrypt.hash(tempPassword, 10),
          },
        });
        createdUser = true;
      } else {
        const existingProfile = await tx.doctorProfile.findFirst({
          where: { userId: user.id },
        });
        if (existingProfile) {
          throw new Error("Phone or email already in use by a doctor");
        }
      }

      const profile = await tx.doctorProfile.create({
        data: {
          userId: user.id,
          fullName: data.fullName,
          specialization: data.specialization || null,
          licenseNumber: data.licenseNumber || null,
          experienceYears: data.experienceYears || null,
          bio: data.bio || null,
          profilePicture: data.profilePicture || null,
          introVideo: data.introVideo || null,
          hospitalId,
          status: "PendingReview",
        },
      });

      return {
        ...profile,
        user: { id: user.id, phone: user.phone, email: user.email },
        ...(createdUser ? { tempPassword } : {}),
      };
    });
  },

  updateHospitalDoctor: async (doctorId, data, hospitalId) => {
    const doctor = await prisma.doctorProfile.findUnique({
      where: { id: doctorId },
    });
    if (!doctor) throw new Error("Doctor not found");
    if (doctor.hospitalId !== hospitalId) {
      throw new Error("Doctor does not belong to receptionist's hospital");
    }

    const updateData = {};
    if (data.fullName !== undefined) updateData.fullName = data.fullName;
    if (data.specialization !== undefined) updateData.specialization = data.specialization;
    if (data.licenseNumber !== undefined) updateData.licenseNumber = data.licenseNumber;
    if (data.experienceYears !== undefined) updateData.experienceYears = data.experienceYears;
    if (data.bio !== undefined) updateData.bio = data.bio;

    return prisma.doctorProfile.update({
      where: { id: doctorId },
      data: updateData,
      include: {
        user: { select: { id: true, phone: true, email: true } },
      },
    });
  },

  removeHospitalDoctor: async (doctorId, hospitalId) => {
    const doctor = await prisma.doctorProfile.findUnique({
      where: { id: doctorId },
    });
    if (!doctor) throw new Error("Doctor not found");
    if (doctor.hospitalId !== hospitalId) {
      throw new Error("Doctor does not belong to receptionist's hospital");
    }

    return prisma.doctorProfile.update({
      where: { id: doctorId },
      data: { hospitalId: null },
      select: { id: true, fullName: true, hospitalId: true },
    });
  },

  getHospital: async (hospitalId) => {
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
        serviceFee: {
          select: { amount: true },
        },
      },
    });
    if (!hospital) throw new Error("Hospital not found");
    return hospital;
  },

  updateHospitalCardPrice: async (hospitalId, cardPrice) => {
    const hospital = await prisma.hospital.findUnique({
      where: { id: hospitalId },
    });
    if (!hospital) throw new Error("Hospital not found");

    return prisma.hospital.update({
      where: { id: hospitalId },
      data: { cardPrice },
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
        serviceFee: {
          select: { amount: true },
        },
      },
    });
  },

  // ─── Card Template Management (Hospital-level cards) ────────────────

  generateCardCode: () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'CRD-';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  },

  // Create a card template (hospital-level, not tied to a patient)
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

  // List card templates for this hospital
  listCardTemplates: async (hospitalId) => {
    return prisma.cardTemplate.findMany({
      where: { hospitalId },
      orderBy: { createdAt: "desc" },
    });
  },

  // Update a card template
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

  // Delete a card template
  deleteCardTemplate: async (cardId, hospitalId) => {
    const template = await prisma.cardTemplate.findUnique({ where: { id: cardId } });
    if (!template) throw new Error("Card template not found");
    if (template.hospitalId !== hospitalId) throw new Error("Card template does not belong to this hospital");

    return prisma.cardTemplate.delete({ where: { id: cardId } });
  },

  // Issue a card to a specific patient (from a template or custom)
  issueCard: async (data, hospitalId) => {
    // Verify patient exists
    const patient = await prisma.user.findUnique({
      where: { id: data.patientId },
      select: { id: true, role: true },
    });
    if (!patient || patient.role !== "patient") {
      throw new Error("Patient not found");
    }

    // Get price and name from template or hospital default
    let price = data.price;
    let name = "Hospital Visit Card";
    let validityDays = data.validityDays != null ? Number(data.validityDays) : null;
    if (!price && data.templateId) {
      const template = await prisma.cardTemplate.findUnique({ where: { id: data.templateId } });
      if (template) {
        price = Number(template.price);
        name = template.name;
        validityDays = template.validityDays ?? validityDays;
      }
    }
    if (!price) {
      const hospital = await prisma.hospital.findUnique({
        where: { id: hospitalId },
        select: { cardPrice: true },
      });
      price = Number(hospital?.cardPrice || 0);
    }

    // Generate unique code
    let code;
    let attempts = 0;
    while (attempts < 10) {
      code = ReceptionistService.generateCardCode();
      const existing = await prisma.card.findUnique({ where: { code } });
      if (!existing) break;
      attempts++;
    }
    if (!code) throw new Error("Failed to generate unique card code");

    const isPaid = data.isPaid === true || data.isPaid === 'true';
    const issuedAt = new Date();
    const validity = validityDays ?? 365;
    const expiresAt = data.expiresAt ? new Date(data.expiresAt) : (() => {
      const d = new Date(issuedAt);
      d.setDate(d.getDate() + validity);
      return d;
    })();

    const card = await prisma.card.create({
      data: {
        code,
        name,
        hospitalId,
        patientId: data.patientId,
        price,
        isPaid,
        validityDays: validityDays ?? null,
        issuedAt,
        activatedAt: isPaid ? issuedAt : null,
        expiresAt,
      },
      include: {
        patient: {
          select: {
            id: true,
            phone: true,
            patientProfile: { select: { fullName: true } },
          },
        },
      },
    });

    return card;
  },

  extendCard: async (cardId, expiresAt, hospitalId) => {
    const card = await prisma.card.findUnique({ where: { id: cardId } });
    if (!card) throw new Error("Card not found");
    if (card.hospitalId !== hospitalId) {
      throw new Error("Card does not belong to receptionist's hospital");
    }

    return prisma.card.update({
      where: { id: cardId },
      data: {
        expiresAt: new Date(expiresAt),
        isActive: true,
      },
      include: {
        patient: {
          select: {
            id: true,
            phone: true,
            patientProfile: { select: { fullName: true } },
          },
        },
      },
    });
  },

  listCards: async (hospitalId, query = {}) => {
    const where = { hospitalId };
    if (query.patientId) where.patientId = Number(query.patientId);
    if (query.search) {
      where.OR = [
        { code: { contains: query.search, mode: 'insensitive' } },
        { patient: { patientProfile: { fullName: { contains: query.search, mode: 'insensitive' } } } },
      ];
    }

    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      prisma.card.findMany({
        where,
        include: {
          patient: {
            select: {
              id: true,
              phone: true,
              patientProfile: { select: { fullName: true, gender: true, dateOfBirth: true, bloodType: true, emergencyContact: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.card.count({ where }),
    ]);

    return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  },

  getCard: async (cardId, hospitalId) => {
    const card = await prisma.card.findUnique({
      where: { id: cardId },
      include: {
        patient: {
          select: {
            id: true,
            phone: true,
            patientProfile: { select: { fullName: true, gender: true, dateOfBirth: true, bloodType: true, emergencyContact: true } },
          },
        },
        appointments: {
          select: { id: true, dateTime: true, status: true, fee: true },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });
    if (!card) throw new Error("Card not found");
    if (card.hospitalId !== hospitalId) {
      throw new Error("Card does not belong to receptionist's hospital");
    }
    return card;
  },
  reorderAppointments: async (doctorId, dateStr, orderedSlots, hospitalId) => {
    const date = new Date(dateStr);
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const doctor = await prisma.doctorProfile.findUnique({
      where: { id: doctorId },
    });
    if (!doctor) throw new Error("Doctor not found");
    if (doctor.hospitalId !== hospitalId) throw new Error("Doctor does not belong to receptionist's hospital");

    const allSlots = await prisma.scheduleSlot.findMany({
      where: {
        schedule: {
          doctorId,
          date: { gte: dayStart, lte: dayEnd },
          isActive: true,
        },
      },
      orderBy: { startTime: "asc" },
    });

    if (allSlots.length === 0) throw new Error("No schedule slots found for this doctor on this date");
    if (orderedSlots.length !== allSlots.length) {
      throw new Error(`Expected ${allSlots.length} slot entries but got ${orderedSlots.length}`);
    }

    const appointments = await prisma.appointment.findMany({
      where: {
        doctorId,
        dateTime: { gte: dayStart, lte: dayEnd },
        status: { in: ["pending", "accepted"] },
      },
      include: {
        patient: { select: { id: true, phone: true } },
        slot: { select: { id: true, startTime: true } },
        doctor: { select: { fullName: true, specialization: true, hospital: { select: { name: true, address: true } } } },
      },
      orderBy: { dateTime: "asc" },
    });

    const appointmentMap = new Map(appointments.map((a) => [a.id, a]));
    const submittedIds = orderedSlots.filter((id) => id !== null);
    const submittedSet = new Set(submittedIds);
    const existingIds = appointments.map((a) => a.id);

    if (submittedIds.length !== existingIds.length || !existingIds.every((id) => submittedSet.has(id))) {
      throw new Error("The set of assigned appointments does not match the existing appointments for this date");
    }

    const updates = orderedSlots.map((apptId, i) => {
      const slot = allSlots[i];
      if (apptId === null) return null;

      const appt = appointmentMap.get(apptId);
      if (!appt) throw new Error(`Appointment ${apptId} not found`);

      const oldSlotId = appt.slot?.id || null;
      return {
        appointmentId: apptId,
        patientId: appt.patient.id,
        newDateTime: new Date(slot.startTime),
        newSlotId: slot.id,
        oldSlotId,
        doctor: appt.doctor,
        patient: appt.patient,
        confirmationCode: appt.confirmationCode,
      };
    }).filter(Boolean);

    const result = await prisma.$transaction(
      updates.map((u) =>
        prisma.appointment.update({
          where: { id: u.appointmentId },
          data: { dateTime: u.newDateTime, slotId: u.newSlotId },
        })
      )
    );

    for (const u of updates) {
      try {
        const patientProfile = await prisma.patientProfile.findUnique({
          where: { userId: u.patientId },
          select: { fullName: true },
        });
        const patientName = patientProfile?.fullName || 'Patient';
        const details = {
          specialization: u.doctor.specialization,
          hospitalName: u.doctor.hospital?.name,
          hospitalAddress: u.doctor.hospital?.address,
          confirmationCode: u.confirmationCode,
        };

        const timeChanged = u.oldSlotId !== u.newSlotId || u.newDateTime.getTime() !== new Date(appointmentMap.get(u.appointmentId)?.dateTime || 0).getTime();

        if (timeChanged) {
          await NotificationService.notifyAppointmentRescheduled(
            u.patientId,
            u.doctor.fullName,
            patientName,
            u.newDateTime,
            u.appointmentId,
            details,
          );

          if (u.patient?.phone) {
            await SmsService.sendAppointmentRescheduled(
              u.patient.phone,
              patientName,
              u.doctor.fullName,
              u.newDateTime,
              u.doctor.specialization,
              u.doctor.hospital?.name || '',
              u.confirmationCode,
            );
          }
        }
      } catch (notifErr) {
        console.error("Failed to send reorder notification:", notifErr.message);
      }
    }

    return result;
  },

  getDashboardStats: async (hospitalId) => {
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);

    const staffUsers = await prisma.user.findMany({
      where: {
        OR: [
          { receptionistProfile: { hospitalId } },
          { hospitalProfile: { hospitalId } },
        ],
      },
      select: { id: true },
    });
    const staffUserIds = staffUsers.map((u) => u.id);

    const [
      todaysAppointments,
      todaysApprovedAppointments,
      totalBookings,
      pendingBookings,
      activeCards,
      expiredCards,
      recentCards,
      recentVisitingCards,
      unreadNotifications,
    ] = await Promise.all([
      prisma.appointment.count({
        where: { doctor: { hospitalId }, dateTime: { gte: startOfToday, lte: endOfToday } },
      }),
      prisma.appointment.count({
        where: {
          doctor: { hospitalId },
          dateTime: { gte: startOfToday, lte: endOfToday },
          status: "accepted",
        },
      }),
      prisma.appointment.count({
        where: { doctor: { hospitalId } },
      }),
      prisma.appointment.count({
        where: { doctor: { hospitalId }, status: "pending" },
      }),
      prisma.card.count({
        where: { hospitalId, isActive: true, expiresAt: { gt: now } },
      }),
      prisma.card.count({
        where: { hospitalId, OR: [{ isActive: false }, { expiresAt: { lte: now } }] },
      }),
      prisma.card.findMany({
        where: { hospitalId },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          patient: {
            select: {
              id: true,
              phone: true,
              patientProfile: { select: { fullName: true } },
            },
          },
        },
      }),
      prisma.card.findMany({
        where: { hospitalId },
        orderBy: { issuedAt: "desc" },
        take: 5,
        include: {
          patient: {
            select: {
              id: true,
              phone: true,
              patientProfile: { select: { fullName: true, gender: true, dateOfBirth: true } },
            },
          },
        },
      }),
      prisma.notification.count({
        where: {
          userId: { in: staffUserIds },
          isRead: false,
        },
      }),
    ]);

    const cardPackages = await prisma.cardTemplate.findMany({
      where: { hospitalId },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    return {
      todaysAppointments,
      todaysApprovedAppointments,
      totalBookings,
      pendingBookings,
      cardPackages: {
        active: activeCards,
        expired: expiredCards,
        recent: recentCards,
        templates: cardPackages,
      },
      visitingCards: recentVisitingCards,
      unreadNotifications,
    };
  },
};

module.exports = ReceptionistService;
