#!/usr/bin/env node
/**
 * Script to fetch providers and licenses from the API and write to a static file.
 * This file is served by the UI and used to populate filter dropdowns.
 * 
 * Fetches from /collection-queryables endpoint which returns enum values in the JSON Schema:
 * - properties.license.enum - array of license values
 * - properties.providers.items.properties.name.enum - array of provider names
 * 
 * Usage:
 *   node scripts/update-queryables.js [--watch]
 * 
 * Options:
 *   --watch    Run continuously, updating every 24 hours
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
const UPDATE_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Fetch queryables from the /collection-queryables endpoint
 * The endpoint returns enum values embedded in the JSON Schema:
 * - properties.license.enum - array of license values
 * - properties.providers.items.properties.name.enum - array of provider names
 */
async function fetchQueryablesFromAPI() {
  try {
    console.log(`[${new Date().toISOString()}] Fetching from ${API_BASE_URL}/collection-queryables...`);
    
    const response = await fetch(`${API_BASE_URL}/collection-queryables`);
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Extract enums from the JSON Schema structure
    const licenses = data.properties?.license?.enum || [];
    const providers = data.properties?.providers?.items?.properties?.name?.enum || [];
    
    if (licenses.length === 0 && providers.length === 0) {
      console.warn('Warning: No enum values found in API response. API may need to be restarted with latest code.');
    }
    
    return { providers, licenses };
  } catch (error) {
    console.error('Error fetching from API:', error.message);
    return null;
  }
}

/**
 * Update the static queryables file
 */
async function updateQueryables() {
  const result = await fetchQueryablesFromAPI();

  if (result === null) {
    console.error('Failed to fetch queryables. Keeping existing file.');
    return false;
  }

  const data = {
    providers: result.providers,
    licenses: result.licenses,
    lastUpdated: new Date().toISOString()
  };

  // Ensure directory exists
  const dir = dirname(OUTPUT_PATH);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  writeFileSync(OUTPUT_PATH, JSON.stringify(data, null, 2));
  console.log(`[${new Date().toISOString()}] Updated queryables.json:`);
  console.log(`  - ${result.providers.length} unique providers`);
  console.log(`  - ${result.licenses.length} unique licenses`);
  console.log(`  - Output: ${OUTPUT_PATH}`);
  
  return true;
}

/**
 * Main entry point
 */
async function main() {
  const watchMode = process.argv.includes('--watch');

  // Initial update
  const success = await updateQueryables();

  if (watchMode) {
    console.log(`\nRunning in watch mode. Updating every 24 hours.`);
    console.log('Press Ctrl+C to stop.\n');
    
    setInterval(async () => {
      await updateQueryables();
    }, UPDATE_INTERVAL_MS);
  } else if (success) {
    console.log('\nDone. Run with --watch for continuous updates.');
  }
}

main().catch(console.error);
