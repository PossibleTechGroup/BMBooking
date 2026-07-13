const express = require('express');
const router = express.Router();
const PaymentController = require('../controllers/payment.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Initialize payment (Requires auth)
router.post('/initialize', authMiddleware, PaymentController.initialize);

// Verify payment (Public or Auth)
router.get('/verify/:txRef', PaymentController.verify);

// Success redirect page (Public)
router.get('/success-redirect', PaymentController.successRedirect);

// Webhook (Public, called by Chapa)
router.post('/webhook', PaymentController.webhook);

// Webhook from telebirr-h5-integration (port 8080)
router.post('/telebirr-notify', PaymentController.telebirrNotify);

// Verify Telebirr payment by amount (order id stays on checkout page)
router.post('/verify-telebirr', authMiddleware, PaymentController.verifyTelebirr);

module.exports = router;
