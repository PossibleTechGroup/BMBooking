const axios = require('axios');
const { formatEthiopianLocalDateTimeDual } = require('../utils/dateFormat');

const SmsService = {
  /**
   * Send SMS via GeezSMS
   */
  sendSms: async (to, message) => {
    // GeezSMS expects an international format WITHOUT the leading "+"
    const smsPhone = String(to).replace(/^\+/, "");
    try {
      const response = await axios.post(
        'https://api.geezsms.com/api/v1/sms/send',
        {
          token: process.env.GEEZSMS_TOKEN,
          phone: smsPhone,
          msg: message
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      console.log(`[SMS] Sent to ${smsPhone}:`, response.data);
      return response.data;
    } catch (error) {
      console.error(`[SMS] Failed to send to ${smsPhone}:`, error.response?.data || error.message);
      return null;
    }
  },

  /**
   * Broadcast SMS to multiple users
   */
  broadcast: async (phoneNumbers, message) => {
    console.log(`[SMS] Broadcasting to ${phoneNumbers.length} users...`);
    const results = [];
    for (const phone of phoneNumbers) {
      if (phone) {
        const res = await SmsService.sendSms(phone, message);
        results.push(res);
      }
    }
    return results;
  },

  /**
   * Send appointment confirmation SMS to patient
   */
  sendAppointmentConfirmation: async (phone, patientName, doctorName, dateTime, specialization = '', hospitalName = '', fee = null, confirmationCode = '') => {
    const formattedDate = formatEthiopianLocalDateTimeDual(dateTime);
    const spec = specialization ? ` (${specialization})` : '';
    const loc = hospitalName ? ` at ${hospitalName}` : '';
    const feeLine = fee != null && Number(fee) > 0 ? ` Your payment of ${Number(fee)} ETB was received successfully.` : '';
    const codeLine = confirmationCode ? ` Code: ${confirmationCode}.` : '';
    const msg = `Dear ${patientName}, you have successfully booked an appointment with Dr. ${doctorName}${spec}${loc} for ${formattedDate}.${feeLine}${codeLine} Please arrive 20 min early.`;
    return await SmsService.sendSms(phone, msg);
  },

  /**
   * Send appointment declined SMS to patient
   */
  sendAppointmentDeclined: async (phone, patientName, doctorName, reason, specialization = '') => {
    const spec = specialization ? ` (${specialization})` : '';
    const reasonText = reason ? ` Reason: ${reason}` : '';
    const msg = `Dear ${patientName}, your appointment with Dr. ${doctorName}${spec} has been declined.${reasonText}`;
    return await SmsService.sendSms(phone, msg);
  },

  /**
   * Send appointment cancelled SMS to patient
   */
  sendAppointmentCancelled: async (phone, patientName, doctorName, specialization = '') => {
    const spec = specialization ? ` (${specialization})` : '';
    const msg = `Dear ${patientName}, your appointment with Dr. ${doctorName}${spec} has been cancelled.`;
    return await SmsService.sendSms(phone, msg);
  },

  /**
   * Send appointment rescheduled SMS to patient
   */
  sendAppointmentRescheduled: async (phone, patientName, doctorName, newDateTime, specialization = '', hospitalName = '', confirmationCode = '') => {
    const formattedDate = formatEthiopianLocalDateTimeDual(newDateTime);
    const spec = specialization ? ` (${specialization})` : '';
    const loc = hospitalName ? ` at ${hospitalName}` : '';
    const codeLine = confirmationCode ? ` Code: ${confirmationCode}.` : '';
    const msg = `Dear ${patientName}, your appointment with Dr. ${doctorName}${spec} has been rescheduled${loc} to ${formattedDate}.${codeLine} Please arrive 20 min early.`;
    return await SmsService.sendSms(phone, msg);
  },

  /**
   * Send appointment reminder SMS
   */
  sendAppointmentReminder: async (phone, patientName, doctorName, dateTime, clinicName = '', specialization = '') => {
    const formattedDate = formatEthiopianLocalDateTimeDual(dateTime);
    const spec = specialization ? ` (${specialization})` : '';
    const clinic = clinicName ? ` at ${clinicName}` : '';
    const msg = `Reminder: Dear ${patientName}, your appointment with Dr. ${doctorName}${spec}${clinic} is scheduled for ${formattedDate}. Please arrive on time.`;
    return await SmsService.sendSms(phone, msg);
  },

  /**
   * Send equipment booking cancelled SMS to patient
   */
  sendBookingCancelled: async (phone, patientName, equipmentName) => {
    const msg = `Dear ${patientName}, your booking for ${equipmentName} has been cancelled.`;
    return await SmsService.sendSms(phone, msg);
  },

  /**
   * Send equipment booking confirmed SMS to patient
   */
  sendBookingConfirmed: async (phone, patientName, equipmentName, dateTime, hospitalName = '', confirmationCode = '') => {
    const formattedDate = formatEthiopianLocalDateTimeDual(dateTime);
    const loc = hospitalName ? ` at ${hospitalName}` : '';
    const codeLine = confirmationCode ? ` Code: ${confirmationCode}.` : '';
    const msg = `Dear ${patientName}, your booking for ${equipmentName}${loc} has been confirmed for ${formattedDate}.${codeLine} Please arrive on time.`;
    return await SmsService.sendSms(phone, msg);
  },

  /**
   * Send equipment booking rescheduled SMS to patient
   */
  sendBookingRescheduled: async (phone, patientName, equipmentName, newDateTime, hospitalName = '', confirmationCode = '') => {
    const formattedDate = formatEthiopianLocalDateTimeDual(newDateTime);
    const loc = hospitalName ? ` at ${hospitalName}` : '';
    const codeLine = confirmationCode ? ` Code: ${confirmationCode}.` : '';
    const msg = `Dear ${patientName}, your booking for ${equipmentName}${loc} has been rescheduled to ${formattedDate}.${codeLine} Please arrive on time.`;
    return await SmsService.sendSms(phone, msg);
  }
};

module.exports = SmsService;
