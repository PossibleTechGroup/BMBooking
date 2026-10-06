const bcrypt = require("bcryptjs");
const { Prisma } = require("@prisma/client");
const prisma = require("../lib/prisma");
const User = require("../models/user.model");
const OTP = require("../models/otp.model");
const { signToken } = require("../lib/jwt.lib");
const { ALL_PERMISSIONS } = require("../config/permissions");

// Normalize a phone-like identifier (09..., 9..., +2519...) to +251XXXXXXXXX
// Returns null if the identifier does not look like an Ethiopian phone number.
const normalizePhone = (identifier) => {
  const trimmed = (identifier || "").trim();
  if (!trimmed) return null;

  let digits = trimmed.replace(/\D/g, "");
  if (digits.startsWith("251")) digits = digits.slice(3);
  if (digits.startsWith("0")) digits = digits.slice(1);
  if (!/^[79]\d{8}$/.test(digits)) return null;

  return `+251${digits}`;
};

const isDemoReviewerPhone = (phone) => {
  return phone === "+251912345678" || phone === "+251900000000";
};

const AuthService = {
  requestOTP: async (phone, role, isRegistration) => {
    // Reviewer demo account: always succeed without SMS
    if (isDemoReviewerPhone(phone)) {
      const demoCode = "123456";
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await OTP.create(phone, demoCode, expiresAt);
      return {
        status: "success",
        message: "OTP sent successfully",
        mockCode: demoCode,
      };
    }

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
    // Reviewer demo account: any OTP works, always verify as patient
    if (isDemoReviewerPhone(phone)) {
      let demoUser = await User.findByPhone(phone);
      if (!demoUser) {
        demoUser = await User.create(phone, "patient");
      } else if (demoUser.role !== "patient") {
        await prisma.user.update({
          where: { id: demoUser.id },
          data: { role: "patient", isLocked: false, lockedUntil: null },
        });
        demoUser.role = "patient";
      }

      let profile = await prisma.patientProfile.findUnique({
        where: { userId: demoUser.id },
      });
      if (!profile) {
        profile = await prisma.patientProfile.create({
          data: {
            userId: demoUser.id,
            fullName: "App Reviewer",
            gender: "Male",
            dateOfBirth: new Date("1995-01-01"),
            bloodType: "O+",
          },
        });
      }

      const token = signToken({
        id: demoUser.id,
        phone: demoUser.phone,
        role: demoUser.role,
      });

      return {
        token,
        user: {
          id: demoUser.id,
          phone: demoUser.phone,
          role: demoUser.role,
          patientProfile: profile,
        },
      };
    }

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

    if (new Date() > new Date(latestOTP.expiresAt)) {
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

    const receptionistProfile = await prisma.receptionistProfile.findUnique({
      where: { userId: user.id },
    });
    const hospitalId = receptionistProfile ? receptionistProfile.hospitalId : null;

    const token = signToken({
      id: user.id,
      username: user.username,
      role: user.role,
      hospitalId,
    });
    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        hospitalRole: "staff",
        hospitalId,
        permissions: receptionistProfile ? receptionistProfile.permissions || [] : [],
      },
    };
  },

  loginHospitalPortal: async (identifier, password) => {
    if (!identifier || !password) {
      throw new Error("Username/phone and password are required");
    }

    // Identifier resolution (single lookup path — not a fallback retry).
    const phone = normalizePhone(identifier);
    let user = null;

    if (phone) {
      // Phone-shaped → try hospital owner first, then staff (numeric usernames).
      user = await User.findByPhone(phone);
    }
    if (!user) {
      user = await User.findByUsername(identifier.trim());
    }
    if (!user && phone) {
      // Last attempt: a staff account whose identifier was phone-shaped.
      user = await User.findByUsername(identifier.trim());
    }

    if (!user) {
      throw new Error("Invalid username or password");
    }

    if (user.role !== "hospital" && user.role !== "receptionist") {
      throw new Error("Access denied. Hospital portal only.");
    }

    if (!user.password) {
      throw new Error("Invalid username or password");
    }

    // Account lock check
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
      await User.unlockAccount(user.id);
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new Error("Invalid username or password");
    }

    // --- Owner path ---
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

      const token = signToken({
        id: user.id,
        phone: user.phone,
        role: user.role,
        hospitalId: hospitalProfile.hospitalId,
      });
      return {
        token,
        user: {
          id: user.id,
          phone: user.phone,
          role: user.role,
          hospitalRole: "owner",
          hospitalId: hospitalProfile.hospitalId,
          permissions: [...ALL_PERMISSIONS],
        },
      };
    }

    // --- Staff path (receptionist) ---
    const receptionistProfile = await prisma.receptionistProfile.findUnique({
      where: { userId: user.id },
    });
    if (!receptionistProfile) {
      throw new Error("Receptionist profile not found");
    }

    const token = signToken({
      id: user.id,
      username: user.username,
      role: user.role,
      hospitalId: receptionistProfile.hospitalId,
    });
    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        phone: user.phone || null,
        fullName: receptionistProfile.fullName || null,
        role: user.role,
        hospitalRole: "staff",
        hospitalId: receptionistProfile.hospitalId,
        permissions: receptionistProfile.permissions || [],
      },
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
      hospitalId: hospitalProfile.hospitalId,
    });
    return {
      token,
      user: {
        id: user.id,
        phone: user.phone,
        role: user.role,
        hospitalRole: "owner",
        hospitalId: hospitalProfile.hospitalId,
      },
    };
  },

  /**
   * DELETE account (App Store / Google Play requirement).
   *
   * Soft-deletes the account and anonymizes personal data so the user can
   * never be identified again, while keeping non-identifiable records
   * (appointments, schedules, reviews) intact for hospitals and reporting.
   * The phone number is released so it can be re-registered in the future.
   */
  deleteAccount: async (userId) => {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        doctorProfile: true,
        patientProfile: true,
        hospitalProfile: true,
        receptionistProfile: true,
      },
    });

    if (!user) {
      throw new Error("Account not found.");
    }

    if (user.role === "admin") {
      throw new Error("Admin accounts cannot be deleted.");
    }

    const deletedAt = new Date();

    await prisma.$transaction([
      // Release identifying fields so the account can never be used again
      prisma.user.update({
        where: { id: userId },
        data: {
          phone: null,
          email: null,
          username: null,
          password: null,
          expoPushToken: null,
          isDeleted: true,
          deletedAt,
        },
      }),
      // Remove patient personal data
      ...(user.patientProfile
        ? [
            prisma.patientProfile.update({
              where: { id: user.patientProfile.id },
              data: {
                fullName: null,
                dateOfBirth: null,
                gender: null,
                bloodType: null,
                emergencyContact: null,
              },
            }),
          ]
        : []),
      // Remove doctor personal data
      ...(user.doctorProfile
        ? [
            prisma.doctorProfile.update({
              where: { id: user.doctorProfile.id },
              data: {
                fullName: null,
                profilePicture: null,
                introVideo: null,
                specialization: null,
                specializations: Prisma.JsonNull,
                licenseNumber: null,
                experienceYears: null,
                bio: null,
                clinicName: null,
                clinicAddress: null,
                languages: Prisma.JsonNull,
                baseHourlyRate: null,
              },
            }),
          ]
        : []),
      // Remove hospital/receptionist personal data
      ...(user.hospitalProfile
        ? [
            prisma.hospitalProfile.update({
              where: { id: user.hospitalProfile.id },
              data: { rejectionReason: null },
            }),
          ]
        : []),
      ...(user.receptionistProfile
        ? [
            prisma.receptionistProfile.update({
              where: { id: user.receptionistProfile.id },
              data: { fullName: null },
            }),
          ]
        : []),
      // Drop personal notifications
      prisma.notification.deleteMany({
        where: { userId },
      }),
    ]);

    return { id: userId, deletedAt };
  },
};

module.exports = AuthService;
