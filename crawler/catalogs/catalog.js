/**
 * @fileoverview Catalog crawling functionality for STAC Index
 * @module catalogs/catalog
 */

import axios from 'axios';
import create from 'stac-js';

/**
 * Checks if a catalog is STAC API compliant by validating conformance classes
 * @async
 * @param {string} catalogUrl - The base URL of the catalog
 * @returns {Promise<Object>} Object with isStacApi flag and conformance classes
 */
async function checkStacApiCompliance(catalogUrl) {
    const result = {
        isStacApi: false,
        conformsTo: [],
        features: []
    };

    try {
        // Try to fetch conformance declaration
        const conformanceUrls = [
            `${catalogUrl}/conformance`,
            `${catalogUrl}/api/conformance`,
            catalogUrl // Root might have conformsTo property
        ];

        for (const url of conformanceUrls) {
            try {
                const response = await axios.get(url, { timeout: 5000 });
                
                // Check for conformsTo array (STAC API spec)
                if (response.data.conformsTo && Array.isArray(response.data.conformsTo)) {
                    result.conformsTo = response.data.conformsTo;
                    
                    // Check for STAC API specific conformance classes
                    const stacApiClasses = [
                        'https://api.stacspec.org/v1.0.0/core',
                        'http://www.opengis.net/spec/ogcapi-features-1/1.0/conf/core',
                        'https://api.stacspec.org/v1.0.0-rc.1/core'
                    ];
                    
                    result.isStacApi = result.conformsTo.some(conformance => 
                        stacApiClasses.some(stacClass => conformance.includes('stacspec.org') || conformance.includes('ogcapi-features'))
                    );
                    
                    // Identify supported features
                    if (result.conformsTo.some(c => c.includes('item-search') || c.includes('/search'))) {
                        result.features.push('search');
                    }
                    if (result.conformsTo.some(c => c.includes('filter'))) {
                        result.features.push('filter');
                    }
                    if (result.conformsTo.some(c => c.includes('query'))) {
                        result.features.push('query');
                    }
                    if (result.conformsTo.some(c => c.includes('sort'))) {
                        result.features.push('sort');
                    }
                    if (result.conformsTo.some(c => c.includes('fields'))) {
                        result.features.push('fields');
                    }
                    
                    if (result.isStacApi) {
                        break; // Found valid STAC API conformance
                    }
                }
            } catch (e) {
                // Try next URL
                continue;
            }
        }
        
        // Fallback: Check for /search endpoint existence (practical test)
        if (!result.isStacApi) {
            try {
                const searchResponse = await axios.get(`${catalogUrl}/search`, { 
                    timeout: 3000,
                    params: { limit: 1 },
                    validateStatus: (status) => status < 500 // Accept 4xx as "endpoint exists"
                });
                
                // If search endpoint exists and returns expected structure
                if (searchResponse.status === 200 && 
                    (searchResponse.data.type === 'FeatureCollection' || 
                     searchResponse.data.features)) {
                    result.isStacApi = true;
                    result.features.push('search');
                }
            } catch (e) {
                // Search endpoint doesn't exist - likely static catalog
            }
        }
        
    } catch (error) {
        // STAC API validation failed - catalog is likely static-only
    }
    
    return result;
}

/**
 * Splits an array of catalogs into individual elements where each element is an array of its properties
 * @param {Array<Object>} catalogs - Array of catalog objects from the STAC Index API
 * @returns {Array<Array>} Array of arrays, where each inner array contains:
 *   [0] = index, [1] = id, [2] = url, [3] = slug, [4] = title, [5] = summary, 
 *   [6] = access, [7] = created, [8] = updated, [9] = isPrivate, [10] = isApi, 
 *   [11] = accessInfo, [12] = categories, ... (followed by any other dynamic properties)
 * @throws {Error} Throws error if input is not an array
 */
