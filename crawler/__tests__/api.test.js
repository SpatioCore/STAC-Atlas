/**
 * @fileoverview Unit tests for API crawling utilities
 * Tests the actual checkAndFlushApi function with mocked dependencies
 */

import { jest } from '@jest/globals';

// Mock the handlers module before importing
const mockFlushCollectionsToDb = jest.fn();

jest.unstable_mockModule('../utils/handlers.js', () => ({
    flushCollectionsToDb: mockFlushCollectionsToDb,
    handleCollections: jest.fn()
}));

// Import the actual module to test
const { checkAndFlushApi, BATCH_SIZE, API_CLEAR_BATCH_SIZE } = await import('../apis/api.js');

describe('checkAndFlushApi - Batch Management', () => {
    beforeEach(() => {
        mockFlushCollectionsToDb.mockClear();
        mockFlushCollectionsToDb.mockResolvedValue({ saved: 0, failed: 0 });
    });

    test('should flush collections when BATCH_SIZE is reached', async () => {
        const results = {
            collections: new Array(BATCH_SIZE).fill(null).map((_, i) => ({
                id: `sentinel-2-l2a-${i}`,
                title: `Sentinel-2 Collection ${i}`
            })),
            apis: [],
            stats: {
                collectionsSaved: 0,
                collectionsFailed: 0
            }
        };

        const mockLog = {
            info: jest.fn(),
            warning: jest.fn()
        };

        mockFlushCollectionsToDb.mockResolvedValueOnce({ saved: 25, failed: 0 });
        await checkAndFlushApi(results, mockLog);

        expect(mockFlushCollectionsToDb).toHaveBeenCalledTimes(1);
        expect(mockFlushCollectionsToDb).toHaveBeenCalledWith(results, mockLog, false);
        expect(results.stats.collectionsSaved).toBe(25);
        expect(results.stats.collectionsFailed).toBe(0);
    });

    test('should not flush when below BATCH_SIZE', async () => {
        const results = {
            collections: [
                { id: 'landsat-c2-l2', title: 'Landsat Collection 2' }
            ],
            apis: [],
            stats: {
                collectionsSaved: 0,
                collectionsFailed: 0
            }
        };

        const mockLog = { info: jest.fn(), warning: jest.fn() };
        await checkAndFlushApi(results, mockLog);

        expect(mockFlushCollectionsToDb).not.toHaveBeenCalled();
    });

    test('should clear APIs array when API_CLEAR_BATCH_SIZE is reached', async () => {
        const results = {
            collections: [],
            apis: new Array(API_CLEAR_BATCH_SIZE).fill(null).map((_, i) => ({ id: `api-${i}` })),
            stats: {
                collectionsSaved: 0,
                collectionsFailed: 0
            }
        };

        const mockLog = { info: jest.fn(), warning: jest.fn() };
        await checkAndFlushApi(results, mockLog);

        expect(results.apis.length).toBe(0);
        expect(mockLog.info).toHaveBeenCalledWith(
            expect.stringContaining('[MEMORY] Clearing')
        );
    });

    test('should handle both flush and clear simultaneously', async () => {
        const results = {
            collections: new Array(BATCH_SIZE).fill({}).map((_, i) => ({ id: `col-${i}` })),
            apis: new Array(API_CLEAR_BATCH_SIZE).fill({}).map((_, i) => ({ id: `api-${i}` })),
            stats: {
                collectionsSaved: 0,
                collectionsFailed: 0
            }
        };

        const mockLog = { info: jest.fn(), warning: jest.fn() };
        mockFlushCollectionsToDb.mockResolvedValueOnce({ saved: 20, failed: 5 });
        await checkAndFlushApi(results, mockLog);

        expect(mockFlushCollectionsToDb).toHaveBeenCalled();
        expect(results.apis.length).toBe(0);
        expect(results.stats.collectionsSaved).toBe(20);
        expect(results.stats.collectionsFailed).toBe(5);
    });

    test('should accumulate stats from multiple flushes', async () => {
        const results = {
            collections: new Array(BATCH_SIZE).fill({}).map((_, i) => ({ id: `col-${i}` })),
            apis: [],
            stats: {
                collectionsSaved: 10,
                collectionsFailed: 2
            }
        };

        const mockLog = { info: jest.fn(), warning: jest.fn() };
        mockFlushCollectionsToDb.mockResolvedValueOnce({ saved: 15, failed: 10 });
        await checkAndFlushApi(results, mockLog);

        expect(results.stats.collectionsSaved).toBe(25); // 10 + 15
        expect(results.stats.collectionsFailed).toBe(12); // 2 + 10
    });
});

