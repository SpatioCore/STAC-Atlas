/**
 * Request Size Limiting Middleware
 * 
 * Protects the API from excessively large requests by limiting:
 * - URL length (query parameters)
 * - Header size
 * - Request body size (for future POST/PUT support)
 * 
 * Configured via environment variables:
 * - MAX_URL_LENGTH: Maximum URL length in bytes (default: 1MB)
 * - MAX_HEADER_SIZE: Maximum total header size in bytes (default: 100KB)
 * - MAX_BODY_SIZE: Maximum body size (default: 10MB for future use)
 */

const { ErrorResponses } = require('../utils/errorResponse');

// Parse size strings like "1MB", "100KB" to bytes
function parseSize(sizeStr, defaultValue) {
  if (!sizeStr) return defaultValue;
  
  const match = sizeStr.match(/^(\d+(?:\.\d+)?)\s*(KB|MB|GB)?$/i);
  if (!match) return defaultValue;
  
  const value = parseFloat(match[1]);
  const unit = (match[2] || 'B').toUpperCase();
  
  const multipliers = {
    'B': 1,
    'KB': 1024,
    'MB': 1024 * 1024,
    'GB': 1024 * 1024 * 1024
  };
  
  return Math.floor(value * multipliers[unit]);
}

// Default limits (in bytes)
const DEFAULT_MAX_URL_LENGTH = 1024 * 1024; // 1MB - very generous for complex CQL2 filters
const DEFAULT_MAX_HEADER_SIZE = 100 * 1024; // 100KB
const DEFAULT_MAX_BODY_SIZE = 10 * 1024 * 1024; // 10MB (for future POST/PUT)

// Parse limits from environment
const MAX_URL_LENGTH = parseSize(process.env.MAX_URL_LENGTH, DEFAULT_MAX_URL_LENGTH);
const MAX_HEADER_SIZE = parseSize(process.env.MAX_HEADER_SIZE, DEFAULT_MAX_HEADER_SIZE);
const MAX_BODY_SIZE = parseSize(process.env.MAX_BODY_SIZE, DEFAULT_MAX_BODY_SIZE);

/**
 * Format bytes to human-readable size
 */
function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} bytes`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

/**
 * Middleware to limit request sizes
 */
function requestSizeLimitMiddleware(req, res, next) {
  // 1. Check URL length (including query string)
  const fullUrl = req.originalUrl || req.url;
  const urlLength = Buffer.byteLength(fullUrl, 'utf8');
  
  if (urlLength > MAX_URL_LENGTH) {
    const error = ErrorResponses.invalidParameter(
      `Request URL too long: ${formatSize(urlLength)} exceeds maximum of ${formatSize(MAX_URL_LENGTH)}. ` +
      `Consider using shorter query parameters or splitting the request.`,
      req.requestId,
      req.originalUrl
    );
    return res.status(413).json(error);
  }
  
  // 2. Check total header size
  let totalHeaderSize = 0;
  for (const [name, value] of Object.entries(req.headers)) {
    // Calculate size: "name: value\r\n"
    totalHeaderSize += Buffer.byteLength(name, 'utf8');
    totalHeaderSize += Buffer.byteLength(value, 'utf8');
    totalHeaderSize += 4; // ": " + "\r\n"
  }
  
  if (totalHeaderSize > MAX_HEADER_SIZE) {
    const error = ErrorResponses.invalidParameter(
      `Request headers too large: ${formatSize(totalHeaderSize)} exceeds maximum of ${formatSize(MAX_HEADER_SIZE)}`,
      req.requestId,
      req.originalUrl
    );
    return res.status(413).json(error);
  }
  
  // 3. Body size is handled by express.json() and express.urlencoded() limits
  // We set those in app.js
  
  next();
}

module.exports = {
  requestSizeLimitMiddleware,
  MAX_URL_LENGTH,
  MAX_HEADER_SIZE,
  MAX_BODY_SIZE,
  formatSize
};
