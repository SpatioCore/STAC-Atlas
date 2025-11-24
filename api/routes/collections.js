const express = require('express');
const router = express.Router();
const collectionsStore = require('../data/collections'); // change with the real  collections when we have them

/**
 * GET /collections
 * Returns a paginated list of collections (basic version)
 * Query params:
 *   - limit: number of collections to return (default 10, max 100)
 *   - token : start index (default 0)
 */
router.get('/', (req, res) => {
  // Total available collections in the current data source
  const total = Array.isArray(collectionsStore) ? collectionsStore.length : 0;

  // Parse pagination params; fallback to sensible defaults
  let limit = parseInt(req.query.limit, 10);
  let token  = parseInt(req.query.token , 10);

  // Validate and normalise inputs
  if (Number.isNaN(limit) || limit <= 0) limit = 10;
  if (Number.isNaN(token ) || token  < 0) token  = 0;
  if (limit > 100) limit = 100; // protect against very large requests

  // Compute slice indexes
  const start = token ;
  const end = Math.min(start + limit, total);

  // Slice the in-memory store. When connected to a DB, use LIMIT/token  instead.
  const collections = collectionsStore.slice(start, end);

  // Base URL used for building pagination links
  const baseUrl = `${req.protocol}://${req.get('host')}/collections`;

  // Helper to build a single pagination link. We keep query params simple
  // (limit/token ) so clients can follow them easily. A token-based paging
  // scheme can be introduced later if needed for large datasets.
  const buildLink = (rel, offs) => ({
    rel,
    href: `${baseUrl}?limit=${limit}&token =${offs}`,
    type: 'application/json'
  });

  // Always include a self and root link. Add next/prev when applicable.
  const links = [
    { rel: 'self', href: `${baseUrl}?limit=${limit}&token =${token }`, type: 'application/json' },
    { rel: 'root', href: `${req.protocol}://${req.get('host')}`, type: 'application/json' }
  ];

  if (end < total) {
    links.push(buildLink('next', end));
  }

  if (start > 0) {
    const prevtoken  = Math.max(0, start - limit);
    links.push(buildLink('prev', prevtoken ));
  }

  // Final response: STAC-like FeatureCollection wrapper
  res.json({
    collections,
    links,
    context: {
      returned: collections.length, // Count of returned collections by this request
      limit: limit,                             // Requested site-limit
      matched: total                      // Number of all available collections
    }
  });
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
  res.json(collection);
});

module.exports = router;