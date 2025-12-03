/**
 * @fileoverview Request handlers for catalog and collection crawling
 * @module utils/handlers
 */

import create from 'stac-js';
import { normalizeCollection } from './normalization.js';
import { tryCollectionEndpoints } from './endpoints.js';

/**
 * Handles catalog requests - validates STAC, extracts child catalogs and collections
 * @async
 * @param {Object} context - Request handler context
 * @param {Object} context.request - Crawlee request object
 * @param {Object} context.json - Parsed JSON response
 * @param {Object} context.crawler - Crawlee crawler instance
 * @param {Object} context.log - Logger instance
 * @param {string} context.indent - Indentation for logging
 * @param {Object} context.results - Results object to store data
 */
export async function handleCatalog({ request, json, crawler, log, indent, results }) {
    const depth = request.userData?.depth || 0;
    const catalogId = request.userData?.catalogId || 'unknown';
    
    log.info(`${indent}Processing catalog: ${catalogId} (depth: ${depth})`);
    
    // Validate with stac-js
    let stacCatalog;
    try {
        stacCatalog = create(json, request.url);
        results.stats.stacCompliant++;
        
        // Log STAC object type
        if (typeof stacCatalog.isCatalog === 'function' && stacCatalog.isCatalog()) {
            log.info(`${indent}STAC Catalog validated: ${catalogId}`);
        } else if (typeof stacCatalog.isCollection === 'function' && stacCatalog.isCollection()) {
            log.info(`${indent}STAC Collection validated: ${catalogId}`);
        }
    } catch (parseError) {
        log.warning(`${indent}Non-compliant STAC catalog ${catalogId} at ${request.url}`);
        log.warning(`${indent}Error details: ${parseError.message}`);
        log.debug(`${indent}Response preview: ${JSON.stringify(json).substring(0, 200)}...`);
        throw new Error(`STAC validation failed: ${parseError.message}`);
    }
    
    results.stats.catalogsProcessed++;
    results.catalogs.push({
        id: catalogId,
        url: request.url,
        depth,
        stacType: stacCatalog.isCatalog() ? 'catalog' : 'collection'
    });
    
    // If this is a STAC Collection (not a catalog), extract and store it
    if (typeof stacCatalog.isCollection === 'function' && stacCatalog.isCollection()) {
        const collection = normalizeCollection(stacCatalog, results.collections.length);
        results.collections.push(collection);
        results.stats.collectionsFound++;
        log.info(`${indent}Extracted collection: ${collection.id} - ${collection.title}`);
    }
    
    // Try to get collections from this catalog
    await tryCollectionEndpoints(request.url, catalogId, depth, crawler, log, indent);
    
    // Extract and enqueue child catalog links using stac-js
    if (stacCatalog && typeof stacCatalog.getChildLinks === 'function') {
        const childLinks = stacCatalog.getChildLinks();
        
        if (childLinks.length > 0) {
            log.info(`${indent}Found ${childLinks.length} child catalog links`);
            
            // Log first child link structure for debugging
            if (childLinks[0]) {
                log.debug(`${indent}Sample child link structure:`, {
                    hasGetAbsoluteUrl: typeof childLinks[0].getAbsoluteUrl === 'function',
                    href: childLinks[0].href,
                    title: childLinks[0].title,
                    rel: childLinks[0].rel
                });
            }
            
            const childRequests = childLinks
                .map((link, idx) => {
                    let childUrl;
                    try {
                        childUrl = typeof link.getAbsoluteUrl === 'function'
                            ? link.getAbsoluteUrl()
                            : link.href;
                    } catch (err) {
                        log.warning(`${indent}Error getting URL for link ${idx}: ${err.message}`);
                        return null;
                    }
                    
                    // If URL is relative, make it absolute using the catalog URL
                    if (childUrl && typeof childUrl === 'string' && !childUrl.startsWith('http')) {
                        const baseUrl = request.url.endsWith('/') ? request.url.slice(0, -1) : request.url;
                        const basePath = baseUrl.substring(0, baseUrl.lastIndexOf('/'));
                        childUrl = `${basePath}/${childUrl}`;
                    }
                    
                    // Validate URL is a string and looks like a URL
                    if (!childUrl || typeof childUrl !== 'string' || !childUrl.startsWith('http')) {
                        log.warning(`${indent}Skipping invalid URL at index ${idx}: ${childUrl}`);
                        return null;
                    }
                    
                    // Get title as string
                    const linkTitle = typeof link.title === 'string' && link.title.length > 0 
                        ? link.title 
                        : `child-${idx}`;
                    
                    return {
                        url: childUrl,
                        label: 'CATALOG',
                        userData: {
                            depth: depth + 1,
                            catalogId: linkTitle,
                            parentId: catalogId
                        }
                    };
                })
                .filter(Boolean); // Remove null entries
            
            log.info(`${indent}Valid child requests: ${childRequests.length}/${childLinks.length}`);
            
            if (childRequests.length > 0) {
                try {
                    await crawler.addRequests(childRequests);
                    log.info(`${indent}Successfully enqueued ${childRequests.length} child catalogs`);
                } catch (error) {
                    log.error(`${indent}Failed to add child requests: ${error.message}`);
                    // Log the actual requests that failed
                    childRequests.forEach((req, idx) => {
                        log.error(`${indent}  [${idx}] url="${req.url}" label="${req.label}" userData=${JSON.stringify(req.userData)}`);
                    });
                    throw error;
                }
            }
        }
    }
}

/**
 * Handles collection endpoint requests
 * @async
 * @param {Object} context - Request handler context
 * @param {Object} context.request - Crawlee request object
 * @param {Object} context.json - Parsed JSON response
 * @param {Object} context.crawler - Crawlee crawler instance
 * @param {Object} context.log - Logger instance
 * @param {string} context.indent - Indentation for logging
 * @param {Object} context.results - Results object to store data
 */
export async function handleCollections({ request, json, crawler, log, indent, results }) {
    const catalogId = request.userData?.catalogId || 'unknown';
    
    // Parse response with stac-js
    let stacObj;
    try {
        stacObj = create(json, request.url);
    } catch (parseError) {
        log.warning(`${indent}Skipping non-compliant STAC collections at ${request.url}`);
        return;
    }
    
    let collectionsData = [];
    
    // Check if this is a CollectionCollection (STAC API response)
    if (stacObj && typeof stacObj.getAll === 'function') {
        collectionsData = stacObj.getAll();
    } else if (Array.isArray(json)) {
        // Handle array of collections
        collectionsData = json.map(col => {
            try {
                return create(col, request.url);
            } catch {
                return null;
            }
        }).filter(Boolean);
    } else if (json.collections) {
        // Handle nested collections property
        collectionsData = json.collections.map(col => {
            try {
                return create(col, request.url);
            } catch {
                return null;
            }
        }).filter(Boolean);
    }
    
    if (collectionsData.length > 0) {
        log.info(`${indent}Found ${collectionsData.length} collections for catalog ${catalogId}`);
        
        // Normalize and store collections
        const collections = collectionsData.map((colObj, index) => 
            normalizeCollection(colObj, index)
        );
        
        results.collections.push(...collections);
        results.stats.collectionsFound += collections.length;
        
        // Display sample
        if (collections.length > 0) {
            log.info(`${indent}   Sample: ${collections[0].id} - ${collections[0].title}`);
        }
    }
}
