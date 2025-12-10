/**
 * @fileoverview STAC Index API crawler that fetches and processes catalog data
 * @module crawler
 */

import axios from 'axios';
import { processCatalogs } from './utils/normalization.js';
import { crawlCatalogs } from './catalogs/catalog.js';
import { crawlApis } from './apis/api.js';
import { getConfig } from './utils/config.js';
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
        console.log(`Crawl Depth: unlimited`);
        console.log('==================================\n');
        
        const response = await axios.get(targetUrl);
        const catalogs = processCatalogs(response.data);
        
        // Save catalogs from STAC Index to database
        console.log('\n=== Saving catalogs to database ===');
        let catalogsSaved = 0;
        let catalogsFailed = 0;
        
        for (const catalog of response.data) {
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
        
        // Crawl catalogs if mode is 'catalogs' or 'both'
        if (config.mode === 'catalogs' || config.mode === 'both') {
            console.log('\nCrawling collections and nested catalogs with Crawlee...\n');
            
            // Note: MAX_CATALOGS limit is for debugging purposes only
            // Set maxCatalogs to 0 or use --max-catalogs 0 for unlimited catalog crawling
            const catalogsToProcess = config.maxCatalogs === 0 
                ? catalogs 
                : catalogs.slice(0, config.maxCatalogs);
            
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
            const apiUrls = catalogs
                .filter(cat => cat.isApi === true)
                .map(cat => cat.url);
                
            if (apiUrls.length > 0) {
                // Note: MAX_APIS limit is for debugging purposes only
                // Set maxApis to 0 or use --max-apis 0 for unlimited API crawling
                const apisToProcess = config.maxApis === 0 ? apiUrls : apiUrls.slice(0, config.maxApis);
                console.log(`Found ${apiUrls.length} APIs. Processing ${apisToProcess.length} (max: ${config.maxApis === 0 ? 'unlimited' : config.maxApis})...`);
                
                try {
                    const apiResults = await crawlApis(apisToProcess, true, config);
                    const collections = apiResults.collections || [];
                    console.log(`\nFetched ${collections.length} collections from APIs.`);
                    
                    if (collections.length > 0) {
                        console.log('First 3 collections found:');
                        collections.slice(0, 3).forEach(c => {
                            console.log(` - ${c.id}: ${c.title}`);
                        });
                        
                        // Save API collections to database
                        console.log('\n=== Saving API collections to database ===');
                        let apiCollectionsSaved = 0;
                        let apiCollectionsFailed = 0;
                        
                        for (const collection of collections) {
                            try {
                                const collectionId = await db.insertOrUpdateCollection(collection);
                                console.log(`  Saved: ${collection.title || collection.id} (DB ID: ${collectionId})`);
                                apiCollectionsSaved++;
                            } catch (err) {
                                console.error(`  Failed: ${collection.title || collection.id} - ${err.message}`);
                                apiCollectionsFailed++;
                            }
                        }
                        
                        console.log(`\nAPI Collections: ${apiCollectionsSaved} saved, ${apiCollectionsFailed} failed`);
                    }
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
if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
    crawler();
}