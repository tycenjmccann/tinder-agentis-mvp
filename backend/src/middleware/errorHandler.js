/**
 * Global error handler middleware.
 * Follows the standard API error response format:
 * { error: { code: string, message: string, details?: any } }
 */
function errorHandler(err, req, res, _next) {
  console.error('Unhandled error:', err);

  const statusCode = err.statusCode || 500;
  const code = err.code || 'INTERNAL_ERROR';
  const message = err.message || 'An unexpected error occurred';

  const response = {
    error: {
      code,
      message
    }
  };

  if (err.details) {
    response.error.details = err.details;
  }

  res.status(statusCode).json(response);
}

/**
 * Create an API error with status code and code.
 */
class ApiError extends Error {
  constructor(statusCode, code, message, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

module.exports = { errorHandler, ApiError };
