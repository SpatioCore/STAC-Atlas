const request = require('supertest');
const app = require('../app');

describe('CORS Configuration Tests', () => {
  describe('Basic CORS Headers', () => {
    test('should include CORS headers in response', async () => {
      const res = await request(app)
        .get('/')
        .set('Origin', 'http://localhost:3000')
        .expect(200);

      expect(res.headers['access-control-allow-origin']).toBeDefined();
    });

    test('should allow GET method', async () => {
      const res = await request(app)
        .get('/collections')
        .set('Origin', 'http://localhost:3000')
        .expect(200);

      expect(res.headers['access-control-allow-origin']).toBeDefined();
    });

    test('should allow POST method', async () => {
      const res = await request(app)
        .options('/collections')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'POST')
        .expect(204);

      const allowedMethods = res.headers['access-control-allow-methods'];
      expect(allowedMethods).toBeDefined();
      expect(allowedMethods.toUpperCase()).toMatch(/POST/);
    });
  });

  describe('Preflight Requests', () => {
    test('should handle OPTIONS preflight request', async () => {
      const res = await request(app)
        .options('/collections')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'GET')
        .set('Access-Control-Request-Headers', 'Content-Type')
        .expect(204);

      expect(res.headers['access-control-allow-methods']).toBeDefined();
      expect(res.headers['access-control-allow-headers']).toBeDefined();
    });

    test('should allow custom headers', async () => {
      const res = await request(app)
        .options('/collections')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'GET')
        .set('Access-Control-Request-Headers', 'X-Request-ID')
        .expect(204);

      const allowedHeaders = res.headers['access-control-allow-headers'];
      expect(allowedHeaders).toBeDefined();
      expect(allowedHeaders.toLowerCase()).toMatch(/x-request-id/);
    });

    test('should include max age for preflight cache', async () => {
      const res = await request(app)
        .options('/collections')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'GET');

      expect(res.headers['access-control-max-age']).toBeDefined();
    });
  });

  describe('Exposed Headers', () => {
    test('should expose X-Request-ID header', async () => {
      const res = await request(app)
        .get('/')
        .set('Origin', 'http://localhost:3000')
        .expect(200);

      const exposedHeaders = res.headers['access-control-expose-headers'];
      expect(exposedHeaders).toBeDefined();
      expect(exposedHeaders.toLowerCase()).toMatch(/x-request-id/);
    });

    test('should expose RateLimit headers', async () => {
      const res = await request(app)
        .get('/')
        .set('Origin', 'http://localhost:3000')
        .expect(200);

      const exposedHeaders = res.headers['access-control-expose-headers'];
      expect(exposedHeaders).toBeDefined();
      expect(exposedHeaders.toLowerCase()).toMatch(/ratelimit/);
    });
  });

  describe('Multiple Origins', () => {
    test('should handle wildcard origin', async () => {
      // Assuming CORS_ORIGIN is set to '*' in test environment
      const res = await request(app)
        .get('/')
        .set('Origin', 'http://example.com')
        .expect(200);

      expect(res.headers['access-control-allow-origin']).toBeDefined();
    });
  });

  describe('HTTP Methods', () => {
    const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD'];

    methods.forEach(method => {
      test(`should allow ${method} method in preflight`, async () => {
        const res = await request(app)
          .options('/collections')
          .set('Origin', 'http://localhost:3000')
          .set('Access-Control-Request-Method', method)
          .expect(204);

        const allowedMethods = res.headers['access-control-allow-methods'];
        expect(allowedMethods).toBeDefined();
        expect(allowedMethods.toUpperCase()).toMatch(new RegExp(method));
      });
    });
  });

  describe('Request Headers', () => {
    test('should include request ID in response headers', async () => {
      const customRequestId = '550e8400-e29b-41d4-a716-446655440000';

      const res = await request(app)
        .get('/')
        .set('X-Request-ID', customRequestId)
        .set('Origin', 'http://localhost:3000')
        .expect(200);

      expect(res.headers['x-request-id']).toBe(customRequestId);
    });
  });
});
