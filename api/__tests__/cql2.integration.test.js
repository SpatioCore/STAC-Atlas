// __tests__/cql2.integration.test.js

/**
 * Integration tests for CQL2 filtering with database queries.
 * Uses query() directly like buildCollectionSearchQuery.integration.test.js
 */

const { query, closePool } = require('../db/db_APIconnection');
const { buildCollectionSearchQuery } = require('../db/buildCollectionSearchQuery');
const { cql2ToSql } = require('../utils/cql2ToSql');

describe('CQL2 Filter Integration Tests', () => {
  afterAll(async () => {
    await closePool();
  });

  describe('CQL2 to SQL Conversion', () => {
    
    test('should convert license filter with string literal', () => {
      // This is what cql2-wasm produces for: license = 'MIT'
      const cql = { op: '=', args: [{ property: 'license' }, 'MIT'] };
      const values = [];
      const sql = cql2ToSql(cql, values);
      
      expect(sql).toBe('c.license = $1');
      expect(values).toEqual(['MIT']);
    });

    test('should convert title filter', () => {
      const cql = { op: '=', args: [{ property: 'title' }, 'Sentinel Data'] };
      const values = [];
      const sql = cql2ToSql(cql, values);
      
      expect(sql).toBe('c.title = $1');
      expect(values).toEqual(['Sentinel Data']);
    });

    test('should convert numeric id filter', () => {
      const cql = { op: '=', args: [{ property: 'id' }, 1] };
      const values = [];
      const sql = cql2ToSql(cql, values);
      
      expect(sql).toBe('c.id = $1');
      expect(values).toEqual([1]);
    });

    test('should convert AND operator', () => {
      const cql = {
        op: 'and',
        args: [
          { op: '=', args: [{ property: 'license' }, 'MIT'] },
          { op: '=', args: [{ property: 'title' }, 'Test'] }
        ]
      };
      const values = [];
      const sql = cql2ToSql(cql, values);
      
      expect(sql).toBe('(c.license = $1 AND c.title = $2)');
      expect(values).toEqual(['MIT', 'Test']);
    });

    test('should convert OR operator', () => {
      const cql = {
        op: 'or',
        args: [
          { op: '=', args: [{ property: 'license' }, 'MIT'] },
          { op: '=', args: [{ property: 'license' }, 'Apache-2.0'] }
        ]
      };
      const values = [];
      const sql = cql2ToSql(cql, values);
      
      expect(sql).toBe('(c.license = $1 OR c.license = $2)');
      expect(values).toEqual(['MIT', 'Apache-2.0']);
    });
  });

  describe('Extended Column Mappings', () => {
    
    test('should map all core collection fields', () => {
      const fields = ['id', 'stac_version', 'type', 'title', 'description', 
                      'license', 'created_at', 'updated_at', 'is_api', 'is_active'];
      
      fields.forEach(field => {
        const cql = { op: '=', args: [{ property: field }, 'test'] };
        const values = [];
        const sql = cql2ToSql(cql, values);
        expect(sql).toContain(`c.${field}`);
      });
    });

    test('should map aggregated fields to correct aliases', () => {
      const mappings = {
        'keywords': 'kw.keywords',
        'stac_extensions': 'ext.stac_extensions',
        'providers': 'prov.providers',
        'assets': 'a.assets',
        'summaries': 's.summaries',
        'last_crawled': 'cl.last_crawled'
      };
      
      Object.entries(mappings).forEach(([prop, expected]) => {
        const cql = { op: '=', args: [{ property: prop }, 'test'] };
        const values = [];
        const sql = cql2ToSql(cql, values);
        expect(sql).toContain(expected);
      });
    });

    test('should map aliases correctly', () => {
      expect(cql2ToSql({ op: '=', args: [{ property: 'created' }, 'x'] }, []))
        .toBe('c.created_at = $1');
      expect(cql2ToSql({ op: '=', args: [{ property: 'updated' }, 'x'] }, []))
        .toBe('c.updated_at = $1');
      expect(cql2ToSql({ op: '=', args: [{ property: 'collection' }, 'x'] }, []))
        .toBe('c.id = $1');
    });
  });

  describe('Spatial Operators', () => {
    
    test('should convert s_intersects with GeoJSON', () => {
      const geojson = { type: 'Polygon', coordinates: [[[0,0],[1,0],[1,1],[0,1],[0,0]]] };
      const cql = { op: 's_intersects', args: [{ property: 'spatial_extend' }, geojson] };
      const values = [];
      const sql = cql2ToSql(cql, values);
      
      expect(sql).toContain('ST_Intersects');
      expect(sql).toContain('ST_GeomFromGeoJSON');
      expect(values[0]).toBe(JSON.stringify(geojson));
    });

    test('should convert s_within with GeoJSON', () => {
      const geojson = { type: 'Polygon', coordinates: [[[0,0],[1,0],[1,1],[0,1],[0,0]]] };
      const cql = { op: 's_within', args: [{ property: 'spatial_extend' }, geojson] };
      const values = [];
      const sql = cql2ToSql(cql, values);
      
      expect(sql).toContain('ST_Within');
    });

    test('should convert s_contains with GeoJSON', () => {
      const geojson = { type: 'Point', coordinates: [10, 50] };
      const cql = { op: 's_contains', args: [{ property: 'spatial_extend' }, geojson] };
      const values = [];
      const sql = cql2ToSql(cql, values);
      
      expect(sql).toContain('ST_Contains');
    });
  });

  describe('Temporal Operators', () => {
    
    test('should convert t_intersects with interval', () => {
      const cql = { 
        op: 't_intersects', 
        args: [
          { property: 'datetime' }, 
          { interval: ['2020-01-01', '2025-12-31'] }
        ] 
      };
      const values = [];
      const sql = cql2ToSql(cql, values);
      
      expect(sql).toContain('temporal_extend_start');
      expect(sql).toContain('temporal_extend_end');
      expect(values).toContain('2020-01-01');
      expect(values).toContain('2025-12-31');
    });

    test('should convert t_before', () => {
      const cql = { op: 't_before', args: [{ property: 'created_at' }, '2025-01-01'] };
      const values = [];
      const sql = cql2ToSql(cql, values);
      
      expect(sql).toBe('c.created_at < $1');
      expect(values).toEqual(['2025-01-01']);
    });

    test('should convert t_after', () => {
      const cql = { op: 't_after', args: [{ property: 'updated_at' }, '2024-01-01'] };
      const values = [];
      const sql = cql2ToSql(cql, values);
      
      expect(sql).toBe('c.updated_at > $1');
      expect(values).toEqual(['2024-01-01']);
    });
  });

  describe('Database Query Execution with CQL2', () => {
    
    test('should execute license filter query successfully', async () => {
      const cqlFilter = {
        sql: 'c.license = $1',
        values: ['CC-BY-4.0']
      };
      
      const { sql, values } = buildCollectionSearchQuery({ 
        cqlFilter, 
        limit: 10, 
        token: 0 
      });
      
      const result = await query(sql, values);
      expect(result.rows).toBeDefined();
      expect(Array.isArray(result.rows)).toBe(true);
      
      // All returned collections should have the filtered license
      result.rows.forEach(row => {
        expect(row.license).toBe('CC-BY-4.0');
      });
    });

    test('should execute combined CQL2 and standard filters', async () => {
      const cqlFilter = {
        sql: 'c.is_active = $1',
        values: [true]
      };
      
      const { sql, values } = buildCollectionSearchQuery({ 
        cqlFilter,
        limit: 5, 
        token: 0 
      });
      
      const result = await query(sql, values);
      expect(result.rows).toBeDefined();
      
      result.rows.forEach(row => {
        expect(row.is_active).toBe(true);
      });
    });

    test('should execute OR filter query', async () => {
      // Build CQL2 filter for: license = 'MIT' OR license = 'Apache-2.0'
      const cql = {
        op: 'or',
        args: [
          { op: '=', args: [{ property: 'license' }, 'MIT'] },
          { op: '=', args: [{ property: 'license' }, 'Apache-2.0'] }
        ]
      };
      const filterValues = [];
      const filterSql = cql2ToSql(cql, filterValues);
      
      const { sql, values } = buildCollectionSearchQuery({ 
        cqlFilter: { sql: filterSql, values: filterValues },
        limit: 10, 
        token: 0 
      });
      
      const result = await query(sql, values);
      expect(result.rows).toBeDefined();
      
      result.rows.forEach(row => {
        expect(['MIT', 'Apache-2.0']).toContain(row.license);
      });
    });

    test('should return correct structure with CQL2 filter', async () => {
      const cqlFilter = {
        sql: 'c.id > $1',
        values: [0]
      };
      
      const { sql, values } = buildCollectionSearchQuery({ 
        cqlFilter, 
        limit: 3, 
        token: 0 
      });
      
      const result = await query(sql, values);
      
      if (result.rows.length > 0) {
        const row = result.rows[0];
        // Core fields
        expect(row).toHaveProperty('id');
        expect(row).toHaveProperty('title');
        expect(row).toHaveProperty('license');
        // Aggregated fields
        expect(row).toHaveProperty('keywords');
        expect(row).toHaveProperty('providers');
        expect(row).toHaveProperty('assets');
      }
    });
  });
});

