const express = require("express");
const HospitalPortalController = require("../controllers/hospital-portal.controller");
const authMiddleware = require("../middleware/auth.middleware");
const hospitalMiddleware = require("../middleware/hospital.middleware");

const router = express.Router();

// Public
router.post("/register", HospitalPortalController.register);

// Protected (hospital account must be approved by admin)
router.use(authMiddleware);
router.use(hospitalMiddleware);

router.get("/profile", HospitalPortalController.getProfile);
router.patch("/profile", HospitalPortalController.updateProfile);
router.get("/stats", HospitalPortalController.getStats);
router.get("/appointments", HospitalPortalController.listAppointments);

router.get("/doctors", HospitalPortalController.listDoctors);
router.patch("/doctors/:id/status", HospitalPortalController.updateDoctorStatus);

router.get("/receptionists", HospitalPortalController.listReceptionists);
router.post("/receptionists", HospitalPortalController.createReceptionist);
router.patch("/receptionists/:id", HospitalPortalController.updateReceptionist);
router.delete("/receptionists/:id", HospitalPortalController.deleteReceptionist);

module.exports = router;
