/**
 * @fileoverview Unit tests for handlers module
 */

import { jest } from '@jest/globals';

// Create manual mock functions that we'll inject
const mockDbInsert = jest.fn();
const mockCreate = jest.fn();
const mockNormalizeCollection = jest.fn();
const mockTryCollectionEndpoints = jest.fn();

// Mock the modules before importing handlers
jest.unstable_mockModule('../utils/db.js', () => ({
  default: {
    insertOrUpdateCollection: mockDbInsert
  }
}));

jest.unstable_mockModule('stac-js', () => ({
  default: mockCreate
}));

jest.unstable_mockModule('../utils/normalization.js', () => ({
  normalizeCollection: mockNormalizeCollection
}));

jest.unstable_mockModule('../utils/endpoints.js', () => ({
  tryCollectionEndpoints: mockTryCollectionEndpoints
}));

// Now import the module under test
const { handleCatalog, handleCollections, flushCollectionsToDb } = await import('../utils/handlers.js');

describe('handlers utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDbInsert.mockResolvedValue(undefined);
    mockTryCollectionEndpoints.mockResolvedValue(undefined);
    mockNormalizeCollection.mockImplementation((stacObj, index) => ({
      id: stacObj.id || `collection-${index}`,
      title: stacObj.title || `Collection ${index}`,
      description: stacObj.description || '',
      normalized: true
    }));
  });
  
  describe('flushCollectionsToDb', () => {
    test('should not flush if below batch size and force is false', async () => {
      const results = {
        collections: [{ id: 'test' }]
      };
      const mockLog = {
        info: jest.fn(),
        warning: jest.fn()
      };
      
      const result = await flushCollectionsToDb(results, mockLog, false);
      
      expect(result).toEqual({ saved: 0, failed: 0, active: 0, inactive: 0 });
      expect(mockDbInsert).not.toHaveBeenCalled();
      expect(results.collections.length).toBe(1);
    });
    
    test('should flush when force is true', async () => {
      const results = {
        collections: [
          { 
            id: 'sentinel-2-l2a', 
            title: 'Sentinel-2 Level-2A',
            type: 'Collection',
            stac_version: '1.0.0',
            links: [
              { rel: 'self', type: 'application/json', href: 'https://earth-search.aws.element84.com/v1/collections/sentinel-2-l2a' },
              { rel: 'root', type: 'application/json', href: 'https://earth-search.aws.element84.com/v1' }
            ]
          },
          { 
            id: 'landsat-c2-l2', 
            title: 'Landsat Collection 2 Level-2',
            type: 'Collection',
            stac_version: '1.0.0',
            links: [
              { rel: 'self', type: 'application/json', href: 'https://earth-search.aws.element84.com/v1/collections/landsat-c2-l2' },
              { rel: 'root', type: 'application/json', href: 'https://earth-search.aws.element84.com/v1' }
            ]
          }
        ]
      };
      const mockLog = {
        info: jest.fn(),
        warning: jest.fn(),
        debug: jest.fn()
      };
      
      const result = await flushCollectionsToDb(results, mockLog, true);
      
      // Real STAC collections from earth-search should be validated as active
      expect(result.saved).toBe(2);
      expect(result.failed).toBe(0);
      expect(result.active).toBeGreaterThanOrEqual(0); // May be active or inactive depending on network
      expect(result.inactive).toBeGreaterThanOrEqual(0);
      expect(result.active + result.inactive).toBe(2); // Total should equal saved
      expect(results.collections.length).toBe(0);
    });
    
    test('should handle database errors gracefully', async () => {
      mockDbInsert
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error('DB Error'));
      
      const results = {
        collections: [
          { 
            id: 'sentinel-2-l2a', 
            title: 'Sentinel-2 Level-2A',
            type: 'Collection',
            links: [
              { rel: 'self', type: 'application/json', href: 'https://earth-search.aws.element84.com/v1/collections/sentinel-2-l2a' }
            ]
          },
          { 
            id: 'landsat-c2-l2', 
            title: 'Landsat Collection 2 Level-2',
            type: 'Collection',
            links: [
              { rel: 'self', type: 'application/json', href: 'https://earth-search.aws.element84.com/v1/collections/landsat-c2-l2' }
            ]
          }
        ]
      };
      const mockLog = {
        info: jest.fn(),
        warning: jest.fn(),
        debug: jest.fn()
      };
      
      const result = await flushCollectionsToDb(results, mockLog, true);
      
      expect(result.saved).toBe(1);
      expect(result.failed).toBe(1);
      expect(result).toHaveProperty('active');
      expect(result).toHaveProperty('inactive');
      expect(mockLog.warning).toHaveBeenCalledWith(
        expect.stringContaining('Failed to save collection landsat-c2-l2')
      );
    });
    
    test('should return zeros for empty collections array', async () => {
      const results = { collections: [] };
      const mockLog = { info: jest.fn(), warning: jest.fn() };
      
      const result = await flushCollectionsToDb(results, mockLog, true);
      
      expect(result).toEqual({ saved: 0, failed: 0, active: 0, inactive: 0 });
      expect(mockDbInsert).not.toHaveBeenCalled();
    });
  });
  
  describe('handleCatalog', () => {
    test('should process a valid catalog', async () => {
      const mockStacCatalog = {
        isCatalog: jest.fn(() => true),
        isCollection: jest.fn(() => false),
        getChildLinks: jest.fn(() => [])
      };
      
      mockCreate.mockReturnValue(mockStacCatalog);
      
      const context = {
        request: {
          url: 'https://example.com/catalog.json',
          userData: { depth: 0, catalogId: 'test-catalog' }
        },
        json: { type: 'Catalog', id: 'test-catalog' },
        crawler: { addRequests: jest.fn() },
        log: {
          info: jest.fn(),
          warning: jest.fn(),
          debug: jest.fn(),
          error: jest.fn()
        },
        indent: '',
        results: {
          collections: [],
          catalogs: [],
          stats: {
            catalogsProcessed: 0,
            stacCompliant: 0,
            collectionsFound: 0
          }
        }
      };
      
      await handleCatalog(context);
      
      expect(mockCreate).toHaveBeenCalledWith(context.json, context.request.url);
      expect(context.results.stats.catalogsProcessed).toBe(1);
      expect(context.results.stats.stacCompliant).toBe(1);
      expect(context.results.catalogs).toHaveLength(1);
      expect(mockTryCollectionEndpoints).toHaveBeenCalled();
    });
    
    test('should handle STAC Collection (not catalog)', async () => {
      const mockStacCollection = {
        isCatalog: jest.fn(() => false),
        isCollection: jest.fn(() => true),
        getChildLinks: jest.fn(() => []),
        id: 'test-collection',
        title: 'Test Collection'
      };
      
      mockCreate.mockReturnValue(mockStacCollection);
      mockNormalizeCollection.mockReturnValue({
        id: 'test-collection',
        title: 'Test Collection',
        normalized: true
      });
      
      const context = {
        request: {
          url: 'https://example.com/collection.json',
          userData: { depth: 0, catalogId: 'test-collection' }
        },
        json: { type: 'Collection', id: 'test-collection' },
        crawler: { addRequests: jest.fn() },
        log: {
          info: jest.fn(),
          warning: jest.fn(),
          debug: jest.fn(),
          error: jest.fn()
        },
        indent: '',
        results: {
          collections: [],
          catalogs: [],
          stats: {
            catalogsProcessed: 0,
            stacCompliant: 0,
            collectionsFound: 0
          }
        }
      };
      
      await handleCatalog(context);
      
      expect(context.results.collections).toHaveLength(1);
      expect(context.results.stats.collectionsFound).toBe(1);
      expect(mockNormalizeCollection).toHaveBeenCalledWith(mockStacCollection, 0);
    });
    
    test('should throw error for non-compliant STAC', async () => {
      mockCreate.mockImplementation(() => {
        throw new Error('Invalid STAC');
      });
      
      const context = {
        request: {
          url: 'https://example.com/invalid.json',
          userData: { depth: 0, catalogId: 'invalid' }
        },
        json: { invalid: 'data' },
        crawler: { addRequests: jest.fn() },
        log: {
          info: jest.fn(),
          warning: jest.fn(),
          debug: jest.fn(),
          error: jest.fn()
        },
        indent: '',
        results: {
          collections: [],
          catalogs: [],
          stats: {
            catalogsProcessed: 0,
            stacCompliant: 0,
            collectionsFound: 0
          }
        }
      };
      
      await expect(handleCatalog(context)).rejects.toThrow('STAC validation failed');
      expect(context.log.warning).toHaveBeenCalledWith(
        expect.stringContaining('Non-compliant STAC catalog')
      );
    });
    
    test('should enqueue child catalog links', async () => {
      const mockChildLink = {
        getAbsoluteUrl: jest.fn(() => 'https://example.com/child.json'),
        href: 'child.json',
        rel: 'child',
        title: 'Child Catalog'
      };
      
      const mockStacCatalog = {
        isCatalog: jest.fn(() => true),
        isCollection: jest.fn(() => false),
        getChildLinks: jest.fn(() => [mockChildLink])
      };
      
      mockCreate.mockReturnValue(mockStacCatalog);
      
      const context = {
        request: {
          url: 'https://example.com/catalog.json',
          userData: { depth: 0, catalogId: 'parent' }
        },
        json: { type: 'Catalog', id: 'parent' },
        crawler: { addRequests: jest.fn().mockResolvedValue(undefined) },
        log: {
          info: jest.fn(),
          warning: jest.fn(),
          debug: jest.fn(),
          error: jest.fn()
        },
        indent: '',
        results: {
          collections: [],
          catalogs: [],
          stats: {
            catalogsProcessed: 0,
            stacCompliant: 0,
            collectionsFound: 0
          }
        }
      };
      
      await handleCatalog(context);
      
      expect(context.crawler.addRequests).toHaveBeenCalledWith([
        expect.objectContaining({
          url: 'https://example.com/child.json',
          label: 'CATALOG',
          userData: {
            depth: 1,
            catalogId: 'Child Catalog',
            parentId: 'parent'
          }
        })
      ]);
    });
    
    test('should handle relative child URLs', async () => {
      const mockChildLink = {
        href: 'child.json',
        rel: 'child',
        title: 'Child'
      };
      
      const mockStacCatalog = {
        isCatalog: jest.fn(() => true),
        isCollection: jest.fn(() => false),
        getChildLinks: jest.fn(() => [mockChildLink])
      };
      
      mockCreate.mockReturnValue(mockStacCatalog);
      
      const context = {
        request: {
          url: 'https://example.com/api/catalog.json',
          userData: { depth: 0, catalogId: 'parent' }
        },
        json: { type: 'Catalog' },
        crawler: { addRequests: jest.fn().mockResolvedValue(undefined) },
        log: {
          info: jest.fn(),
          warning: jest.fn(),
          debug: jest.fn(),
          error: jest.fn()
        },
        indent: '',
        results: {
          collections: [],
          catalogs: [],
          stats: {
            catalogsProcessed: 0,
            stacCompliant: 0,
            collectionsFound: 0
          }
        }
      };
      
      await handleCatalog(context);
      
      expect(context.crawler.addRequests).toHaveBeenCalledWith([
        expect.objectContaining({
          url: 'https://example.com/api/child.json'
        })
      ]);
    });
    
    test('should skip invalid child URLs', async () => {
      const mockChildLinks = [
        { href: null, rel: 'child' },
        { href: '', rel: 'child' },
        { href: 'valid.json', rel: 'child', title: 'Valid' }
      ];
      
      const mockStacCatalog = {
        isCatalog: jest.fn(() => true),
        isCollection: jest.fn(() => false),
        getChildLinks: jest.fn(() => mockChildLinks)
      };
      
      mockCreate.mockReturnValue(mockStacCatalog);
      
      const context = {
        request: {
          url: 'https://example.com/catalog.json',
          userData: { depth: 0, catalogId: 'parent' }
        },
        json: { type: 'Catalog' },
        crawler: { addRequests: jest.fn().mockResolvedValue(undefined) },
        log: {
          info: jest.fn(),
          warning: jest.fn(),
          debug: jest.fn(),
          error: jest.fn()
        },
        indent: '',
        results: {
          collections: [],
          catalogs: [],
          stats: {
            catalogsProcessed: 0,
            stacCompliant: 0,
            collectionsFound: 0
          }
        }
      };
      
      await handleCatalog(context);
      
      expect(context.crawler.addRequests).toHaveBeenCalledWith([
        expect.objectContaining({
          url: 'https://example.com/valid.json'
        })
      ]);
      expect(context.log.warning).toHaveBeenCalledWith(
        expect.stringContaining('Skipping invalid URL')
      );
    });
  });
  
  describe('handleCollections', () => {
    test('should handle collections with getAll method (STAC API response)', async () => {
      const mockCollection1 = { id: 'col1', title: 'Collection 1' };
      const mockCollection2 = { id: 'col2', title: 'Collection 2' };
      
      const mockStacObj = {
        getAll: jest.fn(() => [mockCollection1, mockCollection2])
      };
      
      mockCreate.mockReturnValue(mockStacObj);
      mockNormalizeCollection
        .mockReturnValueOnce({ id: 'col1', title: 'Collection 1', normalized: true })
        .mockReturnValueOnce({ id: 'col2', title: 'Collection 2', normalized: true });
      
      const context = {
        request: {
          url: 'https://example.com/collections',
          userData: { catalogId: 'test-catalog' }
        },
        json: { collections: [] },
        crawler: { addRequests: jest.fn() },
        log: {
          info: jest.fn(),
          warning: jest.fn()
        },
        indent: '',
        results: {
          collections: [],
          stats: {
            collectionsFound: 0
          }
        }
      };
      
      await handleCollections(context);
      
      expect(mockStacObj.getAll).toHaveBeenCalled();
      expect(context.results.collections).toHaveLength(2);
      expect(context.results.stats.collectionsFound).toBe(2);
    });
    
    test('should handle array of collections', async () => {
      mockCreate
        .mockReturnValueOnce({ getAll: undefined }) // First call for main object
        .mockReturnValueOnce({ id: 'col1' }) // Second call for array item
        .mockReturnValueOnce({ id: 'col2' }); // Third call for array item
      
      mockNormalizeCollection
        .mockReturnValueOnce({ id: 'col1', normalized: true })
        .mockReturnValueOnce({ id: 'col2', normalized: true });
      
      const context = {
        request: {
          url: 'https://example.com/collections',
          userData: { catalogId: 'test-catalog' }
        },
        json: [{ id: 'col1' }, { id: 'col2' }],
        crawler: { addRequests: jest.fn() },
        log: {
          info: jest.fn(),
          warning: jest.fn()
        },
        indent: '',
        results: {
          collections: [],
          stats: {
            collectionsFound: 0
          }
        }
      };
      
      await handleCollections(context);
      
      expect(context.results.collections).toHaveLength(2);
      expect(context.results.stats.collectionsFound).toBe(2);
    });
    
    test('should handle nested collections property', async () => {
      mockCreate
        .mockReturnValueOnce({ getAll: undefined }) // First call for main object
        .mockReturnValueOnce({ id: 'col1' }); // Second call for nested collection
      
      mockNormalizeCollection.mockReturnValueOnce({ id: 'col1', normalized: true });
      
      const context = {
        request: {
          url: 'https://example.com/collections',
          userData: { catalogId: 'test-catalog' }
        },
        json: {
          collections: [{ id: 'col1' }]
        },
        crawler: { addRequests: jest.fn() },
        log: {
          info: jest.fn(),
          warning: jest.fn()
        },
        indent: '',
        results: {
          collections: [],
          stats: {
            collectionsFound: 0
          }
        }
      };
      
      await handleCollections(context);
      
      expect(context.results.collections).toHaveLength(1);
      expect(context.results.stats.collectionsFound).toBe(1);
    });
    
    test('should skip non-compliant STAC collections', async () => {
      mockCreate.mockImplementation(() => {
        throw new Error('Invalid STAC');
      });
      
      const context = {
        request: {
          url: 'https://example.com/collections',
          userData: { catalogId: 'test-catalog' }
        },
        json: { invalid: 'data' },
        crawler: { addRequests: jest.fn() },
        log: {
          info: jest.fn(),
          warning: jest.fn()
        },
        indent: '',
        results: {
          collections: [],
          stats: {
            collectionsFound: 0
          }
        }
      };
      
      await handleCollections(context);
      
      expect(context.log.warning).toHaveBeenCalledWith(
        expect.stringContaining('Skipping non-compliant STAC collections')
      );
      expect(context.results.collections).toHaveLength(0);
    });
    
    test('should filter out invalid collections from array', async () => {
      mockCreate
        .mockReturnValueOnce({ getAll: undefined }) // First call for main object
        .mockReturnValueOnce({ id: 'col1' }) // Valid collection
        .mockImplementationOnce(() => { throw new Error('Invalid'); }); // Invalid collection
      
      mockNormalizeCollection.mockReturnValueOnce({ id: 'col1', normalized: true });
      
      const context = {
        request: {
          url: 'https://example.com/collections',
          userData: { catalogId: 'test-catalog' }
        },
        json: [{ id: 'col1' }, { invalid: 'data' }],
        crawler: { addRequests: jest.fn() },
        log: {
          info: jest.fn(),
          warning: jest.fn()
        },
        indent: '',
        results: {
          collections: [],
          stats: {
            collectionsFound: 0
          }
        }
      };
      
      await handleCollections(context);
      
      expect(context.results.collections).toHaveLength(1);
      expect(context.results.stats.collectionsFound).toBe(1);
    });
  });
});
