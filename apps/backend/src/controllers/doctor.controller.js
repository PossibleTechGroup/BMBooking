const DoctorService = require('../services/doctor.service');
const { handleCloudinaryUpload } = require('../lib/cloudinary');

const DoctorController = {
  setupProfile: async (req, res) => {
    try {
      console.log('📬 [PROFILE] Received setup request for user:', req.user.id);
      const userId = req.user.id;
      const profileData = { ...req.body };

      // Handle file uploads
      if (req.files) {
        console.log('📁 [PROFILE] Files received:', Object.keys(req.files));
        if (req.files.profilePicture) {
          profileData.profilePicture = await handleCloudinaryUpload(req.files.profilePicture[0], 'doctor_profiles');
        }
        if (req.files.introVideo) {
          profileData.introVideo = await handleCloudinaryUpload(req.files.introVideo[0], 'doctor_profiles');
        }
      }

      if (req.body.removeIntroVideo === "true") profileData.introVideo = null;

      console.log('🧪 [PROFILE] Final data before service:', JSON.stringify(profileData, null, 2));

      const profile = await DoctorService.setupProfile(userId, profileData);
      console.log('✅ [PROFILE] Success for user:', userId);
      res.status(200).json({ status: 'success', data: profile });
    } catch (err) {
      console.error('❌ [PROFILE] Error:', err.message);
      res.status(500).json({ status: 'error', message: err.message });
    }
  },

  updateProfile: async (req, res) => {
    try {
      const userId = req.user.id;
      const profileData = { ...req.body };

      // Handle file uploads
      if (req.files) {
        if (req.files.profilePicture) {
          profileData.profilePicture = await handleCloudinaryUpload(req.files.profilePicture[0], 'doctor_profiles');
        }
        if (req.files.introVideo) {
          profileData.introVideo = await handleCloudinaryUpload(req.files.introVideo[0], 'doctor_profiles');
        }
      }

      const profile = await DoctorService.updateProfile(userId, profileData);
      res.status(200).json({ status: 'success', data: profile });
    } catch (err) {
      console.error('❌ [UPDATE] Error:', err.message);
      res.status(500).json({ status: 'error', message: err.message });
    }
  },

  getProfile: async (req, res) => {
    try {
      const userId = req.user.id;
      const profile = await DoctorService.getProfile(userId);
      if (!profile) {
        return res.status(404).json({ status: 'fail', message: 'Profile not found' });
      }
      res.status(200).json({ status: 'success', data: profile });
    } catch (err) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  },

  getAllDoctors: async (req, res) => {
    try {
      const doctors = await DoctorService.getAllDoctors();
      res.status(200).json({ status: 'success', data: doctors });
    } catch (err) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  },

  search: async (req, res) => {
    try {
      const { specialty, minRating, name } = req.query;
      const doctors = await DoctorService.searchDoctors({ specialty, minRating, name });
      res.status(200).json({ status: 'success', data: doctors });
    } catch (err) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  },

  updateAvailability: async (req, res) => {
    try {
      const userId = req.user.id;
      const { availability } = req.body;
      if (!availability) throw new Error('Availability data is required');

      const profile = await DoctorService.updateProfile(userId, { availability });
      res.status(200).json({ status: 'success', data: profile });
    } catch (err) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  },

  createDoctorSchedule: async (req, res) => {
    try {
      const schedule = await DoctorService.createDoctorSchedule(req.body, req.user.id);
      res.status(201).json({ status: 'success', data: schedule });
    } catch (err) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  },

  getDoctorSchedules: async (req, res) => {
    try {
      const doctorId = parseInt(req.params.id);
      if (!doctorId || isNaN(doctorId)) {
        return res.status(400).json({ status: 'fail', message: 'Valid doctor ID is required' });
      }
      const filters = {
        date: req.query.date || undefined,
        from: req.query.from || undefined,
        to: req.query.to || undefined,
      };
      const schedules = await DoctorService.getDoctorSchedules(doctorId, filters);
      res.status(200).json({ status: 'success', data: schedules });
    } catch (err) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  }
};

module.exports = DoctorController;
