/**
 * @fileoverview CLI argument parsing for STAC crawler (temporary debugging file)
 * @module utils/cli
 * @note This file can be easily removed after debugging is complete
 */

/**
 * Parse command line arguments
 * @returns {Object} Parsed CLI arguments
 */
export function parseCliArgs() {
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
export function printHelp() {
    console.log(`
STAC Crawler Configuration Options:

  -m, --mode <mode>              Crawl mode: 'catalogs', 'apis', or 'both' (default: 'both')
  -c, --max-catalogs <number>    Maximum number of catalogs to crawl (default: 10, use 0 for unlimited)
                                 Note: Limits are for debugging purposes only
  -a, --max-apis <number>        Maximum number of APIs to crawl (default: 5, use 0 for unlimited)
                                 Note: Limits are for debugging purposes only
  -t, --timeout <milliseconds>   Timeout for each crawl operation in ms (default: 30000)
  -d, --max-depth <number>       Maximum recursion depth for nested catalogs (default: 10, use 0 for unlimited)
                                 Prevents memory issues from deeply nested catalog hierarchies
  -h, --help                     Show this help message

Environment Variables:
  CRAWL_MODE          Same as --mode
  MAX_CATALOGS        Same as --max-catalogs (use 0 for unlimited)
  MAX_APIS            Same as --max-apis (use 0 for unlimited)
  TIMEOUT_MS          Same as --timeout
  MAX_DEPTH           Same as --max-depth (use 0 for unlimited)

Examples:
  node index.js --mode catalogs --max-catalogs 20
  node index.js -m apis -a 10 -t 60000
  node index.js -m both -c 0 -a 0              # Unlimited mode (no debugging limits)
  node index.js -m apis -d 5                   # Limit nesting depth to 5 levels
  CRAWL_MODE=both MAX_CATALOGS=50 node index.js
    `);
}
