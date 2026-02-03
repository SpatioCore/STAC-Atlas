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

describe('getDomain', () => {
    test('should extract domain from valid URL', () => {
        expect(getDomain('https://planetarycomputer.microsoft.com/api/stac/v1')).toBe('planetarycomputer.microsoft.com');
        expect(getDomain('http://earth-search.aws.element84.com/v1')).toBe('earth-search.aws.element84.com');
        expect(getDomain('https://landsatlook.usgs.gov/stac-server')).toBe('landsatlook.usgs.gov');
    });

    test('should handle URLs with ports', () => {
        expect(getDomain('https://planetarycomputer.microsoft.com:8080/path')).toBe('planetarycomputer.microsoft.com');
        expect(getDomain('http://localhost:8080/stac')).toBe('localhost');
    });

    test('should handle URLs with query parameters', () => {
        expect(getDomain('https://earth-search.aws.element84.com/v1/search?limit=10')).toBe('earth-search.aws.element84.com');
    });

    test('should handle URLs with hash fragments', () => {
        expect(getDomain('https://catalogue.dataspace.copernicus.eu/stac#collections')).toBe('catalogue.dataspace.copernicus.eu');
    });

    test('should return "unknown" for invalid URLs', () => {
        expect(getDomain('not a url')).toBe('unknown');
        expect(getDomain('')).toBe('unknown');
        expect(getDomain('//invalid')).toBe('unknown');
    });

    test('should handle different protocols', () => {
        expect(getDomain('ftp://data.lpdaac.earthdatacloud.nasa.gov')).toBe('data.lpdaac.earthdatacloud.nasa.gov');
        expect(getDomain('ws://stac-api.terria.io')).toBe('stac-api.terria.io');
    });
});

describe('groupByDomain', () => {
    test('should group items by domain', () => {
        const items = [
            { url: 'https://planetarycomputer.microsoft.com/api/stac/v1/collections/landsat-c2-l2' },
            { url: 'https://earth-search.aws.element84.com/v1/collections/sentinel-2-l2a' },
            { url: 'https://planetarycomputer.microsoft.com/api/stac/v1/collections/sentinel-2-l2a' }
        ];

        const result = groupByDomain(items);

        expect(result.size).toBe(2);
        expect(result.get('planetarycomputer.microsoft.com').length).toBe(2);
        expect(result.get('earth-search.aws.element84.com').length).toBe(1);
    });

    test('should handle empty array', () => {
        const result = groupByDomain([]);
        expect(result.size).toBe(0);
    });

    test('should handle single domain', () => {
        const items = [
            { url: 'https://landsatlook.usgs.gov/stac-server/collections/landsat-c2l1' },
            { url: 'https://landsatlook.usgs.gov/stac-server/collections/landsat-c2l2-st' },
            { url: 'https://landsatlook.usgs.gov/stac-server/collections/landsat-c2l2-sr' }
        ];

        const result = groupByDomain(items);

        expect(result.size).toBe(1);
        expect(result.get('landsatlook.usgs.gov').length).toBe(3);
    });

    test('should preserve item data', () => {
        const items = [
            { url: 'https://planetarycomputer.microsoft.com/api/stac/v1/collections/landsat-c2-l2', id: 'landsat-c2-l2', data: 'test' },
            { url: 'https://planetarycomputer.microsoft.com/api/stac/v1/collections/sentinel-2-l2a', id: 'sentinel-2-l2a', data: 'test2' }
        ];

        const result = groupByDomain(items);
        const domainItems = result.get('planetarycomputer.microsoft.com');

        expect(domainItems[0].id).toBe('landsat-c2-l2');
        expect(domainItems[0].data).toBe('test');
        expect(domainItems[1].id).toBe('sentinel-2-l2a');
    });

    test('should handle invalid URLs by grouping under "unknown"', () => {
        const items = [
            { url: 'invalid url 1' },
            { url: 'invalid url 2' },
            { url: 'https://earth-search.aws.element84.com/v1' }
        ];

        const result = groupByDomain(items);

        expect(result.has('unknown')).toBe(true);
        expect(result.get('unknown').length).toBe(2);
        expect(result.get('earth-search.aws.element84.com').length).toBe(1);
    });

    test('should handle subdomains as separate domains', () => {
        const items = [
            { url: 'https://stac.terria.io/catalogs/cbers' },
            { url: 'https://data.lpdaac.earthdatacloud.nasa.gov/stac' },
            { url: 'https://cmr.earthdata.nasa.gov/stac' }
        ];

        const result = groupByDomain(items);

        expect(result.size).toBe(3);
        expect(result.has('stac.terria.io')).toBe(true);
        expect(result.has('data.lpdaac.earthdatacloud.nasa.gov')).toBe(true);
        expect(result.has('cmr.earthdata.nasa.gov')).toBe(true);
    });
});

