/**
 * @fileoverview Unit tests for normalization utilities
 */

import { jest } from '@jest/globals';
import { 
    deriveCategories, 
    normalizeCatalog, 
    normalizeCollection,
    processCatalogs 
} from '../utils/normalization.js';

describe('deriveCategories', () => {
    test('should return empty array for null input', () => {
        expect(deriveCategories(null)).toEqual([]);
    });

    test('should return empty array for undefined input', () => {
        expect(deriveCategories(undefined)).toEqual([]);
    });

    test('should return empty array for non-object input', () => {
        expect(deriveCategories('string')).toEqual([]);
        expect(deriveCategories(123)).toEqual([]);
    });

    test('should extract categories from categories field', () => {
        const catalog = { categories: ['imagery', 'satellite'] };
        expect(deriveCategories(catalog)).toEqual(['imagery', 'satellite']);
    });

    test('should filter out falsy values from categories', () => {
        const catalog = { categories: ['imagery', null, '', 'satellite', undefined] };
        expect(deriveCategories(catalog)).toEqual(['imagery', 'satellite']);
    });

    test('should extract categories from keywords field', () => {
        const catalog = { keywords: ['landsat', 'modis'] };
        expect(deriveCategories(catalog)).toEqual(['landsat', 'modis']);
    });

    test('should extract categories from tags field', () => {
        const catalog = { tags: ['climate', 'weather'] };
        expect(deriveCategories(catalog)).toEqual(['climate', 'weather']);
    });

    test('should extract category from access field', () => {
        const catalog = { access: 'public' };
        expect(deriveCategories(catalog)).toEqual(['public']);
    });

    test('should trim whitespace from access field', () => {
        const catalog = { access: '  restricted  ' };
        expect(deriveCategories(catalog)).toEqual(['restricted']);
    });

    test('should ignore empty access field', () => {
        const catalog = { access: '   ' };
        expect(deriveCategories(catalog)).toEqual([]);
    });

    test('should prioritize categories over keywords', () => {
        const catalog = { 
            categories: ['cat1'], 
            keywords: ['key1'] 
        };
        expect(deriveCategories(catalog)).toEqual(['cat1']);
    });

    test('should prioritize keywords over tags', () => {
        const catalog = { 
            keywords: ['key1'], 
            tags: ['tag1'] 
        };
        expect(deriveCategories(catalog)).toEqual(['key1']);
    });

    test('should prioritize tags over access', () => {
        const catalog = { 
            tags: ['tag1'], 
            access: 'public' 
        };
        expect(deriveCategories(catalog)).toEqual(['tag1']);
    });

    test('should convert non-string array elements to strings', () => {
        const catalog = { categories: [1, 2, true, 'test'] };
        expect(deriveCategories(catalog)).toEqual(['1', '2', 'true', 'test']);
    });
});

describe('normalizeCatalog', () => {
    test('should normalize a basic catalog object', () => {
        const catalog = {
            id: 'microsoft-pc',
            url: 'https://planetarycomputer.microsoft.com/api/stac/v1',
            slug: 'microsoft-planetary-computer',
            title: 'Microsoft Planetary Computer STAC API',
            summary: 'A test catalog',
            access: 'public',
            created: '2024-01-01',
            updated: '2024-01-02',
            isPrivate: false,
            isApi: true,
            accessInfo: 'Free access'
        };

        const result = normalizeCatalog(catalog, 5);

        expect(result.index).toBe(5);
        expect(result.id).toBe('microsoft-pc');
        expect(result.url).toBe('https://planetarycomputer.microsoft.com/api/stac/v1');
        expect(result.slug).toBe('microsoft-planetary-computer');
        expect(result.title).toBe('Microsoft Planetary Computer STAC API');
        expect(result.summary).toBe('A test catalog');
        expect(result.access).toBe('public');
        expect(result.created).toBe('2024-01-01');
        expect(result.updated).toBe('2024-01-02');
        expect(result.isPrivate).toBe(false);
        expect(result.isApi).toBe(true);
        expect(result.accessInfo).toBe('Free access');
    });

    test('should derive categories from catalog', () => {
        const catalog = {
            id: 'usgs-landsat',
            url: 'https://landsatlook.usgs.gov/stac-server',
            categories: ['imagery', 'satellite']
        };

        const result = normalizeCatalog(catalog, 0);
        expect(result.categories).toEqual(['imagery', 'satellite']);
    });

    test('should preserve additional dynamic properties', () => {
        const catalog = {
            id: 'test',
            url: 'https://example.com',
            customField: 'custom value',
            anotherField: 123
        };

        const result = normalizeCatalog(catalog, 0);
        expect(result.customField).toBe('custom value');
        expect(result.anotherField).toBe(123);
    });

    test('should not duplicate standard properties in dynamic properties', () => {
        const catalog = {
            id: 'test',
            url: 'https://example.com',
            title: 'Test'
        };

        const result = normalizeCatalog(catalog, 0);
        const keys = Object.keys(result);
        const idCount = keys.filter(k => k === 'id').length;
        expect(idCount).toBe(1);
    });
});

