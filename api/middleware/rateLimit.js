const expressRateLimit = require('express-rate-limit');

/**
 * Rate limiting middleware
 *
 * This middleware:
 * 1. Limits each IP address to a maximum number of requests per time window (default: 1000 requests per 15 minutes)
 * 2. Returns HTTP 429 Too Many Requests if the limit is exceeded
 * 3. Sets standard RateLimit headers for client awareness
 * 4. Can be configured for different limits or strategies if needed
 *
 * @see https://www.npmjs.com/package/express-rate-limit
 */
const rateLimitMiddleware = expressRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // max 1000 requests per IP
  message: {
    status: 429,
    error: 'Too many requests, please try again later.'
  },
  standardHeaders: true, // Set RateLimit headers
  legacyHeaders: false, // Disable X-RateLimit headers
});

module.exports = { rateLimitMiddleware };
