module.exports = {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'routes/**/*.js',
    'middleware/**/*.js',
    'utils/**/*.js',
    'config/**/*.js',
    'db/**/*.js',
    'validators/**/*.js',
    '!node_modules/**'
  ],
  testMatch: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js'],
  verbose: true,
  // Force exit after tests to prevent hanging
  forceExit: true,
  // Detect open handles (useful for debugging)
  detectOpenHandles: false,
  // Increase test timeout for slow database queries in CI
  testTimeout: 30000
};
