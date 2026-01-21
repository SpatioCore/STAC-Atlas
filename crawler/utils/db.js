/**
 * DB helper for crawler using `pg` Pool
 * Exposes: initDb(), insertOrUpdateCatalog(), close()
 */
import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  host: process.env.PGHOST,
  port: parseInt(process.env.PGPORT, 10),
  user: process.env.PGUSER ,
  password: process.env.PGPASSWORD ,
  database: process.env.PGDATABASE ,
  max: 10,
});

async function initDb() {
  const host = process.env.PGHOST;
  const port = parseInt(process.env.PGPORT, 10);
  const database = process.env.PGDATABASE;
  const user = process.env.PGUSER;
  
  // Test database connection
  let client;
  try {
    client = await pool.connect();
    await client.query('SELECT 1');
    console.log(`DB connection established successfully to ${host}:${port}/${database}`);
  } catch (error) {
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('DATABASE CONNECTION FAILED');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error(`  Host:     ${host}`);
    console.error(`  Port:     ${port}`);
    console.error(`  Database: ${database}`);
    console.error(`  User:     ${user}`);
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error(`  Error:    ${error.message}`);
    if (error.code) {
      console.error(`  Code:     ${error.code}`);
    }
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    throw error;
  } finally {
    if (client) {
      client.release();
    }
  }
}

/**
 * Process a catalog for traversal only - catalogs are not saved to database
 * Only collections are saved. Catalogs are only used to traverse deeper into the tree.
 * @param {Object} catalog - STAC catalog object
 * @returns {Promise<null>} always returns null (no catalog saved)
 */
async function insertOrUpdateCatalog(catalog) {
  if (!catalog || typeof catalog !== 'object') return null;
  
  // Catalogs are not saved to database - only used for tree traversal
  // Only collections will be saved
  console.log(`Skipping catalog save (used for traversal only): ${catalog.title || catalog.id}`);
  
  return null;
}

/**
 * Insert or update a collection in the database
 * @param {Object} collection - STAC collection object
 * @returns {Promise<number>} collection ID
 */
