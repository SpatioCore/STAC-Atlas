/**
 * @fileoverview Unit tests for endpoint utilities
 */

import { jest } from '@jest/globals';
import { tryCollectionEndpoints } from '../utils/endpoints.js';

describe('endpoints utilities', () => {
  describe('tryCollectionEndpoints', () => {
    test('should find collection endpoint from STAC links with rel="data"', async () => {
      const mockCrawler = {
        addRequests: jest.fn().mockResolvedValue(undefined)
      };
      
      const mockLog = {
        info: jest.fn(),
        debug: jest.fn(),
        warning: jest.fn()
      };

      const mockStacCatalog = {
        getLinks: jest.fn().mockReturnValue([
          { 
            rel: 'data', 
            href: 'https://example.com/collections',
            getAbsoluteUrl: jest.fn().mockReturnValue('https://example.com/collections')
          }
        ])
      };

      await tryCollectionEndpoints(
        mockStacCatalog,
        'https://example.com/catalog.json',
        'test-catalog',
        0,
        mockCrawler,
        mockLog,
        ''
      );

      expect(mockCrawler.addRequests).toHaveBeenCalledWith([
        expect.objectContaining({
          url: 'https://example.com/collections',
          label: 'COLLECTIONS'
        })
      ]);
    });

    test('should use fallback /collections endpoint if no link found', async () => {
      const mockCrawler = {
        addRequests: jest.fn().mockResolvedValue(undefined)
      };
      
      const mockLog = {
        info: jest.fn(),
        debug: jest.fn(),
        warning: jest.fn()
      };

      const mockStacCatalog = {
        getLinks: jest.fn().mockReturnValue([])
      };

      await tryCollectionEndpoints(
        mockStacCatalog,
        'https://example.com/catalog.json',
        'test-catalog',
        0,
        mockCrawler,
        mockLog,
        ''
      );

      expect(mockCrawler.addRequests).toHaveBeenCalledWith([
        expect.objectContaining({
          url: 'https://example.com/collections'
        })
      ]);
    });

    test('should handle catalog without getLinks method', async () => {
      const mockCrawler = {
        addRequests: jest.fn().mockResolvedValue(undefined)
      };
      
      const mockLog = {
        info: jest.fn(),
        debug: jest.fn(),
        warning: jest.fn()
      };

      await tryCollectionEndpoints(
        null,
        'https://example.com/api/catalog',
        'test-catalog',
        0,
        mockCrawler,
        mockLog,
        ''
      );

      expect(mockCrawler.addRequests).toHaveBeenCalledWith([
        expect.objectContaining({
          url: 'https://example.com/api/collections'
        })
      ]);
    });

    test('should remove .json filename from base URL for fallback', async () => {
      const mockCrawler = {
        addRequests: jest.fn().mockResolvedValue(undefined)
      };
      
      const mockLog = {
        info: jest.fn(),
        debug: jest.fn(),
        warning: jest.fn()
      };

      await tryCollectionEndpoints(
        null,
        'https://example.com/stac/catalog.json',
        'test-catalog',
        0,
        mockCrawler,
        mockLog,
        ''
      );

      expect(mockCrawler.addRequests).toHaveBeenCalledWith([
        expect.objectContaining({
          url: 'https://example.com/stac/collections'
        })
      ]);
    });
  });
});