function splitCatalogs(catalogs) {
    if (!Array.isArray(catalogs)) {
        throw new Error('Expected an array');
    }

    // Define the order of standard properties
    const standardPropertyOrder = [
        'index', 'id', 'url', 'slug', 'title', 'summary', 
        'access', 'created', 'updated', 'isPrivate', 'isApi', 'accessInfo'
    ];

    // Split each element individually and convert to array format
    const elements = catalogs.map((catalog, index) => {
        
        // Create object with all properties
        let elementObj = {
            index: index,
            ...catalog,
        };

        // Validate and migrate STAC catalog using stac-js if it has STAC properties
        if (catalog.url && typeof catalog.url === 'string') {
            try {
                // For STAC Index catalogs, we don't validate against STAC spec
                // as they are metadata about STAC catalogs, not STAC objects themselves
                // This is just for potential future enhancement
            } catch (error) {
                console.warn(`STAC validation skipped for catalog ${catalog.id}: ${error.message}`);
            }
        }

        // Get all property names
        const allProperties = Object.keys(elementObj);
        
        // Separate standard and dynamic properties
        const standardProps = standardPropertyOrder.filter(prop => prop in elementObj);
        const dynamicProps = allProperties.filter(prop => !standardPropertyOrder.includes(prop));
        
        // Create array with standard properties first, then dynamic ones
        const elementArray = [];
        
        // Add standard properties in defined order
        standardProps.forEach(prop => {
            elementArray.push(elementObj[prop]);
        });
        
        // Add dynamic properties
        dynamicProps.forEach(prop => {
            elementArray.push(elementObj[prop]);
        });
        return elementArray;
    });

    // Output for demonstration
    console.log(`Total: ${elements.length} elements found\n`);
    
    if (elements.length > 0) {
        console.log('Example - First Element (as array):');
        console.log('Array indices and values:');
        const firstElement = elements[0];
        const allProps = [
            'index', 'id', 'url', 'slug', 'title', 'summary', 
            'access', 'created', 'updated', 'isPrivate', 'isApi', 'accessInfo'
        ];
        firstElement.forEach((value, idx) => {
            const propName = idx < allProps.length ? allProps[idx] : `dynamic_property_${idx}`;
            console.log(`  [${idx}] ${propName}: ${JSON.stringify(value)}`);
        });
        console.log('\nAccess examples:');
        console.log(`  elements[0][0] (index): ${elements[0][0]}`);
        console.log(`  elements[0][1] (id): ${elements[0][1]}`);
        console.log(`  elements[0][2] (url): ${elements[0][2]}`);
        console.log(`  elements[0][7] (created): ${elements[0][7]}`);
    }

    return elements;
}

/**
 * Fetches and processes collections from a catalog using stac-js
 * @async
 * @param {Object} catalog - Catalog object with url property
 * @returns {Promise<Array>} Array of collections formatted as arrays
 */
