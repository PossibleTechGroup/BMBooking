const prisma = require('../lib/prisma');
const { resolveServiceLabel } = require('../config/services.config');

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
          services: { select: { name: true } },
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
        services: h.services.map((s) => s.name),
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
        const hospitals = await prisma.hospital.findMany({
          where: hospitalWhere.length ? { AND: hospitalWhere, OR: undefined } : undefined,
          select: {
            id: true,
            name: true,
            address: true,
            image: true,
            phone: true,
            latitude: true,
            longitude: true,
            cardPrice: true,
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
            id: h.id,
            name: h.name,
            address: h.address,
            image: h.image,
            phone: h.phone,
            latitude: h.latitude,
            longitude: h.longitude,
            cardPrice: h.cardPrice === null ? null : Number(h.cardPrice),
            serviceFee: h.serviceFee ? { amount: Number(h.serviceFee.amount) } : null,
            services: h.services.map((s) => s.name),
            distanceKm: distanceKm === null ? null : Math.round(distanceKm * 10) / 10,
            doctorCount: h.doctors.length,
            rating:
              h.doctors.length > 0
                ? Math.round((h.doctors.reduce((s, d) => s + (d.rating || 0), 0) / h.doctors.length) * 10) / 10
                : 0,
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
              where: { isActive: true, date: { gte: new Date() } },
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
          services: hospital.services.map((s) => s.name),
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
