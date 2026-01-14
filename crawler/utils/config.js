/**
 * @fileoverview Configuration management for STAC crawler
 * @module utils/config
 */

import dotenv from 'dotenv';
import { parseCliArgs } from './cli.js';

/**
 * Checks if a URL points to a static catalog file rather than an API endpoint
 * @param {string} url - URL to check
 * @returns {boolean} True if URL appears to be a static file
 */
export function isStaticCatalogUrl(url) {
    if (!url || typeof url !== 'string') return false;
    
    // Check if URL ends with common static catalog file patterns
    const staticPatterns = [
        /\.json$/i,           // ends with .json
        /\/collection\.json/i, // collection.json file
        /\/catalog\.json/i,    // catalog.json file
        /\/stac\.json/i        // stac.json file
    ];
    
    return staticPatterns.some(pattern => pattern.test(url));
}

// Load environment variables from .env file
dotenv.config();

/**
 * Get configuration from environment variables, CLI args, and defaults
 * CLI args take precedence over env vars, which take precedence over defaults
 * @returns {Object} Configuration object
 */
function getConfig() {
    const cliArgs = parseCliArgs();
    
    // Default configuration
    const defaults = {
        mode: 'both',           // 'catalogs', 'apis', or 'both'
        maxCatalogs: 10,        // Maximum number of catalogs to crawl
        maxApis: 5,             // Maximum number of APIs to crawl
        timeout: 30000,         // Timeout in milliseconds (30 seconds)
        // Rate limiting options (Crawlee)
        maxConcurrency: 5,      // Maximum number of concurrent requests
        maxRequestsPerMinute: 60, // Maximum requests per minute
        sameDomainDelaySecs: 1, // Delay between requests to the same domain
        maxRequestRetries: 3    // Maximum number of retries for failed requests
    };
    
    // Build configuration with precedence: CLI > ENV > Defaults
    const config = {
        mode: cliArgs.mode || process.env.CRAWL_MODE || defaults.mode,
        maxCatalogs: cliArgs.maxCatalogs !== undefined ? cliArgs.maxCatalogs : 
                     (process.env.MAX_CATALOGS ? parseInt(process.env.MAX_CATALOGS, 10) : defaults.maxCatalogs),
        maxApis: cliArgs.maxApis !== undefined ? cliArgs.maxApis : 
                 (process.env.MAX_APIS ? parseInt(process.env.MAX_APIS, 10) : defaults.maxApis),
        timeout: cliArgs.timeout !== undefined ? cliArgs.timeout : 
                 (process.env.TIMEOUT_MS ? parseInt(process.env.TIMEOUT_MS, 10) : defaults.timeout),
        // Rate limiting options
        maxConcurrency: cliArgs.maxConcurrency !== undefined ? cliArgs.maxConcurrency :
                        (process.env.MAX_CONCURRENCY ? parseInt(process.env.MAX_CONCURRENCY, 10) : defaults.maxConcurrency),
        maxRequestsPerMinute: cliArgs.maxRequestsPerMinute !== undefined ? cliArgs.maxRequestsPerMinute :
                              (process.env.MAX_REQUESTS_PER_MINUTE ? parseInt(process.env.MAX_REQUESTS_PER_MINUTE, 10) : defaults.maxRequestsPerMinute),
        sameDomainDelaySecs: cliArgs.sameDomainDelaySecs !== undefined ? cliArgs.sameDomainDelaySecs :
                             (process.env.SAME_DOMAIN_DELAY_SECS ? parseFloat(process.env.SAME_DOMAIN_DELAY_SECS) : defaults.sameDomainDelaySecs),
        maxRequestRetries: cliArgs.maxRequestRetries !== undefined ? cliArgs.maxRequestRetries :
                           (process.env.MAX_REQUEST_RETRIES ? parseInt(process.env.MAX_REQUEST_RETRIES, 10) : defaults.maxRequestRetries)
    };
    
    // Validate mode
    const validModes = ['catalogs', 'apis', 'both'];
    if (!validModes.includes(config.mode)) {
        console.error(`Invalid mode: ${config.mode}. Must be one of: ${validModes.join(', ')}`);
        process.exit(1);
    }
    
    // NOTE: Removed automatic Infinity override for 'catalogs' mode
    // Users can now control limits via CLI args even when mode is 'catalogs'
    // Set maxCatalogs or maxApis to 0 for unlimited crawling (for debugging purposes)
    
    // Validate numeric values (0 means unlimited)
    if ((config.maxCatalogs < 0) || 
        (config.maxApis < 0) || 
        (config.timeout !== Infinity && config.timeout < 0)) {
        console.error('Numeric configuration values must be non-negative (use 0 for unlimited)');
        process.exit(1);
    }
    
    return config;
}

/**
 * Create a timeout promise that rejects after the specified time
 * @param {number} ms - Timeout in milliseconds
 * @param {string} operation - Description of the operation for error message
 * @returns {Promise} Promise that rejects after timeout
 */
function createTimeout(ms, operation = 'Operation') {
    return new Promise((_, reject) => {
        setTimeout(() => {
            reject(new Error(`${operation} timed out after ${ms}ms`));
        }, ms);
    });
}

/**
 * Wrap a promise with a timeout
 * @param {Promise} promise - Promise to wrap
 * @param {number} ms - Timeout in milliseconds (Infinity for no timeout)
 * @param {string} operation - Description of the operation
 * @returns {Promise} Promise that races against timeout
 */
async function withTimeout(promise, ms, operation = 'Operation') {
    // If timeout is Infinity, just return the promise without racing
    if (ms === Infinity) {
        return promise;
    }
    return Promise.race([
        promise,
        createTimeout(ms, operation)
    ]);
}

export {
    getConfig,
    withTimeout,
    createTimeout
};
