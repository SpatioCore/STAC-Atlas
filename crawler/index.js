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
        
        // Initialize database connection
        console.log('Initializing database connection...');
        await db.initDb();
        
        const response = await axios.get(targetUrl);
        const catalogs = processCatalogs(response.data);
        
        // Save catalogs from STAC Index to database
        console.log('\n=== Saving catalogs to database ===');
        let catalogsSaved = 0;
        let catalogsFailed = 0;
        
        for (const catalog of response.data) {
            try {
                const catalogId = await db.insertOrUpdateCatalog(catalog);
                console.log(`✓ Saved catalog: ${catalog.title || catalog.id} (DB ID: ${catalogId})`);
                catalogsSaved++;
            } catch (err) {
                console.error(`✗ Failed catalog: ${catalog.title || catalog.id} - ${err.message}`);
                catalogsFailed++;
            }
        }
        
        console.log(`\nCatalogs: ${catalogsSaved} saved, ${catalogsFailed} failed\n`);
        
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
                
                try {
                    const stats = await crawlCatalogRecursive(catalog, 0, config);
                    totalCollections += stats.collections;
                    
                    // Save collections to database if returned
                    if (stats.collectionsData && Array.isArray(stats.collectionsData)) {
                        for (const collection of stats.collectionsData) {
                            try {
                                const collectionId = await db.insertOrUpdateCollection(collection);
                                console.log(`  ✓ Saved collection: ${collection.title || collection.id} (DB ID: ${collectionId})`);
                            } catch (err) {
                                console.error(`  ✗ Failed collection: ${collection.title || collection.id} - ${err.message}`);
                            }
                        }
                    }
                } catch (error) {
                    console.error(`Failed to crawl catalog ${catalog.id}: ${error.message}`);
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
                        
                        // Save API collections to database
                        console.log('\n=== Saving API collections to database ===');
                        let apiCollectionsSaved = 0;
                        let apiCollectionsFailed = 0;
                        
                        for (const collection of collections) {
                            try {
                                const collectionId = await db.insertOrUpdateCollection(collection);
                                console.log(`  ✓ Saved: ${collection.title || collection.id} (DB ID: ${collectionId})`);
                                apiCollectionsSaved++;
                            } catch (err) {
                                console.error(`  ✗ Failed: ${collection.title || collection.id} - ${err.message}`);
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
    } finally {
        // Close database connection
        await db.close();
        console.log('\nDatabase connection closed.');
    }
};

crawler();