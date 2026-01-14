const express = require('express');
const router = express.Router();

/**
 * GET /collections-queryables
 * Returns the list of queryable properties for collections
 */
router.get('/', (req, res) => {
  res.json({
    $schema: 'https://json-schema.org/draft/2019-09/schema',
    $id: `${req.protocol}://${req.get('host')}/collections-queryables`,
    type: 'object',
    title: 'STAC Atlas Collections Queryables',
    description: 'Queryable properties for STAC Collection Search',
    properties: {
      id: {
        title: 'Collection ID',
        type: 'string'
      },
      title: {
        title: 'Collection Title',
        type: 'string'
      },
      description: {
        title: 'Collection Description',
        type: 'string'
      },
      keywords: {
        title: 'Keywords',
        type: 'array',
        items: {
          type: 'string'
        }
      },
      license: {
        title: 'License',
        type: 'string'
      },
      providers: {
        title: 'Providers',
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: {
              type: 'string'
            }
          }
        }
      },
      'extent.spatial.bbox': {
        title: 'Spatial Extent (Bounding Box)',
        type: 'array',
        items: {
          type: 'number'
        }
      },
      'extent.temporal.interval': {
        title: 'Temporal Extent',
        type: 'array'
      },
      doi: {
        title: 'DOI',
        type: 'string'
      },
      'summaries.platform': {
        title: 'Platform',
        type: 'array',
        items: {
          type: 'string'
        }
      },
      'summaries.constellation': {
        title: 'Constellation',
        type: 'array',
        items: {
          type: 'string'
        }
      },
      'summaries.gsd': {
        title: 'Ground Sample Distance',
        type: 'number'
      },
      'summaries.processing:level': {
        title: 'Processing Level',
        type: 'string'
      }
    }
  });
});

module.exports = router;
