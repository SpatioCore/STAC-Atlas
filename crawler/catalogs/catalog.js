/**
 * @fileoverview Catalog crawling functionality for STAC Index using Crawlee
 * @module catalogs/catalog
 */

import { HttpCrawler } from 'crawlee';
import { handleCatalog, handleCollections } from '../utils/handlers.js';

/**
 * Creates and runs a Crawlee HttpCrawler to crawl STAC catalogs
 * @async
 * @param {Array<Object>} initialCatalogs - Array of catalog objects to start crawling from
 * @param {Object} config - Configuration object with timeout and depth settings
 * @returns {Promise<Object>} Crawl results with collections and statistics
 */
async function crawlCatalogs(initialCatalogs, config = {}) {
    const timeoutSecs = config.timeout && config.timeout !== Infinity 
        ? Math.ceil(config.timeout / 1000) 
        : 60;
    
    // Store results
    const results = {
        collections: [],
        catalogs: [],
        stats: {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            collectionsFound: 0,
            catalogsProcessed: 0,
            stacCompliant: 0,
            nonCompliant: 0
        }
    };

    const crawler = new HttpCrawler({
        requestHandlerTimeoutSecs: timeoutSecs,
        
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
            const indent = '  '.repeat(depth);
            
            try {
                // Route based on request label
                if (request.label === 'CATALOG') {
                    await handleCatalog({ request, json, crawler, log, indent, results });
                } else if (request.label === 'COLLECTIONS') {
                    await handleCollections({ request, json, crawler, log, indent, results });
                }
                
                results.stats.successfulRequests++;
            } catch (error) {
                log.error(`${indent}Error handling ${request.label} at ${request.url}: ${error.message}`);
                throw error; // Re-throw to trigger failedRequestHandler
            }
        },
        
        async failedRequestHandler({ request, error, log }) {
            results.stats.failedRequests++;
            const depth = request.userData?.depth || 0;
            const indent = '  '.repeat(depth);
            const catalogId = request.userData?.catalogId || 'unknown';
            
            // Log detailed failure information
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

    // Seed the crawler with initial catalog requests
    const initialRequests = initialCatalogs.map(catalog => ({
        url: catalog.url,
        label: 'CATALOG',
        userData: {
            depth: 0,
            catalogId: catalog.id,
            catalogTitle: catalog.title
        }
    }));

    await crawler.addRequests(initialRequests);
    
    console.log(`\nStarting Crawlee crawler with ${initialRequests.length} initial catalogs...\n`);
    await crawler.run();
    
    console.log('\nCrawl Statistics:');
    console.log(`   Total Requests: ${results.stats.totalRequests}`);
    console.log(`   Successful: ${results.stats.successfulRequests}`);
    console.log(`   Failed: ${results.stats.failedRequests}`);
    console.log(`   STAC Compliant: ${results.stats.stacCompliant}`);
    console.log(`   Non-Compliant: ${results.stats.nonCompliant}`);
    console.log(`   Catalogs Processed: ${results.stats.catalogsProcessed}`);
    console.log(`   Collections Found: ${results.stats.collectionsFound}\n`);

    return results;
}

export { crawlCatalogs };