async function getCollections(catalog) {
    try {
        // Try common STAC collection endpoints
        const collectionUrls = [
            `${catalog.url}/collections`,
            `${catalog.url}/collections/`,
            `${catalog.url}/api/v1/collections`
        ];

        for (const url of collectionUrls) {
            try {
                const response = await axios.get(url, { timeout: 5000 });
                
                // Parse response with stac-js for validation and enhanced metadata extraction
                let stacObj;
                try {
                    stacObj = create(response.data, url);
                } catch (parseError) {
                    // If stac-js cannot parse, skip this catalog (non-compliant STAC)
                    console.warn(`   Skipping non-compliant STAC at ${url}: ${parseError.message}`);
                    continue;
                }
                
                let collectionsData = [];
                
                // Check if this is a CollectionCollection (STAC API response)
                if (stacObj && typeof stacObj.getAll === 'function') {
                    collectionsData = stacObj.getAll();
                } else if (Array.isArray(response.data)) {
                    // Handle array of collections
                    collectionsData = response.data.map(col => {
                        try {
                            return create(col, url);
                        } catch {
                            return null;
                        }
                    }).filter(Boolean);
                } else if (response.data.collections) {
                    // Handle nested collections property
                    collectionsData = response.data.collections.map(col => {
                        try {
                            return create(col, url);
                        } catch {
                            return null;
                        }
                    }).filter(Boolean);
                }
                
                if (collectionsData.length > 0) {
                    console.log(`\n Catalog: ${catalog.id}`);
                    console.log(`   Found ${collectionsData.length} collections`);
                    
                    // Convert collections using stac-js methods for metadata extraction
                    const collections = collectionsData.map((colObj, index) => {
                        // Use stac-js methods for robust metadata extraction
                        const bbox = typeof colObj.getBoundingBox === 'function' 
                            ? colObj.getBoundingBox() 
                            : (colObj.extent?.spatial?.bbox?.[0] || 'N/A');
                        
                        const temporal = typeof colObj.getTemporalExtent === 'function'
                            ? colObj.getTemporalExtent()
                            : (colObj.extent?.temporal?.interval?.[0] || 'N/A');
                        
                        // Get self URL using stac-js link navigation
                        let selfUrl = 'N/A';
                        if (typeof colObj.getAbsoluteUrl === 'function') {
                            selfUrl = colObj.getAbsoluteUrl();
                        } else if (colObj.links) {
                            const selfLink = colObj.links.find(l => l.rel === 'self');
                            selfUrl = selfLink?.href || 'N/A';
                        }
                        
                        return [
                            index,
                            colObj.id || 'Unknown',
                            selfUrl,
                            colObj.title || 'N/A',
                            colObj.description || colObj.summary || 'N/A',
                            bbox,
                            temporal,
                            colObj.license || 'N/A',
                            colObj.keywords || []
                        ];
                    });

                    // Display collection details
                    if (collections.length > 0) {
                        console.log('   Collection details:');
                        collections.forEach((col, idx) => {
                            console.log(`     [${idx}] ${col[1]} - ${col[3]}`);
                        });
                    }
                    
                    return collections;
                }
            } catch (e) {
                // Try next URL
                continue;
            }
        }
        
        console.log(`\n No collections found for catalog: ${catalog.id}`);
        return [];
        
    } catch (error) {
        console.error(`Error fetching collections for ${catalog.id}: ${error.message}`);
        return [];
    }
}

/**
 * Fetches nested catalogs within a catalog using stac-js link navigation
 * @async
 * @param {Object} catalog - Catalog object with url property
 * @param {Object} [stacCatalog] - Optional stac-js catalog object for link extraction
 * @returns {Promise<Array>} Array of nested catalogs
 */
async function getNestedCatalogs(catalog, stacCatalog = null) {
    try {
        // If we have a stac-js catalog object, use its link navigation methods
        if (stacCatalog && typeof stacCatalog.getChildLinks === 'function') {
            const childLinks = stacCatalog.getChildLinks();
            
            if (childLinks.length > 0) {
                console.log(`   Found ${childLinks.length} child catalog links via stac-js`);
                
                // Fetch each child catalog
                const nestedCatalogs = [];
                for (const link of childLinks) {
                    try {
                        const childUrl = typeof link.getAbsoluteUrl === 'function'
                            ? link.getAbsoluteUrl()
                            : link.href;
                        
                        const response = await axios.get(childUrl, { timeout: 5000 });
                        nestedCatalogs.push(response.data);
                    } catch (e) {
                        console.warn(`   Failed to fetch child catalog: ${e.message}`);
                    }
                }
                
                return nestedCatalogs;
            }
        }
        
        // Fallback: Try common STAC nested catalog endpoints
        const catalogUrls = [
            `${catalog.url}/catalogs`,
            `${catalog.url}/catalogs/`,
            `${catalog.url}/api/v1/catalogs`
        ];

        for (const url of catalogUrls) {
            try {
                const response = await axios.get(url, { timeout: 5000 });
                const catalogsData = Array.isArray(response.data) 
                    ? response.data 
                    : response.data.catalogs || [];
                
                if (catalogsData.length > 0) {
                    return catalogsData;
                }
            } catch (e) {
                // Try next URL
                continue;
            }
        }
        
        return [];
        
    } catch (error) {
        console.error(`Error fetching nested catalogs for ${catalog.id}: ${error.message}`);
        return [];
    }
}

