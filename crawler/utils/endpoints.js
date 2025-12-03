/**
 * @fileoverview Endpoint utilities for STAC collections
 * @module utils/endpoints
 */

/**
 * Tries common STAC collection endpoints and enqueues successful ones
 * @async
 * @param {string} baseUrl - Base catalog URL
 * @param {string} catalogId - Catalog ID for logging
 * @param {number} depth - Current depth
 * @param {Object} crawler - Crawlee crawler instance
 * @param {Object} log - Logger
 * @param {string} indent - Indentation for logging
 */
export async function tryCollectionEndpoints(baseUrl, catalogId, depth, crawler, log, indent) {
    const collectionEndpoints = [
        '/collections',
        '/collections/',
        '/api/v1/collections'
    ];

    const requests = collectionEndpoints.map(endpoint => ({
        url: `${baseUrl}${endpoint}`,
        label: 'COLLECTIONS',
        userData: {
            catalogUrl: baseUrl,
            catalogId,
            depth
        },
        // Don't retry failed endpoint attempts - just try the next one
        maxRetries: 0
    }));

    await crawler.addRequests(requests);
}
