const fs = require('fs');
const AdminService = require('../services/admin.service');
const prisma = require('../lib/prisma');
const { uploadToCloudinary } = require('../lib/cloudinary');

const handleCloudinaryUpload = async (file) => {
  if (!file) return null;
  try {
    const uploadResult = await uploadToCloudinary(file.path, 'receipts');
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
    return uploadResult.url;
  } catch (error) {
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
    throw error;
  }
};

const AdminController = {
  login: async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ status: 'fail', message: 'Email and password are required' });
      }
      
      const result = await AdminService.login(email, password);
      res.status(200).json({ status: 'success', data: result });
    } catch (err) {
      res.status(401).json({ status: 'fail', message: err.message });
    }
  },

  createAdmin: async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ status: 'fail', message: 'Email and password are required' });
      }

      const result = await AdminService.createAdmin(email, password);
      res.status(201).json({ status: 'success', data: result });
    } catch (err) {
      res.status(400).json({ status: 'fail', message: err.message });
    }
  },

  getAllDoctors: async (req, res) => {
    try {
      const doctors = await prisma.doctorProfile.findMany({
        include: {
          user: {
            select: { phone: true, email: true }
          },
          reviews: {
            include: {
              patient: {
                include: {
                  patientProfile: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
      res.status(200).json({ status: 'success', data: doctors });
    } catch (err) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  },

  getPendingDoctors: async (req, res) => {
    try {
      const doctors = await AdminService.listDoctors('PendingReview');
      res.status(200).json({ status: 'success', data: doctors });
    } catch (err) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  },

  getDoctorDetail: async (req, res) => {
    try {
      const { id } = req.params;
      const doctor = await prisma.doctorProfile.findUnique({
        where: { id: parseInt(id) },
        include: {
          user: {
            select: { phone: true, email: true, createdAt: true }
          },
          reviews: {
            include: {
              patient: {
                include: { patientProfile: true }
              }
            },
            orderBy: { createdAt: 'desc' }
          },
          appointments: {
            include: {
              patient: {
                include: { patientProfile: true }
              }
            },
            orderBy: { createdAt: 'desc' },
            take: 50
          }
        }
      });

      if (!doctor) {
        return res.status(404).json({ status: 'fail', message: 'Doctor not found' });
      }

      res.status(200).json({ status: 'success', data: doctor });
    } catch (err) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  },

  reviewDoctor: async (req, res) => {
    try {
      const { doctorId, status, rejectionReason } = req.body;
      if (!doctorId || !status) {
        return res.status(400).json({ status: 'fail', message: 'Doctor ID and status are required' });
      }

      const result = await AdminService.updateDoctorStatus(doctorId, status, rejectionReason);

      res.status(200).json({ status: 'success', data: result });
    } catch (err) {
      res.status(400).json({ status: 'fail', message: err.message });
    }
  },

  getWithdrawalRequests: async (req, res) => {
    try {
      const requests = await prisma.withdrawalRequest.findMany({
        include: {
          wallet: {
            include: {
              doctor: { select: { fullName: true } }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
      res.status(200).json({ status: 'success', data: requests });
    } catch (err) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  },

  completeWithdrawal: async (req, res) => {
    try {
      const { id } = req.params;
      const { referenceId } = req.body;
      const receiptImage = req.file ? await handleCloudinaryUpload(req.file) : null;

      if (!receiptImage) {
        return res.status(400).json({ status: 'fail', message: 'Bank transfer receipt image is required' });
      }

      const result = await prisma.$transaction(async (tx) => {
        const request = await tx.withdrawalRequest.findUnique({
          where: { id: parseInt(id) },
          include: { wallet: true }
        });

        if (!request || request.status !== 'pending') {
          throw new Error('Invalid withdrawal request');
        }

        const updatedRequest = await tx.withdrawalRequest.update({
          where: { id: parseInt(id) },
          data: {
            status: 'completed',
            receiptImage,
            referenceId,
            processedAt: new Date()
          }
        });

        await tx.wallet.update({
          where: { id: request.walletId },
          data: { balance: { decrement: request.amount } }
        });

        await tx.transaction.create({
          data: {
            walletId: request.walletId,
            amount: request.amount,
            type: 'DEBIT',
            description: `Withdrawal #${id} completed`
          }
        });

        return updatedRequest;
      });

      res.status(200).json({ status: 'success', data: result });
    } catch (err) {
      res.status(400).json({ status: 'fail', message: err.message });
    }
  },

  getAllPatients: async (req, res) => {
    try {
      const page = Math.max(1, parseInt(req.query.page, 10) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
      const skip = (page - 1) * limit;
      const status = req.query.status;
      let where = {};
      if (status === 'active' || status === 'inactive') {
        const activeUserIds = await prisma.appointment.groupBy({
          by: ['patientId'],
          _count: { id: true },
        });
        const ids = activeUserIds.map(a => a.patientId);
        if (status === 'active') {
          where = { userId: { in: ids } };
        } else {
          where = { userId: { notIn: ids } };
        }
      }
      const [patients, total] = await Promise.all([
        prisma.patientProfile.findMany({
          skip,
          take: limit,
          where,
          include: {
            user: { select: { phone: true, createdAt: true } }
          },
          orderBy: { createdAt: 'desc' }
        }),
        prisma.patientProfile.count({ where }),
      ]);
      res.status(200).json({
        status: 'success',
        data: patients,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      });
    } catch (err) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  },

  getPatientHistory: async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const patient = await prisma.patientProfile.findUnique({
        where: { id },
        include: { user: { select: { id: true, phone: true, createdAt: true } } },
      });
      if (!patient) {
        return res.status(404).json({ status: 'error', message: 'Patient not found' });
      }
      const userId = patient.userId;
      const [appointments, equipmentBookings] = await Promise.all([
        prisma.appointment.findMany({
          where: { patientId: userId },
          include: {
            doctor: { select: { id: true, fullName: true, specialization: true } },
          },
          orderBy: { dateTime: 'desc' },
        }),
        prisma.equipmentBooking.findMany({
          where: { patientId: userId },
          include: {
            equipment: { select: { id: true, name: true, category: true } },
            hospital: { select: { id: true, name: true } },
          },
          orderBy: { dateTime: 'desc' },
        }),
      ]);
      res.status(200).json({
        status: 'success',
        data: { patient, appointments, equipmentBookings },
      });
    } catch (err) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  },

  deleteDoctor: async (req, res) => {
    try {
      const { id } = req.params;
      const doctorId = parseInt(id);

      const doctor = await prisma.doctorProfile.findUnique({
        where: { id: doctorId },
        include: { user: { select: { id: true } } }
      });
      if (!doctor) {
        return res.status(404).json({ status: 'fail', message: 'Doctor not found' });
      }

      await prisma.$transaction(async (tx) => {
        // Delete reviews
        await tx.review.deleteMany({ where: { doctorId } });
        // Delete appointments
        await tx.appointment.deleteMany({ where: { doctorId } });
        // Delete wallet transactions & withdrawals
        const wallet = await tx.wallet.findUnique({ where: { doctorId } });
        if (wallet) {
          await tx.transaction.deleteMany({ where: { walletId: wallet.id } });
          await tx.withdrawalRequest.deleteMany({ where: { walletId: wallet.id } });
        }
        // Delete user (cascades to DoctorProfile, PaymentMethod, Wallet, Notifications)
        await tx.user.delete({ where: { id: doctor.user.id } });
      });

      res.status(200).json({ status: 'success', message: 'Doctor deleted successfully' });
    } catch (err) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  },

  getPatientGrowth: async (req, res) => {
    try {
      const months = Math.min(24, Math.max(1, parseInt(req.query.months, 10) || 12));
      const data = await AdminService.getPatientGrowth(months);
      res.status(200).json({ status: 'success', data });
    } catch (err) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  },

  getActivePatients: async (req, res) => {
    try {
      const data = await AdminService.getActivePatients();
      res.status(200).json({ status: 'success', data });
    } catch (err) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  },

  getAppointmentStats: async (req, res) => {
    try {
      const data = await AdminService.getAppointmentStats();
      res.status(200).json({ status: 'success', data });
    } catch (err) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  },

  getSystemStats: async (req, res) => {
    try {
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);

      const [
        doctorCount, 
        patientCount, 
        appointmentCount, 
        totalEarnings,
        newDoctorsWeek,
        newPatientsWeek,
        newAppointmentsWeek
      ] = await Promise.all([
        prisma.doctorProfile.count(),
        prisma.patientProfile.count(),
        prisma.appointment.count(),
        prisma.appointment.aggregate({
          where: { isPaid: true },
          _sum: { fee: true }
        }),
        prisma.doctorProfile.count({
          where: { createdAt: { gte: lastWeek } }
        }),
        prisma.patientProfile.count({
          where: { createdAt: { gte: lastWeek } }
        }),
        prisma.appointment.count({
          where: { createdAt: { gte: lastWeek } }
        })
      ]);

      res.status(200).json({
        status: 'success',
        data: {
          doctors: doctorCount,
          patients: patientCount,
          appointments: appointmentCount,
          revenue: totalEarnings._sum.fee || 0,
          weekly: {
            doctors: newDoctorsWeek,
            patients: newPatientsWeek,
            appointments: newAppointmentsWeek
          }
        }
      });
    } catch (err) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  },

  getAllEquipmentBookings: async (req, res) => {
    try {
      const { status, hospitalId, date } = req.query;
      const where = {};
      if (status) where.status = status;
      if (hospitalId) where.hospitalId = parseInt(hospitalId);
      if (date) {
        const start = new Date(date);
        start.setHours(0, 0, 0, 0);
        const end = new Date(date);
        end.setHours(23, 59, 59, 999);
        where.dateTime = { gte: start, lte: end };
      }
      const bookings = await prisma.equipmentBooking.findMany({
        where,
        include: {
          patient: {
            select: {
              id: true,
              phone: true,
              patientProfile: { select: { fullName: true, gender: true } },
            },
          },
          equipment: {
            select: { id: true, name: true, category: true, isOperational: true },
          },
          hospital: {
            select: { id: true, name: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 200,
      });
      const total = await prisma.equipmentBooking.count({ where });
      const byStatus = await prisma.equipmentBooking.groupBy({
        by: ['status'],
        _count: { id: true },
      });
      res.status(200).json({
        status: 'success',
        data: { bookings, total, byStatus },
      });
    } catch (err) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  },

  getEquipmentUtilization: async (req, res) => {
    try {
      const data = await AdminService.getEquipmentUtilization();
      res.status(200).json({ status: 'success', data });
    } catch (err) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  },

  getStaffPerformance: async (req, res) => {
    try {
      const data = await AdminService.getStaffPerformance();
      res.status(200).json({ status: 'success', data });
    } catch (err) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  },

  createDoctor: async (req, res) => {
    try {
      const { fullName, phone, email, specialization, specializations, licenseNumber, experienceYears, bio, clinicName, clinicAddress, languages, baseHourlyRate, hospitalId } = req.body;
      if (!fullName || !phone) {
        return res.status(400).json({ status: 'fail', message: 'Full name and phone are required' });
      }

      const bcrypt = require('bcryptjs');

      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { phone },
            ...(email ? [{ email }] : []),
          ],
        },
      });
      if (existingUser) {
        return res.status(400).json({ status: 'fail', message: 'Phone or email already in use' });
      }

      const tempPassword = Math.random().toString(36).slice(2, 10) + 'A1!';

      const result = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            phone,
            email: email || null,
            role: 'doctor',
            password: await bcrypt.hash(tempPassword, 10),
          },
        });

        const profile = await tx.doctorProfile.create({
          data: {
            userId: user.id,
            fullName,
            specialization: specialization || null,
            specializations: specializations ? (typeof specializations === 'string' ? JSON.parse(specializations) : specializations) : null,
            licenseNumber: licenseNumber || null,
            experienceYears: experienceYears ? parseInt(experienceYears) : null,
            bio: bio || null,
            clinicName: clinicName || null,
            clinicAddress: clinicAddress || null,
            languages: languages ? (typeof languages === 'string' ? JSON.parse(languages) : languages) : null,
            baseHourlyRate: baseHourlyRate ? parseFloat(baseHourlyRate) : null,
            hospitalId: hospitalId ? parseInt(hospitalId) : null,
            profilePicture: req.file ? req.file.path || null : null,
            status: 'Approved',
          },
        });

        return {
          ...profile,
          user: { id: user.id, phone: user.phone, email: user.email },
          tempPassword,
        };
      });

      res.status(201).json({ status: 'success', data: result });
    } catch (err) {
      res.status(400).json({ status: 'fail', message: err.message });
    }
  },

  createDoctorSchedule: async (req, res) => {
    try {
      const { doctorId, date, startTime, endTime, slotDuration, maxPatientsPerSlot, clinicRoom, notes, hospitalId } = req.body;
      if (!doctorId || !date || !startTime || !endTime) {
        return res.status(400).json({ status: 'fail', message: 'doctorId, date, startTime, and endTime are required' });
      }

      const ReceptionistService = require('../services/receptionist.service');
      const schedule = await ReceptionistService.createDoctorSchedule({
        doctorId: parseInt(doctorId),
        date,
        startTime,
        endTime,
        slotDuration: slotDuration || 30,
        maxPatientsPerSlot: maxPatientsPerSlot || 1,
        clinicRoom,
        notes,
      }, hospitalId || null);

      res.status(201).json({ status: 'success', data: schedule });
    } catch (err) {
      res.status(400).json({ status: 'fail', message: err.message });
    }
  },

  updateDoctorFee: async (req, res) => {
    try {
      const { id } = req.params;
      const { fee } = req.body;
      const doctor = await prisma.doctorProfile.update({
        where: { id: parseInt(id) },
        data: { baseHourlyRate: Number(fee) },
        select: { id: true, fullName: true, baseHourlyRate: true },
      });
      res.status(200).json({ status: 'success', data: doctor });
    } catch (err) {
      res.status(400).json({ status: 'fail', message: err.message });
    }
  },

  updateDoctor: async (req, res) => {
    try {
      const { id } = req.params;
      const allowed = ['fullName', 'specialization', 'specializations', 'licenseNumber', 'experienceYears', 'bio', 'clinicName', 'clinicAddress', 'languages', 'baseHourlyRate', 'hospitalId', 'status'];
      const data = {};
      for (const key of allowed) {
        if (req.body[key] !== undefined) {
          if (key === 'experienceYears' || key === 'hospitalId') {
            data[key] = req.body[key] !== null && req.body[key] !== '' ? parseInt(req.body[key]) : null;
          } else if (key === 'baseHourlyRate') {
            data[key] = req.body[key] !== null && req.body[key] !== '' ? parseFloat(req.body[key]) : null;
          } else {
            data[key] = req.body[key];
          }
        }
      }
      if (req.file) {
        data.profilePicture = req.file.path || req.file.location || null;
      }
      const doctor = await prisma.doctorProfile.update({
        where: { id: parseInt(id) },
        data,
        include: {
          user: { select: { id: true, phone: true, email: true, createdAt: true } },
          hospital: { select: { id: true, name: true } },
        },
      });
      res.status(200).json({ status: 'success', data: doctor });
    } catch (err) {
      res.status(400).json({ status: 'fail', message: err.message });
    }
  },

  getDoctorSchedules: async (req, res) => {
    try {
      const { id } = req.params;
      const schedules = await prisma.doctorSchedule.findMany({
        where: { doctorId: parseInt(id) },
        include: {
          slots: {
            include: { _count: { select: { bookings: true } } },
            orderBy: { startTime: 'asc' },
          },
        },
        orderBy: { date: 'desc' },
      });
      res.status(200).json({ status: 'success', data: schedules });
    } catch (err) {
      res.status(400).json({ status: 'fail', message: err.message });
    }
  },

  deleteDoctorSchedule: async (req, res) => {
    try {
      const { id } = req.params;
      await prisma.scheduleSlot.deleteMany({ where: { scheduleId: parseInt(id) } });
      await prisma.doctorSchedule.delete({ where: { id: parseInt(id) } });
      res.status(200).json({ status: 'success', message: 'Schedule deleted' });
    } catch (err) {
      res.status(400).json({ status: 'fail', message: err.message });
    }
  },
};

module.exports = AdminController;
