const { Pool } = require('pg');
require('dotenv').config();

// PostgreSQL/PostGIS database connection
// Support both DATABASE_URL and individual environment variables
let pool;

// Pool configuration with connection limits and timeouts
const poolConfig = {
  max: parseInt(process.env.DB_POOL_MAX), // Maximum number of clients in the pool
  min: parseInt(process.env.DB_POOL_MIN), // Minimum number of clients in the pool
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT), // Close time for idle clients
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT), // Waiting time before timing out
  allowExitOnIdle: false // Keep the pool alive even when all clients are idle
};

if (process.env.DATABASE_URL) {
  // Use DATABASE_URL if provided 
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,

  });
} else {
  // Fallback to individual environment variables
  const requiredEnvVars = ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')} or DATABASE_URL`);
  }

  pool = new Pool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    ...poolConfig
  });
}

// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected database pool error:', err);
});

// Handle pool connection events for monitoring
pool.on('connect', (client) => {
  console.log('New client connected to pool');
});

pool.on('acquire', (client) => {
  console.log('Client acquired from pool');
});

pool.on('remove', (client) => {
  console.log('Client removed from pool');
});

// Graceful shutdown handlers
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing database pool...');
  await closePool();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, closing database pool...');
  await closePool();
  process.exit(0);
});

// execute query 
async function query(text, params = []) {
  try {
    const result = await pool.query(text, params);
    return result;
  } catch (error) {
    // log detailed error information
    console.error('Database query error:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      query: text.substring(0, 100) + (text.length > 100 ? '...' : '')
    });
    
    // throw enhanced error
    const enhancedError = new Error(`Database query failed: ${error.message}`);
    enhancedError.code = error.code;
    enhancedError.detail = error.detail;
    enhancedError.originalError = error;
    throw enhancedError;
  }
}

// Connection test with retry logic and pool info
async function testConnection(retries = 3, delay = 2000) {
  for (let i = 0; i < retries; i++) {
    try {
      const result = await pool.query('SELECT 1 as connected, version() as version, current_database() as database');
      const poolInfo = {
        totalCount: pool.totalCount,
        idleCount: pool.idleCount,
        waitingCount: pool.waitingCount
      };
      
      console.log('✓ Database connection successful');
      console.log(`  Database: ${result.rows[0].database}`);
      console.log(`  PostgreSQL version: ${result.rows[0].version.split(',')[0]}`);
      console.log(`  Pool status: ${poolInfo.totalCount} total, ${poolInfo.idleCount} idle, ${poolInfo.waitingCount} waiting`);
      return true;
    } catch (error) {
      console.error(`✗ Connection attempt ${i + 1}/${retries} failed:`, error.message);
      
      if (i < retries - 1) {
        console.log(`  Retrying in ${delay / 1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  console.error('✗ All connection attempts failed');
  return false;
}

// Get current pool statistics
function getPoolStats() {
  return {
    total: pool.totalCount,
    idle: pool.idleCount,
    waiting: pool.waitingCount
  };
}

// PostGIS: Bounding Box Query
// @param {string} table - table name
// @param {Array} bbox - [west, south, east, north]
// @param {string} geomColumn - name of the geometry column (default: spatial_extend)
// @returns {Promise} query result
async function queryByBBox(table, bbox, geomColumn = 'spatial_extend') {
  const [west, south, east, north] = bbox;
  
  // validate bbox ranges
  if (west < -180 || west > 180 || east < -180 || east > 180) {
    throw new Error('Longitude must be between -180 and 180');
  }
  if (south < -90 || south > 90 || north < -90 || north > 90) {
    throw new Error('Latitude must be between -90 and 90');
  }
  if (west >= east) {
    throw new Error('West coordinate must be less than east coordinate');
  }
  if (south >= north) {
    throw new Error('South coordinate must be less than north coordinate');
  }
  
  try {
    const sql = `
      SELECT * FROM ${table}
      WHERE ST_Intersects(
        ${geomColumn},
        ST_MakeEnvelope($1, $2, $3, $4, 4326)
      )
    `;
    return await query(sql, [west, south, east, north]);
  } catch (error) {
    throw new Error(`BBox query failed: ${error.message}`);
  }
}

// PostGIS: Geometry Query
// @param {string} table - table name
// @param {Object} geojson - GeoJSON Geometry
// @param {string} predicate - Spatial Predicate (intersects, contains, within)
// @param {string} geomColumn - name of the geometry column (default: spatial_extend)
// @returns {Promise} query result
async function queryByGeometry(table, geojson, predicate = 'intersects', geomColumn = 'spatial_extend') {
  // validate inputs
  if (!table || typeof table !== 'string') {
    throw new Error('Table name must be a non-empty string');
  }
  if (!geojson || typeof geojson !== 'object') {
    throw new Error('GeoJSON must be a valid object');
  }
  if (!geojson.type || !geojson.coordinates) {
    throw new Error('GeoJSON must have type and coordinates properties');
  }
  
  const predicates = {
    intersects: 'ST_Intersects',
    contains: 'ST_Contains',
    within: 'ST_Within'
  };
  
  if (!predicates[predicate.toLowerCase()]) {
    throw new Error(`Invalid predicate: ${predicate}. Must be one of: ${Object.keys(predicates).join(', ')}`);
  }
  
  const func = predicates[predicate.toLowerCase()];
  
  try {
    const sql = `
      SELECT * FROM ${table}
      WHERE ${func}(
        ${geomColumn},
        ST_SetSRID(ST_GeomFromGeoJSON($1), 4326)
      )
    `;
    return await query(sql, [JSON.stringify(geojson)]);
  } catch (error) {
    throw new Error(`Geometry query failed: ${error.message}`);
  }
}

// PostGIS: Distance Query
// @param {string} table - table name
// @param {Array} point - [lon, lat]
// @param {number} distance - distance in meters
// @param {string} geomColumn - name of the geometry column (default: spatial_extend)
// @returns {Promise} query result
async function queryByDistance(table, point, distance, geomColumn = 'spatial_extend') {
  const [lon, lat] = point;
  
  // Use geometry type with ST_Centroid to avoid antipodal edge errors
  // ST_Centroid provides a single point from potentially large geometries
  const sql = `
    SELECT *, 
      ST_Distance(
        ST_Centroid(${geomColumn})::geography, 
        ST_SetSRID(ST_Point($1, $2), 4326)::geography
      ) as distance
    FROM ${table}
    WHERE ST_DWithin(
      ST_Centroid(${geomColumn})::geography,
      ST_SetSRID(ST_Point($1, $2), 4326)::geography,
      $3
    )
    ORDER BY distance
  `;
  return await query(sql, [lon, lat, distance]);
}

// close connection
async function closePool() {
  try {
    await pool.end();
    console.log('✓ Database connection pool closed');
  } catch (error) {
    console.error('Error closing database pool:', error.message);
    throw error;
  }
}

module.exports = {
  pool,
  query,
  testConnection,
  closePool,
  getPoolStats,

  // PostGIS functions
  queryByBBox,
  queryByGeometry,
  queryByDistance
};
