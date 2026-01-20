/**
 * @fileoverview API crawling functionality for STAC Index using Crawlee
 * @module apis/api
 */

import { HttpCrawler, Configuration, log as crawleeLog } from 'crawlee';
import create from 'stac-js';
import { normalizeCollection } from '../utils/normalization.js';
import { handleCollections, flushCollectionsToDb } from '../utils/handlers.js';

/**
 * Batch size for saving collections to database during API crawling
 * @type {number}
 */
const BATCH_SIZE = 500;

/**
 * Batch size for clearing apis array to free memory
 * The apis array is only used for statistics, so we clear it periodically
 * @type {number}
 */
const API_CLEAR_BATCH_SIZE = 500;

/**
 * Checks if batch size is reached and flushes if necessary
 * Also clears the apis array periodically to free memory
 * @async
 * @param {Object} results - Results object containing collections array
 * @param {Object} log - Logger instance
 */
async function checkAndFlushApi(results, log) {
    if (results.collections.length >= BATCH_SIZE) {
        const { saved, failed } = await flushCollectionsToDb(results, log, false);
        results.stats.collectionsSaved = (results.stats.collectionsSaved || 0) + saved;
        results.stats.collectionsFailed = (results.stats.collectionsFailed || 0) + failed;
    }
    
    // Clear apis array periodically to free memory
    // The apis array is only used for end statistics, which we track in stats object
    if (results.apis && results.apis.length >= API_CLEAR_BATCH_SIZE) {
        log.info(`[MEMORY] Clearing ${results.apis.length} APIs from memory`);
        results.apis.length = 0;
    }
}

/**
 * Note: This crawler is for REAL APIs only. Static catalogs (*.json files)
 * are now routed to the catalog crawler in index.js
 * 
 * Crawls STAC APIs to retrieve collection information without fetching items.
 * 
 * @param {string[]} urls - Array of API URLs to crawl
 * @param {boolean} isApi - Boolean flag indicating if the URLs are APIs
 * @param {Object} config - Configuration object with timeout settings
 * @returns {Promise<Object>} Results object with collections array and statistics
 */
