const express = require('express');
const router = express.Router();
const { CONFORMANCE_URIS } = require('../config/conformanceURIS');

/**
 * GET /
 * STAC API Landing Page
 * Returns basic information about the API and available endpoints
 * Source: https://docs.ogc.org/cs/25-005/25-005.html
 */
router.get('/', (req, res) => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  
  res.json({
    type: 'Catalog',
    id: 'stac-atlas',
    title: 'STAC Atlas',
    description: 'A centralized platform for managing, indexing, and providing STAC Collection metadata from distributed catalogs and APIs.',
    stac_version: '1.0.0',
    conformsTo: CONFORMANCE_URIS,
    links: [
      {
        rel: 'self',
        href: baseUrl,
        type: 'application/json',
        title: 'STAC Atlas Landing Page'
      },
      {
        rel: 'root',
        href: baseUrl,
        type: 'application/json',
        title: 'STAC Atlas root catalog'
      },
      {
        rel: 'conformance',
        href: `${baseUrl}/conformance`,
        type: 'application/json',
        title: 'STAC/OGC conformance classes'
      },
      {
        rel: 'data',
        href: `${baseUrl}/collections`,
        type: 'application/json',
        title: 'STAC Collections'
      },
      {
        rel: 'health', // Health check endpoint
        href: `${baseUrl}/health`,
        type: 'application/json',
        title: 'Health Check'
      },
      {
        rel: 'queryables',
        href: `${baseUrl}/collections-queryables`, //updated path
        type: 'application/schema+json',
        title: 'Queryables for Collections'
      },
      {
        rel: 'service-doc', // This should be the Swagger UI or similar
        href: `${baseUrl}/api-docs`,
        type: 'text/html',
        title: 'API documentation'
      },
      {
        rel: 'service-desc', // This should point to the OpenAPI spec (machine-readable)
        href: `${baseUrl}/openapi.yaml`,
        type: 'application/vnd.oai.openapi+json;version=3.0',
        title: 'OpenAPI specification'
      }
    ]
  });
});

module.exports = router;
