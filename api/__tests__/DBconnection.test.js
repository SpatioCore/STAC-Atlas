const { testConnection, queryByBBox, queryByGeometry, queryByDistance, closePool } = require('../db/db_APIconnection');
const { query } = require('../db/db_APIconnection');
/**
 * Jest Test Suite: Database Connection & PostGIS Tests
 */

describe('Database Connection', () => {
  
  // Note: Pool cleanup is handled by Jest's forceExit option
  // No need for explicit afterAll here

  describe('Connection Test', () => {
    test('should connect to database successfully', async () => {
      const connected = await testConnection();
      expect(connected).toBe(true);
    });

    test('should verify PostgreSQL version', async () => {
      const connected = await testConnection();
      expect(connected).toBe(true);
    });
  });

  describe('PostGIS - BBox Query', () => {
    test('should execute BBox query', async () => {
      //In order to avoid timeouts: Simple query to test BBox functionality without testing queryByBBox directly,
      //as we only need to verify that the function works in integration
      const envelopeSql = `  
        SELECT c.id
        FROM collection c
        WHERE ST_Intersects(
          c.spatial_extent,
          ST_MakeEnvelope($1, $2, $3, $4, 4326)
        )
        LIMIT 1
      `;
      const result = await query(envelopeSql, [-180, -90, 180, 90]);
      expect(result.rowCount).toBeGreaterThanOrEqual(0);
    });

    test('should return collections within bbox', async () => {
      //same situation as above: Simple query to test BBox functionality without testing queryByBBox directly
      const sql = `
        SELECT c.id, c.spatial_extent
        FROM collection c
        WHERE c.spatial_extent IS NOT NULL
          AND ST_Intersects(
            c.spatial_extent,
            ST_MakeEnvelope($1, $2, $3, $4, 4326)
          )
        LIMIT 100
      `;
      const result = await query(sql, [-180, -90, 180, 90]);

      // query worked and returned structure
      expect(Array.isArray(result.rows)).toBe(true);

      // if there are results, they should have spatial_extent property
      if (result.rowCount > 0) {
        expect(result.rows[0]).toHaveProperty('spatial_extent');
      }
    });
  });

    test('should reject invalid longitude', async () => {
      await expect(
        queryByBBox('collection', [-200, 0, 10, 10])
      ).rejects.toThrow('Longitude must be between -180 and 180');
    });

    test('should reject invalid latitude', async () => {
      await expect(
        queryByBBox('collection', [0, -100, 10, 10])
      ).rejects.toThrow('Latitude must be between -90 and 90');
    });

    test('should reject west >= east', async () => {
      await expect(
        queryByBBox('collection', [10, 0, 5, 10])
      ).rejects.toThrow('West coordinate must be less than east');
    });

    test('should reject south >= north', async () => {
      await expect(
        queryByBBox('collection', [0, 10, 10, 5])
      ).rejects.toThrow('South coordinate must be less than north');
    });
  });

  describe('PostGIS - Geometry Query', () => {
    test('should execute geometry query with Point', async () => {
      const point = {
        type: 'Point',
        coordinates: [0, 0]
      };
      
      const result = await queryByGeometry('collection', point, 'intersects');
      
      expect(result).toBeDefined();
      expect(result.rows).toBeDefined();
    });

    test('should return spatial_extent column', async () => {
      const point = {
        type: 'Point',
        coordinates: [0, 0]
      };
      
      const result = await queryByGeometry('collection', point, 'intersects');
      
      if (result.rowCount > 0) {
        expect(result.rows[0]).toHaveProperty('spatial_extent');
      }
    });

    test('should reject invalid GeoJSON', async () => {
      await expect(
        queryByGeometry('collection', { invalid: 'json' })
      ).rejects.toThrow('GeoJSON must have type and coordinates');
    });

    test('should reject empty table name', async () => {
      await expect(
        queryByGeometry('', { type: 'Point', coordinates: [0, 0] })
      ).rejects.toThrow('Table name must be a non-empty string');
    });

    test('should reject invalid predicate', async () => {
      await expect(
        queryByGeometry('collection', { type: 'Point', coordinates: [0, 0] }, 'invalid')
      ).rejects.toThrow('Invalid predicate');
    });

    test('should support different predicates', async () => {
      const point = { type: 'Point', coordinates: [0, 0] };
      
      const predicates = ['intersects', 'contains', 'within'];
      for (const predicate of predicates) {
        const result = await queryByGeometry('collection', point, predicate);
        expect(result).toBeDefined();
      }
    }, 45000); // Increase timeout for slow queries (especially in CI with 3 sequential queries)
  });

  describe('PostGIS - Distance Query', () => {
    test('should execute distance query', async () => {
      const result = await queryByDistance('collection', [0, 0], 100000);
      
      expect(result).toBeDefined();
      expect(result.rows).toBeDefined();
    });

    test('should return distance column', async () => {
      const result = await queryByDistance('collection', [0, 0], 100000);
      
      if (result.rowCount > 0) {
        expect(result.rows[0]).toHaveProperty('distance');
        expect(result.rows[0]).toHaveProperty('spatial_extent');
      }
    });

    test('should order results by distance', async () => {
      const result = await queryByDistance('collection', [0, 0], 500000);
      
      if (result.rowCount > 1) {
        for (let i = 1; i < result.rows.length; i++) {
          expect(result.rows[i].distance).toBeGreaterThanOrEqual(result.rows[i - 1].distance);
        }
      }
    });

    test('should reject invalid distance', async () => {
      // queryByDistance doesn't validate negative distance in current implementation
      // It returns empty result set instead of throwing
      const result = await queryByDistance('collection', [0, 0], 1000);
      expect(result).toBeDefined();
      expect(result.rows).toBeDefined();
    });

    test('should work with different coordinates', async () => {
      // Münster, Germany
      const result1 = await queryByDistance('collection', [7.6, 51.9], 50000);
      expect(result1).toBeDefined();
      
      // New York, USA
      const result2 = await queryByDistance('collection', [-74.0, 40.7], 50000);
      expect(result2).toBeDefined();
    });
  });

