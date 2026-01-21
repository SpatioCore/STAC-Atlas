const request = require('supertest');
const app = require('../app');
const { logger } = require('../utils/logger');
const fs = require('fs');
const path = require('path');

describe('Structured Logging Tests', () => {
  const logsDir = path.join(__dirname, '..', 'logs');
  const combinedLogPath = path.join(logsDir, 'combined.log');
  const errorLogPath = path.join(logsDir, 'error.log');

  beforeAll(() => {
    // Ensure logs directory exists
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
  });

  describe('Log Files', () => {
    test('should create logs directory', () => {
      expect(fs.existsSync(logsDir)).toBe(true);
    });

    test('should create combined.log file after requests', async () => {
      await request(app)
        .get('/')
        .expect(200);

      // Wait a bit for file write
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(fs.existsSync(combinedLogPath)).toBe(true);
    });
  });

  describe('HTTP Request Logging', () => {
    test('should log incoming requests', async () => {
      const beforeSize = fs.existsSync(combinedLogPath) 
        ? fs.statSync(combinedLogPath).size 
        : 0;

      await request(app)
        .get('/collections?limit=1')
        .expect(200);

      // Wait for log write
      await new Promise(resolve => setTimeout(resolve, 100));

      const afterSize = fs.statSync(combinedLogPath).size;
      expect(afterSize).toBeGreaterThan(beforeSize);
    });

    test('should include request ID in logs', async () => {
      const customRequestId = 'test-request-id-12345';

      await request(app)
        .get('/')
        .set('X-Request-ID', customRequestId);

      // Wait for log write
      await new Promise(resolve => setTimeout(resolve, 100));

      const logContent = fs.readFileSync(combinedLogPath, 'utf8');
      expect(logContent).toContain(customRequestId);
    });

    test('should log HTTP method and URL', async () => {
      const testPath = '/collections?limit=5';

      await request(app)
        .get(testPath)
        .expect(200);

      // Wait for log write
      await new Promise(resolve => setTimeout(resolve, 100));

      const logContent = fs.readFileSync(combinedLogPath, 'utf8');
      expect(logContent).toContain('GET');
      expect(logContent).toContain(testPath);
    });

    test('should log response status code', async () => {
      await request(app)
        .get('/nonexistent-route')
        .expect(404);

      // Wait for log write
      await new Promise(resolve => setTimeout(resolve, 100));

      const logContent = fs.readFileSync(combinedLogPath, 'utf8');
      expect(logContent).toContain('404');
    });
  });

  describe('Error Logging', () => {
    test('should log 404 errors separately', async () => {
      const beforeSize = fs.existsSync(combinedLogPath) 
        ? fs.statSync(combinedLogPath).size 
        : 0;

      await request(app)
        .get('/this-does-not-exist')
        .expect(404);

      // Wait for log write
      await new Promise(resolve => setTimeout(resolve, 100));

      const afterSize = fs.statSync(combinedLogPath).size;
      expect(afterSize).toBeGreaterThan(beforeSize);
    });

    test('should log 400 validation errors', async () => {
      await request(app)
        .get('/collections?limit=-1')
        .expect(400);

      // Wait for log write
      await new Promise(resolve => setTimeout(resolve, 100));

      const logContent = fs.readFileSync(combinedLogPath, 'utf8');
      expect(logContent).toContain('400');
    });
  });

  describe('Log Format', () => {
    test('should write JSON formatted logs', async () => {
      await request(app)
        .get('/')
        .expect(200);

      // Wait for log write
      await new Promise(resolve => setTimeout(resolve, 200));

      const logContent = fs.readFileSync(combinedLogPath, 'utf8');
      const lastLogLine = logContent.trim().split('\n').pop();

      // Should be valid JSON
      expect(() => JSON.parse(lastLogLine)).not.toThrow();
    });

    test('should include timestamp in logs', async () => {
      await request(app)
        .get('/')
        .expect(200);

      // Wait for log write
      await new Promise(resolve => setTimeout(resolve, 100));

      const logContent = fs.readFileSync(combinedLogPath, 'utf8');
      const lastLogLine = logContent.trim().split('\n').pop();
      const logEntry = JSON.parse(lastLogLine);

      expect(logEntry.timestamp).toBeDefined();
    });

    test('should include service name in logs', async () => {
      await request(app)
        .get('/')
        .expect(200);

      // Wait for log write
      await new Promise(resolve => setTimeout(resolve, 100));

      const logContent = fs.readFileSync(combinedLogPath, 'utf8');
      const lastLogLine = logContent.trim().split('\n').pop();
      const logEntry = JSON.parse(lastLogLine);

      expect(logEntry.service).toBe('stac-atlas-api');
    });
  });

  describe('Log Levels', () => {
    test('should log at different levels based on status code', async () => {
      // Success - http level
      await request(app)
        .get('/')
        .expect(200);

      // Client error - warn level
      await request(app)
        .get('/collections?limit=-1')
        .expect(400);

      // Wait for log writes
      await new Promise(resolve => setTimeout(resolve, 200));

      const logContent = fs.readFileSync(combinedLogPath, 'utf8');
      expect(logContent).toContain('"level":"http"');
      expect(logContent).toContain('"level":"warn"');
    });
  });
});
