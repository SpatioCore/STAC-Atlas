/**
 * DB helper for crawler using `pg` Pool
 * Exposes: initDb(), insertOrUpdateCatalog(), close()
 */
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: parseInt(process.env.PGPORT || '5432', 10),
  user: process.env.PGUSER || 'stac_user',
  password: process.env.PGPASSWORD || 'stac_pass',
  database: process.env.PGDATABASE || 'stac_db',
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

    // Insert or update catalog
    const catalogQuery = `
      INSERT INTO catalog (stac_version, type, title, description, updated_at)
      VALUES ($1, $2, $3, $4, now())
      ON CONFLICT ON CONSTRAINT catalog_pkey DO UPDATE SET
        stac_version = EXCLUDED.stac_version,
        type = EXCLUDED.type,
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        updated_at = now()
      RETURNING id;
    `;
    const catalogResult = await client.query(catalogQuery, [
      catalog.stac_version || null,
      catalog.type || 'Catalog',
      catalog.title || catalog.id || null,
      catalog.description || null
    ]);
    const catalogId = catalogResult.rows[0].id;

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
    await client.query(
      `INSERT INTO crawllog_catalog (catalog_id, last_crawled)
       VALUES ($1, now())
       ON CONFLICT (catalog_id) DO UPDATE SET last_crawled = now()`,
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
        spatialExtend = `SRID=4326;POLYGON((${bbox[0]} ${bbox[1]}, ${bbox[2]} ${bbox[1]}, ${bbox[2]} ${bbox[3]}, ${bbox[0]} ${bbox[3]}, ${bbox[0]} ${bbox[1]}))`;
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

    // Insert or update collection
    const collectionQuery = `
      INSERT INTO collection (
        stac_version, type, title, description, license,
        spatial_extend, temporal_extend_start, temporal_extend_end,
        is_api, is_active, full_json, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, ST_GeomFromEWKT($6), $7, $8, $9, $10, $11, now())
      ON CONFLICT ON CONSTRAINT collection_pkey DO UPDATE SET
        stac_version = EXCLUDED.stac_version,
        type = EXCLUDED.type,
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        license = EXCLUDED.license,
        spatial_extend = EXCLUDED.spatial_extend,
        temporal_extend_start = EXCLUDED.temporal_extend_start,
        temporal_extend_end = EXCLUDED.temporal_extend_end,
        is_api = EXCLUDED.is_api,
        is_active = EXCLUDED.is_active,
        full_json = EXCLUDED.full_json,
        updated_at = now()
      RETURNING id;
    `;
    const collectionResult = await client.query(collectionQuery, [
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
    const collectionId = collectionResult.rows[0].id;

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
    await client.query(
      `INSERT INTO crawllog_collection (collection_id, last_crawled)
       VALUES ($1, now())
       ON CONFLICT (collection_id) DO UPDATE SET last_crawled = now()`,
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

// TODO: Implement insertKeywords, insertStacExtensions, insertSummary, insertProviders, insertAssets functions

async function close() {
  await pool.end();
}

module.exports = { 
  initDb, 
  insertOrUpdateCatalog, 
  insertOrUpdateCollection,
  close, 
  pool 
};


