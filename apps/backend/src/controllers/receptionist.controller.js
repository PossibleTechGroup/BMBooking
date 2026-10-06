const prisma = require("../lib/prisma");
const ReceptionistService = require("../services/receptionist.service");
const AppointmentService = require("../services/appointment.service");
const HospitalPortalService = require("../services/hospital-portal.service");
const { handleCloudinaryUpload } = require('../lib/cloudinary');


const ReceptionistController = {
  createDoctorSchedule: async (req, res) => {
    try {
      const {
        doctorId,
        date,
        startTime,
        endTime,
        slotDuration,
        isActive,
        clinicRoom,
        notes,
        repeatWeeks,
        daysOfWeek,
        repeatEndDate,
      } = req.body;

      if (!doctorId || !date || !startTime || !endTime) {
        return res.status(400).json({
          status: "fail",
          message: "doctorId, date, startTime, and endTime are required",
        });
      }

      const schedule = await ReceptionistService.createDoctorSchedule(
        {
          doctorId: parseInt(doctorId),
          date,
          startTime,
          endTime,
          slotDuration:
            slotDuration !== undefined ? parseInt(slotDuration) : 30,
          isActive,
          clinicRoom,
          notes,
          repeatWeeks,
          daysOfWeek,
          repeatEndDate,
          createdById: req.receptionistProfile.id,
        },
        req.receptionistProfile.hospitalId,
      );

      res.status(201).json({ status: "success", data: schedule });
    } catch (err) {
      console.error("❌ [RECEPTIONIST] Create schedule error:", err.message);
      res.status(400).json({ status: "fail", message: err.message });
    }
  },

  updateDoctorSchedule: async (req, res) => {
    try {
      const scheduleId = parseInt(req.params.id);
      const {
        doctorId,
        date,
        startTime,
        endTime,
        slotDuration,
        isActive,
        clinicRoom,
        notes,
      } = req.body;

      const schedule = await ReceptionistService.updateDoctorSchedule(
        scheduleId,
        {
          doctorId: doctorId !== undefined ? parseInt(doctorId) : undefined,
          date,
          startTime,
          endTime,
          slotDuration:
            slotDuration !== undefined ? parseInt(slotDuration) : undefined,
          isActive,
          clinicRoom,
          notes,
        },
        req.receptionistProfile.hospitalId,
      );

      res.status(200).json({ status: "success", data: schedule });
    } catch (err) {
      console.error("❌ [RECEPTIONIST] Update schedule error:", err.message);
      res.status(400).json({ status: "fail", message: err.message });
    }
  },

  deleteDoctorSchedule: async (req, res) => {
    try {
      const scheduleId = parseInt(req.params.id);
      const result = await ReceptionistService.deleteDoctorSchedule(
        scheduleId,
        req.receptionistProfile.hospitalId,
      );
      res.status(200).json({ status: "success", data: result });
    } catch (err) {
      console.error("❌ [RECEPTIONIST] Delete schedule error:", err.message);
      res.status(400).json({ status: "fail", message: err.message });
    }
  },

  getDoctorSchedule: async (req, res) => {
    try {
      const scheduleId = parseInt(req.params.id);
      const schedule = await ReceptionistService.getDoctorSchedule(
        scheduleId,
        req.receptionistProfile.hospitalId,
      );
      res.status(200).json({ status: "success", data: schedule });
    } catch (err) {
      console.error("❌ [RECEPTIONIST] Get schedule error:", err.message);
      res.status(400).json({ status: "fail", message: err.message });
    }
  },

  getDoctorSchedules: async (req, res) => {
    try {
      const filters = {
        doctorId: req.query.doctorId ? parseInt(req.query.doctorId) : undefined,
        date: req.query.date || undefined,
        from: req.query.from || undefined,
        to: req.query.to || undefined,
      };
      const schedules = await ReceptionistService.getDoctorSchedules(
        filters,
        req.receptionistProfile.hospitalId,
      );
      res.status(200).json({ status: "success", data: schedules });
    } catch (err) {
      console.error("❌ [RECEPTIONIST] List schedules error:", err.message);
      res.status(400).json({ status: "fail", message: err.message });
    }
  },

  getUpcomingAppointments: async (req, res) => {
    try {
      const filters = {
        doctorId: req.query.doctorId ? parseInt(req.query.doctorId) : undefined,
        status: req.query.status || undefined,
        from: req.query.from || undefined,
        to: req.query.to || undefined,
      };
      const appointments = await ReceptionistService.getUpcomingAppointments(
        filters,
        req.receptionistProfile.hospitalId,
      );
      res.status(200).json({ status: "success", data: appointments });
    } catch (err) {
      console.error("❌ [RECEPTIONIST] List upcoming appointments error:", err.message);
      res.status(400).json({ status: "fail", message: err.message });
    }
  },

  getAppointments: async (req, res) => {
    try {
      const filters = {
        status: req.query.status || undefined,
        doctorId: req.query.doctorId ? parseInt(req.query.doctorId) : undefined,
        date: req.query.date || undefined,
        from: req.query.from || undefined,
        to: req.query.to || undefined,
        confirmationCode: req.query.confirmationCode || undefined,
      };
      const appointments = await ReceptionistService.getHospitalAppointments(
        filters,
        req.receptionistProfile.hospitalId,
      );
      res.status(200).json({ status: "success", data: appointments });
    } catch (err) {
      console.error("❌ [RECEPTIONIST] List appointments error:", err.message);
      res.status(400).json({ status: "fail", message: err.message });
    }
  },

  approveAppointment: async (req, res) => {
    try {
      const appointmentId = parseInt(req.params.id);
      const { slotId } = req.body;
      const result = await ReceptionistService.approveAppointment(
        appointmentId,
        req.receptionistProfile,
        slotId || undefined,
      );
      res.status(200).json({ status: "success", data: result });
    } catch (err) {
      console.error(
        "❌ [RECEPTIONIST] Approve appointment error:",
        err.message,
      );
      res.status(400).json({ status: "fail", message: err.message });
    }
  },

  denyAppointment: async (req, res) => {
    try {
      const appointmentId = parseInt(req.params.id);
      const { reason } = req.body;
      const result = await ReceptionistService.denyAppointment(
        appointmentId,
        reason,
        req.receptionistProfile,
      );
      res.status(200).json({ status: "success", data: result });
    } catch (err) {
      console.error(
        "❌ [RECEPTIONIST] Deny appointment error:",
        err.message,
      );
      res.status(400).json({ status: "fail", message: err.message });
    }
  },

  getHospitalEquipment: async (req, res) => {
    try {
      const equipment = await prisma.medicalEquipment.findMany({
        where: { hospitalId: req.receptionistProfile.hospitalId },
        select: { id: true, name: true, category: true, doctorName: true, isOperational: true, duration: true, price: true, operatingHours: true },
        orderBy: { name: "asc" },
      });
      res.status(200).json({ status: "success", data: equipment });
    } catch (err) {
      console.error("❌ [RECEPTIONIST] Get equipment error:", err.message);
      res.status(400).json({ status: "fail", message: err.message });
    }
  },

  addEquipment: async (req, res) => {
    try {
      const photoUrl = req.file ? await handleCloudinaryUpload(req.file, 'medical_equipment') : null;
      const body = { ...req.body };
      if (typeof body.operatingHours === 'string') {
        body.operatingHours = JSON.parse(body.operatingHours);
      }
      const data = {
        ...body,
        hospitalId: req.receptionistProfile.hospitalId,
        photo: photoUrl,
      };
const equipment = await ReceptionistService.createEquipment(data);
      res.status(201).json({ status: "success", data: equipment });
    } catch (err) {
      console.error("? [RECEPTIONIST] Add equipment error:", err.message);
      res.status(400).json({ status: "fail", message: err.message });
    }
  },

  addItems: async (req, res) => {
    try {
      const { items } = req.body;
      const hospitalId = req.receptionistProfile.hospitalId;
      const created = [];
      for (const item of items || []) {
        created.push(
          await ReceptionistService.createEquipment({
            ...item,
            hospitalId,
          })
        );
      }
      res.status(201).json({ status: "success", data: created });
    } catch (err) {
      console.error("? [RECEPTIONIST] Add equipment (bulk) error:", err.message);
      res.status(400).json({ status: "fail", message: err.message });
    }
  },

  deleteEquipment: async (req, res) => {
    try {
      const equipmentId = parseInt(req.params.id);
      await ReceptionistService.deleteEquipment(equipmentId, req.receptionistProfile.hospitalId);
      res.status(204).send();
    } catch (err) {
      console.error("❌ [RECEPTIONIST] Delete equipment error:", err.message);
      res.status(400).json({ status: "fail", message: err.message });
    }
  },

  updateEquipmentStatus: async (req, res) => {
    try {
      const equipmentId = parseInt(req.params.id);
      const { isOperational } = req.body;

      if (typeof isOperational !== "boolean") {
        return res.status(400).json({
          status: "fail",
          message: "isOperational must be a boolean",
        });
      }

      const result = await ReceptionistService.updateEquipmentStatus(
        equipmentId,
        isOperational,
        req.receptionistProfile.hospitalId,
      );
      res.status(200).json({ status: "success", data: result });
    } catch (err) {
      console.error(
        "❌ [RECEPTIONIST] Update equipment status error:",
        err.message,
      );
      res.status(400).json({ status: "fail", message: err.message });
    }
  },

  updateEquipmentOperatingHours: async (req, res) => {
    try {
      const equipmentId = parseInt(req.params.id);
      const { operatingHours, duration } = req.body;

      if (operatingHours !== undefined && (typeof operatingHours !== "object" || operatingHours === null)) {
        return res.status(400).json({
          status: "fail",
          message: "operatingHours must be an object with day schedules",
        });
      }

      const result = await ReceptionistService.updateEquipmentOperatingHours(
        equipmentId,
        operatingHours || undefined,
        duration !== undefined ? parseInt(duration) : undefined,
        req.receptionistProfile.hospitalId,
      );
      res.status(200).json({ status: "success", data: result });
    } catch (err) {
      console.error(
        "❌ [RECEPTIONIST] Update equipment operating hours error:",
        err.message,
      );
      res.status(400).json({ status: "fail", message: err.message });
    }
  },

  updateEquipment: async (req, res) => {
    try {
      const equipmentId = parseInt(req.params.id);
      const result = await ReceptionistService.updateEquipment(
        equipmentId,
        req.body,
        req.receptionistProfile.hospitalId,
      );
      res.status(200).json({ status: "success", data: result });
    } catch (err) {
      const status = err.message === "Equipment not found" ? 404 : 400;
      res.status(status).json({ status: "fail", message: err.message });
    }
  },

  cancelAppointment: async (req, res) => {
    try {
      const appointmentId = parseInt(req.params.id);
      const result = await ReceptionistService.cancelAppointment(
        appointmentId,
        req.receptionistProfile.hospitalId,
      );
      res.status(200).json({ status: "success", data: result });
    } catch (err) {
      console.error("❌ [RECEPTIONIST] Cancel appointment error:", err.message);
      res.status(400).json({ status: "fail", message: err.message });
    }
  },

  rescheduleAppointment: async (req, res) => {
    try {
      const appointmentId = parseInt(req.params.id);
      const { dateTime } = req.body;
      const result = await ReceptionistService.rescheduleAppointment(
        appointmentId,
        dateTime,
        req.receptionistProfile.hospitalId,
      );
      res.status(200).json({ status: "success", data: result });
    } catch (err) {
      console.error(
        "❌ [RECEPTIONIST] Reschedule appointment error:",
        err.message,
      );
      res.status(400).json({ status: "fail", message: err.message });
    }
  },

  updateAppointmentInfo: async (req, res) => {
    try {
      const appointmentId = parseInt(req.params.id);
      const result = await ReceptionistService.updateAppointmentInfo(
        appointmentId,
        req.body,
        req.receptionistProfile.hospitalId,
      );
      res.status(200).json({ status: "success", data: result });
    } catch (err) {
      console.error(
        "❌ [RECEPTIONIST] Update appointment info error:",
        err.message,
      );
      res.status(400).json({ status: "fail", message: err.message });
    }
  },

  searchPatients: async (req, res) => {
    try {
      const query = req.query.search || "";
      const patients = await ReceptionistService.searchPatients(query);
      res.status(200).json({ status: "success", data: patients });
    } catch (err) {
      console.error("❌ [RECEPTIONIST] Search patients error:", err.message);
      res.status(400).json({ status: "fail", message: err.message });
    }
  },

  getPatientHistory: async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const data = await HospitalPortalService.getPatientHistory(
        req.receptionistProfile.hospitalId,
        id,
      );
      res.status(200).json({ status: "success", data });
    } catch (err) {
      res.status(500).json({ status: "error", message: err.message });
    }
  },

  listPatients: async (req, res) => {
    try {
      const patients = await HospitalPortalService.listPatients(
        req.receptionistProfile.hospitalId,
        { search: req.query.search },
      );
      res.status(200).json({ status: "success", data: patients });
    } catch (err) {
      res.status(500).json({ status: "error", message: err.message });
    }
  },

  createPatient: async (req, res) => {
    try {
      const patient = await ReceptionistService.createPatient(req.body);
      res.status(201).json({ status: "success", data: patient });
    } catch (err) {
      console.error("❌ [RECEPTIONIST] Create patient error:", err.message);
      res.status(400).json({ status: "fail", message: err.message });
    }
  },

  searchAllDoctors: async (req, res) => {
    try {
      const query = (req.query.q || "").trim();
      const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
      const doctors = await ReceptionistService.searchAllDoctors(query, req.receptionistProfile.hospitalId, limit);
      res.status(200).json({ status: "success", data: doctors });
    } catch (err) {
      console.error("❌ [RECEPTIONIST] Search doctors error:", err.message);
      res.status(400).json({ status: "fail", message: err.message });
    }
  },

  getHospitalDoctors: async (req, res) => {
    try {
      const page = Math.max(1, parseInt(req.query.page, 10) || 1);
      const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
      const includeAll = req.query.includeAll === 'true';
      const status = req.query.status || null;
      const result = await ReceptionistService.getHospitalDoctors(
        req.receptionistProfile.hospitalId,
        page,
        limit,
        includeAll,
        status,
      );
      res.status(200).json({ status: "success", ...result });
    } catch (err) {
      console.error("❌ [RECEPTIONIST] Get doctors error:", err.message);
      res.status(400).json({ status: "fail", message: err.message });
    }
  },

  reviewDoctor: async (req, res) => {
    try {
      const doctorId = parseInt(req.params.id, 10);
      const { status, rejectionReason } = req.body;
      const doctor = await ReceptionistService.reviewHospitalDoctor(
        doctorId,
        req.receptionistProfile.hospitalId,
        status,
        rejectionReason || null,
      );
      res.status(200).json({ status: "success", data: doctor });
    } catch (err) {
      const status = err.message === "Doctor not found" ? 404 : 400;
      res.status(status).json({ status: "fail", message: err.message });
    }
  },

  updateDoctor: async (req, res) => {
    try {
      const doctorId = parseInt(req.params.id, 10);
      const doctor = await ReceptionistService.updateHospitalDoctor(
        doctorId,
        req.body,
        req.receptionistProfile.hospitalId,
      );
      res.status(200).json({ status: "success", data: doctor });
    } catch (err) {
      const status = err.message === "Doctor not found" ? 404 : 400;
      res.status(status).json({ status: "fail", message: err.message });
    }
  },

  removeDoctor: async (req, res) => {
    try {
      const doctorId = parseInt(req.params.id, 10);
      const doctor = await ReceptionistService.removeHospitalDoctor(
        doctorId,
        req.receptionistProfile.hospitalId,
      );
      res.status(200).json({ status: "success", data: doctor });
    } catch (err) {
      const status = err.message === "Doctor not found" ? 404 : 400;
      res.status(status).json({ status: "fail", message: err.message });
    }
  },

  getHospital: async (req, res) => {
    try {
      const hospital = await ReceptionistService.getHospital(
        req.receptionistProfile.hospitalId,
      );
      res.status(200).json({ status: "success", data: hospital });
    } catch (err) {
      res.status(404).json({ status: "fail", message: err.message });
    }
  },

  updateHospitalCardPrice: async (req, res) => {
    try {
      const hospital = await ReceptionistService.updateHospitalCardPrice(
        req.receptionistProfile.hospitalId,
        req.body.cardPrice,
      );
      res.status(200).json({ status: "success", data: hospital });
    } catch (err) {
      res.status(400).json({ status: "fail", message: err.message });
    }
  },

  registerDoctor: async (req, res) => {
    try {
      let profilePictureUrl = null;
      let introVideoUrl = null;
      if (req.files) {
        if (req.files.profilePicture) {
          profilePictureUrl = await handleCloudinaryUpload(req.files.profilePicture[0], 'doctor_profiles');
        }
        if (req.files.introVideo) {
          introVideoUrl = await handleCloudinaryUpload(req.files.introVideo[0], 'doctor_profiles');
        }
      }
      const data = {
        ...req.body,
        profilePicture: profilePictureUrl,
        introVideo: introVideoUrl,
      };
      const result = await ReceptionistService.registerDoctor(
        data,
        req.receptionistProfile.hospitalId,
      );
      res.status(201).json({ status: "success", data: result });
    } catch (err) {
      const status = err.message.includes("already in use") ? 409 : 400;
      res.status(status).json({ status: "fail", message: err.message });
    }
  },

  // ─── Card Management ──────────────────────────────────────────────

  // Card template CRUD
  createCardTemplate: async (req, res) => {
    try {
      const result = await ReceptionistService.createCardTemplate(
        req.body,
        req.receptionistProfile.hospitalId,
      );
      res.status(201).json({ status: "success", data: result });
    } catch (err) {
      res.status(400).json({ status: "fail", message: err.message });
    }
  },

  listCardTemplates: async (req, res) => {
    try {
      const result = await ReceptionistService.listCardTemplates(
        req.receptionistProfile.hospitalId,
      );
      res.status(200).json({ status: "success", data: result });
    } catch (err) {
      res.status(400).json({ status: "fail", message: err.message });
    }
  },

  updateCardTemplate: async (req, res) => {
    try {
      const cardId = parseInt(req.params.id, 10);
      const result = await ReceptionistService.updateCardTemplate(
        cardId,
        req.body,
        req.receptionistProfile.hospitalId,
      );
      res.status(200).json({ status: "success", data: result });
    } catch (err) {
      const status = err.message.includes("not found") ? 404 : 400;
      res.status(status).json({ status: "fail", message: err.message });
    }
  },

  deleteCardTemplate: async (req, res) => {
    try {
      const cardId = parseInt(req.params.id, 10);
      await ReceptionistService.deleteCardTemplate(
        cardId,
        req.receptionistProfile.hospitalId,
      );
      res.status(200).json({ status: "success", message: "Card template deleted" });
    } catch (err) {
      const status = err.message.includes("not found") ? 404 : 400;
      res.status(status).json({ status: "fail", message: err.message });
    }
  },

  // Patient card operations
  issueCard: async (req, res) => {
    try {
      const result = await ReceptionistService.issueCard(
        req.body,
        req.receptionistProfile.hospitalId,
      );
      res.status(201).json({ status: "success", data: result });
    } catch (err) {
      res.status(400).json({ status: "fail", message: err.message });
    }
  },

  extendCard: async (req, res) => {
    try {
      const cardId = parseInt(req.params.id, 10);
      const result = await ReceptionistService.extendCard(
        cardId,
        req.body.expiresAt,
        req.receptionistProfile.hospitalId,
      );
      res.status(200).json({ status: "success", data: result });
    } catch (err) {
      const status = err.message === "Card not found" ? 404 : 400;
      res.status(status).json({ status: "fail", message: err.message });
    }
  },

  listCards: async (req, res) => {
    try {
      const result = await ReceptionistService.listCards(
        req.receptionistProfile.hospitalId,
        req.query,
      );
      res.status(200).json({ status: "success", ...result });
    } catch (err) {
      res.status(400).json({ status: "fail", message: err.message });
    }
  },

  getCard: async (req, res) => {
    try {
      const cardId = parseInt(req.params.id, 10);
      const result = await ReceptionistService.getCard(
        cardId,
        req.receptionistProfile.hospitalId,
      );
      res.status(200).json({ status: "success", data: result });
    } catch (err) {
      const status = err.message === "Card not found" ? 404 : 400;
      res.status(status).json({ status: "fail", message: err.message });
    }
  },

  getDashboardStats: async (req, res) => {
    try {
      const stats = await ReceptionistService.getDashboardStats(
        req.receptionistProfile.hospitalId,
      );
      res.status(200).json({ status: "success", data: stats });
    } catch (err) {
      res.status(500).json({ status: "error", message: err.message });
    }
  },

  createFollowUp: async (req, res) => {
    try {
      const appointmentId = parseInt(req.params.id);
      const result = await AppointmentService.createFollowUp(
        appointmentId,
        null,
        req.body,
        req.receptionistProfile.hospitalId,
      );
      res.status(201).json({ status: "success", data: result });
    } catch (err) {
      res.status(400).json({ status: "fail", message: err.message });
    }
  },
  reorderAppointments: async (req, res) => {
    try {
      const { doctorId, date, orderedSlots } = req.body;
      const result = await ReceptionistService.reorderAppointments(
        doctorId,
        date,
        orderedSlots,
        req.receptionistProfile.hospitalId,
      );
      res.status(200).json({ status: "success", data: result });
    } catch (err) {
      console.error("❌ [RECEPTIONIST] Reorder appointments error:", err.message);
      res.status(400).json({ status: "fail", message: err.message });
    }
  },
};

module.exports = ReceptionistController;