async function insertOrUpdateCollection(collection) {


  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Parse spatial extent (bbox)
    // Support both normalized format (bbox) and original STAC format (extent.spatial.bbox)
    let spatialExtent = null;
    let bbox = null;
    
    // Try normalized format first (from normalizeCollection)
    if (collection.bbox && Array.isArray(collection.bbox)) {
      bbox = collection.bbox;
    }
    // Fallback to original STAC format
    else if (collection.extent?.spatial?.bbox && collection.extent.spatial.bbox[0]) {
      bbox = collection.extent.spatial.bbox[0];
    }
    
    if (bbox && bbox.length === 4) {
      // Create polygon from bbox [west, south, east, north]
      // EWKT format requires SRID=4326, not EPSG:4326
      spatialExtent = `SRID=4326;POLYGON((${bbox[0]} ${bbox[1]}, ${bbox[2]} ${bbox[1]}, ${bbox[2]} ${bbox[3]}, ${bbox[0]} ${bbox[3]}, ${bbox[0]} ${bbox[1]}))`;
    }

    // Parse temporal extent
    // Support both normalized format (temporal) and original STAC format (extent.temporal.interval)
    let temporalStart = null;
    let temporalEnd = null;
    let interval = null;
    
    // Try normalized format first (from normalizeCollection)
    if (collection.temporal && Array.isArray(collection.temporal)) {
      interval = collection.temporal;
    }
    // Fallback to original STAC format
    else if (collection.extent?.temporal?.interval && collection.extent.temporal.interval[0]) {
      interval = collection.extent.temporal.interval[0];
    }
    
    if (interval) {
      temporalStart = interval[0] ? new Date(interval[0]) : null;
      temporalEnd = interval[1] ? new Date(interval[1]) : null;
    }

    // Insert or update collection
    const collectionTitle = collection.title || collection.id || 'Unnamed Collection';
    const stacId = collection.id || null;
    
    // Extract source URL from links (prefer 'self', fallback to 'root')
    let sourceUrl = null;
    if (collection.links && Array.isArray(collection.links)) {
      const selfLink = collection.links.find(link => link.rel === 'self');
      const rootLink = collection.links.find(link => link.rel === 'root');
      sourceUrl = selfLink?.href || rootLink?.href || null;
    }
    
    // Check if collection with this title already exists
    const existingCollection = await client.query(
      'SELECT id FROM collection WHERE title = $1',
      [collectionTitle]
    );
    
    let collectionId;
    if (existingCollection.rows.length > 0) {
      // Update existing collection
      collectionId = existingCollection.rows[0].id;
      await client.query(
        `UPDATE collection SET 
          stac_id = $1,
          stac_version = $2,
          type = $3,
          description = $4,
          license = $5,
          spatial_extent = ST_GeomFromEWKT($6),
          temporal_extent_start = $7,
          temporal_extent_end = $8,
          is_api = $9,
          is_active = $10,
          full_json = $11,
          updated_at = now()
         WHERE id = $12`,
        [
          stacId,
          collection.stac_version || null,
          collection.type || 'Collection',
          collection.description || null,
          collection.license || null,
          spatialExtent,
          temporalStart,
          temporalEnd,
          false, // is_api - will be determined by crawler
          true, // is_active
          JSON.stringify(collection),
          collectionId
        ]
      );
    } else {
      // Insert new collection
      const collectionResult = await client.query(
        `INSERT INTO collection (
          stac_id, stac_version, type, title, description, license,
          spatial_extent, temporal_extent_start, temporal_extent_end,
          is_api, is_active, full_json, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, ST_GeomFromEWKT($7), $8, $9, $10, $11, $12, now())
        RETURNING id`,
        [
          stacId,
          collection.stac_version || null,
          collection.type || 'Collection',
          collectionTitle,
          collection.description || null,
          collection.license || null,
          spatialExtent,
          temporalStart,
          temporalEnd,
          false, // is_api - will be determined by crawler
          true, // is_active
          JSON.stringify(collection)
        ]
      );
      collectionId = collectionResult.rows[0].id;
    }

    // Insert summaries
    if (collection.summaries && typeof collection.summaries === 'object') {
      await client.query('DELETE FROM collection_summaries WHERE collection_id = $1', [collectionId]);
      for (const [name, value] of Object.entries(collection.summaries)) {
        await insertSummary(client, collectionId, name, value, sourceUrl);
      }
    }

    // Insert keywords
    if (collection.keywords && Array.isArray(collection.keywords)) {
      await insertKeywords(client, collectionId, collection.keywords, 'collection');
    }

    // Insert STAC extensions
    if (collection.stac_extensions && Array.isArray(collection.stac_extensions)) {
      await insertStacExtensions(client, collectionId, collection.stac_extensions, 'collection');
    }

    // Insert providers
    if (collection.providers && Array.isArray(collection.providers)) {
      await insertProviders(client, collectionId, collection.providers);
    }

    // Insert assets
    if (collection.assets && typeof collection.assets === 'object') {
      await insertAssets(client, collectionId, collection.assets);
    }

    // Update crawl log
    await client.query(
      'DELETE FROM crawllog_collection WHERE collection_id = $1',
      [collectionId]
    );
    await client.query(
      'INSERT INTO crawllog_collection (collection_id, last_crawled) VALUES ($1, now())',
      [collectionId]
    );

    await client.query('COMMIT');
    return collectionId;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error inserting collection:', error.message);
    throw error;
  } finally {
    client.release();
  }
}



/**
 * Helper function to insert keywords
 */
