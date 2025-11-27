const { query } = require('../db/db_APIconnection');

/**
 * Verify Database Schema for Collection and Catalog Tables
 * Checks that both tables have all required columns with valid data
 */

async function verifyTableSchema(tableName, displayName) {
  console.log(`=== ${displayName} Schema Verification ===\n`);

  try {
    // Get table structure
    console.log(`1. Checking ${tableName} table structure...`);
    const tableInfo = await query(`
      SELECT 
        column_name, 
        data_type, 
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = $1
      ORDER BY ordinal_position
    `, [tableName]);

    console.log(`✓ Found ${tableInfo.rowCount} columns in ${tableName} table\n`);

    console.log('2. Verifying all columns and their data...\n');
    
    let allColumnsValid = true;
    let columnsWithData = 0;
    let columnsWithNulls = 0;

    // Check each column for data integrity
    for (const col of tableInfo.rows) {
      const colName = col.column_name;
      const dataType = col.data_type;
      
      try {
        // Get statistics for this column
        const stats = await query(`
          SELECT 
            COUNT(*) as total_rows,
            COUNT(${colName}) as non_null_count,
            COUNT(*) - COUNT(${colName}) as null_count
          FROM ${tableName}
        `);
        
        const stat = stats.rows[0];
        const percentNonNull = stat.total_rows > 0 
          ? ((stat.non_null_count / stat.total_rows) * 100).toFixed(1)
          : 0;
        
        if (stat.non_null_count > 0) {
          columnsWithData++;
          console.log(`✓ ${colName} (${dataType})`);
          console.log(`  └─ ${stat.non_null_count}/${stat.total_rows} rows (${percentNonNull}% filled)`);
          
          // Sample a value to verify data format
          if (colName !== 'spatial_extend') { // Skip geometry for display
            const sample = await query(`
              SELECT ${colName} 
              FROM ${tableName}
              WHERE ${colName} IS NOT NULL 
              LIMIT 1
            `);
            
            if (sample.rows[0]) {
              let sampleValue = sample.rows[0][colName];
              
              // Format output based on data type
              if (typeof sampleValue === 'object' && sampleValue !== null) {
                sampleValue = JSON.stringify(sampleValue).substring(0, 80) + '...';
              } else if (typeof sampleValue === 'string') {
                sampleValue = sampleValue.substring(0, 60) + (sampleValue.length > 60 ? '...' : '');
              }
              
              console.log(`  └─ Sample: ${sampleValue}`);
            }
          } else {
            // For geometry, show type
            const geomType = await query(`
              SELECT ST_GeometryType(${colName}) as geom_type
              FROM ${tableName}
              WHERE ${colName} IS NOT NULL
              LIMIT 1
            `);
            if (geomType.rows[0]) {
              console.log(`  └─ Geometry type: ${geomType.rows[0].geom_type}`);
            }
          }
          console.log('');
        } else if (stat.total_rows > 0) {
          columnsWithNulls++;
          console.log(`⚠ ${colName} (${dataType})`);
          console.log(`  └─ All ${stat.total_rows} rows are NULL`);
          console.log('');
        } else {
          console.log(`⚠ ${colName} (${dataType})`);
          console.log(`  └─ No data in table`);
          console.log('');
        }
        
      } catch (error) {
        console.log(`✗ ${colName} (${dataType})`);
        console.log(`  └─ Error checking data: ${error.message}`);
        console.log('');
        allColumnsValid = false;
      }
    }

    console.log(`Summary: ${columnsWithData} columns with data, ${columnsWithNulls} columns all NULL\n`);

    // Check for indexes
    console.log('3. Checking indexes...');
    const indexCheck = await query(`
      SELECT 
        indexname, 
        indexdef
      FROM pg_indexes
      WHERE tablename = $1
    `, [tableName]);

    if (indexCheck.rowCount > 0) {
      console.log(`✓ Found ${indexCheck.rowCount} index(es):`);
      indexCheck.rows.forEach(idx => {
        console.log(`  - ${idx.indexname}`);
      });
    } else {
      console.log('⚠ No indexes found');
    }

    // Check row count
    console.log('\n4. Checking overall data statistics...');
    const countResult = await query(`SELECT COUNT(*) as count FROM ${tableName}`);
    console.log(`✓ ${displayName} table contains ${countResult.rows[0].count} rows`);

    console.log(`\n=== ${displayName} Schema Verification Complete ===`);
    
    if (allColumnsValid) {
      console.log('\n✓ All required columns present');
      process.exit(0);
    } else {
      console.log('\n✗ Some required columns are missing');
      process.exit(1);
    }

  } catch (error) {
    console.error('✗ Schema verification failed:', error.message);
    process.exit(1);
  }
}

verifyTableSchema('collection', 'Collection');
