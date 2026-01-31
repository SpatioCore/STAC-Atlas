/**
 * @fileoverview Unit tests for is_api field functionality
 * Tests that collections are correctly marked as API or static catalog collections
 */

import { jest } from '@jest/globals';
import create from 'stac-js';

// Mock normalizeCollection to return a simple object
jest.unstable_mockModule('../utils/normalization.js', () => ({
    normalizeCollection: jest.fn((stacObj, index) => ({
        id: stacObj.id || `collection-${index}`,
        title: stacObj.title || 'Test Collection',
        description: stacObj.description || 'Test Description'
    }))
}));

// Mock db module
const mockInsertOrUpdateCollection = jest.fn();
jest.unstable_mockModule('../utils/db.js', () => ({
    default: {
        insertOrUpdateCollection: mockInsertOrUpdateCollection
    }
}));

// Mock endpoints module
jest.unstable_mockModule('../utils/endpoints.js', () => ({
    tryCollectionEndpoints: jest.fn()
}));

// Import the modules to test
const { handleCatalog, handleCollections } = await import('../utils/handlers.js');
const { normalizeCollection } = await import('../utils/normalization.js');

describe('is_api field - handleCatalog (static catalogs)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should set is_api=false for collections extracted from static catalogs', async () => {
        // Real Sentinel-2 collection from static catalog
        const collectionJson = {
            stac_version: '1.0.0',
            type: 'Collection',
            id: 'sentinel-2-l2a',
            title: 'Sentinel-2 Level-2A',
            description: 'Sentinel-2 Level-2A, orthorectified atmosphere-corrected surface reflectance',
            license: 'proprietary',
            keywords: ['sentinel', 'esa', 'copernicus', 'satellite', 'global'],
            extent: {
                spatial: { bbox: [[-180, -90, 180, 90]] },
                temporal: { interval: [['2015-06-27T10:25:31Z', null]] }
            },
            links: [
                { rel: 'self', href: './sentinel-2-l2a/collection.json' },
                { rel: 'root', href: '../catalog.json' }
            ]
        };

        const mockRequest = {
            url: 'https://example.com/catalog/collection.json',
            userData: {
                depth: 1,
                catalogId: 'test-catalog',
                catalogSlug: 'test-catalog-slug'
            }
        };

        const mockCrawler = {
            addRequests: jest.fn()
        };

        const mockLog = {
            info: jest.fn(),
            warning: jest.fn(),
            debug: jest.fn(),
            error: jest.fn()
        };

        const results = {
            collections: [],
            catalogs: [],
            stats: {
                stacCompliant: 0,
                catalogsProcessed: 0,
                collectionsFound: 0,
                collectionsSaved: 0,
                collectionsFailed: 0
            }
        };

        await handleCatalog({
            request: mockRequest,
            json: collectionJson,
            crawler: mockCrawler,
            log: mockLog,
            indent: '',
            results,
            config: {}
        });

        // Verify that a collection was added
        expect(results.collections.length).toBe(1);
        
        // Verify that is_api is set to false for static catalog collection
        expect(results.collections[0].is_api).toBe(false);
        
        // Verify other fields are set correctly
        expect(results.collections[0].sourceSlug).toBe('test-catalog-slug');
        expect(results.collections[0].crawledUrl).toBe('https://example.com/catalog/collection.json');
    });

    test('should set is_api=false for STAC catalog (not collection)', async () => {
        // Real static STAC catalog structure
        const catalogJson = {
            stac_version: '1.0.0',
            type: 'Catalog',
            id: 'earth-observation-catalog',
            title: 'Earth Observation Data Catalog',
            description: 'A catalog of Earth observation satellite imagery collections',
            links: [
                { rel: 'self', href: './catalog.json' },
                { rel: 'root', href: './catalog.json' },
                { rel: 'child', href: './sentinel-2/catalog.json', title: 'Sentinel-2' },
                { rel: 'child', href: './landsat/catalog.json', title: 'Landsat' }
            ]
        };

        const mockRequest = {
            url: 'https://example.com/catalog.json',
            userData: {
                depth: 0,
                catalogId: 'root-catalog',
                catalogSlug: 'root-slug'
            }
        };

        const mockCrawler = {
            addRequests: jest.fn()
        };

        const mockLog = {
            info: jest.fn(),
            warning: jest.fn(),
            debug: jest.fn(),
            error: jest.fn()
        };

        const results = {
            collections: [],
            catalogs: [],
            stats: {
                stacCompliant: 0,
                catalogsProcessed: 0,
                collectionsFound: 0,
                collectionsSaved: 0,
                collectionsFailed: 0
            }
        };

        await handleCatalog({
            request: mockRequest,
            json: catalogJson,
            crawler: mockCrawler,
            log: mockLog,
            indent: '',
            results,
            config: {}
        });

        // Verify that no collections were added (it's a catalog, not a collection)
        expect(results.collections.length).toBe(0);
        
        // Verify catalog was processed
        expect(results.catalogs.length).toBe(1);
        expect(results.stats.catalogsProcessed).toBe(1);
    });
});

