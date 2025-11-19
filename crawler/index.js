/**
 * @fileoverview STAC Index API crawler that fetches and processes catalog data
 * @module crawler
 */

const axios = require('axios');
const db = require('./db');

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
        await db.initDb();
        const response = await axios.get(targetUrl);
        await splitCatalogs(response.data);
    } catch (error) {
        console.error(`Error fetching ${targetUrl}: ${error.message}`);
    } finally {
        // keep DB open for now; close on process exit
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
async function splitCatalogs(catalogs) {
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

    // Persist catalogs into DB
    try {
        await Promise.all(catalogs.map(async (catalog) => {
            try {
                await db.insertOrUpdateCatalog(catalog);
            } catch (err) {
                console.error('DB write error for catalog', catalog && (catalog.id || catalog.slug), err && err.message);
            }
        }));
        console.log('Finished writing catalogs to DB');
    } catch (e) {
        console.error('Unexpected error while saving catalogs to DB', e && e.message);
    }

    return elements;
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