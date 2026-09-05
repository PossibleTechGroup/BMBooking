// Owner bypasses all checks; staff must hold the required permission key.
const permissionMiddleware = (requiredPermission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ status: "fail", message: "Unauthorized" });
    }

    // Owner always has full access.
    if (req.hospitalRole === "owner") {
      return next();
    }

    // Staff: must have the permission key.
    if (req.hospitalRole === "staff") {
      if (Array.isArray(req.permissions) && req.permissions.includes(requiredPermission)) {
        return next();
      }
      return res.status(403).json({
        status: "fail",
        message: `Access denied. You do not have permission: ${requiredPermission}`,
      });
    }

    return res.status(403).json({ status: "fail", message: "Access denied" });
  };
};

module.exports = permissionMiddleware;