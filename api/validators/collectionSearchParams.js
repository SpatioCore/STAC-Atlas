/**
 * Validators for STAC Collection Search query parameters
 * 
 * Each validator returns an object with:
 * - valid: boolean indicating if validation passed
 * - error: string with error message (if invalid)
 * - normalized: the normalized/parsed value (if valid)
 */

/**
 * Validates the 'q' (free-text search) parameter
 * @param {string} q - Free text search query
 * @returns {Object} { valid: boolean, error?: string, normalized?: string }
 */
function validateQ(q) {
  if (!q) return { valid: true }; // optional parameter
  
  if (typeof q !== 'string') {
    return { valid: false, error: 'Parameter "q" must be a string' };
  }
  
  if (q.length > 500) {
    return { valid: false, error: 'Parameter "q" exceeds maximum length of 500 characters' };
  }
  
  return { valid: true, normalized: q.trim() };
}

/**
 * Validates bbox parameter
 * Format: [minX, minY, maxX, maxY] or comma-separated string "minX,minY,maxX,maxY"
 * Also known as: [west, south, east, north]
 * 
 * @param {string|Array} bbox - Bounding box coordinates
 * @returns {Object} { valid: boolean, error?: string, normalized?: Array<number> }
 */
function validateBbox(bbox) {
  if (!bbox) return { valid: true };
  
  let coords;
  if (typeof bbox === 'string') {
    coords = bbox.split(',').map(v => parseFloat(v.trim()));
  } else if (Array.isArray(bbox)) {
    coords = bbox.map(v => parseFloat(v));
  } else {
    return { valid: false, error: 'Parameter "bbox" must be an array or comma-separated string' };
  }
  
  if (coords.length !== 4) {
    return { valid: false, error: 'Parameter "bbox" must contain exactly 4 coordinates [minX, minY, maxX, maxY]' };
  }
  
  if (coords.some(isNaN)) {
    return { valid: false, error: 'Parameter "bbox" contains invalid numeric values' };
  }
  
  const [minX, minY, maxX, maxY] = coords;
  
  // Validate longitude range
  if (minX < -180 || minX > 180 || maxX < -180 || maxX > 180) {
    return { valid: false, error: 'Parameter "bbox" longitude values must be between -180 and 180' };
  }
  
  // Validate latitude range
  if (minY < -90 || minY > 90 || maxY < -90 || maxY > 90) {
    return { valid: false, error: 'Parameter "bbox" latitude values must be between -90 and 90' };
  }
  
  // Validate logical ordering
  if (minX >= maxX) {
    return { valid: false, error: 'Parameter "bbox" minX must be less than maxX' };
  }
  
  if (minY >= maxY) {
    return { valid: false, error: 'Parameter "bbox" minY must be less than maxY' };
  }
  
  return { valid: true, normalized: coords };
}

/**
 * Validates datetime parameter (ISO8601)
 * Formats supported:
 * - Single datetime: "2020-01-01T00:00:00Z"
 * - Closed interval: "2019-01-01/2021-12-31"
 * - Open start: "../2021-12-31"
 * - Open end: "2019-01-01/.."
 * 
 * @param {string} datetime - ISO8601 datetime or interval
 * @returns {Object} { valid: boolean, error?: string, normalized?: string }
 */
function validateDatetime(datetime) {
  if (!datetime) return { valid: true };
  
  if (typeof datetime !== 'string') {
    return { valid: false, error: 'Parameter "datetime" must be a string' };
  }
  
  // Check for interval format
  if (datetime.includes('/')) {
    const parts = datetime.split('/');
    if (parts.length !== 2) {
      return { valid: false, error: 'Parameter "datetime" interval must have exactly one "/" separator' };
    }
    
    const [start, end] = parts;
    
    // Validate start (unless open-ended "..")
    if (start !== '..' && !isValidISO8601(start)) {
      return { valid: false, error: `Parameter "datetime" start value "${start}" is not valid ISO8601` };
    }
    
    // Validate end (unless open-ended "..")
    if (end !== '..' && !isValidISO8601(end)) {
      return { valid: false, error: `Parameter "datetime" end value "${end}" is not valid ISO8601` };
    }
    
    // Check that at least one bound is specified
    if (start === '..' && end === '..') {
      return { valid: false, error: 'Parameter "datetime" interval cannot be unbounded on both sides' };
    }
    
    return { valid: true, normalized: datetime };
  }
  
  // Single datetime
  if (!isValidISO8601(datetime)) {
    return { valid: false, error: `Parameter "datetime" value "${datetime}" is not valid ISO8601` };
  }
  
  return { valid: true, normalized: datetime };
}

