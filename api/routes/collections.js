const express = require('express');
const router = express.Router();

/**
 * GET /collections
 * Returns all collections with pagination, filtering, and sorting
 * Implements STAC Collection Search Extension
 */
router.get('/', (req, res) => {
  // TODO: Implement collection search with filters (q, bbox, datetime, provider, license, etc.)
  // TODO: Implement CQL2 filtering
  // TODO: Add pagination (limit, offset/token)
  // TODO: Add sorting (sortby parameter)
  
  res.json({
    type: 'FeatureCollection',
    collections: [],
    links: [
      {
        rel: 'self',
        href: `${req.protocol}://${req.get('host')}/collections`,
        type: 'application/json'
      },
      {
        rel: 'root',
        href: `${req.protocol}://${req.get('host')}`,
        type: 'application/json'
      }
    ],
    context: {
      returned: 0,
      limit: 10,
      matched: 0
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




//TEST