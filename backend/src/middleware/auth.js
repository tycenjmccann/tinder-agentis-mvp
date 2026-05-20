const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'agentis-dev-secret';

/**
 * Authentication middleware.
 * Validates Bearer token from Authorization header.
 * In production, this verifies JWT tokens against the secret.
 */
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authorization header is required'
      }
    });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authorization header must be in format: Bearer <token>'
      }
    });
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid or expired token'
      }
    });
  }
}

/**
 * Generate a JWT token for testing/development.
 */
function generateToken(payload, expiresIn = '24h') {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

module.exports = { authenticate, generateToken, JWT_SECRET };
