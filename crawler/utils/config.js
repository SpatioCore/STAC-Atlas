/**
 * @fileoverview Configuration management for STAC crawler
 * @module utils/config
 */

import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

/**
 * Parse command line arguments
 * @returns {Object} Parsed CLI arguments
 */
function parseCliArgs() {
    const args = process.argv.slice(2);
    const config = {};
    
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        
        if (arg === '--mode' || arg === '-m') {
            config.mode = args[++i];
        } else if (arg === '--max-catalogs' || arg === '-c') {
            config.maxCatalogs = parseInt(args[++i], 10);
        } else if (arg === '--max-apis' || arg === '-a') {
            config.maxApis = parseInt(args[++i], 10);
        } else if (arg === '--timeout' || arg === '-t') {
            config.timeout = parseInt(args[++i], 10);
        } else if (arg === '--max-depth' || arg === '-d') {
            config.maxDepth = parseInt(args[++i], 10);
        } else if (arg === '--help' || arg === '-h') {
            printHelp();
            process.exit(0);
        }
    }
    
    return config;
}

/**
 * Print help message
 */
function printHelp() {
    console.log(`
STAC Crawler Configuration Options:

  -m, --mode <mode>              Crawl mode: 'catalogs', 'apis', or 'both' (default: 'both')
  -c, --max-catalogs <number>    Maximum number of catalogs to crawl (default: 10)
  -a, --max-apis <number>        Maximum number of APIs to crawl (default: 5)
  -t, --timeout <milliseconds>   Timeout for each crawl operation in ms (default: 30000)
  -d, --max-depth <number>       Maximum recursion depth for nested catalogs (default: 3)
  -h, --help                     Show this help message

Environment Variables:
  CRAWL_MODE          Same as --mode
  MAX_CATALOGS        Same as --max-catalogs
  MAX_APIS            Same as --max-apis
  TIMEOUT_MS          Same as --timeout
  MAX_DEPTH           Same as --max-depth

Examples:
  node index.js --mode catalogs --max-catalogs 20
  node index.js -m apis -a 10 -t 60000
  CRAWL_MODE=both MAX_CATALOGS=50 node index.js
    `);
}

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
        maxDepth: 3             // Maximum recursion depth for nested catalogs
    };
    
    // Build configuration with precedence: CLI > ENV > Defaults
    const config = {
        mode: cliArgs.mode || process.env.CRAWL_MODE || defaults.mode,
        maxCatalogs: cliArgs.maxCatalogs || parseInt(process.env.MAX_CATALOGS, 10) || defaults.maxCatalogs,
        maxApis: cliArgs.maxApis || parseInt(process.env.MAX_APIS, 10) || defaults.maxApis,
        timeout: cliArgs.timeout || parseInt(process.env.TIMEOUT_MS, 10) || defaults.timeout,
        maxDepth: cliArgs.maxDepth || parseInt(process.env.MAX_DEPTH, 10) || defaults.maxDepth
    };
    
    // Validate mode
    const validModes = ['catalogs', 'apis', 'both'];
    if (!validModes.includes(config.mode)) {
        console.error(`Invalid mode: ${config.mode}. Must be one of: ${validModes.join(', ')}`);
        process.exit(1);
    }
    
    // When mode is 'catalogs', remove limits for comprehensive crawling
    if (config.mode === 'catalogs') {
        config.maxCatalogs = Infinity;
        config.maxDepth = Infinity;
        config.timeout = Infinity;
    }
    
    // Validate numeric values
    if (config.maxCatalogs < 0 || config.maxApis < 0 || config.timeout < 0 || config.maxDepth < 0) {
        console.error('Numeric configuration values must be non-negative');
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
    parseCliArgs,
    printHelp,
    withTimeout,
    createTimeout
};
