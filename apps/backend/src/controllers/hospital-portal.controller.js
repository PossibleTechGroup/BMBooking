const HospitalPortalService = require("../services/hospital-portal.service");

const HospitalPortalController = {
  register: async (req, res) => {
    try {
      const { name, address, phone, email, adminPhone, password } = req.body;
      if (!name || !adminPhone || !password) {
        return res.status(400).json({
          status: "fail",
          message: "Hospital name, admin phone, and password are required",
        });
      }
      const result = await HospitalPortalService.register({
        name,
        address,
        phone,
        email,
        adminPhone,
        password,
      });
      res.status(201).json({ status: "success", data: result });
    } catch (err) {
      const status = err.message.includes("already") ? 409 : 400;
      res.status(status).json({ status: "fail", message: err.message });
    }
  },

  getProfile: async (req, res) => {
    try {
      const hospital = await HospitalPortalService.getProfile(
        req.hospital.id,
      );
      res.status(200).json({ status: "success", data: hospital });
    } catch (err) {
      res.status(404).json({ status: "fail", message: err.message });
    }
  },

  updateProfile: async (req, res) => {
    try {
      const hospital = await HospitalPortalService.updateProfile(
        req.hospital.id,
        req.body,
      );
      res.status(200).json({ status: "success", data: hospital });
    } catch (err) {
      const status = err.message === "Hospital not found" ? 404 : 400;
      res.status(status).json({ status: "fail", message: err.message });
    }
  },

  getStats: async (req, res) => {
    try {
      const stats = await HospitalPortalService.getStats(req.hospital.id);
      res.status(200).json({ status: "success", data: stats });
    } catch (err) {
      res.status(500).json({ status: "error", message: err.message });
    }
  },

  listAppointments: async (req, res) => {
    try {
      const status = req.query.status;
      const appointments = await HospitalPortalService.listAppointments(
        req.hospital.id,
        status,
      );
      res.status(200).json({ status: "success", data: appointments });
    } catch (err) {
      res.status(500).json({ status: "error", message: err.message });
    }
  },

  listDoctors: async (req, res) => {
    try {
      const includeAll = req.query.includeAll === "true";
      const doctors = await HospitalPortalService.listDoctors(
        req.hospital.id,
        includeAll,
      );
      res.status(200).json({ status: "success", data: doctors });
    } catch (err) {
      res.status(500).json({ status: "error", message: err.message });
    }
  },

  updateDoctorStatus: async (req, res) => {
    try {
      const doctorId = parseInt(req.params.id, 10);
      const { status, rejectionReason } = req.body;
      const doctor = await HospitalPortalService.updateDoctorStatus(
        doctorId,
        req.hospital.id,
        status,
        rejectionReason,
      );
      res.status(200).json({ status: "success", data: doctor });
    } catch (err) {
      const status = err.message === "Doctor not found" ? 404 : 400;
      res.status(status).json({ status: "fail", message: err.message });
    }
  },

  listReceptionists: async (req, res) => {
    try {
      const receptionists = await HospitalPortalService.listReceptionists(
        req.hospital.id,
      );
      res.status(200).json({ status: "success", data: receptionists });
    } catch (err) {
      res.status(500).json({ status: "error", message: err.message });
    }
  },

  createReceptionist: async (req, res) => {
    try {
      const profile = await HospitalPortalService.createReceptionist(
        req.hospital.id,
        req.body,
      );
      res.status(201).json({ status: "success", data: profile });
    } catch (err) {
      const status = err.message.includes("already in use") ? 409 : 400;
      res.status(status).json({ status: "fail", message: err.message });
    }
  },

  updateReceptionist: async (req, res) => {
    try {
      const receptionistId = parseInt(req.params.id, 10);
      const profile = await HospitalPortalService.updateReceptionist(
        receptionistId,
        req.hospital.id,
        req.body,
      );
      res.status(200).json({ status: "success", data: profile });
    } catch (err) {
      const status = err.message === "Receptionist not found" ? 404 : 400;
      res.status(status).json({ status: "fail", message: err.message });
    }
  },

  deleteReceptionist: async (req, res) => {
    try {
      const receptionistId = parseInt(req.params.id, 10);
      await HospitalPortalService.deleteReceptionist(
        receptionistId,
        req.hospital.id,
      );
      res
        .status(200)
        .json({ status: "success", message: "Receptionist deleted" });
    } catch (err) {
      const status = err.message === "Receptionist not found" ? 404 : 400;
      res.status(status).json({ status: "fail", message: err.message });
    }
  },
};

module.exports = HospitalPortalController;
