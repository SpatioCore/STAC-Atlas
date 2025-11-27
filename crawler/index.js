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
    console.log(`Max Catalogs: ${config.maxCatalogs === Infinity ? 'unlimited' : config.maxCatalogs}`);
    console.log(`Max APIs: ${config.maxApis === Infinity ? 'unlimited' : config.maxApis}`);
    console.log(`Max Depth: ${config.maxDepth === Infinity ? 'unlimited' : config.maxDepth}`);
    console.log(`Min Concurrency: ${config.minConcurrency}`);
    console.log(`Max Concurrency: ${config.maxConcurrency}`);
    console.log(`Max Request Retries: ${config.maxRequestRetries}`);
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
        maxRequestsPerCrawl: (config.maxCatalogs === Infinity || config.maxApis === Infinity) 
            ? undefined 
            : (config.maxCatalogs + config.maxApis) * 20,
        maxRequestRetries: config.maxRequestRetries,
        requestHandlerTimeoutSecs: config.timeout === Infinity ? 3600 : config.timeout / 1000,
        maxConcurrency: config.maxConcurrency,
        minConcurrency: config.minConcurrency,
        
        // Use session pool to rotate user agents (helps with 403 errors)
        useSessionPool: true,

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
                    let catalogsCount = 0;
                    let apisCount = 0;

                    for (const catalogData of catalogs) {
                        const catalogsFull = config.maxCatalogs !== Infinity && catalogsCount >= config.maxCatalogs;
                        const apisFull = config.maxApis !== Infinity && apisCount >= config.maxApis;

                        // Break if both limits are reached
                        if (catalogsFull && apisFull) break;
                        
                        // catalogData structure: { id, url, title, ... }
                        if (catalogData.url) {
                            const isApi = catalogData.isApi === true;

                            // Check limits for this specific type
                            if (isApi && apisFull) continue;
                            if (!isApi && catalogsFull) continue;

                            // Determine if we should crawl this based on mode
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
                                
                                if (isApi) apisCount++;
                                else catalogsCount++;
                            }
                        }
                    }
                    log.info(`Enqueued ${catalogsCount} catalogs and ${apisCount} APIs for crawling`);

                } catch (error) {
                    log.error(`Failed to process STAC Index response: ${error.message}\nStack: ${error.stack}`);
                }

            } else if (label === 'STAC_ENTITY') {
                await processStacEntity(context);
            } else if (label === 'COLLECTIONS_LIST') {
                await processCollectionList(context);
            }
        },

        // Error handling
        failedRequestHandler({ request, error, log }) {
            // Detailed error logging
            log.error(`Request ${request.url} failed too many times: ${error.message}`);
            if (error.cause) {
                log.error(`Cause: ${error.cause.message}`);
            }
        },
    });

    // Start the crawler
    const targetUrl = config.targetUrl;
    try {
        await crawler.run([
            { 
                url: targetUrl, 
                userData: { label: 'START' } 
            }
        ]);
        console.log('Crawler run finished.');
    } catch (err) {
        console.error('Crawler execution failed:', err);
    } finally {
        // Ensure DB is closed only after crawler finishes (or fails)
        // and give a small grace period for any pending DB writes to flush
        console.log('Waiting for pending DB operations to finish...');
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds

        console.log('Closing DB connection...');
        await db.close();
        console.log('Crawler process finished.');
    }
};

main().catch(console.error);
