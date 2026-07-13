const prisma = require('../lib/prisma');

/**
 * Financial Safety Lock Middleware
 * Ensures approved doctors have at least one primary payout method before accessing core features.
 */
const paymentMiddleware = async (req, res, next) => {
  // 1. Explicitly bypass for profile updates and payment method management
  // This prevents circular lockouts during the onboarding process.
  if (
    req.originalUrl.includes('/profile') || 
    req.originalUrl.includes('/payment-methods')
  ) {
    return next();
  }

  // 2. Only enforce for Doctors
  if (req.user && req.user.role === 'doctor') {
    const profile = await prisma.doctorProfile.findUnique({
      where: { userId: req.user.id },
      include: { 
        paymentMethods: { 
          where: { isPrimary: true } 
        } 
      }
    });

    // 3. The Lock: If approved but no primary payout method is saved, block access.
    // Newly registered doctors (PendingReview) are allowed through to finish their profile.
    if (profile && profile.status === 'Approved' && profile.paymentMethods.length === 0) {
      return res.status(403).json({
        status: 'fail',
        code: 'PAYMENT_METHOD_REQUIRED',
        message: 'You must set up your bank payout details before using the app features.'
      });
    }
  }
  
  next();
};

module.exports = paymentMiddleware;
