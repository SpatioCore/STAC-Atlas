/**
 * ==================================
 *  ELSEWHERE IMPLEMENTED - OUTDATED
 * ==================================
 */

/**
 * Middleware for validating incoming API requests
 * Tests and validates requests before they are processed by route handlers
 */

/**
 * Validates query parameters for pagination
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const validatePagination = (req, res, next) => {
  const { limit, offset } = req.query;

  // Validate limit parameter
  if (limit !== undefined) {
    const limitNum = parseInt(limit, 10);
    
    // Check if limit is a valid number
    if (isNaN(limitNum)) {
      return res.status(400).json({
        code: 'InvalidParameter',
        description: 'Parameter "limit" must be a valid integer',
        parameter: 'limit',
        value: limit
      });
    }
    
    // Check if limit is positive
    if (limitNum < 1) {
      return res.status(400).json({
        code: 'InvalidParameter',
        description: 'Parameter "limit" must be greater than 0',
        parameter: 'limit',
        value: limit
      });
    }
    
    // Check if limit exceeds maximum
    if (limitNum > 10000) {
      return res.status(400).json({
        code: 'InvalidParameter',
        description: 'Parameter "limit" must not exceed 10000',
        parameter: 'limit',
        value: limit
      });
    }
    
    req.query.limit = limitNum;
  }

  // Validate offset parameter
  if (offset !== undefined) {
    const offsetNum = parseInt(offset, 10);
    
    // Check if offset is a valid number
    if (isNaN(offsetNum)) {
      return res.status(400).json({
        code: 'InvalidParameter',
        description: 'Parameter "offset" must be a valid integer',
        parameter: 'offset',
        value: offset
      });
    }
    
    // Check if offset is non-negative
    if (offsetNum < 0) {
      return res.status(400).json({
        code: 'InvalidParameter',
        description: 'Parameter "offset" must be greater than or equal to 0',
        parameter: 'offset',
        value: offset
      });
    }
    
    req.query.offset = offsetNum;
  }

  next();
};

/**
 * Validates bbox (bounding box) parameter
 * Expected format: minLon,minLat,maxLon,maxLat or minLon,minLat,minElev,maxLon,maxLat,maxElev
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const validateBbox = (req, res, next) => {
  const { bbox } = req.query;

  if (bbox !== undefined) {
    const coords = bbox.split(',').map(coord => parseFloat(coord));

    // Check if bbox has 4 or 6 values
    if (coords.length !== 4 && coords.length !== 6) {
      return res.status(400).json({
        code: 'InvalidParameter',
        description: 'Parameter "bbox" must contain 4 or 6 comma-separated numbers',
        parameter: 'bbox',
        value: bbox
      });
    }

    // Validate coordinate ranges for 2D bbox
    if (coords.length === 4) {
      const [minLon, minLat, maxLon, maxLat] = coords;

      if (minLon < -180 || minLon > 180 || maxLon < -180 || maxLon > 180) {
        return res.status(400).json({
          code: 'InvalidParameter',
          description: 'Longitude values in "bbox" must be between -180 and 180',
          parameter: 'bbox',
          value: bbox
        });
      }

      if (minLat < -90 || minLat > 90 || maxLat < -90 || maxLat > 90) {
        return res.status(400).json({
          code: 'InvalidParameter',
          description: 'Latitude values in "bbox" must be between -90 and 90',
          parameter: 'bbox',
          value: bbox
        });
      }

      if (minLon > maxLon) {
        return res.status(400).json({
          code: 'InvalidParameter',
          description: 'minLon must be less than or equal to maxLon in "bbox"',
          parameter: 'bbox',
          value: bbox
        });
      }

      if (minLat > maxLat) {
        return res.status(400).json({
          code: 'InvalidParameter',
          description: 'minLat must be less than or equal to maxLat in "bbox"',
          parameter: 'bbox',
          value: bbox
        });
      }
    }

    req.query.bbox = coords;
  }

  next();
};

/**
 * Validates datetime parameter
 * Expected formats: 
 * - Single datetime: "2020-01-01T00:00:00Z"
 * - Open interval: "../2020-01-01T00:00:00Z" or "2020-01-01T00:00:00Z/.."
 * - Closed interval: "2020-01-01T00:00:00Z/2021-01-01T00:00:00Z"
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const validateDatetime = (req, res, next) => {
  const { datetime } = req.query;

  if (datetime !== undefined) {
    // Check for interval (contains '/')
    if (datetime.includes('/')) {
      const [start, end] = datetime.split('/');

      // Validate start datetime (if not open-ended)
      if (start !== '..' && !isValidDatetime(start)) {
        return res.status(400).json({
          code: 'InvalidParameter',
          description: 'Start datetime in "datetime" parameter is not valid ISO 8601 format',
          parameter: 'datetime',
          value: datetime
        });
      }

      // Validate end datetime (if not open-ended)
      if (end !== '..' && !isValidDatetime(end)) {
        return res.status(400).json({
          code: 'InvalidParameter',
          description: 'End datetime in "datetime" parameter is not valid ISO 8601 format',
          parameter: 'datetime',
          value: datetime
        });
      }

      // Check that both are not open-ended
      if (start === '..' && end === '..') {
        return res.status(400).json({
          code: 'InvalidParameter',
          description: 'At least one datetime must be specified in "datetime" interval',
          parameter: 'datetime',
          value: datetime
        });
      }

      // Validate that start is before end (if both are specified)
      if (start !== '..' && end !== '..' && new Date(start) > new Date(end)) {
        return res.status(400).json({
          code: 'InvalidParameter',
          description: 'Start datetime must be before end datetime in "datetime" interval',
          parameter: 'datetime',
          value: datetime
        });
      }
    } else {
      // Single datetime
      if (!isValidDatetime(datetime)) {
        return res.status(400).json({
          code: 'InvalidParameter',
          description: 'Parameter "datetime" is not valid ISO 8601 format',
          parameter: 'datetime',
          value: datetime
        });
      }
    }
  }

  next();
};

/**
 * Helper function to check if a string is a valid ISO 8601 datetime
 * @param {string} dateString - String to validate
 * @returns {boolean} - True if valid, false otherwise
 */
