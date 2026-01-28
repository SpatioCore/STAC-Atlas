const express = require('express');
const router = express.Router();

const { buildCollectionsQueryablesSchema } = require('../config/queryablesSchema');

/**
 * GET /collections-queryables
 * Returns the queryables schema for STAC Collections
 * Conforms to OGC API Features Part 3 (Filtering) and STAC API Filter Extension
 */
router.get('/', (req, res) => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const selfUrl = `${baseUrl}/collections-queryables`;
  const schema = buildCollectionsQueryablesSchema(baseUrl);

  // Add required links for STAC/OGC conformance
  const response = {
    ...schema,
    links: [
      {
        rel: 'self',
        href: selfUrl,
        type: 'application/schema+json',
        title: 'This queryables document'
      },
      {
        rel: 'root',
        href: baseUrl,
        type: 'application/json',
        title: 'STAC Atlas Landing Page'
      },
      {
        rel: 'parent',
        href: baseUrl,
        type: 'application/json',
        title: 'STAC Atlas Landing Page'
      }
    ]
  };

  // Set proper media type for queryables schema
  res.setHeader('Content-Type', 'application/schema+json');
  res.json(response);
});

module.exports = router;