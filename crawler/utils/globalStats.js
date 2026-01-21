/**
 * @fileoverview Global statistics tracker for aggregated crawler metrics
 * Provides real-time statistics across all parallel crawlers
 * @module utils/globalStats
 */

import { log as crawleeLog } from 'crawlee';

/**
 * Global statistics singleton that aggregates metrics from all crawlers
 */
class GlobalStatistics {
    constructor() {
        this.reset();
        this.intervalId = null;
        this.intervalSecs = 60; // Log every 60 seconds like Crawlee
    }

    /**
     * Reset all statistics
     */
    reset() {
        this.startTime = null;
        this.stats = {
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
        this.activeDomains = new Set();
        this.completedDomains = 0;
        this.totalDomains = 0;
    }

    /**
     * Start the statistics tracking
     * @param {number} totalDomains - Total number of domains to process
     * @param {number} intervalSecs - Logging interval in seconds (0 or null to disable periodic logging)
     */
    start(totalDomains = 0, intervalSecs = 0) {
        this.reset();
        this.startTime = Date.now();
        this.totalDomains = totalDomains;
        this.intervalSecs = intervalSecs;

        // Only start periodic logging if intervalSecs > 0
        if (intervalSecs && intervalSecs > 0) {
            this.intervalId = setInterval(() => {
                this.logStatistics();
            }, this.intervalSecs * 1000);
        }
    }

    /**
     * Stop the statistics tracking
     */
    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        // Log final statistics
        this.logStatistics(true);
    }

    /**
     * Register a domain as active
     * @param {string} domain - Domain name
     */
    domainStarted(domain) {
        this.activeDomains.add(domain);
    }

    /**
     * Register a domain as completed
     * @param {string} domain - Domain name
     */
    domainCompleted(domain) {
        this.activeDomains.delete(domain);
        this.completedDomains++;
    }

    /**
     * Increment a statistic counter (thread-safe for single-threaded Node.js)
     * @param {string} stat - Statistic name
     * @param {number} amount - Amount to increment (default: 1)
     */
    increment(stat, amount = 1) {
        if (this.stats.hasOwnProperty(stat)) {
            this.stats[stat] += amount;
        }
    }

    /**
     * Add stats from a completed domain crawl
     * @param {Object} domainStats - Statistics object from a domain crawl
     */
    addDomainStats(domainStats) {
        if (!domainStats) return;
        
        for (const [key, value] of Object.entries(domainStats)) {
            if (typeof value === 'number' && this.stats.hasOwnProperty(key)) {
                this.stats[key] += value;
            }
        }
    }

    /**
     * Get current runtime in milliseconds
     * @returns {number} Runtime in milliseconds
     */
    getRuntimeMs() {
        if (!this.startTime) return 0;
        return Date.now() - this.startTime;
    }

    /**
     * Calculate requests per minute
     * @returns {number} Requests per minute
     */
    getRequestsPerMinute() {
        const runtimeMinutes = this.getRuntimeMs() / 60000;
        if (runtimeMinutes <= 0) return 0;
        return Math.round(this.stats.totalRequests / runtimeMinutes);
    }

    /**
     * Log current statistics using Crawlee's logger
     * @param {boolean} isFinal - Whether this is the final log
     */
    logStatistics(isFinal = false) {
        const runtimeMs = this.getRuntimeMs();
        const runtimeSecs = Math.round(runtimeMs / 1000);
        const reqPerMin = this.getRequestsPerMinute();
        
        const prefix = isFinal ? 'GlobalStatistics: Final' : 'GlobalStatistics';
        
        const statsObj = {
            requestsFinishedPerMinute: reqPerMin,
            requestsTotal: this.stats.totalRequests,
            requestsSuccessful: this.stats.successfulRequests,
            requestsFailed: this.stats.failedRequests,
            collectionsFound: this.stats.collectionsFound,
            collectionsSaved: this.stats.collectionsSaved,
            domainsActive: this.activeDomains.size,
            domainsCompleted: this.completedDomains,
            domainsTotal: this.totalDomains,
            crawlerRuntimeSecs: runtimeSecs
        };

        crawleeLog.info(`${prefix}: ${JSON.stringify(statsObj)}`);
    }

    /**
     * Get current statistics snapshot
     * @returns {Object} Current statistics
     */
    getStats() {
        return {
            ...this.stats,
            runtimeMs: this.getRuntimeMs(),
            requestsPerMinute: this.getRequestsPerMinute(),
            activeDomains: this.activeDomains.size,
            completedDomains: this.completedDomains,
            totalDomains: this.totalDomains
        };
    }
}

// Export singleton instance
const globalStats = new GlobalStatistics();

export default globalStats;
export { GlobalStatistics };
