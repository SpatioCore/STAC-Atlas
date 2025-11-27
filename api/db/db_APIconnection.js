const { Pool } = require('pg');
require('dotenv').config();

// PostgreSQL/PostGIS database connection
const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// execute query 
async function query(text, params = []) {
  try {
    return await pool.query(text, params);
  } catch (error) {
    console.error('database error:', error.message);
    throw error;
  }
}

// connection test
async function testConnection() {
  try {
    await query('SELECT 1');
    console.log('✓ database connection successful');
    return true;
  } catch (error) {
    console.error('✗ connection failed:', error.message);
    return false;
  }
}

// PostGIS: Bounding Box Query
// @param {string} table - table name
// @param {Array} bbox - [west, south, east, north]
// @param {string} geomColumn - name of the geometry column (default: spatial_extend)
// @returns {Promise} query result
async function queryByBBox(table, bbox, geomColumn = 'spatial_extend') {
  const [west, south, east, north] = bbox;
  const sql = `
    SELECT * FROM ${table}
    WHERE ST_Intersects(
      ${geomColumn},
      ST_MakeEnvelope($1, $2, $3, $4, 4326)
    )
  `;
  return await query(sql, [west, south, east, north]);
}

// PostGIS: Geometry Query
// @param {string} table - table name
// @param {Object} geojson - GeoJSON Geometry
// @param {string} predicate - Spatial Predicate (intersects, contains, within)
// @param {string} geomColumn - name of the geometry column (default: spatial_extend)
// @returns {Promise} query result
async function queryByGeometry(table, geojson, predicate = 'intersects', geomColumn = 'spatial_extend') {
  const predicates = {
    intersects: 'ST_Intersects',
    contains: 'ST_Contains',
    within: 'ST_Within'
  };
  
  const func = predicates[predicate] || 'ST_Intersects';
  const sql = `
    SELECT * FROM ${table}
    WHERE ${func}(
      ${geomColumn},
      ST_SetSRID(ST_GeomFromGeoJSON($1), 4326)
    )
  `;
  return await query(sql, [JSON.stringify(geojson)]);
}

// PostGIS: Distance Query
// @param {string} table - table name
// @param {Array} point - [lon, lat]
// @param {number} distance - distance in meters
// @param {string} geomColumn - name of the geometry column (default: spatial_extend)
// @returns {Promise} query result
async function queryByDistance(table, point, distance, geomColumn = 'spatial_extend') {
  const [lon, lat] = point;
  const sql = `
    SELECT *, 
      ST_Distance(${geomColumn}::geography, ST_SetSRID(ST_Point($1, $2), 4326)::geography) as distance
    FROM ${table}
    WHERE ST_DWithin(
      ${geomColumn}::geography,
      ST_SetSRID(ST_Point($1, $2), 4326)::geography,
      $3
    )
    ORDER BY distance
  `;
  return await query(sql, [lon, lat, distance]);
}

// close connection
async function closePool() {
  await pool.end();
}

module.exports = {
  pool,
  query,
  testConnection,

  // PostGIS functions
  queryByBBox,
  queryByGeometry,
  queryByDistance
};
