const prisma = require("../lib/prisma");

const EquipmentController = {
  search: async (req, res) => {
    try {
      const amharicHelper = require('../lib/amharicHelper');
      let { category, city, isOperational, query, hospitalId } = req.query;
      if (category === 'undefined') category = undefined;
      if (city === 'undefined') city = undefined;
      if (query === 'undefined') query = undefined;
      if (isOperational === 'undefined') isOperational = undefined;

      const where = {};
      const andConditions = [];

      const VALID_CATEGORIES = [
        'MRI', 'CT_SCAN', 'DIALYSIS', 'ULTRASOUND', 'XRAY',
        'VENTILATOR', 'ECG', 'MAMMOGRAPHY', 'DEFIBRILLATOR', 'OTHER'
      ];

      if (category) {
        const mappedCat = amharicHelper.translateEquipmentCategory(category);
        if (VALID_CATEGORIES.includes(mappedCat)) {
          where.category = mappedCat;
        }
      }

      if (city) {
        const cityTerms = amharicHelper.expandQuery(city);
        andConditions.push({
          OR: cityTerms.map(term => ({ city: { contains: term, mode: 'insensitive' } }))
        });
      }

      if (isOperational === 'true' || isOperational === 'false') {
        where.isOperational = isOperational === 'true';
      }
      if (hospitalId) {
        where.hospitalId = parseInt(hospitalId);
      }

      if (query) {
        where.OR = [
          { name: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
          { hospital: { name: { contains: query, mode: "insensitive" } } },
          { hospital: { address: { contains: query, mode: "insensitive" } } },
        ];
      }

      if (city) {
        where.hospital = {
          ...(where.hospital || {}),
          address: { contains: city, mode: "insensitive" },
        };
      }

      const equipment = await prisma.medicalEquipment.findMany({
        where,
        include: {
          hospital: {
            select: {
              id: true,
              name: true,
              address: true,
              phone: true,
              email: true,
              latitude: true,
              longitude: true,
              cardPrice: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      res.status(200).json({ status: "success", data: equipment });
    } catch (err) {
      res.status(500).json({ status: "error", message: err.message });
    }
  },

  getCategories: async (req, res) => {
    try {
      const categories = await prisma.medicalEquipment.groupBy({
        by: ["category"],
        _count: { id: true },
      });
      res.status(200).json({ status: "success", data: categories });
    } catch (err) {
      res.status(500).json({ status: "error", message: err.message });
    }
  },

  getDetail: async (req, res) => {
    try {
      const { id } = req.params;
      const item = await prisma.medicalEquipment.findUnique({
        where: { id: parseInt(id) },
        include: {
          hospital: {
            select: {
              id: true,
              name: true,
              address: true,
              phone: true,
              email: true,
              latitude: true,
              longitude: true,
              cardPrice: true,
            },
          },
        },
      });

      if (!item) {
        return res
          .status(404)
          .json({ status: "fail", message: "Item not found" });
      }

      res.status(200).json({ status: "success", data: item });
    } catch (err) {
      res.status(500).json({ status: "error", message: err.message });
    }
  },

  getAnnouncements: async (req, res) => {
    try {
      const announcements = await prisma.equipmentAnnouncement.findMany({
        include: {
          hospital: { select: { id: true, name: true } },
          equipment: { select: { id: true, name: true, category: true } },
        },
        orderBy: { createdAt: "desc" },
      });
      res.status(200).json({ status: "success", data: announcements });
    } catch (err) {
      res.status(500).json({ status: "error", message: err.message });
    }
  },

  getHospitalDetail: async (req, res) => {
    try {
      const { id } = req.params;
      const equipment = await prisma.medicalEquipment.findUnique({
        where: { id: parseInt(id) },
        include: { hospital: true },
      });

      if (!equipment) {
        return res
          .status(404)
          .json({ status: "fail", message: "Equipment not found" });
      }

      const allEquipment = await prisma.medicalEquipment.findMany({
        where: { hospitalId: equipment.hospitalId },
        include: {
          hospital: {
            select: { id: true, name: true, address: true, phone: true },
          },
        },
      });

      const hospital = {
        id: equipment.hospital.id,
        name: equipment.hospital.name,
        phone: equipment.hospital.phone,
        address: equipment.hospital.address,
        latitude: equipment.hospital.latitude,
        longitude: equipment.hospital.longitude,
        cardPrice: equipment.hospital.cardPrice,
        equipment: allEquipment,
      };

      res.status(200).json({ status: "success", data: hospital });
    } catch (err) {
      res.status(500).json({ status: "error", message: err.message });
    }
  },
};

module.exports = EquipmentController;