/**
 * Helper function to validate ISO8601 datetime strings
 * @param {string} dateString - ISO8601 datetime string
 * @returns {boolean} true if valid ISO8601
 */
function isValidISO8601(dateString) {
  // Basic ISO8601 regex - supports dates with optional time
  // Examples: 2020-01-01, 2020-01-01T00:00:00Z, 2020-01-01T00:00:00+02:00
  const iso8601Regex = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?)?$/;
  
  if (!iso8601Regex.test(dateString)) {
    return false;
  }
  
  // Also validate that it's a real date
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

/**
 * Validates limit parameter
 * @param {string|number} limit - Maximum number of results to return
 * @returns {Object} { valid: boolean, error?: string, normalized?: number }
 */
function validateLimit(limit) {
  if (!limit) return { valid: true, normalized: 10 }; // default value
  
  // Check if limit contains a decimal point (reject floats)
  if (typeof limit === 'string' && limit.includes('.')) {
    return { valid: false, error: 'Parameter "limit" must be an integer, not a decimal' };
  }
  
  const num = parseInt(limit, 10);
  
  if (isNaN(num)) {
    return { valid: false, error: 'Parameter "limit" must be a valid integer' };
  }
  
  if (num < 1) {
    return { valid: false, error: 'Parameter "limit" must be at least 1' };
  }
  
  if (num > 10000) {
    return { valid: false, error: 'Parameter "limit" must not exceed 10000' };
  }
  
  return { valid: true, normalized: num };
}

/**
 * Validates sortby parameter
 * Format: "+field" (ascending) or "-field" (descending)
 * Allowed fields: title, id, license, created, updated
 * 
 * @param {string} sortby - Sort specification
 * @returns {Object} { valid: boolean, error?: string, normalized?: Object }
 */
function validateSortby(sortby) {
  // sortby is optional – if not provided, validation passes with undefined normalized value
  if (sortby === undefined || sortby === null) {
    return { valid: true, normalized: undefined };
  }

  const allowedFields = ['title', 'id', 'license', 'created', 'updated'];
  
  // Map API field names to database column names
  const fieldMapping = {
    'title': 'title',
    'id': 'stac_id',
    'license': 'license',
    'created': 'created_at',
    'updated': 'updated_at'
  };
  
  if (typeof sortby !== 'string') {
    return { valid: false, error: 'Parameter "sortby" must be a string' };
  }
  
  // Extract direction prefix and field name
  let direction = 'ASC';
  let field = sortby.trim();
  
  if (field.startsWith('+')) {
    direction = 'ASC';
    field = field.substring(1).trim();
  } else if (field.startsWith('-')) {
    direction = 'DESC';
    field = field.substring(1).trim();
  }

  // Check if field is empty (either empty string or only prefix without field name)
  if (!field) {
    return { 
      valid: false, 
      error: `Parameter "sortby" must specify a field. Allowed fields: ${allowedFields.join(', ')}`
    };
  }
  
  // Check if field is in allowed list
  if (!allowedFields.includes(field)) {
    return { 
      valid: false, 
      error: `Parameter "sortby" field "${field}" is not supported. Allowed fields: ${allowedFields.join(', ')}`
    };
  }
  
  // Map to actual database column name
  const dbField = fieldMapping[field];
  
  return { valid: true, normalized: { field: dbField, direction } };
}

/**
 * Validates token parameter (pagination continuation token)
 * @param {string|number} token - Pagination token (offset)
 * @returns {Object} { valid: boolean, error?: string, normalized?: number }
 */
function validateToken(token) {
  if (!token) return { valid: true, normalized: 0 }; // default to start
  
  const num = parseInt(token, 10);
  
  if (isNaN(num)) {
    return { valid: false, error: 'Parameter "token" must be a valid integer' };
  }
  
  if (num < 0) {
    return { valid: false, error: 'Parameter "token" must be non-negative' };
  }
  
  return { valid: true, normalized: num };
}

