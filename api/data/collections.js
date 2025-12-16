// Small in-memory sample of collections for basic GET /collections implementation
//
// This file is intentionally simple and used only for local testing and
// unit-tests. Each entry represents a minimal STAC Collection-like object
// containing common STAC fields (id, title, description, keywords, extent, etc).
// In a production deployment this should be replaced by a database query
// that returns fully validated STAC Collection objects.
module.exports = [
  {
    id: 'sentinel-2-l2a',
    stac_version: '1.0.0',
    type: 'Collection',
    title: 'Sentinel-2 L2A Collection',
    description: 'Sentinel-2 Level-2A processed imagery from Copernicus',
    keywords: ['sentinel-2', 'optical', 'multispectral'],
    license: 'CC-BY-4.0',
    created: '2018-01-01T00:00:00Z',
    updated: '2025-01-01T00:00:00Z',
    providers: [
      {
        name: 'ESA',
        roles: ['producer', 'licensor'],
        url: 'https://www.esa.int/'
      }
    ],
    extent: {
      spatial: { bbox: [[-180, -90, 180, 90]] },
      temporal: { interval: [['2015-06-23T00:00:00Z', null]] }
    },
    summaries: {
      'eo:bands': [
        { name: 'B2', common_name: 'blue' },
        { name: 'B3', common_name: 'green' },
        { name: 'B4', common_name: 'red' },
        { name: 'B5', common_name: 'nir' }
      ]
    },
    links: [
      {
        rel: 'self',
        href: 'https://example.com/collections/sentinel-2-l2a',
        type: 'application/json',
        title: 'Sentinel-2 L2A Collection'
      },
      {
        rel: 'parent',
        href: 'https://example.com/',
        type: 'application/json',
        title: 'Parent'
      }
    ]
  },
  {
    id: 'landsat-8-l1',
    stac_version: '1.0.0',
    type: 'Collection',
    title: 'Landsat 8 Level-1',
    description: 'Landsat 8 Collection 1 Level 1 data',
    keywords: ['landsat', 'optical', 'multispectral'],
    license: 'CC0-1.0',
    created: '2013-02-11T00:00:00Z',
    updated: '2024-06-01T00:00:00Z',
    providers: [
      {
        name: 'USGS',
        roles: ['producer'],
        url: 'https://www.usgs.gov/'
      }
    ],
    extent: {
      spatial: { bbox: [[-180, -90, 180, 90]] },
      temporal: { interval: [['2013-02-11T00:00:00Z', null]] }
    },
    summaries: {
      'eo:bands': [
        { name: 'B1', common_name: 'coastal' },
        { name: 'B2', common_name: 'blue' },
        { name: 'B3', common_name: 'green' },
        { name: 'B4', common_name: 'red' }
      ]
    },
    links: [
      {
        rel: 'self',
        href: 'https://example.com/collections/landsat-8-l1',
        type: 'application/json',
        title: 'Landsat 8 Level-1'
      },
      {
        rel: 'parent',
        href: 'https://example.com/',
        type: 'application/json',
        title: 'Parent'
      }
    ]
  },
  {
    id: 'modis',
    stac_version: '1.0.0',
    type: 'Collection',
    title: 'MODIS Daily',
    description: 'MODIS daily composites from NASA Earth Observatories',
    keywords: ['modis', 'daily', 'thermal', 'visible'],
    license: 'CC0-1.0',
    created: '2000-02-24T00:00:00Z',
    updated: '2023-12-31T00:00:00Z',
    providers: [
      {
        name: 'NASA',
        roles: ['producer', 'licensor'],
        url: 'https://www.nasa.gov/'
      }
    ],
    extent: {
      spatial: { bbox: [[-180, -90, 180, 90]] },
      temporal: { interval: [['2000-02-24T00:00:00Z', null]] }
    },
    summaries: {
      'eo:bands': [
        { name: '1', common_name: 'red' },
        { name: '2', common_name: 'nir' },
        { name: '31', common_name: 'thermal' }
      ]
    },
    links: [
      {
        rel: 'self',
        href: 'https://example.com/collections/modis',
        type: 'application/json',
        title: 'MODIS Daily'
      },
      {
        rel: 'parent',
        href: 'https://example.com/',
        type: 'application/json',
        title: 'Parent'
      }
    ]
  }
];
