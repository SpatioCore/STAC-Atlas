/**
 * @fileoverview STAC Index API crawler that fetches and processes catalog data
 * @module crawler
 */

const axios = require('axios');

/**
 * URL of the STAC Index API endpoint
 * @type {string}
 */
const targetUrl = 'https://www.stacindex.org/api/catalogs';

/**
 * Fetches catalog data from the STAC Index API and processes it
 * @async
 * @function crawler
 * @returns {Promise<void>}
 */
const crawler = async () => {
    try {
        const response = await axios.get(targetUrl);
        const catalogs = splitCatalogs(response.data);
        
        // Crawl collections and nested catalogs for each catalog
        console.log('\n Crawling collections and nested catalogs...\n');
        let totalCollections = 0;
        for (const catalog of response.data.slice(0, 10)) { // Limit to first 10 catalogs
            const stats = await crawlCatalogRecursive(catalog);
            totalCollections += stats.collections;
        }
        
        console.log(`\n Total collections found across all catalogs: ${totalCollections}`);
    } catch (error) {
        console.error(`Error fetching ${targetUrl}: ${error.message}`);
    }
};

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
        const elementObj = {
            index: index,
            ...catalog,  // All properties of the catalog object are automatically inherited
        };

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
    
    // Output first element as example with index mapping (remove later on)

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
 * Fetches and processes collections from a catalog
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
                const collectionsData = Array.isArray(response.data) 
                    ? response.data 
                    : response.data.collections || [];
                
                if (collectionsData.length > 0) {
                    console.log(`\n Catalog: ${catalog.id}`);
                    console.log(`   Found ${collectionsData.length} collections`);
                    
                    // Convert collections to array format similar to catalogs
                    const collections = collectionsData.map((col, index) => {
                        return [
                            index,
                            col.id || 'Unknown',
                            col.url || col.links?.find(l => l.rel === 'self')?.href || 'N/A',
                            col.title || 'N/A',
                            col.description || col.summary || 'N/A',
                            col.extent?.spatial?.bbox?.[0] || 'N/A',
                            col.extent?.temporal?.interval?.[0] || 'N/A',
                            col.license || 'N/A',
                            col.keywords || []
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
 * Fetches nested catalogs within a catalog
 * @async
 * @param {Object} catalog - Catalog object with url property
 * @returns {Promise<Array>} Array of nested catalogs
 */
async function getNestedCatalogs(catalog) {
    try {
        // Try common STAC nested catalog endpoints
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
 * Recursively crawls a catalog, its collections, and nested catalogs
 * @async
 * @param {Object} catalog - Catalog object to crawl
 * @param {number} depth - Current depth level (for indentation)
 * @returns {Promise<Object>} Stats object with collections count
 */
async function crawlCatalogRecursive(catalog, depth = 0) {
    const indent = '  '.repeat(depth);
    let stats = { collections: 0 };
    
    try {
        // First, try to get collections from this catalog
        const collections = await getCollections(catalog);
        stats.collections = collections.length;
        
        // Then, try to get nested catalogs
        const nestedCatalogs = await getNestedCatalogs(catalog);
        
        if (nestedCatalogs.length > 0) {
            console.log(`${indent} Nested catalogs found: ${nestedCatalogs.length}`);
            
            // Recursively crawl each nested catalog
            for (const nestedCatalog of nestedCatalogs.slice(0, 5)) { // Limit to first 5 nested
                const nestedStats = await crawlCatalogRecursive(nestedCatalog, depth + 1);
                stats.collections += nestedStats.collections;
            }
        }
        
    } catch (error) {
        console.error(`Error in recursive crawl for ${catalog.id}: ${error.message}`);
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

crawler();