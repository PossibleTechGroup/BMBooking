const prisma = require("../lib/prisma");

const hospitalMiddleware = async (req, res, next) => {
  try {
    const hospitalProfile = await prisma.hospitalProfile.findUnique({
      where: { userId: req.user.id },
      include: { hospital: true },
    });

    if (!hospitalProfile) {
      return res
        .status(403)
        .json({ status: "fail", message: "No hospital linked to this account" });
    }

    if (hospitalProfile.status !== "APPROVED") {
      return res.status(403).json({
        status: "fail",
        message:
          hospitalProfile.status === "PENDING"
            ? "Your hospital registration is pending admin approval"
            : "Your hospital registration was rejected",
      });
    }

    req.hospitalProfile = hospitalProfile;
    req.hospital = hospitalProfile.hospital;
    next();
  } catch (err) {
    console.error("❌ [HOSPITAL] Middleware error:", err.message);
    return res.status(500).json({ status: "error", message: err.message });
  }
};

module.exports = hospitalMiddleware;