const isValidDatetime = (dateString) => {
  const date = new Date(dateString);
  return !isNaN(date.getTime()) && dateString.length >= 10;
};

/**
 * Validates collection ID parameter in URL
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const validateCollectionId = (req, res, next) => {
  const { id } = req.params;

  if (!id || id.trim() === '') {
    return res.status(400).json({
      code: 'InvalidParameter',
      description: 'Collection ID must not be empty',
      parameter: 'id'
    });
  }

  // Validate that ID doesn't contain invalid characters
  const invalidChars = /[<>:"/\\|?*\x00-\x1F]/;
  if (invalidChars.test(id)) {
    return res.status(400).json({
      code: 'InvalidParameter',
      description: 'Collection ID contains invalid characters',
      parameter: 'id',
      value: id
    });
  }

  // Limit ID length
  if (id.length > 100) {
    return res.status(400).json({
      code: 'InvalidParameter',
      description: 'Collection ID must not exceed 100 characters',
      parameter: 'id',
      value: id
    });
  }

  next();
};

/**
 * Validates sortby parameter
 * Expected format: "+field" or "-field" (comma-separated for multiple fields)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const validateSortBy = (req, res, next) => {
  const { sortby } = req.query;

  if (sortby !== undefined) {
    const sortFields = sortby.split(',');
    const allowedFields = ['title', 'id', 'created', 'updated', 'start_datetime', 'end_datetime'];

    for (const field of sortFields) {
      // Check if field starts with + or -
      if (!field.startsWith('+') && !field.startsWith('-')) {
        return res.status(400).json({
          code: 'InvalidParameter',
          description: 'Each field in "sortby" must start with + (ascending) or - (descending)',
          parameter: 'sortby',
          value: sortby
        });
      }

      // Extract field name without prefix
      const fieldName = field.substring(1);

      // Check if field is allowed
      if (!allowedFields.includes(fieldName)) {
        return res.status(400).json({
          code: 'InvalidParameter',
          description: `Field "${fieldName}" is not a valid sortable field. Allowed fields: ${allowedFields.join(', ')}`,
          parameter: 'sortby',
          value: sortby
        });
      }
    }
  }

  next();
};

module.exports = {
  validateRequest,
  validatePagination,
  validateBbox,
  validateDatetime,
  validateCollectionId,
  validateSortBy,
  validateContentType
};
