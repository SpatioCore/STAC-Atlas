/**
 * Extended Tests for Logger Utilities (logger.js)
 */

const { 
  logger, 
  logError, 
  logInfo, 
  logWarn, 
  logDebug 
} = require('../utils/logger');

describe('Logger Utilities', () => {
  describe('logger instance', () => {
    test('should be defined', () => {
      expect(logger).toBeDefined();
    });

    test('should have log method', () => {
      expect(typeof logger.log).toBe('function');
    });

    test('should have info method', () => {
      expect(typeof logger.info).toBe('function');
    });

    test('should have error method', () => {
      expect(typeof logger.error).toBe('function');
    });

    test('should have warn method', () => {
      expect(typeof logger.warn).toBe('function');
    });

    test('should have debug method', () => {
      expect(typeof logger.debug).toBe('function');
    });
  });

  describe('logError', () => {
    test('should log error with message', () => {
      const error = new Error('Test error message');
      
      // Should not throw
      expect(() => logError(error)).not.toThrow();
    });

    test('should log error with context', () => {
      const error = new Error('Test error');
      error.code = 'TEST_CODE';
      error.status = 500;
      
      expect(() => logError(error, { requestId: 'test-123' })).not.toThrow();
    });

    test('should handle error without stack', () => {
      const error = { message: 'Plain object error', name: 'CustomError' };
      
      expect(() => logError(error)).not.toThrow();
    });

    test('should handle error with statusCode', () => {
      const error = new Error('HTTP Error');
      error.statusCode = 404;
      
      expect(() => logError(error)).not.toThrow();
    });
  });

  describe('logInfo', () => {
    test('should log info message', () => {
      expect(() => logInfo('Test info message')).not.toThrow();
    });

    test('should log info with context', () => {
      expect(() => logInfo('Info with context', { 
        userId: 123, 
        action: 'test' 
      })).not.toThrow();
    });

    test('should handle empty context', () => {
      expect(() => logInfo('Info message', {})).not.toThrow();
    });
  });

  describe('logWarn', () => {
    test('should log warning message', () => {
      expect(() => logWarn('Test warning message')).not.toThrow();
    });

    test('should log warning with context', () => {
      expect(() => logWarn('Warning with context', { 
        deprecatedFeature: 'oldAPI' 
      })).not.toThrow();
    });
  });

  describe('logDebug', () => {
    test('should log debug message', () => {
      expect(() => logDebug('Test debug message')).not.toThrow();
    });

    test('should log debug with complex context', () => {
      expect(() => logDebug('Debug with data', { 
        query: { limit: 10, offset: 0 },
        params: { id: 'test' },
        timing: { start: Date.now() }
      })).not.toThrow();
    });
  });

  describe('Log levels', () => {
    test('logger should have a level property', () => {
      expect(logger.level).toBeDefined();
    });

    test('logger level should be a valid level', () => {
      const validLevels = ['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly'];
      expect(validLevels).toContain(logger.level);
    });
  });

  describe('Transports', () => {
    test('logger should have transports', () => {
      expect(logger.transports).toBeDefined();
      expect(logger.transports.length).toBeGreaterThan(0);
    });
  });
});
