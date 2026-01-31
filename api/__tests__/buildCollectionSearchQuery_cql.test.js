const { buildCollectionSearchQuery } = require('../db/buildCollectionSearchQuery');

describe('buildCollectionSearchQuery with CQL2', () => {
    test('integrates CQL2 filter for license correctly', () => {
        const params = {
            cqlFilter: {
                sql: "c.license = $1",
                values: ['MIT']
            }
        };
        
        const { sql, values } = buildCollectionSearchQuery(params);
        
        // Check if WHERE clause contains the CQL SQL
        expect(sql).toContain("WHERE");
        expect(sql).toContain("(c.license = $1)");
        
        // Check values
        expect(values).toEqual(['MIT']);
    });

    test('integrates CQL2 filter with title and license', () => {
        const params = {
            cqlFilter: {
                sql: "(c.title = $1 AND c.license = $2)",
                values: ['Sentinel-2', 'CC-BY-4.0']
            }
        };
        
        const { sql, values } = buildCollectionSearchQuery(params);
        
        expect(sql).toContain("WHERE");
        expect(sql).toContain("(c.title = $1 AND c.license = $2)");
        expect(values).toEqual(['Sentinel-2', 'CC-BY-4.0']);
    });

    test('integrates CQL2 filter with other params and re-indexes placeholders', () => {
        const params = {
            license: 'proprietary',
            cqlFilter: {
                sql: "c.title = $1",
                values: ['My Collection']
            }
        };
        
        const { sql, values } = buildCollectionSearchQuery(params);
        
        // License is processed first, so it takes $1
        // CQL filter should be re-indexed to $2
        expect(sql).toContain("c.license = $1");
        expect(sql).toContain("(c.title = $2)");
        
        expect(values).toEqual(['proprietary', 'My Collection']);
    });
});
