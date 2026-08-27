const express = require("express");
const HospitalPortalController = require("../controllers/hospital-portal.controller");
const authMiddleware = require("../middleware/auth.middleware");
const hospitalMiddleware = require("../middleware/hospital.middleware");
const upload = require("../middleware/upload.middleware");
const validate = require("../middleware/validation.middleware");
const schemas = require("../config/validation");

const router = express.Router();

// Public
router.post("/register", HospitalPortalController.register);

// Protected (hospital account must be approved by admin)
router.use(authMiddleware);
router.use(hospitalMiddleware);

router.get("/profile", HospitalPortalController.getProfile);
router.patch("/profile", HospitalPortalController.updateProfile);
router.get("/stats", HospitalPortalController.getStats);
router.get("/overview", HospitalPortalController.getOverview);
router.get("/analytics", HospitalPortalController.getAnalytics);
router.get("/appointments", HospitalPortalController.listAppointments);
router.get("/patients", HospitalPortalController.listPatients);

router.get("/services", HospitalPortalController.listServices);
router.post("/services", HospitalPortalController.addService);
router.put("/services", HospitalPortalController.setServices);
router.delete("/services/:id", HospitalPortalController.removeService);
router.patch("/logo", HospitalPortalController.setLogo);
router.patch("/profile/logo", HospitalPortalController.setLogo);

router.post("/doctors/register", upload.fields([
  { name: 'profilePicture', maxCount: 1 },
  { name: 'introVideo', maxCount: 1 },
]), validate(schemas.registerDoctorByReceptionist), HospitalPortalController.registerDoctor);

router.get("/doctors", HospitalPortalController.listDoctors);
router.patch("/doctors/:id/status", HospitalPortalController.updateDoctorStatus);

router.get("/receptionists", HospitalPortalController.listReceptionists);
router.post("/receptionists", HospitalPortalController.createReceptionist);
router.patch("/receptionists/:id", HospitalPortalController.updateReceptionist);
router.delete("/receptionists/:id", HospitalPortalController.deleteReceptionist);

router.get("/card-templates", HospitalPortalController.listCardTemplates);
router.post("/card-templates", HospitalPortalController.createCardTemplate);
router.patch("/card-templates/:id", HospitalPortalController.updateCardTemplate);
router.delete("/card-templates/:id", HospitalPortalController.deleteCardTemplate);

module.exports = router;
