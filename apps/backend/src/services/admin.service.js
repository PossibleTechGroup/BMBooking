const bcrypt = require('bcryptjs');
const User = require('../models/user.model');
const { signToken } = require('../lib/jwt.lib');

const AdminService = {
  login: async (email, password) => {
    const user = await User.findByEmail(email);
    if (!user || user.role !== 'admin') {
      throw new Error('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new Error('Invalid email or password');
    }

    const token = signToken({ 
      id: user.id, 
      email: user.email, 
      role: user.role 
    });

    return { token, user: { id: user.id, email: user.email, role: user.role } };
  },

  createAdmin: async (email, password) => {
    // Check if already exists
    const existing = await User.findByEmail(email);
    if (existing) {
      throw new Error('Email already in use');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const newAdmin = await User.createAdmin(email, hashedPassword);
    
    return {
      id: newAdmin.id,
      email: newAdmin.email,
      role: newAdmin.role
    };
  },

  getPatientGrowth: async (months = 12) => {
    const prisma = require('../lib/prisma');
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months + 1);
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);

    const raw = await prisma.$queryRaw`
      SELECT
        DATE_TRUNC('month', created_at)::date AS month,
        COUNT(*)::int AS count
      FROM patient_profiles
      WHERE created_at >= ${startDate}
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY month ASC
    `;

    // Build full 12-month array including months with zero registrations
    const data = [];
    for (let i = 0; i < months; i++) {
      const d = new Date();
      d.setMonth(d.getMonth() - (months - 1 - i));
      const label = d.toLocaleString('en-US', { timeZone: 'Africa/Nairobi', month: 'short', year: 'numeric' });
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
      const found = raw.find((r) => {
        const rStr = r.month instanceof Date
          ? `${r.month.getFullYear()}-${String(r.month.getMonth() + 1).padStart(2, '0')}-01`
          : String(r.month).substring(0, 10);
        return rStr === key;
      });
      data.push({ month: label, count: found ? Number(found.count) : 0 });
    }
    return data;
  },

  getActivePatients: async () => {
    const prisma = require('../lib/prisma');
    const total = await prisma.patientProfile.count();
    const active = await prisma.appointment.groupBy({
      by: ['patientId'],
      _count: { id: true },
    });
    return {
      total,
      active: active.length,
      inactive: total - active.length,
    };
  },

  getAppointmentStats: async () => {
    const prisma = require('../lib/prisma');
    const statuses = ['pending', 'accepted', 'declined', 'completed', 'cancelled'];
    const byStatus = await Promise.all(
      statuses.map(async (status) => {
        const count = await prisma.appointment.count({ where: { status } });
        return { status, count };
      })
    );
    const total = byStatus.reduce((sum, s) => sum + s.count, 0);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    const todayAppts = await prisma.appointment.count({
      where: { createdAt: { gte: todayStart, lte: todayEnd } },
    });
    const totalRevenue = await prisma.appointment.aggregate({
      where: { isPaid: true },
      _sum: { fee: true },
    });
    return { total, byStatus, todayAppts, totalRevenue: totalRevenue._sum.fee ? Number(totalRevenue._sum.fee) : 0 };
  },

  getStaffPerformance: async () => {
    const prisma = require('../lib/prisma');
    const receptionists = await prisma.receptionistProfile.findMany({
      include: {
        user: {
          select: { id: true, username: true, phone: true, email: true, createdAt: true },
        },
        hospital: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Fetch counts in bulk using groupBy (more efficient than per-receptionist queries)
    const [apptGroups, bookingGroups, scheduleGroups] = await Promise.all([
      prisma.appointment.groupBy({
        by: ['reviewedByReceptionistId'],
        _count: { id: true },
        where: { reviewedByReceptionistId: { not: null } },
      }),
      prisma.equipmentBooking.groupBy({
        by: ['reviewedByReceptionistId'],
        _count: { id: true },
        where: { reviewedByReceptionistId: { not: null } },
      }),
      prisma.doctorSchedule.groupBy({
        by: ['createdById'],
        _count: { id: true },
        where: { createdById: { not: null } },
      }),
    ]);

    // Build lookup maps
    const apptMap = Object.fromEntries(
      apptGroups.map((g) => [g.reviewedByReceptionistId, g._count.id])
    );
    const bookingMap = Object.fromEntries(
      bookingGroups.map((g) => [g.reviewedByReceptionistId, g._count.id])
    );
    const scheduleMap = Object.fromEntries(
      scheduleGroups.map((g) => [g.createdById, g._count.id])
    );

    // Today's range
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // Fetch today's activity in bulk
    const [todayAppts, todayBookings] = await Promise.all([
      prisma.appointment.groupBy({
        by: ['reviewedByReceptionistId'],
        _count: { id: true },
        where: {
          reviewedByReceptionistId: { not: null },
          reviewedAt: { gte: todayStart, lte: todayEnd },
        },
      }),
      prisma.equipmentBooking.groupBy({
        by: ['reviewedByReceptionistId'],
        _count: { id: true },
        where: {
          reviewedByReceptionistId: { not: null },
          reviewedAt: { gte: todayStart, lte: todayEnd },
        },
      }),
    ]);
    const todayApptMap = Object.fromEntries(
      todayAppts.map((g) => [g.reviewedByReceptionistId, g._count.id])
    );
    const todayBookingMap = Object.fromEntries(
      todayBookings.map((g) => [g.reviewedByReceptionistId, g._count.id])
    );

    // Build per-receptionist performance data
    const staffData = receptionists.map((r) => {
      const appointmentsReviewed = apptMap[r.id] || 0;
      const bookingsReviewed = bookingMap[r.id] || 0;
      const schedulesCreated = scheduleMap[r.id] || 0;
      const todayApptsCount = todayApptMap[r.id] || 0;
      const todayBookingsCount = todayBookingMap[r.id] || 0;
      const totalActions = appointmentsReviewed + bookingsReviewed + schedulesCreated;
      return {
        id: r.id,
        username: r.user?.username || 'N/A',
        phone: r.user?.phone || '',
        email: r.user?.email || '',
        hospital: r.hospital?.name || 'Unassigned',
        hospitalId: r.hospitalId,
        joinedAt: r.createdAt,
        metrics: {
          appointmentsReviewed,
          bookingsReviewed,
          schedulesCreated,
          totalActions,
          todayActions: todayApptsCount + todayBookingsCount,
        },
      };
    });

    // Aggregate totals
    const totalActions = staffData.reduce((s, r) => s + r.metrics.totalActions, 0);
    const totalTodayActions = staffData.reduce((s, r) => s + r.metrics.todayActions, 0);

    return {
      staff: staffData,
      summary: {
        totalStaff: staffData.length,
        totalActions,
        averageActions: staffData.length > 0 ? Math.round(totalActions / staffData.length) : 0,
        totalTodayActions,
        actionsByType: {
          appointmentsReviewed: staffData.reduce((s, r) => s + r.metrics.appointmentsReviewed, 0),
          bookingsReviewed: staffData.reduce((s, r) => s + r.metrics.bookingsReviewed, 0),
          schedulesCreated: staffData.reduce((s, r) => s + r.metrics.schedulesCreated, 0),
        },
      },
    };
  },

  getEquipmentUtilization: async () => {
    const prisma = require('../lib/prisma');

    // 1. Summary counts by status
    const statuses = ['pending', 'confirmed', 'declined', 'completed', 'cancelled'];
    const [byStatus, totalRevenue, totalEquipment] = await Promise.all([
      Promise.all(
        statuses.map(async (status) => {
          const count = await prisma.equipmentBooking.count({ where: { status } });
          return { status, count };
        })
      ),
      prisma.equipmentBooking.aggregate({
        _sum: { fee: true },
        where: { status: { in: ['confirmed', 'completed'] } },
      }),
      prisma.medicalEquipment.count(),
    ]);
    const total = byStatus.reduce((s, st) => s + st.count, 0);
    const totalCompleted = byStatus.find(s => s.status === 'completed')?.count || 0;
    const bookingRate = totalEquipment > 0 ? Math.round((totalCompleted / totalEquipment) * 100) / 100 : 0;

    // 2. By-equipment breakdown
    const bookingByEquipment = await prisma.equipmentBooking.groupBy({
      by: ['equipmentId'],
      _count: { id: true },
      _sum: { fee: true },
      where: { status: { in: ['confirmed', 'completed'] } },
    });
    const equipment = await prisma.medicalEquipment.findMany({
      select: { id: true, name: true, category: true, isOperational: true },
    });
    const equipMap = Object.fromEntries(equipment.map(e => [e.id, e]));
    const byEquipment = bookingByEquipment.map(g => {
      const eq = equipMap[g.equipmentId];
      return {
        equipmentId: g.equipmentId,
        name: eq?.name || 'Unknown',
        category: eq?.category || 'OTHER',
        isOperational: eq?.isOperational ?? true,
        bookings: g._count.id,
        revenue: g._sum.fee ? Number(g._sum.fee) : 0,
      };
    }).sort((a, b) => b.bookings - a.bookings);
    const totalEquipmentRevenue = byEquipment.reduce((s, e) => s + e.revenue, 0);

    // 3. By-category breakdown
    const catAcc = {};
    for (const e of byEquipment) {
      if (!catAcc[e.category]) catAcc[e.category] = { bookings: 0, revenue: 0, equipmentCount: 0 };
      catAcc[e.category].bookings += e.bookings;
      catAcc[e.category].revenue += e.revenue;
      catAcc[e.category].equipmentCount += 1;
    }
    const byCategory = Object.entries(catAcc)
      .map(([category, data]) => ({ category, ...data }))
      .sort((a, b) => b.bookings - a.bookings);

    // 4. Monthly trend (last 12 months)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
    twelveMonthsAgo.setDate(1);
    twelveMonthsAgo.setHours(0, 0, 0, 0);

    const monthlyRaw = await prisma.$queryRaw`
      SELECT
        DATE_TRUNC('month', booking_date)::date AS month,
        COUNT(*)::int AS bookings,
        COALESCE(SUM(fee), 0)::numeric(10,2) AS revenue
      FROM equipment_bookings
      WHERE booking_date >= ${twelveMonthsAgo}
        AND status IN ('confirmed', 'completed')
      GROUP BY DATE_TRUNC('month', booking_date)
      ORDER BY month ASC
    `;
    const monthlyTrend = [];
    for (let i = 0; i < 12; i++) {
      const d = new Date();
      d.setMonth(d.getMonth() - (11 - i));
      const label = d.toLocaleString('en-US', { timeZone: 'Africa/Nairobi', month: 'short', year: 'numeric' });
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
      const found = (monthlyRaw || []).find(function(r) {
        const rStr = r.month instanceof Date
          ? `${r.month.getFullYear()}-${String(r.month.getMonth() + 1).padStart(2, '0')}-01`
          : String(r.month).substring(0, 10);
        return rStr === key;
      });
      monthlyTrend.push({
        month: label,
        bookings: found ? Number(found.bookings) : 0,
        revenue: found ? Number(found.revenue) : 0,
      });
    }

    return {
      summary: {
        total,
        totalRevenue: totalRevenue._sum.fee ? Number(totalRevenue._sum.fee) : 0,
        totalEquipment,
        completedRate: bookingRate,
        byStatus,
      },
      byEquipment,
      byCategory,
      monthlyTrend,
    };
  },

  listDoctors: async (status) => {
    const prisma = require('../lib/prisma');
    return await prisma.doctorProfile.findMany({
      where: status ? { status } : {},
      include: {
        user: {
          select: { phone: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  },

  updateDoctorStatus: async (doctorId, status, rejectionReason = null) => {
    const prisma = require('../lib/prisma');
    return await prisma.doctorProfile.update({
      where: { id: parseInt(doctorId) },
      data: { 
        status, 
        rejectionReason 
      }
    });
  }
};

module.exports = AdminService;
