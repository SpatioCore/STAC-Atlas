/**
 * @fileoverview Time formatting utilities for STAC crawler
 * @module utils/time
 */

/**
 * Format milliseconds into a human-readable duration string
 * @param {number} ms - Duration in milliseconds
 * @returns {string} Formatted duration string (e.g., "2h 30m 15s" or "45s")
 */
export function formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    const displaySeconds = seconds % 60;
    const displayMinutes = minutes % 60;
    const displayHours = hours % 24;
    
    if (days > 0) {
        return `${days}d ${displayHours}h ${displayMinutes}m`;
    } else if (hours > 0) {
        return `${displayHours}h ${displayMinutes}m ${displaySeconds}s`;
    } else if (minutes > 0) {
        return `${displayMinutes}m ${displaySeconds}s`;
    } else {
        return `${displaySeconds}s`;
    }
}

/**
 * Get formatted timestamp for logging
 * @returns {string} ISO formatted timestamp
 */
export function getTimestamp() {
    return new Date().toISOString();
}

/**
 * Get localized date/time string for display
 * @param {Date} date - Date object (defaults to now)
 * @returns {string} Localized date/time string
 */
export function getLocalizedTime(date = new Date()) {
    return date.toLocaleString();
}
