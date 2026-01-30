const { ErrorResponses, sanitizeErrorMessage } = require('../utils/errorResponse');
const { logError, logWarn } = require('../utils/logger');

/**
 * Global error handler middleware
 * 
 * This middleware:
 * 1. Catches all unhandled errors from routes and middleware
 * 2. Logs errors appropriately based on severity
 * 3. Returns RFC 7807 compliant error responses
 * 4. Sanitizes error messages to prevent sensitive data leakage
 * 5. Includes request ID for error tracing
 * 
 * @param {Error} err - Error object
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 * @param {Function} next - Next middleware
 */
function globalErrorHandler(err, req, res, next) {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const requestId = req.requestId || 'unknown';
  const instance = req.originalUrl || req.url;

  // Determine status code
  const status = err.status || err.statusCode || 500;

  // Log error based on severity
  if (status >= 500) {
    // Server errors - log full details
    logError(err, {
      requestId,
      method: req.method,
      url: instance,
      userAgent: req.get('user-agent'),
      ip: req.ip || req.connection.remoteAddress
    });
  } else if (status >= 400) {
    // Client errors - log basic info
    logWarn('Client Error', {
      requestId,
      status,
      method: req.method,
      url: instance,
      error: err.message,
      code: err.code
    });
  }

  // Sanitize error message
  const sanitizedMessage = sanitizeErrorMessage(err, isDevelopment);

  // Create error response based on status code
  let errorResponse;

  if (status === 404) {
    errorResponse = ErrorResponses.notFound(
      sanitizedMessage,
      requestId,
      instance
    );
  } else if (status >= 400 && status < 500) {
    // Client errors
    errorResponse = ErrorResponses.badRequest(
      sanitizedMessage,
      requestId,
      instance,
      {
        // Include error code if available
        ...(err.code && { code: err.code })
      }
    );
    errorResponse.status = status; // Override with specific status
  } else if (status === 501) {
    errorResponse = ErrorResponses.notImplemented(
      sanitizedMessage,
      requestId,
      instance
    );
  } else if (status === 503) {
    errorResponse = ErrorResponses.serviceUnavailable(
      sanitizedMessage,
      requestId,
      instance
    );
  } else {
    // 500 or other server errors
    errorResponse = ErrorResponses.internalError(
      isDevelopment ? sanitizedMessage : undefined, // Hide details in production
      requestId,
      instance
    );
  }

  // In development, include stack trace
  if (isDevelopment && status >= 500) {
    errorResponse.stack = err.stack;
  }

  // Send error response
  res.status(status).json(errorResponse);
}

module.exports = {
  globalErrorHandler
};
