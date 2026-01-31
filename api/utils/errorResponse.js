const crypto = require('crypto');

/**
 * RFC 7807 Problem Details for HTTP APIs
 * https://datatracker.ietf.org/doc/html/rfc7807
 * 
 * Standard error response format that includes:
 * - type: URI reference identifying the problem type
 * - title: Short, human-readable summary
 * - status: HTTP status code
 * - detail: Human-readable explanation specific to this occurrence
 * - instance: URI reference identifying the specific occurrence
 * - requestId: Unique identifier for tracing this request
 */

/**
 * Generates a unique request ID for tracing
 * @returns {string} UUID v4
 */
function generateRequestId() {
  return crypto.randomUUID();
}

/**
 * Creates a standardized RFC 7807 error response
 * @param {Object} options - Error options
 * @param {number} options.status - HTTP status code
 * @param {string} options.code - Error code (e.g., 'InvalidParameterValue')
 * @param {string} options.title - Short error title
 * @param {string} options.detail - Detailed error description
 * @param {string} [options.requestId] - Request ID for tracing
 * @param {string} [options.instance] - Request path
 * @param {Object} [options.extensions] - Additional custom fields
 * @returns {Object} RFC 7807 compliant error response
 */
function createErrorResponse({ status, code, title, detail, requestId, instance, extensions = {} }) {
  const errorResponse = {
    // RFC 7807 standard fields
    type: `https://stacspec.org/errors/${code}`,
    title: title || getDefaultTitle(status),
    status,
    detail: detail || title || getDefaultTitle(status),
    ...(instance && { instance }),
    ...(requestId && { requestId }),
    // Backwards compatibility fields
    code, // Keep for existing tests
    description: detail || title || getDefaultTitle(status), // Alias for detail
    ...extensions
  };

  return errorResponse;
}

/**
 * Gets default error title for status code
 * @param {number} status - HTTP status code
 * @returns {string} Default title
 */
function getDefaultTitle(status) {
  const titles = {
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    405: 'Method Not Allowed',
    409: 'Conflict',
    422: 'Unprocessable Entity',
    500: 'Internal Server Error',
    501: 'Not Implemented',
    502: 'Bad Gateway',
    503: 'Service Unavailable'
  };
  return titles[status] || 'Error';
}

/**
 * Common error creators for consistent responses
 */
const ErrorResponses = {
  /**
   * 400 - Bad Request (invalid parameter - malformed/wrong type)
   */
  invalidParameter(detail, requestId, instance, extensions) {
    return createErrorResponse({
      status: 400,
      code: 'InvalidParameter',
      title: 'Invalid Parameter',
      detail,
      requestId,
      instance,
      extensions
    });
  },

  /**
   * 400 - Bad Request (invalid parameter value - wrong value range/format)
   */
  badRequest(detail, requestId, instance, extensions) {
    return createErrorResponse({
      status: 400,
      code: 'InvalidParameterValue',
      title: 'Invalid Parameter Value',
      detail,
      requestId,
      instance,
      extensions
    });
  },

  /**
   * 404 - Not Found
   */
  notFound(detail, requestId, instance) {
    return createErrorResponse({
      status: 404,
      code: 'NotFound',
      title: 'Resource Not Found',
      detail,
      requestId,
      instance
    });
  },

  /**
   * 500 - Internal Server Error
   */
  internalError(detail, requestId, instance) {
    return createErrorResponse({
      status: 500,
      code: 'InternalServerError',
      title: 'Internal Server Error',
      detail: detail || 'An unexpected error occurred while processing the request',
      requestId,
      instance
    });
  },

  /**
   * 501 - Not Implemented
   */
  notImplemented(detail, requestId, instance) {
    return createErrorResponse({
      status: 501,
      code: 'NotImplemented',
      title: 'Not Implemented',
      detail,
      requestId,
      instance
    });
  },

  /**
   * 503 - Service Unavailable
   */
  serviceUnavailable(detail, requestId, instance) {
    return createErrorResponse({
      status: 503,
      code: 'ServiceUnavailable',
      title: 'Service Unavailable',
      detail,
      requestId,
      instance
    });
  },

  /**
   * 429 - Too Many Requests (Rate Limit Exceeded)
   */
  tooManyRequests(detail, requestId, instance) {
    return createErrorResponse({
      status: 429,
      code: 'TooManyRequests',
      title: 'Too Many Requests',
      detail: detail || 'Too many requests from this IP address, please try again later.',
      requestId,
      instance
    });
  }
};

/**
 * Sanitizes error messages to prevent sensitive data leakage
 * @param {Error} error - Original error
 * @param {boolean} isDevelopment - Whether in development mode
 * @returns {string} Sanitized error message
 */
function sanitizeErrorMessage(error, isDevelopment = false) {
  // In development, show detailed errors
  if (isDevelopment) {
    return error.message || 'Unknown error';
  }

  // In production, hide sensitive details
  const safePatterns = [
    /invalid parameter/i,
    /not found/i,
    /unauthorized/i,
    /forbidden/i,
    /validation error/i,
    /invalid format/i,
    /missing required/i
  ];

  const message = error.message || '';
  
  // If message matches safe patterns, return it
  if (safePatterns.some(pattern => pattern.test(message))) {
    // Remove any database-specific details
    return message
      .replace(/\bpassword\b/gi, '***')
      .replace(/\btoken\b/gi, '***')
      .replace(/\bsecret\b/gi, '***')
      .replace(/postgresql:\/\/[^\s]+/gi, '***')
      .replace(/error: /gi, '');
  }

  // For unknown errors, return generic message
  return 'An unexpected error occurred while processing the request';
}

module.exports = {
  generateRequestId,
  createErrorResponse,
  ErrorResponses,
  sanitizeErrorMessage
};
