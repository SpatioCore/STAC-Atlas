/**
 * @fileoverview API crawling functionality for STAC Index using Crawlee
 * @module apis/api
 */

import { HttpCrawler } from 'crawlee';
import create from 'stac-js';
import { normalizeCollection } from '../utils/normalization.js';
import { handleCollections } from '../utils/handlers.js';

/**
 * Crawls STAC APIs to retrieve collection information without fetching items.
 * 
 * @param {string[]} urls - Array of API URLs to crawl
 * @param {boolean} isApi - Boolean flag indicating if the URLs are APIs
 * @param {Object} config - Configuration object with timeout settings
 * @returns {Promise<Object>} Results object with collections array and statistics
 */
async function crawlApis(urls, isApi, config = {}) {
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
            apisProcessed: 0,
            stacCompliant: 0,
            nonCompliant: 0
        }
    };

    const crawler = new HttpCrawler({
        requestHandlerTimeoutSecs: timeoutSecs,
        
        async requestHandler({ request, json, crawler, log }) {
            results.stats.totalRequests++;
            const indent = '  ';
            
            try {
                // Route based on request label
                if (request.label === 'API_ROOT') {
                    await handleApiRoot({ request, json, crawler, log, indent, results });
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
            apiUrl: url
        }
    }));

    await crawler.addRequests(initialRequests);
    
    console.log(`\nStarting Crawlee crawler with ${initialRequests.length} APIs...\n`);
    await crawler.run();
    
    console.log('\nAPI Crawl Statistics:');
    console.log(`   Total Requests: ${results.stats.totalRequests}`);
    console.log(`   Successful: ${results.stats.successfulRequests}`);
    console.log(`   Failed: ${results.stats.failedRequests}`);
    console.log(`   STAC Compliant: ${results.stats.stacCompliant}`);
    console.log(`   Non-Compliant: ${results.stats.nonCompliant}`);
    console.log(`   APIs Processed: ${results.stats.apisProcessed}`);
    console.log(`   Collections Found: ${results.stats.collectionsFound}\n`);

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
 */
async function handleApiRoot({ request, json, crawler, log, indent, results }) {
    const apiId = request.userData?.apiId || 'unknown';
    const apiUrl = request.userData?.apiUrl || request.url;
    
    log.info(`${indent}Processing API: ${apiId} at ${apiUrl}`);
    
    // Validate with stac-js
    let stacObj;
    try {
        stacObj = create(json, request.url);
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
    
    // Fallback: try common STAC API endpoints
    if (!collectionsEndpoint) {
        const baseUrl = request.url.endsWith('/') ? request.url.slice(0, -1) : request.url;
        const endpoints = [
            `${baseUrl}/collections`,
            `${apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl}/collections`
        ];
        
        for (const endpoint of endpoints) {
            if (endpoint && endpoint !== collectionsEndpoint) {
                log.info(`${indent}Trying collections endpoint: ${endpoint}`);
                await crawler.addRequests([{
                    url: endpoint,
                    label: 'API_COLLECTIONS',
                    userData: {
                        apiId: apiId,
                        apiUrl: apiUrl
                    }
                }]);
            }
        }
    } else {
        // Use the discovered collections endpoint
        await crawler.addRequests([{
            url: collectionsEndpoint,
            label: 'API_COLLECTIONS',
            userData: {
                apiId: apiId,
                apiUrl: apiUrl
            }
        }]);
    }
    
    // Also check for child links (nested catalogs)
    if (typeof stacObj.getChildLinks === 'function') {
        const childLinks = stacObj.getChildLinks();
        
        if (childLinks.length > 0) {
            log.info(`${indent}Found ${childLinks.length} child catalog links`);
            
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
                            parentId: apiId
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
    let stacObj;
    try {
        stacObj = create(json, request.url);
        
        if (typeof stacObj.isCollection === 'function' && stacObj.isCollection()) {
            const collection = normalizeCollection(stacObj, results.collections.length);
            results.collections.push(collection);
            results.stats.collectionsFound++;
            log.info(`${indent}Extracted collection: ${collection.id} - ${collection.title}`);
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