async function crawlApis(urls, isApi, config = {}) {
    // Use in-memory storage to avoid file lock race conditions under high concurrency
    Configuration.getGlobalConfig().set('persistStorage', false);
    
    if (!isApi || !Array.isArray(urls) || urls.length === 0) {
        return {
            collections: [],
            stats: {
                totalRequests: 0,
                successfulRequests: 0,
                failedRequests: 0,
                collectionsFound: 0,
                apisProcessed: 0,
                stacCompliant: 0,
                nonCompliant: 0
            }
        };
    }

    const timeoutSecs = config.timeout && config.timeout !== Infinity 
        ? Math.ceil(config.timeout / 1000) 
        : 60;

    // Store results
    const results = {
        collections: [],
        apis: [],
        stats: {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            collectionsFound: 0,
            collectionsSaved: 0,
            collectionsFailed: 0,
            apisProcessed: 0,
            stacCompliant: 0,
            nonCompliant: 0
        }
    };

    // Maximum depth for nested catalog crawling (0 = unlimited)
    const maxDepth = config.maxDepth || 10;
    
    const crawler = new HttpCrawler({
        requestHandlerTimeoutSecs: timeoutSecs,
        maxConcurrency: 20, // Limit concurrency to prevent lock file race conditions
        maxRequestsPerMinute: 200, // Rate limit to avoid overwhelming targets
        
        // Rate limiting options
        maxConcurrency: config.maxConcurrency || 5,
        maxRequestsPerMinute: config.maxRequestsPerMinute || 60,
        sameDomainDelaySecs: config.sameDomainDelaySecs || 1,
        maxRequestRetries: config.maxRequestRetries || 3,
        
        // Accept additional MIME types (some STAC endpoints return JSON with incorrect Content-Type)
        additionalMimeTypes: ['application/geo+json', 'text/plain', 'binary/octet-stream', 'application/octet-stream'],
        
        async requestHandler({ request, json, crawler, log }) {
            results.stats.totalRequests++;
            const depth = request.userData?.depth || 0;
            const indent = '  '.repeat(Math.min(depth, 5)); // Cap indent at 5 levels
            
            try {
                // Route based on request label
                if (request.label === 'API_ROOT') {
                    await handleApiRoot({ request, json, crawler, log, indent, results, maxDepth });
                } else if (request.label === 'API_COLLECTIONS') {
                    await handleCollections({ request, json, crawler, log, indent, results });
                } else if (request.label === 'API_COLLECTION') {
                    await handleApiCollection({ request, json, crawler, log, indent, results });
                }
                
                results.stats.successfulRequests++;
            } catch (error) {
                log.error(`${indent}Error handling ${request.label} at ${request.url}: ${error.message}`);
                throw error; // Re-throw to trigger failedRequestHandler
            }
        },
        
        async failedRequestHandler({ request, error, log }) {
            results.stats.failedRequests++;
            const indent = '  ';
            const apiId = request.userData?.apiId || 'unknown';
            
            // Log detailed failure information
            if (error.message.includes('STAC validation')) {
                log.info(`${indent}[STAC VALIDATION FAILED] ${apiId} at ${request.url}`);
                log.info(`${indent}   Reason: ${error.message}`);
                results.stats.nonCompliant++;
            } else if (error.message.includes('timeout')) {
                log.warning(`${indent}[TIMEOUT] ${apiId} at ${request.url}`);
            } else if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
                log.warning(`${indent}[CONNECTION FAILED] ${apiId} at ${request.url}`);
            } else if (error.statusCode === 429) {
                const retryAfter = error.response?.headers?.['retry-after'] || 'unknown';
                log.warning(`${indent}[RATE LIMITED] ${apiId} at ${request.url} - Retry-After: ${retryAfter}s`);
            } else if (error.code === 'ERR_NON_2XX_3XX_RESPONSE') {
                log.warning(`${indent}[HTTP ERROR] ${apiId} at ${request.url} - Status: ${error.statusCode}`);
            } else {
                log.warning(`${indent}[FAILED] ${apiId} at ${request.url}`);
                log.warning(`${indent}   Error: ${error.message}`);
            }
        }
    });

    // Seed the crawler with initial API requests
    const initialRequests = urls.map((url, index) => ({
        url: url,
        label: 'API_ROOT',
        userData: {
            apiId: `api-${index}`,
            apiUrl: url,
            depth: 0
        }
    }));

    await crawler.addRequests(initialRequests);
    
    console.log(`\nStarting Crawlee crawler with ${initialRequests.length} APIs...\n`);
    await crawler.run();
    
    // Flush any remaining collections to database
    console.log('\nFlushing remaining API collections to database...');
    const finalFlush = await flushCollectionsToDb(results, crawleeLog, true);
    results.stats.collectionsSaved += finalFlush.saved;
    results.stats.collectionsFailed += finalFlush.failed;
    
    // Clear apis array to free memory (we don't need them after crawl)
    results.apis.length = 0;
    
    console.log('\nAPI Crawl Statistics:');
    console.log(`   Total Requests: ${results.stats.totalRequests}`);
    console.log(`   Successful: ${results.stats.successfulRequests}`);
    console.log(`   Failed: ${results.stats.failedRequests}`);
    console.log(`   STAC Compliant: ${results.stats.stacCompliant}`);
    console.log(`   Non-Compliant: ${results.stats.nonCompliant}`);
    console.log(`   APIs Processed: ${results.stats.apisProcessed}`);
    console.log(`   Collections Found: ${results.stats.collectionsFound}`);
    console.log(`   Collections Saved to DB: ${results.stats.collectionsSaved}`);
    console.log(`   Collections Failed: ${results.stats.collectionsFailed}\n`);

    return results;
}


/**
 * Handles API root endpoint - validates STAC, discovers collections endpoints
 * @async
 * @param {Object} context - Request handler context
 * @param {Object} context.request - Crawlee request object
 * @param {Object} context.json - Parsed JSON response
 * @param {Object} context.crawler - Crawlee crawler instance
 * @param {Object} context.log - Logger instance
 * @param {string} context.indent - Indentation for logging
 * @param {Object} context.results - Results object to store data
 * @param {number} context.maxDepth - Maximum recursion depth (0 = unlimited)
 */
