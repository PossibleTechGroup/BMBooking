const WalletService = require('../services/wallet.service');

const WalletController = {
  getWallet: async (req, res) => {
    try {
      const doctorId = req.user.id; // Assuming user.id is the doctor's profile ID or we need to find it
      // Let's find the doctor profile first to be safe
      const prisma = require('../lib/prisma');
      const profile = await prisma.doctorProfile.findUnique({ where: { userId: req.user.id } });
      
      if (!profile) return res.status(404).json({ message: 'Doctor profile not found' });

      const wallet = await WalletService.getWallet(profile.id);
      res.status(200).json({ status: 'success', data: wallet });
    } catch (err) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  },

  withdraw: async (req, res) => {
    try {
      const { amount, bankName, accountNumber, accountName } = req.body;
      const prisma = require('../lib/prisma');
      const profile = await prisma.doctorProfile.findUnique({ where: { userId: req.user.id } });

      if (!profile) return res.status(404).json({ message: 'Doctor profile not found' });

      const request = await WalletService.requestWithdrawal(profile.id, amount, {
        bankName,
        accountNumber,
        accountName
      });

      res.status(201).json({ status: 'success', data: request });
    } catch (err) {
      res.status(400).json({ status: 'fail', message: err.message });
    }
  }
};

module.exports = WalletController;
