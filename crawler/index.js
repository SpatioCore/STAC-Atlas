/**
 * @fileoverview STAC Index API crawler that fetches and processes catalog data
 * @module crawler
 */

const axios = require('axios');
const { splitCatalogs, crawlCatalogRecursive } = require('./catalogs/catalog');

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
    } catch (error) {
        console.error(`Error fetching ${targetUrl}: ${error.message}`);
    }

    // Persist catalogs into DB
    try {
        await Promise.all(catalogs.map(async (catalog) => {
            try {
                await db.insertOrUpdateCatalog(catalog);
            } catch (err) {
                console.error('DB write error for catalog', catalog && (catalog.id || catalog.slug), err && err.message);
            }
        }));
        console.log('Finished writing catalogs to DB');
    } catch (e) {
        console.error('Unexpected error while saving catalogs to DB', e && e.message);
    }

};

crawler();