describe('createDomainBatches', () => {
    test('should create batches of specified size', () => {
        const domainMap = new Map([
            ['domain1.com', [1, 2, 3]],
            ['domain2.com', [4, 5]],
            ['domain3.com', [6]],
            ['domain4.com', [7, 8]],
            ['domain5.com', [9]],
            ['domain6.com', [10]]
        ]);

        const batches = createDomainBatches(domainMap, 2);

        expect(batches.length).toBe(3);
        expect(batches[0].length).toBe(2);
        expect(batches[1].length).toBe(2);
        expect(batches[2].length).toBe(2);
    });

    test('should handle remainder in last batch', () => {
        const domainMap = new Map([
            ['domain1.com', []],
            ['domain2.com', []],
            ['domain3.com', []]
        ]);

        const batches = createDomainBatches(domainMap, 2);

        expect(batches.length).toBe(2);
        expect(batches[0].length).toBe(2);
        expect(batches[1].length).toBe(1);
    });

    test('should use default batch size of 5', () => {
        const domainMap = new Map([
            ['d1', []], ['d2', []], ['d3', []], ['d4', []], ['d5', []],
            ['d6', []], ['d7', []], ['d8', []], ['d9', []], ['d10', []]
        ]);

        const batches = createDomainBatches(domainMap);

        expect(batches.length).toBe(2);
        expect(batches[0].length).toBe(5);
        expect(batches[1].length).toBe(5);
    });

    test('should handle empty domain map', () => {
        const domainMap = new Map();
        const batches = createDomainBatches(domainMap, 5);

        expect(batches.length).toBe(0);
    });

    test('should handle domain map smaller than batch size', () => {
        const domainMap = new Map([
            ['domain1.com', [1, 2]],
            ['domain2.com', [3]]
        ]);

        const batches = createDomainBatches(domainMap, 5);

        expect(batches.length).toBe(1);
        expect(batches[0].length).toBe(2);
    });

    test('should preserve domain-items pairs correctly', () => {
        const domainMap = new Map([
            ['planetarycomputer.microsoft.com', ['landsat-c2-l2', 'sentinel-2-l2a']],
            ['earth-search.aws.element84.com', ['sentinel-2-l1c', 'landsat-c2-l1']]
        ]);

        const batches = createDomainBatches(domainMap, 2);

        expect(batches[0][0][0]).toBe('planetarycomputer.microsoft.com');
        expect(batches[0][0][1]).toEqual(['landsat-c2-l2', 'sentinel-2-l2a']);
        expect(batches[0][1][0]).toBe('earth-search.aws.element84.com');
        expect(batches[0][1][1]).toEqual(['sentinel-2-l1c', 'landsat-c2-l1']);
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
                    collectionsFailed: 1
                }
            },
            {
                stats: {
                    totalRequests: 20,
                    successfulRequests: 18,
                    failedRequests: 2,
                    collectionsFound: 10,
                    collectionsSaved: 9,
                    collectionsFailed: 1
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
    });

    test('should handle empty results array', () => {
        const aggregated = aggregateStats([]);

        expect(aggregated.totalRequests).toBe(0);
        expect(aggregated.successfulRequests).toBe(0);
        expect(aggregated.failedRequests).toBe(0);
    });

    test('should handle results with missing stats', () => {
        const results = [
            { stats: { totalRequests: 10 } },
            { stats: null },
            { otherField: 'value' }
        ];

        const aggregated = aggregateStats(results);

        expect(aggregated.totalRequests).toBe(10);
        expect(aggregated.successfulRequests).toBe(0);
    });

    test('should include all standard stat fields', () => {
        const results = [
            {
                stats: {
                    totalRequests: 5,
                    successfulRequests: 4,
                    failedRequests: 1,
                    collectionsFound: 2,
                    collectionsSaved: 2,
                    collectionsFailed: 0,
                    catalogsProcessed: 1,
                    apisProcessed: 0,
                    stacCompliant: 1,
                    nonCompliant: 0
                }
            }
        ];

        const aggregated = aggregateStats(results);

        expect(aggregated).toHaveProperty('totalRequests');
        expect(aggregated).toHaveProperty('successfulRequests');
        expect(aggregated).toHaveProperty('failedRequests');
        expect(aggregated).toHaveProperty('collectionsFound');
        expect(aggregated).toHaveProperty('collectionsSaved');
        expect(aggregated).toHaveProperty('collectionsFailed');
        expect(aggregated).toHaveProperty('catalogsProcessed');
        expect(aggregated).toHaveProperty('apisProcessed');
        expect(aggregated).toHaveProperty('stacCompliant');
        expect(aggregated).toHaveProperty('nonCompliant');
    });

    test('should ignore non-numeric values', () => {
        const results = [
            {
                stats: {
                    totalRequests: 10,
                    successfulRequests: 'invalid',
                    failedRequests: null,
                    collectionsFound: undefined
                }
            }
        ];

        const aggregated = aggregateStats(results);

        expect(aggregated.totalRequests).toBe(10);
        expect(aggregated.successfulRequests).toBe(0);
        expect(aggregated.failedRequests).toBe(0);
        expect(aggregated.collectionsFound).toBe(0);
    });

    test('should handle partial stats objects', () => {
        const results = [
            { stats: { totalRequests: 5 } },
            { stats: { successfulRequests: 10, collectionsFound: 3 } }
        ];

        const aggregated = aggregateStats(results);

        expect(aggregated.totalRequests).toBe(5);
        expect(aggregated.successfulRequests).toBe(10);
        expect(aggregated.collectionsFound).toBe(3);
        expect(aggregated.failedRequests).toBe(0);
    });
});

