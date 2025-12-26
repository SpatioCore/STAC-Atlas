const { query, closePool } = require('../db/db_APIconnection');
const { buildCollectionSearchQuery } = require('../db/buildCollectionSearchQuery');

/**
 * Integration Tests: Aggregated Fields in Collection Search Query
 * 
 * These tests verify that the LATERAL JOINs correctly aggregate data from
 * normalized tables (keywords, providers, assets, stac_extensions, summaries, crawllog).
 * 
 * Prerequisites:
 * - Database must be initialized with schema (01-05_*.sql)
 * - Test data should include collections with related entities
 */

describe('Integration: Collection Search with Aggregated Fields', () => {
  afterAll(async () => {
    await closePool();
  });

  describe('Query Execution', () => {
    test('should execute query successfully without errors', async () => {
      const { sql, values } = buildCollectionSearchQuery({ limit: 5, token: 0 });
      
      await expect(query(sql, values)).resolves.not.toThrow();
    });

    test('should return rows with aggregated fields', async () => {
      const { sql, values } = buildCollectionSearchQuery({ limit: 5, token: 0 });
      const result = await query(sql, values);

      expect(result.rows).toBeDefined();
      expect(Array.isArray(result.rows)).toBe(true);
      
      // If there are collections in DB, verify structure
      if (result.rows.length > 0) {
        const firstRow = result.rows[0];
        
        // Core collection fields
        expect(firstRow).toHaveProperty('id');
        expect(firstRow).toHaveProperty('title');
        expect(firstRow).toHaveProperty('description');
        expect(firstRow).toHaveProperty('license');
        expect(firstRow).toHaveProperty('full_json');
        
        // Aggregated fields (may be null if no related data)
        expect(firstRow).toHaveProperty('keywords');
        expect(firstRow).toHaveProperty('stac_extensions');
        expect(firstRow).toHaveProperty('providers');
        expect(firstRow).toHaveProperty('assets');
        expect(firstRow).toHaveProperty('summaries');
        expect(firstRow).toHaveProperty('last_crawled');
      }
    });
  });

  describe('Aggregated Field Types', () => {
    test('keywords should be JSONB array or null', async () => {
      const { sql, values } = buildCollectionSearchQuery({ limit: 10, token: 0 });
      const result = await query(sql, values);

      result.rows.forEach(row => {
        if (row.keywords !== null) {
          expect(Array.isArray(row.keywords)).toBe(true);
          // Each keyword should be a string
          row.keywords.forEach(kw => {
            expect(typeof kw).toBe('string');
          });
        }
      });
    });

    test('stac_extensions should be JSONB array or null', async () => {
      const { sql, values } = buildCollectionSearchQuery({ limit: 10, token: 0 });
      const result = await query(sql, values);

      result.rows.forEach(row => {
        if (row.stac_extensions !== null) {
          expect(Array.isArray(row.stac_extensions)).toBe(true);
          row.stac_extensions.forEach(ext => {
            expect(typeof ext).toBe('string');
          });
        }
      });
    });

    test('providers should be JSONB array of objects or null', async () => {
      const { sql, values } = buildCollectionSearchQuery({ limit: 10, token: 0 });
      const result = await query(sql, values);

      result.rows.forEach(row => {
        if (row.providers !== null) {
          expect(Array.isArray(row.providers)).toBe(true);
          row.providers.forEach(provider => {
            expect(provider).toHaveProperty('name');
            expect(provider).toHaveProperty('roles');
            expect(typeof provider.name).toBe('string');
          });
        }
      });
    });

    test('assets should be JSONB array of objects or null', async () => {
      const { sql, values } = buildCollectionSearchQuery({ limit: 10, token: 0 });
      const result = await query(sql, values);

      result.rows.forEach(row => {
        if (row.assets !== null) {
          expect(Array.isArray(row.assets)).toBe(true);
          row.assets.forEach(asset => {
            expect(asset).toHaveProperty('name');
            expect(asset).toHaveProperty('href');
            expect(asset).toHaveProperty('type');
            expect(asset).toHaveProperty('roles');
            expect(asset).toHaveProperty('metadata');
            expect(asset).toHaveProperty('collection_roles');
          });
        }
      });
    });

    test('summaries should be JSONB object or null', async () => {
      const { sql, values } = buildCollectionSearchQuery({ limit: 10, token: 0 });
      const result = await query(sql, values);

      result.rows.forEach(row => {
        if (row.summaries !== null) {
          expect(typeof row.summaries).toBe('object');
          expect(Array.isArray(row.summaries)).toBe(false);
          
          // Each summary should be a range, set, or schema object
          Object.values(row.summaries).forEach(summary => {
            const hasRange = summary.min !== undefined && summary.max !== undefined;
            const isSet = Array.isArray(summary) || typeof summary === 'string';
            const isSchema = typeof summary === 'object';
            
            expect(hasRange || isSet || isSchema).toBe(true);
          });
        }
      });
    });

    test('last_crawled should be timestamp or null', async () => {
      const { sql, values } = buildCollectionSearchQuery({ limit: 10, token: 0 });
      const result = await query(sql, values);

      result.rows.forEach(row => {
        if (row.last_crawled !== null) {
          // Should be a valid Date or parseable timestamp
          const date = new Date(row.last_crawled);
          expect(date.toString()).not.toBe('Invalid Date');
        }
      });
    });
  });

  describe('Filter Compatibility with Aggregated Fields', () => {
    test('bbox filter works with aggregated fields', async () => {
      const bbox = [-180, -90, 180, 90]; // World bbox
      const { sql, values } = buildCollectionSearchQuery({ bbox, limit: 10, token: 0 });
      
      const result = await query(sql, values);
      
      expect(result.rows).toBeDefined();
      // All returned rows should have the aggregated structure
      result.rows.forEach(row => {
        expect(row).toHaveProperty('keywords');
        expect(row).toHaveProperty('providers');
        expect(row).toHaveProperty('assets');
      });
    });

    test('datetime filter works with aggregated fields', async () => {
      const datetime = '2000-01-01/2030-12-31';
      const { sql, values } = buildCollectionSearchQuery({ datetime, limit: 10, token: 0 });
      
      const result = await query(sql, values);
      
      expect(result.rows).toBeDefined();
      result.rows.forEach(row => {
        expect(row).toHaveProperty('stac_extensions');
        expect(row).toHaveProperty('summaries');
        expect(row).toHaveProperty('last_crawled');
      });
    });

    test('fulltext search works with aggregated fields', async () => {
      const q = 'test';
      const { sql, values } = buildCollectionSearchQuery({ q, limit: 10, token: 0 });
      
      const result = await query(sql, values);
      
      expect(result.rows).toBeDefined();
      result.rows.forEach(row => {
        expect(row).toHaveProperty('keywords');
        expect(row).toHaveProperty('providers');
      });
    });

    test('combined filters work with aggregated fields', async () => {
      const bbox = [-180, -90, 180, 90];
      const datetime = '2000-01-01/2030-12-31';
      const q = 'satellite';
      const { sql, values } = buildCollectionSearchQuery({ q, bbox, datetime, limit: 5, token: 0 });
      
      const result = await query(sql, values);
      
      expect(result.rows).toBeDefined();
      result.rows.forEach(row => {
        // All aggregated fields should be present
        expect(row).toHaveProperty('keywords');
        expect(row).toHaveProperty('stac_extensions');
        expect(row).toHaveProperty('providers');
        expect(row).toHaveProperty('assets');
        expect(row).toHaveProperty('summaries');
        expect(row).toHaveProperty('last_crawled');
      });
    });
  });

  describe('Sorting with Aggregated Fields', () => {
    test('default sort by c.id works with aggregated fields', async () => {
      const { sql, values } = buildCollectionSearchQuery({ limit: 10, token: 0 });
      const result = await query(sql, values);

      if (result.rows.length > 1) {
        // IDs should be in ascending order
        for (let i = 1; i < result.rows.length; i++) {
          expect(result.rows[i].id).toBeGreaterThanOrEqual(result.rows[i - 1].id);
        }
      }
    });

    test('sort by title works with aggregated fields', async () => {
      const sortby = { field: 'title', direction: 'ASC' };
      const { sql, values } = buildCollectionSearchQuery({ sortby, limit: 10, token: 0 });
      const result = await query(sql, values);

      // Verify SQL contains ORDER BY c.title ASC
      expect(sql).toMatch(/ORDER BY c\.title ASC/);
      
      // Verify all aggregated fields are present
      expect(result.rows).toBeDefined();
      result.rows.forEach(row => {
        expect(row).toHaveProperty('keywords');
        expect(row).toHaveProperty('providers');
        expect(row).toHaveProperty('assets');
      });
    });

    test('fulltext rank sort works with aggregated fields', async () => {
      const q = 'satellite';
      const { sql, values } = buildCollectionSearchQuery({ q, limit: 10, token: 0 });
      const result = await query(sql, values);

      // Should execute without error; rank ordering is implicit in SQL
      expect(result.rows).toBeDefined();
      result.rows.forEach(row => {
        expect(row).toHaveProperty('keywords');
        expect(row).toHaveProperty('providers');
      });
    });
  });

  describe('Pagination with Aggregated Fields', () => {
    test('first page returns correct structure', async () => {
      const { sql, values } = buildCollectionSearchQuery({ limit: 3, token: 0 });
      const result = await query(sql, values);

      expect(result.rows.length).toBeLessThanOrEqual(3);
      result.rows.forEach(row => {
        expect(row).toHaveProperty('id');
        expect(row).toHaveProperty('keywords');
        expect(row).toHaveProperty('providers');
      });
    });

    test('second page returns different rows with same structure', async () => {
      const page1 = await query(...Object.values(buildCollectionSearchQuery({ limit: 3, token: 0 })));
      const page2 = await query(...Object.values(buildCollectionSearchQuery({ limit: 3, token: 3 })));

      if (page1.rows.length > 0 && page2.rows.length > 0) {
        // IDs should be different
        const page1Ids = page1.rows.map(r => r.id);
        const page2Ids = page2.rows.map(r => r.id);
        
        const overlap = page1Ids.filter(id => page2Ids.includes(id));
        expect(overlap.length).toBe(0);

        // Both pages should have same structure
        page2.rows.forEach(row => {
          expect(row).toHaveProperty('keywords');
          expect(row).toHaveProperty('providers');
          expect(row).toHaveProperty('assets');
        });
      }
    });
  });

  describe('Performance and Cardinality', () => {
    test('LATERAL JOINs do not duplicate collection rows', async () => {
      const { sql, values } = buildCollectionSearchQuery({ limit: 100, token: 0 });
      const result = await query(sql, values);

      // Collect all IDs
      const ids = result.rows.map(r => r.id);
      const uniqueIds = [...new Set(ids)];

      // No duplicates: each collection should appear exactly once
      expect(ids.length).toBe(uniqueIds.length);
    });

    test('query executes in reasonable time (<5s for small dataset)', async () => {
      const start = Date.now();
      const { sql, values } = buildCollectionSearchQuery({ limit: 50, token: 0 });
      await query(sql, values);
      const duration = Date.now() - start;

      // Should complete within 5 seconds for typical test datasets
      expect(duration).toBeLessThan(5000);
    }, 10000); // 10s timeout for Jest
  });
});
