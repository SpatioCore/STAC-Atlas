/**
 * @fileoverview STAC Index API crawler that fetches and processes catalog data
 * @module crawler
 */

import { HttpCrawler } from 'crawlee';
import * as db from './db.js';
import { getConfig } from './utils/config.js';
import { processStacEntity } from './catalogs/catalog.js';
import { processCollectionList } from './apis/api.js';

// Main execution function
const main = async () => {
    // Load configuration
    const config = getConfig();
    
    console.log('\n=== STAC Crawler Configuration (Crawlee) ===');
    console.log(`Mode: ${config.mode}`);
    console.log(`Max Requests per Crawl: ${config.maxCatalogs === Infinity ? 'unlimited' : config.maxCatalogs * 10}`); // Rough estimate for requests
    console.log(`Max Depth: ${config.maxDepth === Infinity ? 'unlimited' : config.maxDepth}`);
    console.log('==================================\n');

    // Initialize DB connection
    try {
        await db.initDb();
    } catch (err) {
        console.error('Failed to connect to DB:', err);
        process.exit(1);
    }

    const crawler = new HttpCrawler({
        // Configuration
        maxRequestsPerCrawl: config.maxCatalogs === Infinity ? undefined : config.maxCatalogs * 20, // Allow more requests for children
        maxRequestRetries: 2,
        requestHandlerTimeoutSecs: config.timeout === Infinity ? 3600 : config.timeout / 1000,
        maxConcurrency: config.maxConcurrency,

        // Request Handler
        async requestHandler({ request, body, log, pushData, enqueueLinks }) {
            const { url, userData } = request;
            const { label, depth = 0 } = userData;
            
            log.info(`Processing ${url} [${label}] (Depth: ${depth})`);

            // Context object to pass to handlers
            const context = { request, body, log, crawler, config };

            if (label === 'START') {
                // Handle STAC Index API response (List of catalogs)
                try {
                    const catalogs = JSON.parse(body);
                    
                    if (!Array.isArray(catalogs)) {
                        throw new Error('Expected array of catalogs from STAC Index');
                    }

                    log.info(`Found ${catalogs.length} catalogs from STAC Index`);

                    // Filter and enqueue catalogs
                    let count = 0;
                    for (const catalogData of catalogs) {
                        // Check limits
                        if (config.maxCatalogs !== Infinity && count >= config.maxCatalogs) break;
                        
                        // catalogData structure: { id, url, title, ... }
                        if (catalogData.url) {
                            // Determine if we should crawl this based on mode
                            
                            const isApi = catalogData.isApi === true;
                            const shouldCrawl = 
                                config.mode === 'both' || 
                                (config.mode === 'catalogs' && !isApi) || 
                                (config.mode === 'apis' && isApi);

                            if (shouldCrawl) {
                                await crawler.addRequests([{
                                    url: catalogData.url,
                                    userData: { 
                                        label: 'STAC_ENTITY', 
                                        depth: 0,
                                        isApi 
                                    }
                                }]);
                                count++;
                            }
                        }
                    }
                    log.info(`Enqueued ${count} catalogs/apis for crawling`);

                } catch (error) {
                    log.error(`Failed to process STAC Index response: ${error.message}`);
                }

            } else if (label === 'STAC_ENTITY') {
                await processStacEntity(context);
            } else if (label === 'COLLECTIONS_LIST') {
                await processCollectionList(context);
            }
        },

        // Error handling
        failedRequestHandler({ request, error, log }) {
            log.error(`Request ${request.url} failed too many times: ${error.message}`);
        },
    });

    // Start the crawler
    const targetUrl = config.targetUrl;
    await crawler.run([
        { 
            url: targetUrl, 
            userData: { label: 'START' } 
        }
    ]);

    // Cleanup
    await db.close();
    console.log('Crawler finished.');
};

main().catch(console.error);
