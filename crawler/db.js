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

async function insertOrUpdateCatalog(catalog) {
  if (!catalog || typeof catalog !== 'object') return null;
  const catalogId = catalog.id || catalog.catalog_id || catalog.slug || null;
  if (!catalogId) return null;

  const url = catalog.url || null;
  const title = catalog.title || catalog.name || null;
  const metadata = catalog;
  const now = new Date().toISOString();

  const query = `
    INSERT INTO catalogs (catalog_id, url, title, metadata, updated_at)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (catalog_id) DO UPDATE SET
      url = EXCLUDED.url,
      title = EXCLUDED.title,
      metadata = catalogs.metadata || EXCLUDED.metadata,
      updated_at = EXCLUDED.updated_at
    RETURNING id;
  `;
  const values = [catalogId, url, title, metadata, now];
  const res = await pool.query(query, values);
  return res.rows[0];
}

async function close() {
  await pool.end();
}

module.exports = { initDb, insertOrUpdateCatalog, close, pool };


