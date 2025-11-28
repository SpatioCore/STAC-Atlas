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
            
            // Log non-compliant STAC or failed requests
            if (error.message.includes('STAC') || error.message.includes('validation')) {
                log.info(`${indent}Skipping non-compliant STAC: ${request.url}`);
                results.stats.nonCompliant++;
            } else {
                log.warning(`${indent}Failed request: ${request.url} - ${error.message}`);
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