describe('executeWithConcurrency', () => {
    test('should execute tasks with concurrency limit', async () => {
        let concurrentCount = 0;
        let maxConcurrent = 0;

        const createTask = (delay) => async () => {
            concurrentCount++;
            maxConcurrent = Math.max(maxConcurrent, concurrentCount);
            await new Promise(resolve => setTimeout(resolve, delay));
            concurrentCount--;
            return delay;
        };

        const tasks = [
            createTask(50),
            createTask(50),
            createTask(50),
            createTask(50),
            createTask(50)
        ];

        const results = await executeWithConcurrency(tasks, 2);

        expect(results.length).toBe(5);
        expect(maxConcurrent).toBeLessThanOrEqual(2);
    });

    test('should return results in correct order', async () => {
        const tasks = [
            async () => 'first',
            async () => 'second',
            async () => 'third'
        ];

        const results = await executeWithConcurrency(tasks, 2);

        expect(results).toEqual(['first', 'second', 'third']);
    });

    test('should handle empty task array', async () => {
        const results = await executeWithConcurrency([], 5);
        expect(results).toEqual([]);
    });

    test('should handle single task', async () => {
        const tasks = [async () => 'result'];
        const results = await executeWithConcurrency(tasks, 5);

        expect(results).toEqual(['result']);
    });

    test('should handle task errors gracefully', async () => {
        const tasks = [
            async () => 'success',
            async () => { throw new Error('Task failed'); },
            async () => 'success2'
        ];

        const results = await executeWithConcurrency(tasks, 2);

        expect(results[0]).toBe('success');
        expect(results[1]).toHaveProperty('error', 'Task failed');
        expect(results[1]).toHaveProperty('stats', {});
        expect(results[2]).toBe('success2');
    });

    test('should call progress callback with correct values', async () => {
        const progressUpdates = [];
        const onProgress = (completed, total) => {
            progressUpdates.push({ completed, total });
        };

        const tasks = [
            async () => 'a',
            async () => 'b',
            async () => 'c'
        ];

        await executeWithConcurrency(tasks, 2, onProgress);

        expect(progressUpdates.length).toBe(3);
        expect(progressUpdates[0]).toEqual({ completed: 1, total: 3 });
        expect(progressUpdates[1]).toEqual({ completed: 2, total: 3 });
        expect(progressUpdates[2]).toEqual({ completed: 3, total: 3 });
    });

    test('should work without progress callback', async () => {
        const tasks = [async () => 'result'];
        const results = await executeWithConcurrency(tasks, 1);

        expect(results).toEqual(['result']);
    });

    test('should handle concurrency of 1', async () => {
        let executing = 0;

        const createTask = () => async () => {
            executing++;
            expect(executing).toBe(1);
            await new Promise(resolve => setTimeout(resolve, 10));
            executing--;
            return 'done';
        };

        const tasks = [createTask(), createTask(), createTask()];
        await executeWithConcurrency(tasks, 1);
    });

    test('should handle concurrency greater than task count', async () => {
        const tasks = [
            async () => 'a',
            async () => 'b'
        ];

        const results = await executeWithConcurrency(tasks, 10);
        expect(results).toEqual(['a', 'b']);
    });
});

