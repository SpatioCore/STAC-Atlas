
const { testConnection, queryByBBox, closePool } = require('../db/db_APIconnection');

async function main() {
  console.log('=== database connection test ===\n');
  
  // show connection parameters (without password)
  console.log('connection parameters:');
  console.log('  host:', process.env.DB_HOST);
  console.log('  port:', process.env.DB_PORT);
  console.log('  database:', process.env.DB_NAME);
  console.log('  user:', process.env.DB_USER);
  console.log('  password: ********');
  console.log('');
  
  // test connection
  const connected = await testConnection();
  
  // close connections
  await closePool();
  
  process.exit(connected ? 0 : 1);
}

async function testPostGIS() {
  console.log('=== PostGIS function test ===\n');
  
  // connection test
  const connected = await testConnection();
  if (!connected) {
    process.exit(1);
  }
  
  console.log('\t tests PostGIS Bounding Box Query...');
  try {
    // example: Worldwide Bounding Box
    const result = await queryByBBox('collection', [-180, -90, 180, 90]);
    console.log(`${result.rowCount} collections found`);
  } catch (error) {
    console.error('✗ PostGIS test failed:', error.message);
  }
  
  await closePool();
}

testPostGIS().catch(console.error);

main().catch(error => {
  console.error('error:', error);
  process.exit(1);
});