describe('normalizeCollection', () => {
    test('should normalize a plain collection object', () => {
        const collection = {
            id: 'sentinel-2-l2a',
            title: 'Sentinel-2 Level-2A',
            description: 'Sentinel-2 Level-2A, orthorectified atmosphere-corrected surface reflectance',
            license: 'proprietary',
            keywords: ['sentinel', 'copernicus', 'esa', 'msi', 'reflectance'],
            extent: {
                spatial: { bbox: [[-180, -90, 180, 90]] },
                temporal: { interval: [['2015-06-27T10:25:31Z', null]] }
            },
            links: [
                { rel: 'self', href: 'https://earth-search.aws.element84.com/v1/collections/sentinel-2-l2a' }
            ],
            stac_version: '1.0.0',
            type: 'Collection',
            summaries: { 'eo:bands': [] },
            stac_extensions: ['https://stac-extensions.github.io/eo/v1.0.0/schema.json'],
            providers: [{ name: 'Test Provider' }],
            assets: {}
        };

        const result = normalizeCollection(collection, 0);

        expect(result.index).toBe(0);
        expect(result.id).toBe('sentinel-2-l2a');
        expect(result.title).toBe('Sentinel-2 Level-2A');
        expect(result.description).toBe('Sentinel-2 Level-2A, orthorectified atmosphere-corrected surface reflectance');
        expect(result.license).toBe('proprietary');
        expect(result.keywords).toEqual(['sentinel', 'copernicus', 'esa', 'msi', 'reflectance']);
        expect(result.bbox).toEqual([-180, -90, 180, 90]);
        expect(result.temporal).toEqual(['2015-06-27T10:25:31Z', null]);
        expect(result.url).toBe('https://earth-search.aws.element84.com/v1/collections/sentinel-2-l2a');
        expect(result.stac_version).toBe('1.0.0');
        expect(result.type).toBe('Collection');
    });

    test('should handle stac-js object with getBoundingBox method', () => {
        const collection = {
            id: 'test',
            getBoundingBox: () => [0, 0, 10, 10],
            extent: {
                spatial: { bbox: [[-180, -90, 180, 90]] }
            }
        };

        const result = normalizeCollection(collection, 0);
        expect(result.bbox).toEqual([0, 0, 10, 10]);
    });

    test('should handle stac-js object with getTemporalExtent method', () => {
        const collection = {
            id: 'test',
            getTemporalExtent: () => ['2020-01-01', '2023-12-31'],
            extent: {
                temporal: { interval: [['2019-01-01', '2022-12-31']] }
            }
        };

        const result = normalizeCollection(collection, 0);
        expect(result.temporal).toEqual(['2020-01-01', '2023-12-31']);
    });

    test('should fallback to extent.spatial.bbox when methods unavailable', () => {
        const collection = {
            id: 'test',
            extent: {
                spatial: { bbox: [[1, 2, 3, 4]] }
            }
        };

        const result = normalizeCollection(collection, 0);
        expect(result.bbox).toEqual([1, 2, 3, 4]);
    });

    test('should fallback to extent.temporal.interval when methods unavailable', () => {
        const collection = {
            id: 'test',
            extent: {
                temporal: { interval: [['2020-01-01', null]] }
            }
        };

        const result = normalizeCollection(collection, 0);
        expect(result.temporal).toEqual(['2020-01-01', null]);
    });

    test('should handle stac-js object with getAbsoluteUrl method', () => {
        const collection = {
            id: 'test',
            getAbsoluteUrl: () => 'https://example.com/absolute'
        };

        const result = normalizeCollection(collection, 0);
        expect(result.url).toBe('https://example.com/absolute');
    });

    test('should extract self link from links array', () => {
        const collection = {
            id: 'landsat-c2-l2',
            links: [
                { rel: 'root', href: 'https://planetarycomputer.microsoft.com/api/stac/v1' },
                { rel: 'self', href: 'https://planetarycomputer.microsoft.com/api/stac/v1/collections/landsat-c2-l2' }
            ]
        };

        const result = normalizeCollection(collection, 0);
        expect(result.url).toBe('https://planetarycomputer.microsoft.com/api/stac/v1/collections/landsat-c2-l2');
    });

    test('should use summary field if description is missing', () => {
        const collection = {
            id: 'test',
            summary: 'This is a summary'
        };

        const result = normalizeCollection(collection, 0);
        expect(result.description).toBe('This is a summary');
    });

    test('should prefer description over summary', () => {
        const collection = {
            id: 'test',
            description: 'Description text',
            summary: 'Summary text'
        };

        const result = normalizeCollection(collection, 0);
        expect(result.description).toBe('Description text');
    });

    test('should handle stac-js object with toJSON method', () => {
        const collection = {
            id: 'test-from-method',
            toJSON: () => ({
                id: 'test-from-json',
                title: 'JSON Title',
                extent: {
                    spatial: { bbox: [[5, 6, 7, 8]] }
                }
            })
        };

        const result = normalizeCollection(collection, 0);
        expect(result.id).toBe('test-from-method'); // Direct property takes precedence
        expect(result.bbox).toEqual([5, 6, 7, 8]); // Fallback from toJSON
    });

    test('should convert stac-js link objects to plain objects', () => {
        const collection = {
            id: 'cop-dem-glo-30',
            links: [
                { rel: 'self', href: 'https://planetarycomputer.microsoft.com/api/stac/v1/collections/cop-dem-glo-30', type: 'application/json', title: 'Self' }
            ]
        };

        const result = normalizeCollection(collection, 0);
        expect(result.links).toEqual([
            { rel: 'self', href: 'https://planetarycomputer.microsoft.com/api/stac/v1/collections/cop-dem-glo-30', type: 'application/json', title: 'Self' }
        ]);
    });

    test('should default to Unknown for missing id', () => {
        const collection = {};

        const result = normalizeCollection(collection, 0);
        expect(result.id).toBe('Unknown');
    });

    test('should default to Collection for missing type', () => {
        const collection = { id: 'test' };

        const result = normalizeCollection(collection, 0);
        expect(result.type).toBe('Collection');
    });

    test('should handle null values gracefully', () => {
        const collection = {
            id: 'test',
            title: null,
            description: null,
            license: null,
            bbox: null,
            temporal: null
        };

        const result = normalizeCollection(collection, 0);
        expect(result.title).toBeNull();
        expect(result.description).toBeNull();
        expect(result.license).toBeNull();
        expect(result.bbox).toBeNull();
        expect(result.temporal).toBeNull();
    });

    test('should default empty array for keywords', () => {
        const collection = { id: 'test' };

        const result = normalizeCollection(collection, 0);
        expect(result.keywords).toEqual([]);
    });

    test('should default empty array for stac_extensions', () => {
        const collection = { id: 'test' };

        const result = normalizeCollection(collection, 0);
        expect(result.stac_extensions).toEqual([]);
    });

    test('should default empty array for providers', () => {
        const collection = { id: 'test' };

        const result = normalizeCollection(collection, 0);
        expect(result.providers).toEqual([]);
    });
});

