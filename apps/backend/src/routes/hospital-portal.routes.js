const express = require("express");
const HospitalPortalController = require("../controllers/hospital-portal.controller");
const receptionistController = require("../controllers/receptionist.controller");
const equipmentBookingController = require("../controllers/equipment-booking.controller");
const authMiddleware = require("../middleware/auth.middleware");
const hospitalAccessMiddleware = require("../middleware/hospital-access.middleware");
const permissionMiddleware = require("../middleware/permission.middleware");
const ownerOnlyMiddleware = require("../middleware/owner-only.middleware");
const upload = require("../middleware/upload.middleware");
const validate = require("../middleware/validation.middleware");
const schemas = require("../config/validation");

const router = express.Router();

// Public
router.post("/register", HospitalPortalController.register);

// Unified portal for both owners (role 'hospital') and staff (role 'receptionist').
// Staff access is gated per-route by permissionMiddleware.
router.use(authMiddleware);
router.use(hospitalAccessMiddleware);

// ─── Context ────────────────────────────────────────────────────────
router.get("/me", HospitalPortalController.getMe);

// ─── Profile & Settings ──────────────────────────────────────────────
router.get("/profile", permissionMiddleware("settings.view"), HospitalPortalController.getProfile);
router.patch("/profile", permissionMiddleware("settings.edit"), HospitalPortalController.updateProfile);
router.get("/hospital", permissionMiddleware("settings.view"), receptionistController.getHospital);
router.patch("/hospital/card-price", permissionMiddleware("settings.edit"), validate(schemas.updateHospitalCardPrice), receptionistController.updateHospitalCardPrice);
router.patch("/logo", permissionMiddleware("settings.edit"), HospitalPortalController.setLogo);
router.patch("/profile/logo", permissionMiddleware("settings.edit"), HospitalPortalController.setLogo);

router.get("/services", permissionMiddleware("settings.view"), HospitalPortalController.listServices);
router.post("/services", permissionMiddleware("settings.edit"), HospitalPortalController.addService);
router.put("/services", permissionMiddleware("settings.edit"), HospitalPortalController.setServices);
router.delete("/services/:id", permissionMiddleware("settings.edit"), HospitalPortalController.removeService);

// ─── Stats & Analytics ───────────────────────────────────────────────
router.get("/stats", permissionMiddleware("analytics.view"), HospitalPortalController.getStats);
router.get("/overview", permissionMiddleware("analytics.view"), HospitalPortalController.getOverview);
router.get("/analytics", permissionMiddleware("analytics.view"), HospitalPortalController.getAnalytics);
router.get("/stats/dashboard", permissionMiddleware("analytics.view"), receptionistController.getDashboardStats);

// ─── Patients ────────────────────────────────────────────────────────
router.get("/patients", permissionMiddleware("patients.view"), HospitalPortalController.listPatients);
router.get("/patients/directory", permissionMiddleware("patients.view"), receptionistController.listPatients);
router.get("/patients/:id/history", permissionMiddleware("patients.history"), HospitalPortalController.getPatientHistory);
router.post("/patients", permissionMiddleware("patients.create"), validate(schemas.createPatientByReceptionist), receptionistController.createPatient);

// ─── Appointments ────────────────────────────────────────────────────
router.get("/appointments", permissionMiddleware("appointments.view"), HospitalPortalController.listAppointments);
router.get("/appointments/upcoming", permissionMiddleware("appointments.view"), receptionistController.getUpcomingAppointments);
router.patch("/appointments/reorder", permissionMiddleware("appointments.reschedule"), validate(schemas.reorderAppointments), receptionistController.reorderAppointments);
router.patch("/appointments/:id/approve", permissionMiddleware("appointments.approve"), validate(schemas.approveAppointment), receptionistController.approveAppointment);
router.patch("/appointments/:id/deny", permissionMiddleware("appointments.approve"), validate(schemas.receptionistDenyAppointment), receptionistController.denyAppointment);
router.patch("/appointments/:id/cancel", permissionMiddleware("appointments.cancel"), receptionistController.cancelAppointment);
router.patch("/appointments/:id/reschedule", permissionMiddleware("appointments.reschedule"), validate(schemas.rescheduleAppointment), receptionistController.rescheduleAppointment);
router.patch("/appointments/:id", permissionMiddleware("appointments.create"), validate(schemas.updateAppointmentNotes), receptionistController.updateAppointmentInfo);
router.post("/appointments/:id/follow-up", permissionMiddleware("appointments.create"), validate(schemas.createFollowUp), receptionistController.createFollowUp);

// ─── Doctors ─────────────────────────────────────────────────────────
router.get("/doctors", permissionMiddleware("doctors.view"), HospitalPortalController.listDoctors);
router.get("/doctors/search", permissionMiddleware("doctors.view"), receptionistController.searchAllDoctors);
router.post("/doctors/register", permissionMiddleware("doctors.register"), upload.fields([
  { name: 'profilePicture', maxCount: 1 },
  { name: 'introVideo', maxCount: 1 },
]), validate(schemas.registerDoctorByReceptionist), HospitalPortalController.registerDoctor);
router.put("/doctors/:id", permissionMiddleware("doctors.manage"), receptionistController.updateDoctor);
router.delete("/doctors/:id", permissionMiddleware("doctors.manage"), receptionistController.removeDoctor);
router.patch("/doctors/:id/status", permissionMiddleware("doctors.manage"), HospitalPortalController.updateDoctorStatus);
router.patch("/doctors/:id/review", permissionMiddleware("doctors.manage"), validate(schemas.reviewDoctorByReceptionist), receptionistController.reviewDoctor);

