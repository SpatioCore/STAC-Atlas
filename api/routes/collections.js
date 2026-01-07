const express = require('express');
const router = express.Router();
const { validateCollectionId } = require('../middleware/validateCollectionId');
const { validateCollectionSearchParams } = require('../middleware/validateCollectionSearch');
const { query } = require('../db/db_APIconnection');
const { buildCollectionSearchQuery } = require('../db/buildCollectionSearchQuery');

// helper to map DB row to STAC Collection object
// the full_json column contains the original STAC Collection Json as crawled but it is needed to set some fields/links correctly
function toStacCollection(row, baseHost) {
  const base =
    row.full_json &&
    typeof row.full_json === 'object' &&
    !Array.isArray(row.full_json)
      ? row.full_json
      : {};

  const id = base.id ?? String(row.id);

  const collection = {
    // merge full_json first to override/normalize below
    ...base,
    type: 'Collection',
    stac_version: base.stac_version ?? row.stac_version ?? '1.1.0',
    id,
    title: base.title ?? row.title ?? id,
    description: base.description ?? row.description ?? '',
    license: base.license ?? row.license ?? 'proprietary',
  };

  // assets must be an object/dict if present
  if (collection.assets === null || collection.assets === undefined) {
    delete collection.assets;
  } else if (Array.isArray(collection.assets)) {
    delete collection.assets;
  } else if (typeof collection.assets !== 'object') {
    delete collection.assets;
  }

  if (collection.summaries === null || collection.summaries === undefined) {
    delete collection.summaries;
  } else if (Array.isArray(collection.summaries) || typeof collection.summaries !== 'object') {
    delete collection.summaries;
  }

  if (!collection.extent) {
    const hasBbox =
      row.minx !== null && row.miny !== null && row.maxx !== null && row.maxy !== null;

    collection.extent = {
      spatial: {
        bbox: hasBbox ? [[row.minx, row.miny, row.maxx, row.maxy]] : [[-180, -90, 180, 90]],
      },
      temporal: {
        interval: [[
          row.temporal_extend_start ? new Date(row.temporal_extend_start).toISOString() : null,
          row.temporal_extend_end ? new Date(row.temporal_extend_end).toISOString() : null,
        ]],
      },
    };
  }

  // ensure links exist
  collection.links = [
    { rel: 'self', href: `${baseHost}/collections/${encodeURIComponent(id)}`, type: 'application/json' },
    { rel: 'parent', href: `${baseHost}`, type: 'application/json' },
    { rel: 'root', href: `${baseHost}`, type: 'application/json' }
  ];

  return collection;
}

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
    const baseHost = `${req.protocol}://${req.get('host')}`;
    const rows = await runQuery(sql, values);
    const returned = rows.length;
    const collections = rows.map(r => toStacCollection(r, baseHost));
    

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


    // self MUST match the requested URL exactly (validator requirement)
    const selfHref = `${baseHost}${req.originalUrl}`;

    // helper to create pagination links while keeping existing query params
    function withToken(newToken) {
      const url = new URL(selfHref);
      url.searchParams.set('limit', String(limit));
      url.searchParams.set('token', String(newToken));
      return url.toString();
    }

    const links = [
      { rel: 'self', href: selfHref, type: 'application/json' },
      { rel: 'root', href: baseHost, type: 'application/json' }
    ];

    // "next": only if returned === limit AND token + limit < matched
    if (returned === limit && token + limit < matched) {
      links.push({ rel: 'next', href: withToken(token + limit), type: 'application/json' });
    }

    // "prev": only if token > 0
    if (token > 0) {
      const prevToken = Math.max(0, token - limit);
      links.push({ rel: 'prev', href: withToken(prevToken), type: 'application/json' });
    }

    res.json({
      collections,
      links,
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

// Numeric: use numeric filter
const numericId = Number(id);
const isNumericId = Number.isFinite(numericId) && String(numericId) === String(id);

// Build params depending on id type
const queryParams = {
  limit: 1,
  token: 0,
};

if (isNumericId) {
  queryParams.id = numericId;
} else {
  // STAC Collection IDs are strings use string filter
  queryParams.collectionId = id;
}

const { sql, values } = buildCollectionSearchQuery(queryParams);

const rows = await runQuery(sql, values);

    if (!rows || rows.length === 0) {
      // Return 404 with standardized error format
      return res.status(404).json({
        code: 'NotFound',
        description: `Collection with id '${id}' not found`,
        id: id
      });
    }

        const row = rows[0];

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
   const collection_id = toStacCollection(row, baseHost);
    // Return the collection with a normalized `links` array.
    // The rest of the attributes (id, title, extent, full_json, …) come directly
    // from the query builder / database.
    res.json(Object.assign({}, collection_id, { links }));
  } catch (error) {
    next(error);
  }
});

module.exports = router;
