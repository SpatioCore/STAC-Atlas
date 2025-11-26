/**
 * @fileoverview API crawling functionality for STAC Index
 * @module apis/api
 */

import axios from 'axios';
import create from 'stac-js';

/**
 * Crawls STAC APIs to retrieve collection information without fetching items.
 * 
 * @param {string[]} urls - Array of API URLs to crawl
 * @param {boolean} isApi - Boolean flag indicating if the URLs are APIs
 * @returns {Promise<Object[]>} Array of STAC Collection objects ordered by URL
 */
async function crawlApis(urls, isApi) {
    if (!isApi || !Array.isArray(urls) || urls.length === 0) {
        return [];
    }

    const allCollections = new Map(); // Use Map to avoid duplicates by URL

    console.log(`Starting to crawl ${urls.length} APIs...`);

    // Process each URL
    for (const [index, url] of urls.entries()) {
        console.log(`Processing API ${index + 1}/${urls.length}: ${url}`);
        try {
            await crawlSingleApi(url, allCollections);
        } catch (error) {
            console.error(`Error crawling API ${url}:`, error.message);
        }
    }

    console.log(`Finished crawling APIs. Total unique collections found: ${allCollections.size}`);

    // Convert Map to array and sort by URL
    const sortedCollections = Array.from(allCollections.values()).sort((a, b) => {
        const urlA = getSelfLink(a) || '';
        const urlB = getSelfLink(b) || '';
        return urlA.localeCompare(urlB);
    });

    return sortedCollections;
}

/**
 * Helper function to crawl a single API recursively for collections/catalogs
 * 
 * @param {string} url - URL to crawl
 * @param {Map} collectionMap - Map to store found collections
 * @param {Set<string>} visited - Set of visited URLs to prevent loops
 */
async function crawlSingleApi(url, collectionMap, visited = new Set()) {
    if (!url || visited.has(url)) return;
    visited.add(url);

    try {
        console.log(`  Fetching: ${url}`);
        const response = await axios.get(url);
        const stacObj = create(response.data);

        // If it's a Collection, add it
        if (stacObj.isCollection()) {
            const selfUrl = stacObj.getAbsoluteUrl() || url;
            console.log(`  Found collection: ${stacObj.id} (${selfUrl})`);
            collectionMap.set(selfUrl, stacObj.toJSON());
        }

        // If it has collections (API or Catalog), fetch them
        // stac-js APICollection or Catalog might have getApiCollectionsLink or similar
        // Or we manually check links.
        
        // Check for /collections endpoint if it's a root catalog/API
        if (stacObj.isCatalogLike()) {
            // Try to get collections link
            const collectionsLink = stacObj.getApiCollectionsLink();
            if (collectionsLink) {
                console.log(`  Found /collections endpoint link in ${url}`);
                await fetchCollectionsFromLink(collectionsLink, collectionMap, visited);
            } else {
                // Fallback: check standard STAC API structure if not explicitly found
                // Many STAC APIs have a /collections endpoint relative to root
                // But stac-js might handle this via getApiCollectionsLink if rel="data" exists
                
                // Also check child links for nested catalogs
                const childLinks = stacObj.getChildLinks();
                if (childLinks.length > 0) {
                     console.log(`  Found ${childLinks.length} child links in ${url}, recursing...`);
                     for (const link of childLinks) {
                        const childUrl = link.getAbsoluteUrl();
                        if (childUrl) {
                            await crawlSingleApi(childUrl, collectionMap, visited);
                        }
                    }
                }
            }
        }

    } catch (error) {
        console.warn(`Failed to process ${url}:`, error.message);
    }
}

/**
 * Fetches collections from a collections endpoint (e.g., /collections)
 * 
 * @param {Object} link - stac-js Link object
 * @param {Map} collectionMap - Map to store collections
 * @param {Set<string>} visited - Visited set
 */
async function fetchCollectionsFromLink(link, collectionMap, visited) {
    const url = link.getAbsoluteUrl();
    if (!url || visited.has(url)) return;
    visited.add(url);

    try {
        console.log(`  Fetching collections from: ${url}`);
        const response = await axios.get(url);
        // create() handles CollectionCollection (API Collections response)
        const stacObj = create(response.data);
        
        let collections = [];
        
        if (stacObj && typeof stacObj.getAll === 'function') {
            // Use stac-js to get all collections from the response
            collections = stacObj.getAll();
        } else if (response.data.collections && Array.isArray(response.data.collections)) {
            // Fallback for manual parsing if stac-js didn't detect CollectionCollection
            collections = response.data.collections.map(c => create(c));
        } else if (Array.isArray(response.data)) {
            collections = response.data.map(c => create(c));
        }
        
        console.log(`  Retrieved ${collections.length} collections from ${url}`);

        for (const colStac of collections) {
            if (colStac && typeof colStac.isCollection === 'function' && colStac.isCollection()) {
                const selfUrl = colStac.getAbsoluteUrl() || url; 
                collectionMap.set(selfUrl, colStac.toJSON());
            }
        }
    } catch (error) {
        console.warn(`Failed to fetch collections from ${url}:`, error.message);
    }
}

/**
 * Helper to get self link from a plain JSON object (since we store toJSON results)
 */
function getSelfLink(stacJson) {
    const selfLink = stacJson.links?.find(l => l.rel === 'self');
    return selfLink ? selfLink.href : null;
}

export {
    crawlApis
};
