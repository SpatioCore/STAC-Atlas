const express = require('express');
const router = express.Router();
const { validateQueryParams } = require('../middleware/queryValidation');
const { asyncHandler, NotFoundError } = require('../middleware/errorHandler');
const responseBuilder = require('../utils/responseBuilder');
const mockCollections = require('../mocks/collections');

// Apply query parameter validation to all collection routes
router.use(validateQueryParams);

/**
 * GET /collections
 * Returns all collections with pagination, filtering, and sorting
 * Implements STAC Collection Search Extension
 */
router.get('/', asyncHandler(async (req, res) => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const parsedQuery = req.parsedQuery;

  // Get all collections from mock data (TODO: replace with actual database query)
  let collections = mockCollections.searchMockCollections({
    search: parsedQuery.search,
    provider: parsedQuery.filters.provider,
    license: parsedQuery.filters.license,
    bbox: parsedQuery.bbox,
    datetime: parsedQuery.datetime
  });

  // Apply sorting
  if (parsedQuery.sortby && parsedQuery.sortby.length > 0) {
    collections = applySorting(collections, parsedQuery.sortby);
  }

  // Apply pagination
  const { limit, offset } = parsedQuery.pagination;
  const totalMatched = collections.length;
  const paginatedCollections = collections.slice(offset, offset + limit);
  const hasMore = offset + limit < totalMatched;

  // Build response
  const response = responseBuilder.buildCollectionsResponse({
    baseUrl,
    collections: paginatedCollections,
    pagination: { limit, offset },
    matched: totalMatched,
    hasMore,
    filters: {
      search: parsedQuery.search,
      bbox: req.query.bbox,
      datetime: req.query.datetime,
      sortby: req.query.sortby,
      provider: parsedQuery.filters.provider,
      license: parsedQuery.filters.license
    }
  });

  res.json(response);
}));

/**
 * GET /collections/:id
 * Returns a single collection by ID
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const baseUrl = `${req.protocol}://${req.get('host')}`;

  // Get collection from mock data (TODO: replace with actual database query)
  const collection = mockCollections.getMockCollectionById(id);

  if (!collection) {
    const error = new NotFoundError(`Collection with id '${id}' not found`);
    error.details = { id };
    throw error;
  }

  // Format and return collection
  const formattedCollection = responseBuilder.formatCollection(collection, baseUrl);
  res.json(formattedCollection);
}));

/**
 * Helper function to apply sorting to collections
 * @param {Array} collections - Array of collections
 * @param {Array} sortby - Array of { field, direction } objects
 * @returns {Array} Sorted collections
 */
function applySorting(collections, sortby) {
  return collections.sort((a, b) => {
    for (const sort of sortby) {
      const aValue = getNestedProperty(a, sort.field);
      const bValue = getNestedProperty(b, sort.field);

      if (aValue === undefined || bValue === undefined) continue;

      let comparison = 0;
      if (aValue < bValue) comparison = -1;
      if (aValue > bValue) comparison = 1;

      if (comparison !== 0) {
        return sort.direction === 'desc' ? -comparison : comparison;
      }
    }
    return 0;
  });
}

/**
 * Helper function to get nested object properties
 * @param {Object} obj - Object to search
 * @param {string} path - Dot-notation path (e.g., 'extent.spatial.bbox')
 * @returns {*} Value at path or undefined
 */
function getNestedProperty(obj, path) {
  return path.split('.').reduce((current, prop) => current?.[prop], obj);
}

module.exports = router;