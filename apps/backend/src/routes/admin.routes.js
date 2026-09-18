const express = require('express');
const AdminController = require('../controllers/admin.controller');
const AdminEquipmentController = require('../controllers/admin.equipment.controller');
const AdminHospitalController = require('../controllers/admin.hospital.controller');
const AnnouncementController = require('../controllers/announcement.controller');
const HospitalApplicationController = require('../controllers/hospital-application.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');
const validate = require('../middleware/validation.middleware');
const schemas = require('../config/validation');
const generalUpload = require('../middleware/upload.middleware');

const router = express.Router();

// Public Admin Routes
router.post('/login', AdminController.login);

// Protected Admin Routes (Requires existing Admin token)
router.use(authMiddleware);
router.use(roleMiddleware(['admin']));

// Hospital Applications Management
router.get('/hospital-applications', HospitalApplicationController.listApplications);
router.patch('/hospital-applications/:id', HospitalApplicationController.updateApplicationStatus);

const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: 'uploads/receipts/',
  filename: (req, file, cb) => {
    cb(null, `receipt-${Date.now()}${path.extname(file.originalname)}`);
  }
});
const upload = multer({ storage });

const parseJSONFields = (req, res, next) => {
  for (const key of ["operatingHours", "price"]) {
    if (typeof req.body[key] === "string") {
      try { req.body[key] = JSON.parse(req.body[key]); }
      catch { /* Joi validation will reject it */ }
    }
  }
  next();
};

router.post('/create', AdminController.createAdmin);
router.get('/doctors', AdminController.getAllDoctors);
router.get('/doctors/pending', AdminController.getPendingDoctors);
router.get('/doctors/:id', AdminController.getDoctorDetail);
router.post('/doctors', generalUpload.single('profilePicture'), AdminController.createDoctor);
router.post('/doctors/review', AdminController.reviewDoctor);
router.post('/doctors/schedules', AdminController.createDoctorSchedule);
router.get('/doctors/:id/schedules', AdminController.getDoctorSchedules);
router.delete('/doctors/schedules/:id', AdminController.deleteDoctorSchedule);
router.put('/doctors/:id', generalUpload.single('profilePicture'), AdminController.updateDoctor);
router.delete('/doctors/:id', AdminController.deleteDoctor);

// Withdrawal Management
router.get('/withdrawals', AdminController.getWithdrawalRequests);
router.post('/withdrawals/:id/complete', upload.single('receipt'), AdminController.completeWithdrawal);

// Doctor-Hospital Assignment
router.put('/doctors/:id/assign-hospital', validate(schemas.assignDoctorHospital), AdminHospitalController.assignDoctorToHospital);
router.get('/hospitals/:id/doctors', AdminHospitalController.listHospitalDoctors);

// Doctor Fee Management
router.put('/doctors/:id/fee', validate(schemas.updateDoctorFee), AdminController.updateDoctorFee);

// Patients & Analytics
router.get('/patients', AdminController.getAllPatients);
router.get('/patients/:id/history', AdminController.getPatientHistory);
router.get('/stats/summary', AdminController.getSystemStats);
router.get('/stats/patient-growth', AdminController.getPatientGrowth);
router.get('/stats/active-patients', AdminController.getActivePatients);
router.get('/stats/appointments', AdminController.getAppointmentStats);
router.get('/stats/staff-performance', AdminController.getStaffPerformance);
router.get('/stats/equipment-utilization', AdminController.getEquipmentUtilization);
router.get('/analytics', AdminController.getAnalytics);

// Hospitals & Receptionists
router.get('/hospitals', AdminHospitalController.listHospitals);
router.get('/hospital-registrations', AdminHospitalController.listHospitalRegistrations);
router.patch('/hospital-registrations/:id', AdminHospitalController.updateHospitalRegistrationStatus);
router.post('/hospitals', generalUpload.single('image'), validate(schemas.createHospital), AdminHospitalController.createHospital);
router.put('/hospitals/:id', generalUpload.single('image'), validate(schemas.updateHospital), AdminHospitalController.updateHospital);
router.delete('/hospitals/:id', AdminHospitalController.deleteHospital);
router.put('/hospitals/:id/service-fee', validate(schemas.setServiceFee), AdminHospitalController.setServiceFee);
router.get('/receptionists', AdminHospitalController.listReceptionists);
router.post('/receptionists', validate(schemas.createReceptionist), AdminHospitalController.createReceptionist);
router.put('/receptionists/:id', validate(schemas.updateReceptionist), AdminHospitalController.updateReceptionist);
router.delete('/receptionists/:id', AdminHospitalController.deleteReceptionist);

// Item Management (Medical Equipment)
router.post('/equipment', upload.single('photo'), parseJSONFields, validate(schemas.createEquipment), AdminEquipmentController.addItem);
router.post('/equipment/bulk', parseJSONFields, AdminEquipmentController.addItems);
router.put('/equipment/:id', upload.single('photo'), parseJSONFields, validate(schemas.updateEquipment), AdminEquipmentController.updateItem);
router.delete('/equipment/:id', AdminEquipmentController.deleteItem);
router.post('/equipment/announce', AdminEquipmentController.createAnnouncement);

// Equipment Bookings (Admin overview across all hospitals)
router.get('/equipment-bookings', AdminController.getAllEquipmentBookings);

// Announcement Management
router.get('/announcements', AnnouncementController.getAll);
router.post('/announcements', AnnouncementController.create);
router.get('/announcements/:id', AnnouncementController.getById);
router.put('/announcements/:id', AnnouncementController.update);
router.delete('/announcements/:id', AnnouncementController.delete);
router.patch('/announcements/:id/publish', AnnouncementController.publish);
router.post('/announcements/:id/resend', AnnouncementController.resend);

module.exports = router;
