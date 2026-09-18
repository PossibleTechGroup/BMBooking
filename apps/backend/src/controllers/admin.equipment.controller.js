const prisma = require("../lib/prisma");
const { NotificationService } = require("../services/notification.service");
const SmsService = require("../services/sms.service");
const { handleCloudinaryUpload } = require('../lib/cloudinary');

const AdminEquipmentController = {
  addItem: async (req, res) => {
    try {
      const {
        name,
        category,
        hospitalId,
        price,
        operatingHours,
        duration,
        isOperational,
        description,
      } = req.body;

      const hospital = await prisma.hospital.findUnique({
        where: { id: hospitalId },
      });
      if (!hospital) {
        return res
          .status(404)
          .json({ status: "fail", message: "Hospital not found" });
      }

      const photoUrl = req.file ? await handleCloudinaryUpload(req.file, 'medical_equipment') : null;

      const item = await prisma.medicalEquipment.create({
        data: {
          name,
          category,
          hospitalId,
          price: price !== undefined && price !== null && price !== '' ? Number(price) : undefined,
          operatingHours: operatingHours || null,
          duration: duration || 30,
          isOperational,
          description,
          photo: photoUrl,
        },
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
      res.status(201).json({ status: "success", data: item });
    } catch (err) {
      res.status(400).json({ status: "fail", message: err.message });
    }
  },

  addItems: async (req, res) => {
    try {
      const { hospitalId, items } = req.body;

      const hospital = await prisma.hospital.findUnique({
        where: { id: hospitalId },
      });
      if (!hospital) {
        return res
          .status(404)
          .json({ status: "fail", message: "Hospital not found" });
      }
      if (!Array.isArray(items) || items.length === 0) {
        return res
          .status(400)
          .json({ status: "fail", message: "Provide at least one item to add" });
      }

      for (const item of items) {
        if (item.name === undefined || item.name === null || String(item.name).trim() === '') {
          return res
            .status(400)
            .json({ status: "fail", message: "Every item requires a name" });
        }
        const category = item.category || 'OTHER';
        const created = await prisma.medicalEquipment.create({
          data: {
            name: String(item.name).trim(),
            category,
            hospitalId,
            price: item.price !== undefined && item.price !== null && item.price !== '' ? Number(item.price) : undefined,
            operatingHours: item.operatingHours || null,
            duration: item.duration || 30,
            isOperational: item.isOperational !== undefined ? Boolean(item.isOperational) : true,
            description: item.description || null,
          },
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
        console.log(`[AdminEquipment] Added "${item.name}" (${category}) to hospital ${hospitalId}`);
      }

      const added = await prisma.medicalEquipment.findMany({
        where: { hospitalId },
        orderBy: { id: "desc" },
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

      res.status(201).json({ status: "success", data: added });
    } catch (err) {
      res.status(400).json({ status: "fail", message: err.message });
    }
  },

  updateItem: async (req, res) => {
    try {
      const { id } = req.params;
      const allowedFields = [
        "name",
        "category",
        "operatingHours",
        "duration",
        "isOperational",
        "price",
        "description",
      ];
      const data = {};
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          data[field] = req.body[field];
        }
      }
      if (req.file) {
        data.photo = await handleCloudinaryUpload(req.file, 'medical_equipment');
      }

      const item = await prisma.medicalEquipment.update({
        where: { id: parseInt(id) },
        data,
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
      res.status(200).json({ status: "success", data: item });
    } catch (err) {
      res.status(400).json({ status: "fail", message: err.message });
    }
  },

  deleteItem: async (req, res) => {
    try {
      const { id } = req.params;
      await prisma.medicalEquipment.delete({ where: { id: parseInt(id) } });
      res.status(204).send();
    } catch (err) {
      res.status(400).json({ status: "fail", message: err.message });
    }
  },

  createAnnouncement: async (req, res) => {
    try {
      const { title, message, category, hospitalId, equipmentId } = req.body;

      const data = {
        title,
        message,
        category,
        hospitalId: hospitalId ? parseInt(hospitalId) : null,
        equipmentId: equipmentId ? parseInt(equipmentId) : null,
      };

      if (data.equipmentId) {
        const equipment = await prisma.medicalEquipment.findUnique({
          where: { id: data.equipmentId },
          select: { hospitalId: true },
        });
        if (!equipment) {
          return res.status(404).json({ status: "fail", message: "Equipment not found" });
        }
        if (!data.hospitalId) {
          data.hospitalId = equipment.hospitalId;
        }
      }

      const announcement = await prisma.equipmentAnnouncement.create({
        data,
        include: {
          hospital: { select: { id: true, name: true } },
          equipment: { select: { id: true, name: true } },
        },
      });

      const users = await prisma.user.findMany({
        select: { id: true, expoPushToken: true, phone: true },
      });

      if (users.length > 0) {
        for (const user of users) {
          if (user.expoPushToken) {
            await NotificationService.create(
              user.id,
              "SYSTEM",
              title,
              message,
              { type: "EQUIPMENT_ANNOUNCEMENT", announcementId: announcement.id },
            );
          }
        }

        const smsMessage = `BM Booking Alert: ${title}. ${message}. Check the app for details!`;
        const phoneNumbers = users.map((u) => u.phone).filter((p) => p);
        if (phoneNumbers.length > 0) {
          SmsService.broadcast(phoneNumbers, smsMessage).catch((err) =>
            console.error("SMS Broadcast failed:", err),
          );
        }
      }

      res.status(201).json({ status: "success", data: announcement });
    } catch (err) {
      res.status(400).json({ status: "fail", message: err.message });
    }
  },
};

module.exports = AdminEquipmentController;
