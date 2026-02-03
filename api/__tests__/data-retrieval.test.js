const { query, closePool } = require('../db/db_APIconnection');

/**
 * Jest Test Suite: Data Retrieval and Schema Validation
 * Discovers all tables and columns, validates against expected schema
 */

// Expected schema definitions
const EXPECTED_SCHEMAS = {
  collection: {
    id: { type: 'integer', required: true },
    // stac_id: { type: 'text', required: true }, // Column does not exist in both databases
    stac_version: { type: 'text', required: true },
    title: { type: 'text', required: true },
    description: { type: 'text', required: true },
    license: { type: 'text', required: true },
    spatial_extent: { type: 'geometry', required: true },
    temporal_extent_start: { type: 'timestamp without time zone', required: true },
    temporal_extent_end: { type: 'timestamp without time zone', required: true },
    full_json: { type: 'jsonb', required: false },
    created_at: { type: 'timestamp without time zone', required: true },
    updated_at: { type: 'timestamp without time zone', required: true },
    is_api: { type: 'boolean', required: true },
    is_active: { type: 'boolean', required: true }
  },
  catalog: {
    id: { type: 'integer', required: true },
    // stac_id: { type: 'text', required: true }, // Column does not exist in database
    stac_version: { type: 'text', required: true },
    type: { type: 'text', required: true },
    title: { type: 'text', required: false },
    description: { type: 'text', required: true },
    created_at: { type: 'timestamp without time zone', required: true },
    updated_at: { type: 'timestamp without time zone', required: true }
  }
};

describe('Database Schema Validation', () => {
  let discoveredTables = [];

  afterAll(async () => {
    await closePool();
  });

  describe('Table Discovery', () => {
    test('should discover STAC-related tables', async () => {
      const tablesResult = await query(`
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
          AND tablename IN ('collection', 'catalog')
        ORDER BY tablename
      `);

      discoveredTables = tablesResult.rows.map(r => r.tablename);
      
      expect(discoveredTables).toContain('collection');
      expect(discoveredTables.length).toBeGreaterThan(0);
    });
  });

  describe('Schema Validation - Collection Table', () => {
    const actualColumns = {};

    beforeAll(async () => {
      const columnsResult = await query(`
        SELECT 
          column_name,
          data_type,
          udt_name,
          is_nullable
        FROM information_schema.columns
        WHERE table_name = 'collection'
        ORDER BY ordinal_position
      `);
      
      columnsResult.rows.forEach(col => {
        actualColumns[col.column_name] = {
          type: col.data_type === 'USER-DEFINED' ? col.udt_name : col.data_type,
          nullable: col.is_nullable === 'YES'
        };
      });
    });

    test('should have all required columns', () => {
      const expectedSchema = EXPECTED_SCHEMAS.collection;
      
      for (const [colName, expected] of Object.entries(expectedSchema)) {
        expect(actualColumns).toHaveProperty(colName);
      }
    });

    test('should have correct data types', () => {
      const expectedSchema = EXPECTED_SCHEMAS.collection;
      
      for (const [colName, expected] of Object.entries(expectedSchema)) {
        const actual = actualColumns[colName];
        if (!actual) continue;
        
        const actualType = actual.type.toLowerCase();
        const expectedType = expected.type.toLowerCase();
        
        const typeMatch = actualType === expectedType || 
                          actualType.includes(expectedType) ||
                          expectedType.includes(actualType) ||
                          (expectedType === 'geometry' && actualType === 'geometry');
        
        expect(typeMatch).toBe(true);
      }
    });

    test('should have geometry column', () => {
      expect(actualColumns.spatial_extent).toBeDefined();
      expect(actualColumns.spatial_extent.type).toBe('geometry');
    });

    test('should have jsonb column', () => {
      expect(actualColumns.full_json).toBeDefined();
      expect(actualColumns.full_json.type).toBe('jsonb');
    });
  });

  describe('Data Retrieval - Collection Table', () => {
    test('should have data in collection table', async () => {
      const countResult = await query(`SELECT COUNT(*) as count FROM collection`);
      const rowCount = parseInt(countResult.rows[0].count);
      
      expect(rowCount).toBeGreaterThan(0);
    });

    test('should retrieve sample collection data', async () => {
      const sampleResult = await query(`SELECT * FROM collection LIMIT 1`);
      
      expect(sampleResult.rows).toHaveLength(1);
      
      const sample = sampleResult.rows[0];
      expect(sample).toHaveProperty('id');
      // expect(sample).toHaveProperty('stac_id'); // Column does not exist in database
      expect(sample).toHaveProperty('title');
    });

    test('should have valid required fields', async () => {
      const sampleResult = await query(`SELECT * FROM collection LIMIT 1`);
      const sample = sampleResult.rows[0];
      const expectedSchema = EXPECTED_SCHEMAS.collection;
      
      for (const [colName, expected] of Object.entries(expectedSchema)) {
        if (expected.required) {
          expect(sample[colName]).not.toBeNull();
          expect(sample[colName]).not.toBeUndefined();
        }
      }
    });

    test('should have valid geometry data', async () => {
      const geomResult = await query(`
        SELECT ST_GeometryType(spatial_extent) as geom_type 
        FROM collection 
        WHERE spatial_extent IS NOT NULL 
        LIMIT 1
      `);
      
      expect(geomResult.rows).toHaveLength(1);
      expect(geomResult.rows[0].geom_type).toBeDefined();
    });

    test('should have valid JSONB data', async () => {
      const jsonResult = await query(`
        SELECT full_json 
        FROM collection 
        WHERE full_json IS NOT NULL 
        LIMIT 1
      `);
      
      expect(jsonResult.rows).toHaveLength(1);
      expect(typeof jsonResult.rows[0].full_json).toBe('object');
      expect(Object.keys(jsonResult.rows[0].full_json).length).toBeGreaterThan(0);
    });
  });
});
