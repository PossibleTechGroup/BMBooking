const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false });
    
    if (error) {
      const errorMessage = error.details.map(detail => detail.message).join(', ');
      console.warn(`⚠️ [VALIDATION] Error in ${req.originalUrl}:`, errorMessage);
      console.warn(`📦 [BODY]:`, JSON.stringify(req.body, null, 2));
      return res.status(400).json({
        status: 'fail',
        message: `Validation Error: ${errorMessage}`
      });
    }

    // Replace req.body with validated (and converted) value
    req.body = value;
    next();
  };
};

module.exports = validate;
