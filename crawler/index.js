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

/**
 * URL of the STAC Index API endpoint
 * @type {string}
 */
const targetUrl = 'https://www.stacindex.org/api/catalogs';

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
        
        // Display configuration
        console.log('\n=== STAC Crawler Configuration ===');
        console.log(`Mode: ${config.mode}`);
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
        
        // Save catalogs from STAC Index to database
        console.log('\n=== Saving catalogs to database ===');
        let catalogsSaved = 0;
        let catalogsFailed = 0;
        
        // Use normalized catalogs instead of raw response.data
        for (const catalog of catalogs) {
            try {
                const catalogId = await db.insertOrUpdateCatalog(catalog);
                console.log(`Saved catalog: ${catalog.title || catalog.id} (DB ID: ${catalogId})`);
                catalogsSaved++;
            } catch (err) {
                console.error(`Failed catalog: ${catalog.title || catalog.id} - ${err.message}`);
                catalogsFailed++;
            }
        }
        
        console.log(`\nCatalogs: ${catalogsSaved} saved, ${catalogsFailed} failed\n`);
        
        // Separate static catalogs from real APIs
        const staticCatalogs = catalogs.filter(cat => cat.isApi === true && isStaticCatalogUrl(cat.url));
        const regularCatalogs = catalogs.filter(cat => cat.isApi !== true);
        const realApis = catalogs.filter(cat => cat.isApi === true && !isStaticCatalogUrl(cat.url));
        
        console.log(`\nCatalog Classification:`);
        console.log(`  Regular Catalogs: ${regularCatalogs.length}`);
        console.log(`  Static Catalogs (mismarked as APIs): ${staticCatalogs.length}`);
        console.log(`  Real APIs: ${realApis.length}\n`);
        
        // Crawl catalogs if mode is 'catalogs' or 'both'
        if (config.mode === 'catalogs' || config.mode === 'both') {
            console.log('\nCrawling collections and nested catalogs with Crawlee...\n');
            
            // Combine regular catalogs with static catalogs (mismarked as APIs)
            const allCatalogsToProcess = [...regularCatalogs, ...staticCatalogs];
            
            // Note: MAX_CATALOGS limit is for debugging purposes only
            // Set maxCatalogs to 0 or use --max-catalogs 0 for unlimited catalog crawling
            const catalogsToProcess = config.maxCatalogs === 0 
                ? allCatalogsToProcess 
                : allCatalogsToProcess.slice(0, config.maxCatalogs);
            
            console.log(`Processing ${catalogsToProcess.length} catalogs (max: ${config.maxCatalogs === 0 ? 'unlimited' : config.maxCatalogs})`);
            console.log(`  (includes ${staticCatalogs.length} static catalogs mismarked as APIs)\n`);
            
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
            const apiUrls = realApis.map(cat => cat.url);
                
            if (apiUrls.length > 0) {
                // Note: MAX_APIS limit is for debugging purposes only
                // Set maxApis to 0 or use --max-apis 0 for unlimited API crawling
                const apisToProcess = config.maxApis === 0 ? apiUrls : apiUrls.slice(0, config.maxApis);
                console.log(`Found ${realApis.length} real APIs. Processing ${apisToProcess.length} (max: ${config.maxApis === 0 ? 'unlimited' : config.maxApis})...`);
                
                try {
                    const apiResults = await crawlApis(apisToProcess, true, config);
                    // Collections are now saved to DB during the crawl (batch flushing)
                    console.log(`\nAPI Crawl Complete:`);
                    console.log(`   Collections Found: ${apiResults.stats.collectionsFound}`);
                    console.log(`   Collections Saved: ${apiResults.stats.collectionsSaved}`);
                    console.log(`   Collections Failed: ${apiResults.stats.collectionsFailed}`);
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