describe('is_api field - handleCollections', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should set is_api=false when isApi parameter is false (static catalog)', async () => {
        // Real static catalog collections response
        const collectionsJson = {
            collections: [
                {
                    stac_version: '1.0.0',
                    type: 'Collection',
                    id: 'landsat-c2-l2',
                    title: 'Landsat Collection 2 Level-2',
                    description: 'Landsat Collection 2 Level-2 Science Products',
                    license: 'proprietary',
                    keywords: ['landsat', 'usgs', 'nasa', 'satellite', 'global'],
                    providers: [
                        { name: 'NASA', roles: ['producer'], url: 'https://landsat.gsfc.nasa.gov/' },
                        { name: 'USGS', roles: ['processor', 'host'], url: 'https://www.usgs.gov/landsat-missions' }
                    ],
                    extent: {
                        spatial: { bbox: [[-180, -90, 180, 90]] },
                        temporal: { interval: [['1972-07-25T00:00:00Z', null]] }
                    },
                    summaries: {
                        platform: ['landsat-4', 'landsat-5', 'landsat-7', 'landsat-8', 'landsat-9'],
                        instruments: ['tm', 'etm+', 'oli', 'tirs']
                    },
                    links: [
                        { rel: 'self', href: './landsat-c2-l2/collection.json' }
                    ]
                },
                {
                    stac_version: '1.0.0',
                    type: 'Collection',
                    id: 'cop-dem-glo-30',
                    title: 'Copernicus DEM GLO-30',
                    description: 'Global 30m Digital Elevation Model',
                    license: 'proprietary',
                    keywords: ['dem', 'elevation', 'copernicus'],
                    extent: {
                        spatial: { bbox: [[-180, -90, 180, 90]] },
                        temporal: { interval: [['2021-04-22T00:00:00Z', '2021-04-22T23:59:59Z']] }
                    },
                    links: [
                        { rel: 'self', href: './cop-dem-glo-30/collection.json' }
                    ]
                }
            ]
        };

        const mockRequest = {
            url: 'https://example.com/collections',
            userData: {
                catalogId: 'test-catalog',
                catalogSlug: 'test-catalog-slug'
            }
        };

        const mockCrawler = {
            addRequests: jest.fn()
        };

        const mockLog = {
            info: jest.fn(),
            warning: jest.fn(),
            debug: jest.fn()
        };

        const results = {
            collections: [],
            stats: {
                collectionsFound: 0,
                collectionsSaved: 0,
                collectionsFailed: 0
            }
        };

        await handleCollections({
            request: mockRequest,
            json: collectionsJson,
            crawler: mockCrawler,
            log: mockLog,
            indent: '',
            results,
            isApi: false  // Static catalog
        });

        // Verify collections were added
        expect(results.collections.length).toBe(2);
        
        // Verify all collections have is_api=false
        results.collections.forEach(collection => {
            expect(collection.is_api).toBe(false);
        });
    });

    test('should set is_api=true when isApi parameter is true (API)', async () => {
        // Real Earth Search API collections response
        const collectionsJson = {
            collections: [
                {
                    stac_version: '1.0.0',
                    type: 'Collection',
                    id: 'sentinel-2-l2a',
                    title: 'Sentinel-2 Level-2A',
                    description: 'Sentinel-2 Level-2A, orthorectified atmosphere-corrected surface reflectance',
                    license: 'proprietary',
                    extent: {
                        spatial: { bbox: [[-180, -90, 180, 90]] },
                        temporal: { interval: [['2015-06-27T10:25:31Z', null]] }
                    },
                    links: [
                        { rel: 'self', href: 'https://earth-search.aws.element84.com/v1/collections/sentinel-2-l2a' },
                        { rel: 'root', href: 'https://earth-search.aws.element84.com/v1' }
                    ]
                },
                {
                    stac_version: '1.0.0',
                    type: 'Collection',
                    id: 'sentinel-2-l1c',
                    title: 'Sentinel-2 Level-1C',
                    description: 'Sentinel-2 Level-1C Top-of-Atmosphere reflectance',
                    license: 'proprietary',
                    extent: {
                        spatial: { bbox: [[-180, -90, 180, 90]] },
                        temporal: { interval: [['2015-06-27T10:25:31Z', null]] }
                    },
                    links: [
                        { rel: 'self', href: 'https://earth-search.aws.element84.com/v1/collections/sentinel-2-l1c' },
                        { rel: 'root', href: 'https://earth-search.aws.element84.com/v1' }
                    ]
                }
            ],
            links: [
                { rel: 'self', href: 'https://earth-search.aws.element84.com/v1/collections' },
                { rel: 'root', href: 'https://earth-search.aws.element84.com/v1' }
            ]
        };

        const mockRequest = {
            url: 'https://api.example.com/stac/v1/collections',
            userData: {
                apiId: 'test-api',
                catalogSlug: 'test-api-slug'
            }
        };

        const mockCrawler = {
            addRequests: jest.fn()
        };

        const mockLog = {
            info: jest.fn(),
            warning: jest.fn(),
            debug: jest.fn()
        };

        const results = {
            collections: [],
            stats: {
                collectionsFound: 0,
                collectionsSaved: 0,
                collectionsFailed: 0
            }
        };

        await handleCollections({
            request: mockRequest,
            json: collectionsJson,
            crawler: mockCrawler,
            log: mockLog,
            indent: '',
            results,
            isApi: true  // API endpoint
        });

        // Verify collections were added
        expect(results.collections.length).toBe(2);
        
        // Verify all collections have is_api=true
        results.collections.forEach(collection => {
            expect(collection.is_api).toBe(true);
        });
    });

    test('should default to is_api=false when isApi parameter is not provided', async () => {
        // Real NASA CMR STAC collection
        const collectionsJson = {
            collections: [
                {
                    stac_version: '1.0.0',
                    type: 'Collection',
                    id: 'HLSL30.v2.0',
                    title: 'HLS Landsat Operational Land Imager Surface Reflectance and TOA Brightness Daily Global 30m v2.0',
                    description: 'The Harmonized Landsat Sentinel-2 (HLS) project provides consistent surface reflectance data from Landsat 8 and Sentinel-2 satellites.',
                    license: 'not-provided',
                    extent: {
                        spatial: { bbox: [[-180, -90, 180, 90]] },
                        temporal: { interval: [['2013-04-11T00:00:00Z', null]] }
                    },
                    links: [
                        { rel: 'self', href: 'https://cmr.earthdata.nasa.gov/stac/LPCLOUD/collections/HLSL30.v2.0' },
                        { rel: 'parent', href: 'https://cmr.earthdata.nasa.gov/stac/LPCLOUD' },
                        { rel: 'root', href: 'https://cmr.earthdata.nasa.gov/stac/LPCLOUD' }
                    ]
                }
            ]
        };

        const mockRequest = {
            url: 'https://example.com/collections',
            userData: {
                catalogId: 'test-catalog',
                catalogSlug: 'test-catalog-slug'
            }
        };

        const mockCrawler = {
            addRequests: jest.fn()
        };

        const mockLog = {
            info: jest.fn(),
            warning: jest.fn(),
            debug: jest.fn()
        };

        const results = {
            collections: [],
            stats: {
                collectionsFound: 0,
                collectionsSaved: 0,
                collectionsFailed: 0
            }
        };

        // Call without isApi parameter - should default to false
        await handleCollections({
            request: mockRequest,
            json: collectionsJson,
            crawler: mockCrawler,
            log: mockLog,
            indent: '',
            results
            // isApi parameter omitted
        });

        // Verify collections were added
        expect(results.collections.length).toBe(1);
        
        // Verify is_api defaults to false
        expect(results.collections[0].is_api).toBe(false);
    });
});

