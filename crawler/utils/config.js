/**
 * @fileoverview Configuration management for STAC crawler
 * @module utils/config
 */

import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

/**
 * Get configuration from environment variables
 * @returns {Object} Configuration object
 */
function getConfig() {

    const config = {
        mode: process.env.CRAWL_MODE,
        maxCatalogs: parseInt(process.env.MAX_CATALOGS, 10),
        maxApis: parseInt(process.env.MAX_APIS, 10),
        timeout: parseInt(process.env.TIMEOUT_MS, 10),
        maxDepth: parseInt(process.env.MAX_DEPTH, 10),
        maxConcurrency: parseInt(process.env.MAX_CONCURRENCY, 10),
        targetUrl: process.env.TARGET_URL
    };


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

export {
    getConfig,
};
