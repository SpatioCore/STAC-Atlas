/**
 * @fileoverview STAC Index API crawler that fetches and processes catalog data
 * @module crawler
 */

import axios from 'axios';
import { splitCatalogs, crawlCatalogRecursive } from './catalogs/catalog.js';
import { crawlApis } from './apis/api.js';

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
        const response = await axios.get(targetUrl);
        const catalogs = splitCatalogs(response.data);
        
        // Crawl collections and nested catalogs for each catalog
        console.log('\n Crawling collections and nested catalogs...\n');
        let totalCollections = 0;
        for (const catalog of response.data.slice(0, 10)) { // Limit to first 10 catalogs
            const stats = await crawlCatalogRecursive(catalog);
            totalCollections += stats.collections;
        }
        
        console.log(`\n Total collections found across all catalogs: ${totalCollections}`);

        // Extract API URLs and crawl them
        console.log('\n Crawling APIs...');
        const apiUrls = catalogs
            .filter(cat => cat[10] === true) // isApi is at index 10
            .map(cat => cat[2]); // url is at index 2
            
        if (apiUrls.length > 0) {
            console.log(`Found ${apiUrls.length} APIs. Starting crawl...`);
            // Limit to first 5 APIs for demonstration/performance
            const collections = await crawlApis(apiUrls.slice(0, 5), true);
            console.log(`\nFetched ${collections.length} collections from APIs (sorted by URL).`);
            
            if (collections.length > 0) {
                console.log('First 3 collections found:');
                collections.slice(0, 3).forEach(c => {
                    const selfLink = c.links?.find(l => l.rel === 'self')?.href;
                    console.log(` - ${c.id}: ${selfLink}`);
                });
            }
        } else {
            console.log('No APIs found to crawl.');
        }

    } catch (error) {
        console.error(`Error fetching ${targetUrl}: ${error.message}`);
    }
};

crawler();
