/**
 * @fileoverview Scheduler for running STAC crawler every 7 days
 * Waits for the actual crawl time to complete before scheduling next run
 * Skips scheduling if database errors occur
 * @module scheduler
 */

import { crawler } from './index.js';
import { formatDuration } from './utils/time.js';

/**
 * Configuration
 */
const DAYS_INTERVAL = 7; // Run every 7 days
const RUN_ON_STARTUP = true; // Set to false to wait 7 days before first run
const RETRY_ON_CRAWL_ERROR = true; // Retry if crawl fails but DB is ok
const RETRY_DELAY_HOURS = 2; // Hours to wait before retry on crawl error

/**
 * Runs the crawler and returns statistics
 * @async
 * @function runCrawler
 * @returns {Promise<Object>} Crawler statistics
 */
const runCrawler = async () => {
    const timestamp = new Date().toISOString();
    console.log(`\n${'='.repeat(60)}`);
    console.log(`[${timestamp}] Starting crawler run...`);
    console.log('='.repeat(60));
    
    try {
        const stats = await crawler();
        console.log(`\n[${new Date().toISOString()}] Crawler finished`);
        return stats;
    } catch (error) {
        console.error(`\n[${new Date().toISOString()}] Crawler encountered an error:`, error.message);
        return {
            success: false,
            dbError: true,
            crawlError: true,
            elapsedTime: 0,
            error: error.message
        };
    }
};

/**
 * Schedule next run based on the crawl duration
 * @param {number} crawlDuration - Duration of the last crawl in milliseconds
 */
const scheduleNextRun = (crawlDuration = 0, isRetry = false) => {
    let delayMs;
    let intervalDescription;
    
    if (isRetry) {
        delayMs = RETRY_DELAY_HOURS * 60 * 60 * 1000;
        intervalDescription = `${RETRY_DELAY_HOURS} hour(s) (retry)`;
    } else {
        // Schedule next run: 7 days minus the time the crawl took
        const intervalMs = DAYS_INTERVAL * 24 * 60 * 60 * 1000;
        delayMs = Math.max(intervalMs - crawlDuration, 0);
        intervalDescription = `${DAYS_INTERVAL} days`;
    }
    
    const nextRun = new Date(Date.now() + delayMs);
    
    console.log(`\nNext crawl scheduled for: ${nextRun.toLocaleString()}`);
    console.log(`   Interval: ${intervalDescription}`);
    if (!isRetry && crawlDuration > 0) {
        console.log(`   Adjusted for crawl time: -${formatDuration(crawlDuration)}`);
    }
    console.log(`   Wait time: ${formatDuration(delayMs)}\n`);
    
    setTimeout(async () => {
        const stats = await runCrawler();
        
        if (stats.dbError) {
            console.error('\nDATABASE ERROR DETECTED - Scheduler stopped to prevent data issues.');
            console.error('   Please fix the database connection and restart the scheduler.\n');
            process.exit(1);
        } else if (stats.crawlError && RETRY_ON_CRAWL_ERROR) {
            console.warn('\nCrawl error detected but database is OK - scheduling retry...');
            scheduleNextRun(0, true); // Retry without adjusting for crawl time
        } else if (stats.success) {
            console.log('\nCrawl completed successfully - scheduling next run...');
            scheduleNextRun(stats.elapsedTime, false); // Schedule next run with time adjustment
        } else {
            console.error('\nCrawl failed - scheduler stopped.\n');
            process.exit(1);
        }
    }, delayMs);
};

/**
 * Start the scheduler
 */
const startScheduler = async () => {
    console.log('\n╔═══════════════════════════════════════════════════════════╗');
    console.log('║           STAC Crawler Scheduler Started                 ║');
    console.log('╚═══════════════════════════════════════════════════════════╝\n');
    console.log(`Interval: Every ${DAYS_INTERVAL} days`);
    console.log(`Run on startup: ${RUN_ON_STARTUP}`);
    console.log(`Retry on crawl error: ${RETRY_ON_CRAWL_ERROR}`);
    if (RETRY_ON_CRAWL_ERROR) {
        console.log(`   Retry delay: ${RETRY_DELAY_HOURS} hour(s)`);
    }
    console.log(`Current time: ${new Date().toLocaleString()}\n`);
    
    // Run immediately if configured
    if (RUN_ON_STARTUP) {
        console.log('Running initial crawl on startup...');
        const stats = await runCrawler();
        
        if (stats.dbError) {
            console.error('\nDATABASE ERROR - Cannot start scheduler.');
            console.error('   Please fix the database connection and try again.\n');
            process.exit(1);
        } else if (stats.crawlError && RETRY_ON_CRAWL_ERROR) {
            console.warn('\nInitial crawl had errors but database is OK - scheduling retry...');
            scheduleNextRun(0, true);
        } else if (stats.success) {
            console.log('\nInitial crawl completed - scheduling next run...');
            scheduleNextRun(stats.elapsedTime, false);
        } else {
            console.error('\nInitial crawl failed - exiting.\n');
            process.exit(1);
        }
    } else {
        // Schedule first run without running now
        scheduleNextRun(0, false);
    }
    
    console.log('Scheduler is running. Press Ctrl+C to stop.\n');
    
    // Graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n\nStopping scheduler...');
        console.log('Scheduler stopped. See ya later Aligator!\n');
        process.exit(0);
    });
};

// Start the scheduler
startScheduler();
