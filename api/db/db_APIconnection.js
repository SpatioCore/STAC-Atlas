const { Pool } = require('pg');
require('dotenv').config();

/**
 * PostgreSQL/PostGIS Datenbankverbindung
 */

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

/**
 * Query ausführen
 */
async function query(text, params = []) {
  return await pool.query(text, params);
}

/**
 * Verbindungstest
 */
async function testConnection() {
  try {
    await query('SELECT 1');
    console.log('✓ Datenbankverbindung erfolgreich');
    return true;
  } catch (error) {
    console.error('✗ Verbindung fehlgeschlagen:', error.message);
    return false;
  }
}

/**
 * Verbindungen schließen
 */
async function closePool() {
  await pool.end();
}

module.exports = {
  pool,
  query,
  testConnection,
  closePool
};
