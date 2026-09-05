const express = require("express");
const receptionistController = require("../controllers/receptionist.controller");
const equipmentBookingController = require("../controllers/equipment-booking.controller");
const authMiddleware = require("../middleware/auth.middleware");
const roleMiddleware = require("../middleware/role.middleware");
const validate = require("../middleware/validation.middleware");
const schemas = require("../config/validation");
const prisma = require("../lib/prisma");
const upload = require("../middleware/upload.middleware");

const router = express.Router();

router.use(authMiddleware);
router.use(roleMiddleware(["receptionist"]));

const attachReceptionistProfile = async (req, res, next) => {
  try {
    const receptionistProfile = await prisma.receptionistProfile.findUnique({
      where: { userId: req.user.id },
      include: { hospital: true },
    });

    if (!receptionistProfile) {
      return res
        .status(403)
        .json({ status: "fail", message: "Receptionist profile not found" });
    }

    req.receptionistProfile = receptionistProfile;
    next();
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

router.use(attachReceptionistProfile);

router.get("/stats/dashboard", receptionistController.getDashboardStats);
router.get("/hospital", receptionistController.getHospital);
router.patch(
  "/hospital/card-price",
  validate(schemas.updateHospitalCardPrice),
  receptionistController.updateHospitalCardPrice,
);

router.get("/patients", receptionistController.searchPatients);
router.get("/patients/directory", receptionistController.listPatients);
router.get("/patients/:id/history", receptionistController.getPatientHistory);
router.post("/patients", validate(schemas.createPatientByReceptionist), receptionistController.createPatient);
router.get("/doctors", receptionistController.getHospitalDoctors);
router.get("/doctors/search", receptionistController.searchAllDoctors);
router.post("/doctors/register", upload.fields([
  { name: 'profilePicture', maxCount: 1 },
  { name: 'introVideo', maxCount: 1 },
]), validate(schemas.registerDoctorByReceptionist), receptionistController.registerDoctor);
router.put("/doctors/:id", receptionistController.updateDoctor);
router.delete("/doctors/:id", receptionistController.removeDoctor);
router.patch(
  "/doctors/:id/review",
  validate(schemas.reviewDoctorByReceptionist),
  receptionistController.reviewDoctor,
);

router.get("/equipment", receptionistController.getHospitalEquipment);
router.post(
  "/equipment",
  upload.single("photo"),
  validate(schemas.createEquipmentByReceptionist),
  receptionistController.addEquipment,
);
router.delete("/equipment/:id", receptionistController.deleteEquipment);

router.get("/schedules", receptionistController.getDoctorSchedules);
router.get("/schedules/:id", receptionistController.getDoctorSchedule);
router.post(
  "/schedules",
  validate(schemas.createSchedule),
  receptionistController.createDoctorSchedule,
);
router.put(
  "/schedules/:id",
  validate(schemas.updateSchedule),
  receptionistController.updateDoctorSchedule,
);
router.delete("/schedules/:id", receptionistController.deleteDoctorSchedule);

router.get("/appointments/upcoming", receptionistController.getUpcomingAppointments);
router.get("/appointments", receptionistController.getAppointments);
router.patch(
  "/appointments/:id/approve",
  validate(schemas.approveAppointment),
  receptionistController.approveAppointment,
);
router.patch(
  "/appointments/:id/deny",
  validate(schemas.receptionistDenyAppointment),
  receptionistController.denyAppointment,
);

router.post(
  "/equipment-bookings",
  validate(schemas.createEquipmentBookingByReceptionist),
  equipmentBookingController.createBookingByReceptionist,
);
router.get("/equipment-bookings", equipmentBookingController.getHospitalBookings);
router.patch(
  "/equipment-bookings/:id/confirm",
  equipmentBookingController.confirmBooking,
);
router.patch(
  "/equipment-bookings/:id/decline",
  validate(schemas.declineEquipmentBooking),
  equipmentBookingController.declineBooking,
);
router.patch(
  "/equipment-bookings/:id/complete",
  equipmentBookingController.completeBooking,
);

router.patch(
  "/equipment/:id/status",
  receptionistController.updateEquipmentStatus,
);
router.patch(
  "/equipment/:id/operating-hours",
  receptionistController.updateEquipmentOperatingHours,
);
router.patch(
  "/equipment/:id",
  validate(schemas.updateEquipment),
  receptionistController.updateEquipment,
);

// ─── Card Template Management ────────────────────────────────────────
router.post(
  "/card-templates",
  validate(schemas.createCardTemplate),
  receptionistController.createCardTemplate,
);
router.get("/card-templates", receptionistController.listCardTemplates);
router.patch(
  "/card-templates/:id",
  validate(schemas.updateCardTemplate),
  receptionistController.updateCardTemplate,
);
router.delete("/card-templates/:id", receptionistController.deleteCardTemplate);

// ─── Patient Card Management ─────────────────────────────────────────
router.post(
  "/cards",
  validate(schemas.issueCard),
  receptionistController.issueCard,
);
router.get("/cards", receptionistController.listCards);
router.get("/cards/:id", receptionistController.getCard);
router.patch(
  "/cards/:id/extend",
  validate(schemas.extendCard),
  receptionistController.extendCard,
);

router.patch(
  "/appointments/reorder",
  validate(schemas.reorderAppointments),
  receptionistController.reorderAppointments,
);

router.patch(
  "/appointments/:id/cancel",
  receptionistController.cancelAppointment,
);
router.patch(
  "/appointments/:id/reschedule",
  validate(schemas.rescheduleAppointment),
  receptionistController.rescheduleAppointment,
);
router.patch(
  "/appointments/:id",
  validate(schemas.updateAppointmentNotes),
  receptionistController.updateAppointmentInfo,
);
router.post(
  "/appointments/:id/follow-up",
  validate(schemas.createFollowUp),
  receptionistController.createFollowUp,
);

router.patch(
  "/equipment-bookings/:id/cancel",
  equipmentBookingController.cancelBookingByReceptionist,
);
router.patch(
  "/equipment-bookings/:id/reschedule",
  validate(schemas.rescheduleEquipmentBooking),
  equipmentBookingController.rescheduleBooking,
);
router.patch(
  "/equipment-bookings/:id/notes",
  validate(schemas.updateEquipmentBookingNotes),
  equipmentBookingController.updateBookingNotes,
);

module.exports = router;
