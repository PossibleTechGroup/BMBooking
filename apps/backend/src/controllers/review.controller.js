const prisma = require('../lib/prisma');

const ReviewController = {
  addReview: async (req, res) => {
    try {
      const { doctorId, rating, comment, appointmentId } = req.body;
      const patientId = req.user.id;

      if (!doctorId || !rating) {
        return res.status(400).json({ status: 'fail', message: 'Doctor ID and rating are required' });
      }

      const parsedDoctorId = parseInt(doctorId);

      let parsedAppointmentId = appointmentId ? parseInt(appointmentId) : null;

      if (!parsedAppointmentId) {
        const latest = await prisma.appointment.findFirst({
          where: {
            patientId,
            doctorId: parsedDoctorId,
            status: 'completed',
          },
          orderBy: { dateTime: 'desc' },
        });
        if (!latest) {
          return res.status(403).json({
            status: 'fail',
            message: 'You can only review a doctor after completing an appointment with them.',
          });
        }
        parsedAppointmentId = latest.id;
      }

      const appointment = await prisma.appointment.findUnique({
        where: { id: parsedAppointmentId },
      });

      if (!appointment || appointment.patientId !== patientId || appointment.doctorId !== parsedDoctorId) {
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

      const existing = await prisma.review.findUnique({
        where: { appointmentId: parsedAppointmentId },
      });

      let review;
      if (existing) {
        review = await prisma.review.update({
          where: { id: existing.id },
          data: {
            rating: parseInt(rating),
            comment,
          },
        });
      } else {
        review = await prisma.review.create({
          data: {
            patientId,
            doctorId: parsedDoctorId,
            appointmentId: parsedAppointmentId,
            rating: parseInt(rating),
            comment,
          },
        });
      }

      const allReviews = await prisma.review.findMany({
        where: { doctorId: parsedDoctorId },
        select: { rating: true },
      });

      const totalReviews = allReviews.length;
      const averageRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews;

      await prisma.doctorProfile.update({
        where: { id: parsedDoctorId },
        data: {
          rating: averageRating,
          totalReviews: totalReviews,
        },
      });

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
};

module.exports = ReviewController;