async function insertKeywords(client, parentId, keywords, type) {
  await client.query(
    `DELETE FROM ${type}_keywords WHERE ${type}_id = $1`,
    [parentId]
  );

  for (const keyword of keywords) {
    if (!keyword) continue;
    
    // Insert keyword if not exists
    const keywordResult = await client.query(
      'INSERT INTO keywords (keyword) VALUES ($1) ON CONFLICT (keyword) DO UPDATE SET keyword = EXCLUDED.keyword RETURNING id',
      [keyword]
    );
    const keywordId = keywordResult.rows[0].id;

    // Link keyword to parent
    await client.query(
      `INSERT INTO ${type}_keywords (${type}_id, keyword_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [parentId, keywordId]
    );
  }
}

/**
 * Helper function to insert STAC extensions
 */
async function insertStacExtensions(client, parentId, extensions, type) {
  await client.query(
    `DELETE FROM ${type}_stac_extension WHERE ${type}_id = $1`,
    [parentId]
  );

   for (const extension of extensions) {
    if (!extension) continue;

    // Insert extension if not exists
    const extResult = await client.query(
      'INSERT INTO stac_extensions (stac_extension) VALUES ($1) ON CONFLICT (stac_extension) DO UPDATE SET stac_extension = EXCLUDED.stac_extension RETURNING id',
      [extension]
    );
    const extId = extResult.rows[0].id;

    // Link extension to parent
    await client.query(
      `INSERT INTO ${type}_stac_extension (${type}_id, stac_extension_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [parentId, extId]
    );
  }
}


/**
 * Helper function to insert collection summaries
 */
async function insertSummary(client, collectionId, name, value, sourceUrl) {
  let kind = 'unknown';
  let rangeMin = null;
  let rangeMax = null;
  let setValue = null;
  let jsonSchema = null;

  if (Array.isArray(value)) {
    if (value.length === 2 && typeof value[0] === 'number' && typeof value[1] === 'number') {
      kind = 'range';
      rangeMin = value[0];
      rangeMax = value[1];
    } else {
      kind = 'set';
      setValue = JSON.stringify(value);
    }
  } else if (typeof value === 'object') {
    kind = 'schema';
    jsonSchema = JSON.stringify(value);
  } else {
    kind = 'value';
    setValue = String(value);
  }

  await client.query(
    'INSERT INTO collection_summaries (collection_id, name, kind, source_url, range_min, range_max, set_value, json_schema) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
    [collectionId, name, kind, sourceUrl, rangeMin, rangeMax, setValue, jsonSchema]
  );
}

/**
 * Helper function to insert providers
 */
async function insertProviders(client, collectionId, providers) {
  await client.query('DELETE FROM collection_providers WHERE collection_id = $1', [collectionId]);

  for (const provider of providers) {
    if (!provider.name) continue;

    // Insert provider if not exists
    const providerResult = await client.query(
      'INSERT INTO providers (provider) VALUES ($1) ON CONFLICT (provider) DO UPDATE SET provider = EXCLUDED.provider RETURNING id',
      [provider.name]
    );
    const providerId = providerResult.rows[0].id;

    // Link provider to collection
    const roles = provider.roles ? provider.roles.join(',') : null;
    await client.query(
      'INSERT INTO collection_providers (collection_id, provider_id, collection_provider_roles) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
      [collectionId, providerId, roles]
    );
  }
}

/**
 * Helper function to insert assets
 */
async function insertAssets(client, collectionId, assets) {
  await client.query('DELETE FROM collection_assets WHERE collection_id = $1', [collectionId]);

  for (const [assetName, assetData] of Object.entries(assets)) {
    if (!assetData) continue;

    // Insert asset
    const assetResult = await client.query(
      'INSERT INTO assets (name, href, type, roles, metadata) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [
        assetName,
        assetData.href || null,
        assetData.type || null,
        assetData.roles || null,
        JSON.stringify(assetData)
      ]
    );
    const assetId = assetResult.rows[0].id;

    // Link asset to collection
    const roles = assetData.roles ? assetData.roles.join(',') : null;
    await client.query(
      'INSERT INTO collection_assets (collection_id, asset_id, collection_asset_roles) VALUES ($1, $2, $3)',
      [collectionId, assetId, roles]
    );
  }
}




async function close() {
  await pool.end();
}

export default { 
  initDb, 
  insertOrUpdateCatalog, 
  insertOrUpdateCollection,
  close, 
  pool 
};


