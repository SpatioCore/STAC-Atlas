const express = require('express');
const router = express.Router();

/**
 * GET /
 * STAC API Landing Page
 * Returns basic information about the API and available endpoints
 */
router.get('/', (req, res) => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;

  // Prefer HTML for browsers, JSON for API clients. Use Express's accepts() to
  // determine the best response type.
  const preferred = req.accepts(['html', 'json']);
  if (preferred === 'html') {
    // Simple landing page
    return res.send(`<!doctype html>
    <html lang="de">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width,initial-scale=1" />
      <title>STAC Atlas</title>
      <style>body{font-family:system-ui,Segoe UI,Roboto,Helvetica,Arial,sans-serif;margin:2rem}a{color:#0366d6}</style>
    </head>
    <body>
      <h1>STAC Atlas</h1>
      <p>Willkommen bei der STAC Atlas API. Nützliche Endpunkte:</p>
      <ul>
        <li><a href="/conformance">/conformance</a> — Conformance classes</li>
        <li><a href="/collections">/collections</a> — Collections</li>
        <li><a href="/queryables">/queryables</a> — Queryables (schema)</li>
      </ul>
      <p>Für Maschinen: <code>curl -H "Accept: application/json" {{BASE}}</code></p>
    </body>
    </html>`);
  }

  // Default: machine-readable JSON (existing behaviour)
  return res.json({
    type: 'Catalog',
    id: 'stac-atlas',
    title: 'STAC Atlas',
    description: 'A centralized platform for managing, indexing, and providing STAC Collection metadata from distributed catalogs and APIs.',
    stac_version: '1.0.0',
    conformsTo: [
      'https://api.stacspec.org/v1.0.0/core',
      'https://api.stacspec.org/v1.0.0/collections',
      'https://api.stacspec.org/v1.0.0/collection-search'
    ],
    links: [
      {
        rel: 'self',
        href: baseUrl,
        type: 'application/json',
        title: 'This document'
      },
      {
        rel: 'root',
        href: baseUrl,
        type: 'application/json',
        title: 'Root catalog'
      },
      {
        rel: 'conformance',
        href: `${baseUrl}/conformance`,
        type: 'application/json',
        title: 'Conformance classes'
      },
      {
        rel: 'data',
        href: `${baseUrl}/collections`,
        type: 'application/json',
        title: 'Collections'
      },
      {
        rel: 'queryables',
        href: `${baseUrl}/queryables`,
        type: 'application/schema+json',
        title: 'Queryables'
      },
      {
        rel: 'service-desc',
        href: `${baseUrl}/api-docs`,
        type: 'text/html',
        title: 'API documentation'
      },
      {
        rel: 'service-doc',
        href: `${baseUrl}/openapi.yaml`,
        type: 'application/vnd.oai.openapi+json;version=3.0',
        title: 'OpenAPI specification'
      }
    ]
  });
});

module.exports = router;