/**
 * Recursively crawls a catalog using stac-js for parsing and navigation
 * @async
 * @param {Object} catalog - Catalog object to crawl
 * @param {number} depth - Current depth level (for indentation)
 * @returns {Promise<Object>} Stats object with collections count, STAC compliance, and API capabilities
 */
async function crawlCatalogRecursive(catalog, depth = 0) {
    const indent = '  '.repeat(depth);
    let stats = { 
        collections: 0, 
        stacCompliant: false,
        stacApiCompliant: false,
        apiFeatures: [],
        conformsTo: []
    };
    
    try {
        let stacCatalog = null;
        
        // Try to fetch and parse the catalog with stac-js
        if (catalog.url) {
            try {
                const response = await axios.get(catalog.url, { timeout: 5000 });
                
                try {
                    stacCatalog = create(response.data, catalog.url);
                    stats.stacCompliant = true;
                    
                    // Log STAC object type
                    if (typeof stacCatalog.isCatalog === 'function' && stacCatalog.isCatalog()) {
                        console.log(`${indent} STAC Catalog validated: ${catalog.id}`);
                    } else if (typeof stacCatalog.isCollection === 'function' && stacCatalog.isCollection()) {
                        console.log(`${indent} STAC Collection validated: ${catalog.id}`);
                    }
                    
                    // Check STAC API compliance
                    const apiCompliance = await checkStacApiCompliance(catalog.url);
                    stats.stacApiCompliant = apiCompliance.isStacApi;
                    stats.apiFeatures = apiCompliance.features;
                    stats.conformsTo = apiCompliance.conformsTo;
                    
                    if (apiCompliance.isStacApi) {
                        console.log(`${indent} STAC API compliant - Features: [${apiCompliance.features.join(', ')}]`);
                    }
                    
                } catch (parseError) {
                    console.warn(`${indent} Non-compliant STAC catalog ${catalog.id}, skipping: ${parseError.message}`);
                    return stats; // Skip non-compliant catalogs as per requirement
                }
            } catch (fetchError) {
                console.warn(`${indent} Failed to fetch catalog ${catalog.id}: ${fetchError.message}`);
                return stats;
            }
        }
        
        // First, try to get collections from this catalog
        const collections = await getCollections(catalog);
        stats.collections = collections.length;
        
        // Then, try to get nested catalogs using stac-js if available
        const nestedCatalogs = await getNestedCatalogs(catalog, stacCatalog);
        
        if (nestedCatalogs.length > 0) {
            console.log(`${indent} Nested catalogs found: ${nestedCatalogs.length}`);
            
            // Recursively crawl each nested catalog
            for (const nestedCatalog of nestedCatalogs.slice(0, 5)) { // Limit to first 5 nested
                // Convert nested catalog to expected format
                const nestedCatalogObj = {
                    id: nestedCatalog.id || 'unknown',
                    url: nestedCatalog.links?.find(l => l.rel === 'self')?.href || nestedCatalog.url
                };
                
                const nestedStats = await crawlCatalogRecursive(nestedCatalogObj, depth + 1);
                stats.collections += nestedStats.collections;
            }
        }
        
    } catch (error) {
        console.error(`${indent}Error in recursive crawl for ${catalog.id}: ${error.message}`);
    }
    
    return stats;
}

/**
 * Derives categories from a catalog object by checking various possible fields
 * @param {Object} catalog - Catalog object to extract categories from
 * @returns {Array<string>} Array of category strings, empty array if none found
 */
function deriveCategories(catalog) {
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

export {
    splitCatalogs,
    getCollections,
    getNestedCatalogs,
    crawlCatalogRecursive,
    deriveCategories,
    checkStacApiCompliance
};