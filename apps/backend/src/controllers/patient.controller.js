const PatientService = require('../services/patient.service');

const PatientController = {
  setupProfile: async (req, res) => {
    try {
      const userId = req.user.id;
      let profile = await PatientService.getProfile(userId);
      
      if (profile) {
        profile = await PatientService.updateProfile(userId, req.body);
      } else {
        profile = await PatientService.createProfile(userId, req.body);
      }
      
      res.status(200).json({ status: 'success', data: profile });
    } catch (err) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  },

  getProfile: async (req, res) => {
    try {
      const userId = req.user.id;
      const profile = await PatientService.getProfile(userId);
      
      if (!profile) {
        return res.status(404).json({ status: 'fail', message: 'Patient profile not found' });
      }
      
      res.status(200).json({ status: 'success', data: profile });
    } catch (err) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  },

  checkPhone: async (req, res) => {
    try {
      const userId = req.user.id;
      const { phone } = req.body;

      if (!phone) {
        return res.status(400).json({ status: 'fail', message: 'Phone number is required' });
      }

      const result = await PatientService.checkPhone(userId, phone);
      res.status(200).json({ status: 'success', data: result });
    } catch (err) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  },

  deleteAccount: async (req, res) => {
    try {
      const userId = req.user.id;
      await PatientService.deleteAccount(userId);
      res.status(200).json({ status: 'success', message: 'Account deleted successfully' });
    } catch (err) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  },
};

module.exports = PatientController;
