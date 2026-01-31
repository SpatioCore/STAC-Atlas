const { buildCollectionSearchQuery } = require('../db/buildCollectionSearchQuery');

describe('buildCollectionSearchQuery - basic cases', () => {
  test('no params returns base SQL with LIMIT/OFFSET placeholders', () => {
    const { sql, values } = buildCollectionSearchQuery({ limit: 10, token: 0 });

    expect(sql).toMatch(/FROM collection c/);
    expect(sql).toMatch(/ORDER BY c\.stac_id ASC/);
    // there should be LIMIT and OFFSET placeholders
    expect(sql).toMatch(/LIMIT \$1 OFFSET \$2/);
    expect(Array.isArray(values)).toBe(true);
    // values should contain limit and token
    expect(values.length).toBe(2);
    expect(values).toEqual([10, 0]);
  });

  test('bbox adds ST_MakeEnvelope parameters in order', () => {
    const bbox = [-10, 40, 10, 50];
    const { sql, values } = buildCollectionSearchQuery({ bbox, limit: 5, token: 0 });

    // Ensure ST_MakeEnvelope uses $1..$4 when bbox is first
    expect(sql).toMatch(/ST_MakeEnvelope\(\$1, \$2, \$3, \$4, 4326\)/);
    // After bbox, limit and token are appended
    expect(values.slice(0,4)).toEqual(bbox);
    expect(values[4]).toBe(5);
    expect(values[5]).toBe(0);
  });

  test('datetime closed interval produces start/end conditions', () => {
    const datetime = '2020-01-01/2021-12-31';
    const { sql, values } = buildCollectionSearchQuery({ datetime, limit: 10, token: 0 });

    expect(sql).toMatch(/c\.temporal_extent_end >= \$1/);
    expect(sql).toMatch(/c\.temporal_extent_start <= \$2/);
    // values order: start, end, limit, token
    expect(values[0]).toBe('2020-01-01');
    expect(values[1]).toBe('2021-12-31');
    expect(values[2]).toBe(10);
    expect(values[3]).toBe(0);
  });
});