describe('API Endpoint URL Validation', () => {
    test('should recognize valid STAC API URLs', () => {
        const validApis = [
            'https://planetarycomputer.microsoft.com/api/stac/v1',
            'https://earth-search.aws.element84.com/v1',
            'https://landsatlook.usgs.gov/stac-server',
            'https://cmr.earthdata.nasa.gov/stac/LPCLOUD',
            'https://catalogue.dataspace.copernicus.eu/stac',
            'https://stac.terria.io',
            'https://data.lpdaac.earthdatacloud.nasa.gov/stac'
        ];

        validApis.forEach(url => {
            expect(() => new URL(url)).not.toThrow();
            expect(new URL(url).protocol).toBe('https:');
        });
    });

    test('should parse STAC API domains correctly', () => {
        const apiUrls = [
            { url: 'https://planetarycomputer.microsoft.com/api/stac/v1', domain: 'planetarycomputer.microsoft.com' },
            { url: 'https://earth-search.aws.element84.com/v1', domain: 'earth-search.aws.element84.com' },
            { url: 'https://landsatlook.usgs.gov/stac-server', domain: 'landsatlook.usgs.gov' },
            { url: 'https://cmr.earthdata.nasa.gov/stac/LPCLOUD', domain: 'cmr.earthdata.nasa.gov' }
        ];

        apiUrls.forEach(({ url, domain }) => {
            const parsed = new URL(url);
            expect(parsed.hostname).toBe(domain);
        });
    });

    test('should construct collections endpoint from API root', () => {
        const apiRoots = [
            'https://planetarycomputer.microsoft.com/api/stac/v1',
            'https://earth-search.aws.element84.com/v1',
            'https://landsatlook.usgs.gov/stac-server'
        ];

        apiRoots.forEach(root => {
            const baseUrl = root.endsWith('/') ? root.slice(0, -1) : root;
            const collectionsUrl = `${baseUrl}/collections`;
            
            expect(collectionsUrl).toContain('/collections');
            expect(() => new URL(collectionsUrl)).not.toThrow();
        });
    });

    test('should handle API URLs with trailing slashes', () => {
        const urls = [
            { with: 'https://planetarycomputer.microsoft.com/api/stac/v1/', without: 'https://planetarycomputer.microsoft.com/api/stac/v1' },
            { with: 'https://earth-search.aws.element84.com/v1/', without: 'https://earth-search.aws.element84.com/v1' }
        ];

        urls.forEach(({ with: withSlash, without }) => {
            const normalized = withSlash.endsWith('/') ? withSlash.slice(0, -1) : withSlash;
            expect(normalized).toBe(without);
        });
    });
});

