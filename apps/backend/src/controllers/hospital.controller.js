const prisma = require('../lib/prisma');

const HospitalController = {
  listHospitals: async (req, res) => {
    try {
      const hospitals = await prisma.hospital.findMany({
        select: {
          id: true,
          name: true,
          address: true,
          image: true,
          phone: true,
          latitude: true,
          longitude: true,
          cardPrice: true,
          serviceFee: true,
          doctors: {
            where: { status: 'Approved' },
            select: { id: true, rating: true },
          },
        },
        orderBy: { name: 'asc' },
      });

      const data = hospitals.map((h) => ({
        id: h.id,
        name: h.name,
        address: h.address,
        image: h.image,
        phone: h.phone,
        latitude: h.latitude,
        longitude: h.longitude,
        cardPrice: h.cardPrice === null ? null : Number(h.cardPrice),
        serviceFee: h.serviceFee ? { amount: Number(h.serviceFee.amount) } : null,
        doctorCount: h.doctors.length,
        rating:
          h.doctors.length > 0
            ? Math.round(
                (h.doctors.reduce((sum, d) => sum + (d.rating || 0), 0) /
                  h.doctors.length) *
                  10,
              ) / 10
            : 0,
      }));

      res.status(200).json({ status: 'success', data });
    } catch (err) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  },

  getHospitalById: async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res
          .status(400)
          .json({ status: 'fail', message: 'Invalid hospital id' });
      }

      const hospital = await prisma.hospital.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          address: true,
          image: true,
          phone: true,
          email: true,
          latitude: true,
          longitude: true,
          cardPrice: true,
          serviceFee: true,
          doctors: {
            where: { status: 'Approved' },
            select: {
              id: true,
              fullName: true,
              profilePicture: true,
              specialization: true,
              specializations: true,
              bio: true,
              experienceYears: true,
              rating: true,
              totalReviews: true,
              clinicName: true,
              clinicAddress: true,
              baseHourlyRate: true,
            },
            orderBy: { rating: 'desc' },
          },
        },
      });

      if (!hospital) {
        return res
          .status(404)
          .json({ status: 'fail', message: 'Hospital not found' });
      }

      res.status(200).json({
        status: 'success',
        data: {
          id: hospital.id,
          name: hospital.name,
          address: hospital.address,
          image: hospital.image,
          phone: hospital.phone,
          email: hospital.email,
          latitude: hospital.latitude,
          longitude: hospital.longitude,
          cardPrice:
            hospital.cardPrice === null ? null : Number(hospital.cardPrice),
          serviceFee: hospital.serviceFee
            ? { amount: Number(hospital.serviceFee.amount) }
            : null,
          doctors: hospital.doctors.map((d) => ({
            id: d.id,
            fullName: d.fullName,
            profilePicture: d.profilePicture,
            specialization: d.specialization,
            specializations: d.specializations || [],
            bio: d.bio,
            experienceYears: d.experienceYears,
            rating: d.rating,
            totalReviews: d.totalReviews,
            clinicName: d.clinicName,
            clinicAddress: d.clinicAddress,
            baseHourlyRate:
              d.baseHourlyRate === null ? null : Number(d.baseHourlyRate),
          })),
        },
      });
    } catch (err) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  },
};

module.exports = HospitalController;
