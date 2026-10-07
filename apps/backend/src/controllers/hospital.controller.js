const prisma = require('../lib/prisma');
const { resolveServiceLabel } = require('../config/services.config');
const { publicHospitalWhere } = require('../config/public-visibility');

const haversine = (lat1, lon1, lat2, lon2) => {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;
  const toRad = (x) => (x * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const round1 = (n) => Math.round(n * 10) / 10;

// Effective hospital rating: prefer the hospital's own reviews; fall back to
// the average of its approved doctors' ratings when there are none yet.
const effectiveRating = (hospital) => {
  if (hospital.totalReviews > 0) return hospital.rating;
  if (hospital.doctors && hospital.doctors.length > 0) {
    return round1(
      hospital.doctors.reduce((sum, d) => sum + (d.rating || 0), 0) / hospital.doctors.length,
    );
  }
  return 0;
};

const mapHospital = (h) => ({
  id: h.id,
  name: h.name,
  address: h.address,
  image: h.image,
  description: h.description,
  phone: h.phone,
  latitude: h.latitude,
  longitude: h.longitude,
  cardPrice: h.cardPrice === null ? null : Number(h.cardPrice),
  serviceFee: h.serviceFee ? { amount: Number(h.serviceFee.amount) } : null,
  services: h.services.map((s) => s.name),
  doctorCount: h.doctors ? h.doctors.length : 0,
  rating: effectiveRating(h),
  totalReviews: h.totalReviews || 0,
});

const HospitalController = {
  listHospitals: async (req, res) => {
    try {
      const hospitals = await prisma.hospital.findMany({
        where: publicHospitalWhere,
        select: {
          id: true,
          name: true,
          address: true,
          image: true,
          description: true,
          phone: true,
          latitude: true,
          longitude: true,
          cardPrice: true,
          serviceFee: true,
          rating: true,
          totalReviews: true,
          services: { select: { name: true } },
          doctors: {
            where: { status: 'Approved' },
            select: { id: true, rating: true },
          },
        },
        orderBy: { name: 'asc' },
      });

      const data = hospitals.map(mapHospital);

      res.status(200).json({ status: 'success', data });
    } catch (err) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  },

  searchServices: async (req, res) => {
    try {
      const {
        q,
        service,
        type,
        location,
        availability,
        lat,
        lng,
        radius,
      } = req.query;
      const resolved = service ? resolveServiceLabel(service) : null;
      const term = (q || "").trim().toLowerCase();
      const userLat = lat != null ? parseFloat(lat) : null;
      const userLng = lng != null ? parseFloat(lng) : null;
      const maxRadius = radius != null ? parseFloat(radius) : 50;
      const wantDoctors = type !== "hospital";
      const wantHospitals = type !== "doctor";

      const results = { doctors: [], hospitals: [] };

      // ---- Hospitals ----
      if (wantHospitals) {
        const hospitalWhere = [];
        if (resolved || term) {
          const needle = resolved || term;
          hospitalWhere.push({
            OR: [
              { name: { contains: needle, mode: "insensitive" } },
              { address: { contains: needle, mode: "insensitive" } },
              { services: { some: { name: { contains: needle, mode: "insensitive" } } } },
            ],
          });
        }
        if (location) {
          hospitalWhere.push({ address: { contains: location, mode: "insensitive" } });
        }
        hospitalWhere.push(publicHospitalWhere);
        const hospitals = await prisma.hospital.findMany({
          where: { AND: hospitalWhere },
          select: {
            id: true,
            name: true,
            address: true,
            image: true,
            description: true,
            phone: true,
            latitude: true,
            longitude: true,
            cardPrice: true,
            rating: true,
            totalReviews: true,
            services: { select: { name: true } },
            serviceFee: true,
            doctors: {
              where: { status: "Approved" },
              select: { id: true, rating: true },
            },
          },
          orderBy: { name: "asc" },
        });

        let mapped = hospitals.map((h) => {
          const distanceKm =
            userLat != null && userLng != null
              ? haversine(userLat, userLng, h.latitude, h.longitude)
              : null;
          return {
            ...mapHospital(h),
            distanceKm: distanceKm === null ? null : Math.round(distanceKm * 10) / 10,
          };
        });

        if (userLat != null && userLng != null) {
          mapped = mapped.filter((h) => h.distanceKm == null || h.distanceKm <= maxRadius);
          mapped.sort((a, b) => (a.distanceKm ?? 1e9) - (b.distanceKm ?? 1e9));
        }
        results.hospitals = mapped;
      }

      // ---- Doctors ----
      if (wantDoctors) {
        const needle = resolved || term;
        const drOR = [];
        if (needle) {
          drOR.push(
            { fullName: { contains: needle, mode: "insensitive" } },
            { specialization: { contains: needle, mode: "insensitive" } },
            { clinicName: { contains: needle, mode: "insensitive" } },
          );
        }

        const doctorWhere = { status: "Approved" };
        if (needle) {
          doctorWhere.OR = drOR;
        }
        if (location) {
          doctorWhere.AND = [
            { OR: [
              { hospital: { address: { contains: location, mode: "insensitive" } } },
              { clinicAddress: { contains: location, mode: "insensitive" } },
            ] },
          ];
        }

        const doctors = await prisma.doctorProfile.findMany({
          where: doctorWhere,
          include: {
            hospital: {
              select: {
                id: true,
                name: true,
                address: true,
                image: true,
                latitude: true,
                longitude: true,
              },
            },
            schedules: {
              where: {
                isActive: true,
                // dates stored as UTC midnight of the civil date; `new Date()`
                // (an instant) excluded today's schedule for most of the day
                date: {
                  gte: new Date(
                    `${new Date().toISOString().slice(0, 10)}T00:00:00.000Z`
                  ),
                },
              },
              select: { id: true, date: true },
              orderBy: { date: "asc" },
            },
          },
          orderBy: { rating: "desc" },
        });

        let mappedDoctors = doctors.map((d) => {
          const distanceKm =
            userLat != null && userLng != null && d.hospital
              ? haversine(userLat, userLng, d.hospital.latitude, d.hospital.longitude)
              : null;
          return {
            id: d.id,
            fullName: d.fullName,
            profilePicture: d.profilePicture,
            specialization: d.specialization,
            specializations: d.specializations || [],
            clinicName: d.clinicName,
            clinicAddress: d.clinicAddress,
            experienceYears: d.experienceYears,
            rating: d.rating,
            totalReviews: d.totalReviews,
            baseHourlyRate: d.baseHourlyRate === null ? null : Number(d.baseHourlyRate),
            availability: d.schedules.length > 0,
            nextAvailable: d.schedules.length ? d.schedules[0].date : null,
            hospital: d.hospital
              ? {
                  id: d.hospital.id,
                  name: d.hospital.name,
                  address: d.hospital.address,
                  image: d.hospital.image,
                }
              : null,
            distanceKm: distanceKm === null ? null : Math.round(distanceKm * 10) / 10,
          };
        });

        if (availability === "true") {
          mappedDoctors = mappedDoctors.filter((d) => d.availability);
        }
        if (userLat != null && userLng != null) {
          mappedDoctors = mappedDoctors.filter((d) => d.distanceKm == null || d.distanceKm <= maxRadius);
          mappedDoctors.sort((a, b) => (a.distanceKm ?? 1e9) - (b.distanceKm ?? 1e9));
        }
        results.doctors = mappedDoctors;
      }

      res.status(200).json({ status: "success", data: results });
    } catch (err) {
      res.status(500).json({ status: "error", message: err.message });
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

      const hospital = await prisma.hospital.findFirst({
        where: { id, ...publicHospitalWhere },
        select: {
          id: true,
          name: true,
          address: true,
          image: true,
          description: true,
          phone: true,
          email: true,
          latitude: true,
          longitude: true,
          cardPrice: true,
          serviceFee: true,
          rating: true,
          totalReviews: true,
          services: { select: { name: true } },
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
          reviews: {
            include: {
              patient: {
                select: {
                  id: true,
                  patientProfile: { select: { fullName: true } },
                },
              },
            },
            orderBy: { createdAt: 'desc' },
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
          ...mapHospital(hospital),
          email: hospital.email,
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
          reviews: (hospital.reviews || []).map((r) => ({
            id: r.id,
            rating: r.rating,
            comment: r.comment,
            createdAt: r.createdAt,
            patientName:
              r.patient?.patientProfile?.fullName || `Patient ${r.patient?.id || ''}`,
          })),
        },
      });
    } catch (err) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  },
};

module.exports = HospitalController;