describe('is_api field - Database integration', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockInsertOrUpdateCollection.mockResolvedValue(1);
    });

    test('should pass is_api=true to database for API collections', async () => {
        const { flushCollectionsToDb } = await import('../utils/handlers.js');
        
        const results = {
            collections: [
                {
                    id: 'sentinel-2-l2a',
                    title: 'Sentinel-2 Level-2A',
                    description: 'Sentinel-2 Level-2A, orthorectified atmosphere-corrected surface reflectance',
                    license: 'proprietary',
                    is_api: true,  // API collection from Microsoft Planetary Computer
                    sourceSlug: 'microsoft-planetary-computer',
                    crawledUrl: 'https://planetarycomputer.microsoft.com/api/stac/v1/collections/sentinel-2-l2a'
                }
            ]
        };

        const mockLog = {
            info: jest.fn(),
            warning: jest.fn()
        };

        await flushCollectionsToDb(results, mockLog, true);

        // Verify insertOrUpdateCollection was called
        expect(mockInsertOrUpdateCollection).toHaveBeenCalledTimes(1);
        
        // Verify the collection passed has is_api=true
        const passedCollection = mockInsertOrUpdateCollection.mock.calls[0][0];
        expect(passedCollection.is_api).toBe(true);
    });

    test('should pass is_api=false to database for static catalog collections', async () => {
        const { flushCollectionsToDb } = await import('../utils/handlers.js');
        
        const results = {
            collections: [
                {
                    id: 'landsat-c2-l2',
                    title: 'Landsat Collection 2 Level-2',
                    description: 'Landsat Collection 2 Level-2 Science Products',
                    license: 'proprietary',
                    is_api: false,  // Static catalog collection
                    sourceSlug: 'usgs-landsat-catalog',
                    crawledUrl: 'https://landsatlook.usgs.gov/stac-browser/landsat-c2-l2/collection.json'
                }
            ]
        };

        const mockLog = {
            info: jest.fn(),
            warning: jest.fn()
        };

        await flushCollectionsToDb(results, mockLog, true);

        // Verify insertOrUpdateCollection was called
        expect(mockInsertOrUpdateCollection).toHaveBeenCalledTimes(1);
        
        // Verify the collection passed has is_api=false
        const passedCollection = mockInsertOrUpdateCollection.mock.calls[0][0];
        expect(passedCollection.is_api).toBe(false);
    });

    test('should handle mixed API and static catalog collections in batch', async () => {
        const { flushCollectionsToDb } = await import('../utils/handlers.js');
        
        const results = {
            collections: [
                {
                    id: 'sentinel-2-l2a',
                    title: 'Sentinel-2 Level-2A',
                    is_api: true,  // From Earth Search API
                    sourceSlug: 'earth-search'
                },
                {
                    id: 'landsat-c2-l2',
                    title: 'Landsat Collection 2 Level-2',
                    is_api: false,  // From static catalog
                    sourceSlug: 'usgs-catalog'
                },
                {
                    id: 'naip',
                    title: 'NAIP: National Agriculture Imagery Program',
                    is_api: true,  // From Microsoft Planetary Computer API
                    sourceSlug: 'microsoft-pc'
                },
                {
                    id: 'cop-dem-glo-30',
                    title: 'Copernicus DEM GLO-30',
                    is_api: false,  // From static catalog
                    sourceSlug: 'copernicus-catalog'
                }
            ]
        };

        const mockLog = {
            info: jest.fn(),
            warning: jest.fn()
        };

        await flushCollectionsToDb(results, mockLog, true);

        // Verify all collections were processed
        expect(mockInsertOrUpdateCollection).toHaveBeenCalledTimes(4);
        
        // Verify correct is_api values were passed
        const calls = mockInsertOrUpdateCollection.mock.calls;
        expect(calls[0][0].is_api).toBe(true);   // sentinel-2-l2a (API)
        expect(calls[1][0].is_api).toBe(false);  // landsat-c2-l2 (static)
        expect(calls[2][0].is_api).toBe(true);   // naip (API)
        expect(calls[3][0].is_api).toBe(false);  // cop-dem-glo-30 (static)
    });
});
