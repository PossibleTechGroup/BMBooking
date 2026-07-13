const AppointmentService = require("../services/appointment.service");

const AppointmentController = {
  // ─── Patient Endpoints ────────────────────────────────────────────

  /**
   * POST /api/appointments
   * Patient creates a new appointment
   */
  create: async (req, res) => {
    try {
      const patientId = req.user.id;
      const {
        doctorId,
        dateTime,
        fee,
        reason,
        issueCategory,
        notes,
        attachments,
        slotId,
        paymentMethod,
        cardId,
        paidCardFee,
        otherPatientDetails,
      } = req.body;

      if (!doctorId || !dateTime || fee === undefined) {
        return res
          .status(400)
          .json({
            status: "fail",
            message: "doctorId, dateTime, and fee are required",
          });
      }

      const appointment = await AppointmentService.createAppointment(
        patientId,
        {
          doctorId: parseInt(doctorId),
          dateTime,
          fee: parseFloat(fee),
          reason,
          issueCategory,
          notes,
          attachments,
          slotId: slotId ? parseInt(slotId) : undefined,
          paymentMethod: paymentMethod || 'service_fee',
          cardId: cardId ? parseInt(cardId) : undefined,
          paidCardFee: paidCardFee === true || paidCardFee === 'true',
          otherPatientDetails,
        },
      );

      res.status(201).json({ status: "success", data: appointment });
    } catch (err) {
      console.error("❌ [APPOINTMENT] Create error:", err.message);
      res.status(500).json({ status: "error", message: err.message });
    }
  },

  /**
   * POST /api/appointments/receptionist
   * Receptionist creates an appointment for a patient
   */
  createForPatient: async (req, res) => {
    try {
      const {
        patientId,
        doctorId,
        dateTime,
        reason,
        issueCategory,
        notes,
        attachments,
        slotId,
      } = req.body;

      if (!patientId || !doctorId || !dateTime) {
        return res
          .status(400)
          .json({
            status: "fail",
            message: "patientId, doctorId, and dateTime are required",
          });
      }

      const appointment = await AppointmentService.createAppointmentForPatient(
        parseInt(patientId),
        {
          doctorId: parseInt(doctorId),
          dateTime,
          reason,
          issueCategory,
          notes,
          attachments,
          slotId: slotId ? parseInt(slotId) : undefined,
        },
      );

      res.status(201).json({ status: "success", data: appointment });
    } catch (err) {
      console.error("❌ [APPOINTMENT] Receptionist create error:", err.message);
      res.status(400).json({ status: "fail", message: err.message });
    }
  },

  /**
   * GET /api/appointments/my
   * Patient fetches their own appointments
   */
  getMyAppointments: async (req, res) => {
    try {
      const patientId = req.user.id;
      const appointments =
        await AppointmentService.getPatientAppointments(patientId);
      res.status(200).json({ status: "success", data: appointments });
    } catch (err) {
      res.status(500).json({ status: "error", message: err.message });
    }
  },

  // ─── Recommendations (Public) ─────────────────────────────────────

  /**
   * GET /api/appointments/categories
   * Get all available issue categories
   */
  getCategories: (req, res) => {
    try {
      const categories = AppointmentService.getCategories();
      res.status(200).json({ status: "success", data: categories });
    } catch (err) {
      res.status(500).json({ status: "error", message: err.message });
    }
  },

  /**
   * GET /api/appointments/recommendations/:category
   * Get recommended documents for a specific issue category
   */
  getRecommendations: (req, res) => {
    try {
      const { category } = req.params;
      const recommendations = AppointmentService.getRecommendations(category);

      if (!recommendations) {
        return res
          .status(404)
          .json({ status: "fail", message: "Category not found" });
      }

      res.status(200).json({ status: "success", data: recommendations });
    } catch (err) {
      res.status(500).json({ status: "error", message: err.message });
    }
  },

  // ─── Doctor Endpoints ─────────────────────────────────────────────

  /**
   * GET /api/appointments/doctor
   * Doctor fetches their appointments with optional filters
   * Query params: ?status=pending&date=2026-05-12&from=...&to=...
   */
  getDoctorAppointments: async (req, res) => {
    try {
      const doctorProfile = req.doctorProfile;
      if (!doctorProfile) {
        return res
          .status(403)
          .json({ status: "fail", message: "Doctor profile required" });
      }

      const filters = {
        status: req.query.status || null,
        date: req.query.date || null,
        from: req.query.from || null,
        to: req.query.to || null,
      };

      const appointments = await AppointmentService.getDoctorAppointments(
        doctorProfile.id,
        filters,
      );
      res.status(200).json({ status: "success", data: appointments });
    } catch (err) {
      res.status(500).json({ status: "error", message: err.message });
    }
  },

  /**
   * GET /api/appointments/doctor/calendar
   * Get appointment counts grouped by date for a given month
   * Query: ?month=5&year=2026
   */
  getCalendarData: async (req, res) => {
    try {
      const doctorProfile = req.doctorProfile;
      if (!doctorProfile) {
        return res
          .status(403)
          .json({ status: "fail", message: "Doctor profile required" });
      }

      const month = parseInt(req.query.month) || new Date().getMonth() + 1;
      const year = parseInt(req.query.year) || new Date().getFullYear();
      const calendarData = await AppointmentService.getCalendarData(
        doctorProfile.id,
        month,
        year,
      );
      res.status(200).json({ status: "success", data: calendarData });
    } catch (err) {
      res.status(500).json({ status: "error", message: err.message });
    }
  },

  /**
   * GET /api/appointments/doctor/export
   * Get patient list formatted for export
   * Query: ?date=2026-05-12
   */
  getExportData: async (req, res) => {
    try {
      const doctorProfile = req.doctorProfile;
      if (!doctorProfile) {
        return res
          .status(403)
          .json({ status: "fail", message: "Doctor profile required" });
      }

      const date = req.query.date || null;
      const exportData = await AppointmentService.getExportData(
        doctorProfile.id,
        date,
      );
      res.status(200).json({ status: "success", data: exportData });
    } catch (err) {
      res.status(500).json({ status: "error", message: err.message });
    }
  },

  /**
   * GET /api/appointments/doctor/stats
   * Get quick stats for the doctor dashboard
   */
  getDoctorStats: async (req, res) => {
    try {
      const doctorProfile = req.doctorProfile;
      if (!doctorProfile) {
        return res
          .status(403)
          .json({ status: "fail", message: "Doctor profile required" });
      }

      const stats = await AppointmentService.getDoctorStats(doctorProfile.id);
      res.status(200).json({ status: "success", data: stats });
    } catch (err) {
      res.status(500).json({ status: "error", message: err.message });
    }
  },

  /**
   * PATCH /api/appointments/:id/accept
   * Doctor accepts a pending appointment
   */
  accept: async (req, res) => {
    try {
      const doctorProfile = req.doctorProfile;
      if (!doctorProfile) {
        return res
          .status(403)
          .json({ status: "fail", message: "Doctor profile required" });
      }

      const appointmentId = parseInt(req.params.id);
      const result = await AppointmentService.acceptAppointment(
        appointmentId,
        doctorProfile.id,
      );
      res.status(200).json({ status: "success", data: result });
    } catch (err) {
      res.status(400).json({ status: "fail", message: err.message });
    }
  },

  /**
   * PATCH /api/appointments/:id/decline
   * Doctor declines a pending appointment with reason
   */
  decline: async (req, res) => {
    try {
      const doctorProfile = req.doctorProfile;
      if (!doctorProfile) {
        return res
          .status(403)
          .json({ status: "fail", message: "Doctor profile required" });
      }

      const appointmentId = parseInt(req.params.id);
      const { reason } = req.body;
      const result = await AppointmentService.declineAppointment(
        appointmentId,
        doctorProfile.id,
        reason,
      );
      res.status(200).json({ status: "success", data: result });
    } catch (err) {
      res.status(400).json({ status: "fail", message: err.message });
    }
  },

  /**
   * PATCH /api/appointments/:id/complete
   * Doctor marks appointment as completed
   */
  complete: async (req, res) => {
    try {
      const doctorProfile = req.doctorProfile;
      if (!doctorProfile) {
        return res
          .status(403)
          .json({ status: "fail", message: "Doctor profile required" });
      }

      const appointmentId = parseInt(req.params.id);
      const result = await AppointmentService.completeAppointment(
        appointmentId,
        doctorProfile.id,
      );
      res.status(200).json({ status: "success", data: result });
    } catch (err) {
      res.status(400).json({ status: "fail", message: err.message });
    }
  },

  /**
   * POST /api/appointments/upload
   * Upload referral attachment (image) for an appointment
   */
  uploadAttachment: async (req, res) => {
    const fs = require('fs');
    const { uploadToCloudinary } = require('../lib/cloudinary');
    try {
      if (!req.file) {
        return res.status(400).json({ status: "fail", message: "No file uploaded" });
      }
      const uploadResult = await uploadToCloudinary(req.file.path, 'appointments');
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      res.status(200).json({ status: "success", data: { url: uploadResult.url } });
    } catch (err) {
      console.error("❌ [UPLOAD] Error:", err.message);
      if (req.file && fs.existsSync(req.file.path)) {
        const fs = require('fs');
        try { fs.unlinkSync(req.file.path); } catch(_) {}
      }
      res.status(500).json({ status: "error", message: err.message });
    }
  },

  /**
   * POST /api/appointments/:id/follow-up
   * Doctor schedules a follow-up from a completed consultation
   */
  createFollowUp: async (req, res) => {
    try {
      const doctorProfile = req.doctorProfile;
      if (!doctorProfile)
        return res.status(403).json({ status: "fail", message: "Doctor profile required" });

      const appointmentId = parseInt(req.params.id);
      const result = await AppointmentService.createFollowUp(
        appointmentId,
        doctorProfile.id,
        req.body,
      );
      res.status(201).json({ status: "success", data: result });
    } catch (err) {
      res.status(400).json({ status: "fail", message: err.message });
    }
  },

  // ─── Patient Cancel / Reschedule ───────────────────────────────────

  /**
   * PATCH /api/appointments/:id/cancel
   * Patient cancels their own appointment
   */
  cancel: async (req, res) => {
    try {
      const patientId = req.user.id;
      const appointmentId = parseInt(req.params.id);
      const result = await AppointmentService.cancelAppointment(appointmentId, patientId);
      res.status(200).json({ status: "success", data: result });
    } catch (err) {
      res.status(400).json({ status: "fail", message: err.message });
    }
  },

  /**
   * PATCH /api/appointments/:id/reschedule
   * Patient reschedules their own appointment
   */
  reschedule: async (req, res) => {
    try {
      const patientId = req.user.id;
      const appointmentId = parseInt(req.params.id);
      const { dateTime, slotId } = req.body;
      if (!dateTime) {
        return res.status(400).json({ status: "fail", message: "dateTime is required" });
      }
      const result = await AppointmentService.rescheduleAppointment(
        appointmentId,
        patientId,
        dateTime,
        slotId ? parseInt(slotId) : undefined,
      );
      res.status(200).json({ status: "success", data: result });
    } catch (err) {
      res.status(400).json({ status: "fail", message: err.message });
    }
  },
};

module.exports = AppointmentController;
