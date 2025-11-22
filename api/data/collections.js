// Small in-memory sample of collections for basic GET /collections implementation
//
// This file is intentionally simple and used only for local testing and
// unit-tests. Each entry represents a minimal STAC Collection-like object
// containing a few common fields (id, title, description, keywords, extent).
// In a production deployment this should be replaced by a database query
// that returns fully validated STAC Collection objects.
module.exports = [
  {
    id: 'sentinel-2-l2a',
    title: 'Sentinel-2 L2A Collection',
    description: 'Sentinel-2 Level-2A processed imagery',
    keywords: ['sentinel-2', 'optical'],
    extent: {
      spatial: { bbox: [[-180, -90, 180, 90]] },
      temporal: { interval: [['2015-06-23T00:00:00Z', null]] }
    }
  },
  {
    id: 'landsat-8-l1',
    title: 'Landsat 8 Level-1',
    description: 'Landsat 8 Collection',
    keywords: ['landsat', 'optical'],
    extent: {
      spatial: { bbox: [[-180, -90, 180, 90]] },
      temporal: { interval: [['2013-02-11T00:00:00Z', null]] }
    }
  },
  {
    id: 'modis',
    title: 'MODIS Daily',
    description: 'MODIS daily composites',
    keywords: ['modis', 'daily'],
    extent: {
      spatial: { bbox: [[-180, -90, 180, 90]] },
      temporal: { interval: [['2000-02-24T00:00:00Z', null]] }
    }
  }
];