describe('STAC API Response Structures', () => {
    test('should validate Microsoft Planetary Computer API root structure', () => {
        const apiRoot = {
            type: 'Catalog',
            id: 'microsoft-pc',
            title: 'Microsoft Planetary Computer STAC API',
            description: 'Catalog of datasets on the Microsoft Planetary Computer',
            stac_version: '1.0.0',
            conformsTo: [
                'https://api.stacspec.org/v1.0.0/core',
                'https://api.stacspec.org/v1.0.0/collections',
                'https://api.stacspec.org/v1.0.0/ogcapi-features'
            ],
            links: [
                { rel: 'self', href: 'https://planetarycomputer.microsoft.com/api/stac/v1' },
                { rel: 'root', href: 'https://planetarycomputer.microsoft.com/api/stac/v1' },
                { rel: 'data', href: 'https://planetarycomputer.microsoft.com/api/stac/v1/collections' },
                { rel: 'conformance', href: 'https://planetarycomputer.microsoft.com/api/stac/v1/conformance' }
            ]
        };

        expect(apiRoot.type).toBe('Catalog');
        expect(apiRoot.stac_version).toBeDefined();
        expect(apiRoot.conformsTo).toBeInstanceOf(Array);
        expect(apiRoot.links).toBeInstanceOf(Array);
        
        const dataLink = apiRoot.links.find(l => l.rel === 'data');
        expect(dataLink).toBeDefined();
        expect(dataLink.href).toContain('/collections');
    });

    test('should validate Earth Search API collections response structure', () => {
        const collectionsResponse = {
            collections: [
                {
                    id: 'sentinel-2-l2a',
                    type: 'Collection',
                    title: 'Sentinel-2 Level-2A',
                    description: 'Sentinel-2 Level-2A, orthorectified atmosphere-corrected surface reflectance',
                    stac_version: '1.0.0',
                    license: 'proprietary',
                    extent: {
                        spatial: { bbox: [[-180, -90, 180, 90]] },
                        temporal: { interval: [['2015-06-27T10:25:31Z', null]] }
                    },
                    links: [
                        { rel: 'self', href: 'https://earth-search.aws.element84.com/v1/collections/sentinel-2-l2a' }
                    ]
                }
            ],
            links: [
                { rel: 'self', href: 'https://earth-search.aws.element84.com/v1/collections' },
                { rel: 'root', href: 'https://earth-search.aws.element84.com/v1' }
            ]
        };

        expect(collectionsResponse.collections).toBeInstanceOf(Array);
        expect(collectionsResponse.collections.length).toBeGreaterThan(0);
        
        const collection = collectionsResponse.collections[0];
        expect(collection.type).toBe('Collection');
        expect(collection.id).toBeDefined();
        expect(collection.extent).toBeDefined();
        expect(collection.extent.spatial).toBeDefined();
        expect(collection.extent.temporal).toBeDefined();
    });

    test('should validate USGS Landsat collection metadata', () => {
        const collection = {
            id: 'landsat-c2-l2',
            type: 'Collection',
            title: 'Landsat Collection 2 Level-2',
            description: 'Landsat Collection 2 Level-2 Science Products',
            stac_version: '1.0.0',
            license: 'proprietary',
            keywords: ['landsat', 'usgs', 'nasa', 'satellite', 'global'],
            providers: [
                {
                    name: 'NASA',
                    roles: ['producer'],
                    url: 'https://landsat.gsfc.nasa.gov/'
                },
                {
                    name: 'USGS',
                    roles: ['processor', 'host'],
                    url: 'https://www.usgs.gov/landsat-missions'
                }
            ],
            extent: {
                spatial: {
                    bbox: [[-180, -90, 180, 90]]
                },
                temporal: {
                    interval: [['1972-07-25T00:00:00Z', null]]
                }
            },
            summaries: {
                platform: ['landsat-4', 'landsat-5', 'landsat-7', 'landsat-8', 'landsat-9'],
                instruments: ['tm', 'etm+', 'oli', 'tirs']
            }
        };

        expect(collection.id).toBe('landsat-c2-l2');
        expect(collection.keywords).toContain('landsat');
        expect(collection.providers).toBeInstanceOf(Array);
        expect(collection.providers.length).toBeGreaterThan(0);
        expect(collection.summaries).toBeDefined();
        expect(collection.summaries.platform).toBeInstanceOf(Array);
    });

    test('should validate NASA CMR STAC API structure', () => {
        const cmrCollection = {
            id: 'HLSL30.v2.0',
            type: 'Collection',
            title: 'HLS Landsat Operational Land Imager Surface Reflectance and TOA Brightness Daily Global 30m v2.0',
            description: 'The Harmonized Landsat Sentinel-2 (HLS) project provides consistent surface reflectance data from Landsat 8 and Sentinel-2 satellites.',
            stac_version: '1.0.0',
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
        };

        expect(cmrCollection.id).toContain('.');
        expect(cmrCollection.title).toContain('HLS');
        expect(cmrCollection.links.some(l => l.rel === 'parent')).toBe(true);
        expect(cmrCollection.links[0].href).toContain('cmr.earthdata.nasa.gov');
    });
});

