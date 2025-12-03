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
  // Test database connection
  const client = await pool.connect();
  try {
    await client.query('SELECT 1');
    console.log('DB connection established successfully');
  } finally {
    client.release();
  }
}

/**
 * Insert or update a catalog in the database
 * @param {Object} catalog - STAC catalog object
 * @returns {Promise<number>} catalog ID
 */
async function insertOrUpdateCatalog(catalog) {
  if (!catalog || typeof catalog !== 'object') return null;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Check if catalog exists by title (fallback since no unique URL/ID in DB schema)
    const checkQuery = 'SELECT id FROM catalog WHERE title = $1 LIMIT 1';
    const checkResult = await client.query(checkQuery, [catalog.title || catalog.id]);
    
    let catalogId;

    if (checkResult.rows.length > 0) {
      // Update existing catalog
      catalogId = checkResult.rows[0].id;
      const updateQuery = `
        UPDATE catalog SET
          stac_version = $1,
          type = $2,
          description = $3,
          updated_at = now()
        WHERE id = $4
        RETURNING id;
      `;
      await client.query(updateQuery, [
        catalog.stac_version || null,
        catalog.type || 'Catalog',
        catalog.description || null,
        catalogId
      ]);
    } else {
      // Insert new catalog
      const insertQuery = `
        INSERT INTO catalog (stac_version, type, title, description, updated_at)
        VALUES ($1, $2, $3, $4, now())
        RETURNING id;
      `;
      const insertResult = await client.query(insertQuery, [
        catalog.stac_version || null,
        catalog.type || 'Catalog',
        catalog.title || catalog.id || null,
        catalog.description || null
      ]);
      catalogId = insertResult.rows[0].id;
    }

    // Insert links
    if (catalog.links && Array.isArray(catalog.links)) {
      await client.query('DELETE FROM catalog_links WHERE catalog_id = $1', [catalogId]);
      for (const link of catalog.links) {
        await client.query(
          'INSERT INTO catalog_links (catalog_id, rel, href, type, title) VALUES ($1, $2, $3, $4, $5)',
          [catalogId, link.rel, link.href, link.type || null, link.title || null]
        );
      }
    }

    // Insert keywords
    if (catalog.keywords && Array.isArray(catalog.keywords)) {
      await insertKeywords(client, catalogId, catalog.keywords, 'catalog');
    }

    // Insert STAC extensions
    if (catalog.stac_extensions && Array.isArray(catalog.stac_extensions)) {
      await insertStacExtensions(client, catalogId, catalog.stac_extensions, 'catalog');
    }

    // Update crawl log
    await client.query('DELETE FROM crawllog_catalog WHERE catalog_id = $1', [catalogId]);
    await client.query(
      `INSERT INTO crawllog_catalog (catalog_id, last_crawled)
       VALUES ($1, now())`,
      [catalogId]
    );

    await client.query('COMMIT');
    return catalogId;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error inserting catalog:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Insert or update a collection in the database
 * @param {Object} collection - STAC collection object
 * @returns {Promise<number>} collection ID
 */
async function insertOrUpdateCollection(collection) {
  if (!collection || typeof collection !== 'object') return null;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Parse spatial extent (bbox)
    let spatialExtend = null;
    if (collection.extent?.spatial?.bbox && collection.extent.spatial.bbox[0]) {
      const bbox = collection.extent.spatial.bbox[0];
      if (bbox.length === 4) {
        // Create polygon from bbox [west, south, east, north]
        spatialExtend = `EPSG:4326;POLYGON((${bbox[0]} ${bbox[1]}, ${bbox[2]} ${bbox[1]}, ${bbox[2]} ${bbox[3]}, ${bbox[0]} ${bbox[3]}, ${bbox[0]} ${bbox[1]}))`;
      }
    }

    // Parse temporal extent
    let temporalStart = null;
    let temporalEnd = null;
    if (collection.extent?.temporal?.interval && collection.extent.temporal.interval[0]) {
      const interval = collection.extent.temporal.interval[0];
      temporalStart = interval[0] ? new Date(interval[0]) : null;
      temporalEnd = interval[1] ? new Date(interval[1]) : null;
    }

    // Check if collection exists using ID from full_json (since no unique ID column in table)
    const checkQuery = `SELECT id FROM collection WHERE full_json->>'id' = $1 LIMIT 1`;
    // Try to get ID from collection object directly or fall back to title if necessary
    const collectionStacId = collection.id || collection.title;
    const checkResult = await client.query(checkQuery, [collectionStacId]);

    let collectionId;

    if (checkResult.rows.length > 0) {
       // Update existing collection
       collectionId = checkResult.rows[0].id;
       const updateQuery = `
        UPDATE collection SET
          stac_version = $1,
          type = $2,
          title = $3,
          description = $4,
          license = $5,
          spatial_extend = ST_GeomFromEWKT($6),
          temporal_extend_start = $7,
          temporal_extend_end = $8,
          is_api = $9,
          is_active = $10,
          full_json = $11,
          updated_at = now()
        WHERE id = $12
        RETURNING id;
      `;
       await client.query(updateQuery, [
        collection.stac_version || null,
        collection.type || 'Collection',
        collection.title || collection.id || null,
        collection.description || null,
        collection.license || null,
        spatialExtend,
        temporalStart,
        temporalEnd,
        false, // is_api - will be determined by crawler
        true, // is_active
        JSON.stringify(collection),
        collectionId
      ]);
    } else {
      // Insert new collection
      const insertQuery = `
        INSERT INTO collection (
          stac_version, type, title, description, license,
          spatial_extend, temporal_extend_start, temporal_extend_end,
          is_api, is_active, full_json, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, ST_GeomFromEWKT($6), $7, $8, $9, $10, $11, $12, now())
        RETURNING id;
      `;
      const insertResult = await client.query(insertQuery, [
        collection.stac_version || null,
        collection.type || 'Collection',
        collection.title || collection.id || null,
        collection.description || null,
        collection.license || null,
        spatialExtend,
        temporalStart,
        temporalEnd,
        false, // is_api - will be determined by crawler
        true, // is_active
        JSON.stringify(collection)
      ]);
      collectionId = insertResult.rows[0].id;
    }

    // Insert summaries
    if (collection.summaries && typeof collection.summaries === 'object') {
      await client.query('DELETE FROM collection_summaries WHERE collection_id = $1', [collectionId]);
      for (const [name, value] of Object.entries(collection.summaries)) {
        await insertSummary(client, collectionId, name, value);
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
    await client.query('DELETE FROM crawllog_collection WHERE collection_id = $1', [collectionId]);
    await client.query(
      `INSERT INTO crawllog_collection (collection_id, last_crawled)
       VALUES ($1, now())`,
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
    `DELETE FROM ${type}_stac_extensions WHERE ${type}_id = $1`,
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
async function insertSummary(client, collectionId, name, value) {
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
    'INSERT INTO collection_summaries (collection_id, name, kind, range_min, range_max, set_value, json_schema) VALUES ($1, $2, $3, $4, $5, $6, $7)',
    [collectionId, name, kind, rangeMin, rangeMax, setValue, jsonSchema]
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
