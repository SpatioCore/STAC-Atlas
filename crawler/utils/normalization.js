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
        id: catalog.id,
        url: catalog.url,
        slug: catalog.slug,
        title: catalog.title,
        summary: catalog.summary,
        access: catalog.access,
        created: catalog.created,
        updated: catalog.updated,
        isPrivate: catalog.isPrivate,
        isApi: catalog.isApi,
        accessInfo: catalog.accessInfo,
        categories: deriveCategories(catalog),
        // Preserve any additional dynamic properties
        ...Object.fromEntries(
            Object.entries(catalog).filter(([key]) => 
                !['id', 'url', 'slug', 'title', 'summary', 'access', 'created', 
                  'updated', 'isPrivate', 'isApi', 'accessInfo'].includes(key)
            )
        )
    };
}

/**
 * Normalizes a collection object using stac-js methods for metadata extraction
 * @param {Object} colObj - Collection object (stac-js or plain object)
 * @param {number} index - Index position
 * @returns {Object} Normalized collection object
 */
export function normalizeCollection(colObj, index) {
    // Use stac-js methods for robust metadata extraction
    const bbox = typeof colObj.getBoundingBox === 'function' 
        ? colObj.getBoundingBox() 
        : (colObj.extent?.spatial?.bbox?.[0] || null);
    
    const temporal = typeof colObj.getTemporalExtent === 'function'
        ? colObj.getTemporalExtent()
        : (colObj.extent?.temporal?.interval?.[0] || null);
    
    // Get self URL using stac-js link navigation
    let selfUrl = null;
    if (typeof colObj.getAbsoluteUrl === 'function') {
        selfUrl = colObj.getAbsoluteUrl();
    } else if (colObj.links) {
        const selfLink = colObj.links.find(l => l.rel === 'self');
        selfUrl = selfLink?.href || null;
    }
    
    return {
        index,
        id: colObj.id || 'Unknown',
        url: selfUrl,
        title: colObj.title || null,
        description: colObj.description || colObj.summary || null,
        bbox,
        temporal,
        license: colObj.license || null,
        keywords: colObj.keywords || []
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
