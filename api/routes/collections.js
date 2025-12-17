const express = require('express');
const router = express.Router();
const { validateCollectionSearchParams } = require('../middleware/validateCollectionSearch');
const { query } = require('../db/db_APIconnection');
const { buildCollectionSearchQuery } = require('../db/buildCollectionSearchQuery');

// helper to run the built query (from documentation)
async function runQuery(sql, params = []) {
  const result = await query(sql, params);
  return result.rows;
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
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Use the same SQL structure as the list endpoint
    const sql = `
      SELECT 
        id, 
        stac_version, 
        type, 
        title, 
        description, 
        license,
        spatial_extend,
        temporal_extend_start,
        temporal_extend_end,
        created_at,
        updated_at,
        is_api,
        is_active,
        full_json
      FROM collection
      WHERE id = $1
    `;
    
    const collections = await runQuery(sql, [id]);
    
    if (!collections || collections.length === 0) {
      // Return 404 with standardized error format
      return res.status(404).json({
        code: 'NotFound',
        description: `Collection with id '${id}' not found`,
        id: id
      });
    }
    
    const collection = collections[0];
    
    // Build standardized links
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

    if (!hasRel('parent')) {
      existingLinks.push({ rel: 'parent', href: rootHref, type: 'application/json' });
    }

    // Return the collection with normalized links array
    res.json(Object.assign({}, collection, { links: existingLinks }));
  } catch (error) {
    next(error);
  }
});

module.exports = router;
