const prisma = require('../lib/prisma');

const HospitalController = {
  listHospitals: async (req, res) => {
    try {
      const hospitals = await prisma.hospital.findMany({
        select: { id: true, name: true, address: true, image: true },
        orderBy: { name: 'asc' },
      });
      res.status(200).json({ status: 'success', data: hospitals });
    } catch (err) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  },
};

module.exports = HospitalController;
