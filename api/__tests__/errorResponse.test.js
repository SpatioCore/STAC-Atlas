/**
 * Unit Tests for Error Response Utils (errorResponse.js)
 */

const {
  generateRequestId,
  createErrorResponse,
  ErrorResponses,
  sanitizeErrorMessage
} = require('../utils/errorResponse');

describe('Error Response Utils', () => {
  describe('generateRequestId', () => {
    test('should generate a valid UUID v4', () => {
      const requestId = generateRequestId();
      
      expect(requestId).toBeDefined();
      expect(typeof requestId).toBe('string');
      expect(requestId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    });

    test('should generate unique IDs', () => {
      const ids = new Set();
      for (let i = 0; i < 100; i++) {
        ids.add(generateRequestId());
      }
      expect(ids.size).toBe(100);
    });
  });

  describe('createErrorResponse', () => {
    test('should create RFC 7807 compliant error response', () => {
      const response = createErrorResponse({
        status: 400,
        code: 'InvalidParameter',
        title: 'Invalid Parameter',
        detail: 'The parameter is invalid',
        requestId: 'test-123',
        instance: '/collections'
      });

      expect(response).toHaveProperty('type', 'https://stacspec.org/errors/InvalidParameter');
      expect(response).toHaveProperty('title', 'Invalid Parameter');
      expect(response).toHaveProperty('status', 400);
      expect(response).toHaveProperty('detail', 'The parameter is invalid');
      expect(response).toHaveProperty('instance', '/collections');
      expect(response).toHaveProperty('requestId', 'test-123');
      expect(response).toHaveProperty('code', 'InvalidParameter');
      expect(response).toHaveProperty('description');
    });

    test('should use default title when not provided', () => {
      const response = createErrorResponse({
        status: 400,
        code: 'TestError'
      });

      expect(response.title).toBe('Bad Request');
    });

    test('should use default title for 404', () => {
      const response = createErrorResponse({
        status: 404,
        code: 'NotFound'
      });

      expect(response.title).toBe('Not Found');
    });

    test('should use default title for 500', () => {
      const response = createErrorResponse({
        status: 500,
        code: 'InternalError'
      });

      expect(response.title).toBe('Internal Server Error');
    });

    test('should use default title for 501', () => {
      const response = createErrorResponse({
        status: 501,
        code: 'NotImplemented'
      });

      expect(response.title).toBe('Not Implemented');
    });

    test('should use default title for 503', () => {
      const response = createErrorResponse({
        status: 503,
        code: 'ServiceUnavailable'
      });

      expect(response.title).toBe('Service Unavailable');
    });

    test('should use "Error" for unknown status codes', () => {
      const response = createErrorResponse({
        status: 418,
        code: 'TeapotError'
      });

      expect(response.title).toBe('Error');
    });

    test('should include extensions', () => {
      const response = createErrorResponse({
        status: 400,
        code: 'TestError',
        extensions: { customField: 'customValue' }
      });

      expect(response.customField).toBe('customValue');
    });

    test('should handle missing optional fields', () => {
      const response = createErrorResponse({
        status: 400,
        code: 'TestError'
      });

      expect(response).not.toHaveProperty('instance');
      expect(response).not.toHaveProperty('requestId');
    });
  });

  describe('ErrorResponses', () => {
    describe('invalidParameter', () => {
      test('should create 400 InvalidParameter response', () => {
        const response = ErrorResponses.invalidParameter(
          'Parameter X is invalid',
          'req-123',
          '/test'
        );

        expect(response.status).toBe(400);
        expect(response.code).toBe('InvalidParameter');
        expect(response.detail).toBe('Parameter X is invalid');
      });

      test('should include extensions', () => {
        const response = ErrorResponses.invalidParameter(
          'Invalid',
          'req-123',
          '/test',
          { parameterName: 'limit' }
        );

        expect(response.parameterName).toBe('limit');
      });
    });

    describe('badRequest', () => {
      test('should create 400 InvalidParameterValue response', () => {
        const response = ErrorResponses.badRequest(
          'Value out of range',
          'req-123',
          '/test'
        );

        expect(response.status).toBe(400);
        expect(response.code).toBe('InvalidParameterValue');
      });
    });

    describe('notFound', () => {
      test('should create 404 NotFound response', () => {
        const response = ErrorResponses.notFound(
          'Collection not found',
          'req-123',
          '/collections/unknown'
        );

        expect(response.status).toBe(404);
        expect(response.code).toBe('NotFound');
        expect(response.detail).toBe('Collection not found');
      });
    });

    describe('internalError', () => {
      test('should create 500 InternalServerError response', () => {
        const response = ErrorResponses.internalError(
          'Database connection failed',
          'req-123',
          '/collections'
        );

        expect(response.status).toBe(500);
        expect(response.code).toBe('InternalServerError');
      });

      test('should use default detail when not provided', () => {
        const response = ErrorResponses.internalError(undefined, 'req-123');

        expect(response.detail).toBe('An unexpected error occurred while processing the request');
      });
    });

    describe('notImplemented', () => {
      test('should create 501 NotImplemented response', () => {
        const response = ErrorResponses.notImplemented(
          'Feature not yet implemented',
          'req-123',
          '/feature'
        );

        expect(response.status).toBe(501);
        expect(response.code).toBe('NotImplemented');
      });
    });

    describe('serviceUnavailable', () => {
      test('should create 503 ServiceUnavailable response', () => {
        const response = ErrorResponses.serviceUnavailable(
          'Database is down',
          'req-123',
          '/health'
        );

        expect(response.status).toBe(503);
        expect(response.code).toBe('ServiceUnavailable');
      });
    });

    describe('tooManyRequests', () => {
      test('should create 429 TooManyRequests response', () => {
        const response = ErrorResponses.tooManyRequests(
          'Rate limit exceeded',
          'req-123',
          '/collections'
        );

        expect(response.status).toBe(429);
        expect(response.code).toBe('TooManyRequests');
      });

      test('should use default detail when not provided', () => {
        const response = ErrorResponses.tooManyRequests(undefined, 'req-123');

        expect(response.detail).toBe('Too many requests from this IP address, please try again later.');
      });
    });
  });

  describe('sanitizeErrorMessage', () => {
    describe('development mode', () => {
      test('should return full message in development', () => {
        const error = new Error('Detailed internal error with stack trace');
        const result = sanitizeErrorMessage(error, true);

        expect(result).toBe('Detailed internal error with stack trace');
      });

      test('should return "Unknown error" for empty message', () => {
        const error = new Error();
        error.message = '';
        const result = sanitizeErrorMessage(error, true);

        expect(result).toBe('Unknown error');
      });
    });

    describe('production mode', () => {
      test('should allow safe "invalid parameter" messages', () => {
        const error = new Error('Invalid parameter: limit must be positive');
        const result = sanitizeErrorMessage(error, false);

        expect(result).toContain('Invalid parameter');
      });

      test('should allow safe "not found" messages', () => {
        const error = new Error('Collection not found');
        const result = sanitizeErrorMessage(error, false);

        expect(result).toContain('not found');
      });

      test('should allow safe "validation error" messages', () => {
        const error = new Error('Validation error: field required');
        const result = sanitizeErrorMessage(error, false);

        expect(result).toContain('Validation');
      });

      test('should allow safe "missing required" messages', () => {
        const error = new Error('Missing required parameter');
        const result = sanitizeErrorMessage(error, false);

        expect(result).toContain('Missing required');
      });

      test('should hide sensitive database connection strings', () => {
        const error = new Error('Error connecting to postgresql://user:password@localhost:5432/db');
        // This contains "error:" which doesn't match safe patterns directly
        const result = sanitizeErrorMessage(error, false);

        // Should return generic message or sanitized version
        expect(result).not.toContain('password');
      });

      test('should hide unknown error details', () => {
        const error = new Error('Stack overflow in module xyz at line 123');
        const result = sanitizeErrorMessage(error, false);

        expect(result).toBe('An unexpected error occurred while processing the request');
      });

      test('should redact password from safe messages', () => {
        const error = new Error('Invalid format: password field is invalid');
        const result = sanitizeErrorMessage(error, false);

        expect(result).not.toContain('password');
        expect(result).toContain('***');
      });

      test('should redact token from messages', () => {
        const error = new Error('Invalid format: token expired');
        const result = sanitizeErrorMessage(error, false);

        expect(result).not.toContain('token');
        expect(result).toContain('***');
      });

      test('should redact secret from messages', () => {
        const error = new Error('Invalid format: secret key not found');
        const result = sanitizeErrorMessage(error, false);

        expect(result).not.toContain('secret');
        expect(result).toContain('***');
      });
    });
  });
});
