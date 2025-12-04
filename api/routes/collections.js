const express = require('express');
const router = express.Router();
const collectionsStore = require('../data/collections'); // change with the real collections when we have them
const { validateCollectionSearchParams } = require('../middleware/validateCollectionSearch');
const { query } = require('../db/db_APIconnection');
const { buildCollectionSearchQuery } = require('../db/buildCollectionSearchQuery');

// helper to run the built query (from documentation)
async function runQuery(sql, params = []) {
  try {
    const result = await query(sql, params);
    return result.rows;
  } catch (error) {
    console.error('Query error in /collections:', error);
    throw error;
  }
}

/**
 * GET /collections
 * Returns a paginated list of collections with optional filtering
 * 
 * Supported query parameters:
 *   - q: Free-text search across title, description, keywords
 *   - bbox: Spatial filter as minX,minY,maxX,maxY
 *   - datetime: Temporal filter (ISO8601 single or interval)
 *   - limit: Number of results (default 10, max 10000)
 *   - sortby: Sort by field (+field for ASC, -field for DESC)
 *   - token: Pagination continuation token (offset)
 * 
 * All parameters are validated by validateCollectionSearchParams middleware.
 * Validated/normalized values are available in req.validatedParams.
 */
router.get('/', validateCollectionSearchParams, async (req, res, next) => {
  // TODO: Think about the parameters `provider` and `license` - They are mentioned in the bid, but not in the STAC spec
  // TODO: Implement CQL2 filtering (GET endpoint) and add validator for `filter`, filter-lang` parameters
  // TODO: Apply filters to database query once DB is connected
  try {
    // validated parameters from middleware
    const { q, bbox, datetime, limit, sortby, token } = req.validatedParams;

    // build SQL querry and parameters
    const { sql, values } = buildCollectionSearchQuery({
      q,
      bbox,
      datetime,
      limit,
      sortby,
      token
    });

    // execute Query against database
    const collections = await runQuery(sql, values);
    const returned = collections.length;

    // Get total count for matched field
    // Build count query using same WHERE conditions
    const { sql: countSql, values: countValues } = buildCollectionSearchQuery({
      q,
      bbox,
      datetime,
      limit: null, // No limit for count
      sortby: null, // No sorting for count
      token: null   // No offset for count
    });
    
    // Replace SELECT with COUNT(*)
    const countQuery = countSql
      .replace(/SELECT[\s\S]*?FROM/, 'SELECT COUNT(*) as total FROM')
      .replace(/ORDER BY.*$/, '')
      .replace(/LIMIT.*$/, '');
    
    const countResult = await runQuery(countQuery, countValues);
    const matched = parseInt(countResult[0]?.total || 0);

    // Base URL for links
    const baseHost = `${req.protocol}://${req.get('host')}`;
    const baseUrl = `${baseHost}${req.baseUrl}`;

    const buildLink = (rel, tokenValue) => ({
      rel,
      href: `${baseUrl}?limit=${limit}&token=${tokenValue}`,
      type: 'application/json'
    });

    const links = [
      buildLink('self', token),
      {
        rel: 'root',
        href: baseHost,
        type: 'application/json'
      }
    ];

    // "next": only if returned === limit AND token + limit < matched
    if (returned === limit && token + limit < matched) {
      links.push(buildLink('next', token + limit));
    }

    // "prev": only if token > 0
    if (token > 0) {
      const prevToken = Math.max(0, token - limit);
      links.push(buildLink('prev', prevToken));
    }

    res.json({
      type: 'FeatureCollection',
      collections,
      links,
      context: {
        returned,
        limit,
        matched
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /collections/:id
 * Returns a single collection by ID. Includes all STAC Collection fields
 * (stac_version, type, title, description, license, extent, links, etc).
 * 
 * Returns:
 * - 200 OK with full Collection object if found
 * - 404 NotFound with proper error format if collection does not exist
 */
router.get('/:id', (req, res) => {
  // TODO: Create a proper validator middleware for :id parameter to avoid SQL injection, etc.
  const { id } = req.params;
  
  // Look up the collection in the data store by ID
  // When connected to a DB, replace this with a SQL query (SELECT * FROM collections WHERE id = ?)
  const collection = collectionsStore.find(c => c.id === id);
  
  if (!collection) {
    // Return 404 with standardized error format
    return res.status(404).json({
      code: 'NotFound',
      description: `Collection with id '${id}' not found`,
      id: id
    });
  }
  
  // Return the full STAC Collection object
  // Ensure the response includes at least self, root and parent links.
  // Start from any links the collection already provides and add missing ones.
  const baseHost = `${req.protocol}://${req.get('host')}`;
  const selfHref = `${baseHost}/collections/${id}`;
  const rootHref = baseHost;

  const existingLinks = Array.isArray(collection.links) ? collection.links.slice() : [];

  const hasRel = (rel) => existingLinks.some(l => l && l.rel === rel);

  if (!hasRel('self')) {
    existingLinks.push({ rel: 'self', href: selfHref, type: 'application/json' });
  }

  if (!hasRel('root')) {
    existingLinks.push({ rel: 'root', href: rootHref, type: 'application/json' });
  }

  // Prefer an existing parent link if present, otherwise fall back to root
  if (!hasRel('parent')) {
    existingLinks.push({ rel: 'parent', href: rootHref, type: 'application/json' });
  }

  // Return the collection with a normalized `links` array
  res.json(Object.assign({}, collection, { links: existingLinks }));
});

module.exports = router;
