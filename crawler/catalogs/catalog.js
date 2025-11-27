/**
 * @fileoverview Catalog crawling functionality for STAC Index
 * @module catalogs/catalog
 */

import create from 'stac-js';
import * as db from '../db.js';
import { findCollectionsUrl } from '../apis/api.js';

/**
 * Processes a generic STAC Entity (Catalog, Collection, API root)
 * 
 * @param {Object} context - The crawlee request context
 * @param {Object} context.request - The request object
 * @param {string} context.body - The response body
 * @param {Object} context.log - Logger instance
 * @param {Object} context.crawler - The crawler instance
 * @param {Object} context.config - Configuration object
 */
export async function processStacEntity({ request, body, log, crawler, config }) {
    const { url, userData } = request;
    const { depth = 0, isApi } = userData;

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
            if (stacObj.isCatalogLike()) {
                const collectionsUrl = findCollectionsUrl(stacObj, url, isApi);
                if (collectionsUrl) {
                    linksToEnqueue.push({
                        url: collectionsUrl,
                        userData: { label: 'COLLECTIONS_LIST', depth: newDepth }
                    });
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
}

/**
 * Derives categories from a catalog object by checking various possible fields
 * (Legacy helper, currently not used in DB persist but kept for reference)
 * @param {Object} catalog - Catalog object to extract categories from
 * @returns {Array<string>} Array of category strings, empty array if none found
 */
export function deriveCategories(catalog) {
    if (!catalog || typeof catalog !== 'object') {
        return [];
    }

    if (Array.isArray(catalog.categories)) {
        return catalog.categories.filter(Boolean).map(String);
    }

    if (Array.isArray(catalog.keywords)) {
        return catalog.keywords.filter(Boolean).map(String);
    }

    if (Array.isArray(catalog.tags)) {
        return catalog.tags.filter(Boolean).map(String);
    }

    if (typeof catalog.access === 'string' && catalog.access.trim().length) {
        return [catalog.access.trim()];
    }

    return [];
}
