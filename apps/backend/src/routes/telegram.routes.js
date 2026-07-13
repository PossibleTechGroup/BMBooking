const express = require('express');
const TelegramController = require('../controllers/telegram.controller');

const router = express.Router();

router.post('/verify', TelegramController.verify);

module.exports = router;

