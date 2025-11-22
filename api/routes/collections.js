const express = require('express');
const router = express.Router();
const collectionsStore = require('../data/collections');

/**
 * GET /collections
 * Returns a paginated list of collections (basic version)
 * Query params:
 *   - limit: number of collections to return (default 10, max 100)
 *   - offset: start index (default 0)
 */
router.get('/', (req, res) => {
  // Total available collections in the current data source
  const total = Array.isArray(collectionsStore) ? collectionsStore.length : 0;

  // Parse pagination params; fallback to sensible defaults
  let limit = parseInt(req.query.limit, 10);
  let offset = parseInt(req.query.offset, 10);

  // Validate and normalise inputs
  if (Number.isNaN(limit) || limit <= 0) limit = 10;
  if (Number.isNaN(offset) || offset < 0) offset = 0;
  if (limit > 100) limit = 100; // protect against very large requests

  // Compute slice indexes
  const start = offset;
  const end = Math.min(start + limit, total);

  // Slice the in-memory store. When connected to a DB, use LIMIT/OFFSET instead.
  const collections = collectionsStore.slice(start, end);

  // Base URL used for building pagination links
  const baseUrl = `${req.protocol}://${req.get('host')}/collections`;

  // Helper to build a single pagination link. We keep query params simple
  // (limit/offset) so clients can follow them easily. A token-based paging
  // scheme can be introduced later if needed for large datasets.
  const buildLink = (rel, offs) => ({
    rel,
    href: `${baseUrl}?limit=${limit}&offset=${offs}`,
    type: 'application/json'
  });

  // Always include a self and root link. Add next/prev when applicable.
  const links = [
    { rel: 'self', href: `${baseUrl}?limit=${limit}&offset=${offset}`, type: 'application/json' },
    { rel: 'root', href: `${req.protocol}://${req.get('host')}`, type: 'application/json' }
  ];

  if (end < total) {
    links.push(buildLink('next', end));
  }

  if (start > 0) {
    const prevOffset = Math.max(0, start - limit);
    links.push(buildLink('prev', prevOffset));
  }

  // Final response: STAC-like FeatureCollection wrapper
  res.json({
    type: 'FeatureCollection',
    collections,
    links,
    context: {
      returned: collections.length,
      limit: limit,
      matched: total
    }
  });
});

/**
 * GET /collections/:id
 * Returns a single collection by ID
 */
router.get('/:id', (req, res) => {
  const { id } = req.params;
  
  // TODO: Fetch collection from database
  // TODO: Return 404 if not found
  
  res.status(404).json({
    code: 'NotFound',
    description: `Collection with id '${id}' not found`,
    id: id
  });
});

module.exports = router;