const { validationResult } = require('express-validator');

/**
 * Middleware to check express-validator validation results.
 * Returns 400 with error details if validation fails.
 */
function validate(req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request parameters',
        details: errors.array().map(err => ({
          field: err.path,
          message: err.msg,
          value: err.value
        }))
      }
    });
  }

  next();
}

module.exports = { validate };
