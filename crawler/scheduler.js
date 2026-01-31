/**
 * @fileoverview Scheduler for running STAC crawler every 7 days
 * Runs only during allowed time window (22:00 - 07:00)
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

// Time window configuration (crawler only starts between these hours)
const ALLOWED_START_HOUR = 22; // 22:00 (10 PM)
const ALLOWED_END_HOUR = 7;    // 07:00 (7 AM)
const ENFORCE_TIME_WINDOW = true; // Set to false to disable time window check
const GRACE_PERIOD_MINUTES = 30; // Minutes to allow crawler to finish gracefully after end hour

/**
 * Check if current time is within allowed time window
 * @returns {boolean} True if within allowed window
 */
const isWithinAllowedTimeWindow = () => {
    if (!ENFORCE_TIME_WINDOW) return true;
    
    const now = new Date();
    const currentHour = now.getHours();
    
    // Handle time window that spans midnight (e.g., 22:00 - 07:00)
    if (ALLOWED_START_HOUR > ALLOWED_END_HOUR) {
        return currentHour >= ALLOWED_START_HOUR || currentHour < ALLOWED_END_HOUR;
    } else {
        // Normal time window (e.g., 09:00 - 17:00)
        return currentHour >= ALLOWED_START_HOUR && currentHour < ALLOWED_END_HOUR;
    }
};

/**
 * Calculate milliseconds until next allowed start time
 * @returns {number} Milliseconds to wait
 */
const getMillisecondsUntilAllowedTime = () => {
    if (!ENFORCE_TIME_WINDOW) return 0;
    
    const now = new Date();
    const currentHour = now.getHours();
    
    // Already in allowed window
    if (isWithinAllowedTimeWindow()) {
        return 0;
    }
    
    // Calculate next allowed start time
    const nextAllowedTime = new Date(now);
    nextAllowedTime.setHours(ALLOWED_START_HOUR, 0, 0, 0);
    
    // If allowed start hour is later today
    if (currentHour < ALLOWED_START_HOUR && ALLOWED_START_HOUR < ALLOWED_END_HOUR) {
        // Same day, later
    } else if (currentHour >= ALLOWED_END_HOUR && currentHour < ALLOWED_START_HOUR) {
        // Same day, wait until ALLOWED_START_HOUR
    } else {
        // Next day
        nextAllowedTime.setDate(nextAllowedTime.getDate() + 1);
    }
    
    const msToWait = nextAllowedTime.getTime() - now.getTime();
    return msToWait > 0 ? msToWait : 0;
};

/**
 * Calculate milliseconds until the end of allowed time window
 * @returns {number} Milliseconds until end hour
 */
const getMillisecondsUntilEndTime = () => {
    const now = new Date();
    const endTime = new Date(now);
    endTime.setHours(ALLOWED_END_HOUR, 0, 0, 0);
    
    // If end hour is earlier than current hour, it's tomorrow
    if (now.getHours() >= ALLOWED_END_HOUR && ALLOWED_START_HOUR > ALLOWED_END_HOUR) {
        endTime.setDate(endTime.getDate() + 1);
    }
    
    const msUntilEnd = endTime.getTime() - now.getTime();
    return msUntilEnd > 0 ? msUntilEnd : 0;
};

/**
 * Runs the crawler and returns statistics
 * Monitors time and warns if approaching end of allowed window
 * @async
 * @function runCrawler
 * @returns {Promise<Object>} Crawler statistics
 */
