/**
 * Additional Unit Tests for Database Connection (db_APIconnection.js)
 * Covers edge cases and error handling paths
 */

const { 
  query, 
  getPoolStats, 
  ping,
  queryByBBox,
  queryByGeometry,
  queryByDistance
} = require('../db/db_APIconnection');

describe('Database Connection - Extended Tests', () => {
  describe('query function', () => {
    test('should execute valid SQL query', async () => {
      const result = await query('SELECT 1 as value');
      
      expect(result).toBeDefined();
      expect(result.rows).toBeDefined();
      expect(result.rows[0].value).toBe(1);
    });

    test('should handle parameterized queries', async () => {
      const result = await query('SELECT $1::text as value', ['test']);
      
      expect(result.rows[0].value).toBe('test');
    });

    test('should throw enhanced error for invalid SQL', async () => {
      await expect(query('INVALID SQL STATEMENT'))
        .rejects
        .toThrow('Database query failed');
    });

    test('should include error code in enhanced error', async () => {
      try {
        await query('SELECT * FROM nonexistent_table_xyz');
      } catch (error) {
        expect(error.code).toBeDefined();
        expect(error.message).toContain('Database query failed');
      }
    });
  });

  describe('getPoolStats', () => {
    test('should return pool statistics', () => {
      const stats = getPoolStats();
      
      expect(stats).toBeDefined();
      expect(stats).toHaveProperty('total');
      expect(stats).toHaveProperty('idle');
      expect(stats).toHaveProperty('waiting');
      expect(typeof stats.total).toBe('number');
      expect(typeof stats.idle).toBe('number');
      expect(typeof stats.waiting).toBe('number');
    });

    test('should have non-negative values', () => {
      const stats = getPoolStats();
      
      expect(stats.total).toBeGreaterThanOrEqual(0);
      expect(stats.idle).toBeGreaterThanOrEqual(0);
      expect(stats.waiting).toBeGreaterThanOrEqual(0);
    });
  });

  describe('ping function', () => {
    test('should return ok: true for healthy connection', async () => {
      const result = await ping();
      
      expect(result).toBeDefined();
      expect(result.ok).toBe(true);
    });

    test('should not leak connections', async () => {
      const statsBefore = getPoolStats();
      
      // Execute multiple pings
      await Promise.all([
        ping(),
        ping(),
        ping()
      ]);
      
      const statsAfter = getPoolStats();
      
      // Should not accumulate connections
      expect(statsAfter.waiting).toBe(statsBefore.waiting);
    });
  });

  describe('queryByBBox - additional tests', () => {
    test('should handle valid small bbox', async () => {
      const result = await queryByBBox('collection', [-10, -10, 10, 10]);
      
      expect(result).toBeDefined();
      expect(Array.isArray(result.rows)).toBe(true);
    });

    test('should handle bbox at boundaries', async () => {
      const result = await queryByBBox('collection', [-180, -90, 180, 90]);
      
      expect(result).toBeDefined();
      expect(Array.isArray(result.rows)).toBe(true);
    });

    test('should reject east longitude out of range', async () => {
      await expect(queryByBBox('collection', [0, 0, 200, 10]))
        .rejects
        .toThrow('Longitude must be between -180 and 180');
    });

    test('should reject north latitude out of range', async () => {
      await expect(queryByBBox('collection', [0, 0, 10, 100]))
        .rejects
        .toThrow('Latitude must be between -90 and 90');
    });

    test('should reject south latitude out of range', async () => {
      await expect(queryByBBox('collection', [0, -100, 10, 10]))
        .rejects
        .toThrow('Latitude must be between -90 and 90');
    });
  });

  describe('queryByGeometry - additional tests', () => {
    test('should handle Polygon geometry', async () => {
      const polygon = {
        type: 'Polygon',
        coordinates: [[[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]]]
      };
      
      const result = await queryByGeometry('collection', polygon, 'intersects');
      
      expect(result).toBeDefined();
      expect(Array.isArray(result.rows)).toBe(true);
    });

    test('should handle contains predicate', async () => {
      const point = { type: 'Point', coordinates: [0, 0] };
      
      const result = await queryByGeometry('collection', point, 'contains');
      
      expect(result).toBeDefined();
    });

    test('should handle within predicate', async () => {
      const polygon = {
        type: 'Polygon',
        coordinates: [[[-180, -90], [180, -90], [180, 90], [-180, 90], [-180, -90]]]
      };
      
      const result = await queryByGeometry('collection', polygon, 'within');
      
      expect(result).toBeDefined();
    });

    test('should be case-insensitive for predicates', async () => {
      const point = { type: 'Point', coordinates: [0, 0] };
      
      const result = await queryByGeometry('collection', point, 'INTERSECTS');
      
      expect(result).toBeDefined();
    });

    test('should reject invalid predicate', async () => {
      const point = { type: 'Point', coordinates: [0, 0] };
      
      await expect(queryByGeometry('collection', point, 'invalid'))
        .rejects
        .toThrow('Invalid predicate');
    });

    test('should reject null GeoJSON', async () => {
      await expect(queryByGeometry('collection', null))
        .rejects
        .toThrow('GeoJSON must be a valid object');
    });

    test('should reject non-object GeoJSON', async () => {
      await expect(queryByGeometry('collection', 'not an object'))
        .rejects
        .toThrow('GeoJSON must be a valid object');
    });

    test('should reject GeoJSON without type', async () => {
      await expect(queryByGeometry('collection', { coordinates: [0, 0] }))
        .rejects
        .toThrow('GeoJSON must have type and coordinates');
    });

    test('should reject GeoJSON without coordinates', async () => {
      await expect(queryByGeometry('collection', { type: 'Point' }))
        .rejects
        .toThrow('GeoJSON must have type and coordinates');
    });

    test('should reject empty table name', async () => {
      const point = { type: 'Point', coordinates: [0, 0] };
      
      await expect(queryByGeometry('', point))
        .rejects
        .toThrow('Table name must be a non-empty string');
    });

    test('should reject non-string table name', async () => {
      const point = { type: 'Point', coordinates: [0, 0] };
      
      await expect(queryByGeometry(123, point))
        .rejects
        .toThrow('Table name must be a non-empty string');
    });
  });

  describe('queryByDistance', () => {
    test('should execute distance query', async () => {
      const result = await queryByDistance('collection', [0, 0], 1000000);
      
      expect(result).toBeDefined();
      expect(Array.isArray(result.rows)).toBe(true);
    });

    test('should return distance in results', async () => {
      const result = await queryByDistance('collection', [7.6, 51.9], 100000);
      
      if (result.rowCount > 0) {
        expect(result.rows[0]).toHaveProperty('distance');
        expect(typeof result.rows[0].distance).toBe('number');
      }
    });

    test('should order results by distance', async () => {
      const result = await queryByDistance('collection', [0, 0], 10000000);
      
      if (result.rowCount > 1) {
        for (let i = 1; i < result.rows.length; i++) {
          expect(result.rows[i].distance).toBeGreaterThanOrEqual(result.rows[i-1].distance);
        }
      }
    });

    test('should handle zero distance', async () => {
      const result = await queryByDistance('collection', [0, 0], 0);
      
      expect(result).toBeDefined();
      // Zero distance may or may not return results depending on exact geometry overlap
      expect(typeof result.rowCount).toBe('number');
    });
  });
});
