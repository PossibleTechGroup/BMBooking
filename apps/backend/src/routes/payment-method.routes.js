const express = require('express');
const PaymentMethodController = require('../controllers/payment-method.controller');
const authMiddleware = require('../middleware/auth.middleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/', PaymentMethodController.getMethods);
router.post('/', PaymentMethodController.addMethod);
router.delete('/:id', PaymentMethodController.deleteMethod);
router.patch('/:id/primary', PaymentMethodController.setPrimary);

module.exports = router;
