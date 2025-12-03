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
        } else if (arg === '--no-db') {
            config.noDb = true;
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
  -c, --max-catalogs <number>    Maximum number of catalogs to crawl (default: 10)
  -a, --max-apis <number>        Maximum number of APIs to crawl (default: 5)
  -t, --timeout <milliseconds>   Timeout for each crawl operation in ms (default: 30000)
      --no-db                    Skip database operations (terminal output only)
  -h, --help                     Show this help message

Environment Variables:
  CRAWL_MODE          Same as --mode
  MAX_CATALOGS        Same as --max-catalogs
  MAX_APIS            Same as --max-apis
  TIMEOUT_MS          Same as --timeout

Examples:
  node index.js --mode catalogs --max-catalogs 20
  node index.js -m apis -a 10 -t 60000
  CRAWL_MODE=both MAX_CATALOGS=50 node index.js
    `);
}