async function handleApiRoot({ request, json, crawler, log, indent, results, maxDepth = 10 }) {
    const apiId = request.userData?.apiId || 'unknown';
    const apiUrl = request.userData?.apiUrl || request.url;
    const depth = request.userData?.depth || 0;
    
    log.info(`${indent}Processing API: ${apiId} at ${apiUrl} (depth: ${depth})`);
    
    // Defensive check: ensure json is valid before passing to stac-js
    if (!json || typeof json !== 'object') {
        log.warning(`${indent}Invalid JSON response for ${apiId} at ${request.url}`);
        throw new Error('Invalid JSON response: null or not an object');
    }
    
    // Validate with stac-js
    // Note: create(data, migrate, updateVersionNumber) - second param is boolean, not URL
    // Using migrate=false to avoid issues with stac-migrate and newer STAC versions
    let stacObj;
    try {
        stacObj = create(json, false);
        results.stats.stacCompliant++;
        
        if (typeof stacObj.isCatalog === 'function' && stacObj.isCatalog()) {
            log.info(`${indent}STAC Catalog/API validated: ${apiId}`);
        } else if (typeof stacObj.isCollection === 'function' && stacObj.isCollection()) {
            log.info(`${indent}STAC Collection validated: ${apiId}`);
        }
    } catch (parseError) {
        log.warning(`${indent}Non-compliant STAC API ${apiId} at ${request.url}`);
        log.warning(`${indent}Error details: ${parseError.message}`);
        throw new Error(`STAC validation failed: ${parseError.message}`);
    }
    
    results.stats.apisProcessed++;
    results.apis.push({
        id: apiId,
        url: request.url,
        stacType: stacObj.isCollection() ? 'collection' : 'catalog'
    });
    
    // If this is a STAC Collection directly, extract and store it
    if (typeof stacObj.isCollection === 'function' && stacObj.isCollection()) {
        const collection = normalizeCollection(stacObj, results.collections.length);
        results.collections.push(collection);
        results.stats.collectionsFound++;
        log.info(`${indent}Extracted collection: ${collection.id} - ${collection.title}`);
        
        // Check if we should flush to database
        await checkAndFlushApi(results, log);
        return; // Single collection, no need to look for more
    }
    
    // Try to find collections endpoint using stac-js
    let collectionsEndpoint = null;
    
    if (typeof stacObj.getApiCollectionsLink === 'function') {
        const collectionsLink = stacObj.getApiCollectionsLink();
        if (collectionsLink && collectionsLink.href) {
            // Direkt die href verwenden - diese ist bereits absolut im JSON
            collectionsEndpoint = collectionsLink.href;
            log.info(`${indent}Found collections link via stac-js: ${collectionsEndpoint}`);
        }
    }
    
    // Fallback: use standard /collections endpoint
    if (!collectionsEndpoint) {
        const baseUrl = request.url.endsWith('/') ? request.url.slice(0, -1) : request.url;
        collectionsEndpoint = `${baseUrl}/collections`;
        log.debug(`${indent}No collections link found, using fallback: ${collectionsEndpoint}`);
    }
    
    // Enqueue single collections request
    await crawler.addRequests([{
        url: collectionsEndpoint,
        label: 'API_COLLECTIONS',
        userData: {
            apiId: apiId,
            apiUrl: apiUrl
        }
    }]);
    
    // Also check for child links (nested catalogs)
    if (typeof stacObj.getChildLinks === 'function') {
        const childLinks = stacObj.getChildLinks();
        
        if (childLinks.length > 0) {
            log.info(`${indent}Found ${childLinks.length} child catalog links`);
            
            // Check if we've reached maximum depth
            const nextDepth = depth + 1;
            if (maxDepth > 0 && nextDepth > maxDepth) {
                log.warning(`${indent}Skipping ${childLinks.length} child catalogs - max depth (${maxDepth}) reached`);
                return;
            }
            
            const childRequests = childLinks
                .map((link, idx) => {
                    let childUrl;
                    try {
                        childUrl = typeof link.getAbsoluteUrl === 'function'
                            ? link.getAbsoluteUrl()
                            : link.href;
                    } catch (err) {
                        log.warning(`${indent}Error getting URL for link ${idx}: ${err.message}`);
                        return null;
                    }
                    
                    // Validate URL
                    if (!childUrl || typeof childUrl !== 'string' || !childUrl.startsWith('http')) {
                        return null;
                    }
                    
                    // Check if this is a collection link or child catalog
                    const rel = link.rel || '';
                    const label = rel === 'child' || rel === 'item' ? 'API_ROOT' : 'API_COLLECTION';
                    
                    return {
                        url: childUrl,
                        label: label,
                        userData: {
                            apiId: `${apiId}-child-${idx}`,
                            apiUrl: apiUrl,
                            parentId: apiId,
                            depth: nextDepth
                        }
                    };
                })
                .filter(Boolean);
            
            if (childRequests.length > 0) {
                await crawler.addRequests(childRequests);
                log.info(`${indent}Enqueued ${childRequests.length} child catalogs/collections`);
            }
        }
    }
}

/**
 * Handles individual API collection endpoint
 * @async
 * @param {Object} context - Request handler context
 * @param {Object} context.request - Crawlee request object
 * @param {Object} context.json - Parsed JSON response
 * @param {Object} context.crawler - Crawlee crawler instance
 * @param {Object} context.log - Logger instance
 * @param {string} context.indent - Indentation for logging
 * @param {Object} context.results - Results object to store data
 */
async function handleApiCollection({ request, json, crawler, log, indent, results }) {
    const apiId = request.userData?.apiId || 'unknown';
    
    // Validate with stac-js
    // Note: create(data, migrate, updateVersionNumber) - second param is boolean, not URL
    let stacObj;
    try {
        stacObj = create(json, false);
        
        if (typeof stacObj.isCollection === 'function' && stacObj.isCollection()) {
            const collection = normalizeCollection(stacObj, results.collections.length);
            results.collections.push(collection);
            results.stats.collectionsFound++;
            log.info(`${indent}Extracted collection: ${collection.id} - ${collection.title}`);
            
            // Check if we should flush to database
            await checkAndFlushApi(results, log);
        } else {
            log.warning(`${indent}Expected collection but got: ${json.type || 'unknown type'}`);
        }
    } catch (parseError) {
        log.warning(`${indent}Skipping non-compliant STAC collection at ${request.url}`);
    }
}

export {
    crawlApis
};
