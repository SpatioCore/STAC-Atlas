/**
 * @fileoverview STAC Index API crawler that fetches and processes catalog data
 * @module crawler
 */

import { HttpCrawler, LogLevel } from 'crawlee';
import create from 'stac-js';
import * as db from './db.js';
import { getConfig } from './utils/config.js';

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
                            // The original code separated 'catalogs' and 'apis' modes based on catalogData.isApi
                            // but here we can potentially crawl both or filter.
                            
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
                // Handle generic STAC entity (Catalog, Collection, API root)
                try {
                    const data = JSON.parse(body);
                    let stacObj;
                    
                    try {
                        stacObj = create(data);
                    } catch (e) {
                        log.warning(`Failed to parse STAC object at ${url}: ${e.message}`);
                        return;
                    }

                    // Persist to DB
                    try {
                        if (stacObj.isCollection()) {
                            await db.insertOrUpdateCollection(stacObj.toJSON());
                            log.info(`Saved Collection: ${stacObj.id}`);
                        } else if (stacObj.isCatalog() || stacObj.isCatalogLike()) {
                            await db.insertOrUpdateCatalog(stacObj.toJSON());
                            log.info(`Saved Catalog: ${stacObj.id}`);
                        }
                    } catch (dbError) {
                        log.error(`DB Error for ${stacObj.id}: ${dbError.message}`);
                    }

                    // Recursion: Find child links
                    // Check depth limit
                    if (config.maxDepth === Infinity || depth < config.maxDepth) {
                        const newDepth = depth + 1;
                        
                        // Helper to collect links to enqueue
                        const linksToEnqueue = [];

                        // 1. Child links (nested catalogs/collections)
                        const childLinks = stacObj.getChildLinks();
                        for (const link of childLinks) {
                            const childUrl = link.getAbsoluteUrl();
                            if (childUrl) {
                                linksToEnqueue.push({
                                    url: childUrl,
                                    userData: { label: 'STAC_ENTITY', depth: newDepth }
                                });
                            }
                        }

                        // 2. Collection links (if Catalog/API)
                        // stac-js doesn't always find "collections" link via getChildLinks if rel is not 'child'
                        // We explicitly check for /collections or rel='data'/'collections'
                        if (stacObj.isCatalogLike()) {
                            // Try standard links
                            const collectionsLink = stacObj.getLinkWithRel('data') || stacObj.getLinkWithRel('collections');
                            if (collectionsLink) {
                                const colUrl = collectionsLink.getAbsoluteUrl();
                                if (colUrl) {
                                    linksToEnqueue.push({
                                        url: colUrl,
                                        userData: { label: 'COLLECTIONS_LIST', depth: newDepth }
                                    });
                                }
                            } else {
                                // Heuristic: append /collections if not found
                                // Only if it looks like an API (root catalog often is)
                                // But we must be careful not to generate 404s excessively.
                                // Crawlee handles 404s gracefully.
                                // checks if isApi is true from userData or if it looks like API
                                if (userData.isApi) {
                                     // Try common endpoint
                                     const urlObj = new URL(url);
                                     if (!url.endsWith('/collections')) {
                                         const collectionsUrl = url.endsWith('/') ? `${url}collections` : `${url}/collections`;
                                         linksToEnqueue.push({
                                             url: collectionsUrl,
                                             userData: { label: 'COLLECTIONS_LIST', depth: newDepth }
                                         });
                                     }
                                }
                            }
                        }

                        // Enqueue all found links
                        if (linksToEnqueue.length > 0) {
                             await crawler.addRequests(linksToEnqueue);
                             log.info(`Enqueued ${linksToEnqueue.length} links from ${stacObj.id}`);
                        }
                    }

                } catch (error) {
                    log.error(`Error processing STAC entity ${url}: ${error.message}`);
                }
            } else if (label === 'COLLECTIONS_LIST') {
                // Handle /collections endpoint (list of collections)
                try {
                    const data = JSON.parse(body);
                    // It might be a { collections: [...] } object or just array
                    let collections = [];
                    
                    if (data.collections && Array.isArray(data.collections)) {
                        collections = data.collections;
                    } else if (Array.isArray(data)) {
                        collections = data;
                    }

                    log.info(`Found ${collections.length} collections in list at ${url}`);

                    for (const colData of collections) {
                         // Determine URL for the collection to fully process it (or process inline)
                         // If inline, we can save directly.
                         // But better to treat as separate request or just save here?
                         // If we want to crawl *inside* the collection (items?), we should enqueue.
                         // For now, let's save and enqueue if depth allows.
                         
                         let colUrl;
                         try {
                             // Try to find self link
                             const selfLink = colData.links?.find(l => l.rel === 'self');
                             colUrl = selfLink ? selfLink.href : null;
                             
                             // If no self link, construct if possible or skip crawling children
                         } catch(e) {}

                         // Save inline collection data
                         try {
                             const stacCol = create(colData);
                             await db.insertOrUpdateCollection(stacCol.toJSON());
                             log.info(`Saved Collection (from list): ${stacCol.id}`);
                             
                             // Enqueue for deeper crawl if URL exists and depth allows
                             if (colUrl && (config.maxDepth === Infinity || depth < config.maxDepth)) {
                                 await crawler.addRequests([{
                                     url: colUrl,
                                     userData: { label: 'STAC_ENTITY', depth: depth + 1 }
                                 }]);
                             }

                         } catch (err) {
                             log.error(`Error saving collection from list: ${err.message}`);
                         }
                    }

                } catch (error) {
                    log.error(`Error processing collections list ${url}: ${error.message}`);
                }
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
