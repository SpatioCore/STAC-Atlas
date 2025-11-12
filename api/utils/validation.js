/**
 * Validation Utilities
 * Validates query parameters and collection data
 */

/**
 * Validate pagination parameters
 * @param {number} limit - Limit value
 * @param {number} offset - Offset value
 * @returns {Object} { valid: boolean, errors: string[] }
 */
function validatePagination(limit, offset) {
  const errors = [];

  if (limit && (limit < 1 || limit > 100)) {
    errors.push('limit must be between 1 and 100');
  }

  if (offset && offset < 0) {
    errors.push('offset must be >= 0');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate bounding box
 * @param {Object} bbox - { minX, minY, maxX, maxY }
 * @returns {Object} { valid: boolean, errors: string[] }
 */
function validateBbox(bbox) {
  const errors = [];

  if (!bbox) return { valid: true, errors };

  if (typeof bbox.minX !== 'number' || typeof bbox.maxX !== 'number') {
    errors.push('bbox X coordinates must be numbers');
  }

  if (typeof bbox.minY !== 'number' || typeof bbox.maxY !== 'number') {
    errors.push('bbox Y coordinates must be numbers');
  }

  if (bbox.minX >= bbox.maxX) {
    errors.push('bbox minX must be less than maxX');
  }

  if (bbox.minY >= bbox.maxY) {
    errors.push('bbox minY must be less than maxY');
  }

  // Check WGS84 bounds for geographic coordinates
  if (bbox.minX >= -180 && bbox.maxX <= 180) {
    if (bbox.minX < -180 || bbox.maxX > 180) {
      errors.push('bbox X coordinates out of range [-180, 180]');
    }
  }

  if (bbox.minY < -90 || bbox.maxY > 90) {
    errors.push('bbox Y coordinates out of range [-90, 90]');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate datetime parameters
 * @param {Object} datetime - { start, end }
 * @returns {Object} { valid: boolean, errors: string[] }
 */
function validateDatetime(datetime) {
  const errors = [];

  if (!datetime) return { valid: true, errors };

  if (datetime.start && !(datetime.start instanceof Date) && isNaN(datetime.start)) {
    errors.push('start datetime must be a valid ISO 8601 date');
  }

  if (datetime.end && !(datetime.end instanceof Date) && isNaN(datetime.end)) {
    errors.push('end datetime must be a valid ISO 8601 date');
  }

  if (datetime.start && datetime.end && datetime.start > datetime.end) {
    errors.push('start datetime must be before end datetime');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate sortby parameters
 * @param {Array} sortby - Array of { field, direction } objects
 * @param {Array} allowedFields - List of allowed fields to sort by
 * @returns {Object} { valid: boolean, errors: string[] }
 */
function validateSortby(sortby, allowedFields = []) {
  const errors = [];

  if (!sortby || sortby.length === 0) return { valid: true, errors };

  sortby.forEach((sort, index) => {
    if (!sort.field) {
      errors.push(`sortby[${index}]: field is required`);
    }

    if (sort.direction && !['asc', 'desc'].includes(sort.direction)) {
      errors.push(`sortby[${index}]: direction must be 'asc' or 'desc'`);
    }

    if (allowedFields.length > 0 && !allowedFields.includes(sort.field)) {
      errors.push(`sortby[${index}]: field '${sort.field}' is not allowed`);
    }
  });

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate collection ID format
 * @param {string} id - Collection ID
 * @returns {Object} { valid: boolean, errors: string[] }
 */
function validateCollectionId(id) {
  const errors = [];

  if (!id || typeof id !== 'string') {
    errors.push('Collection ID must be a non-empty string');
  }

  if (id && id.length > 256) {
    errors.push('Collection ID must be 256 characters or less');
  }

  if (id && !/^[a-zA-Z0-9_\-:.]+$/.test(id)) {
    errors.push('Collection ID can only contain alphanumeric characters, hyphens, underscores, colons, and periods');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate all query parameters
 * @param {Object} params - Parsed query parameters
 * @returns {Object} { valid: boolean, errors: Object }
 */
function validateQueryParameters(params) {
  const errors = {};

  // Validate pagination
  const paginationValidation = validatePagination(params.pagination.limit, params.pagination.offset);
  if (!paginationValidation.valid) {
    errors.pagination = paginationValidation.errors;
  }

  // Validate bbox
  const bboxValidation = validateBbox(params.bbox);
  if (!bboxValidation.valid) {
    errors.bbox = bboxValidation.errors;
  }

  // Validate datetime
  const datetimeValidation = validateDatetime(params.datetime);
  if (!datetimeValidation.valid) {
    errors.datetime = datetimeValidation.errors;
  }

  // Validate sortby
  const sortbyValidation = validateSortby(params.sortby, [
    'id', 'title', 'description', 'keywords', 'license', 
    'providers', 'extent.spatial.bbox', 'extent.temporal.interval'
  ]);
  if (!sortbyValidation.valid) {
    errors.sortby = sortbyValidation.errors;
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}

module.exports = {
  validatePagination,
  validateBbox,
  validateDatetime,
  validateSortby,
  validateCollectionId,
  validateQueryParameters
};

