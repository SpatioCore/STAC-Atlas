/**
 * Extended Tests for Global Error Handler Middleware
 * Tests error handling paths for different status codes
 */

const express = require('express');
const request = require('supertest');
const { globalErrorHandler } = require('../middleware/errorHandler');
const { requestIdMiddleware } = require('../middleware/requestId');

// Create test app with error handler
function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use(requestIdMiddleware);
  
  // Routes that throw different errors
  app.get('/error/400', (req, res, next) => {
    const error = new Error('Bad request error');
    error.status = 400;
    error.code = 'CustomBadRequest';
    next(error);
  });

  app.get('/error/401', (req, res, next) => {
    const error = new Error('Unauthorized');
    error.status = 401;
    next(error);
  });

  app.get('/error/404', (req, res, next) => {
    const error = new Error('Not found');
    error.status = 404;
    next(error);
  });

  app.get('/error/500', (req, res, next) => {
    const error = new Error('Internal server error');
    error.status = 500;
    next(error);
  });

  app.get('/error/501', (req, res, next) => {
    const error = new Error('Not implemented');
    error.status = 501;
    next(error);
  });

  app.get('/error/503', (req, res, next) => {
    const error = new Error('Service unavailable');
    error.status = 503;
    next(error);
  });

  app.get('/error/unknown', (req, res, next) => {
    const error = new Error('Unknown error');
    // No status set - should default to 500
    next(error);
  });

  app.get('/error/statusCode', (req, res, next) => {
    const error = new Error('Error with statusCode property');
    error.statusCode = 422;
    next(error);
  });

  app.use(globalErrorHandler);
  
  return app;
}

describe('Global Error Handler - Extended Tests', () => {
  let app;

  beforeEach(() => {
    app = createTestApp();
  });

  describe('Status Code Handling', () => {
    test('should handle 400 errors with custom code', async () => {
      const res = await request(app)
        .get('/error/400')
        .expect(400);

      expect(res.body).toHaveProperty('status', 400);
      expect(res.body).toHaveProperty('code', 'CustomBadRequest');
    });

    test('should handle 401 errors', async () => {
      const res = await request(app)
        .get('/error/401')
        .expect(401);

      expect(res.body).toHaveProperty('status', 401);
    });

    test('should handle 404 errors', async () => {
      const res = await request(app)
        .get('/error/404')
        .expect(404);

      expect(res.body).toHaveProperty('status', 404);
      expect(res.body.code).toBe('NotFound');
    });

    test('should handle 500 errors', async () => {
      const res = await request(app)
        .get('/error/500')
        .expect(500);

      expect(res.body).toHaveProperty('status', 500);
      expect(res.body.code).toBe('InternalServerError');
    });

    test('should handle 501 errors', async () => {
      const res = await request(app)
        .get('/error/501')
        .expect(501);

      expect(res.body).toHaveProperty('status', 501);
      expect(res.body.code).toBe('NotImplemented');
    });

    test('should handle 503 errors', async () => {
      const res = await request(app)
        .get('/error/503')
        .expect(503);

      expect(res.body).toHaveProperty('status', 503);
      expect(res.body.code).toBe('ServiceUnavailable');
    });

    test('should default to 500 for errors without status', async () => {
      const res = await request(app)
        .get('/error/unknown')
        .expect(500);

      expect(res.body).toHaveProperty('status', 500);
    });

    test('should use statusCode property if status is not set', async () => {
      const res = await request(app)
        .get('/error/statusCode')
        .expect(422);

      expect(res.body).toHaveProperty('status', 422);
    });
  });

  describe('Request ID in Errors', () => {
    test('should include generated request ID', async () => {
      const res = await request(app)
        .get('/error/400')
        .expect(400);

      expect(res.body).toHaveProperty('requestId');
      expect(res.body.requestId).toMatch(/^[0-9a-f-]+$/i);
    });

    test('should use provided request ID', async () => {
      const customId = 'custom-error-id-123';
      
      const res = await request(app)
        .get('/error/400')
        .set('X-Request-ID', customId)
        .expect(400);

      expect(res.body.requestId).toBe(customId);
    });
  });

  describe('Instance Path', () => {
    test('should include request path in error response', async () => {
      const res = await request(app)
        .get('/error/400')
        .expect(400);

      expect(res.body).toHaveProperty('instance', '/error/400');
    });
  });

  describe('Development vs Production', () => {
    const originalEnv = process.env.NODE_ENV;

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
    });

    test('should include stack trace in development for 500 errors', async () => {
      process.env.NODE_ENV = 'development';
      const devApp = createTestApp();

      const res = await request(devApp)
        .get('/error/500')
        .expect(500);

      expect(res.body).toHaveProperty('stack');
    });

    test('should not include stack trace in production', async () => {
      process.env.NODE_ENV = 'production';
      const prodApp = createTestApp();

      const res = await request(prodApp)
        .get('/error/500')
        .expect(500);

      expect(res.body).not.toHaveProperty('stack');
    });
  });
});
