const express = require('express');
const HospitalApplicationController = require('../controllers/hospital-application.controller');

const router = express.Router();

router.post('/', HospitalApplicationController.createApplication);

module.exports = router;
