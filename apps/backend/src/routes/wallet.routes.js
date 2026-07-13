const express = require('express');
const WalletController = require('../controllers/wallet.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');
const paymentMiddleware = require('../middleware/payment.middleware');

const router = express.Router();

router.use(authMiddleware);
router.use(roleMiddleware(['doctor']));

// View wallet balance (Allowed even if payment method not set yet)
router.get('/', WalletController.getWallet);

// Request withdrawal (Blocked if payment method not set)
router.post('/withdraw', paymentMiddleware, WalletController.withdraw);

module.exports = router;
