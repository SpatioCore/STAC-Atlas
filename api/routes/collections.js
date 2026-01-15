const express = require('express');
const router = express.Router();
const { validateCollectionId } = require('../middleware/validateCollectionId');
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
 *   - provider: Provider name — filter by data provider
 *   - license: License identifier — filter by collection license
 * 
 * All parameters are validated by validateCollectionSearchParams middleware.
 * Validated/normalized values are available in req.validatedParams.
 */
router.get('/', validateCollectionSearchParams, async (req, res, next) => {
  // TODO: Think about the parameters `provider` and `license` - They are mentioned in the bid, but not in the STAC spec
  // TODO: Implement CQL2 filtering (GET endpoint) and add validator for `filter`, filter-lang` parameters
  try {
    // validated parameters from middleware
    const { q, bbox, datetime, limit, sortby, token, provider, license } = req.validatedParams;

    // build SQL querry and parameters
    const { sql, values } = buildCollectionSearchQuery({
      q,
      bbox,
      datetime,
      provider,
      license,
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
      provider,
      license,
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
 * Returns a single collection by ID.
 *
 * Behaviour:
 * - Uses the shared buildCollectionSearchQuery helper with an `id` filter
 *   so that GET /collections and GET /collections/:id stay aligned.
 * - Returns:
 *   - 200 OK with a single Collection object if found
 *   - 404 NotFound with standardized error body if the collection does not exist
 *
 * Note:
 * - The exact shape / fields of the returned collection are controlled by the
 *   SELECT part in buildCollectionSearchQuery. This allows the query builder
 *   (and later a mapping layer) to evolve without touching this route.
 */
router.get('/:id', validateCollectionId, async (req, res, next) => {
  try {
    const { id } = req.params;

    // id is already syntactically validated by validateCollectionId.
    // For the database we use a numeric id, matching the c.collection.id column type.
    const numericId = parseInt(id, 10);

    // Reuse the shared query builder with an exact id filter.
    // We request a single row (LIMIT 1) and no offset.
    const { sql, values } = buildCollectionSearchQuery({
      id: numericId,
      limit: 1,
      token: 0,
    });

    const rows = await runQuery(sql, values);

    if (!rows || rows.length === 0) {
      // Return 404 with standardized error format
      return res.status(404).json({
        code: 'NotFound',
        description: `Collection with id '${id}' not found`,
        id: id
      });
    }

        const collection = rows[0];

    const baseHost = `${req.protocol}://${req.get('host')}`;
    const selfHref = `${baseHost}${req.originalUrl}`;
    const rootHref = baseHost;

    // TODO:
    //   Currently we always construct a minimal set of STAC-style links here.
    //   The crawler already stores the upstream links in full_json, but we do
    //   not extract or persist them as a separate links column yet.
    //   In the future we might want to parse those links and merge them here.
    const links = [
      { rel: 'self', href: selfHref, type: 'application/json' },
      { rel: 'root', href: rootHref, type: 'application/json' },
      { rel: 'parent', href: rootHref, type: 'application/json' }
    ];

    // Return the collection with a normalized `links` array.
    // The rest of the attributes (id, title, extent, full_json, …) come directly
    // from the query builder / database.
    res.json(Object.assign({}, collection, { links }));
  } catch (error) {
    next(error);
  }
});

module.exports = router;
