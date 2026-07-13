const cron = require('node-cron');
const prisma = require('../lib/prisma');
const SmsService = require('./sms.service');

const REMINDER_HOURS_BEFORE = 24;

const ReminderService = {
  /**
   * Start the cron job that sends appointment reminder SMS
   * Runs every hour
   */
  start: () => {
    console.log('[REMINDER] Appointment reminder service started (hourly check)');

    cron.schedule('0 * * * *', async () => {
      try {
        await ReminderService.sendAppointmentReminders();
      } catch (err) {
        console.error('[REMINDER] Error in cron job:', err.message);
      }
    });
  },

  /**
   * Find upcoming accepted appointments within the reminder window
   * and send SMS reminders to patients
   */
  sendAppointmentReminders: async () => {
    const now = new Date();
    const reminderWindow = new Date(now.getTime() + REMINDER_HOURS_BEFORE * 60 * 60 * 1000);

    const appointments = await prisma.appointment.findMany({
      where: {
        status: 'accepted',
        dateTime: {
          gte: now,
          lte: reminderWindow,
        },
        reminderSentAt: null,
      },
      include: {
        patient: {
          select: {
            id: true,
            phone: true,
            patientProfile: { select: { fullName: true } },
          },
        },
        doctor: {
          select: {
            fullName: true,
            clinicName: true,
            specialization: true,
          },
        },
      },
    });

    if (appointments.length === 0) {
      return;
    }

    console.log(`[REMINDER] Found ${appointments.length} appointment(s) needing reminders`);

    for (const appointment of appointments) {
      try {
        const phone = appointment.patient?.phone;
        if (!phone) {
          console.warn(`[REMINDER] No phone for patient ${appointment.patientId}, skipping`);
          continue;
        }

        const patientName = appointment.patient?.patientProfile?.fullName || 'Patient';
        const doctorName = appointment.doctor?.fullName || 'Doctor';
        const clinicName = appointment.doctor?.clinicName || null;

        await SmsService.sendAppointmentReminder(
          phone,
          patientName,
          doctorName,
          appointment.dateTime,
          clinicName,
          appointment.doctor?.specialization,
        );

        await prisma.appointment.update({
          where: { id: appointment.id },
          data: { reminderSentAt: new Date() },
        });

        console.log(`[REMINDER] Reminder sent for appointment #${appointment.id}`);
      } catch (err) {
        console.error(`[REMINDER] Failed to send reminder for appointment #${appointment.id}:`, err.message);
      }
    }
  },
};

module.exports = ReminderService;
