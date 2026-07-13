const express = require("express");
const AuthController = require("../controllers/auth.controller");
const validate = require("../middleware/validation.middleware");
const schemas = require("../config/validation");
const authMiddleware = require("../middleware/auth.middleware");

const router = express.Router();

router.post(
  "/request-otp",
  validate(schemas.requestOTP),
  AuthController.requestOTP,
);
router.post(
  "/verify-otp",
  validate(schemas.verifyOTP),
  AuthController.verifyOTP,
);
router.post(
  "/receptionist-login",
  validate(schemas.receptionistLogin),
  AuthController.receptionistLogin,
);

// Push token registration (requires auth)
router.post("/push-token", authMiddleware, AuthController.registerPushToken);

module.exports = router;
