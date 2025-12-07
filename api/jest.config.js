module.exports = {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'routes/**/*.js',
    'controllers/**/*.js',
    'services/**/*.js',
    '!node_modules/**'
  ],
  testMatch: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js'],
  verbose: true,
  // Global teardown to close database connections
  globalTeardown: './jest.teardown.js',
  // Force exit after tests to prevent hanging
  forceExit: true,
  // Detect open handles (useful for debugging)
  detectOpenHandles: false
};
