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
    links: [
      {
        rel: 'self',
        href: 'https://example.com/collections/sentinel-2-l2a',
        type: 'application/json'
      },
      {
        rel: 'parent',
        href: 'https://example.com/',
        type: 'application/json'
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
    links: [
      {
        rel: 'self',
        href: 'https://example.com/collections/landsat-8-l1',
        type: 'application/json'
      },
      {
        rel: 'parent',
        href: 'https://example.com/',
        type: 'application/json'
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
    links: [
      {
        rel: 'self',
        href: 'https://example.com/collections/modis',
        type: 'application/json'
      },
      {
        rel: 'parent',
        href: 'https://example.com/',
        type: 'application/json'
      }
    ]
  }
];
