const express = require('express');
const HospitalController = require('../controllers/hospital.controller');

const router = express.Router();

router.get('/', HospitalController.listHospitals);

module.exports = router;
