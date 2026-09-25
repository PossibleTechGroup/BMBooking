const express = require('express');
const PatientController = require('../controllers/patient.controller');
const authMiddleware = require('../middleware/auth.middleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/profile', PatientController.getProfile);
router.post('/profile', PatientController.setupProfile);
router.post('/check-phone', PatientController.checkPhone);
router.delete('/account', PatientController.deleteAccount);

module.exports = router;
