/**
 * @fileoverview Normalization utilities for STAC catalogs and collections
 * @module utils/normalization
 */

/**
 * Derives categories from a catalog object by checking various possible fields
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

/**
 * Normalizes a catalog object from STAC Index API format
 * @param {Object} catalog - Catalog object from the STAC Index API
 * @param {number} index - Index position in the original array
 * @returns {Object} Normalized catalog object with standard properties
 */
export function normalizeCatalog(catalog, index) {
    return {
        index,
        id: catalog.slug || catalog.id?.toString() || `catalog-${index}`, // Use slug as STAC id (string), fallback to numeric id as string
        url: catalog.url,
        slug: catalog.slug,
        title: catalog.title,
        summary: catalog.summary,
        description: catalog.summary, // Map summary to description for database
        stac_version: catalog.stac_version || null, // Include stac_version if available
        access: catalog.access,
        created: catalog.created,
        updated: catalog.updated,
        isPrivate: catalog.isPrivate,
        isApi: catalog.isApi,
        accessInfo: catalog.accessInfo,
        categories: deriveCategories(catalog),
        keywords: deriveCategories(catalog), // Map categories to keywords for database
        type: 'Catalog', // Explicitly set type
        links: catalog.url ? [{ rel: 'self', href: catalog.url }] : [], // Create links array for db.js
        // Preserve any additional dynamic properties
        ...Object.fromEntries(
            Object.entries(catalog).filter(([key]) => 
                !['id', 'url', 'slug', 'title', 'summary', 'access', 'created', 
                  'updated', 'isPrivate', 'isApi', 'accessInfo', 'stac_version'].includes(key)
            )
        )
    };
}

/**
 * Normalizes a collection object using stac-js methods for metadata extraction
 * Preserves all fields needed for database insertion including summaries, extensions, etc.
 * @param {Object} colObj - Collection object (stac-js or plain object)
 * @param {number} index - Index position
 * @returns {Object} Normalized collection object with all fields for db.js
 */
export function normalizeCollection(colObj, index) {
    // Get raw data from stac-js object if available
    // stac-js stores the original data in toJSON() or we can access it directly
    const rawData = typeof colObj.toJSON === 'function' ? colObj.toJSON() : colObj;
    
    // Determine the STAC type using stac-js methods if available
    // This is more reliable than trusting the type field in the JSON
    let stacType = null;
    if (typeof colObj.isCollection === 'function' && colObj.isCollection()) {
        stacType = 'Collection';
    } else if (typeof colObj.isCatalog === 'function' && colObj.isCatalog()) {
        stacType = 'Catalog';
    } else {
        // Fallback to the type field in the data, or default to 'Collection'
        stacType = colObj.type || rawData?.type || 'Collection';
    }
    
    // Extract bbox: try stac-js method first, then fallback to raw data
    let bbox = null;
    if (typeof colObj.getBoundingBox === 'function') {
        bbox = colObj.getBoundingBox();
    }
    // Fallback to raw data if stac-js method returned null/undefined
    if (!bbox && rawData?.extent?.spatial?.bbox?.[0]) {
        bbox = rawData.extent.spatial.bbox[0];
    }
    // Final fallback: direct access on colObj
    if (!bbox && colObj?.extent?.spatial?.bbox?.[0]) {
        bbox = colObj.extent.spatial.bbox[0];
    }
    
    // Extract temporal: try stac-js method first, then fallback to raw data
    let temporal = null;
    if (typeof colObj.getTemporalExtent === 'function') {
        temporal = colObj.getTemporalExtent();
    }
    // Fallback to raw data if stac-js method returned null/undefined
    if (!temporal && rawData?.extent?.temporal?.interval?.[0]) {
        temporal = rawData.extent.temporal.interval[0];
    }
    // Final fallback: direct access on colObj
    if (!temporal && colObj?.extent?.temporal?.interval?.[0]) {
        temporal = colObj.extent.temporal.interval[0];
    }
    
    // Get self URL using stac-js link navigation
    let selfUrl = null;
    if (typeof colObj.getAbsoluteUrl === 'function') {
        selfUrl = colObj.getAbsoluteUrl();
    } else if (colObj.links) {
        const selfLink = colObj.links.find(l => l.rel === 'self');
        selfUrl = selfLink?.href || null;
    }
    // Fallback to raw data for URL
    if (!selfUrl && rawData?.links) {
        const selfLink = rawData.links.find(l => l.rel === 'self');
        selfUrl = selfLink?.href || null;
    }
    
    // Extract links array (needed for source_url extraction in db.js)
    let links = null;
    if (Array.isArray(colObj.links)) {
        // Convert stac-js link objects to plain objects if needed
        links = colObj.links.map(l => ({
            rel: l.rel,
            href: l.href,
            type: l.type,
            title: l.title
        }));
    } else if (Array.isArray(rawData?.links)) {
        links = rawData.links;
    }
    
    // Determine the type using isCatalog/isCollection methods if available
    let type = colObj.type || rawData?.type || null;
    if (!type) {
        // Use stac-js methods to determine type
        if (typeof colObj.isCatalog === 'function' && colObj.isCatalog()) {
            type = 'Catalog';
        } else if (typeof colObj.isCollection === 'function' && colObj.isCollection()) {
            type = 'Collection';
        }
    }
    
    return {
        index,
        id: colObj.id || rawData?.id || 'Unknown',
        url: selfUrl,
        title: colObj.title || rawData?.title || null,
        description: colObj.description || colObj.summary || rawData?.description || rawData?.summary || null,
        bbox,
        temporal,
        license: colObj.license || rawData?.license || null,
        keywords: colObj.keywords || rawData?.keywords || [],
        
        // Additional fields needed for db.js - pass through from raw data
        links,
        stac_version: colObj.stac_version || rawData?.stac_version || null,
        type: stacType,
        summaries: colObj.summaries || rawData?.summaries || null,
        stac_extensions: colObj.stac_extensions || rawData?.stac_extensions || [],
        providers: colObj.providers || rawData?.providers || [],
        assets: colObj.assets || rawData?.assets || null,
        
        // Preserve the original STAC JSON for full_json storage in database
        // This ensures nothing is lost during normalization
        originalJson: rawData
    };
}

/**
 * Processes an array of catalogs from the STAC Index API
 * @param {Array<Object>} catalogs - Array of catalog objects from the STAC Index API
 * @returns {Array<Object>} Array of normalized catalog objects
 * @throws {Error} Throws error if input is not an array
 */
export function processCatalogs(catalogs) {
    if (!Array.isArray(catalogs)) {
        throw new Error('Expected an array');
    }

    const normalized = catalogs.map((catalog, index) => normalizeCatalog(catalog, index));

    console.log(`Total: ${normalized.length} catalogs found\n`);
    
    if (normalized.length > 0) {
        console.log('Example - First Catalog:');
        const first = normalized[0];
        console.log(`  ID: ${first.id}`);
        console.log(`  URL: ${first.url}`);
        console.log(`  Title: ${first.title}`);
        console.log(`  Is API: ${first.isApi}`);
        console.log(`  Categories: ${JSON.stringify(first.categories)}`);
    }

    return normalized;
}
