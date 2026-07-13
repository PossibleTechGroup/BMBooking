const express = require("express");
const AppointmentController = require("../controllers/appointment.controller");
const authMiddleware = require("../middleware/auth.middleware");
const roleMiddleware = require("../middleware/role.middleware");
const validate = require("../middleware/validation.middleware");
const schemas = require("../config/validation");
const prisma = require("../lib/prisma");
const upload = require("../middleware/upload.middleware");

const router = express.Router();

// ─── Public Routes (no auth needed) ──────────────────────────────
router.get("/categories", AppointmentController.getCategories);
router.get(
  "/recommendations/:category",
  AppointmentController.getRecommendations,
);

// ─── Auth Required ───────────────────────────────────────────────
router.use(authMiddleware);

// ─── Patient Routes ──────────────────────────────────────────────
router.post("/", roleMiddleware(["patient"]), validate(schemas.createAppointment), AppointmentController.create);
router.post(
  "/receptionist",
  roleMiddleware(["receptionist"]),
  validate(schemas.createAppointmentForPatient),
  AppointmentController.createForPatient,
);
router.get(
  "/my",
  roleMiddleware(["patient"]),
  AppointmentController.getMyAppointments,
);
router.post(
  "/upload",
  roleMiddleware(["patient"]),
  upload.single("file"),
  AppointmentController.uploadAttachment,
);
router.patch(
  "/:id/cancel",
  roleMiddleware(["patient"]),
  AppointmentController.cancel,
);
router.patch(
  "/:id/reschedule",
  roleMiddleware(["patient"]),
  AppointmentController.reschedule,
);

// ─── Doctor Routes ───────────────────────────────────────────────
// Middleware to attach doctor profile to request
const attachDoctorProfile = async (req, res, next) => {
  try {
    const doctorProfile = await prisma.doctorProfile.findUnique({
      where: { userId: req.user.id },
    });
    if (!doctorProfile) {
      return res
        .status(403)
        .json({ status: "fail", message: "Doctor profile not found" });
    }
    req.doctorProfile = doctorProfile;
    next();
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

router.get(
  "/doctor",
  roleMiddleware(["doctor"]),
  attachDoctorProfile,
  AppointmentController.getDoctorAppointments,
);
router.get(
  "/doctor/calendar",
  roleMiddleware(["doctor"]),
  attachDoctorProfile,
  AppointmentController.getCalendarData,
);
router.get(
  "/doctor/export",
  roleMiddleware(["doctor"]),
  attachDoctorProfile,
  AppointmentController.getExportData,
);
router.get(
  "/doctor/stats",
  roleMiddleware(["doctor"]),
  attachDoctorProfile,
  AppointmentController.getDoctorStats,
);

router.patch(
  "/:id/accept",
  roleMiddleware(["doctor"]),
  attachDoctorProfile,
  AppointmentController.accept,
);
router.patch(
  "/:id/decline",
  roleMiddleware(["doctor"]),
  attachDoctorProfile,
  AppointmentController.decline,
);
router.patch(
  "/:id/complete",
  roleMiddleware(["doctor"]),
  attachDoctorProfile,
  AppointmentController.complete,
);
router.post(
  "/:id/follow-up",
  roleMiddleware(["doctor"]),
  attachDoctorProfile,
  validate(schemas.createFollowUp),
  AppointmentController.createFollowUp,
);
module.exports = router;
