const bcrypt = require("bcryptjs");
const prisma = require("../lib/prisma");
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

    // Hospital accounts must be approved before they can request an OTP
    if (existingUser && existingUser.role === "hospital") {
      const hospitalProfile = existingUser.hospitalProfile
        ? existingUser.hospitalProfile
        : await prisma.hospitalProfile.findUnique({
            where: { userId: existingUser.id },
          });
      if (!hospitalProfile) {
        throw new Error(
          "No hospital linked to this account. Please contact support.",
        );
      }
      if (hospitalProfile.status === "PENDING") {
        throw new Error(
          "Your hospital registration is pending admin approval. Please try again later.",
        );
      }
      if (hospitalProfile.status === "REJECTED") {
        throw new Error(
          hospitalProfile.rejectionReason
            ? `Your hospital registration was rejected: ${hospitalProfile.rejectionReason}`
            : "Your hospital registration was rejected.",
        );
      }
    }

    // Generate 6-digit OTP (Compatible with GeezSMS)
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Store in DB
    await OTP.create(phone, code, expiresAt);

    // --- SMS DELIVERY (mock only when MOCK_OTP=true, GeezSMS otherwise) ---
    const isMock = process.env.MOCK_OTP === "true";

    if (isMock) {
      console.log(
        `[OTP Simulation] Code for ${phone} is: ${code} (mock, no SMS sent)`,
      );
    } else {
      // GeezSMS expects an international format WITHOUT the leading "+"
      const smsPhone = phone.replace(/^\+/, "");
      const geezsmsUrl = `${process.env.GEEZSMS_API_URL || "https://api.geezsms.com/api/v1"}/sms/send`;
      let smsResult;
      try {
        const smsResponse = await fetch(geezsmsUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token: process.env.GEEZSMS_TOKEN,
            phone: smsPhone,
            msg: `Your BMBooking verification code is ${code}. Use this code to log in to BMBooking. If you did not request this, please ignore this message.`,
          }),
        });

        const rawBody = await smsResponse.text();
        console.log(
          `[GeezSMS] HTTP ${smsResponse.status} for ${smsPhone}:`,
          rawBody,
        );

        try {
          smsResult = JSON.parse(rawBody);
        } catch {
          smsResult = {
            error: true,
            msg: `HTTP ${smsResponse.status}: ${rawBody.slice(0, 200)}`,
          };
        }

        if (!smsResponse.ok && !smsResult.error) {
          smsResult = { error: true, msg: `HTTP ${smsResponse.status}` };
        }
      } catch (error) {
        smsResult = { error: true, msg: error.message };
      }

      if (smsResult.error) {
        throw new Error(
          `Failed to send OTP via SMS: ${smsResult.msg || "unknown SMS error"}`,
        );
      }
    }

    return {
      status: "success",
      message: "OTP sent successfully",
      ...(isMock && { mockCode: code }),
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
      if (role === "hospital") {
        throw new Error(
          "Hospitals must complete the hospital registration form before logging in.",
        );
      }
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

    // Hospital approval gate: hospitals must be approved by an admin before logging in
    if (user.role === "hospital") {
      const hospitalProfile = user.hospitalProfile
        ? user.hospitalProfile
        : await prisma.hospitalProfile.findUnique({
            where: { userId: user.id },
          });
      if (!hospitalProfile) {
        throw new Error(
          "No hospital linked to this account. Please contact support.",
        );
      }
      if (hospitalProfile.status === "PENDING") {
        throw new Error(
          "Your hospital registration is pending admin approval. Please try again later.",
        );
      }
      if (hospitalProfile.status === "REJECTED") {
        throw new Error(
          hospitalProfile.rejectionReason
            ? `Your hospital registration was rejected: ${hospitalProfile.rejectionReason}`
            : "Your hospital registration was rejected.",
        );
      }
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

  loginHospital: async (phone, password) => {
    const user = await User.findByPhone(phone);
    if (!user || user.role !== "hospital") {
      throw new Error("Invalid phone or password");
    }

    if (!user.password) {
      throw new Error("Invalid phone or password");
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new Error("Invalid phone or password");
    }

    const hospitalProfile = user.hospitalProfile
      ? user.hospitalProfile
      : await prisma.hospitalProfile.findUnique({
          where: { userId: user.id },
        });
    if (!hospitalProfile) {
      throw new Error("No hospital linked to this account. Please contact support.");
    }
    if (hospitalProfile.status === "PENDING") {
      throw new Error("Your hospital registration is pending admin approval. Please try again later.");
    }
    if (hospitalProfile.status === "REJECTED") {
      throw new Error(
        hospitalProfile.rejectionReason
          ? `Your hospital registration was rejected: ${hospitalProfile.rejectionReason}`
          : "Your hospital registration was rejected."
      );
    }

    const token = signToken({
      id: user.id,
      phone: user.phone,
      role: user.role,
    });
    return {
      token,
      user: { id: user.id, phone: user.phone, role: user.role },
    };
  },
};

module.exports = AuthService;
