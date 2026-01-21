/**
 * @fileoverview Catalog crawling functionality for STAC Index using Crawlee
 * Supports parallel crawling of multiple domains simultaneously
 * @module catalogs/catalog
 */

import { HttpCrawler, log as crawleeLog, Configuration } from 'crawlee';
import { handleCatalog, handleCollections, flushCollectionsToDb } from '../utils/handlers.js';
import { 
    groupByDomain, 
    executeWithConcurrency, 
    aggregateStats, 
    calculateRateLimits,
    logDomainStats 
} from '../utils/parallel.js';

/**
 * Creates and runs a single Crawlee HttpCrawler for a specific domain
 * @async
 * @param {Array<Object>} catalogs - Array of catalog objects for this domain
 * @param {string} domain - The domain being crawled
 * @param {Object} config - Configuration object
 * @returns {Promise<Object>} Crawl results with collections and statistics
 */
async function crawlSingleDomain(catalogs, domain, config = {}) {
    // Use in-memory storage to avoid file lock race conditions under high concurrency
    Configuration.getGlobalConfig().set('persistStorage', false);
    
    const timeoutSecs = config.timeout && config.timeout !== Infinity 
        ? Math.ceil(config.timeout / 1000) 
        : 60;
    
    // Calculate rate limits for this domain
    const rateLimits = calculateRateLimits(config.maxRequestsPerMinutePerDomain || 120);
    
    // Store results
    const results = {
        collections: [],
        catalogs: [],
        stats: {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            collectionsFound: 0,
            collectionsSaved: 0,
            collectionsFailed: 0,
            catalogsProcessed: 0,
            stacCompliant: 0,
            nonCompliant: 0
        }
    };

    const concurrency = config.maxConcurrencyPerDomain || 20;
    
    const crawler = new HttpCrawler({
        requestHandlerTimeoutSecs: timeoutSecs,
        
        // Rate limiting
        maxRequestsPerMinute: rateLimits.maxRequestsPerMinute,
        maxRequestRetries: config.maxRequestRetries || 3,
        
        // High concurrency for throughput
        maxConcurrency: concurrency,
        
        // Accept additional MIME types (some STAC endpoints return JSON with incorrect Content-Type)
        additionalMimeTypes: ['application/geo+json', 'text/plain', 'binary/octet-stream', 'application/octet-stream'],
        
        async requestHandler({ request, json, body, crawler, log }) {
            results.stats.totalRequests++;
            const depth = request.userData?.depth || 0;
            const indent = '  '.repeat(depth);
            
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
                // Route based on request label
                if (request.label === 'CATALOG') {
                    await handleCatalog({ request, json, crawler, log, indent, results, config });
                } else if (request.label === 'COLLECTIONS') {
                    await handleCollections({ request, json, crawler, log, indent, results });
                }
                
                results.stats.successfulRequests++;
            } catch (error) {
                log.error(`${indent}Error handling ${request.label} at ${request.url}: ${error.message}`);
                throw error;
            }
        },
        
        async failedRequestHandler({ request, error, log }) {
            results.stats.failedRequests++;
            const depth = request.userData?.depth || 0;
            const indent = '  '.repeat(depth);
            const catalogId = request.userData?.catalogId || 'unknown';
            
            if (error.message.includes('STAC validation')) {
                log.info(`${indent}[STAC VALIDATION FAILED] ${catalogId} at ${request.url}`);
                log.info(`${indent}   Reason: ${error.message}`);
                results.stats.nonCompliant++;
            } else if (error.message.includes('timeout')) {
                log.warning(`${indent}[TIMEOUT] ${catalogId} at ${request.url}`);
            } else if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
                log.warning(`${indent}[CONNECTION FAILED] ${catalogId} at ${request.url}`);
            } else if (error.statusCode === 429) {
                const retryAfter = error.response?.headers?.['retry-after'] || 'unknown';
                log.warning(`${indent}[RATE LIMITED] ${catalogId} at ${request.url} - Retry-After: ${retryAfter}s`);
            } else if (error.code === 'ERR_NON_2XX_3XX_RESPONSE') {
                log.warning(`${indent}[HTTP ERROR] ${catalogId} at ${request.url} - Status: ${error.statusCode}`);
            } else {
                log.warning(`${indent}[FAILED] ${catalogId} at ${request.url}`);
                log.warning(`${indent}   Error: ${error.message}`);
            }
        }
    });

    // Seed the crawler with catalog requests for this domain
    const initialRequests = catalogs.map(catalog => ({
        url: catalog.url,
        label: 'CATALOG',
        userData: {
            depth: 0,
            catalogId: catalog.id,
            catalogTitle: catalog.title
        }
    }));

    await crawler.addRequests(initialRequests);
    
    console.log(`  [${domain}] Starting: ${initialRequests.length} catalogs, max ${rateLimits.maxRequestsPerMinute} req/min, ${concurrency} concurrent`);
    await crawler.run();
    
    // Flush any remaining collections to database
    const finalFlush = await flushCollectionsToDb(results, crawleeLog, true);
    results.stats.collectionsSaved += finalFlush.saved;
    results.stats.collectionsFailed += finalFlush.failed;
    
    // Clear catalogs array to free memory
    results.catalogs.length = 0;
    
    console.log(`  [${domain}] Finished: ${results.stats.collectionsFound} collections, ${results.stats.successfulRequests}/${results.stats.totalRequests} requests`);

    return results;
}

