const express = require('express');
const router = express.Router();
const { validateCollectionId } = require('../middleware/validateCollectionId');
const { validateCollectionSearchParams } = require('../middleware/validateCollectionSearch');
const { query } = require('../db/db_APIconnection');
const { buildCollectionSearchQuery } = require('../db/buildCollectionSearchQuery');
const { parseCql2Text, parseCql2Json } = require('../utils/cql2');
const { cql2ToSql } = require('../utils/cql2ToSql');
const { ErrorResponses } = require('../utils/errorResponse');

// helper to map DB row to STAC Collection object
function toStacCollection(row, baseHost) {
  // Use full_json as base and then add some additional fields from DB
  const collection = { ...row.full_json };

  // Save original id, source_stac_id and links from Full JSON into another 
  collection.source_id = collection.id;
  collection.source_links = collection.links;

  // Add source_url as new field
  collection.source_url = row.source_url;

  // Overwrite id and links with correct values from DB row
  collection.id = row.stac_id;
  collection.stac_id = row.stac_id;

  // TODO: Add is_active, is_api, last_crawled fields if needed

  // Add Links incase a baseHost is provided
  if (baseHost !== undefined) {
    collection.links = [
      {
        rel: "self",
        href: `${baseHost}/collections/${row.stac_id}`,
        title: 'The Collection itself'
      },
      {
        rel: "root",
        href: `${baseHost}`,
        title: 'STAC Atlas Landing Page'
      },
      {
        rel: "parent",
        href: `${baseHost}`,
        title: 'STAC Atlas Landing Page'
      }
    ];
  };

  return collection;
}

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
 *   - provider: Provider name — filter by data provider
 *   - license: License identifier — filter by collection license
 * 
 * All parameters are validated by validateCollectionSearchParams middleware.
 * Validated/normalized values are available in req.validatedParams.
 */

router.get('/', validateCollectionSearchParams, async (req, res, next) => {
  // TODO: Think about the parameters `provider` and `license` - They are mentioned in the bid, but not in the STAC spec
  try {
    // validated parameters from middleware
    const { q, bbox, datetime, limit, sortby, token, provider, license, filter } = req.validatedParams;
    const filterLang = req.validatedParams['filter-lang'] || 'cql2-text'; // seperate extraction due to hyphen and default value

    let cqlFilter = undefined;
    if (filter) {
        try {
            let cqlJson;
            if (filterLang === 'cql2-text') {
                cqlJson = await parseCql2Text(filter);
            } else if (filterLang === 'cql2-json') {
                cqlJson = await parseCql2Json(filter);
            }
            
            if (cqlJson) {
                const values = [];
                const sql = cql2ToSql(cqlJson, values);
                cqlFilter = { sql, values };
            }
        } catch (err) {
            return res.status(400).json({
                code: 'InvalidParameterValue',
                description: `Invalid filter expression: ${err.message}`
            });
        }
    }

    // build SQL querry and parameters
    const { sql, values } = buildCollectionSearchQuery({
      q,
      bbox,
      datetime,
      provider,
      license,
      limit,
      sortby,
      token,
      cqlFilter
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
      { rel: 'root', href: baseHost, type: 'application/json' },
      { rel: 'parent', href: baseHost, type: 'application/json' }
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
      context: {
        returned,
        matched,
        limit
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

// Build params depending on id type
const queryParams = {
  limit: 1,
  token: 0,
  id: id
};

const { sql, values } = buildCollectionSearchQuery(queryParams);

const rows = await runQuery(sql, values);

    if (!rows || rows.length === 0) {
      // Return 404 with RFC 7807 format
      const errorResponse = ErrorResponses.notFound(
        `Collection with id '${id}' not found`,
        req.requestId,
        req.originalUrl
      );
      errorResponse.id = id; // Add collection id for context
      return res.status(404).json(errorResponse);
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
      { rel: 'self', href: selfHref, type: 'application/json', title: 'The collection itself' },
      { rel: 'root', href: rootHref, type: 'application/json', title: 'STAC Atlas Landing Page' },
      { rel: 'parent', href: `${rootHref}`, type: 'application/json', title: 'STAC Atlas Landing Page' }
    ];
   const collection_id = toStacCollection(row);
    // Return the collection with a normalized `links` array.
    // The rest of the attributes (id, title, extent, full_json, …) come directly
    // from the query builder / database.
    res.json(Object.assign({}, collection_id, { links }));
  } catch (error) {
    next(error);
  }
});

module.exports = router;
