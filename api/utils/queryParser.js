/**
 * Query Parameter Parser and Validator
 * Handles parsing and validation of STAC API query parameters
 */

/**
 * Parse and validate pagination parameters
 * @param {Object} query - Express query object
 * @returns {Object} { limit, offset, page }
 */
function parsePagination(query) {
  const DEFAULT_LIMIT = 10;
  const MAX_LIMIT = 100;
  const MIN_LIMIT = 1;

  let limit = parseInt(query.limit) || DEFAULT_LIMIT;
  let offset = parseInt(query.offset) || 0;

  // Validate limit
  if (limit < MIN_LIMIT) limit = MIN_LIMIT;
  if (limit > MAX_LIMIT) limit = MAX_LIMIT;

  // Validate offset
  if (offset < 0) offset = 0;

  return {
    limit,
    offset,
    page: Math.floor(offset / limit) + 1
  };
}

/**
 * Parse bounding box parameter (bbox)
 * Format: minX,minY,maxX,maxY or minX,minY,minZ,maxX,maxY,maxZ
 * @param {string} bboxString - Bbox as comma-separated string
 * @returns {Object|null} { minX, minY, maxX, maxY, minZ, maxZ } or null if invalid
 */
function parseBbox(bboxString) {
  if (!bboxString) return null;

  try {
    const coords = bboxString.split(',').map(Number);
    
    if (coords.length === 4) {
      const [minX, minY, maxX, maxY] = coords;
      
      // Validate coordinates
      if (minX >= maxX || minY >= maxY) {
        throw new Error('Invalid bbox: minX must be < maxX and minY must be < maxY');
      }
      
      return { minX, minY, maxX, maxY };
    } else if (coords.length === 6) {
      const [minX, minY, minZ, maxX, maxY, maxZ] = coords;
      
      if (minX >= maxX || minY >= maxY || minZ >= maxZ) {
        throw new Error('Invalid bbox: min values must be < max values');
      }
      
      return { minX, minY, minZ, maxX, maxY, maxZ };
    } else {
      throw new Error('Bbox must have 4 or 6 coordinates');
    }
  } catch (error) {
    return null;
  }
}

/**
 * Parse datetime parameter (RFC3339 format or interval)
 * Format: YYYY-MM-DD or YYYY-MM-DDTHH:MM:SSZ or start/end or start/..(open end)
 * @param {string} datetimeString - Datetime string
 * @returns {Object|null} { start, end } or null if invalid
 */
function parseDatetime(datetimeString) {
  if (!datetimeString) return null;

  try {
    // Handle interval format (start/end)
    if (datetimeString.includes('/')) {
      const [start, end] = datetimeString.split('/');
      
      return {
        start: start === '..' ? null : new Date(start),
        end: end === '..' ? null : new Date(end)
      };
    } else {
      // Single datetime (both start and end are the same)
      const date = new Date(datetimeString);
      return {
        start: date,
        end: date
      };
    }
  } catch (error) {
    return null;
  }
}

/**
 * Parse sort parameter (sortby)
 * Format: field:asc,field2:desc
 * @param {string} sortbyString - Sortby parameter
 * @returns {Array} Array of { field, direction } objects
 */
function parseSortby(sortbyString) {
  if (!sortbyString) return [];

  try {
    return sortbyString.split(',').map(item => {
      const [field, direction] = item.split(':');
      return {
        field: field.trim(),
        direction: (direction || 'asc').toLowerCase() === 'desc' ? 'desc' : 'asc'
      };
    });
  } catch (error) {
    return [];
  }
}

/**
 * Parse search query (q parameter)
 * @param {string} q - Search query
 * @returns {string|null} Search query or null
 */
function parseSearchQuery(q) {
  if (!q) return null;
  return String(q).trim();
}

/**
 * Parse and validate all query parameters
 * @param {Object} query - Express query object
 * @returns {Object} Parsed query parameters
 */
function parseQueryParameters(query) {
  return {
    pagination: parsePagination(query),
    bbox: parseBbox(query.bbox),
    datetime: parseDatetime(query.datetime),
    sortby: parseSortby(query.sortby),
    search: parseSearchQuery(query.q),
    filters: {
      provider: query.provider,
      license: query.license,
      keywords: query.keywords ? query.keywords.split(',') : []
    }
  };
}

module.exports = {
  parsePagination,
  parseBbox,
  parseDatetime,
  parseSortby,
  parseSearchQuery,
  parseQueryParameters
};
