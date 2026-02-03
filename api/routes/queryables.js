const express = require('express');
const router = express.Router();

const { buildCollectionsQueryablesSchema } = require('../config/queryablesSchema');
const { query } = require('../db/db_APIconnection');

/**
 * GET /collection-queryables
 * Returns the queryables schema for STAC Collections
 * Conforms to OGC API Features Part 3 (Filtering) and STAC API Filter Extension
 * 
 * Dynamically loads enum values from the database for:
 * - license: Available licenses in collections
 * - providers: Available provider names
 */
router.get('/', async (req, res) => {
  try {
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const selfUrl = `${baseUrl}/collection-queryables`;

    // Fetch distinct enum values from database
    const [licensesResult, providersResult] = await Promise.all([
      query('SELECT DISTINCT license FROM collection WHERE license IS NOT NULL ORDER BY license'),
      query('SELECT DISTINCT provider FROM providers ORDER BY provider'),
    ]);

    // Extract values from query results
    const enums = {
      licenses: licensesResult.rows.map(r => r.license),
      providers: providersResult.rows.map(r => r.provider),
      // Boolean enums don't need DB queries
      is_api: [true, false],
      is_active: [true, false]
    };

    const schema = buildCollectionsQueryablesSchema(baseUrl, enums);

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
  } catch (error) {
    console.error('Error building queryables schema:', error);
    res.status(500).json({
      code: 'InternalServerError',
      description: 'Failed to build queryables schema'
    });
  }
});

module.exports = router;