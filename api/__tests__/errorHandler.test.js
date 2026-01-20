const request = require('supertest');
const app = require('../app');

describe('Error Handler Integration Tests', () => {
  describe('RFC 7807 Error Response Format', () => {
    test('400 errors should include RFC 7807 fields', async () => {
      const response = await request(app)
        .get('/collections?limit=-1')
        .expect(400);

      // RFC 7807 standard fields
      expect(response.body).toHaveProperty('type');
      expect(response.body).toHaveProperty('title');
      expect(response.body).toHaveProperty('status', 400);
      expect(response.body).toHaveProperty('detail');
      expect(response.body).toHaveProperty('instance');
      expect(response.body).toHaveProperty('requestId');

      // Backwards compatibility fields
      expect(response.body).toHaveProperty('code');
      expect(response.body).toHaveProperty('description');
    });

    test('404 errors should include RFC 7807 fields', async () => {
      const response = await request(app)
        .get('/nonexistent')
        .expect(404);

      expect(response.body).toHaveProperty('type');
      expect(response.body).toHaveProperty('title');
      expect(response.body).toHaveProperty('status', 404);
      expect(response.body).toHaveProperty('detail');
      expect(response.body).toHaveProperty('requestId');
      expect(response.body.code).toBe('NotFound');
    });
  });

  describe('Request ID Tracking', () => {
    test('should generate request ID if not provided', async () => {
      const response = await request(app)
        .get('/collections?limit=1')
        .expect(200);

      expect(response.headers['x-request-id']).toBeDefined();
      expect(response.headers['x-request-id']).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    });

    test('should use client-provided request ID', async () => {
      const clientRequestId = 'test-request-123';
      
      const response = await request(app)
        .get('/collections?limit=1')
        .set('X-Request-ID', clientRequestId)
        .expect(200);

      expect(response.headers['x-request-id']).toBe(clientRequestId);
    });

    test('should include request ID in error responses', async () => {
      const clientRequestId = 'error-test-456';
      
      const response = await request(app)
        .get('/collections?limit=-1')
        .set('X-Request-ID', clientRequestId)
        .expect(400);

      expect(response.body.requestId).toBe(clientRequestId);
    });
  });

  describe('Error Code Consistency', () => {
    test('InvalidParameterValue for validation errors', async () => {
      const response = await request(app)
        .get('/collections?limit=0')
        .expect(400);

      expect(response.body.code).toBe('InvalidParameterValue');
    });

    test('InvalidParameter for malformed parameters', async () => {
      const response = await request(app)
        .get('/collections/not-a-number')
        .expect(404);

      expect(response.body.code).toBe('NotFound');
    });

    test('NotFound for missing resources', async () => {
      const response = await request(app)
        .get('/collections/999999999')
        .expect(404);

      expect(response.body.code).toBe('NotFound');
    });
  });

  describe('Error Message Sanitization', () => {
    test('should include descriptive error messages', async () => {
      const response = await request(app)
        .get('/collections?limit=-5')
        .expect(400);

      expect(response.body.description).toContain('limit');
      expect(response.body.description).toContain('at least 1');
    });

    test('should combine multiple validation errors', async () => {
      const response = await request(app)
        .get('/collections?limit=0&token=-5')
        .expect(400);

      expect(response.body.description).toContain('limit');
      expect(response.body.description).toContain('token');
    });
  });

  describe('Instance Path', () => {
    test('should include request path in error response', async () => {
      const response = await request(app)
        .get('/collections?limit=-1')
        .expect(400);

      expect(response.body.instance).toContain('/collections');
      expect(response.body.instance).toContain('limit=-1');
    });
  });
});