/**
 * Creates and runs parallel Crawlee HttpCrawlers to crawl STAC catalogs
 * Groups catalogs by domain and crawls multiple domains simultaneously
 * @async
 * @param {Array<Object>} initialCatalogs - Array of catalog objects to start crawling from
 * @param {Object} config - Configuration object with timeout, depth, and parallel settings
 * @returns {Promise<Object>} Crawl results with collections and statistics
 */
async function crawlCatalogs(initialCatalogs, config = {}) {
    // Group catalogs by domain
    const domainMap = groupByDomain(initialCatalogs);
    
    // Log domain distribution
    logDomainStats(domainMap, 'catalogs');
    
    // Number of domains to crawl in parallel (default: 5)
    const parallelDomains = config.parallelDomains || 5;
    const maxRequestsPerMinutePerDomain = config.maxRequestsPerMinutePerDomain || 120;
    
    console.log(`\n=== Parallel Catalog Crawling Configuration ===`);
    console.log(`Parallel domains: ${parallelDomains}`);
    console.log(`Max requests/min per domain: ${maxRequestsPerMinutePerDomain}`);
    console.log(`Theoretical max throughput: ${parallelDomains * maxRequestsPerMinutePerDomain} req/min across all domains`);
    console.log(`===============================================\n`);
    
    // Create tasks for each domain
    const domainTasks = Array.from(domainMap.entries()).map(([domain, catalogs]) => {
        return () => crawlSingleDomain(catalogs, domain, config);
    });
    
    console.log(`Starting parallel crawl of ${domainMap.size} domains (${parallelDomains} at a time)...\n`);
    
    // Execute with concurrency limit
    const allResults = await executeWithConcurrency(
        domainTasks, 
        parallelDomains,
        (completed, total) => {
            console.log(`\n>>> Domain progress: ${completed}/${total} domains completed <<<\n`);
        }
    );
    
    // Aggregate all statistics
    const aggregatedStats = aggregateStats(allResults);
    
    console.log('\n=== Parallel Crawl Statistics ===');
    console.log(`   Domains Processed: ${domainMap.size}`);
    console.log(`   Total Requests: ${aggregatedStats.totalRequests}`);
    console.log(`   Successful: ${aggregatedStats.successfulRequests}`);
    console.log(`   Failed: ${aggregatedStats.failedRequests}`);
    console.log(`   STAC Compliant: ${aggregatedStats.stacCompliant}`);
    console.log(`   Non-Compliant: ${aggregatedStats.nonCompliant}`);
    console.log(`   Catalogs Processed: ${aggregatedStats.catalogsProcessed}`);
    console.log(`   Collections Found: ${aggregatedStats.collectionsFound}`);
    console.log(`   Collections Saved to DB: ${aggregatedStats.collectionsSaved}`);
    console.log(`   Collections Failed: ${aggregatedStats.collectionsFailed}`);
    console.log('=================================\n');

    return {
        collections: [],
        catalogs: [],
        stats: aggregatedStats
    };
}

export { crawlCatalogs };
