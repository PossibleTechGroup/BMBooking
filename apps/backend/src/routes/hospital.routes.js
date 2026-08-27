const express = require('express');
const HospitalController = require('../controllers/hospital.controller');

const router = express.Router();

router.get('/', HospitalController.listHospitals);
router.get('/:id', HospitalController.getHospitalById);

module.exports = router;
