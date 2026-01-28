/**
 * @fileoverview Request handlers for catalog and collection crawling
 * @module utils/handlers
 */

import create from 'stac-js';
import validate from 'stac-node-validator';
import { normalizeCollection } from './normalization.js';
import { tryCollectionEndpoints } from './endpoints.js';
import db from './db.js';

/**
 * Batch size for saving collections to database
 * After this many collections are collected, they will be flushed to DB
 * Set low (25) for servers with limited RAM (2GB)
 * @type {number}
 */
const BATCH_SIZE = 25;

/**
 * Validates STAC structure using stac-node-validator before attempting migration
 * @async
 * @param {Object} json - JSON object to validate
 * @param {Object} log - Logger instance
 * @param {string} indent - Indentation for logging
 * @returns {Promise<Object>} Validation result with valid flag, errors, and warnings
 */
async function validateStacStructure(json, log, indent = '') {
    if (!json || typeof json !== 'object') {
        return { 
            valid: false, 
            error: 'Invalid JSON: null or not an object',
            errors: ['Invalid JSON structure']
        };
    }
    
    try {
        // Use stac-node-validator for full STAC spec validation
        const result = await validate(json);
        
        if (result.valid) {
            log.debug(`${indent}STAC validation passed (version: ${result.version}, type: ${result.type})`);
            return { valid: true, version: result.version, type: result.type };
        } else {
            // Collect all validation errors
            const errors = [];
            
            // Core schema errors
            if (result.results.core && result.results.core.length > 0) {
                errors.push(...result.results.core.map(err => 
                    `${err.instancePath || 'root'}: ${err.message}`
                ));
            }
            
            // Extension errors
            if (result.results.extensions) {
                Object.entries(result.results.extensions).forEach(([ext, extErrors]) => {
                    if (extErrors.length > 0) {
                        errors.push(...extErrors.map(err => 
                            `[${ext}] ${err.instancePath || 'root'}: ${err.message}`
                        ));
                    }
                });
            }
            
            // Custom validation errors
            if (result.results.custom && result.results.custom.length > 0) {
                errors.push(...result.results.custom.map(err => err.message || String(err)));
            }
            
            return {
                valid: false,
                error: `STAC validation failed with ${errors.length} error(s)`,
                errors: errors.slice(0, 5), // Limit to first 5 errors for logging
                totalErrors: errors.length
            };
        }
    } catch (validationError) {
        // If validator itself fails, return error
        return {
            valid: false,
            error: `Validator error: ${validationError.message}`,
            errors: [validationError.message]
        };
    }
}

/**
 * Batch size for clearing catalogs array to free memory
 * The catalogs array is only used for statistics, so we clear it periodically
 * Set low (25) for servers with limited RAM (2GB)
 * @type {number}
 */
const CATALOG_CLEAR_BATCH_SIZE = 25;

/**
 * Flushes collected collections to the database and clears the array
 * @async
 * @param {Object} results - Results object containing collections array
 * @param {Object} log - Logger instance
 * @param {boolean} force - If true, flush even if below batch size (used at end of crawl)
 * @returns {Promise<{saved: number, failed: number}>} Count of saved and failed collections
 */
export async function flushCollectionsToDb(results, log, force = false) {
    if (!force && results.collections.length < BATCH_SIZE) {
        return { saved: 0, failed: 0 };
    }
    
    if (results.collections.length === 0) {
        return { saved: 0, failed: 0 };
    }
    
    const collectionsToSave = [...results.collections];
    results.collections.length = 0; // Clear the array to free memory
    
    let saved = 0;
    let failed = 0;
    
    log.info(`[BATCH] Flushing ${collectionsToSave.length} collections to database...`);
    
    for (const collection of collectionsToSave) {
        try {
            await db.insertOrUpdateCollection(collection);
            saved++;
        } catch (err) {
            log.warning(`[BATCH] Failed to save collection ${collection.id}: ${err.message}`);
            failed++;
        }
    }
    
    log.info(`[BATCH] Saved ${saved} collections, ${failed} failed`);
    
    return { saved, failed };
}

/**
 * Checks if batch size is reached and flushes if necessary
 * Also clears the catalogs array periodically to free memory
 * @async
 * @param {Object} results - Results object containing collections array
 * @param {Object} log - Logger instance
 */
async function checkAndFlush(results, log) {
    if (results.collections.length >= BATCH_SIZE) {
        const { saved, failed } = await flushCollectionsToDb(results, log, false);
        results.stats.collectionsSaved += saved;
        results.stats.collectionsFailed += failed;
    }
    
    // Clear catalogs array periodically to free memory
    // The catalogs array is only used for end statistics, which we track in stats object
    // Note: catalogs may not exist when called from API crawler (which uses apis instead)
    if (results.catalogs && results.catalogs.length >= CATALOG_CLEAR_BATCH_SIZE) {
        log.info(`[MEMORY] Clearing ${results.catalogs.length} catalogs from memory`);
        results.catalogs.length = 0;
    }
}

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
 * @param {Object} context.config - Configuration object with maxDepth
 */
