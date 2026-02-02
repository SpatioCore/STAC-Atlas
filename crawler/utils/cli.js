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
        } else if (arg === '--max-concurrency') {
            config.maxConcurrency = parseInt(args[++i], 10);
        } else if (arg === '--requests-per-minute' || arg === '--rpm') {
            config.maxRequestsPerMinute = parseInt(args[++i], 10);
        } else if (arg === '--domain-delay') {
            config.sameDomainDelaySecs = parseFloat(args[++i]);
        } else if (arg === '--max-retries') {
            config.maxRequestRetries = parseInt(args[++i], 10);
        // New parallel crawling options
        } else if (arg === '--parallel-domains' || arg === '-p') {
            config.parallelDomains = parseInt(args[++i], 10);
        } else if (arg === '--rpm-per-domain') {
            config.maxRequestsPerMinutePerDomain = parseInt(args[++i], 10);
        } else if (arg === '--concurrency-per-domain') {
            config.maxConcurrencyPerDomain = parseInt(args[++i], 10);
        } else if (arg === '--fresh' || arg === '-f') {
            config.fresh = true;
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
  
  Parallel Crawling Options (NEW):
  -p, --parallel-domains <num>   Number of domains to crawl in parallel (default: 5)
                                 Each domain gets its own crawler instance
  --rpm-per-domain <number>      Max requests per minute PER DOMAIN (default: 120)
                                 Total throughput = parallel-domains × rpm-per-domain
  --concurrency-per-domain <n>   Max concurrent requests per domain (default: 10)
  
  Resume/Fresh Options:
  -f, --fresh                    Clear crawl log and start fresh (ignore previous progress)
                                 Without this flag, crawler resumes from where it left off
  
  Legacy Rate Limiting Options (still supported):
  --max-concurrency <number>     Maximum concurrent requests (default: 5)
  --requests-per-minute, --rpm   Maximum requests per minute (default: 60)
  --domain-delay <seconds>       Delay between requests to same domain (default: 1)
  --max-retries <number>         Maximum retries for failed requests (default: 3)
   
  -d, --max-depth <number>       Maximum recursion depth for nested catalogs (default: 10, use 0 for unlimited)
                                 Prevents memory issues from deeply nested catalog hierarchies
  -h, --help                     Show this help message

Environment Variables:
  CRAWL_MODE                     Same as --mode
  MAX_CATALOGS                   Same as --max-catalogs (use 0 for unlimited)
  MAX_APIS                       Same as --max-apis (use 0 for unlimited)
  TIMEOUT_MS                     Same as --timeout
  PARALLEL_DOMAINS               Same as --parallel-domains
  MAX_REQUESTS_PER_MINUTE_PER_DOMAIN  Same as --rpm-per-domain
  MAX_CONCURRENCY_PER_DOMAIN     Same as --concurrency-per-domain
  MAX_CONCURRENCY                Same as --max-concurrency
  MAX_REQUESTS_PER_MINUTE        Same as --requests-per-minute
  SAME_DOMAIN_DELAY_SECS         Same as --domain-delay
  MAX_REQUEST_RETRIES            Same as --max-retries
  MAX_DEPTH                      Same as --max-depth (use 0 for unlimited)

Examples:
  # Basic usage
  node index.js --mode catalogs --max-catalogs 20
  node index.js -m apis -a 10 -t 60000
  
  # Parallel crawling (recommended for performance)
  node index.js -p 5 --rpm-per-domain 120      # 5 domains × 120 req/min = 600 req/min max
  node index.js -p 10 --rpm-per-domain 60      # 10 domains × 60 req/min = 600 req/min max
  
  # Unlimited mode (no debugging limits)
  node index.js -m both -c 0 -a 0
  
  # With environment variables
  PARALLEL_DOMAINS=5 MAX_REQUESTS_PER_MINUTE_PER_DOMAIN=120 node index.js
    `);
}
