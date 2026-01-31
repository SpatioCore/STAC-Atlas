const winston = require('winston');
const path = require('path');

/**
 * Structured Logging Configuration with Winston
 * 
 * This module provides:
 * 1. Structured JSON logging
 * 2. Multiple log levels (error, warn, info, http, debug)
 * 3. File logging with rotation
 * 4. Console logging for development
 * 5. Request ID tracking
 * 6. Timestamp on all logs
 * 
 * Log Files:
 * - logs/combined.log: All logs
 * - logs/error.log: Error logs only
 * 
 * @see https://www.npmjs.com/package/winston
 */

// Determine log level from environment
const logLevel = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

// Custom format for structured logging
const structuredFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Console format for development (more readable)
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.printf(({ timestamp, level, message, requestId, ...meta }) => {
    let msg = `${timestamp} [${level}]`;
    if (requestId) {
      msg += ` [${requestId}]`;
    }
    msg += `: ${message}`;
    
    // Add metadata if present
    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta)}`;
    }
    return msg;
  })
);

// Create logs directory if it doesn't exist
const fs = require('fs');
const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

/**
 * Winston logger instance
 */
const logger = winston.createLogger({
  level: logLevel,
  format: structuredFormat,
  defaultMeta: {
    service: 'stac-atlas-api',
    environment: process.env.NODE_ENV || 'development'
  },
  transports: [
    // Write all logs to combined.log
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 10485760, // 10MB
      maxFiles: 5,
      tailable: true
    }),
    
    // Write error logs to error.log
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 10485760, // 10MB
      maxFiles: 5,
      tailable: true
    })
  ],
  
  // Handle exceptions and rejections
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'exceptions.log')
    })
  ],
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'rejections.log')
    })
  ]
});

// Add console transport in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: consoleFormat
  }));
}

/**
 * HTTP request logging middleware
 * Logs all HTTP requests with structured data
 */
function httpLogger(req, res, next) {
  const startTime = Date.now();

  // Log request
  logger.http('Incoming request', {
    requestId: req.requestId,
    method: req.method,
    url: req.originalUrl || req.url,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('user-agent')
  });

  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logLevel = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'http';

    logger.log(logLevel, 'Outgoing response', {
      requestId: req.requestId,
      method: req.method,
      url: req.originalUrl || req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      contentLength: res.get('content-length')
    });
  });

  next();
}

/**
 * Log an error with structured data
 * @param {Error} error - Error object
 * @param {Object} context - Additional context
 */
function logError(error, context = {}) {
  logger.error(error.message, {
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: error.code,
      status: error.status || error.statusCode
    },
    ...context
  });
}

/**
 * Log info with structured data
 * @param {string} message - Log message
 * @param {Object} context - Additional context
 */
function logInfo(message, context = {}) {
  logger.info(message, context);
}

/**
 * Log warning with structured data
 * @param {string} message - Log message
 * @param {Object} context - Additional context
 */
function logWarn(message, context = {}) {
  logger.warn(message, context);
}

/**
 * Log debug with structured data
 * @param {string} message - Log message
 * @param {Object} context - Additional context
 */
function logDebug(message, context = {}) {
  logger.debug(message, context);
}

module.exports = {
  logger,
  httpLogger,
  logError,
  logInfo,
  logWarn,
  logDebug
};
