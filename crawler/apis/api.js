/**
 * @fileoverview API crawling functionality for STAC Index
 * @module apis/api
 */

import create from 'stac-js';
import * as db from '../db.js';

/**
 * Processes a collections list endpoint (e.g. /collections)
 * 
 * @param {Object} context - The crawlee request context
 * @param {Object} context.request - The request object
 * @param {string} context.body - The response body
 * @param {Object} context.log - Logger instance
 * @param {Object} context.crawler - The crawler instance
 * @param {Object} context.config - Configuration object
 */
export async function processCollectionList({ request, body, log, crawler, config }) {
    const { url, userData } = request;
    const { depth = 0 } = userData;

    try {
        let data;
        try {
            data = JSON.parse(body);
        } catch (e) {
             log.error(`Failed to parse JSON body at ${url}: ${e.message}`);
             return;
        }

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
                
                let colUrl;
                try {
                    // Try to find self link
                    const selfLink = colData.links?.find(l => l.rel === 'self');
                    colUrl = selfLink ? selfLink.href : null;
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
                    // Enhanced error logging for saving collections from list
                     log.error(`Error saving collection from list: ${err.message}\nStack: ${err.stack}`);
                }
        }

    } catch (error) {
        log.error(`Error processing collections list ${url}: ${error.message}\nStack: ${error.stack}`);
    }
}

/**
 * Tries to find a collections URL for a STAC Catalog/API
 * 
 * @param {Object} stacObj - The parsed STAC object (Catalog/API)
 * @param {string} url - The URL of the STAC object
 * @param {boolean} isApi - Whether the object is known to be an API
 * @returns {string|null} The absolute URL to the collections endpoint or null
 */
export function findCollectionsUrl(stacObj, url, isApi) {
    // Try standard links
    const collectionsLink = stacObj.getLinkWithRel('data') || stacObj.getLinkWithRel('collections');
    
    if (collectionsLink) {
        return collectionsLink.getAbsoluteUrl();
    } else {
        // Heuristic: append /collections if not found
        // Only if it looks like an API (root catalog often is)
        // checks if isApi is true from userData or if it looks like API
        if (isApi) {
                // Try common endpoint
                if (!url.endsWith('/collections')) {
                    return url.endsWith('/') ? `${url}collections` : `${url}/collections`;
                }
        }
    }
    return null;
}
