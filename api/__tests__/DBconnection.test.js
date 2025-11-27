
const { testConnection, queryByBBox, queryByGeometry, queryByDistance } = require('../db/db_APIconnection');

async function main() {
  console.log('=== Database Connection & PostGIS Test ===\n');
  
  // show connection parameters (without password)
  console.log('Connection parameters:');
  if (process.env.DATABASE_URL) {
    console.log('  Using DATABASE_URL');
  } else {
    console.log('  host:', process.env.DB_HOST);
    console.log('  port:', process.env.DB_PORT);
    console.log('  database:', process.env.DB_NAME);
    console.log('  user:', process.env.DB_USER);
    console.log('  password: ********');
    console.log('  ssl:', process.env.DB_SSL);
  }
  console.log('');
  
  // test connection
  console.log('1. Testing connection...');
  const connected = await testConnection();
  if (!connected) {
    process.exit(1);
  }
  console.log('');
  
  // test BBox query functionality
  console.log('2. Testing BBox query functionality...');
  try {
    const result = await queryByBBox('collection', [-180, -90, 180, 90]);
    if (result.rowCount > 0) {
      const firstRow = result.rows[0];
      if (firstRow.spatial_extend) {
        console.log(`✓ BBox query works - spatial_extend column contains geometry data`);
        console.log(`  Found ${result.rowCount} collections total`);
      } else {
        console.log('✗ spatial_extend column is empty or missing');
      }
    } else {
      console.log('✗ BBox query returned no results');
    }
  } catch (error) {
    console.error('✗ BBox query failed:', error.message);
  }
  console.log('');
  
  // test geometry query functionality
  console.log('3. Testing geometry query functionality...');
  try {
    const point = {
      type: 'Point',
      coordinates: [0, 0]
    };
    const result = await queryByGeometry('collection', point, 'intersects');
    if (result.rowCount > 0) {
      const firstRow = result.rows[0];
      if (firstRow.spatial_extend) {
        console.log(`✓ Geometry query works - spatial_extend column contains geometry data`);
        console.log(`  Found ${result.rowCount} collections total`);
      } else {
        console.log('✗ spatial_extend column is empty or missing');
      }
    } else {
      console.log('✓ Geometry query works - no matching results (expected)');
    }
  } catch (error) {
    console.error('✗ Geometry query failed:', error.message);
  }
  console.log('');
  
  // test distance query functionality
  console.log('4. Testing distance query functionality...');
  try {
    const result = await queryByDistance('collection', [0, 0], 100000);
    if (result.rowCount > 0) {
      const firstRow = result.rows[0];
      if (firstRow.spatial_extend && firstRow.distance !== undefined) {
        console.log(`✓ Distance query works - spatial_extend and distance columns present`);
        console.log(`  Found ${result.rowCount} collections total`);
      } else {
        console.log('✗ Expected columns missing in result');
      }
    } else {
      console.log('✓ Distance query works - no matching results (expected)');
    }
  } catch (error) {
    console.error('✗ Distance query failed:', error.message);
  }
  console.log('');
  
  console.log('=== All tests completed ===');
  process.exit(0);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
