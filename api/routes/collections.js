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
      // Fallback to in-memory data store if database is not available
      // Keep behavior consistent: basic q filter, sort, and pagination.
      console.warn('Database query failed, using in-memory data store:', dbError.message);
      collections = collectionsStore;
      
      // Apply basic filtering to in-memory data
      if (q) {
        const qLower = q.toLowerCase();
        collections = collections.filter(c => 
          (c.title && c.title.toLowerCase().includes(qLower)) ||
          (c.description && c.description.toLowerCase().includes(qLower)) ||
          (c.keywords && c.keywords.some(k => k.toLowerCase().includes(qLower)))
        );
      }
      
      if (sortby) {
        // sortby is normalized by validator to { field: <db_field>, direction: 'ASC'|'DESC' }
        const dbField = sortby.field;
        const direction = sortby.direction;

        // Map DB field names to in-memory keys
        const inMemoryFieldMap = {
          id: 'id',
          title: 'title',
          license: 'license',
          created_at: 'created',
          updated_at: 'updated'
        };

        const fieldKey = inMemoryFieldMap[dbField] || dbField;

        collections = [...collections].sort((a, b) => {
          const aVal = a[fieldKey] ?? '';
          const bVal = b[fieldKey] ?? '';

          // Date-aware compare for created/updated
          const isDateField = fieldKey === 'created' || fieldKey === 'updated';
          let comparison;
          if (isDateField) {
            const aTime = aVal ? new Date(aVal).getTime() : 0;
            const bTime = bVal ? new Date(bVal).getTime() : 0;
            comparison = aTime === bTime ? 0 : (aTime < bTime ? -1 : 1);
          } else {
            comparison = String(aVal).localeCompare(String(bVal));
          }

          return direction === 'DESC' ? -comparison : comparison;
        });
      }
      
      // Apply pagination
      const start = token || 0;
      collections = collections.slice(start, start + limit);
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
      // Fallback to in-memory count
      console.warn('Count query failed, using in-memory count:', countError.message);
      matched = collectionsStore.length;
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
router.get('/:id', (req, res) => {
  // STAC single-collection endpoint backed by in-memory store.
  // Normalizes links, ensures `stac_extensions`, and converts id to string.
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
  const result = Object.assign({}, collection, { id: collectionId, links: filteredLinks, stac_extensions });
  
  // Remove null assets, summaries (optional in STAC, should be omitted if not present)
  if (result.assets === null) delete result.assets;
  if (result.summaries === null) delete result.summaries;

  // Return the collection with a normalized `links` array and stac_extensions
  res.json(result);
});

module.exports = router;
