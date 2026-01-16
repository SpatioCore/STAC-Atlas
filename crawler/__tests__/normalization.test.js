/**
 * @fileoverview Unit tests for normalization utilities
 */

import { 
  deriveCategories, 
  normalizeCatalog, 
  normalizeCollection 
} from '../utils/normalization.js';

describe('normalization utilities', () => {
  describe('deriveCategories', () => {
    test('should return empty array for invalid input', () => {
      expect(deriveCategories(null)).toEqual([]);
      expect(deriveCategories(undefined)).toEqual([]);
    });

    test('should extract categories from categories field', () => {
      const catalog = { categories: ['climate', 'weather'] };
      expect(deriveCategories(catalog)).toEqual(['climate', 'weather']);
    });

    test('should extract from keywords if categories not present', () => {
      const catalog = { keywords: ['sentinel', 'satellite'] };
      expect(deriveCategories(catalog)).toEqual(['sentinel', 'satellite']);
    });

    test('should extract from tags if categories and keywords not present', () => {
      const catalog = { tags: ['landsat', 'imagery'] };
      expect(deriveCategories(catalog)).toEqual(['landsat', 'imagery']);
    });

    test('should extract from access field as fallback', () => {
      const catalog = { access: 'public' };
      expect(deriveCategories(catalog)).toEqual(['public']);
    });

    test('should filter out falsy values', () => {
      const catalog = { categories: ['climate', null, '', undefined, 'weather'] };
      expect(deriveCategories(catalog)).toEqual(['climate', 'weather']);
    });
  });

  describe('normalizeCatalog', () => {
    test('should normalize a basic catalog object', () => {
      const catalog = {
        id: 'test-catalog',
        url: 'https://example.com/catalog.json',
        title: 'Test Catalog',
        isApi: false
      };

      const result = normalizeCatalog(catalog, 0);

      expect(result.index).toBe(0);
      expect(result.id).toBe('test-catalog');
      expect(result.url).toBe('https://example.com/catalog.json');
      expect(result.title).toBe('Test Catalog');
    });

    test('should include derived categories', () => {
      const catalog = {
        id: 'test',
        url: 'https://example.com',
        keywords: ['climate', 'weather']
      };

      const result = normalizeCatalog(catalog, 5);
      expect(result.categories).toEqual(['climate', 'weather']);
      expect(result.index).toBe(5);
    });
  });

  describe('normalizeCollection', () => {
    test('should normalize collection with stac-js methods', () => {
      const mockCollection = {
        id: 'test-collection',
        title: 'Test Collection',
        getBoundingBox: () => [-180, -90, 180, 90],
        getTemporalExtent: () => ['2020-01-01', '2023-12-31'],
        getAbsoluteUrl: () => 'https://example.com/collections/test'
      };

      const result = normalizeCollection(mockCollection, 0);

      expect(result.id).toBe('test-collection');
      expect(result.title).toBe('Test Collection');
      expect(result.bbox).toEqual([-180, -90, 180, 90]);
    });

    test('should handle collection without stac-js methods', () => {
      const plainCollection = {
        id: 'plain-collection',
        title: 'Plain Collection',
        extent: {
          spatial: { bbox: [[-10, -10, 10, 10]] }
        }
      };

      const result = normalizeCollection(plainCollection, 1);

      expect(result.id).toBe('plain-collection');
      expect(result.bbox).toEqual([-10, -10, 10, 10]);
    });

    test('should use Unknown as default ID', () => {
      const collection = { title: 'No ID Collection' };
      const result = normalizeCollection(collection, 0);
      expect(result.id).toBe('Unknown');
    });
  });
});