/**
 * Validates provider parameter
 * @param {string} provider - Provider name
 * @returns {Object} { valid: boolean, error?: string, normalized?: string }
 */
function validateProvider(provider) {
  if (!provider) return { valid: true };

  if (typeof provider !== 'string') {
    return { valid: false, error: 'Parameter "provider" must be a string' };
  }

  const trimmed = provider.trim();
  if (trimmed.length === 0) {
    return { valid: false, error: 'Parameter "provider" must not be empty' };
  }

  if (trimmed.length > 255) {
    return { valid: false, error: 'Parameter "provider" exceeds maximum length of 255 characters' };
  }

  return { valid: true, normalized: trimmed };
}

/**
 * Validates license parameter
 * @param {string} license - License identifier or name
 * @returns {Object} { valid: boolean, error?: string, normalized?: string }
 */
function validateLicense(license) {
  if (!license) return { valid: true };

  if (typeof license !== 'string') {
    return { valid: false, error: 'Parameter "license" must be a string' };
  }

  const trimmed = license.trim();
  if (trimmed.length === 0) {
    return { valid: false, error: 'Parameter "license" must not be empty' };
  }

  if (trimmed.length > 255) {
    return { valid: false, error: 'Parameter "license" exceeds maximum length of 255 characters' };
  }

  return { valid: true, normalized: trimmed };
}

/**
 * Validates active parameter (boolean filter for is_active)
 * @param {string|boolean} active - Whether to filter by active status
 * @returns {Object} { valid: boolean, error?: string, normalized?: boolean }
 */
function validateActive(active) {
  if (active === undefined || active === null || active === '') {
    return { valid: true }; // optional parameter
  }

  // Handle boolean values directly
  if (typeof active === 'boolean') {
    return { valid: true, normalized: active };
  }

  // Handle string values
  if (typeof active === 'string') {
    const lower = active.toLowerCase().trim();
    if (lower === 'true' || lower === '1' || lower === 'yes') {
      return { valid: true, normalized: true };
    }
    if (lower === 'false' || lower === '0' || lower === 'no') {
      return { valid: true, normalized: false };
    }
    return { valid: false, error: 'Parameter "active" must be a boolean (true/false)' };
  }

  return { valid: false, error: 'Parameter "active" must be a boolean (true/false)' };
}

/**
 * Validates api parameter (boolean filter for is_api)
 * @param {string|boolean} api - Whether to filter by API status
 * @returns {Object} { valid: boolean, error?: string, normalized?: boolean }
 */
function validateApi(api) {
  if (api === undefined || api === null || api === '') {
    return { valid: true }; // optional parameter
  }

  // Handle boolean values directly
  if (typeof api === 'boolean') {
    return { valid: true, normalized: api };
  }

  // Handle string values
  if (typeof api === 'string') {
    const lower = api.toLowerCase().trim();
    if (lower === 'true' || lower === '1' || lower === 'yes') {
      return { valid: true, normalized: true };
    }
    if (lower === 'false' || lower === '0' || lower === 'no') {
      return { valid: true, normalized: false };
    }
    return { valid: false, error: 'Parameter "api" must be a boolean (true/false)' };
  }

  return { valid: false, error: 'Parameter "api" must be a boolean (true/false)' };
}

/**
 * Validates filter parameter (CQL2)
 * @param {string|Object} filter - CQL2 filter
 * @returns {Object} { valid: boolean, error?: string, normalized?: string|Object }
 */
function validateFilter(filter) {
  if (!filter) return { valid: true };
  // Basic validation, deep validation happens in the route handler via cql2-wasm
  return { valid: true, normalized: filter };
}

/**
 * Validates filter-lang parameter
 * @param {string} lang - Filter language
 * @returns {Object} { valid: boolean, error?: string, normalized?: string }
 */
function validateFilterLang(lang) {
  if (!lang) return { valid: true };
  
  const validLangs = ['cql2-text', 'cql2-json'];
  if (!validLangs.includes(lang)) {
    return { valid: false, error: `Invalid filter-lang. Supported: ${validLangs.join(', ')}` };
  }
  
  return { valid: true, normalized: lang };
}

module.exports = {
  validateQ,
  validateBbox,
  validateDatetime,
  validateLimit,
  validateSortby,
  validateToken,
  validateProvider,
  validateLicense,
  validateActive,
  validateApi,
  validateFilter,
  validateFilterLang
};

