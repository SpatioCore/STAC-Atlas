// middleware/validateCollectionSearch.js

const {
  validateQ,
  validateBbox,
  validateDatetime,
  validateLimit,
  validateSortby,
  validateToken
} = require('../validators/collectionSearchParams');

/**
 * Express middleware to validate Collection Search query parameters
 * 
 * Validates all supported query parameters and returns 400 with detailed
 * error message if validation fails. On success, attaches normalized
 * parameters to req.validatedParams for use in route handlers.
 * 
 * Supported parameters:
 * - q: Free-text search
 * - bbox: Bounding box spatial filter
 * - datetime: Temporal filter (ISO8601)
 * - limit: Result limit (default 10, max 10000)
 * - sortby: Sort specification (+/-field)
 * - token: Pagination continuation token
 * 
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {Function} next - Express next middleware function
 */
function validateCollectionSearchParams(req, res, next) {
  const errors = [];
  const normalized = {};
  
  // Extract query parameters
  const { q, bbox, datetime, limit, sortby, token } = req.query;
  
  // Validate q (free-text search)
  const qResult = validateQ(q);
  if (!qResult.valid) {
    errors.push(qResult.error);
  } else if (qResult.normalized !== undefined) {
    normalized.q = qResult.normalized;
  }
  
  // Validate bbox (spatial filter)
  const bboxResult = validateBbox(bbox);
  if (!bboxResult.valid) {
    errors.push(bboxResult.error);
  } else if (bboxResult.normalized) {
    normalized.bbox = bboxResult.normalized;
  }
  
  // Validate datetime (temporal filter)
  const datetimeResult = validateDatetime(datetime);
  if (!datetimeResult.valid) {
    errors.push(datetimeResult.error);
  } else if (datetimeResult.normalized !== undefined) {
    normalized.datetime = datetimeResult.normalized;
  }
  
  // Validate limit (pagination)
  const limitResult = validateLimit(limit);
  if (!limitResult.valid) {
    errors.push(limitResult.error);
  } else {
    normalized.limit = limitResult.normalized;
  }
  
  // Validate sortby (sorting)
  const sortbyResult = validateSortby(sortby);
  if (!sortbyResult.valid) {
    errors.push(sortbyResult.error);
  } else if (sortbyResult.normalized) {
    normalized.sortby = sortbyResult.normalized;
  }
  
  // Validate token (pagination continuation)
  const tokenResult = validateToken(token);
  if (!tokenResult.valid) {
    errors.push(tokenResult.error);
  } else {
    normalized.token = tokenResult.normalized;
  }
  
  // If any validation errors occurred, return 400 with details
  if (errors.length > 0) {
    return res.status(400).json({
      code: 'InvalidParameterValue',
      description: errors.join('; ')
    });
  }
  
  // Attach normalized params to request for use in route handler
  req.validatedParams = normalized;
  
  next();
}

module.exports = { validateCollectionSearchParams };