// ─── Schedules ───────────────────────────────────────────────────────
router.get("/schedules", permissionMiddleware("schedules.view"), receptionistController.getDoctorSchedules);
router.get("/schedules/:id", permissionMiddleware("schedules.view"), receptionistController.getDoctorSchedule);
router.post("/schedules", permissionMiddleware("schedules.manage"), validate(schemas.createSchedule), receptionistController.createDoctorSchedule);
router.put("/schedules/:id", permissionMiddleware("schedules.manage"), validate(schemas.updateSchedule), receptionistController.updateDoctorSchedule);
router.delete("/schedules/:id", permissionMiddleware("schedules.manage"), receptionistController.deleteDoctorSchedule);

// ─── Equipment ───────────────────────────────────────────────────────
router.get("/equipment", permissionMiddleware("equipment.view"), receptionistController.getHospitalEquipment);
router.post("/equipment", permissionMiddleware("equipment.manage"), upload.single("photo"), validate(schemas.createEquipmentByReceptionist), receptionistController.addEquipment);
router.delete("/equipment/:id", permissionMiddleware("equipment.manage"), receptionistController.deleteEquipment);
router.patch("/equipment/:id/status", permissionMiddleware("equipment.manage"), receptionistController.updateEquipmentStatus);
router.patch("/equipment/:id/operating-hours", permissionMiddleware("equipment.manage"), receptionistController.updateEquipmentOperatingHours);
router.patch("/equipment/:id", permissionMiddleware("equipment.manage"), validate(schemas.updateEquipment), receptionistController.updateEquipment);

// ─── Equipment Bookings ──────────────────────────────────────────────
router.get("/equipment-bookings", permissionMiddleware("equipment.bookings"), equipmentBookingController.getHospitalBookings);
router.post("/equipment-bookings", permissionMiddleware("equipment.bookings"), validate(schemas.createEquipmentBookingByReceptionist), equipmentBookingController.createBookingByReceptionist);
router.patch("/equipment-bookings/:id/confirm", permissionMiddleware("equipment.bookings"), equipmentBookingController.confirmBooking);
router.patch("/equipment-bookings/:id/decline", permissionMiddleware("equipment.bookings"), validate(schemas.declineEquipmentBooking), equipmentBookingController.declineBooking);
router.patch("/equipment-bookings/:id/complete", permissionMiddleware("equipment.bookings"), equipmentBookingController.completeBooking);
router.patch("/equipment-bookings/:id/cancel", permissionMiddleware("equipment.bookings"), equipmentBookingController.cancelBookingByReceptionist);
router.patch("/equipment-bookings/:id/reschedule", permissionMiddleware("equipment.bookings"), validate(schemas.rescheduleEquipmentBooking), equipmentBookingController.rescheduleBooking);
router.patch("/equipment-bookings/:id/notes", permissionMiddleware("equipment.bookings"), validate(schemas.updateEquipmentBookingNotes), equipmentBookingController.updateBookingNotes);

// ─── Card Templates ──────────────────────────────────────────────────
router.get("/card-templates", permissionMiddleware("settings.view"), HospitalPortalController.listCardTemplates);
router.post("/card-templates", permissionMiddleware("settings.edit"), HospitalPortalController.createCardTemplate);
router.patch("/card-templates/:id", permissionMiddleware("settings.edit"), HospitalPortalController.updateCardTemplate);
router.delete("/card-templates/:id", permissionMiddleware("settings.edit"), HospitalPortalController.deleteCardTemplate);

// ─── Patient Cards ───────────────────────────────────────────────────
router.post("/cards", permissionMiddleware("patients.create"), validate(schemas.issueCard), receptionistController.issueCard);
router.get("/cards", permissionMiddleware("patients.view"), receptionistController.listCards);
router.get("/cards/:id", permissionMiddleware("patients.view"), receptionistController.getCard);
router.patch("/cards/:id/extend", permissionMiddleware("patients.create"), validate(schemas.extendCard), receptionistController.extendCard);

// ─── Staff Management (owner only) ──────────────────────────────────
router.get("/staff", ownerOnlyMiddleware, permissionMiddleware("staff.manage"), HospitalPortalController.listReceptionists);
router.post("/staff", ownerOnlyMiddleware, permissionMiddleware("staff.manage"), validate(schemas.createReceptionist), HospitalPortalController.createReceptionist);
router.patch("/staff/:id", ownerOnlyMiddleware, permissionMiddleware("staff.manage"), validate(schemas.updateReceptionist), HospitalPortalController.updateReceptionist);
router.delete("/staff/:id", ownerOnlyMiddleware, permissionMiddleware("staff.manage"), HospitalPortalController.deleteReceptionist);

// Legacy aliases kept for compatibility
router.get("/receptionists", ownerOnlyMiddleware, permissionMiddleware("staff.manage"), HospitalPortalController.listReceptionists);
router.post("/receptionists", ownerOnlyMiddleware, permissionMiddleware("staff.manage"), validate(schemas.createReceptionist), HospitalPortalController.createReceptionist);
router.patch("/receptionists/:id", ownerOnlyMiddleware, permissionMiddleware("staff.manage"), validate(schemas.updateReceptionist), HospitalPortalController.updateReceptionist);
router.delete("/receptionists/:id", ownerOnlyMiddleware, permissionMiddleware("staff.manage"), HospitalPortalController.deleteReceptionist);

module.exports = router;