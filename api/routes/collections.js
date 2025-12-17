const express = require('express');
const router = express.Router();
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
  // Normalizes STAC-required fields (extent, links), coerces IDs to strings,
  // and removes null optional fields for spec compliance.
  // TODO: Think about the parameters `provider` and `license` - They are mentioned in the bid, but not in the STAC spec
  // TODO: Implement CQL2 filtering (GET endpoint) and add validator for `filter`, filter-lang` parameters
  try {
    // validated parameters from middleware
    const { q, bbox, datetime, limit, sortby, token } = req.validatedParams;

    // try to use database
    let collections;
    try {
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
      collections = await runQuery(sql, values);

      // Shape DB rows to STAC structure if needed (add extent)
      // DB stores spatial/temporal separately; STAC expects `extent` combining them.
      collections = collections.map(row => {
        if (row && (row.extent || (!row.spatial_extend && !row.temporal_extend_start && !row.temporal_extend_end))) {
          return row;
        }

        const extent = {};
        if (row.spatial_extend) {
          // We set a world bbox here; adjust if precise bbox is required later
          extent.spatial = { bbox: [[-180, -90, 180, 90]] };
        }
        if (row.temporal_extend_start || row.temporal_extend_end) {
          const start = row.temporal_extend_start ? new Date(row.temporal_extend_start).toISOString() : null;
          const end = row.temporal_extend_end ? new Date(row.temporal_extend_end).toISOString() : null;
          extent.temporal = { interval: [[start, end]] };
        }
        return Object.assign({}, row, { extent });
      });
    } catch (dbError) {
      // Database connection failed
      console.error('Database query failed:', dbError.message);
      res.status(503).json({
        code: 'ServiceUnavailable',
        description: 'Database service is not available',
        error: dbError.message
      });
      return;
    }
    
    const returned = collections.length;

    // Get total count for matched field
    let matched;
    try {
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
      matched = parseInt(countResult[0]?.total || 0);
    } catch (countError) {
      // Count query failed - database error
      console.error('Count query failed:', countError.message);
      res.status(503).json({
        code: 'ServiceUnavailable',
        description: 'Database service is not available',
        error: countError.message
      });
      return;
    }

    // Base URL for links
    const baseHost = `${req.protocol}://${req.get('host')}`;
    const baseUrl = `${baseHost}${req.baseUrl}`;

    const buildLink = (rel, tokenValue) => ({
      rel,
      href: `${baseUrl}?limit=${limit}&token=${tokenValue}`,
      type: 'application/json'
    });

    // self link should mirror the requested URL (no synthesized query params)
    const selfLink = {
      rel: 'self',
      href: `${baseHost}${req.originalUrl || req.baseUrl}`,
      type: 'application/json'
    };

    const links = [
      selfLink,
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

    // Add required links to each collection if not present
    const enrichedCollections = collections.map(collection => {
      const colSelfHref = `${baseHost}/collections/${collection.id}`;
      const rootHref = baseHost;

      const existingLinks = Array.isArray(collection.links) ? collection.links.slice() : [];
      const filteredLinks = existingLinks.filter(l => !l || !['self', 'root', 'parent'].includes(l.rel));

      filteredLinks.push({
        rel: 'self',
        href: colSelfHref,
        type: 'application/json',
        title: collection.title || collection.id
      });

      filteredLinks.push({
        rel: 'root',
        href: rootHref,
        type: 'application/json',
        title: 'STAC Atlas'
      });

      filteredLinks.push({
        rel: 'parent',
        href: rootHref,
        type: 'application/json',
        title: 'Parent'
      });

      // Ensure stac_extensions is an array (STAC spec requires array, not null)
      const stac_extensions = Array.isArray(collection.stac_extensions) 
        ? collection.stac_extensions 
        : [];

      // Ensure id is a string (STAC spec requires string IDs)
      const id = typeof collection.id === 'string' ? collection.id : String(collection.id);

      // Remove null optional fields or convert to correct type for STAC compliance
      const cleaned = Object.assign({}, collection, { id, links: filteredLinks, stac_extensions });
      
      // Remove null assets, summaries (optional in STAC, should be omitted if not present)
      if (cleaned.assets === null) delete cleaned.assets;
      if (cleaned.summaries === null) delete cleaned.summaries;

      return cleaned;
    });
    
    res.json({
      collections: enrichedCollections,
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
    
    // Query the database for the collection by ID
    const sql = 'SELECT * FROM collections WHERE id = $1';
    const result = await query(sql, [id]);
    
    if (result.rows.length === 0) {
      // Return 404 with standardized error format
      return res.status(404).json({
        code: 'NotFound',
        description: `Collection with id '${id}' not found`,
        id: id
      });
    }
    
    const collection = result.rows[0];
  
  // Return the full STAC Collection object
  // Ensure the response includes at least self, root and parent links.
  // Start from any links the collection already provides and add missing ones.
  const baseHost = `${req.protocol}://${req.get('host')}`;
  const selfHref = `${baseHost}/collections/${id}`;
  const rootHref = baseHost;

  const existingLinks = Array.isArray(collection.links) ? collection.links.slice() : [];
  const filteredLinks = existingLinks.filter(l => !l || !['self', 'root', 'parent'].includes(l.rel));

  filteredLinks.push({
    rel: 'self',
    href: selfHref,
    type: 'application/json',
    title: collection.title || collection.id
  });

  filteredLinks.push({
    rel: 'root',
    href: rootHref,
    type: 'application/json',
    title: 'STAC Atlas'
  });

  filteredLinks.push({
    rel: 'parent',
    href: rootHref,
    type: 'application/json',
    title: 'Parent'
  });

  // Ensure stac_extensions is an array (STAC spec requires array, not null)
  const stac_extensions = Array.isArray(collection.stac_extensions) 
    ? collection.stac_extensions 
    : [];

  // Ensure id is a string (STAC spec requires string IDs)
  const collectionId = typeof collection.id === 'string' ? collection.id : String(collection.id);

  // Build response and remove null optional fields for STAC compliance
  const collectionResponse = Object.assign({}, collection, { id: collectionId, links: filteredLinks, stac_extensions });
  
  // Remove null assets, summaries (optional in STAC, should be omitted if not present)
  if (collectionResponse.assets === null) delete collectionResponse.assets;
  if (collectionResponse.summaries === null) delete collectionResponse.summaries;

  // Return the collection with a normalized `links` array and stac_extensions
  res.json(collectionResponse);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
