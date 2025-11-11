const express = require('express');
const router = express.Router();

/**
 * GET /conformance
 * Returns the conformance classes this API implements
 */
router.get('/', (req, res) => {
  res.json({
    conformsTo: [
      // STAC API Core
      'https://api.stacspec.org/v1.0.0/core',
      // OGC API Features Core
      'http://www.opengis.net/spec/ogcapi-features-1/1.0/conf/core',
      'http://www.opengis.net/spec/ogcapi-features-1/1.0/conf/oas30',
      'http://www.opengis.net/spec/ogcapi-features-1/1.0/conf/geojson',
      // STAC API - Collections
      'https://api.stacspec.org/v1.0.0/collections',
      // STAC Collection Search Extension
      'https://api.stacspec.org/v1.0.0/collection-search',
      // TODO: Add CQL2 conformance classes when implemented
      // 'http://www.opengis.net/spec/cql2/1.0/conf/basic-cql2',
      // 'http://www.opengis.net/spec/cql2/1.0/conf/advanced-comparison-operators',
    ]
  });
});

module.exports = router;
