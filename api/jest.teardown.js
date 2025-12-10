// jest.teardown.js
// Global teardown to close database connections after all tests

const { closePool } = require('./db/db_APIconnection');

module.exports = async () => {
  // Close the database connection pool
  try {
    await closePool();
    console.log('Jest teardown: Database pool closed successfully');
  } catch (error) {
    console.error('Jest teardown: Error closing database pool:', error.message);
  }
};
