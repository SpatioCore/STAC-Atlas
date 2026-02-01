/**
 * @fileoverview STAC Index API crawler that fetches and processes catalog data
 * @module crawler
 */

import axios from 'axios';
import { processCatalogs } from './utils/normalization.js';
import { crawlCatalogs } from './catalogs/catalog.js';
import { crawlApis } from './apis/api.js';
import { getConfig, isStaticCatalogUrl } from './utils/config.js';
import { formatDuration } from './utils/time.js';
import db from './utils/db.js';
import globalStats from './utils/globalStats.js';

/**
 * URL of the STAC Index API endpoint
 * @type {string}
 */
const targetUrl = 'https://www.stacindex.org/api/catalogs';

/**
 * Flag to track if shutdown was requested
 */
let shutdownRequested = false;

/**
 * Check if shutdown was requested (can be used by crawlers to stop early)
 * @returns {boolean} True if shutdown was requested
 */
export function isShutdownRequested() {
    return shutdownRequested;
}

/**
 * Request a graceful shutdown of the crawler
 * The crawler will stop after completing the current batch
 */
export function requestShutdown() {
    if (!shutdownRequested) {
        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('GRACEFUL SHUTDOWN REQUESTED');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('The crawler will stop after the current batch completes.');
        console.log('Already-crawled collections are saved in crawllog_collection.');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        shutdownRequested = true;
    }
}

/**
 * Reset the shutdown flag (for scheduler to start a new crawl)
 */
export function resetShutdownFlag() {
    shutdownRequested = false;
}

/**
 * Fetches catalog data from the STAC Index API and processes it
 * @async
 * @function crawler
 * @returns {Promise<Object>} Returns statistics about the crawl including success status and runtime
 */
