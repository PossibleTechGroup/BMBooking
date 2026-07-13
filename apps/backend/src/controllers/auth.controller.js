const AuthService = require("../services/auth.service");
const prisma = require("../lib/prisma");

const AuthController = {
  requestOTP: async (req, res) => {
    try {
      const { phone, role, isRegistration } = req.body;
      if (!phone) {
        return res.status(400).json({ message: "Phone is required" });
      }
      const result = await AuthService.requestOTP(phone, role, isRegistration);
      res.status(200).json({ status: "success", data: result });
    } catch (err) {
      res.status(400).json({ status: "fail", message: err.message });
    }
  },

  verifyOTP: async (req, res) => {
    try {
      const { phone, code, role, isRegistration } = req.body;
      if (!phone || !code) {
        return res
          .status(400)
          .json({ status: "fail", message: "Phone and code are required" });
      }
      const result = await AuthService.verifyOTP(
        phone,
        code,
        role,
        isRegistration,
      );
      res.status(200).json({ status: "success", data: result });
    } catch (err) {
      res.status(400).json({ status: "fail", message: err.message });
    }
  },

  receptionistLogin: async (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res
          .status(400)
          .json({
            status: "fail",
            message: "Username and password are required",
          });
      }

      const result = await AuthService.loginReceptionist(username, password);
      res.status(200).json({ status: "success", data: result });
    } catch (err) {
      res.status(400).json({ status: "fail", message: err.message });
    }
  },

  /**
   * POST /api/auth/push-token
   * Register or update the user's Expo push token for push notifications
   * Body: { token: "ExponentPushToken[...]" }
   */
  registerPushToken: async (req, res) => {
    try {
      const userId = req.user.id;
      const { token } = req.body;

      if (!token) {
        return res
          .status(400)
          .json({ status: "fail", message: "Push token is required" });
      }

      await prisma.user.update({
        where: { id: userId },
        data: { expoPushToken: token },
      });

      console.log(`[PUSH] Registered push token for user ${userId}`);
      res
        .status(200)
        .json({ status: "success", message: "Push token registered" });
    } catch (err) {
      console.error("[PUSH] Failed to register push token:", err.message);
      res.status(500).json({ status: "error", message: err.message });
    }
  },
};

module.exports = AuthController;
