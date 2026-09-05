// Owner-only guard. Staff management, hospital settings and other sensitive
// actions belong exclusively to the hospital owner — a receptionist can never
// perform them regardless of their permission set.
const ownerOnlyMiddleware = (req, res, next) => {
  if (!req.hospitalRole || req.hospitalRole !== "owner") {
    return res.status(403).json({
      status: "fail",
      message: "Access denied. Only the hospital owner can perform this action.",
    });
  }
  return next();
};

module.exports = ownerOnlyMiddleware;
