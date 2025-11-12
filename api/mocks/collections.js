/**
 * Mock Collections Data
 * Temporary mock data for testing and frontend development
 * TODO: Replace with actual database queries
 */

const MOCK_COLLECTIONS = [
  {
    id: 'sentinel-2',
    title: 'Copernicus Sentinel-2',
    description: 'Sentinel-2 is a wide-swath, high-resolution, multi-spectral imaging mission',
    keywords: ['sentinel', 'copernicus', 'optical', 'multispectral', 'earth-observation'],
    license: 'CC-BY-4.0',
    providers: [
      {
        name: 'ESA',
        description: 'European Space Agency',
        roles: ['producer', 'licensor'],
        url: 'https://www.esa.int/'
      }
    ],
    extent: {
      spatial: {
        bbox: [[-180, -90, 180, 90]]
      },
      temporal: {
        interval: [['2015-06-23T00:00:00Z', null]]
      }
    },
    summaries: {
      platform: ['Sentinel-2A', 'Sentinel-2B'],
      constellation: ['Sentinel-2'],
      gsd: [10, 20, 60],
      'processing:level': ['L1C', 'L2A'],
      instruments: ['MSI'],
      bands: [
        { name: 'B1', common_name: 'coastal', center_wavelength: 0.443 },
        { name: 'B2', common_name: 'blue', center_wavelength: 0.49 },
        { name: 'B3', common_name: 'green', center_wavelength: 0.56 },
        { name: 'B4', common_name: 'red', center_wavelength: 0.665 },
        { name: 'B5', center_wavelength: 0.705 },
        { name: 'B6', center_wavelength: 0.74 },
        { name: 'B7', center_wavelength: 0.783 },
        { name: 'B8', common_name: 'nir', center_wavelength: 0.842 },
        { name: 'B8A', center_wavelength: 0.865 },
        { name: 'B9', center_wavelength: 0.945 },
        { name: 'B10', center_wavelength: 1.375 },
        { name: 'B11', common_name: 'swir16', center_wavelength: 1.61 },
        { name: 'B12', common_name: 'swir22', center_wavelength: 2.19 }
      ]
    },
    assets: {}
  },
  {
    id: 'landsat-8',
    title: 'USGS Landsat 8',
    description: 'Landsat 8 is a satellite that collects multispectral image data of the Earth',
    keywords: ['landsat', 'usgs', 'optical', 'multispectral', 'earth-observation'],
    license: 'CC0-1.0',
    providers: [
      {
        name: 'USGS',
        description: 'United States Geological Survey',
        roles: ['producer', 'licensor'],
        url: 'https://www.usgs.gov/'
      }
    ],
    extent: {
      spatial: {
        bbox: [[-180, -90, 180, 90]]
      },
      temporal: {
        interval: [['2013-04-11T00:00:00Z', null]]
      }
    },
    summaries: {
      platform: ['Landsat-8'],
      constellation: ['Landsat'],
      gsd: [30, 15],
      'processing:level': ['L1', 'L2'],
      instruments: ['OLI_TIRS'],
      bands: [
        { name: 'B1', common_name: 'coastal', center_wavelength: 0.44 },
        { name: 'B2', common_name: 'blue', center_wavelength: 0.48 },
        { name: 'B3', common_name: 'green', center_wavelength: 0.56 },
        { name: 'B4', common_name: 'red', center_wavelength: 0.655 },
        { name: 'B5', common_name: 'nir', center_wavelength: 0.865 },
        { name: 'B6', common_name: 'swir16', center_wavelength: 1.61 },
        { name: 'B7', common_name: 'swir22', center_wavelength: 2.2 },
        { name: 'B8', common_name: 'pan', center_wavelength: 0.59 },
        { name: 'B9', center_wavelength: 1.37 }
      ]
    },
    assets: {}
  },
  {
    id: 'aster',
    title: 'ASTER Global Digital Elevation Model',
    description: 'Global DEM covering land surface of the Earth',
    keywords: ['dem', 'elevation', 'aster', 'usgs'],
    license: 'CC-BY-4.0',
    providers: [
      {
        name: 'USGS',
        description: 'United States Geological Survey',
        roles: ['producer', 'licensor'],
        url: 'https://www.usgs.gov/'
      }
    ],
    extent: {
      spatial: {
        bbox: [[-180, -90, 180, 90]]
      },
      temporal: {
        interval: [['2000-01-01T00:00:00Z', '2013-08-12T00:00:00Z']]
      }
    },
    summaries: {
      platform: ['TERRA'],
      gsd: [30],
      'processing:level': ['L3']
    },
    assets: {}
  }
];

/**
 * Get all mock collections
 * @returns {Array} All mock collections
 */
function getAllMockCollections() {
  return MOCK_COLLECTIONS;
}

/**
 * Get mock collection by ID
 * @param {string} id - Collection ID
 * @returns {Object|null} Collection or null if not found
 */
function getMockCollectionById(id) {
  return MOCK_COLLECTIONS.find(collection => collection.id === id) || null;
}

/**
 * Search mock collections (simple implementation)
 * @param {Object} filters - Filter criteria
 * @returns {Array} Filtered collections
 */
function searchMockCollections(filters = {}) {
  let results = [...MOCK_COLLECTIONS];

  // Filter by search query
  if (filters.search) {
    const query = filters.search.toLowerCase();
    results = results.filter(collection =>
      collection.id.toLowerCase().includes(query) ||
      collection.title.toLowerCase().includes(query) ||
      collection.description.toLowerCase().includes(query) ||
      (collection.keywords && collection.keywords.some(kw => kw.toLowerCase().includes(query)))
    );
  }

  // Filter by provider
  if (filters.provider) {
    results = results.filter(collection =>
      collection.providers?.some(p => p.name.toLowerCase().includes(filters.provider.toLowerCase()))
    );
  }

  // Filter by license
  if (filters.license) {
    results = results.filter(collection =>
      collection.license.toLowerCase().includes(filters.license.toLowerCase())
    );
  }

  // Filter by bbox (simplified - checks if collection bbox overlaps with filter bbox)
  if (filters.bbox) {
    const { minX, minY, maxX, maxY } = filters.bbox;
    results = results.filter(collection => {
      const collectionBbox = collection.extent?.spatial?.bbox?.[0];
      if (!collectionBbox) return true;
      const [cbMinX, cbMinY, cbMaxX, cbMaxY] = collectionBbox;
      // Check for overlap
      return !(cbMaxX < minX || cbMinX > maxX || cbMaxY < minY || cbMinY > maxY);
    });
  }

  // Filter by datetime (simplified - checks if collection temporal extent overlaps)
  if (filters.datetime) {
    results = results.filter(collection => {
      const temporal = collection.extent?.temporal?.interval?.[0];
      if (!temporal) return true;
      const [collectionStart, collectionEnd] = temporal;
      
      // Simple overlap check
      const filterStart = filters.datetime.start;
      const filterEnd = filters.datetime.end;
      
      if (collectionEnd && filterStart && new Date(collectionEnd) < filterStart) return false;
      if (collectionStart && filterEnd && new Date(collectionStart) > filterEnd) return false;
      
      return true;
    });
  }

  return results;
}

module.exports = {
  MOCK_COLLECTIONS,
  getAllMockCollections,
  getMockCollectionById,
  searchMockCollections
};