describe('processCatalogs', () => {
    // Mock console.log to avoid clutter in test output
    beforeEach(() => {
        jest.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(() => {
        console.log.mockRestore();
    });

    test('should throw error for non-array input', () => {
        expect(() => processCatalogs('not an array')).toThrow('Expected an array');
        expect(() => processCatalogs(null)).toThrow('Expected an array');
        expect(() => processCatalogs({})).toThrow('Expected an array');
    });

    test('should process empty array', () => {
        const result = processCatalogs([]);
        expect(result).toEqual([]);
        expect(result.length).toBe(0);
    });

    test('should normalize all catalogs in array', () => {
        const catalogs = [
            { id: 'microsoft-pc', url: 'https://planetarycomputer.microsoft.com/api/stac/v1', title: 'Microsoft Planetary Computer' },
            { id: 'earth-search', url: 'https://earth-search.aws.element84.com/v1', title: 'Earth Search by Element 84' },
            { id: 'usgs-landsat', url: 'https://landsatlook.usgs.gov/stac-server', title: 'USGS Landsat' }
        ];

        const result = processCatalogs(catalogs);
        expect(result.length).toBe(3);
        expect(result[0].id).toBe('microsoft-pc');
        expect(result[0].index).toBe(0);
        expect(result[1].id).toBe('earth-search');
        expect(result[1].index).toBe(1);
        expect(result[2].id).toBe('usgs-landsat');
        expect(result[2].index).toBe(2);
    });

    test('should maintain index order', () => {
        const catalogs = [
            { id: 'planetary-computer', url: 'https://planetarycomputer.microsoft.com/api/stac/v1' },
            { id: 'earth-search', url: 'https://earth-search.aws.element84.com/v1' },
            { id: 'copernicus', url: 'https://catalogue.dataspace.copernicus.eu/stac' }
        ];

        const result = processCatalogs(catalogs);
        expect(result[0].index).toBe(0);
        expect(result[1].index).toBe(1);
        expect(result[2].index).toBe(2);
    });

    test('should log summary information', () => {
        const catalogs = [
            { id: 'nasa-cmr', url: 'https://cmr.earthdata.nasa.gov/stac', title: 'NASA CMR STAC', isApi: true, categories: ['satellite', 'nasa'] }
        ];

        processCatalogs(catalogs);

        expect(console.log).toHaveBeenCalledWith('Total: 1 catalogs found\n');
        expect(console.log).toHaveBeenCalledWith('Example - First Catalog:');
    });

    test('should not log example for empty array', () => {
        processCatalogs([]);

        expect(console.log).toHaveBeenCalledWith('Total: 0 catalogs found\n');
        expect(console.log).not.toHaveBeenCalledWith('Example - First Catalog:');
    });
});
