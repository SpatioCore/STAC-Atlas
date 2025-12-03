/**
 * @fileoverview STAC Index API crawler that fetches and processes catalog data
 * @module crawler
 */

import axios from 'axios';
import { processCatalogs } from './utils/normalization.js';
import { crawlCatalogs } from './catalogs/catalog.js';
import { crawlApis } from './apis/api.js';
import { getConfig } from './utils/config.js';
import * as db from './db.js';

/**
 * URL of the STAC Index API endpoint
 * @type {string}
 */
const targetUrl = 'https://www.stacindex.org/api/catalogs';

/**
 * Fetches catalog data from the STAC Index API and processes it
 * @async
 * @function crawler
 * @returns {Promise<void>}
 */
const crawler = async () => {
    try {
        // Load configuration
        const config = getConfig();
        
        // Initialize database connection (unless --no-db flag is set)
        if (!config.noDb) {
            await db.initDb();
        }
        
        // Display configuration
        console.log('\n=== STAC Crawler Configuration ===');
        console.log(`Mode: ${config.mode}`);
        console.log(`Max Catalogs: ${config.maxCatalogs === Infinity ? 'unlimited' : config.maxCatalogs}`);
        console.log(`Max APIs: ${config.maxApis === Infinity ? 'unlimited' : config.maxApis}`);
        console.log(`Timeout: ${config.timeout === Infinity ? 'unlimited' : config.timeout + 'ms'}`);
        console.log(`Crawl Depth: unlimited`);
        console.log(`Database: ${config.noDb ? 'disabled (terminal output only)' : 'enabled'}`);
        console.log('==================================\n');
        
        const response = await axios.get(targetUrl);
        const catalogs = processCatalogs(response.data);
        
        // Crawl catalogs if mode is 'catalogs' or 'both'
        if (config.mode === 'catalogs' || config.mode === 'both') {
            console.log('\nCrawling collections and nested catalogs with Crawlee...\n');
            
            const catalogsToProcess = config.maxCatalogs === Infinity 
                ? catalogs 
                : catalogs.slice(0, config.maxCatalogs);
            
            console.log(`Processing ${catalogsToProcess.length} catalogs (max: ${config.maxCatalogs === Infinity ? 'unlimited' : config.maxCatalogs})\n`);
            
            try {
                const results = await crawlCatalogs(catalogsToProcess, config);
                console.log(`\nTotal collections found across all catalogs: ${results.stats.collectionsFound}`);
                
                // Persist collections to database
                if (!config.noDb && results.collections.length > 0) {
                    console.log(`\nSaving ${results.collections.length} collections to database...`);
                    let savedCount = 0;
                    let errorCount = 0;
                    
                    for (const collection of results.collections) {
                        try {
                            await db.insertOrUpdateCollection(collection);
                            savedCount++;
                        } catch (err) {
                            errorCount++;
                            console.error(`DB write error for collection ${collection.id}:`, err.message);
                        }
                    }
                    
                    console.log(`Successfully saved ${savedCount} collections to database`);
                    if (errorCount > 0) {
                        console.log(`Failed to save ${errorCount} collections`);
                    }
                } else if (config.noDb && results.collections.length > 0) {
                    console.log(`\n[--no-db mode] Found ${results.collections.length} collections (not saved to database)`);
                }
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
                const apisToProcess = config.maxApis === Infinity ? apiUrls : apiUrls.slice(0, config.maxApis);
                console.log(`Found ${apiUrls.length} APIs. Processing ${apisToProcess.length} (max: ${config.maxApis === Infinity ? 'unlimited' : config.maxApis})...`);
                
                try {
                    const collections = await crawlApis(apisToProcess, true, config);
                    console.log(`\nFetched ${collections.length} collections from APIs (sorted by URL).`);
                    
                    if (collections.length > 0) {
                        console.log('First 3 collections found:');
                        collections.slice(0, 3).forEach(c => {
                            const selfLink = c.links?.find(l => l.rel === 'self')?.href;
                            console.log(` - ${c.id}: ${selfLink}`);
                        });
                        
                        // Persist API collections to database
                        if (!config.noDb) {
                            console.log(`\nSaving ${collections.length} API collections to database...`);
                            let savedCount = 0;
                            let errorCount = 0;
                            
                            for (const collection of collections) {
                                try {
                                    await db.insertOrUpdateCollection(collection);
                                    savedCount++;
                                } catch (err) {
                                    errorCount++;
                                    console.error(`DB write error for collection ${collection.id}:`, err.message);
                                }
                            }
                            
                            console.log(`Successfully saved ${savedCount} API collections to database`);
                            if (errorCount > 0) {
                                console.log(`Failed to save ${errorCount} collections`);
                            }
                        } else {
                            console.log(`\n[--no-db mode] Found ${collections.length} API collections (not saved to database)`);
                        }
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

        // Persist catalogs metadata to database
        if (!config.noDb) {
            console.log(`\nSaving ${catalogs.length} catalog metadata entries to database...`);
            let savedCatalogCount = 0;
            let errorCatalogCount = 0;
            
            for (const catalog of catalogs) {
                try {
                    await db.insertOrUpdateCatalog(catalog);
                    savedCatalogCount++;
                } catch (err) {
                    errorCatalogCount++;
                    console.error(`DB write error for catalog ${catalog.id || catalog.slug}:`, err.message);
                }
            }
            
            console.log(`Successfully saved ${savedCatalogCount} catalog metadata entries`);
            if (errorCatalogCount > 0) {
                console.log(`Failed to save ${errorCatalogCount} catalog entries`);
            }
        } else {
            console.log(`\n[--no-db mode] Skipping catalog metadata persistence`);
        }

    } catch (error) {
        console.error(`Error fetching ${targetUrl}:`, error);
    } finally {
        // Close database connection (unless --no-db flag is set)
        if (!getConfig().noDb) {
            await db.close();
            console.log('\nDatabase connection closed.');
        }
    }

};

crawler();