export const crawler = async () => {
    // Start the timer
    const startTime = Date.now();
    let dbError = false;
    let crawlError = false;
    
    // Setup graceful shutdown handler
    const shutdownHandler = async (signal) => {
        if (shutdownRequested) {
            console.log('\nForce shutdown requested. Exiting immediately...');
            process.exit(1);
        }
        
        console.log(`\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.log(`PAUSE REQUESTED (${signal})`);
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.log(`The crawler will stop after the current batch completes.`);
        console.log(`Already-crawled collections are saved in crawllog_collection.`);
        console.log(`Re-run the crawler to resume from where it left off.`);
        console.log(`Press Ctrl+C again to force immediate exit.`);
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
        
        shutdownRequested = true;
    };
    
    process.on('SIGINT', shutdownHandler);
    process.on('SIGTERM', shutdownHandler);
    
    try {
        // Load configuration
        const config = getConfig();
        
        // Initialize database connection
        try {
            await db.initDb();
        } catch (err) {
            console.error(`\nDatabase initialization failed: ${err.message}`);
            dbError = true;
            throw err;
        }
        
        // Clear crawllog if fresh mode is enabled (allows re-crawling everything)
        if (config.fresh) {
            console.log('\n=== Fresh mode enabled - Clearing crawllog ===');
            try {
                await db.clearCrawllogCollection();
                console.log('Crawllog collection entries cleared. All URLs will be re-crawled.');
            } catch (err) {
                console.error(`Warning: Failed to clear crawllog: ${err.message}`);
            }
        }
        
        // Display configuration
        console.log('\n=== STAC Crawler Configuration ===');
        console.log(`Mode: ${config.mode}`);
        console.log(`Fresh Mode: ${config.fresh ? 'enabled (re-crawl everything)' : 'disabled (resume/skip crawled URLs)'}`);
        console.log(`Max Catalogs: ${config.maxCatalogs === 0 ? 'unlimited' : config.maxCatalogs} (debugging limit)`);
        console.log(`Max APIs: ${config.maxApis === 0 ? 'unlimited' : config.maxApis} (debugging limit)`);
        console.log(`Timeout: ${config.timeout === Infinity ? 'unlimited' : config.timeout + 'ms'}`);
        console.log(`Max Depth: ${config.maxDepth === 0 ? 'unlimited' : config.maxDepth} levels`);
        console.log('--- Parallel Crawling ---');
        console.log(`Parallel Domains: ${config.parallelDomains}`);
        console.log(`Max Requests/Min per Domain: ${config.maxRequestsPerMinutePerDomain}`);
        console.log(`Max Concurrency per Domain: ${config.maxConcurrencyPerDomain}`);
        console.log(`Theoretical Max Throughput: ${config.parallelDomains * config.maxRequestsPerMinutePerDomain} req/min`);
        console.log('==================================\n');
        
        const response = await axios.get(targetUrl);
        const catalogs = processCatalogs(response.data);
        
        // Save catalogs from STAC Index to crawllog_catalog table
        // This creates the URL queue for re-crawling and stores the slug for stac_id generation
        console.log('\n=== Saving catalogs to crawllog_catalog ===');
        let catalogsSaved = 0;
        let catalogsFailed = 0;
        
        for (const catalog of catalogs) {
            try {
                const isApi = catalog.isApi === true && !isStaticCatalogUrl(catalog.url);
                const crawllogId = await db.saveCrawllogCatalog({
                    slug: catalog.slug,
                    url: catalog.url,
                    isApi: isApi
                });
                console.log(`Saved: ${catalog.title || catalog.slug} (crawllog_id: ${crawllogId}, isApi: ${isApi})`);
                catalogsSaved++;
            } catch (err) {
                console.error(`Failed: ${catalog.title || catalog.slug} - ${err.message}`);
                catalogsFailed++;
            }
        }
        
        console.log(`\nCrawllog Catalogs: ${catalogsSaved} saved, ${catalogsFailed} failed\n`);
        
        // Now fetch the URL queue from crawllog_catalog for re-crawling
        // This allows us to re-crawl existing catalogs without fetching from STAC Index again
        console.log('\n=== Loading catalogs from crawllog_catalog for crawling ===');
        const crawllogCatalogs = await db.getCrawllogCatalogs({ isApi: false });
        const crawllogApis = await db.getCrawllogCatalogs({ isApi: true });
        
        console.log(`Loaded ${crawllogCatalogs.length} catalogs and ${crawllogApis.length} APIs from crawllog_catalog\n`);
        
        // Merge original catalog metadata with crawllog entries for crawling
        // We need the full catalog info (title, etc.) for processing
        const catalogUrlMap = new Map(catalogs.map(c => [c.url, c]));
        
        const regularCatalogs = crawllogCatalogs.map(cl => {
            const original = catalogUrlMap.get(cl.url) || {};
            return {
                ...original,
                id: cl.id,
                slug: cl.slug,
                url: cl.url,
                crawllogCatalogId: cl.id  // Pass the crawllog_catalog id for linking
            };
        });

        
        const realApis = crawllogApis.map(cl => {
            const original = catalogUrlMap.get(cl.url) || {};
            return {
                ...original,
                id: cl.id,
                slug: cl.slug,
                url: cl.url,
                crawllogCatalogId: cl.id  // Pass the crawllog_catalog id for linking
            };
        });

        
        console.log(`\nCatalog Classification (from crawllog_catalog):`);
        console.log(`  Catalogs: ${regularCatalogs.length}`);
        console.log(`  APIs: ${realApis.length}\n`);
        
        // Start global statistics tracking (no periodic logging, only final stats)
        const totalItems = [...regularCatalogs, ...realApis].length;
        globalStats.start(totalItems);
        
        // Crawl catalogs if mode is 'catalogs' or 'both'
        if (config.mode === 'catalogs' || config.mode === 'both') {
            console.log('\nCrawling collections and nested catalogs with Crawlee...\n');
            
            const allCatalogsToProcess = regularCatalogs;
            
            // Note: MAX_CATALOGS limit is for debugging purposes only
            // Set maxCatalogs to 0 or use --max-catalogs 0 for unlimited catalog crawling
            const catalogsToProcess = config.maxCatalogs === 0 
                ? allCatalogsToProcess 
                : allCatalogsToProcess.slice(0, config.maxCatalogs);
            
            console.log(`Processing ${catalogsToProcess.length} catalogs (max: ${config.maxCatalogs === 0 ? 'unlimited' : config.maxCatalogs})\n`);
            
            try {
                const results = await crawlCatalogs(catalogsToProcess, config);
                console.log(`\nTotal collections found across all catalogs: ${results.stats.collectionsFound}`);
            } catch (error) {
                console.error(`Failed to crawl catalogs: ${error.message}`);
            }
        } else {
            console.log('\nSkipping catalog crawling (mode: apis)\n');
        }

        // Crawl APIs if mode is 'apis' or 'both'
        if (config.mode === 'apis' || config.mode === 'both') {
            console.log('\nCrawling APIs...');
            // Pass full API objects (including slug and crawllogCatalogId) instead of just URLs
            const apiObjects = realApis.map(api => ({ 
                url: api.url, 
                slug: api.slug, 
                title: api.title,
                crawllogCatalogId: api.crawllogCatalogId  // Link to crawllog_catalog for collections
            }));
                
            if (apiObjects.length > 0) {
                // Note: MAX_APIS limit is for debugging purposes only
                // Set maxApis to 0 or use --max-apis 0 for unlimited API crawling
                const apisToProcess = config.maxApis === 0 ? apiObjects : apiObjects.slice(0, config.maxApis);
                console.log(`Found ${apiObjects.length} APIs. Processing ${apisToProcess.length} (max: ${config.maxApis === 0 ? 'unlimited' : config.maxApis})...`);
                
                try {
                    await crawlApis(apisToProcess, true, config);
                } catch (error) {
                    console.error(`Failed to crawl APIs: ${error.message}`);
                }
            } else {
                console.log('No APIs found to crawl.');
            }
        } else {
            console.log('\nSkipping API crawling (mode: catalogs)\n');
        }

    } catch (error) {
        console.error(`Error fetching ${targetUrl}: ${error.message}`);
        if (!dbError) {
            crawlError = true;
        }
    } finally {
        // Stop global statistics tracking and log final stats
        globalStats.stop();
        
        // Deactivate collections that haven't been updated in the last 7 days
        if (!dbError) {
            try {
                console.log('\nChecking for stale collections...');
                await db.deactivateStaleCollections();
            } catch (err) {
                console.error(`Error deactivating stale collections: ${err.message}`);
            }
        }
        
        // Close database connection
        if (!dbError) {
            try {
                await db.close();
                console.log('\nDatabase connection closed.');
            } catch (err) {
                console.error(`Error closing database: ${err.message}`);
            }
        }
        
        // Display total running time
        const endTime = Date.now();
        const elapsedTime = endTime - startTime;
        
        console.log('\n=== Crawler Time Statistics ===');
        console.log(`Total Running Time: ${formatDuration(elapsedTime)}`);
        console.log(`Total Running Time (ms): ${elapsedTime}ms`);
        console.log(`Status: ${dbError ? 'Database Error' : crawlError ? 'Crawl Error' : 'Success'}`);
        console.log('================================\n');
        
        // Return statistics
        return {
            success: !dbError && !crawlError,
            dbError,
            crawlError,
            elapsedTime,
            startTime,
            endTime
        };
    }
};

// Run crawler if this file is executed directly
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule || import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
    crawler();
}