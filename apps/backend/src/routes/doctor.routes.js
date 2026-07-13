const express = require('express');
const DoctorController = require('../controllers/doctor.controller');
const authMiddleware = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');
const validate = require('../middleware/validation.middleware');
const schemas = require('../config/validation');

const router = express.Router();

// Public routes (accessible by patients and guests)
router.get('/all', DoctorController.getAllDoctors);
router.get('/search', DoctorController.search);
router.get('/:id/schedules', DoctorController.getDoctorSchedules);

router.use(authMiddleware);

router.get('/profile', DoctorController.getProfile);
const handleUploadError = (err, res) => {
  const maxSizeMb = 50;

  if (err?.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      status: 'fail',
      message: `File is too large. Each upload must be ${maxSizeMb}MB or smaller.`
    });
  }

  console.warn('⚠️ [UPLOAD] Error:', err?.message || err);
  return res.status(400).json({ status: 'fail', message: `Upload Error: ${err?.message || 'Invalid file upload.'}` });
};

router.put('/profile', 
  (req, res, next) => {
    upload.fields([
      { name: 'profilePicture', maxCount: 1 },
      { name: 'introVideo', maxCount: 1 }
    ])(req, res, (err) => {
      if (err) return handleUploadError(err, res);
      next();
    });
  },
  DoctorController.updateProfile
);
router.put('/availability', validate(schemas.updateAvailability), DoctorController.updateAvailability);
router.post('/schedules', validate(schemas.createSelfSchedule), DoctorController.createDoctorSchedule);

router.post('/profile', 
  (req, res, next) => {
    upload.fields([
      { name: 'profilePicture', maxCount: 1 },
      { name: 'introVideo', maxCount: 1 }
    ])(req, res, (err) => {
      if (err) return handleUploadError(err, res);
      next();
    });
  },
  validate(schemas.doctorProfile), 
  DoctorController.setupProfile
);

module.exports = router;
