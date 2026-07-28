/**
 * @fileoverview Docker/CLI entrypoint - picks single-run vs scheduled crawling
 * based on CRAWL_SCHEDULER_ENABLED, so the same image serves both modes.
 * @module entrypoint
 */

import { crawler } from './index.js';
import { startScheduler } from './scheduler.js';

const SCHEDULER_ENABLED = process.env.CRAWL_SCHEDULER_ENABLED === 'true';

if (SCHEDULER_ENABLED) {
    startScheduler();
} else {
    crawler();
}
