const AdminHospitalService = require("../services/admin.hospital.service");
const prisma = require("../lib/prisma");
const { handleCloudinaryUpload } = require('../lib/cloudinary');

const AdminHospitalController = {
  listHospitalRegistrations: async (req, res) => {
    try {
      const status = req.query.status;
      const where = status ? { status } : {};
      const registrations = await prisma.hospitalProfile.findMany({
        where,
        include: {
          hospital: {
            select: { id: true, name: true, address: true, phone: true, email: true },
          },
          user: { select: { id: true, phone: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
      });
      res.status(200).json({ status: "success", data: registrations });
    } catch (err) {
      res.status(500).json({ status: "error", message: err.message });
    }
  },

  updateHospitalRegistrationStatus: async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const { status, rejectionReason } = req.body;
      if (!["APPROVED", "REJECTED"].includes(status)) {
        return res
          .status(400)
          .json({ status: "fail", message: "Status must be APPROVED or REJECTED" });
      }

      const profile = await prisma.hospitalProfile.findUnique({
        where: { id },
      });
      if (!profile) {
        return res.status(404).json({ status: "fail", message: "Registration not found" });
      }

      const updated = await prisma.hospitalProfile.update({
        where: { id },
        data: {
          status,
          rejectionReason: status === "REJECTED" ? rejectionReason || null : null,
        },
        include: {
          hospital: { select: { id: true, name: true } },
          user: { select: { id: true, phone: true } },
        },
      });
      res.status(200).json({ status: "success", data: updated });
    } catch (err) {
      res.status(400).json({ status: "fail", message: err.message });
    }
  },
  listHospitals: async (req, res) => {
    try {
      const page = Math.max(1, parseInt(req.query.page, 10) || 1);
      const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 12));
      const result = await AdminHospitalService.listHospitals(page, limit);
      res.status(200).json({ status: "success", ...result });
    } catch (err) {
      res.status(500).json({ status: "error", message: err.message });
    }
  },

  createHospital: async (req, res) => {
    try {
      const data = { ...req.body };
      if (req.file) {
        data.image = await handleCloudinaryUpload(req.file, 'hospitals');
      }
      const hospital = await AdminHospitalService.createHospital(data);
      res.status(201).json({ status: "success", data: hospital });
    } catch (err) {
      const status = err.message.includes("already exists") ? 409 : 400;
      res.status(status).json({ status: "fail", message: err.message });
    }
  },

  updateHospital: async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const data = { ...req.body };
      if (req.file) {
        data.image = await handleCloudinaryUpload(req.file, 'hospitals');
      }
      const hospital = await AdminHospitalService.updateHospital(id, data);
      res.status(200).json({ status: "success", data: hospital });
    } catch (err) {
      const status = err.message === "Hospital not found" ? 404 : 400;
      res.status(status).json({ status: "fail", message: err.message });
    }
  },

  deleteHospital: async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      await AdminHospitalService.deleteHospital(id);
      res.status(200).json({ status: "success", message: "Hospital deleted" });
    } catch (err) {
      const status = err.message === "Hospital not found" ? 404 : 500;
      res.status(status).json({ status: "fail", message: err.message });
    }
  },

  listReceptionists: async (req, res) => {
    try {
      const receptionists = await AdminHospitalService.listReceptionists();
      res.status(200).json({ status: "success", data: receptionists });
    } catch (err) {
      res.status(500).json({ status: "error", message: err.message });
    }
  },

  updateReceptionist: async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const profile = await AdminHospitalService.updateReceptionist(id, req.body);
      res.status(200).json({ status: "success", data: profile });
    } catch (err) {
      const status = err.message === "Receptionist not found" ? 404 : 400;
      res.status(status).json({ status: "fail", message: err.message });
    }
  },

  deleteReceptionist: async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      await AdminHospitalService.deleteReceptionist(id);
      res.status(200).json({ status: "success", message: "Receptionist deleted" });
    } catch (err) {
      const status = err.message === "Receptionist not found" ? 404 : 500;
      res.status(status).json({ status: "fail", message: err.message });
    }
  },

  createReceptionist: async (req, res) => {
    try {
      const profile = await AdminHospitalService.createReceptionist(req.body);
      res.status(201).json({ status: "success", data: profile });
    } catch (err) {
      const status = err.message === "Hospital not found" ? 404 : 400;
      res.status(status).json({ status: "fail", message: err.message });
    }
  },

  assignDoctorToHospital: async (req, res) => {
    try {
      const doctorId = parseInt(req.params.id, 10);
      const { hospitalId } = req.body;
      const doctor = await AdminHospitalService.assignHospitalToDoctor(doctorId, hospitalId);
      res.status(200).json({ status: "success", data: doctor });
    } catch (err) {
      const status = err.message === "Doctor not found" || err.message === "Hospital not found" ? 404 : 400;
      res.status(status).json({ status: "fail", message: err.message });
    }
  },

  listHospitalDoctors: async (req, res) => {
    try {
      const hospitalId = parseInt(req.params.id, 10);
      const doctors = await AdminHospitalService.listHospitalDoctors(hospitalId);
      res.status(200).json({ status: "success", data: doctors });
    } catch (err) {
      res.status(500).json({ status: "error", message: err.message });
    }
  },

  setServiceFee: async (req, res) => {
    try {
      const hospitalId = parseInt(req.params.id, 10);
      const { amount } = req.body;
      const result = await AdminHospitalService.setServiceFee(hospitalId, amount);
      res.status(200).json({ status: "success", data: result });
    } catch (err) {
      const status = err.message === "Hospital not found" ? 404 : 400;
      res.status(status).json({ status: "fail", message: err.message });
    }
  },
};

module.exports = AdminHospitalController;
