/**
 * Extended Tests for CORS Middleware
 * Tests parseAllowedOrigins with different environment configurations
 */

const request = require('supertest');
const express = require('express');

describe('CORS Configuration - Extended Tests', () => {
  const originalEnv = process.env.CORS_ORIGIN;

  afterEach(() => {
    // Restore original environment
    if (originalEnv === undefined) {
      delete process.env.CORS_ORIGIN;
    } else {
      process.env.CORS_ORIGIN = originalEnv;
    }
    // Clear require cache to reload cors module with new env
    jest.resetModules();
  });

  describe('parseAllowedOrigins', () => {
    test('should allow all origins with wildcard', () => {
      process.env.CORS_ORIGIN = '*';
      jest.resetModules();
      const { corsMiddleware } = require('../middleware/cors');
      
      const app = express();
      app.use(corsMiddleware);
      app.get('/', (req, res) => res.json({ ok: true }));

      return request(app)
        .get('/')
        .set('Origin', 'http://any-origin.com')
        .expect(200)
        .then(res => {
          expect(res.headers['access-control-allow-origin']).toBe('*');
        });
    });

    test('should handle single origin', () => {
      process.env.CORS_ORIGIN = 'http://localhost:3000';
      jest.resetModules();
      const { corsMiddleware } = require('../middleware/cors');
      
      const app = express();
      app.use(corsMiddleware);
      app.get('/', (req, res) => res.json({ ok: true }));

      return request(app)
        .get('/')
        .set('Origin', 'http://localhost:3000')
        .expect(200)
        .then(res => {
          expect(res.headers['access-control-allow-origin']).toBe('http://localhost:3000');
        });
    });

    test('should handle multiple comma-separated origins', () => {
      process.env.CORS_ORIGIN = 'http://localhost:3000, http://example.com';
      jest.resetModules();
      const { corsMiddleware } = require('../middleware/cors');
      
      const app = express();
      app.use(corsMiddleware);
      app.get('/', (req, res) => res.json({ ok: true }));

      return request(app)
        .get('/')
        .set('Origin', 'http://example.com')
        .expect(200)
        .then(res => {
          expect(res.headers['access-control-allow-origin']).toBe('http://example.com');
        });
    });

    test('should default to wildcard when CORS_ORIGIN is not set', () => {
      delete process.env.CORS_ORIGIN;
      jest.resetModules();
      const { corsMiddleware } = require('../middleware/cors');
      
      const app = express();
      app.use(corsMiddleware);
      app.get('/', (req, res) => res.json({ ok: true }));

      return request(app)
        .get('/')
        .set('Origin', 'http://any-origin.com')
        .expect(200)
        .then(res => {
          expect(res.headers['access-control-allow-origin']).toBe('*');
        });
    });
  });

  describe('HTTP Methods', () => {
    test('should allow all required HTTP methods', async () => {
      const app = require('../app');
      
      const res = await request(app)
        .options('/collections')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'DELETE')
        .expect(204);

      const methods = res.headers['access-control-allow-methods'];
      expect(methods).toContain('GET');
      expect(methods).toContain('POST');
      expect(methods).toContain('PUT');
      expect(methods).toContain('DELETE');
      expect(methods).toContain('OPTIONS');
    });

    test('should allow PATCH method', async () => {
      const app = require('../app');
      
      const res = await request(app)
        .options('/collections')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'PATCH')
        .expect(204);

      const methods = res.headers['access-control-allow-methods'];
      expect(methods).toContain('PATCH');
    });

    test('should allow HEAD method', async () => {
      const app = require('../app');
      
      const res = await request(app)
        .options('/collections')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'HEAD')
        .expect(204);

      const methods = res.headers['access-control-allow-methods'];
      expect(methods).toContain('HEAD');
    });
  });

  describe('Allowed Headers', () => {
    test('should allow Content-Type header', async () => {
      const app = require('../app');
      
      const res = await request(app)
        .options('/collections')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Headers', 'Content-Type')
        .expect(204);

      const headers = res.headers['access-control-allow-headers'].toLowerCase();
      expect(headers).toContain('content-type');
    });

    test('should allow Authorization header', async () => {
      const app = require('../app');
      
      const res = await request(app)
        .options('/collections')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Headers', 'Authorization')
        .expect(204);

      const headers = res.headers['access-control-allow-headers'].toLowerCase();
      expect(headers).toContain('authorization');
    });

    test('should allow Accept header', async () => {
      const app = require('../app');
      
      const res = await request(app)
        .options('/collections')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Headers', 'Accept')
        .expect(204);

      const headers = res.headers['access-control-allow-headers'].toLowerCase();
      expect(headers).toContain('accept');
    });
  });
});
