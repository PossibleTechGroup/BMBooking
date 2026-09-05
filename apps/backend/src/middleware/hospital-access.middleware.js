const prisma = require("../lib/prisma");
const { ALL_PERMISSIONS } = require("../config/permissions");

// Resolves hospital context for BOTH:
//   - role 'hospital'     → owner (full access)
//   - role 'receptionist' → staff (permission-gated access)
// Attaches: req.hospital, req.hospitalProfile (owner only), req.receptionistProfile (staff only),
//           req.hospitalRole ('owner' | 'staff'), req.permissions[]
const hospitalAccessMiddleware = async (req, res, next) => {
  try {
    const role = req.user.role;

    if (role === "hospital") {
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
      req.hospitalRole = "owner";
      req.permissions = [...ALL_PERMISSIONS];
      req.receptionistProfile = { id: null, hospitalId: hospitalProfile.hospitalId };
      return next();
    }

    if (role === "receptionist") {
      const receptionistProfile = await prisma.receptionistProfile.findUnique({
        where: { userId: req.user.id },
        include: { hospital: true },
      });

      if (!receptionistProfile) {
        return res
          .status(403)
          .json({ status: "fail", message: "Receptionist profile not found" });
      }

      req.receptionistProfile = receptionistProfile;
      req.hospital = receptionistProfile.hospital;
      req.hospitalRole = "staff";
      req.permissions = receptionistProfile.permissions || [];
      return next();
    }

    return res
      .status(403)
      .json({ status: "fail", message: "Access denied. Hospital access only." });
  } catch (err) {
    console.error("❌ [HOSPITAL-ACCESS] Middleware error:", err.message);
    return res.status(500).json({ status: "error", message: err.message });
  }
};

module.exports = hospitalAccessMiddleware;