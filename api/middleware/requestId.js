const { generateRequestId } = require('../utils/errorResponse');

/**
 * Request ID middleware
 * 
 * Attaches a unique request ID to each request for tracing and logging.
 * The request ID can be:
 * 1. Provided by the client via X-Request-ID header
 * 2. Auto-generated if not provided
 * 
 * The request ID is:
 * - Attached to req.requestId for use in routes and middleware
 * - Included in the X-Request-ID response header
 * - Included in error responses for debugging
 * 
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 * @param {Function} next - Next middleware
 */
function requestIdMiddleware(req, res, next) {
  // Use client-provided request ID or generate new one
  const requestId = req.get('X-Request-ID') || generateRequestId();
  
  // Attach to request object
  req.requestId = requestId;
  
  // Include in response headers
  res.setHeader('X-Request-ID', requestId);
  
  next();
}

module.exports = {
  requestIdMiddleware
};
