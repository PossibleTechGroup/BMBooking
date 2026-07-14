const prisma = require('../lib/prisma');

const HospitalApplicationController = {
  // Public route to submit an application
  createApplication: async (req, res) => {
    try {
      const { hospitalName, contactPerson, contactInfo } = req.body;
      if (!hospitalName || !contactPerson || !contactInfo) {
        return res.status(400).json({
          status: 'fail',
          message: 'hospitalName, contactPerson, and contactInfo are required.',
        });
      }

      const application = await prisma.hospitalApplication.create({
        data: {
          hospitalName,
          contactPerson,
          contactInfo,
          status: 'PENDING',
        },
      });

      res.status(201).json({
        status: 'success',
        data: application,
      });
    } catch (err) {
      res.status(500).json({
        status: 'error',
        message: err.message,
      });
    }
  },

  // Admin route to list all applications
  listApplications: async (req, res) => {
    try {
      const { status } = req.query; // optional filter
      const where = status ? { status } : {};

      const applications = await prisma.hospitalApplication.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });

      res.status(200).json({
        status: 'success',
        data: applications,
      });
    } catch (err) {
      res.status(500).json({
        status: 'error',
        message: err.message,
      });
    }
  },

  // Admin route to update/mark contacted
  updateApplicationStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;

      if (!status) {
        return res.status(400).json({
          status: 'fail',
          message: 'Status is required.',
        });
      }

      const data = { status };
      if (status === 'CONTACTED') {
        data.contactedAt = new Date();
      }
      if (notes !== undefined) {
        data.notes = notes;
      }

      const updated = await prisma.hospitalApplication.update({
        where: { id },
        data,
      });

      res.status(200).json({
        status: 'success',
        data: updated,
      });
    } catch (err) {
      res.status(500).json({
        status: 'error',
        message: err.message,
      });
    }
  },
};

module.exports = HospitalApplicationController;