describe('calculateRateLimits', () => {
    test('should return rate limit configuration', () => {
        const config = calculateRateLimits(120);

        expect(config).toHaveProperty('maxRequestsPerMinute');
        expect(config.maxRequestsPerMinute).toBe(120);
    });

    test('should use default value of 120', () => {
        const config = calculateRateLimits();

        expect(config.maxRequestsPerMinute).toBe(120);
    });

    test('should accept different rate values', () => {
        expect(calculateRateLimits(60).maxRequestsPerMinute).toBe(60);
        expect(calculateRateLimits(300).maxRequestsPerMinute).toBe(300);
        expect(calculateRateLimits(1).maxRequestsPerMinute).toBe(1);
    });

    test('should handle zero and negative values', () => {
        expect(calculateRateLimits(0).maxRequestsPerMinute).toBe(0);
        expect(calculateRateLimits(-10).maxRequestsPerMinute).toBe(-10);
    });
});

describe('logDomainStats', () => {
    beforeEach(() => {
        jest.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(() => {
        console.log.mockRestore();
    });

    test('should log domain statistics', () => {
        const domainMap = new Map([
            ['example.com', [1, 2, 3]],
            ['test.org', [4, 5]]
        ]);

        logDomainStats(domainMap, 'catalogs');

        expect(console.log).toHaveBeenCalledWith('\n=== Domain Distribution for catalogs ===');
        expect(console.log).toHaveBeenCalledWith('Total domains: 2');
    });

    test('should sort domains by item count', () => {
        const domainMap = new Map([
            ['landsatlook.usgs.gov', [1]],
            ['planetarycomputer.microsoft.com', [1, 2, 3, 4, 5]],
            ['earth-search.aws.element84.com', [1, 2, 3]]
        ]);

        logDomainStats(domainMap);

        const calls = console.log.mock.calls.map(call => call[0]);
        const largeDomainIndex = calls.findIndex(c => c.includes('planetarycomputer.microsoft.com'));
        const mediumDomainIndex = calls.findIndex(c => c.includes('earth-search.aws.element84.com'));
        const smallDomainIndex = calls.findIndex(c => c.includes('landsatlook.usgs.gov'));

        expect(largeDomainIndex).toBeLessThan(mediumDomainIndex);
        expect(mediumDomainIndex).toBeLessThan(smallDomainIndex);
    });

    test('should show only top 10 domains', () => {
        const domainMap = new Map();
        for (let i = 0; i < 15; i++) {
            domainMap.set(`domain${i}.com`, [1, 2]);
        }

        logDomainStats(domainMap);

        const calls = console.log.mock.calls.map(call => call[0]);
        const moreDomainsMessage = calls.find(c => c.includes('and 5 more domains'));

        expect(moreDomainsMessage).toBeDefined();
    });

    test('should not show "more domains" message for 10 or fewer domains', () => {
        const domainMap = new Map();
        for (let i = 0; i < 8; i++) {
            domainMap.set(`domain${i}.com`, [1]);
        }

        logDomainStats(domainMap);

        const calls = console.log.mock.calls.map(call => call[0]);
        const moreDomainsMessage = calls.find(c => c.includes('more domains'));

        expect(moreDomainsMessage).toBeUndefined();
    });

    test('should use default item type of "items"', () => {
        const domainMap = new Map([['catalogue.dataspace.copernicus.eu', [1, 2]]]);

        logDomainStats(domainMap);

        expect(console.log).toHaveBeenCalledWith('\n=== Domain Distribution for items ===');
    });

    test('should handle empty domain map', () => {
        const domainMap = new Map();

        logDomainStats(domainMap, 'test');

        expect(console.log).toHaveBeenCalledWith('Total domains: 0');
    });
});
