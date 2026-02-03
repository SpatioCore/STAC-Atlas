#!/usr/bin/env node
/**
 * Script to fetch providers and licenses from the API and write to a static file.
 * This file is served by the UI and used to populate filter dropdowns.
 * 
 * Fetches all collections and extracts unique provider names and licenses.
 * 
 * Usage:
 *   node scripts/update-queryables.js [--watch]
 * 
 * Options:
 *   --watch    Run continuously, updating every 15 minutes
 * 
 * Environment:
 *   VITE_API_BASE_URL - API base URL (default: http://localhost:3000)
 */

import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = join(__dirname, '../public/data/queryables.json');
const API_BASE_URL = process.env.VITE_API_BASE_URL || 'http://localhost:3000';
const UPDATE_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Fetch all collections from the API
 * Uses a high limit to get all collections in one request
 */
async function fetchAllCollections() {
  try {
    // Fetch with a high limit to get all collections
    const response = await fetch(`${API_BASE_URL}/collections?limit=10000`);
    if (!response.ok) {
      throw new Error(`Failed to fetch collections: ${response.statusText}`);
    }
    const data = await response.json();
    return data.collections || [];
  } catch (error) {
    console.error('Error fetching collections:', error.message);
    return null;
  }
}

/**
 * Extract unique provider names from collections
 */
function extractProviders(collections) {
  const providerSet = new Set();
  
  for (const collection of collections) {
    const providers = collection.providers || [];
    for (const provider of providers) {
      if (provider.name) {
        providerSet.add(provider.name);
      }
    }
  }
  
  return Array.from(providerSet).sort();
}

/**
 * Extract unique licenses from collections
 */
function extractLicenses(collections) {
  const licenseSet = new Set();
  
  for (const collection of collections) {
    if (collection.license) {
      licenseSet.add(collection.license);
    }
  }
  
  return Array.from(licenseSet).sort();
}

/**
 * Update the static queryables file
 */
async function updateQueryables() {
  console.log(`[${new Date().toISOString()}] Fetching collections from ${API_BASE_URL}...`);
  
  const collections = await fetchAllCollections();

  if (collections === null) {
    console.error('Failed to fetch collections. Keeping existing file.');
    return false;
  }

  const providers = extractProviders(collections);
  const licenses = extractLicenses(collections);

  const data = {
    providers,
    licenses,
    lastUpdated: new Date().toISOString()
  };

  // Ensure directory exists
  const dir = dirname(OUTPUT_PATH);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  writeFileSync(OUTPUT_PATH, JSON.stringify(data, null, 2));
  console.log(`[${new Date().toISOString()}] Updated queryables.json:`);
  console.log(`  - ${collections.length} collections processed`);
  console.log(`  - ${providers.length} unique providers`);
  console.log(`  - ${licenses.length} unique licenses`);
  
  return true;
}

/**
 * Main entry point
 */
async function main() {
  const watchMode = process.argv.includes('--watch');

  // Initial update
  await updateQueryables();

  if (watchMode) {
    console.log(`\nRunning in watch mode. Updating every ${UPDATE_INTERVAL_MS / 60000} minutes.`);
    console.log('Press Ctrl+C to stop.\n');
    
    setInterval(async () => {
      await updateQueryables();
    }, UPDATE_INTERVAL_MS);
  }
}

main().catch(console.error);
