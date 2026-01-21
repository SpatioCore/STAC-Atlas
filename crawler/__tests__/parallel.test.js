/**
 * @fileoverview Unit tests for parallel execution utilities
 */

import { jest } from '@jest/globals';
import {
  getDomain,
  groupByDomain,
  createDomainBatches,
  aggregateStats,
  executeWithConcurrency,
  calculateRateLimits,
  logDomainStats
} from '../utils/parallel.js';

describe('parallel utilities', () => {
  describe('getDomain', () => {
    test('should extract domain from valid URL', () => {
      expect(getDomain('https://example.com/path')).toBe('example.com');
      expect(getDomain('http://api.example.org:8080/v1')).toBe('api.example.org');
      expect(getDomain('https://subdomain.example.co.uk/catalog.json')).toBe('subdomain.example.co.uk');
    });

    test('should return "unknown" for invalid URLs', () => {
      expect(getDomain('not-a-url')).toBe('unknown');
      expect(getDomain('')).toBe('unknown');
      expect(getDomain('://missing-protocol')).toBe('unknown');
    });

    test('should handle URLs with different protocols', () => {
      expect(getDomain('https://example.com')).toBe('example.com');
      expect(getDomain('http://example.com')).toBe('example.com');
      expect(getDomain('ftp://example.com')).toBe('example.com');
    });

    test('should ignore port numbers', () => {
      expect(getDomain('https://example.com:443/path')).toBe('example.com');
      expect(getDomain('http://example.com:8080/api')).toBe('example.com');
    });

    test('should handle URLs with query parameters and fragments', () => {
      expect(getDomain('https://example.com/path?query=value#fragment')).toBe('example.com');
      expect(getDomain('https://api.example.org/v1?key=123&format=json')).toBe('api.example.org');
    });
  });

  describe('groupByDomain', () => {
    test('should group items by domain', () => {
      const items = [
        { url: 'https://example.com/catalog1', name: 'catalog1' },
        { url: 'https://example.org/catalog2', name: 'catalog2' },
        { url: 'https://example.com/catalog3', name: 'catalog3' },
        { url: 'https://api.example.net/v1', name: 'api1' }
      ];

      const result = groupByDomain(items);

      expect(result.size).toBe(3);
      expect(result.get('example.com')).toHaveLength(2);
      expect(result.get('example.org')).toHaveLength(1);
      expect(result.get('api.example.net')).toHaveLength(1);
    });

    test('should handle empty array', () => {
      const result = groupByDomain([]);
      expect(result.size).toBe(0);
    });

    test('should handle single item', () => {
      const items = [{ url: 'https://example.com/catalog', name: 'catalog' }];
      const result = groupByDomain(items);

      expect(result.size).toBe(1);
      expect(result.get('example.com')).toHaveLength(1);
      expect(result.get('example.com')[0]).toEqual(items[0]);
    });

    test('should handle items with invalid URLs', () => {
      const items = [
        { url: 'https://example.com/valid', name: 'valid' },
        { url: 'invalid-url', name: 'invalid' },
        { url: 'https://example.org/valid2', name: 'valid2' }
      ];

      const result = groupByDomain(items);

      expect(result.size).toBe(3);
      expect(result.get('example.com')).toHaveLength(1);
      expect(result.get('unknown')).toHaveLength(1);
      expect(result.get('example.org')).toHaveLength(1);
    });

    test('should preserve original item objects', () => {
      const items = [
        { url: 'https://example.com/catalog1', id: 123, metadata: { foo: 'bar' } },
        { url: 'https://example.com/catalog2', id: 456, metadata: { baz: 'qux' } }
      ];

      const result = groupByDomain(items);
      const grouped = result.get('example.com');

      expect(grouped[0]).toEqual(items[0]);
      expect(grouped[1]).toEqual(items[1]);
    });
  });

  describe('createDomainBatches', () => {
    test('should create batches of specified size', () => {
      const domainMap = new Map([
        ['domain1.com', [{ url: 'https://domain1.com/1' }]],
        ['domain2.com', [{ url: 'https://domain2.com/2' }]],
        ['domain3.com', [{ url: 'https://domain3.com/3' }]],
        ['domain4.com', [{ url: 'https://domain4.com/4' }]],
        ['domain5.com', [{ url: 'https://domain5.com/5' }]],
        ['domain6.com', [{ url: 'https://domain6.com/6' }]]
      ]);

      const batches = createDomainBatches(domainMap, 2);

      expect(batches).toHaveLength(3);
      expect(batches[0]).toHaveLength(2);
      expect(batches[1]).toHaveLength(2);
      expect(batches[2]).toHaveLength(2);
    });

    test('should handle uneven batches', () => {
      const domainMap = new Map([
        ['domain1.com', []],
        ['domain2.com', []],
        ['domain3.com', []],
        ['domain4.com', []],
        ['domain5.com', []]
      ]);

      const batches = createDomainBatches(domainMap, 2);

      expect(batches).toHaveLength(3);
      expect(batches[0]).toHaveLength(2);
      expect(batches[1]).toHaveLength(2);
      expect(batches[2]).toHaveLength(1); // Last batch has remainder
    });

    test('should use default batch size of 5', () => {
      const domainMap = new Map([
        ['domain1.com', []],
        ['domain2.com', []],
        ['domain3.com', []],
        ['domain4.com', []],
        ['domain5.com', []],
        ['domain6.com', []]
      ]);

      const batches = createDomainBatches(domainMap);

      expect(batches).toHaveLength(2);
      expect(batches[0]).toHaveLength(5);
      expect(batches[1]).toHaveLength(1);
    });

    test('should handle empty domain map', () => {
      const batches = createDomainBatches(new Map(), 3);
      expect(batches).toHaveLength(0);
    });

    test('should handle domain map smaller than batch size', () => {
      const domainMap = new Map([
        ['domain1.com', []],
        ['domain2.com', []]
      ]);

      const batches = createDomainBatches(domainMap, 5);

      expect(batches).toHaveLength(1);
      expect(batches[0]).toHaveLength(2);
    });

    test('should preserve domain entries structure', () => {
      const domainMap = new Map([
        ['example.com', [{ url: 'https://example.com/1' }, { url: 'https://example.com/2' }]],
        ['test.org', [{ url: 'https://test.org/1' }]]
      ]);

      const batches = createDomainBatches(domainMap, 1);

      expect(batches[0][0][0]).toBe('example.com');
      expect(batches[0][0][1]).toHaveLength(2);
      expect(batches[1][0][0]).toBe('test.org');
      expect(batches[1][0][1]).toHaveLength(1);
    });
  });

  describe('aggregateStats', () => {
    test('should aggregate statistics from multiple results', () => {
      const results = [
        {
          stats: {
            totalRequests: 10,
            successfulRequests: 8,
            failedRequests: 2,
            collectionsFound: 5,
            collectionsSaved: 4,
            collectionsFailed: 1,
            catalogsProcessed: 3,
            apisProcessed: 1,
            stacCompliant: 7,
            nonCompliant: 3
          }
        },
        {
          stats: {
            totalRequests: 20,
            successfulRequests: 18,
            failedRequests: 2,
            collectionsFound: 10,
            collectionsSaved: 9,
            collectionsFailed: 1,
            catalogsProcessed: 5,
            apisProcessed: 2,
            stacCompliant: 15,
            nonCompliant: 5
          }
        }
      ];

      const aggregated = aggregateStats(results);

      expect(aggregated.totalRequests).toBe(30);
      expect(aggregated.successfulRequests).toBe(26);
      expect(aggregated.failedRequests).toBe(4);
      expect(aggregated.collectionsFound).toBe(15);
      expect(aggregated.collectionsSaved).toBe(13);
      expect(aggregated.collectionsFailed).toBe(2);
      expect(aggregated.catalogsProcessed).toBe(8);
      expect(aggregated.apisProcessed).toBe(3);
      expect(aggregated.stacCompliant).toBe(22);
      expect(aggregated.nonCompliant).toBe(8);
    });

    test('should handle empty results array', () => {
      const aggregated = aggregateStats([]);

      expect(aggregated.totalRequests).toBe(0);
      expect(aggregated.successfulRequests).toBe(0);
      expect(aggregated.failedRequests).toBe(0);
    });

    test('should handle results with missing stats', () => {
      const results = [
        { stats: { totalRequests: 10, successfulRequests: 8 } },
        { stats: null },
        { },
        { stats: { totalRequests: 5, successfulRequests: 5 } }
      ];

      const aggregated = aggregateStats(results);

      expect(aggregated.totalRequests).toBe(15);
      expect(aggregated.successfulRequests).toBe(13);
    });

    test('should handle partial statistics', () => {
      const results = [
        { stats: { totalRequests: 10, collectionsFound: 5 } },
        { stats: { successfulRequests: 8, collectionsSaved: 3 } }
      ];

      const aggregated = aggregateStats(results);

      expect(aggregated.totalRequests).toBe(10);
      expect(aggregated.successfulRequests).toBe(8);
      expect(aggregated.collectionsFound).toBe(5);
      expect(aggregated.collectionsSaved).toBe(3);
    });

    test('should initialize all fields to zero', () => {
      const aggregated = aggregateStats([]);

      expect(aggregated).toHaveProperty('totalRequests', 0);
      expect(aggregated).toHaveProperty('successfulRequests', 0);
      expect(aggregated).toHaveProperty('failedRequests', 0);
      expect(aggregated).toHaveProperty('collectionsFound', 0);
      expect(aggregated).toHaveProperty('collectionsSaved', 0);
      expect(aggregated).toHaveProperty('collectionsFailed', 0);
      expect(aggregated).toHaveProperty('catalogsProcessed', 0);
      expect(aggregated).toHaveProperty('apisProcessed', 0);
      expect(aggregated).toHaveProperty('stacCompliant', 0);
      expect(aggregated).toHaveProperty('nonCompliant', 0);
    });
  });

  describe('executeWithConcurrency', () => {
    test('should execute tasks with concurrency limit', async () => {
      let maxConcurrent = 0;
      let currentConcurrent = 0;

      const tasks = Array(10).fill(null).map((_, i) => async () => {
        currentConcurrent++;
        maxConcurrent = Math.max(maxConcurrent, currentConcurrent);
        await new Promise(resolve => setTimeout(resolve, 10));
        currentConcurrent--;
        return i;
      });

      const results = await executeWithConcurrency(tasks, 3);

      expect(results).toHaveLength(10);
      expect(maxConcurrent).toBeLessThanOrEqual(3);
      expect(results).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    });

    test('should handle task failures gracefully', async () => {
      const tasks = [
        async () => 'success1',
        async () => { throw new Error('Task failed'); },
        async () => 'success2'
      ];

      const results = await executeWithConcurrency(tasks, 2);

      expect(results[0]).toBe('success1');
      expect(results[1]).toEqual({ error: 'Task failed', stats: {} });
      expect(results[2]).toBe('success2');
    });

    test('should call progress callback', async () => {
      const progressCalls = [];
      const onProgress = (completed, total) => {
        progressCalls.push({ completed, total });
      };

      const tasks = Array(5).fill(null).map(() => async () => {
        await new Promise(resolve => setTimeout(resolve, 5));
        return 'done';
      });

      await executeWithConcurrency(tasks, 2, onProgress);

      expect(progressCalls).toHaveLength(5);
      expect(progressCalls[0]).toEqual({ completed: 1, total: 5 });
      expect(progressCalls[4]).toEqual({ completed: 5, total: 5 });
    });

    test('should handle empty task array', async () => {
      const results = await executeWithConcurrency([], 3);
      expect(results).toEqual([]);
    });

    test('should handle single task', async () => {
      const tasks = [async () => 'result'];
      const results = await executeWithConcurrency(tasks, 5);

      expect(results).toEqual(['result']);
    });

    test('should handle concurrency larger than task count', async () => {
      const tasks = Array(3).fill(null).map((_, i) => async () => i);
      const results = await executeWithConcurrency(tasks, 10);

      expect(results).toEqual([0, 1, 2]);
    });

    test('should preserve task order in results', async () => {
      const tasks = [
        async () => { await new Promise(resolve => setTimeout(resolve, 30)); return 'slow'; },
        async () => { await new Promise(resolve => setTimeout(resolve, 5)); return 'fast1'; },
        async () => { await new Promise(resolve => setTimeout(resolve, 10)); return 'fast2'; }
      ];

      const results = await executeWithConcurrency(tasks, 3);

      expect(results).toEqual(['slow', 'fast1', 'fast2']);
    });
  });

  describe('calculateRateLimits', () => {
    test('should return rate limit configuration with default value', () => {
      const config = calculateRateLimits();

      expect(config).toHaveProperty('maxRequestsPerMinute', 120);
    });

    test('should use custom maxRequestsPerMinute', () => {
      const config = calculateRateLimits(60);

      expect(config.maxRequestsPerMinute).toBe(60);
    });

    test('should handle different rate limit values', () => {
      expect(calculateRateLimits(30).maxRequestsPerMinute).toBe(30);
      expect(calculateRateLimits(240).maxRequestsPerMinute).toBe(240);
      expect(calculateRateLimits(10).maxRequestsPerMinute).toBe(10);
    });
  });

  describe('logDomainStats', () => {
    let consoleSpy;

    beforeEach(() => {
      consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    test('should log domain statistics', () => {
      const domainMap = new Map([
        ['example.com', [1, 2, 3, 4, 5]],
        ['test.org', [1, 2, 3]],
        ['api.example.net', [1]]
      ]);

      logDomainStats(domainMap, 'catalogs');

      expect(consoleSpy).toHaveBeenCalled();
      const calls = consoleSpy.mock.calls.map(call => call[0]).join('\n');
      expect(calls).toContain('Domain Distribution for catalogs');
      expect(calls).toContain('Total domains: 3');
      expect(calls).toContain('example.com: 5 catalogs');
      expect(calls).toContain('test.org: 3 catalogs');
    });

    test('should handle empty domain map', () => {
      logDomainStats(new Map(), 'items');

      const calls = consoleSpy.mock.calls.map(call => call[0]).join('\n');
      expect(calls).toContain('Total domains: 0');
    });

    test('should limit display to top 10 domains', () => {
      const domainMap = new Map();
      for (let i = 0; i < 15; i++) {
        domainMap.set(`domain${i}.com`, Array(i + 1).fill({}));
      }

      logDomainStats(domainMap);

      const calls = consoleSpy.mock.calls.map(call => call[0]).join('\n');
      expect(calls).toContain('Total domains: 15');
      expect(calls).toContain('and 5 more domains');
    });

    test('should sort domains by item count descending', () => {
      const domainMap = new Map([
        ['small.com', [1]],
        ['large.com', [1, 2, 3, 4, 5]],
        ['medium.com', [1, 2, 3]]
      ]);

      logDomainStats(domainMap);

      const calls = consoleSpy.mock.calls.map(call => call[0]).join('\n');
      const largeIndex = calls.indexOf('large.com');
      const mediumIndex = calls.indexOf('medium.com');
      const smallIndex = calls.indexOf('small.com');

      expect(largeIndex).toBeLessThan(mediumIndex);
      expect(mediumIndex).toBeLessThan(smallIndex);
    });

    test('should use default item type', () => {
      const domainMap = new Map([['example.com', [1, 2]]]);

      logDomainStats(domainMap);

      const calls = consoleSpy.mock.calls.map(call => call[0]).join('\n');
      expect(calls).toContain('items');
    });
  });
});
