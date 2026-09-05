const HospitalPortalService = require("../services/hospital-portal.service");

const HospitalPortalController = {
  getMe: async (req, res) => {
    try {
      const hospital = await HospitalPortalService.getProfile(req.hospital.id);
      res.status(200).json({
        status: "success",
        data: {
          user: {
            id: req.user.id,
            role: req.user.role,
            hospitalRole: req.hospitalRole,
            hospitalId: req.hospital.id,
            permissions: req.permissions || [],
            username: req.user.username || null,
            phone: req.user.phone || null,
            fullName:
              (req.receptionistProfile && req.receptionistProfile.fullName) ||
              (req.hospitalProfile && req.hospitalProfile.fullName) ||
              null,
          },
          hospital,
        },
      });
    } catch (err) {
      res.status(500).json({ status: "error", message: err.message });
    }
  },

  register: async (req, res) => {
    try {
      const { name, address, phone, email, adminPhone, password, services, image, logo, latitude, longitude } = req.body;
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
        services,
        image,
        logo,
        latitude,
        longitude,
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
      const appointments = await HospitalPortalService.listAppointments(
        req.hospital.id,
        req.query,
      );
      res.status(200).json({ status: "success", data: appointments });
    } catch (err) {
      res.status(500).json({ status: "error", message: err.message });
    }
  },

  getOverview: async (req, res) => {
    try {
      const overview = await HospitalPortalService.getOverview(req.hospital.id);
      res.status(200).json({ status: "success", data: overview });
    } catch (err) {
      res.status(500).json({ status: "error", message: err.message });
    }
  },

  getAnalytics: async (req, res) => {
    try {
      const analytics = await HospitalPortalService.getAnalytics(
        req.hospital.id,
        { period: req.query.period },
      );
      res.status(200).json({ status: "success", data: analytics });
    } catch (err) {
      res.status(500).json({ status: "error", message: err.message });
    }
  },

  listPatients: async (req, res) => {
    try {
      const patients = await HospitalPortalService.listPatients(
        req.hospital.id,
        { search: req.query.search },
      );
      res.status(200).json({ status: "success", data: patients });
    } catch (err) {
      res.status(500).json({ status: "error", message: err.message });
    }
  },

  getPatientHistory: async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const data = await HospitalPortalService.getPatientHistory(
        req.hospital.id,
        id,
      );
      res.status(200).json({ status: "success", data });
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

  registerDoctor: async (req, res) => {
    try {
      const ReceptionistService = require("../services/receptionist.service");
      const { handleCloudinaryUpload } = require("../lib/cloudinary");
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
        req.hospital.id,
      );
      res.status(201).json({ status: "success", data: result });
    } catch (err) {
      const status = err.message.includes("already in use") ? 409 : 400;
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

  listCardTemplates: async (req, res) => {
    try {
      const templates = await HospitalPortalService.listCardTemplates(
        req.hospital.id,
      );
      res.status(200).json({ status: "success", data: templates });
    } catch (err) {
      res.status(500).json({ status: "error", message: err.message });
    }
  },

  createCardTemplate: async (req, res) => {
    try {
      const template = await HospitalPortalService.createCardTemplate(
        req.body,
        req.hospital.id,
      );
      res.status(201).json({ status: "success", data: template });
    } catch (err) {
      res.status(400).json({ status: "fail", message: err.message });
    }
  },

  updateCardTemplate: async (req, res) => {
    try {
      const cardId = parseInt(req.params.id, 10);
      const template = await HospitalPortalService.updateCardTemplate(
        cardId,
        req.body,
        req.hospital.id,
      );
      res.status(200).json({ status: "success", data: template });
    } catch (err) {
      const status = err.message === "Card template not found" ? 404 : 400;
      res.status(status).json({ status: "fail", message: err.message });
    }
  },

  deleteCardTemplate: async (req, res) => {
    try {
      const cardId = parseInt(req.params.id, 10);
      await HospitalPortalService.deleteCardTemplate(
        cardId,
        req.hospital.id,
      );
      res
        .status(200)
        .json({ status: "success", message: "Card template deleted" });
    } catch (err) {
      const status = err.message === "Card template not found" ? 404 : 400;
      res.status(status).json({ status: "fail", message: err.message });
    }
  },

  listServices: async (req, res) => {
    try {
      const services = await HospitalPortalService.listServices(req.hospital.id);
      res.status(200).json({ status: "success", data: services });
    } catch (err) {
      res.status(500).json({ status: "error", message: err.message });
    }
  },

  addService: async (req, res) => {
    try {
      const service = await HospitalPortalService.addService(
        req.hospital.id,
        req.body,
      );
      res.status(201).json({ status: "success", data: service });
    } catch (err) {
      const status = err.message.includes("already") ? 409 : 400;
      res.status(status).json({ status: "fail", message: err.message });
    }
  },

  setServices: async (req, res) => {
    try {
      const { services } = req.body;
      await HospitalPortalService.setServices(req.hospital.id, services);
      const updated = await HospitalPortalService.listServices(req.hospital.id);
      res.status(200).json({ status: "success", data: updated });
    } catch (err) {
      res.status(400).json({ status: "fail", message: err.message });
    }
  },

  removeService: async (req, res) => {
    try {
      await HospitalPortalService.removeService(
        req.hospital.id,
        req.params.id,
      );
      res.status(200).json({ status: "success", message: "Service removed" });
    } catch (err) {
      const status = err.message === "Service not found" ? 404 : 400;
      res.status(status).json({ status: "fail", message: err.message });
    }
  },

  setLogo: async (req, res) => {
    try {
      const { handleCloudinaryUpload } = require("../lib/cloudinary");
      let image = req.body.image;
      if (req.file) {
        image = await handleCloudinaryUpload(req.file, "hospital_logos");
      }
      const hospital = await HospitalPortalService.setLogo(req.hospital.id, image);
      res.status(200).json({ status: "success", data: hospital });
    } catch (err) {
      res.status(400).json({ status: "fail", message: err.message });
    }
  },
};

module.exports = HospitalPortalController;
