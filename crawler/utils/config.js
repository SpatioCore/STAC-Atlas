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
 * @throws {Error} If required environment variables are missing or invalid
 */
function getConfig() {
    const requiredVars = [
        'CRAWL_MODE',
        'MAX_CATALOGS',
        'MAX_APIS',
        'TIMEOUT_MS',
        'MAX_DEPTH',
        'MAX_CONCURRENCY',
        'TARGET_URL'
    ];

    const missingVars = requiredVars.filter(key => !process.env[key]);

    if (missingVars.length > 0) {
        throw new Error(
            `CRITICAL ERROR: Missing required environment variables: ${missingVars.join(', ')}.\n` +
            'Please create a .env file based on .env.example and set all variables.'
        );
    }

    const config = {
        mode: process.env.CRAWL_MODE,
        maxCatalogs: parseInt(process.env.MAX_CATALOGS, 10),
        maxApis: parseInt(process.env.MAX_APIS, 10),
        timeout: parseInt(process.env.TIMEOUT_MS, 10),
        maxDepth: parseInt(process.env.MAX_DEPTH, 10),
        maxConcurrency: parseInt(process.env.MAX_CONCURRENCY, 10),
        targetUrl: process.env.TARGET_URL
    };

    // Validate numeric values
    const numericFields = ['maxCatalogs', 'maxApis', 'timeout', 'maxDepth', 'maxConcurrency'];
    const invalidFields = numericFields.filter(field => isNaN(config[field]));

    if (invalidFields.length > 0) {
        throw new Error(
            `CRITICAL ERROR: Invalid numeric values for variables: ${invalidFields.join(', ')}.\n` +
            'Please ensure these variables are set to valid numbers in your .env file.'
        );
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

export {
    getConfig,
    createTimeout
};