export async function handleCatalog({ request, json, crawler, log, indent, results, config = {} }) {
    const depth = request.userData?.depth || 0;
    const catalogId = request.userData?.catalogId || 'unknown';
    const maxDepth = config.maxDepth || 0; // 0 = unlimited
    
    log.info(`${indent}Processing catalog: ${catalogId} (depth: ${depth}${maxDepth > 0 ? `/${maxDepth}` : ''})`);
    
    
    // Validate STAC structure before attempting migration
    const validation = validateStacStructure(json);
    if (!validation.valid) {
        log.warning(`${indent}Pre-validation failed for catalog ${catalogId} at ${request.url}`);
        log.warning(`${indent}Validation error: ${validation.error}`);
        log.debug(`${indent}Response preview: ${JSON.stringify(json).substring(0, 200)}...`);
        results.stats.nonCompliant++;
        throw new Error(`STAC pre-validation failed: ${validation.error}`);
    }
    
    // Migrate and validate with stac-js
    // Note: create(data, migrate, updateVersionNumber) - second param enables migration
    // Migration will upgrade older STAC versions (>= 0.6.0) to latest version (1.1.0)
    let stacCatalog;
    try {
        stacCatalog = create(json, true);
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
    // Only track minimal info to reduce memory - don't store full catalog data
    results.catalogs.push({
        id: catalogId,
        depth
    });
    
    // If this is a STAC Collection (not a catalog), extract and store it
    // Collections don't have /collections endpoints, so we skip tryCollectionEndpoints for them
    const isCollection = typeof stacCatalog.isCollection === 'function' && stacCatalog.isCollection();
    
    if (isCollection) {
        const collection = normalizeCollection(stacCatalog, results.collections.length);
        results.collections.push(collection);
        results.stats.collectionsFound++;
        log.info(`${indent}Extracted collection: ${collection.id} - ${collection.title}`);
        
        // Check if we should flush to database
        await checkAndFlush(results, log);
    } else {
        // Only try /collections endpoint for Catalogs, not Collections
        // Static STAC catalogs don't have /collections endpoints - they use rel="child" links
        // STAC APIs have /collections endpoints and advertise them via rel="data" or rel="collections"
        await tryCollectionEndpoints(stacCatalog, request.url, catalogId, depth, crawler, log, indent);
    }
    
    // Extract and enqueue child catalog links using stac-js
    if (stacCatalog && typeof stacCatalog.getChildLinks === 'function') {
        const childLinks = stacCatalog.getChildLinks();
        
        if (childLinks.length > 0) {
            log.info(`${indent}Found ${childLinks.length} child catalog links`);
            
            // Check maxDepth before enqueueing children
            if (maxDepth > 0 && depth >= maxDepth) {
                log.info(`${indent}Max depth (${maxDepth}) reached, skipping ${childLinks.length} child catalogs`);
                // Clear memory and return early - don't enqueue children
                await checkAndFlush(results, log);
                return;
            }
            
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
                    
                    // Handle S3 protocol URLs - convert to HTTPS
                    if (childUrl && typeof childUrl === 'string' && childUrl.startsWith('s3://')) {
                        // s3://bucket-name/path -> https://bucket-name.s3.amazonaws.com/path
                        const s3Match = childUrl.match(/^s3:\/\/([^/]+)\/(.*)$/);
                        if (s3Match) {
                            const [, bucket, path] = s3Match;
                            childUrl = `https://${bucket}.s3.amazonaws.com/${path}`;
                            log.debug(`${indent}Converted S3 URL: ${link.href} -> ${childUrl}`);
                        } else {
                            log.warning(`${indent}Skipping malformed S3 URL at index ${idx}: ${childUrl}`);
                            return null;
                        }
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
    
    // Ensure memory is cleared periodically even if no collections were found
    await checkAndFlush(results, log);
    
    // Help garbage collector by dereferencing large objects
    stacCatalog = null;
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
    
    // Validate STAC structure before attempting migration using stac-node-validator
    const validation = await validateStacStructure(json, log, indent);
    if (!validation.valid) {
        log.warning(`${indent}STAC validation failed for collections at ${request.url}`);
        log.warning(`${indent}Error: ${validation.error}`);
        if (validation.errors && validation.errors.length > 0) {
            validation.errors.forEach((err, idx) => {
                log.warning(`${indent}  [${idx + 1}] ${err}`);
            });
        }
        results.stats.nonCompliant++;
        return;
    }
    
    // Parse and migrate response with stac-js
    let stacObj;
    try {
        stacObj = create(json, true);
    } catch (parseError) {
        log.warning(`${indent}Migration failed for collections at ${request.url}: ${parseError.message}`);
        results.stats.nonCompliant++;
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
                return create(col, true);
            } catch {
                return null;
            }
        }).filter(Boolean);
    } else if (json.collections) {
        // Handle nested collections property
        collectionsData = json.collections.map(col => {
            try {
                return create(col, true);
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
        
        // Check if we should flush to database
        await checkAndFlush(results, log);
    }
    
    // Help garbage collector by dereferencing large objects
    stacObj = null;
    collectionsData = null;
}