const Notification = require('../models/notification.model');
const prisma = require('../lib/prisma');
const { sendToUser } = require('../lib/push.lib');
const { formatEthiopianLocalDateTimeDual } = require('../utils/dateFormat');

// Notification type constants
const NOTIFICATION_TYPES = {
  APPOINTMENT_BOOKED: 'APPOINTMENT_BOOKED',
  APPOINTMENT_ACCEPTED: 'APPOINTMENT_ACCEPTED',
  APPOINTMENT_DECLINED: 'APPOINTMENT_DECLINED',
  APPOINTMENT_COMPLETED: 'APPOINTMENT_COMPLETED',
  APPOINTMENT_CANCELLED: 'APPOINTMENT_CANCELLED',
  APPOINTMENT_RESCHEDULED: 'APPOINTMENT_RESCHEDULED',
  FOLLOW_UP_SCHEDULED: 'FOLLOW_UP_SCHEDULED',
  BOOKING_CANCELLED: 'BOOKING_CANCELLED',
  BOOKING_RESCHEDULED: 'BOOKING_RESCHEDULED',
  BOOKING_CONFIRMED: 'BOOKING_CONFIRMED',
  SYSTEM: 'SYSTEM'
};

const NotificationService = {
  /**
   * Create a notification for a user AND send a push notification
   */
  create: async (userId, type, title, message, metadata = null) => {
    // 1. Save to database
    const notification = await Notification.create(userId, type, title, message, metadata);
    console.log(`[NOTIFICATION] Created: "${title}" for user ${userId}`);

    // 2. Send push notification (non-blocking)
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { expoPushToken: true }
      });

      if (user?.expoPushToken) {
        await sendToUser(user.expoPushToken, title, message, {
          notificationId: notification.id,
          type,
          ...metadata
        });
      }
    } catch (err) {
      console.error(`[PUSH] Failed to send push for notification ${notification.id}:`, err.message);
    }

    return notification;
  },

  /**
   * Get notifications for a user (paginated)
   */
  getUserNotifications: async (userId, { page = 1, limit = 50 } = {}) => {
    const offset = (page - 1) * limit;
    const [notifications, unreadCount] = await Promise.all([
      Notification.findByUserId(userId, { limit, offset }),
      Notification.countUnread(userId)
    ]);

    return { notifications, unreadCount };
  },

  /**
   * Get unread count for badge display
   */
  getUnreadCount: async (userId) => {
    return await Notification.countUnread(userId);
  },

  /**
   * Mark a single notification as read
   */
  markAsRead: async (notificationId, userId) => {
    const result = await Notification.markAsRead(notificationId, userId);
    if (result.count === 0) {
      throw new Error('Notification not found');
    }
    return result;
  },

  /**
   * Mark all notifications as read
   */
  markAllAsRead: async (userId) => {
    return await Notification.markAllAsRead(userId);
  },

  /**
   * Delete a notification
   */
  delete: async (notificationId, userId) => {
    const result = await Notification.deleteById(notificationId, userId);
    if (result.count === 0) {
      throw new Error('Notification not found');
    }
    return result;
  },

  // ─── Appointment Notification Helpers ─────────────────────────────

  /**
   * Notify doctor when a patient books an appointment
   */
  notifyAppointmentBooked: async (doctorUserId, patientName, appointmentId) => {
    return await NotificationService.create(
      doctorUserId,
      NOTIFICATION_TYPES.APPOINTMENT_BOOKED,
      'New Appointment Request',
      `${patientName || 'A patient'} has requested an appointment.`,
      { appointmentId }
    );
  },

  /**
   * Notify patient when doctor accepts their appointment
   */
  notifyAppointmentAccepted: async (patientUserId, doctorName, appointmentId) => {
    return await NotificationService.create(
      patientUserId,
      NOTIFICATION_TYPES.APPOINTMENT_ACCEPTED,
      'Appointment Accepted',
      `Dr. ${doctorName || 'Your doctor'} has accepted your appointment.`,
      { appointmentId }
    );
  },

  /**
   * Notify patient when doctor declines their appointment
   */
  notifyAppointmentDeclined: async (patientUserId, doctorName, appointmentId, reason) => {
    const msg = reason
      ? `Dr. ${doctorName || 'Your doctor'} declined your appointment. Reason: ${reason}`
      : `Dr. ${doctorName || 'Your doctor'} declined your appointment.`;

    return await NotificationService.create(
      patientUserId,
      NOTIFICATION_TYPES.APPOINTMENT_DECLINED,
      'Appointment Declined',
      msg,
      { appointmentId }
    );
  },

  /**
   * Notify patient when appointment is completed
   */
  notifyAppointmentCompleted: async (patientUserId, doctorName, appointmentId) => {
    return await NotificationService.create(
      patientUserId,
      NOTIFICATION_TYPES.APPOINTMENT_COMPLETED,
      'Appointment Completed',
      `Your appointment with Dr. ${doctorName || 'your doctor'} has been completed.`,
      { appointmentId }
    );
  },

  notifyReceptionistDeclined: async (patientUserId, doctorName, appointmentId, reason) => {
    const msg = reason
      ? `Your appointment with Dr. ${doctorName || 'your doctor'} has been declined. Reason: ${reason}`
      : `Your appointment with Dr. ${doctorName || 'your doctor'} has been declined.`;

    return await NotificationService.create(
      patientUserId,
      NOTIFICATION_TYPES.APPOINTMENT_DECLINED,
      'Appointment Declined',
      msg,
      { appointmentId }
    );
  },

  notifyAppointmentCancelled: async (patientUserId, doctorName, appointmentId) => {
    return await NotificationService.create(
      patientUserId,
      NOTIFICATION_TYPES.APPOINTMENT_CANCELLED,
      'Appointment Cancelled',
      `Your appointment with Dr. ${doctorName || 'your doctor'} has been cancelled.`,
      { appointmentId }
    );
  },

  notifyAppointmentRescheduled: async (patientUserId, doctorName, patientName, newDateTime, appointmentId, details = {}) => {
    const { specialization, hospitalName, hospitalAddress, confirmationCode } = details;
    const formattedDate = formatEthiopianLocalDateTimeDual(newDateTime);
    const spec = specialization ? ` (${specialization})` : '';
    const loc = hospitalName ? `\nLocation: ${hospitalName}${hospitalAddress ? ` — ${hospitalAddress}` : ''}` : '';
    const codeLine = confirmationCode ? `\nConfirmation: ${confirmationCode}` : '';

    let msg = `Dear ${patientName}, your appointment with Dr. ${doctorName || 'your doctor'}${spec} has been rescheduled.${loc}\nNew Date: ${formattedDate}${codeLine}\n\nPlease arrive 20 minutes before your scheduled time.`;

    return await NotificationService.create(
      patientUserId,
      NOTIFICATION_TYPES.APPOINTMENT_RESCHEDULED,
      'Appointment Rescheduled',
      msg,
      { appointmentId, newDateTime, confirmationCode, hospitalName: hospitalName || null }
    );
  },

  /**
   * Notify patient when appointment is created (booked)
   */
  notifyAppointmentCreated: async (patientUserId, doctorName, patientName, dateTime, appointmentId, details = {}) => {
    const { specialization, hospitalName, hospitalAddress, fee, confirmationCode } = details;
    const formattedDate = formatEthiopianLocalDateTimeDual(dateTime);
    const spec = specialization ? ` (${specialization})` : '';
    const loc = hospitalName ? `\nLocation: ${hospitalName}${hospitalAddress ? ` — ${hospitalAddress}` : ''}` : '';
    const feeLine = fee ? `\nFee: ${fee} ETB` : '';
    const codeLine = confirmationCode ? `\nConfirmation: ${confirmationCode}` : '';

    let msg = `Dear ${patientName}, your appointment with Dr. ${doctorName || 'your doctor'}${spec} has been confirmed.${loc}\nDate: ${formattedDate}${feeLine}${codeLine}\n\nPlease arrive 20 minutes before your scheduled time.`;

    return await NotificationService.create(
      patientUserId,
      NOTIFICATION_TYPES.APPOINTMENT_BOOKED,
      'Appointment Confirmed',
      msg,
      { appointmentId, dateTime, confirmationCode, fee: fee || null, hospitalName: hospitalName || null }
    );
  },

  /**
   * Notify patient when a follow-up appointment is created
   */
  notifyFollowUpScheduled: async (patientUserId, doctorName, patientName, dateTime, appointmentId, parentAppointmentId, details = {}) => {
    const { specialization, hospitalName, hospitalAddress, confirmationCode } = details;
    const formattedDate = formatEthiopianLocalDateTimeDual(dateTime);
    const spec = specialization ? ` (${specialization})` : '';
    const loc = hospitalName ? `\nLocation: ${hospitalName}${hospitalAddress ? ` — ${hospitalAddress}` : ''}` : '';
    const codeLine = confirmationCode ? `\nConfirmation: ${confirmationCode}` : '';
    const parentLine = parentAppointmentId ? `\nReference: #${parentAppointmentId}` : '';

    let msg = `Dear ${patientName}, your follow-up appointment with Dr. ${doctorName}${spec} has been scheduled.${loc}\nDate: ${formattedDate}${codeLine}${parentLine}\n\nPlease arrive 20 minutes before your scheduled time.`;

    return await NotificationService.create(
      patientUserId,
      NOTIFICATION_TYPES.FOLLOW_UP_SCHEDULED,
      'Follow-Up Scheduled',
      msg,
      { appointmentId, parentAppointmentId, dateTime, confirmationCode, hospitalName: hospitalName || null }
    );
  },

  notifyBookingCancelled: async (patientUserId, equipmentName, bookingId) => {
    return await NotificationService.create(
      patientUserId,
      NOTIFICATION_TYPES.BOOKING_CANCELLED,
      'Equipment Booking Cancelled',
      `Your booking for ${equipmentName || 'equipment'} has been cancelled.`,
      { bookingId }
    );
  },

  notifyBookingRescheduled: async (patientUserId, equipmentName, newDateTime, bookingId, confirmationCode = '') => {
    const formattedDate = formatEthiopianLocalDateTimeDual(newDateTime);
    const codeLine = confirmationCode ? ` Code: ${confirmationCode}.` : '';
    return await NotificationService.create(
      patientUserId,
      NOTIFICATION_TYPES.BOOKING_RESCHEDULED,
      'Equipment Booking Rescheduled',
      `Your booking for ${equipmentName || 'equipment'} has been rescheduled to ${formattedDate}.${codeLine}`,
      { bookingId, newDateTime, confirmationCode }
    );
  },

  notifyBookingConfirmed: async (patientUserId, equipmentName, bookingId, confirmationCode = '') => {
    const codeLine = confirmationCode ? ` Code: ${confirmationCode}.` : '';
    return await NotificationService.create(
      patientUserId,
      NOTIFICATION_TYPES.BOOKING_CONFIRMED,
      'Equipment Booking Confirmed',
      `Your booking for ${equipmentName || 'equipment'} has been confirmed.${codeLine}`,
      { bookingId, confirmationCode }
    );
  },

  /**
   * Notify hospital admin(s) when a patient books an appointment at their hospital
   */
  notifyHospitalAppointmentBooked: async (hospitalId, patientName, doctorName, appointmentId) => {
    const profiles = await prisma.hospitalProfile.findMany({
      where: { hospitalId, status: 'APPROVED' },
      select: { userId: true },
    });

    if (!profiles.length) return null;

    const msg = `${patientName || 'A patient'} has booked an appointment with Dr. ${doctorName || 'a doctor'} at your hospital.`;

    const results = [];
    for (const p of profiles) {
      try {
        results.push(
          await NotificationService.create(
            p.userId,
            NOTIFICATION_TYPES.APPOINTMENT_BOOKED,
            'New Patient Booking',
            msg,
            { appointmentId, hospitalId }
          )
        );
      } catch (err) {
        console.error('[NOTIFICATION] Failed to notify hospital admin:', err.message);
      }
    }
    return results;
  },

  notifyReceptionistsAppointmentBooked: async ({ hospitalId, patientName, doctorName, specialization, dateTime, isPaid, status, appointmentId }) => {
    const profiles = await prisma.receptionistProfile.findMany({
      where: { hospitalId },
      select: { userId: true },
    });

    if (!profiles.length) return null;

    const msg = `New booking: ${patientName || 'A patient'} → ${doctorName || 'Doctor'}${specialization ? ` (${specialization})` : ''}`;

    const metadata = {
      appointmentId,
      hospitalId,
      patientName: patientName || null,
      doctorName: doctorName || null,
      specialization: specialization || null,
      dateTime: dateTime || null,
      isPaid: !!isPaid,
      status: status || null,
    };

    const results = [];
    for (const p of profiles) {
      try {
        results.push(
          await NotificationService.create(
            p.userId,
            NOTIFICATION_TYPES.APPOINTMENT_BOOKED,
            'New Patient Booking',
            msg,
            metadata
          )
        );
      } catch (err) {
        console.error('[NOTIFICATION] Failed to notify receptionist:', err.message);
      }
    }
    return results;
  }
};

module.exports = { NotificationService, NOTIFICATION_TYPES };
