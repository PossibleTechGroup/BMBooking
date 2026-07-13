const roleMiddleware = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        status: 'fail', 
        message: 'Access denied. You do not have the required permissions.' 
      });
    }
    next();
  };
};

module.exports = roleMiddleware;
