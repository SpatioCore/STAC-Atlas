/**
 * @fileoverview Parallel execution utilities for domain-based crawling
 * Allows crawling multiple domains simultaneously while respecting per-domain rate limits
 * @module utils/parallel
 */

/**
 * Extracts the domain from a URL
 * @param {string} url - URL to extract domain from
 * @returns {string} The domain (hostname) of the URL
 */
export function getDomain(url) {
    try {
        const urlObj = new URL(url);
        return urlObj.hostname;
    } catch {
        return 'unknown';
    }
}

/**
 * Groups items by their URL domain
 * @param {Array<Object>} items - Array of objects with url property
 * @returns {Map<string, Array<Object>>} Map of domain -> items
 */
export function groupByDomain(items) {
    const domainMap = new Map();
    
    for (const item of items) {
        const domain = getDomain(item.url);
        if (!domainMap.has(domain)) {
            domainMap.set(domain, []);
        }
        domainMap.get(domain).push(item);
    }
    
    return domainMap;
}

/**
 * Creates batches of domains for parallel processing
 * @param {Map<string, Array>} domainMap - Map of domain -> items
 * @param {number} batchSize - Number of domains to process in parallel
 * @returns {Array<Array<[string, Array]>>} Array of batches, each containing [domain, items] pairs
 */
export function createDomainBatches(domainMap, batchSize = 5) {
    const entries = Array.from(domainMap.entries());
    const batches = [];
    
    for (let i = 0; i < entries.length; i += batchSize) {
        batches.push(entries.slice(i, i + batchSize));
    }
    
    return batches;
}

/**
 * Aggregates statistics from multiple crawler results
 * @param {Array<Object>} results - Array of result objects with stats
 * @returns {Object} Aggregated statistics
 */
export function aggregateStats(results) {
    const aggregated = {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        collectionsFound: 0,
        collectionsSaved: 0,
        collectionsFailed: 0,
        catalogsProcessed: 0,
        apisProcessed: 0,
        stacCompliant: 0,
        nonCompliant: 0
    };
    
    for (const result of results) {
        if (!result || !result.stats) continue;
        
        for (const key of Object.keys(aggregated)) {
            if (typeof result.stats[key] === 'number') {
                aggregated[key] += result.stats[key];
            }
        }
    }
    
    return aggregated;
}

/**
 * Executes async functions in parallel with a concurrency limit
 * @param {Array<Function>} tasks - Array of async functions to execute
 * @param {number} concurrency - Maximum number of tasks to run in parallel
 * @param {Function} onProgress - Optional callback for progress updates
 * @returns {Promise<Array>} Array of results from all tasks
 */
export async function executeWithConcurrency(tasks, concurrency, onProgress = null) {
    const results = [];
    let completed = 0;
    let running = 0;
    let index = 0;
    
    return new Promise((resolve) => {
        const runNext = async () => {
            if (index >= tasks.length) {
                if (running === 0) {
                    resolve(results);
                }
                return;
            }
            
            const currentIndex = index++;
            running++;
            
            try {
                const result = await tasks[currentIndex]();
                results[currentIndex] = result;
            } catch (error) {
                results[currentIndex] = { error: error.message, stats: {} };
            }
            
            running--;
            completed++;
            
            if (onProgress) {
                onProgress(completed, tasks.length);
            }
            
            runNext();
        };
        
        // Start initial batch
        const initialBatch = Math.min(concurrency, tasks.length);
        for (let i = 0; i < initialBatch; i++) {
            runNext();
        }
        
        // Handle empty tasks array
        if (tasks.length === 0) {
            resolve(results);
        }
    });
}

/**
 * Calculates optimal rate limiting based on max requests per minute
 * @param {number} maxRequestsPerMinute - Maximum requests per minute (per domain)
 * @returns {Object} Rate limiting configuration
 */
export function calculateRateLimits(maxRequestsPerMinute = 120) {
    // Use only maxRequestsPerMinute for rate limiting
    // sameDomainDelaySecs is set to 0 - we rely solely on the rate limiter
    // This gives us maximum throughput while respecting the rate limit
    
    return {
        maxRequestsPerMinute: maxRequestsPerMinute,
    };
}

/**
 * Logs domain statistics for debugging
 * @param {Map<string, Array>} domainMap - Map of domain -> items
 * @param {string} itemType - Type of items (e.g., 'catalogs', 'APIs')
 */
export function logDomainStats(domainMap, itemType = 'items') {
    console.log(`\n=== Domain Distribution for ${itemType} ===`);
    console.log(`Total domains: ${domainMap.size}`);
    
    const sorted = Array.from(domainMap.entries())
        .sort((a, b) => b[1].length - a[1].length);
    
    // Show top 10 domains
    const top = sorted.slice(0, 10);
    for (const [domain, items] of top) {
        console.log(`  ${domain}: ${items.length} ${itemType}`);
    }
    
    if (sorted.length > 10) {
        console.log(`  ... and ${sorted.length - 10} more domains`);
    }
    console.log('');
}
