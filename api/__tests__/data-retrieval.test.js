const { query } = require('../db/db_APIconnection');

/**
 * Test Data Retrieval and Schema Validation
 * Discovers all tables and columns, validates against expected schema
 */

// Expected schema definitions
const EXPECTED_SCHEMAS = {
  collection: {
    id: { type: 'integer', required: true },
    stac_id: { type: 'text', required: true },
    stac_version: { type: 'text', required: true },
    type: { type: 'text', required: true },
    title: { type: 'text', required: true },
    description: { type: 'text', required: true },
    license: { type: 'text', required: true },
    spatial_extend: { type: 'geometry', required: true },
    temporal_extend_start: { type: 'timestamp without time zone', required: true },
    temporal_extend_end: { type: 'timestamp without time zone', required: true },
    full_json: { type: 'jsonb', required: false },
    created_at: { type: 'timestamp without time zone', required: true },
    updated_at: { type: 'timestamp without time zone', required: true },
    is_api: { type: 'boolean', required: true },
    is_active: { type: 'boolean', required: true }
  },
  catalog: {
    id: { type: 'integer', required: true },
    stac_id: { type: 'text', required: true },
    stac_version: { type: 'text', required: true },
    type: { type: 'text', required: true },
    title: { type: 'text', required: false },
    description: { type: 'text', required: true },
    created_at: { type: 'timestamp without time zone', required: true },
    updated_at: { type: 'timestamp without time zone', required: true }
  }
};

async function testDataRetrieval() {
  console.log('=== Database Schema Validation Test ===\n');

  try {
    // 1. Discover all STAC-related tables
    console.log('1. Discovering all tables in database...\n');
    const tablesResult = await query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
        AND tablename IN ('collection', 'catalog')
      ORDER BY tablename
    `);

    const discoveredTables = tablesResult.rows.map(r => r.tablename);
    console.log(`✓ Found ${discoveredTables.length} main tables: ${discoveredTables.join(', ')}\n`);

    // 2. Validate each table's schema
    console.log('2. Validating table schemas against expected structure...\n');
    
    let allValid = true;
    
    for (const tableName of discoveredTables) {
      console.log(`--- Validating ${tableName.toUpperCase()} table ---\n`);
      
      // Get actual columns from database
      const columnsResult = await query(`
        SELECT 
          column_name,
          data_type,
          udt_name,
          is_nullable
        FROM information_schema.columns
        WHERE table_name = $1
        ORDER BY ordinal_position
      `, [tableName]);
      
      const actualColumns = {};
      columnsResult.rows.forEach(col => {
        actualColumns[col.column_name] = {
          type: col.data_type === 'USER-DEFINED' ? col.udt_name : col.data_type,
          nullable: col.is_nullable === 'YES'
        };
      });
      
      const expectedSchema = EXPECTED_SCHEMAS[tableName];
      
      if (!expectedSchema) {
        console.log(`⚠ No expected schema defined for ${tableName}\n`);
        continue;
      }
      
      // Check expected columns exist
      console.log('Expected columns validation:');
      for (const [colName, expected] of Object.entries(expectedSchema)) {
        const actual = actualColumns[colName];
        
        if (!actual) {
          console.log(`  ✗ ${colName}: MISSING (expected ${expected.type})`);
          allValid = false;
        } else {
          // Normalize type names for comparison
          const actualType = actual.type.toLowerCase();
          const expectedType = expected.type.toLowerCase();
          
          // Check if types match (allow some variations)
          const typeMatch = actualType === expectedType || 
                            actualType.includes(expectedType) ||
                            expectedType.includes(actualType) ||
                            (expectedType === 'geometry' && actualType === 'geometry');
          
          if (typeMatch) {
            console.log(`  ✓ ${colName}: ${actual.type} ${expected.required ? '(required)' : '(optional)'}`);
          } else {
            console.log(`  ✗ ${colName}: type mismatch - found ${actual.type}, expected ${expected.type}`);
            allValid = false;
          }
        }
      }
      
      // Check for unexpected columns
      console.log('\nAdditional columns found:');
      let hasAdditional = false;
      for (const colName of Object.keys(actualColumns)) {
        if (!expectedSchema[colName]) {
          console.log(`  + ${colName}: ${actualColumns[colName].type}`);
          hasAdditional = true;
        }
      }
      if (!hasAdditional) {
        console.log('  (none)');
      }
      console.log('');
    }

    // 3. Test data retrieval for each table
    console.log('3. Testing data retrieval capabilities...\n');
    
    for (const tableName of discoveredTables) {
      console.log(`--- Testing ${tableName.toUpperCase()} data retrieval ---\n`);
      
      // Get row count
      const countResult = await query(`SELECT COUNT(*) as count FROM ${tableName}`);
      const rowCount = countResult.rows[0].count;
      console.log(`  ✓ Table contains ${rowCount} rows`);
      
      if (rowCount > 0) {
        // Test retrieving sample data
        const sampleResult = await query(`SELECT * FROM ${tableName} LIMIT 1`);
        const sample = sampleResult.rows[0];
        
        console.log(`  ✓ Sample data retrieved successfully`);
        
        // Validate each column has retrievable data
        const expectedSchema = EXPECTED_SCHEMAS[tableName];
        let fieldsWithData = 0;
        let requiredFieldsMissing = [];
        
        for (const [colName, expected] of Object.entries(expectedSchema)) {
          const value = sample[colName];
          if (value !== null && value !== undefined) {
            fieldsWithData++;
          } else if (expected.required) {
            requiredFieldsMissing.push(colName);
          }
        }
        
        console.log(`  ✓ ${fieldsWithData}/${Object.keys(expectedSchema).length} expected fields contain data`);
        
        if (requiredFieldsMissing.length > 0) {
          console.log(`  ✗ Required fields with NULL data: ${requiredFieldsMissing.join(', ')}`);
          allValid = false;
        }
        
        // Test special data types
        if (tableName === 'collection' && sample.spatial_extend) {
          try {
            const geomType = await query(`
              SELECT ST_GeometryType(spatial_extend) as geom_type 
              FROM ${tableName} 
              WHERE spatial_extend IS NOT NULL 
              LIMIT 1
            `);
            console.log(`  ✓ Geometry data type: ${geomType.rows[0].geom_type}`);
          } catch (e) {
            console.log(`  ✗ Failed to query geometry type: ${e.message}`);
            allValid = false;
          }
        }
        
        if (sample.full_json) {
          console.log(`  ✓ JSONB data present with ${Object.keys(sample.full_json).length} keys`);
        }
      } else {
        console.log(`  ⚠ No data in table to validate`);
      }
      
      console.log('');
    }

    console.log('=== Schema Validation Summary ===\n');
    
    if (allValid) {
      console.log('✓ All table schemas match expected structure');
      console.log('✓ All data types are correctly set');
      console.log('✓ All required fields contain data');
      process.exit(0);
    } else {
      console.log('✗ Some schema mismatches or missing required data detected');
      console.log('  Review the output above for details');
      process.exit(1);
    }

  } catch (error) {
    console.error('✗ Data retrieval test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testDataRetrieval();
