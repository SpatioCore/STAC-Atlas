// __tests__/validators.test.js

const {
  validateQ,
  validateBbox,
  validateDatetime,
  validateLimit,
  validateSortby,
  validateToken
} = require('../validators/collectionSearchParams');

describe('Collection Search Parameter Validators', () => {
  
  describe('validateQ - Free-text search', () => {
    it('should accept valid q parameter', () => {
      const result = validateQ('sentinel');
      expect(result.valid).toBe(true);
      expect(result.normalized).toBe('sentinel');
    });

    it('should trim whitespace from q parameter', () => {
      const result = validateQ('  landsat california  ');
      expect(result.valid).toBe(true);
      expect(result.normalized).toBe('landsat california');
    });

    it('should accept undefined q (optional parameter)', () => {
      const result = validateQ(undefined);
      expect(result.valid).toBe(true);
      expect(result.normalized).toBeUndefined();
    });

    it('should accept empty string', () => {
      const result = validateQ('');
      expect(result.valid).toBe(true);
    });

    it('should reject non-string q', () => {
      const result = validateQ(123);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('must be a string');
    });

    it('should reject q exceeding max length', () => {
      const longString = 'a'.repeat(501);
      const result = validateQ(longString);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('exceeds maximum length');
    });

    it('should accept q at max length boundary', () => {
      const maxString = 'a'.repeat(500);
      const result = validateQ(maxString);
      expect(result.valid).toBe(true);
    });
  });

  describe('validateBbox - Bounding box', () => {
    it('should accept valid bbox as comma-separated string', () => {
      const result = validateBbox('-10,40,10,50');
      expect(result.valid).toBe(true);
      expect(result.normalized).toEqual([-10, 40, 10, 50]);
    });

    it('should accept valid bbox as array', () => {
      const result = validateBbox([-10, 40, 10, 50]);
      expect(result.valid).toBe(true);
      expect(result.normalized).toEqual([-10, 40, 10, 50]);
    });

    it('should accept bbox with decimal coordinates', () => {
      const result = validateBbox('-122.5,37.7,-122.3,37.9');
      expect(result.valid).toBe(true);
      expect(result.normalized).toEqual([-122.5, 37.7, -122.3, 37.9]);
    });

    it('should accept undefined bbox (optional)', () => {
      const result = validateBbox(undefined);
      expect(result.valid).toBe(true);
    });

    it('should reject bbox with wrong number of coordinates', () => {
      const result = validateBbox('1,2,3');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('exactly 4 coordinates');
    });

    it('should reject bbox with non-numeric values', () => {
      const result = validateBbox('a,b,c,d');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('invalid numeric values');
    });

    it('should reject bbox where minX >= maxX', () => {
      const result = validateBbox('10,40,10,50');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('minX must be less than maxX');
    });

    it('should reject bbox where minX > maxX', () => {
      const result = validateBbox('10,40,-10,50');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('minX must be less than maxX');
    });

    it('should reject bbox where minY >= maxY', () => {
      const result = validateBbox('-10,50,10,50');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('minY must be less than maxY');
    });

    it('should reject bbox with longitude out of range', () => {
      const result = validateBbox('-181,40,10,50');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('longitude values must be between -180 and 180');
    });

    it('should reject bbox with latitude out of range', () => {
      const result = validateBbox('-10,91,10,50');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('latitude values must be between -90 and 90');
    });

    it('should accept bbox at coordinate boundaries', () => {
      const result = validateBbox('-180,-90,180,90');
      expect(result.valid).toBe(true);
      expect(result.normalized).toEqual([-180, -90, 180, 90]);
    });

    it('should reject invalid type for bbox', () => {
      const result = validateBbox(123);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('must be an array or comma-separated string');
    });
  });

  describe('validateDatetime - Temporal filter', () => {
    it('should accept single ISO8601 datetime', () => {
      const result = validateDatetime('2020-01-01T00:00:00Z');
      expect(result.valid).toBe(true);
      expect(result.normalized).toBe('2020-01-01T00:00:00Z');
    });

    it('should accept date without time', () => {
      const result = validateDatetime('2020-01-01');
      expect(result.valid).toBe(true);
      expect(result.normalized).toBe('2020-01-01');
    });

    it('should accept closed interval', () => {
      const result = validateDatetime('2019-01-01/2021-12-31');
      expect(result.valid).toBe(true);
      expect(result.normalized).toBe('2019-01-01/2021-12-31');
    });

    it('should accept open-ended start interval', () => {
      const result = validateDatetime('../2021-12-31');
      expect(result.valid).toBe(true);
      expect(result.normalized).toBe('../2021-12-31');
    });

    it('should accept open-ended end interval', () => {
      const result = validateDatetime('2019-01-01/..');
      expect(result.valid).toBe(true);
      expect(result.normalized).toBe('2019-01-01/..');
    });

    it('should accept datetime with timezone offset', () => {
      const result = validateDatetime('2020-01-01T00:00:00+02:00');
      expect(result.valid).toBe(true);
    });

    it('should accept datetime with milliseconds', () => {
      const result = validateDatetime('2020-01-01T00:00:00.123Z');
      expect(result.valid).toBe(true);
    });

    it('should accept undefined datetime (optional)', () => {
      const result = validateDatetime(undefined);
      expect(result.valid).toBe(true);
    });

    it('should reject non-string datetime', () => {
      const result = validateDatetime(123);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('must be a string');
    });

    it('should reject invalid ISO8601 format', () => {
      const result = validateDatetime('not-a-date');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('not valid ISO8601');
    });

    it('should reject invalid date values', () => {
      const result = validateDatetime('2020-13-45');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('not valid ISO8601');
    });

    it('should reject interval with multiple separators', () => {
      const result = validateDatetime('2019/2020/2021');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('exactly one "/" separator');
    });

    it('should reject fully unbounded interval', () => {
      const result = validateDatetime('../..');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('cannot be unbounded on both sides');
    });

    it('should reject interval with invalid start', () => {
      const result = validateDatetime('invalid/2021-12-31');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('start value');
    });

    it('should reject interval with invalid end', () => {
      const result = validateDatetime('2019-01-01/invalid');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('end value');
    });
  });

  describe('validateLimit - Result limit', () => {
    it('should accept valid limit', () => {
      const result = validateLimit('50');
      expect(result.valid).toBe(true);
      expect(result.normalized).toBe(50);
    });

    it('should accept limit as number', () => {
      const result = validateLimit(25);
      expect(result.valid).toBe(true);
      expect(result.normalized).toBe(25);
    });

    it('should return default when undefined', () => {
      const result = validateLimit(undefined);
      expect(result.valid).toBe(true);
      expect(result.normalized).toBe(10);
    });

    it('should accept limit at minimum boundary', () => {
      const result = validateLimit('1');
      expect(result.valid).toBe(true);
      expect(result.normalized).toBe(1);
    });

    it('should accept limit at maximum boundary', () => {
      const result = validateLimit('10000');
      expect(result.valid).toBe(true);
      expect(result.normalized).toBe(10000);
    });

    it('should reject limit less than 1', () => {
      const result = validateLimit('0');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('must be at least 1');
    });

    it('should reject negative limit', () => {
      const result = validateLimit('-5');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('must be at least 1');
    });

    it('should reject limit exceeding maximum', () => {
      const result = validateLimit('10001');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('must not exceed 10000');
    });

    it('should reject non-numeric limit', () => {
      const result = validateLimit('abc');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('must be a valid integer');
    });

    it('should reject decimal limit', () => {
      const result = validateLimit('10.5');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('integer');
    });
  });

  describe('validateSortby - Sort specification', () => {
    it('should accept ascending sort with + prefix', () => {
      const result = validateSortby('+title');
      expect(result.valid).toBe(true);
      expect(result.normalized).toEqual({ field: 'title', direction: 'ASC' });
    });

    it('should accept descending sort with - prefix', () => {
      const result = validateSortby('-created');
      expect(result.valid).toBe(true);
      // Field is mapped to database column name
      expect(result.normalized).toEqual({ field: 'created_at', direction: 'DESC' });
    });

    it('should default to ascending without prefix', () => {
      const result = validateSortby('id');
      expect(result.valid).toBe(true);
      expect(result.normalized).toEqual({ field: 'id', direction: 'ASC' });
    });

    it('should accept all allowed fields', () => {
      const fieldMapping = {
        'title': 'title',
        'id': 'id',
        'license': 'license',
        'created': 'created_at',
        'updated': 'updated_at'
      };
      
      const fields = ['title', 'id', 'license', 'created', 'updated'];
      fields.forEach(field => {
        const result = validateSortby(field);
        expect(result.valid).toBe(true);
        // Should be mapped to database column name
        expect(result.normalized.field).toBe(fieldMapping[field]);
      });
    });

    it('should accept undefined sortby (optional)', () => {
      const result = validateSortby(undefined);
      expect(result.valid).toBe(true);
      expect(result.normalized).toBeUndefined();
    });

    it('should reject unsupported field', () => {
      const result = validateSortby('unsupported_field');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('not supported');
      expect(result.error).toContain('Allowed fields:');
    });

    it('should reject non-string sortby', () => {
      const result = validateSortby(123);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('must be a string');
    });

    it('should reject empty field name (with + prefix)', () => {
      const result = validateSortby('+');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('must specify a field');
    });

    it('should reject empty field name (without prefix)', () => {
      const result = validateSortby("");
      expect(result.valid).toBe(false);
      expect(result.error).toContain('must specify a field');
    });
  });

  describe('validateToken - Pagination token', () => {
    it('should accept valid token', () => {
      const result = validateToken('50');
      expect(result.valid).toBe(true);
      expect(result.normalized).toBe(50);
    });

    it('should accept token as number', () => {
      const result = validateToken(100);
      expect(result.valid).toBe(true);
      expect(result.normalized).toBe(100);
    });

    it('should return default when undefined', () => {
      const result = validateToken(undefined);
      expect(result.valid).toBe(true);
      expect(result.normalized).toBe(0);
    });

    it('should accept zero token', () => {
      const result = validateToken('0');
      expect(result.valid).toBe(true);
      expect(result.normalized).toBe(0);
    });

    it('should accept large token values', () => {
      const result = validateToken('999999');
      expect(result.valid).toBe(true);
      expect(result.normalized).toBe(999999);
    });

    it('should reject negative token', () => {
      const result = validateToken('-1');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('must be non-negative');
    });

    it('should reject non-numeric token', () => {
      const result = validateToken('abc');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('must be a valid integer');
    });

    it('should handle string zero', () => {
      const result = validateToken('0');
      expect(result.valid).toBe(true);
      expect(result.normalized).toBe(0);
    });
  });
});
