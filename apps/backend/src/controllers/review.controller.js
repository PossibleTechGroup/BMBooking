const prisma = require('../lib/prisma');

const MAX_RATING = 5;

const round1 = (n) => Math.round(n * 10) / 10;

const ReviewController = {
  addReview: async (req, res) => {
    try {
      const { doctorId, hospitalId, rating, comment, appointmentId } = req.body;
      const patientId = req.user.id;

      const targetDoctor = doctorId ? parseInt(doctorId) : null;
      const targetHospital = hospitalId ? parseInt(hospitalId) : null;

      if (!targetDoctor && !targetHospital) {
        return res
          .status(400)
          .json({ status: 'fail', message: 'Doctor ID or Hospital ID is required' });
      }
      if (!rating) {
        return res.status(400).json({ status: 'fail', message: 'Rating is required' });
      }
      const parsedRating = parseInt(rating);
      if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > MAX_RATING) {
        return res.status(400).json({ status: 'fail', message: 'Rating must be between 1 and 5' });
      }

      let parsedAppointmentId = appointmentId ? parseInt(appointmentId) : null;

      if (!parsedAppointmentId) {
        const latest = await prisma.appointment.findFirst({
          where: {
            patientId,
            ...(targetDoctor ? { doctorId: targetDoctor } : { doctor: { hospitalId: targetHospital } }),
            status: 'completed',
          },
          orderBy: { dateTime: 'desc' },
        });
        if (!latest) {
          return res.status(403).json({
            status: 'fail',
            message:
              targetDoctor
                ? 'You can only review a doctor after completing an appointment with them.'
                : 'You can only review a hospital after completing an appointment there.',
          });
        }
        parsedAppointmentId = latest.id;
      }

      const appointment = await prisma.appointment.findUnique({
        where: { id: parsedAppointmentId },
        include: { doctor: { select: { hospitalId: true } } },
      });

      if (!appointment || appointment.patientId !== patientId) {
        return res.status(403).json({
          status: 'fail',
          message: 'You can only review a completed appointment that belongs to you.',
        });
      }

      if (appointment.status !== 'completed') {
        return res.status(403).json({
          status: 'fail',
          message: 'You can only review a completed appointment.',
        });
      }

      // Validate the review target matches the appointment
      if (targetDoctor && appointment.doctorId !== targetDoctor) {
        return res.status(403).json({
          status: 'fail',
          message: 'This appointment was not with that doctor.',
        });
      }
      if (targetHospital) {
        const hospital = await prisma.hospital.findUnique({
          where: { id: targetHospital },
          select: { id: true },
        });
        if (!hospital) {
          return res.status(404).json({ status: 'fail', message: 'Hospital not found' });
        }
        if (!appointment.doctor?.hospitalId || appointment.doctor.hospitalId !== targetHospital) {
          return res.status(403).json({
            status: 'fail',
            message: 'This appointment was not at that hospital.',
          });
        }
      }

      const existing = await prisma.review.findFirst({
        where: {
          appointmentId: parsedAppointmentId,
          ...(targetDoctor ? { doctorId: targetDoctor } : {}),
          ...(targetHospital ? { hospitalId: targetHospital } : {}),
        },
      });

      let review;
      if (existing) {
        review = await prisma.review.update({
          where: { id: existing.id },
          data: {
            rating: parsedRating,
            comment,
          },
        });
      } else {
        review = await prisma.review.create({
          data: {
            patientId,
            doctorId: targetDoctor,
            hospitalId: targetHospital,
            appointmentId: parsedAppointmentId,
            rating: parsedRating,
            comment,
          },
        });
      }

      if (targetDoctor) {
        const allReviews = await prisma.review.findMany({
          where: { doctorId: targetDoctor },
          select: { rating: true },
        });
        const totalReviews = allReviews.length;
        const averageRating =
          totalReviews > 0
            ? round1(allReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews)
            : 0;

        await prisma.doctorProfile.update({
          where: { id: targetDoctor },
          data: {
            rating: averageRating,
            totalReviews: totalReviews,
          },
        });
      }

      if (targetHospital) {
        const allReviews = await prisma.review.findMany({
          where: { hospitalId: targetHospital },
          select: { rating: true },
        });
        const totalReviews = allReviews.length;
        const averageRating =
          totalReviews > 0
            ? round1(allReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews)
            : 0;

        await prisma.hospital.update({
          where: { id: targetHospital },
          data: {
            rating: averageRating,
            totalReviews: totalReviews,
          },
        });
      }

      res.status(existing ? 200 : 201).json({ status: 'success', data: review });
    } catch (err) {
      console.error('❌ [REVIEW] Error:', err.message);
      res.status(500).json({ status: 'error', message: err.message });
    }
  },

  getDoctorReviews: async (req, res) => {
    try {
      const { id } = req.params;
      const reviews = await prisma.review.findMany({
        where: { doctorId: parseInt(id) },
        include: {
          patient: {
            select: {
              id: true,
              patientProfile: {
                select: { fullName: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      res.status(200).json({ status: 'success', data: reviews });
    } catch (err) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  },

  getHospitalReviews: async (req, res) => {
    try {
      const { id } = req.params;
      const hospital = await prisma.hospital.findUnique({
        where: { id: parseInt(id) },
        select: { id: true },
      });
      if (!hospital) {
        return res.status(404).json({ status: 'fail', message: 'Hospital not found' });
      }

      const reviews = await prisma.review.findMany({
        where: { hospitalId: parseInt(id) },
        include: {
          patient: {
            select: {
              id: true,
              patientProfile: {
                select: { fullName: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      res.status(200).json({ status: 'success', data: reviews });
    } catch (err) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  },
};

module.exports = ReviewController;
