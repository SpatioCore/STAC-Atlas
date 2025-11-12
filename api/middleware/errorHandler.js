/**
 * Error Handler Middleware
 * Centralizes error handling and error responses
 */

/**
 * Custom API Error class
 */
class ApiError extends Error {
  constructor(code, description, statusCode = 400, details = null) {
    super(description);
    this.code = code;
    this.description = description;
    this.statusCode = statusCode;
    this.details = details;
  }
}

/**
 * Validation Error (400 Bad Request)
 */
class ValidationError extends ApiError {
  constructor(description, details = null) {
    super('BadRequest', description, 400, details);
  }
}

/**
 * Not Found Error (404)
 */
class NotFoundError extends ApiError {
  constructor(description) {
    super('NotFound', description, 404);
  }
}

/**
 * Internal Server Error (500)
 */
class InternalServerError extends ApiError {
  constructor(description = 'An internal server error occurred') {
    super('InternalServerError', description, 500);
  }
}

/**
 * Forbidden Error (403)
 */
class ForbiddenError extends ApiError {
  constructor(description = 'Access forbidden') {
    super('Forbidden', description, 403);
  }
}

/**
 * Unauthorized Error (401)
 */
class UnauthorizedError extends ApiError {
  constructor(description = 'Unauthorized access') {
    super('Unauthorized', description, 401);
  }
}

/**
 * Error response middleware
 * Should be used as the last middleware in Express app
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function errorHandler(err, req, res, _next) {
  // Default to 500 Internal Server Error
  let error = err;

  if (!(err instanceof ApiError)) {
    // Convert non-API errors to ApiError
    console.error('Unhandled error:', err);
    error = new InternalServerError(err.message || 'An unexpected error occurred');
  }

  // Log error
  if (error.statusCode >= 500) {
    console.error(`[${error.code}]`, error.description);
  }

  // Build response object
  const response = {
    code: error.code,
    description: error.description
  };

  // Add details if present
  if (error.details) {
    // Flatten details into response for backward compatibility
    Object.assign(response, error.details);
  }

  // Send error response
  res.status(error.statusCode).json(response);
}

/**
 * Async error wrapper for route handlers
 * Wraps async functions to catch errors and pass to error handler
 * @param {Function} fn - Async route handler
 * @returns {Function} Wrapped function
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = {
  ApiError,
  ValidationError,
  NotFoundError,
  InternalServerError,
  ForbiddenError,
  UnauthorizedError,
  errorHandler,
  asyncHandler
};
