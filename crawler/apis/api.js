/**
 * @fileoverview API crawling functionality for STAC Index using Crawlee
 * Supports parallel crawling of multiple domains simultaneously
 * @module apis/api
 */

import { HttpCrawler, Configuration, log as crawleeLog } from 'crawlee';
import create from 'stac-js';
import { normalizeCollection } from '../utils/normalization.js';
import { handleCollections, flushCollectionsToDb } from '../utils/handlers.js';
import { 
    groupByDomain, 
    executeWithConcurrency, 
    aggregateStats, 
    calculateRateLimits,
    logDomainStats 
} from '../utils/parallel.js';
import globalStats from '../utils/globalStats.js';

/**
 * Batch size for saving collections to database during API crawling
 * Set low (25) for servers with limited RAM (2GB)
 * @type {number}
 */
const BATCH_SIZE = 25;

/**
 * Batch size for clearing apis array to free memory
 * Set low (25) for servers with limited RAM (2GB)
 * @type {number}
 */
const API_CLEAR_BATCH_SIZE = 25;

/**
 * Checks if batch size is reached and flushes if necessary
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
    
    if (results.apis && results.apis.length >= API_CLEAR_BATCH_SIZE) {
        log.info(`[MEMORY] Clearing ${results.apis.length} APIs from memory`);
        results.apis.length = 0;
    }
}

/**
 * Creates and runs a single Crawlee HttpCrawler for a specific domain
 * @async
 * @param {Array<Object>} apis - Array of API objects with url, slug, and title for this domain
 * @param {string} domain - The domain being crawled
 * @param {Object} config - Configuration object
 * @returns {Promise<Object>} Crawl results with collections and statistics
 */