describe('API Collections Extraction', () => {
    test('should extract collection IDs from API responses', () => {
        const responses = [
            {
                api: 'Microsoft Planetary Computer',
                collections: ['landsat-c2-l2', 'sentinel-2-l2a', 'naip', 'cop-dem-glo-30']
            },
            {
                api: 'Earth Search',
                collections: ['sentinel-2-l2a', 'sentinel-2-l1c', 'landsat-c2-l2', 'cop-dem-glo-30']
            },
            {
                api: 'USGS Landsat',
                collections: ['landsat-c2l1', 'landsat-c2l2-sr', 'landsat-c2l2-st']
            }
        ];

        responses.forEach(({ api, collections }) => {
            expect(collections).toBeInstanceOf(Array);
            expect(collections.length).toBeGreaterThan(0);
            collections.forEach(id => {
                expect(typeof id).toBe('string');
                expect(id.length).toBeGreaterThan(0);
            });
        });
    });

    test('should track API processing statistics', () => {
        const stats = {
            totalRequests: 15,
            successfulRequests: 14,
            failedRequests: 1,
            apisProcessed: 3,
            stacCompliant: 3,
            nonCompliant: 0,
            collectionsFound: 25,
            collectionsSaved: 25,
            collectionsFailed: 0
        };

        expect(stats.successfulRequests + stats.failedRequests).toBe(stats.totalRequests);
        expect(stats.apisProcessed).toBe(3);
        expect(stats.stacCompliant).toBeGreaterThan(0);
        expect(stats.collectionsFound).toBeGreaterThan(stats.apisProcessed);
    });
});

describe('Batch Flushing for API Collections', () => {
    const BATCH_SIZE = 25;

    test('should check if collections reach batch size threshold', () => {
        const results = {
            collections: new Array(BATCH_SIZE).fill(null).map((_, i) => ({
                id: `sentinel-2-l2a-item-${i}`,
                title: `Sentinel-2 Item ${i}`,
                bbox: [-180, -90, 180, 90]
            })),
            stats: {
                collectionsSaved: 0,
                collectionsFailed: 0
            }
        };

        // Verify we have enough collections to trigger a flush
        expect(results.collections.length).toBe(BATCH_SIZE);
        expect(results.collections.length >= BATCH_SIZE).toBe(true);
    });

    test('should not flush collections below batch size', () => {
        const results = {
            collections: [
                { id: 'landsat-c2-l2-1', title: 'Landsat 1' },
                { id: 'landsat-c2-l2-2', title: 'Landsat 2' }
            ],
            stats: {
                collectionsSaved: 0,
                collectionsFailed: 0
            }
        };

        expect(results.collections.length).toBeLessThan(BATCH_SIZE);
        expect(results.collections.length >= BATCH_SIZE).toBe(false);
    });

    test('should track batch statistics correctly', () => {
        const stats = {
            collectionsSaved: 25,
            collectionsFailed: 2,
            collectionsFound: 27
        };

        expect(stats.collectionsSaved + stats.collectionsFailed).toBe(stats.collectionsFound);
        expect(stats.collectionsSaved).toBeGreaterThan(0);
    });
});

describe('API Discovery and Link Following', () => {
    test('should identify collections endpoint from API links', () => {
        const apiLinks = [
            { rel: 'self', href: 'https://planetarycomputer.microsoft.com/api/stac/v1' },
            { rel: 'root', href: 'https://planetarycomputer.microsoft.com/api/stac/v1' },
            { rel: 'data', href: 'https://planetarycomputer.microsoft.com/api/stac/v1/collections' },
            { rel: 'search', href: 'https://planetarycomputer.microsoft.com/api/stac/v1/search' }
        ];

        const collectionsLink = apiLinks.find(l => l.rel === 'data' || l.rel === 'collections');
        
        expect(collectionsLink).toBeDefined();
        expect(collectionsLink.href).toContain('/collections');
    });

    test('should handle child catalog links in API responses', () => {
        const apiWithChildren = {
            type: 'Catalog',
            id: 'root-catalog',
            links: [
                { rel: 'self', href: 'https://stac.terria.io' },
                { rel: 'child', href: 'https://stac.terria.io/catalogs/cbers', title: 'CBERS' },
                { rel: 'child', href: 'https://stac.terria.io/catalogs/dem', title: 'DEM' },
                { rel: 'child', href: 'https://stac.terria.io/catalogs/aster', title: 'ASTER' }
            ]
        };

        const childLinks = apiWithChildren.links.filter(l => l.rel === 'child');
        
        expect(childLinks.length).toBe(3);
        childLinks.forEach(link => {
            expect(link.href).toContain('stac.terria.io');
            expect(() => new URL(link.href)).not.toThrow();
        });
    });

    test('should construct absolute URLs from relative API links', () => {
        const baseUrl = 'https://earth-search.aws.element84.com/v1';
        const relativeLinks = [
            { relative: './collections', expected: 'https://earth-search.aws.element84.com/collections' },
            { relative: 'collections/sentinel-2-l2a', expected: 'https://earth-search.aws.element84.com/v1/collections/sentinel-2-l2a' }
        ];

        relativeLinks.forEach(({ relative, expected }) => {
            let absoluteUrl;
            if (!relative.startsWith('http')) {
                const basePath = baseUrl.substring(0, baseUrl.lastIndexOf('/'));
                absoluteUrl = relative.startsWith('./') 
                    ? `${basePath}/${relative.slice(2)}`
                    : `${baseUrl}/${relative}`;
            }
            
            // Basic check that it's now absolute
            expect(absoluteUrl || relative).toContain('https://');
        });
    });
});

