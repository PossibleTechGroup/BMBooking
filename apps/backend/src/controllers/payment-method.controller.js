const PaymentMethodService = require('../services/payment-method.service');
const prisma = require('../lib/prisma');

const PaymentMethodController = {
  getMethods: async (req, res) => {
    try {
      const profile = await prisma.doctorProfile.findUnique({ where: { userId: req.user.id } });
      if (!profile) return res.status(404).json({ message: 'Doctor profile not found' });

      const methods = await PaymentMethodService.listMethods(profile.id);
      res.status(200).json({ status: 'success', data: methods });
    } catch (err) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  },

  addMethod: async (req, res) => {
    try {
      const profile = await prisma.doctorProfile.findUnique({ where: { userId: req.user.id } });
      if (!profile) return res.status(404).json({ message: 'Doctor profile not found' });

      const method = await PaymentMethodService.addMethod(profile.id, req.body);
      res.status(201).json({ status: 'success', data: method });
    } catch (err) {
      res.status(400).json({ status: 'fail', message: err.message });
    }
  },

  updateMethod: async (req, res) => {
    try {
      const profile = await prisma.doctorProfile.findUnique({ where: { userId: req.user.id } });
      const method = await PaymentMethodService.updateMethod(parseInt(req.params.id), profile.id, req.body);
      res.status(200).json({ status: 'success', data: method });
    } catch (err) {
      res.status(400).json({ status: 'fail', message: err.message });
    }
  },

  deleteMethod: async (req, res) => {
    try {
      const profile = await prisma.doctorProfile.findUnique({ where: { userId: req.user.id } });
      await PaymentMethodService.deleteMethod(parseInt(req.params.id), profile.id);
      res.status(200).json({ status: 'success', message: 'Payment method deleted' });
    } catch (err) {
      res.status(400).json({ status: 'fail', message: err.message });
    }
  },

  setPrimary: async (req, res) => {
    try {
      const profile = await prisma.doctorProfile.findUnique({ where: { userId: req.user.id } });
      const method = await PaymentMethodService.setPrimary(parseInt(req.params.id), profile.id);
      res.status(200).json({ status: 'success', data: method });
    } catch (err) {
      res.status(400).json({ status: 'fail', message: err.message });
    }
  }
};

module.exports = PaymentMethodController;