async function crawlSingleApiDomain(apis, domain, config = {}) {
    // Set unique storage directory for this crawler to avoid conflicts
    const safeDomain = domain.replace(/[^a-zA-Z0-9]/g, '_');
    const storageDir = `/tmp/crawlee-api-${safeDomain}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    Configuration.getGlobalConfig().set('storageDir', storageDir);
    Configuration.getGlobalConfig().set('persistStorage', false);
    
    const timeoutSecs = config.timeout && config.timeout !== Infinity 
        ? Math.ceil(config.timeout / 1000) 
        : 60;

    // Calculate rate limits for this domain
    const rateLimits = calculateRateLimits(config.maxRequestsPerMinutePerDomain || 120);

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
    
    const concurrency = config.maxConcurrencyPerDomain || 20;
    
    const crawler = new HttpCrawler({
        requestHandlerTimeoutSecs: timeoutSecs,
        
        // Rate limiting
        maxRequestsPerMinute: rateLimits.maxRequestsPerMinute,
        maxRequestRetries: config.maxRequestRetries || 3,
        
        // High concurrency for throughput
        maxConcurrency: concurrency,
        
        // Reduce periodic statistics logging (we have our own end statistics)
        statisticsOptions: {
            logIntervalSecs: 60,
        },
        
        // Accept additional MIME types
        additionalMimeTypes: ['application/geo+json', 'text/plain', 'binary/octet-stream', 'application/octet-stream'],
        
        async requestHandler({ request, json, body, crawler, log }) {
            results.stats.totalRequests++;
            globalStats.increment('totalRequests');
            const depth = request.userData?.depth || 0;
            const indent = '  '.repeat(Math.min(depth, 5));
            
            // Fallback: manually parse JSON if Crawlee's automatic parsing failed
            if (!json && body) {
                try {
                    const bodyStr = typeof body === 'string' ? body : body.toString('utf8');
                    json = JSON.parse(bodyStr);
                    log.debug(`${indent}Manually parsed JSON for ${request.url} (${bodyStr.length} bytes)`);
                } catch (parseError) {
                    log.warning(`${indent}Failed to parse response body as JSON: ${parseError.message}`);
                }
            }
            
            try {
                if (request.label === 'API_ROOT') {
                    await handleApiRoot({ request, json, crawler, log, indent, results, maxDepth });
                } else if (request.label === 'API_COLLECTIONS') {
                    await handleCollections({ request, json, crawler, log, indent, results });
                } else if (request.label === 'API_COLLECTION') {
                    await handleApiCollection({ request, json, crawler, log, indent, results });
                }
                
                results.stats.successfulRequests++;
                globalStats.increment('successfulRequests');
            } catch (error) {
                log.error(`${indent}Error handling ${request.label} at ${request.url}: ${error.message}`);
                throw error;
            }
        },
        
        async failedRequestHandler({ request, error, log }) {
            results.stats.failedRequests++;
            globalStats.increment('failedRequests');
            const indent = '  ';
            const apiId = request.userData?.apiId || 'unknown';
            
            if (error.message.includes('STAC validation')) {
                log.info(`${indent}[STAC VALIDATION FAILED] ${apiId} at ${request.url}`);
                log.info(`${indent}   Reason: ${error.message}`);
                results.stats.nonCompliant++;
                globalStats.increment('nonCompliant');
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
    const initialRequests = apis.map((api, index) => ({
        url: api.url,
        label: 'API_ROOT',
        userData: {
            apiId: `${domain}-api-${index}`,
            apiUrl: api.url,
            apiSlug: api.slug,
            depth: 0
        }
    }));

    await crawler.addRequests(initialRequests);
    
    // Register domain as active in global stats
    globalStats.domainStarted(domain);
    
    console.log(`  [${domain}] Starting: ${initialRequests.length} APIs, max ${rateLimits.maxRequestsPerMinute} req/min, ${concurrency} concurrent`);
    await crawler.run();
    
    // Flush any remaining collections to database
    const finalFlush = await flushCollectionsToDb(results, crawleeLog, true);
    results.stats.collectionsSaved += finalFlush.saved;
    results.stats.collectionsFailed += finalFlush.failed;
    
    // Update global stats with final counts
    globalStats.increment('collectionsSaved', results.stats.collectionsSaved);
    globalStats.increment('collectionsFailed', results.stats.collectionsFailed);
    globalStats.increment('collectionsFound', results.stats.collectionsFound);
    globalStats.increment('apisProcessed', results.stats.apisProcessed);
    globalStats.increment('stacCompliant', results.stats.stacCompliant);
    
    // Register domain as completed
    globalStats.domainCompleted(domain);
    
    // Clear apis array to free memory
    results.apis.length = 0;
    
    console.log(`  [${domain}] Finished: ${results.stats.collectionsFound} collections, ${results.stats.successfulRequests}/${results.stats.totalRequests} requests`);

    return results;
}

/**
 * Crawls STAC APIs to retrieve collection information without fetching items.
 * Groups APIs by domain and crawls multiple domains simultaneously.
 * 
 * @param {Array<Object>} apis - Array of API objects with url, slug, and title
 * @param {boolean} isApi - Boolean flag indicating if the URLs are APIs
 * @param {Object} config - Configuration object with timeout settings
 * @returns {Promise<Object>} Results object with collections array and statistics
 */
async function crawlApis(apis, isApi, config = {}) {
    if (!isApi || !Array.isArray(apis) || apis.length === 0) {
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

    // Group API objects by domain (keeps slug intact)
    const domainMap = groupByDomain(apis);
    
    // Log domain distribution
    logDomainStats(domainMap, 'APIs');
    
    // Number of domains to crawl in parallel (default: 5)
    const parallelDomains = config.parallelDomains || 5;
    const maxRequestsPerMinutePerDomain = config.maxRequestsPerMinutePerDomain || 120;
    
    console.log(`\n=== Parallel API Crawling Configuration ===`);
    console.log(`Parallel domains: ${parallelDomains}`);
    console.log(`Max requests/min per domain: ${maxRequestsPerMinutePerDomain}`);
    console.log(`Theoretical max throughput: ${parallelDomains * maxRequestsPerMinutePerDomain} req/min across all domains`);
    console.log(`============================================\n`);
    
    // Create tasks for each domain (pass full API objects including slug)
    const domainTasks = Array.from(domainMap.entries()).map(([domain, domainApis]) => {
        return () => crawlSingleApiDomain(domainApis, domain, config);
    });
    
    console.log(`Starting parallel API crawl of ${domainMap.size} domains (${parallelDomains} at a time)...\n`);
    
    // Track total runtime for throughput calculation
    const crawlStartTime = Date.now();
    
    // Execute with concurrency limit
    const allResults = await executeWithConcurrency(
        domainTasks, 
        parallelDomains,
        (completed, total) => {
            console.log(`\n>>> Domain progress: ${completed}/${total} domains completed <<<\n`);
        }
    );
    
    const crawlEndTime = Date.now();
    const totalRuntimeMs = crawlEndTime - crawlStartTime;
    const totalRuntimeMinutes = totalRuntimeMs / 60000;
    
    // Aggregate all statistics
    const aggregatedStats = aggregateStats(allResults);
    
    // Calculate actual throughput
    const requestsPerMinute = totalRuntimeMinutes > 0 
        ? Math.round(aggregatedStats.totalRequests / totalRuntimeMinutes) 
        : 0;
    
    console.log('\n=== API Crawl Statistics ===');
    console.log(`   Domains Processed: ${domainMap.size}`);
    console.log(`   Total Runtime: ${Math.round(totalRuntimeMs / 1000)}s`);
    console.log(`   Total Requests: ${aggregatedStats.totalRequests}`);
    console.log(`   Requests/Min (actual): ${requestsPerMinute}`);
    console.log(`   Successful: ${aggregatedStats.successfulRequests}`);
    console.log(`   Failed: ${aggregatedStats.failedRequests}`);
    console.log(`   STAC Compliant: ${aggregatedStats.stacCompliant}`);
    console.log(`   Non-Compliant: ${aggregatedStats.nonCompliant}`);
    console.log(`   APIs Processed: ${aggregatedStats.apisProcessed}`);
    console.log(`   Collections Found: ${aggregatedStats.collectionsFound}`);
    console.log(`   Collections Saved to DB: ${aggregatedStats.collectionsSaved}`);
    console.log(`   Collections Failed: ${aggregatedStats.collectionsFailed}`);
    console.log('=====================================\n');

    return {
        collections: [],
        apis: [],
        stats: aggregatedStats
    };
}


/**
 * Handles API root endpoint - validates STAC, discovers collections endpoints
 * @async
 */
async function handleApiRoot({ request, json, crawler, log, indent, results, maxDepth = 10 }) {
    const apiId = request.userData?.apiId || 'unknown';
    const apiUrl = request.userData?.apiUrl || request.url;
    const apiSlug = request.userData?.apiSlug || null;
    const depth = request.userData?.depth || 0;
    
    log.info(`${indent}Processing API: ${apiId} at ${apiUrl} (depth: ${depth})`);
    
    if (!json || typeof json !== 'object') {
        log.warning(`${indent}Invalid JSON response for ${apiId} at ${request.url}`);
        throw new Error('Invalid JSON response: null or not an object');
    }
    
    let stacObj;
    try {
        stacObj = create(json, true);
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
    // Only track minimal info to reduce memory
    results.apis.push({
        id: apiId
    });
    
    // If this is a STAC Collection directly, extract and store it
    if (typeof stacObj.isCollection === 'function' && stacObj.isCollection()) {
        const collection = normalizeCollection(stacObj, results.collections.length);
        // Add the API slug to the collection for unique stac_id generation
        collection.sourceSlug = apiSlug;
        results.collections.push(collection);
        results.stats.collectionsFound++;
        log.info(`${indent}Extracted collection: ${collection.id} - ${collection.title}`);
        
        await checkAndFlushApi(results, log);
        return;
    }
    
    // Try to find collections endpoint using stac-js
    let collectionsEndpoint = null;
    
    if (typeof stacObj.getApiCollectionsLink === 'function') {
        const collectionsLink = stacObj.getApiCollectionsLink();
        if (collectionsLink && collectionsLink.href) {
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
            apiUrl: apiUrl,
            catalogSlug: apiSlug  // Use catalogSlug for compatibility with handleCollections
        }
    }]);
    
    // Also check for child links (nested catalogs)
    if (typeof stacObj.getChildLinks === 'function') {
        const childLinks = stacObj.getChildLinks();
        
        if (childLinks.length > 0) {
            log.info(`${indent}Found ${childLinks.length} child catalog links`);
            
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
                    
                    // Handle S3 protocol URLs - convert to HTTPS
                    if (childUrl && typeof childUrl === 'string' && childUrl.startsWith('s3://')) {
                        const s3Match = childUrl.match(/^s3:\/\/([^/]+)\/(.*)$/);
                        if (s3Match) {
                            const [, bucket, path] = s3Match;
                            childUrl = `https://${bucket}.s3.amazonaws.com/${path}`;
                            log.debug(`${indent}Converted S3 URL: ${link.href} -> ${childUrl}`);
                        } else {
                            log.warning(`${indent}Skipping malformed S3 URL at index ${idx}: ${childUrl}`);
                            return null;
                        }
                    }
                    
                    // If URL is relative, make it absolute using the API URL
                    if (childUrl && typeof childUrl === 'string' && !childUrl.startsWith('http')) {
                        const baseUrl = request.url.endsWith('/') ? request.url.slice(0, -1) : request.url;
                        const basePath = baseUrl.substring(0, baseUrl.lastIndexOf('/'));
                        childUrl = `${basePath}/${childUrl}`;
                    }
                    
                    // Validate URL
                    if (!childUrl || typeof childUrl !== 'string' || !childUrl.startsWith('http')) {
                        log.warning(`${indent}Skipping invalid URL at index ${idx}: ${childUrl}`);
                        return null;
                    }
                    
                    const rel = link.rel || '';
                    const label = rel === 'child' || rel === 'item' ? 'API_ROOT' : 'API_COLLECTION';
                    
                    return {
                        url: childUrl,
                        label: label,
                        userData: {
                            apiId: `${apiId}-child-${idx}`,
                            apiUrl: apiUrl,
                            apiSlug: apiSlug,
                            catalogSlug: apiSlug,  // Use catalogSlug for compatibility with handleCollections
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
    
    // Help garbage collector by dereferencing large objects
    stacObj = null;
}

/**
 * Handles individual API collection endpoint
 * @async
 */
async function handleApiCollection({ request, json, crawler, log, indent, results }) {
    const apiId = request.userData?.apiId || 'unknown';
    const apiSlug = request.userData?.apiSlug || request.userData?.catalogSlug || null;
    
    let stacObj;
    try {
        stacObj = create(json, true);
        
        if (typeof stacObj.isCollection === 'function' && stacObj.isCollection()) {
            const collection = normalizeCollection(stacObj, results.collections.length);
            // Add the API slug to the collection for unique stac_id generation
            collection.sourceSlug = apiSlug;
            results.collections.push(collection);
            results.stats.collectionsFound++;
            log.info(`${indent}Extracted collection: ${collection.id} - ${collection.title}`);
            
            await checkAndFlushApi(results, log);
        } else {
            log.warning(`${indent}Expected collection but got: ${json.type || 'unknown type'}`);
        }
    } catch (parseError) {
        log.warning(`${indent}Skipping non-compliant STAC collection at ${request.url}`);
    }
    
    // Help garbage collector
    stacObj = null;
}

export {
    crawlApis
};
