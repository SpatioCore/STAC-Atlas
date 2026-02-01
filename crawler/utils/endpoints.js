/**
 * @fileoverview Endpoint utilities for STAC collections
 * @module utils/endpoints
 */

import db from './db.js';

/**
 * Finds the collection endpoint from STAC catalog links
 * STAC catalogs should advertise their collection endpoint via rel="data" or rel="collections"
 * Falls back to a single /collections endpoint if no link is found
 * @async
 * @param {Object} stacCatalog - Parsed STAC catalog object from stac-js
 * @param {string} baseUrl - Base catalog URL
 * @param {string} catalogId - Catalog ID for logging
 * @param {number} depth - Current depth
 * @param {Object} crawler - Crawlee crawler instance
 * @param {Object} log - Logger
 * @param {string} indent - Indentation for logging
 * @param {string} catalogSlug - Slug of the source catalog for unique ID generation
 * @param {number} crawllogCatalogId - ID from crawllog_catalog for linking collections
 */
export async function tryCollectionEndpoints(stacCatalog, baseUrl, catalogId, depth, crawler, log, indent, catalogSlug = null, crawllogCatalogId = null) {
    let collectionUrl = null;

    // Try to find collection endpoint from STAC links (proper STAC discovery)
    if (stacCatalog && typeof stacCatalog.getLinks === 'function') {
        const links = stacCatalog.getLinks();
        
        // Look for rel="data" (STAC API) or rel="collections" link
        const collectionLink = links.find(link => 
            link.rel === 'data' || link.rel === 'collections'
        );

        if (collectionLink) {
            try {
                collectionUrl = typeof collectionLink.getAbsoluteUrl === 'function'
                    ? collectionLink.getAbsoluteUrl()
                    : collectionLink.href;
                
                // Handle S3 protocol URLs - convert to HTTPS
                if (collectionUrl && collectionUrl.startsWith('s3://')) {
                    const s3Match = collectionUrl.match(/^s3:\/\/([^/]+)\/(.*)$/);
                    if (s3Match) {
                        const [, bucket, path] = s3Match;
                        collectionUrl = `https://${bucket}.s3.amazonaws.com/${path}`;
                        log.debug(`${indent}Converted S3 URL: ${collectionLink.href} -> ${collectionUrl}`);
                    }
                }
                
                // Handle relative URLs
                if (collectionUrl && !collectionUrl.startsWith('http')) {
                    const basePath = baseUrl.substring(0, baseUrl.lastIndexOf('/'));
                    collectionUrl = `${basePath}/${collectionUrl}`;
                }
                
                log.info(`${indent}Found collection endpoint via STAC link (rel="${collectionLink.rel}"): ${collectionUrl}`);
            } catch (err) {
                log.warning(`${indent}Error resolving collection link: ${err.message}`);
            }
        }
    }

    // Fallback: if no link found, try the standard /collections endpoint
    if (!collectionUrl) {
        // Remove trailing filename (like catalog.json) from base URL
        const urlParts = baseUrl.split('/');
        const lastPart = urlParts[urlParts.length - 1];
        
        if (lastPart.includes('.json') || lastPart.includes('.')) {
            urlParts.pop();
        }
        
        collectionUrl = urlParts.join('/') + '/collections';
        log.debug(`${indent}No collection link found, using fallback: ${collectionUrl}`);
    }

    // Persist collection endpoint in DB queue
    try {
        await db.enqueueCollectionUrl({
            sourceUrl: collectionUrl,
            crawllogCatalogId
        });
    } catch (err) {
        log.warning(`${indent}Failed to enqueue collections endpoint: ${err.message}`);
    }

    // Enqueue single collection request
    await crawler.addRequests([{
        url: collectionUrl,
        label: 'COLLECTIONS',
        userData: {
            catalogUrl: baseUrl,
            catalogId,
            catalogSlug,
            crawllogCatalogId,
            depth
        }
    }]);
}
