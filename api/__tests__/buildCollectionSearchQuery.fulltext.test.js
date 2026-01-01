const { buildCollectionSearchQuery } = require('../db/buildCollectionSearchQuery');

describe('buildCollectionSearchQuery - full-text search and ranking', () => {
  test('q parameter adds plainto_tsquery condition and rank in SELECT', () => {
    const { sql, values } = buildCollectionSearchQuery({ q: 'forest', limit: 20, token: 0 });

    // should contain plainto_tsquery and @@ operator
    expect(sql).toMatch(/plainto_tsquery\('simple', \$1\)/);
    expect(sql).toMatch(/@@/);

    // rank should be part of the SELECT list
    expect(sql).toMatch(/ts_rank_cd\(/);
    expect(sql).toMatch(/AS rank/);

    // Ordering defaults to rank DESC when q present and no sortby
    expect(sql).toMatch(/ORDER BY rank DESC, c\.id ASC/);

    // values: [q, limit, token]
    expect(values[0]).toBe('forest');
    expect(values[1]).toBe(20);
    expect(values[2]).toBe(0);
  });

  test('explicit sortby overrides rank ordering', () => {
    const { sql } = buildCollectionSearchQuery({ q: 'lake', sortby: { field: 'title', direction: 'ASC' }, limit: 5, token: 0 });

    expect(sql).toMatch(/ORDER BY c\.title ASC/);
    // rank still present in select
    expect(sql).toMatch(/AS rank/);
  });

  test('parameter indexes remain correct when q + bbox combined', () => {
    const bbox = [0,0,1,1];
    const { sql, values } = buildCollectionSearchQuery({ q: 'river', bbox, limit: 2, token: 0 });

    // q uses $1, bbox uses $2..$5, then limit/token
    expect(sql).toMatch(/plainto_tsquery\('simple', \$1\)/);
    expect(sql).toMatch(/ST_MakeEnvelope\(\$2, \$3, \$4, \$5, 4326\)/);

    expect(values[0]).toBe('river');
    expect(values.slice(1,5)).toEqual(bbox);
  });
});