const runCrawler = async () => {
    const timestamp = new Date().toISOString();
    console.log(`\n${'='.repeat(60)}`);
    console.log(`[${timestamp}] Starting crawler run...`);
    console.log('='.repeat(60));
    
    // Set up shutdown timer if we're approaching end time
    let shutdownTimer = null;
    let gracePeriodTimer = null;
    
    if (ENFORCE_TIME_WINDOW) {
        const msUntilEnd = getMillisecondsUntilEndTime();
        const msUntilGraceEnd = msUntilEnd + (GRACE_PERIOD_MINUTES * 60 * 1000);
        
        if (msUntilEnd > 0 && msUntilEnd < 12 * 60 * 60 * 1000) { // Less than 12 hours
            const endTime = new Date(Date.now() + msUntilEnd);
            console.log(`Note: Crawl should complete before ${endTime.toLocaleTimeString()} (${formatDuration(msUntilEnd)} remaining)`);
            console.log(`Grace period: ${GRACE_PERIOD_MINUTES} minutes after end time\n`);
            
            // Set warning timer for end time
            shutdownTimer = setTimeout(() => {
                console.warn(`\n${'!'.repeat(60)}`);
                console.warn(`WARNING: End time (${ALLOWED_END_HOUR}:00) reached!`);
                console.warn(`Crawler is still running. Grace period: ${GRACE_PERIOD_MINUTES} minutes`);
                console.warn(`The crawler will continue to finish current operations.`);
                console.warn('!'.repeat(60) + '\n');
            }, msUntilEnd);
            
            // Set forced shutdown timer (end time + grace period)
            gracePeriodTimer = setTimeout(() => {
                console.error(`\n${'!'.repeat(60)}`);
                console.error(`CRITICAL: Grace period expired! (${ALLOWED_END_HOUR}:00 + ${GRACE_PERIOD_MINUTES}min)`);
                console.error(`Crawler is being stopped to respect time window.`);
                console.error(`Next run will be scheduled for ${ALLOWED_START_HOUR}:00`);
                console.error('!'.repeat(60) + '\n');
                process.exit(0); // Graceful exit
            }, msUntilGraceEnd);
        }
    }
    
    try {
        const stats = await crawler();
        
        // Clear timers if crawler finished in time
        if (shutdownTimer) clearTimeout(shutdownTimer);
        if (gracePeriodTimer) clearTimeout(gracePeriodTimer);
        
        console.log(`\n[${new Date().toISOString()}] Crawler finished`);
        return stats;
    } catch (error) {
        // Clear timers on error
        if (shutdownTimer) clearTimeout(shutdownTimer);
        if (gracePeriodTimer) clearTimeout(gracePeriodTimer);
        
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
 * Schedule next run exactly 7 days after the START of the last crawl
 * Adjusts timing to fit within allowed time window if configured
 * @param {boolean} isRetry - Whether this is a retry after an error
 */
const scheduleNextRun = (isRetry = false) => {
    let delayMs;
    let intervalDescription;
    
    if (isRetry) {
        delayMs = RETRY_DELAY_HOURS * 60 * 60 * 1000;
        intervalDescription = `${RETRY_DELAY_HOURS} hour(s) (retry)`;
    } else {
        // Schedule next run: exactly 7 days from now (start of last crawl)
        const intervalMs = DAYS_INTERVAL * 24 * 60 * 60 * 1000;
        delayMs = intervalMs;
        intervalDescription = `${DAYS_INTERVAL} days`;
    }
    
    // Check if scheduled time falls within allowed window
    if (ENFORCE_TIME_WINDOW) {
        const scheduledTime = new Date(Date.now() + delayMs);
        const scheduledHour = scheduledTime.getHours();
        
        // Check if the scheduled time is outside the window
        const isScheduledTimeAllowed = ALLOWED_START_HOUR > ALLOWED_END_HOUR 
            ? (scheduledHour >= ALLOWED_START_HOUR || scheduledHour < ALLOWED_END_HOUR)
            : (scheduledHour >= ALLOWED_START_HOUR && scheduledHour < ALLOWED_END_HOUR);
        
        if (!isScheduledTimeAllowed) {
            // Calculate how much to add to reach the next allowed window
            const hoursUntilAllowed = ALLOWED_START_HOUR > scheduledHour 
                ? ALLOWED_START_HOUR - scheduledHour
                : (24 - scheduledHour) + ALLOWED_START_HOUR;
            const additionalMs = hoursUntilAllowed * 60 * 60 * 1000;
            delayMs += additionalMs;
            console.log(`\nTime window enforcement: Next run moved to allowed window (${ALLOWED_START_HOUR}:00 - ${ALLOWED_END_HOUR}:00)`);
        }
    }
    
    const nextRun = new Date(Date.now() + delayMs);
    
    console.log(`\nNext crawl scheduled for: ${nextRun.toLocaleString()}`);
    console.log(`   Interval: ${intervalDescription}`);
    console.log(`   Wait time: ${formatDuration(delayMs)}\n`);
    
    setTimeout(async () => {
        const stats = await runCrawler();
        
        if (stats.dbError) {
            console.error('\nDATABASE ERROR DETECTED - Scheduler stopped to prevent data issues.');
            console.error('   Please fix the database connection and restart the scheduler.\n');
            process.exit(1);
        } else if (stats.crawlError && RETRY_ON_CRAWL_ERROR) {
            console.warn('\nCrawl error detected but database is OK - scheduling retry...');
            scheduleNextRun(true); // Retry after 2 hours
        } else if (stats.success) {
            console.log('\nCrawl completed successfully - scheduling next run...');
            scheduleNextRun(false); // Schedule next run in exactly 7 days
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
    console.log(`Time window enforcement: ${ENFORCE_TIME_WINDOW ? 'ENABLED' : 'DISABLED'}`);
    if (ENFORCE_TIME_WINDOW) {
        console.log(`   Allowed start hours: ${ALLOWED_START_HOUR}:00 - ${ALLOWED_END_HOUR}:00`);
        console.log(`   Currently in window: ${isWithinAllowedTimeWindow() ? 'YES' : 'NO'}`);
    }
    console.log(`Current time: ${new Date().toLocaleString()}\n`);
    
    // Run immediately if configured
    if (RUN_ON_STARTUP) {
        // Check if we need to wait for allowed time window
        if (ENFORCE_TIME_WINDOW && !isWithinAllowedTimeWindow()) {
            const waitMs = getMillisecondsUntilAllowedTime();
            const waitUntil = new Date(Date.now() + waitMs);
            console.log(`Current time is outside allowed window (${ALLOWED_START_HOUR}:00 - ${ALLOWED_END_HOUR}:00)`);
            console.log(`   Waiting until: ${waitUntil.toLocaleString()}`);
            console.log(`   Wait time: ${formatDuration(waitMs)}\n`);
            
            await new Promise(resolve => setTimeout(resolve, waitMs));
        }
        
        console.log('Running initial crawl on startup...');
        const stats = await runCrawler();
        
        if (stats.dbError) {
            console.error('\nDATABASE ERROR - Cannot start scheduler.');
            console.error('   Please fix the database connection and try again.\n');
            process.exit(1);
        } else if (stats.crawlError && RETRY_ON_CRAWL_ERROR) {
            console.warn('\nInitial crawl had errors but database is OK - scheduling retry...');
            scheduleNextRun(true);
        } else if (stats.success) {
            console.log('\nInitial crawl completed - scheduling next run...');
            scheduleNextRun(false);
        } else {
            console.error('\nInitial crawl failed - exiting.\n');
            process.exit(1);
        }
    } else {
        // Schedule first run without running now
        scheduleNextRun(false);
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
