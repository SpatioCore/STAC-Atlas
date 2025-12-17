const { buildCollectionSearchQuery } = require('../db/buildCollectionSearchQuery');

describe('buildCollectionSearchQuery - aggregated fields', () => {
  test('SELECT includes all collection base columns with alias c', () => {
    const { sql } = buildCollectionSearchQuery({ limit: 10, token: 0 });

    // Core collection fields should be prefixed with 'c.'
    expect(sql).toMatch(/c\.id/);
    expect(sql).toMatch(/c\.stac_version/);
    expect(sql).toMatch(/c\.type/);
    expect(sql).toMatch(/c\.title/);
    expect(sql).toMatch(/c\.description/);
    expect(sql).toMatch(/c\.license/);
    expect(sql).toMatch(/c\.spatial_extend/);
    expect(sql).toMatch(/c\.temporal_extend_start/);
    expect(sql).toMatch(/c\.temporal_extend_end/);
    expect(sql).toMatch(/c\.created_at/);
    expect(sql).toMatch(/c\.updated_at/);
    expect(sql).toMatch(/c\.is_api/);
    expect(sql).toMatch(/c\.is_active/);
    expect(sql).toMatch(/c\.full_json/);
  });

  test('SELECT includes aggregated relation fields', () => {
    const { sql } = buildCollectionSearchQuery({ limit: 10, token: 0 });

    // Aggregated fields from LATERAL JOINs
    expect(sql).toMatch(/kw\.keywords/);
    expect(sql).toMatch(/ext\.stac_extensions/);
    expect(sql).toMatch(/prov\.providers/);
    expect(sql).toMatch(/a\.assets/);
    expect(sql).toMatch(/s\.summaries/);
    expect(sql).toMatch(/cl\.last_crawled/);
  });

  test('FROM clause uses collection alias c', () => {
    const { sql } = buildCollectionSearchQuery({ limit: 10, token: 0 });

    expect(sql).toMatch(/FROM collection c/);
  });

  describe('LATERAL JOINs for normalized data', () => {
    test('includes LATERAL JOIN for keywords', () => {
      const { sql } = buildCollectionSearchQuery({ limit: 10, token: 0 });

      expect(sql).toMatch(/LEFT JOIN LATERAL/);
      expect(sql).toMatch(/jsonb_agg\(k\.keyword ORDER BY k\.keyword\) AS keywords/);
      expect(sql).toMatch(/FROM collection_keywords ck/);
      expect(sql).toMatch(/JOIN keywords k ON k\.id = ck\.keyword_id/);
      expect(sql).toMatch(/WHERE ck\.collection_id = c\.id/);
    });

    test('includes LATERAL JOIN for stac_extensions', () => {
      const { sql } = buildCollectionSearchQuery({ limit: 10, token: 0 });

      expect(sql).toMatch(/jsonb_agg\(se\.stac_extension ORDER BY se\.stac_extension\) AS stac_extensions/);
      expect(sql).toMatch(/FROM collection_stac_extension cse/);
      expect(sql).toMatch(/JOIN stac_extensions se ON se\.id = cse\.stac_extension_id/);
      expect(sql).toMatch(/WHERE cse\.collection_id = c\.id/);
    });

    test('includes LATERAL JOIN for providers with roles', () => {
      const { sql } = buildCollectionSearchQuery({ limit: 10, token: 0 });

      expect(sql).toMatch(/jsonb_agg\(jsonb_build_object\(/);
      expect(sql).toMatch(/'name', p\.provider/);
      expect(sql).toMatch(/'roles', cpr\.collection_provider_roles/);
      expect(sql).toMatch(/FROM collection_providers cpr/);
      expect(sql).toMatch(/JOIN providers p ON p\.id = cpr\.provider_id/);
      expect(sql).toMatch(/WHERE cpr\.collection_id = c\.id/);
    });

    test('includes LATERAL JOIN for assets with metadata', () => {
      const { sql } = buildCollectionSearchQuery({ limit: 10, token: 0 });

      expect(sql).toMatch(/'name', a\.name/);
      expect(sql).toMatch(/'href', a\.href/);
      expect(sql).toMatch(/'type', a\.type/);
      expect(sql).toMatch(/'roles', a\.roles/);
      expect(sql).toMatch(/'metadata', a\.metadata/);
      expect(sql).toMatch(/'collection_roles', ca\.collection_asset_roles/);
      expect(sql).toMatch(/FROM collection_assets ca/);
      expect(sql).toMatch(/JOIN assets a ON a\.id = ca\.asset_id/);
      expect(sql).toMatch(/WHERE ca\.collection_id = c\.id/);
    });

    test('includes LATERAL JOIN for summaries with CASE logic', () => {
      const { sql } = buildCollectionSearchQuery({ limit: 10, token: 0 });

      expect(sql).toMatch(/jsonb_object_agg\(s\.name, s\.s_summary\) AS summaries/);
      expect(sql).toMatch(/WHEN cs\.kind = 'range' THEN jsonb_build_object\('min', cs\.range_min, 'max', cs\.range_max\)/);
      expect(sql).toMatch(/WHEN cs\.kind = 'set' THEN to_jsonb\(cs\.set_value\)/);
      expect(sql).toMatch(/FROM collection_summaries cs/);
      expect(sql).toMatch(/WHERE cs\.collection_id = c\.id/);
    });

    test('includes LATERAL JOIN for last_crawled timestamp', () => {
      const { sql } = buildCollectionSearchQuery({ limit: 10, token: 0 });

      expect(sql).toMatch(/MAX\(clc\.last_crawled\) AS last_crawled/);
      expect(sql).toMatch(/FROM crawllog_collection clc/);
      expect(sql).toMatch(/WHERE clc\.collection_id = c\.id/);
    });
  });

  describe('WHERE clauses use collection alias c', () => {
    test('bbox filter uses c.spatial_extend', () => {
      const bbox = [-10, 40, 10, 50];
      const { sql } = buildCollectionSearchQuery({ bbox, limit: 10, token: 0 });

      expect(sql).toMatch(/c\.spatial_extend/);
      expect(sql).toMatch(/ST_Intersects\(\s*c\.spatial_extend/);
    });

    test('datetime filter uses c.temporal_extend_start and c.temporal_extend_end', () => {
      const datetime = '2020-01-01/2021-12-31';
      const { sql } = buildCollectionSearchQuery({ datetime, limit: 10, token: 0 });

      expect(sql).toMatch(/c\.temporal_extend_end >= \$/);
      expect(sql).toMatch(/c\.temporal_extend_start <= \$/);
    });

    test('fulltext search uses c.title and c.description', () => {
      const q = 'satellite';
      const { sql } = buildCollectionSearchQuery({ q, limit: 10, token: 0 });

      expect(sql).toMatch(/coalesce\(c\.title,''\)/);
      expect(sql).toMatch(/coalesce\(c\.description,''\)/);
      expect(sql).toMatch(/to_tsvector\('simple', coalesce\(c\.title,''\) \|\| ' ' \|\| coalesce\(c\.description,''\)\)/);
    });
  });

  describe('ORDER BY uses collection alias c', () => {
    test('default ORDER BY uses c.id', () => {
      const { sql } = buildCollectionSearchQuery({ limit: 10, token: 0 });

      expect(sql).toMatch(/ORDER BY c\.id ASC/);
    });

    test('sortby parameter uses c. prefix', () => {
      const sortby = { field: 'title', direction: 'DESC' };
      const { sql } = buildCollectionSearchQuery({ sortby, limit: 10, token: 0 });

      expect(sql).toMatch(/ORDER BY c\.title DESC/);
    });

    test('fulltext search with rank orders by rank DESC, c.id ASC', () => {
      const q = 'satellite';
      const { sql } = buildCollectionSearchQuery({ q, limit: 10, token: 0 });

      expect(sql).toMatch(/ORDER BY rank DESC, c\.id ASC/);
    });
  });

  describe('Parameterized values remain correct', () => {
    test('bbox parameters are in correct order', () => {
      const bbox = [-10, 40, 10, 50];
      const { values } = buildCollectionSearchQuery({ bbox, limit: 10, token: 0 });

      expect(values.slice(0, 4)).toEqual(bbox);
      expect(values[4]).toBe(10); // limit
      expect(values[5]).toBe(0);  // token
    });

    test('datetime interval parameters are in correct order', () => {
      const datetime = '2020-01-01/2021-12-31';
      const { values } = buildCollectionSearchQuery({ datetime, limit: 10, token: 0 });

      expect(values[0]).toBe('2020-01-01');
      expect(values[1]).toBe('2021-12-31');
      expect(values[2]).toBe(10); // limit
      expect(values[3]).toBe(0);  // token
    });

    test('fulltext query parameter is bound correctly', () => {
      const q = 'satellite';
      const { values } = buildCollectionSearchQuery({ q, limit: 10, token: 0 });

      expect(values[0]).toBe('satellite');
      expect(values[1]).toBe(10); // limit
      expect(values[2]).toBe(0);  // token
    });

    test('combined filters maintain parameter order', () => {
      const bbox = [-10, 40, 10, 50];
      const datetime = '2020-01-01/2021-12-31';
      const q = 'satellite';
      const { values } = buildCollectionSearchQuery({ q, bbox, datetime, limit: 10, token: 0 });

      // Order: q (1), bbox (4), datetime start (1), datetime end (1), limit (1), token (1) = 9 values
      expect(values[0]).toBe('satellite');
      expect(values.slice(1, 5)).toEqual(bbox);
      expect(values[5]).toBe('2020-01-01');
      expect(values[6]).toBe('2021-12-31');
      expect(values[7]).toBe(10);
      expect(values[8]).toBe(0);
    });
  });

  describe('SQL structure validation', () => {
    test('no DISTINCT in jsonb_agg to avoid ORDER BY conflict', () => {
      const { sql } = buildCollectionSearchQuery({ limit: 10, token: 0 });

      // DISTINCT should NOT appear in any jsonb_agg calls
      // (PostgreSQL requires ORDER BY expressions to appear in DISTINCT argument list)
      const distinctPattern = /jsonb_agg\(DISTINCT/gi;
      const matches = sql.match(distinctPattern);
      
      expect(matches).toBeNull();
    });

    test('all LATERAL JOINs are LEFT JOIN', () => {
      const { sql } = buildCollectionSearchQuery({ limit: 10, token: 0 });

      // Count LEFT JOIN LATERAL occurrences (should be 6: kw, ext, prov, a, s, cl)
      const leftJoinLateralCount = (sql.match(/LEFT JOIN LATERAL/gi) || []).length;
      
      expect(leftJoinLateralCount).toBe(6);
    });
  });
});
