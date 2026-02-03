const expressRateLimit = require('express-rate-limit');
const { ErrorResponses } = require('../utils/errorResponse');

/**
 * Rate limiting middleware
 *
 * This middleware:
 * 1. Limits each IP address to a maximum number of requests per time window (default: 1000 requests per 15 minutes)
 * 2. Returns HTTP 429 Too Many Requests if the limit is exceeded
 * 3. Returns RFC 7807 compliant error response
 * 4. Sets standard RateLimit headers for client awareness
 * 5. Can be configured for different limits or strategies if needed
 * 6. Can be disabled for load testing by setting DISABLE_RATE_LIMIT=true
 *
 * @see https://www.npmjs.com/package/express-rate-limit
 */
const rateLimitMiddleware = expressRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // max 1000 requests per IP
  // Skip rate limiting if disabled via environment variable (useful for load testing)
  skip: () => process.env.DISABLE_RATE_LIMIT === 'true',
  handler: (req, res) => {
    const errorResponse = ErrorResponses.tooManyRequests(
      undefined,
      req.requestId,
      req.originalUrl
    );
    res.status(429).json(errorResponse);
  },
  standardHeaders: true, // Set RateLimit headers
  legacyHeaders: false, // Disable X-RateLimit headers
});

module.exports = { rateLimitMiddleware };
