const cors = require('cors');

/**
 * CORS Middleware Configuration
 * 
 * This middleware:
 * 1. Configures allowed origins from environment variables
 * 2. Supports multiple origins (comma-separated in CORS_ORIGIN)
 * 3. Allows appropriate HTTP methods for STAC API
 * 4. Handles credentials and preflight requests
 * 5. Sets appropriate CORS headers
 * 
 * Environment variables:
 * - CORS_ORIGIN: Allowed origins (comma-separated) or '*' for all origins
 * - CORS_CREDENTIALS: Enable credentials (true/false)
 * 
 * @see https://www.npmjs.com/package/cors
 */

/**
 * Parse allowed origins from environment variable
 * Supports:
 * - Single origin: 'http://localhost:3000'
 * - Multiple origins: 'http://localhost:3000,http://example.com'
 * - All origins: '*'
 */
function parseAllowedOrigins() {
  const corsOrigin = process.env.CORS_ORIGIN || '*';

  // If wildcard, allow all origins
  if (corsOrigin === '*') {
    return '*';
  }

  // Split comma-separated origins and trim whitespace
  const origins = corsOrigin.split(',').map(origin => origin.trim());

  // Return array of origins or single origin
  return origins.length === 1 ? origins[0] : origins;
}

/**
 * CORS configuration options
 */
const corsOptions = {
  // Allowed origins
  origin: parseAllowedOrigins(),

  // Allowed HTTP methods for STAC API
  // GET: Read operations (collections, conformance, etc.)
  // POST: Search operations, CQL2 filtering
  // OPTIONS: Preflight requests
  // PUT/PATCH/DELETE: Future write operations (if needed)
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],

  // Allowed request headers
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Request-ID',
    'Accept',
    'Origin'
  ],

  // Exposed response headers (client can access these)
  exposedHeaders: [
    'X-Request-ID',
    'RateLimit-Limit',
    'RateLimit-Remaining',
    'RateLimit-Reset'
  ],

  // Allow credentials (cookies, authorization headers)
  credentials: process.env.CORS_CREDENTIALS === 'true',

  // Cache preflight response for 24 hours
  maxAge: 86400,

  // Pass CORS preflight response to next handler
  preflightContinue: false,

  // Provide success status for OPTIONS requests
  optionsSuccessStatus: 204
};

/**
 * CORS middleware instance
 */
const corsMiddleware = cors(corsOptions);

module.exports = {
  corsMiddleware,
  corsOptions
};