describe('API Rate Limiting and Concurrency', () => {
    test('should calculate rate limits per domain', () => {
        const maxRequestsPerMinute = 120;
        const rateLimits = {
            maxRequestsPerMinute: maxRequestsPerMinute
        };

        expect(rateLimits.maxRequestsPerMinute).toBe(120);
        expect(rateLimits.maxRequestsPerMinute).toBeGreaterThan(0);
    });

    test('should group API URLs by domain for parallel crawling', () => {
        const apis = [
            { url: 'https://planetarycomputer.microsoft.com/api/stac/v1' },
            { url: 'https://earth-search.aws.element84.com/v1' },
            { url: 'https://planetarycomputer.microsoft.com/api/stac/v1/collections' },
            { url: 'https://landsatlook.usgs.gov/stac-server' }
        ];

        const domainMap = new Map();
        apis.forEach(api => {
            const domain = new URL(api.url).hostname;
            if (!domainMap.has(domain)) {
                domainMap.set(domain, []);
            }
            domainMap.get(domain).push(api);
        });

        expect(domainMap.size).toBe(3);
        expect(domainMap.get('planetarycomputer.microsoft.com').length).toBe(2);
        expect(domainMap.get('earth-search.aws.element84.com').length).toBe(1);
        expect(domainMap.get('landsatlook.usgs.gov').length).toBe(1);
    });

    test('should respect parallel domain concurrency limits', () => {
        const config = {
            parallelDomains: 5,
            maxRequestsPerMinutePerDomain: 120,
            maxConcurrencyPerDomain: 20
        };

        expect(config.parallelDomains).toBeLessThanOrEqual(10);
        expect(config.maxConcurrencyPerDomain).toBeGreaterThan(0);
        
        // Theoretical max throughput
        const maxThroughput = config.parallelDomains * config.maxRequestsPerMinutePerDomain;
        expect(maxThroughput).toBe(600);
    });
});

describe('S3 URL Handling in API Responses', () => {
    test('should convert S3 URLs to HTTPS', () => {
        const s3Urls = [
            { s3: 's3://usgs-landsat/collection02', expected: 'https://usgs-landsat.s3.amazonaws.com/collection02' },
            { s3: 's3://sentinel-s2-l2a/tiles/10/T/FK', expected: 'https://sentinel-s2-l2a.s3.amazonaws.com/tiles/10/T/FK' }
        ];

        s3Urls.forEach(({ s3, expected }) => {
            const s3Match = s3.match(/^s3:\/\/([^/]+)\/(.*)$/);
            if (s3Match) {
                const [, bucket, path] = s3Match;
                const httpsUrl = `https://${bucket}.s3.amazonaws.com/${path}`;
                expect(httpsUrl).toBe(expected);
            }
        });
    });

    test('should handle malformed S3 URLs gracefully', () => {
        const malformedUrls = [
            's3://',
            's3://bucket-only',
            's3:invalid',
            'not-s3://something'
        ];

        malformedUrls.forEach(url => {
            if (url.startsWith('s3://')) {
                const s3Match = url.match(/^s3:\/\/([^/]+)\/(.*)$/);
                expect(s3Match).toBeFalsy();
            }
        });
    });
});
