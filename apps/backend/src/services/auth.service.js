const bcrypt = require("bcryptjs");
const User = require("../models/user.model");
const OTP = require("../models/otp.model");
const { signToken } = require("../lib/jwt.lib");

const AuthService = {
  requestOTP: async (phone, role, isRegistration) => {
    // Check if user already exists
    const existingUser = await User.findByPhone(phone);

    let targetRole = role;

    if (existingUser) {
      if (isRegistration) {
        throw new Error(
          "This phone number is already registered. Please log in instead.",
        );
      }
      // Auto-detect role for existing users
      targetRole = existingUser.role;
    } else {
      // New user MUST provide a role
      if (!targetRole) {
        throw new Error("Role is required for new registration.");
      }
    }

    // Generate 6-digit OTP (Compatible with AfroMessage)
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Store in DB
    await OTP.create(phone, code, expiresAt);

    // --- AFROMESSAGE INTEGRATION ---
    try {
      const smsResponse = await fetch("https://api.afromessage.com/api/send", {
        method: "POST",
        headers: {
          Authorization: process.env.AFROMESSAGE_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: process.env.AFROMESSAGE_FROM,
          sender: process.env.AFROMESSAGE_SENDER,
          to: phone,
          message: `Your OTP code is ${code}`,
        }),
      });

      const smsResult = await smsResponse.json();
      console.log(`[AfroMessage] Response for ${phone}:`, smsResult);
    } catch (error) {
      console.error(
        `[AfroMessage] Failed to send SMS to ${phone}:`,
        error.message,
      );
    }

    return {
      status: "success",
      message: "OTP sent successfully",
    };
  },

  verifyOTP: async (phone, code, role, isRegistration) => {
    // Get or create user
    let user = await User.findByPhone(phone);

    if (user) {
      if (isRegistration) {
        throw new Error(
          "This phone number is already registered. Please log in instead.",
        );
      }
    } else {
      // New user: Create account (Requires role)
      if (!role) throw new Error("Role is required to create a new account.");
      user = await User.create(phone, role);
    }

    // Check if account is locked
    if (
      user.isLocked &&
      user.lockedUntil &&
      new Date() < new Date(user.lockedUntil)
    ) {
      const remainingMinutes = Math.ceil(
        (new Date(user.lockedUntil) - new Date()) / 60000,
      );
      throw new Error(
        `Account locked. Try again in ${remainingMinutes} minutes.`,
      );
    } else if (user.isLocked) {
      // Unlock if time has passed
      await User.unlockAccount(user.id);
    }

    // --- OTP VERIFICATION ---
    const latestOTP = await OTP.findLatestByPhone(phone);

    if (!latestOTP) {
      throw new Error(
        "No OTP request found for this number. Please request one first.",
      );
    }

    if (latestOTP.code !== code) {
      await OTP.incrementAttempts(latestOTP.id);
      if (latestOTP.attempts + 1 >= 5) {
        const lockUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
        await User.lockAccount(user.id, lockUntil);
        throw new Error("Too many attempts. Account locked for 30 minutes.");
      }
      throw new Error("Invalid OTP");
    }

    if (latestOTP.verified) {
      throw new Error(
        "This code has already been used. Please request a new one.",
      );
    }

    if (new Date() > new Date(latestOTP.expires_at)) {
      throw new Error("OTP expired");
    }

    // Mark as verified
    await OTP.verify(latestOTP.id);

    // Generate token (90 days)
    const token = signToken({
      id: user.id,
      phone: user.phone,
      role: user.role,
    });

    return { token, user };
  },

  loginReceptionist: async (username, password) => {
    const user = await User.findByUsername(username);
    if (!user || user.role !== "receptionist") {
      throw new Error("Invalid username or password");
    }

    if (!user.password) {
      throw new Error("Invalid username or password");
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new Error("Invalid username or password");
    }

    const token = signToken({
      id: user.id,
      username: user.username,
      role: user.role,
    });
    return {
      token,
      user: { id: user.id, username: user.username, role: user.role },
    };
  },
};

module.exports = AuthService;
