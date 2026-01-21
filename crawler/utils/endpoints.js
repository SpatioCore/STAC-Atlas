/**
 * @fileoverview Endpoint utilities for STAC collections
 * @module utils/endpoints
 */

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
 */
export async function tryCollectionEndpoints(stacCatalog, baseUrl, catalogId, depth, crawler, log, indent) {
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
        
        // In STAC API, /collections is at the API root, not under catalog paths
        // Remove catalog-specific path segments (like /catalog) to get to API root
        const apiRoot = urlParts.slice(0, 3).join('/'); // protocol://domain:port
        const pathSegments = urlParts.slice(3);
        
        // Try to find API root by removing common catalog path patterns
        let rootPath = '';
        if (pathSegments.length > 0) {
            // If there's a path like /api/catalog or /v1/catalog, use /api or /v1 as root
            const catalogIndex = pathSegments.findIndex(seg => 
                seg === 'catalog' || seg === 'catalogs' || seg.endsWith('.json')
            );
            if (catalogIndex > 0) {
                rootPath = '/' + pathSegments.slice(0, catalogIndex).join('/');
            } else {
                rootPath = '/' + pathSegments.join('/');
            }
        }
        
        collectionUrl = `${apiRoot}${rootPath}/collections`;
        log.debug(`${indent}No collection link found, using fallback: ${collectionUrl}`);
    }

    // Enqueue single collection request
    await crawler.addRequests([{
        url: collectionUrl,
        label: 'COLLECTIONS',
        userData: {
            catalogUrl: baseUrl,
            catalogId,
            depth
        }
    }]);
}
