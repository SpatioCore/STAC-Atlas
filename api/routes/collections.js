const express = require('express');
const router = express.Router();
const { validateCollectionId } = require('../middleware/validateCollectionId');
const { validateCollectionSearchParams } = require('../middleware/validateCollectionSearch');
const { query } = require('../db/db_APIconnection');
const { buildCollectionSearchQuery } = require('../db/buildCollectionSearchQuery');
const { parseCql2Text, parseCql2Json } = require('../utils/cql2');
const { cql2ToSql } = require('../utils/cql2ToSql');
const { ErrorResponses } = require('../utils/errorResponse');

/**
 * Resolves a relative href against a base source URL.
 * Handles both absolute URLs (starting with http/https) and relative paths.
 * 
 * @param {string} href - The href to resolve (can be absolute or relative)
 * @param {string} sourceUrl - The base source URL to resolve against
 * @returns {string} The resolved absolute URL
 */
function resolveHref(href, sourceUrl) {
  if (!href) return href;
  
  // If href is already absolute, return as-is
  if (href.startsWith('http://') || href.startsWith('https://')) {
    return href;
  }
  
  // If no source URL, we can't resolve relative paths
  if (!sourceUrl) return href;
  
  try {
    // Use URL constructor to resolve relative paths
    return new URL(href, sourceUrl).href;
  } catch (e) {
    // If URL resolution fails, return original href
    console.warn(`Failed to resolve href '${href}' against source '${sourceUrl}':`, e.message);
    return href;
  }
}

/**
 * Processes source links and categorizes them into item links and other links.
 * Item links are kept with their original rel, other links get "source_" prefix.
 * 
 * @param {Array} sourceLinks - Array of links from the original STAC source
 * @param {string} sourceUrl - The base source URL for resolving relative hrefs
 * @returns {Array} Processed links ready to append to collection links
 */
function processSourceLinks(sourceLinks, sourceUrl) {
  if (!sourceLinks || !Array.isArray(sourceLinks)) return [];
  
  const processedLinks = [];
  
  for (const link of sourceLinks) {
    if (!link || !link.rel) continue;
    
    const rel = link.rel.toLowerCase();
    const resolvedHref = resolveHref(link.href, sourceUrl);
    
    if (rel === 'item' || rel === 'items') {
      // Item links: keep rel as-is, add source hint to title
      processedLinks.push({
        rel: link.rel,
        href: resolvedHref,
        type: link.type || 'application/json',
        title: link.title 
          ? `${link.title} (Source Item Reference)` 
          : 'Source Item Reference'
      });
    } else {
      // Other links: prefix rel with "source_", add source hint to title
      processedLinks.push({
        rel: `source_${link.rel}`,
        href: resolvedHref,
        type: link.type || 'application/json',
        title: link.title 
          ? `${link.title} (Original Source Link)` 
          : `Original Source ${link.rel} Link`
      });
    }
  }
  
  return processedLinks;
}

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

  // Add other fields from DB row
  collection.is_active = row.is_active;
  collection.is_api = row.is_api;

  // Add Links incase a baseHost is provided
  if (baseHost !== undefined) {
    // Base links: our own STAC Atlas links
    const baseLinks = [
      {
        rel: "self",
        href: `${baseHost}/collections/${row.stac_id}`,
        type: 'application/json',
        title: 'The Collection itself'
      },
      {
        rel: "root",
        href: `${baseHost}`,
        type: 'application/json',
        title: 'STAC Atlas Landing Page'
      },
      {
        rel: "parent",
        href: `${baseHost}`,
        type: 'application/json',
        title: 'STAC Atlas Landing Page'
      }
    ];
    
    // Process and append source links
    const sourceLinks = processSourceLinks(collection.source_links, row.source_url);
    
    collection.links = [...baseLinks, ...sourceLinks];
  };

  // Remove source_links from final output to avoid confusion
  delete collection.source_links;

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
 *   - active: Boolean — filter by collection active status (is_active)
 *   - api: Boolean — filter by API status (is_api)
 * 
 * All parameters are validated by validateCollectionSearchParams middleware.
 * Validated/normalized values are available in req.validatedParams.
 */

router.get('/', validateCollectionSearchParams, async (req, res, next) => {
  try {
    // validated parameters from middleware
    const { q, bbox, datetime, limit, sortby, token, provider, license, active, api, filter } = req.validatedParams;
    const filterLang = req.validatedParams['filter-lang'] || 'cql2-text'; // seperate extraction due to hyphen and default value

    let cqlFilter = undefined;
    if (filter) {
        try {
            // Clean up TIMESTAMP(...) wrappers that some clients (like STAC Browser) add
            // Example: "created_at < TIMESTAMP('2026-02-03T15:39:18.588Z')" -> "created_at < '2026-02-03T15:39:18.588Z'"
            // This is necessary because cql2-wasm parser doesn't recognize TIMESTAMP() as a valid function
            let cleanedFilter = filter;
            if (filterLang === 'cql2-text') {
                cleanedFilter = filter.replace(/TIMESTAMP\(([^)]+)\)/g, '$1');
            }
            
            let cqlJson;
            if (filterLang === 'cql2-text') {
                cqlJson = await parseCql2Text(cleanedFilter);
            } else if (filterLang === 'cql2-json') {
                cqlJson = await parseCql2Json(cleanedFilter);
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
      active,
      api,
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
      active,
      api,
      cqlFilter,   // Include CQL2 filter for accurate count
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
      { rel: 'parent', href: baseHost, type: 'application/json' },
      { rel: 'http://www.opengis.net/def/rel/ogc/1.0/queryables', href: `${baseHost}/collection-queryables`, type: 'application/schema+json', title: 'Queryables for collection search' }
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

    // Map to STAC Collection
    const collection_id = toStacCollection(row, baseHost);

    res.json(collection_id);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
