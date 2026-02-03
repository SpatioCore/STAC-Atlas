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
import globalStats from '../utils/globalStats.js';
import { isShutdownRequested } from '../index.js';
import db from '../utils/db.js';

/**
 * Creates and runs a single Crawlee HttpCrawler for a specific domain
 * @async
 * @param {Array<Object>} catalogs - Array of catalog objects for this domain
 * @param {string} domain - The domain being crawled
 * @param {Object} config - Configuration object
 * @returns {Promise<Object>} Crawl results with collections and statistics
 */
async function crawlSingleDomain(catalogs, domain, config = {}) {
    // Set unique storage directory for this crawler to avoid conflicts
    const safeDomain = domain.replace(/[^a-zA-Z0-9]/g, '_');
    const storageDir = `/tmp/crawlee-catalog-${safeDomain}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
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

    const DB_QUEUE_TARGET = 1000;
    const DB_QUEUE_LOW_WATERMARK = 100;
    const DB_QUEUE_BATCH_SIZE = 900;
    const domainCatalogIds = catalogs.map(catalog => catalog.crawllogCatalogId).filter(Boolean);

    function getCatalogQueueLabel(url) {
        if (typeof url === 'string' && /\/collections\/?$/.test(url)) {
            return 'COLLECTIONS';
        }
        return 'CATALOG';
    }

    async function ensureDbQueueBuffer(crawler, log) {
        if (!crawler?.requestQueue?.getInfo) return;

        const info = await crawler.requestQueue.getInfo();
        const pending = info?.pendingRequestCount ?? 0;

        if (pending > DB_QUEUE_LOW_WATERMARK) return;

        const toFetch = Math.min(DB_QUEUE_BATCH_SIZE, Math.max(DB_QUEUE_TARGET - pending, 0));
        if (toFetch <= 0) return;

        const batch = await db.claimCollectionQueueBatch({ 
            limit: toFetch, 
            isApi: false,
            crawllogCatalogIds: domainCatalogIds.length > 0 ? domainCatalogIds : undefined
        });
        if (batch.length === 0) return;

        const requests = batch.map((item, idx) => ({
            url: item.url,
            label: getCatalogQueueLabel(item.url),
            userData: {
                depth: 0,
                catalogId: `queued-collection-${idx}`,
                catalogSlug: item.slug || null,
                crawllogCatalogId: item.crawllogCatalogId || null
            }
        }));

        await crawler.addRequests(requests);
        log.info(`[QUEUE] Pulled ${requests.length} collection URLs from DB queue (pending: ${pending})`);
    }
    
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
        
        // Accept additional MIME types (some STAC endpoints return JSON with incorrect Content-Type)
        additionalMimeTypes: ['application/geo+json', 'text/plain', 'binary/octet-stream', 'application/octet-stream'],
        
        async requestHandler({ request, json, body, crawler, log }) {
            results.stats.totalRequests++;
            globalStats.increment('totalRequests');
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
                globalStats.increment('successfulRequests');
                await ensureDbQueueBuffer(crawler, log);
            } catch (error) {
                log.error(`${indent}Error handling ${request.label} at ${request.url}: ${error.message}`);
                throw error;
            }
        },
        
        async failedRequestHandler({ request, error, log }) {
            results.stats.failedRequests++;
            globalStats.increment('failedRequests');
            const depth = request.userData?.depth || 0;
            const indent = '  '.repeat(depth);
            const catalogId = request.userData?.catalogId || 'unknown';
            
            if (error.message.includes('STAC validation')) {
                log.info(`${indent}[STAC VALIDATION FAILED] ${catalogId} at ${request.url}`);
                log.info(`${indent}   Reason: ${error.message}`);
                results.stats.nonCompliant++;
                globalStats.increment('nonCompliant');
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
    const initialRequests = catalogs
        .filter(catalog => !catalog.hasPendingQueue)
        .map(catalog => ({
            url: catalog.url,
            label: 'CATALOG',
            userData: {
                depth: 0,
                catalogId: catalog.id,
                catalogTitle: catalog.title,
                catalogSlug: catalog.slug,
                crawllogCatalogId: catalog.crawllogCatalogId  // Pass for linking collections to crawllog_catalog
            }
        }));

    await crawler.addRequests(initialRequests);

    await ensureDbQueueBuffer(crawler, crawleeLog);
    
    // Register domain as active in global stats
    globalStats.domainStarted(domain);
    
    console.log(`  [${domain}] Starting: ${initialRequests.length} catalogs, max ${rateLimits.maxRequestsPerMinute} req/min, ${concurrency} concurrent`);
    await crawler.run();
    
    // Flush any remaining collections to database
    const finalFlush = await flushCollectionsToDb(results, crawleeLog, true);
    results.stats.collectionsSaved += finalFlush.saved;
    results.stats.collectionsFailed += finalFlush.failed;
    
    // Update global stats with final counts
    globalStats.increment('collectionsSaved', results.stats.collectionsSaved);
    globalStats.increment('collectionsFailed', results.stats.collectionsFailed);
    globalStats.increment('collectionsFound', results.stats.collectionsFound);
    globalStats.increment('catalogsProcessed', results.stats.catalogsProcessed);
    globalStats.increment('stacCompliant', results.stats.stacCompliant);
    
    // Register domain as completed
    globalStats.domainCompleted(domain);
    
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
    
    // Create tasks for each domain, with shutdown check
    const domainTasks = Array.from(domainMap.entries()).map(([domain, catalogs]) => {
        return async () => {
            // Check if shutdown was requested before starting this domain
            if (isShutdownRequested()) {
                console.log(`  [${domain}] Skipped (shutdown requested)`);
                return { stats: { totalRequests: 0, successfulRequests: 0, failedRequests: 0, collectionsFound: 0, collectionsSaved: 0, collectionsFailed: 0, catalogsProcessed: 0, stacCompliant: 0, nonCompliant: 0 } };
            }
            return crawlSingleDomain(catalogs, domain, config);
        };
    });
    
    console.log(`Starting parallel crawl of ${domainMap.size} domains (${parallelDomains} at a time)...\n`);
    console.log(`Press Ctrl+C to pause (will stop after current batch and resume on next run)\n`);
    
    // Track total runtime for throughput calculation
    const crawlStartTime = Date.now();
    
    // Execute with concurrency limit
    const allResults = await executeWithConcurrency(
        domainTasks, 
        parallelDomains,
        (completed, total) => {
            if (isShutdownRequested()) {
                console.log(`\n>>> Shutdown requested. Stopping after current domains complete... <<<\n`);
            } else {
                console.log(`\n>>> Domain progress: ${completed}/${total} domains completed <<<\n`);
            }
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
    
    console.log('\n=== Catalog Crawl Statistics ===');
    console.log(`   Domains Processed: ${domainMap.size}`);
    console.log(`   Total Runtime: ${Math.round(totalRuntimeMs / 1000)}s`);
    console.log(`   Total Requests: ${aggregatedStats.totalRequests}`);
    console.log(`   Requests/Min (actual): ${requestsPerMinute}`);
    console.log(`   Successful: ${aggregatedStats.successfulRequests}`);
    console.log(`   Failed: ${aggregatedStats.failedRequests}`);
    console.log(`   STAC Compliant: ${aggregatedStats.stacCompliant}`);
    console.log(`   Non-Compliant: ${aggregatedStats.nonCompliant}`);
    console.log(`   Catalogs Processed: ${aggregatedStats.catalogsProcessed}`);
    console.log(`   Collections Found: ${aggregatedStats.collectionsFound}`);
    console.log(`   Collections Saved to DB: ${aggregatedStats.collectionsSaved}`);
    console.log(`   Collections Failed: ${aggregatedStats.collectionsFailed}`);
    console.log('=========================================\n');

    return {
        collections: [],
        catalogs: [],
        stats: aggregatedStats
    };
}

export { crawlCatalogs };
