const EquipmentBookingService = require("../services/equipment-booking.service");

const EquipmentBookingController = {
  getAvailability: async (req, res) => {
    try {
      const equipmentId = parseInt(req.params.id);
      const date = req.query.date;

      if (!date) {
        return res
          .status(400)
          .json({
            status: "fail",
            message: "date query parameter is required (YYYY-MM-DD)",
          });
      }

      const availability = await EquipmentBookingService.getAvailability(
        equipmentId,
        date,
      );
      res.status(200).json({ status: "success", data: availability });
    } catch (err) {
      res.status(400).json({ status: "fail", message: err.message });
    }
  },

  createBooking: async (req, res) => {
    try {
      const patientId = req.user.id;
      const { equipmentId, dateTime, notes, fee } = req.body;

      if (!equipmentId || !dateTime) {
        return res.status(400).json({
          status: "fail",
          message: "equipmentId and dateTime are required",
        });
      }

      const booking = await EquipmentBookingService.createBooking(patientId, {
        equipmentId: parseInt(equipmentId),
        dateTime,
        notes,
        fee: fee != null ? Number(fee) : undefined,
      });

      res.status(201).json({ status: "success", data: booking });
    } catch (err) {
      console.error(
        "❌ [EQUIPMENT BOOKING] Create error:",
        err.message,
      );
      res.status(400).json({ status: "fail", message: err.message });
    }
  },

  getMyBookings: async (req, res) => {
    try {
      const patientId = req.user.id;
      const filters = {
        status: req.query.status || undefined,
        date: req.query.date || undefined,
        from: req.query.from || undefined,
        to: req.query.to || undefined,
      };
      const bookings =
        await EquipmentBookingService.getPatientBookings(patientId, filters);
      res.status(200).json({ status: "success", data: bookings });
    } catch (err) {
      console.error(
        "❌ [EQUIPMENT BOOKING] Get my bookings error:",
        err.message,
      );
      res.status(500).json({ status: "error", message: err.message });
    }
  },

  cancelBooking: async (req, res) => {
    try {
      const patientId = req.user.id;
      const bookingId = parseInt(req.params.id);
      const result = await EquipmentBookingService.cancelBooking(
        bookingId,
        patientId,
      );
      res.status(200).json({ status: "success", data: result });
    } catch (err) {
      console.error(
        "❌ [EQUIPMENT BOOKING] Cancel error:",
        err.message,
      );
      res.status(400).json({ status: "fail", message: err.message });
    }
  },

  createBookingByReceptionist: async (req, res) => {
    try {
      const { patientId, equipmentId, dateTime, fee, notes } = req.body;
      if (!patientId || !equipmentId || !dateTime) {
        return res.status(400).json({
          status: "fail",
          message: "patientId, equipmentId, and dateTime are required",
        });
      }

      const booking = await EquipmentBookingService.createBookingByReceptionist(
        {
          patientId: parseInt(patientId),
          equipmentId: parseInt(equipmentId),
          dateTime,
          fee: fee !== undefined ? Number(fee) : undefined,
          notes,
        },
        req.receptionistProfile,
      );

      res.status(201).json({ status: "success", data: booking });
    } catch (err) {
      console.error("❌ [EQUIPMENT BOOKING] Create by receptionist error:", err.message);
      res.status(400).json({ status: "fail", message: err.message });
    }
  },

  getHospitalBookings: async (req, res) => {
    try {
      const filters = {
        status: req.query.status || undefined,
        equipmentId: req.query.equipmentId
          ? parseInt(req.query.equipmentId)
          : undefined,
        date: req.query.date || undefined,
        from: req.query.from || undefined,
        to: req.query.to || undefined,
      };
      const bookings = await EquipmentBookingService.getHospitalBookings(
        filters,
        req.receptionistProfile.hospitalId,
      );
      res.status(200).json({ status: "success", data: bookings });
    } catch (err) {
      console.error(
        "❌ [EQUIPMENT BOOKING] List hospital bookings error:",
        err.message,
      );
      res.status(400).json({ status: "fail", message: err.message });
    }
  },

  confirmBooking: async (req, res) => {
    try {
      const bookingId = parseInt(req.params.id);
      const result = await EquipmentBookingService.confirmBooking(
        bookingId,
        req.receptionistProfile,
      );
      res.status(200).json({ status: "success", data: result });
    } catch (err) {
      console.error(
        "❌ [EQUIPMENT BOOKING] Confirm error:",
        err.message,
      );
      res.status(400).json({ status: "fail", message: err.message });
    }
  },

  declineBooking: async (req, res) => {
    try {
      const bookingId = parseInt(req.params.id);
      const { reason } = req.body;
      const result = await EquipmentBookingService.declineBooking(
        bookingId,
        reason,
        req.receptionistProfile,
      );
      res.status(200).json({ status: "success", data: result });
    } catch (err) {
      console.error(
        "❌ [EQUIPMENT BOOKING] Decline error:",
        err.message,
      );
      res.status(400).json({ status: "fail", message: err.message });
    }
  },

  completeBooking: async (req, res) => {
    try {
      const bookingId = parseInt(req.params.id);
      const result = await EquipmentBookingService.completeBooking(
        bookingId,
        req.receptionistProfile,
      );
      res.status(200).json({ status: "success", data: result });
    } catch (err) {
      console.error(
        "❌ [EQUIPMENT BOOKING] Complete error:",
        err.message,
      );
      res.status(400).json({ status: "fail", message: err.message });
    }
  },

  cancelBookingByReceptionist: async (req, res) => {
    try {
      const bookingId = parseInt(req.params.id);
      const result =
        await EquipmentBookingService.cancelBookingByReceptionist(
          bookingId,
          req.receptionistProfile,
        );
      res.status(200).json({ status: "success", data: result });
    } catch (err) {
      console.error(
        "❌ [EQUIPMENT BOOKING] Cancel by receptionist error:",
        err.message,
      );
      res.status(400).json({ status: "fail", message: err.message });
    }
  },

  rescheduleBooking: async (req, res) => {
    try {
      const bookingId = parseInt(req.params.id);
      const { dateTime } = req.body;
      const result = await EquipmentBookingService.rescheduleBooking(
        bookingId,
        dateTime,
        req.receptionistProfile,
      );
      res.status(200).json({ status: "success", data: result });
    } catch (err) {
      console.error(
        "❌ [EQUIPMENT BOOKING] Reschedule error:",
        err.message,
      );
      res.status(400).json({ status: "fail", message: err.message });
    }
  },

  updateBookingNotes: async (req, res) => {
    try {
      const bookingId = parseInt(req.params.id);
      const { notes } = req.body;
      const result = await EquipmentBookingService.updateBookingNotes(
        bookingId,
        notes,
        req.receptionistProfile,
      );
      res.status(200).json({ status: "success", data: result });
    } catch (err) {
      console.error(
        "❌ [EQUIPMENT BOOKING] Update notes error:",
        err.message,
      );
      res.status(400).json({ status: "fail", message: err.message });
    }
  },

  rescheduleBookingForPatient: async (req, res) => {
    try {
      const patientId = req.user.id;
      const bookingId = parseInt(req.params.id);
      const { dateTime } = req.body;
      if (!dateTime) {
        return res.status(400).json({ status: "fail", message: "dateTime is required" });
      }
      const result = await EquipmentBookingService.rescheduleBookingForPatient(
        bookingId,
        patientId,
        dateTime,
      );
      res.status(200).json({ status: "success", data: result });
    } catch (err) {
      console.error("❌ [EQUIPMENT BOOKING] Reschedule error:", err.message);
      res.status(400).json({ status: "fail", message: err.message });
    }
  },
};

module.exports = EquipmentBookingController;
