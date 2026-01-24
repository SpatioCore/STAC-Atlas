const express = require('express');
const router = express.Router();

const { buildCollectionsQueryablesSchema } = require('../config/queryablesSchema');

/**
 * GET /collections-queryables
 * Returns the queryables schema for STAC Collections
 *  
 */
router.get('/', (req, res) => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const schema = buildCollectionsQueryablesSchema(baseUrl);

  // proper media type for queryables schema
  res.setHeader('Content-Type', 'application/schema+json');
  res.json(schema);
});

module.exports = router;