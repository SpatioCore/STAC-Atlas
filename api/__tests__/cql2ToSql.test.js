const { cql2ToSql } = require('../utils/cql2ToSql');

describe('cql2ToSql', () => {
    describe('Basic Operators', () => {
        test('converts simple equality for title', () => {
            const cql = { op: '=', args: [{ property: 'title' }, 'My Collection'] };
            const values = [];
            const sql = cql2ToSql(cql, values);
            expect(sql).toBe("c.title = $1");
            expect(values).toEqual(['My Collection']);
        });

        test('converts simple equality for license', () => {
            const cql = { op: '=', args: [{ property: 'license' }, 'MIT'] };
            const values = [];
            const sql = cql2ToSql(cql, values);
            expect(sql).toBe("c.license = $1");
            expect(values).toEqual(['MIT']);
        });

        test('converts logical AND with title and license', () => {
            const cql = {
                op: 'and',
                args: [
                    { op: '=', args: [{ property: 'license' }, 'CC-BY-4.0'] },
                    { op: '=', args: [{ property: 'title' }, 'Sentinel Data'] }
                ]
            };
            const values = [];
            const sql = cql2ToSql(cql, values);
            expect(sql).toBe("(c.license = $1 AND c.title = $2)");
            expect(values).toEqual(['CC-BY-4.0', 'Sentinel Data']);
        });

        test('converts logical OR for multiple IDs', () => {
            const cql = {
                op: 'or',
                args: [
                    { op: '=', args: [{ property: 'id' }, 'sentinel-2-l2a'] },
                    { op: '=', args: [{ property: 'id' }, 'landsat-8-c2-l2'] }
                ]
            };
            const values = [];
            const sql = cql2ToSql(cql, values);
            expect(sql).toBe("(c.id = $1 OR c.id = $2)");
            expect(values).toEqual(['sentinel-2-l2a', 'landsat-8-c2-l2']);
        });
        
        test('converts IN operator for license values', () => {
            const cql = {
                op: 'in',
                args: [
                    { property: 'license' },
                    ['MIT', 'Apache-2.0', 'CC-BY-4.0']
                ]
            };
            const values = [];
            const sql = cql2ToSql(cql, values);
            expect(sql).toBe("c.license IN ($1, $2, $3)");
            expect(values).toEqual(['MIT', 'Apache-2.0', 'CC-BY-4.0']);
        });
        
        test('maps unknown properties to full_json JSONB column', () => {
            const cql = { op: '=', args: [{ property: 'custom_field' }, 'some_value'] };
            const values = [];
            const sql = cql2ToSql(cql, values);
            expect(sql).toBe("c.full_json ->> 'custom_field' = $1");
            expect(values).toEqual(['some_value']);
        });
    });

    describe('Extended Column Mappings', () => {
        test('maps all core collection fields', () => {
            const mappings = {
                'id': 'c.id',
                'stac_version': 'c.stac_version',
                'type': 'c.type',
                'title': 'c.title',
                'description': 'c.description',
                'license': 'c.license',
                'spatial_extent': 'c.spatial_extent',
                'temporal_extent_start': 'c.temporal_extent_start',
                'temporal_extent_end': 'c.temporal_extent_end',
                'created_at': 'c.created_at',
                'updated_at': 'c.updated_at',
                'is_api': 'c.is_api',
                'is_active': 'c.is_active'
            };
            
            Object.entries(mappings).forEach(([prop, expected]) => {
                const values = [];
                const sql = cql2ToSql({ op: '=', args: [{ property: prop }, 'x'] }, values);
                expect(sql).toBe(`${expected} = $1`);
            });
        });

        test('maps aggregated fields to LATERAL JOIN aliases', () => {
            const mappings = {
                'keywords': 'kw.keywords',
                'stac_extensions': 'ext.stac_extensions',
                'providers': 'prov.providers',
                'assets': 'a.assets',
                'summaries': 's.summaries',
                'last_crawled': 'cl.last_crawled'
            };
            
            Object.entries(mappings).forEach(([prop, expected]) => {
                const values = [];
                const sql = cql2ToSql({ op: '=', args: [{ property: prop }, 'x'] }, values);
                expect(sql).toBe(`${expected} = $1`);
            });
        });

        test('maps common aliases', () => {
            expect(cql2ToSql({ op: '=', args: [{ property: 'created' }, 'x'] }, []))
                .toBe('c.created_at = $1');
            expect(cql2ToSql({ op: '=', args: [{ property: 'updated' }, 'x'] }, []))
                .toBe('c.updated_at = $1');
            expect(cql2ToSql({ op: '=', args: [{ property: 'collection' }, 'x'] }, []))
                .toBe('c.id = $1');
        });
    });

    describe('Spatial Operators', () => {
        test('converts s_intersects with GeoJSON polygon', () => {
            const geojson = { type: 'Polygon', coordinates: [[[0,0],[1,0],[1,1],[0,1],[0,0]]] };
            const cql = { op: 's_intersects', args: [{ property: 'spatial_extent' }, geojson] };
            const values = [];
            const sql = cql2ToSql(cql, values);
            
            expect(sql).toBe("ST_Intersects(c.spatial_extent, ST_GeomFromGeoJSON($1))");
            expect(values).toEqual([JSON.stringify(geojson)]);
        });

        test('converts s_within with GeoJSON polygon', () => {
            const geojson = { type: 'Polygon', coordinates: [[[-10,-10],[10,-10],[10,10],[-10,10],[-10,-10]]] };
            const cql = { op: 's_within', args: [{ property: 'spatial_extent' }, geojson] };
            const values = [];
            const sql = cql2ToSql(cql, values);
            
            expect(sql).toBe("ST_Within(c.spatial_extent, ST_GeomFromGeoJSON($1))");
            expect(values).toEqual([JSON.stringify(geojson)]);
        });

        test('converts s_contains with GeoJSON point', () => {
            const geojson = { type: 'Point', coordinates: [10, 50] };
            const cql = { op: 's_contains', args: [{ property: 'spatial_extent' }, geojson] };
            const values = [];
            const sql = cql2ToSql(cql, values);
            
            expect(sql).toBe("ST_Contains(c.spatial_extent, ST_GeomFromGeoJSON($1))");
            expect(values).toEqual([JSON.stringify(geojson)]);
        });
    });

    describe('Temporal Operators', () => {
        test('converts t_intersects with closed interval', () => {
            const cql = { 
                op: 't_intersects', 
                args: [
                    { property: 'datetime' }, 
                    { interval: ['2020-01-01', '2025-12-31'] }
                ] 
            };
            const values = [];
            const sql = cql2ToSql(cql, values);
            
            expect(sql).toContain('temporal_extent_start');
            expect(sql).toContain('temporal_extent_end');
            expect(values).toEqual(['2020-01-01', '2025-12-31']);
        });

        test('converts t_intersects with open start interval', () => {
            const cql = { 
                op: 't_intersects', 
                args: [
                    { property: 'temporal_extent' }, 
                    { interval: ['..', '2025-12-31'] }
                ] 
            };
            const values = [];
            const sql = cql2ToSql(cql, values);
            
            expect(sql).toBe('c.temporal_extent_start <= $1');
            expect(values).toEqual(['2025-12-31']);
        });

        test('converts t_intersects with open end interval', () => {
            const cql = { 
                op: 't_intersects', 
                args: [
                    { property: 'datetime' }, 
                    { interval: ['2020-01-01', '..'] }
                ] 
            };
            const values = [];
            const sql = cql2ToSql(cql, values);
            
            expect(sql).toBe('c.temporal_extent_end >= $1');
            expect(values).toEqual(['2020-01-01']);
        });

        test('converts t_before', () => {
            const cql = { op: 't_before', args: [{ property: 'created_at' }, '2025-01-01'] };
            const values = [];
            const sql = cql2ToSql(cql, values);
            
            expect(sql).toBe('c.created_at < $1');
            expect(values).toEqual(['2025-01-01']);
        });

        test('converts t_after', () => {
            const cql = { op: 't_after', args: [{ property: 'updated_at' }, '2024-01-01'] };
            const values = [];
            const sql = cql2ToSql(cql, values);
            
            expect(sql).toBe('c.updated_at > $1');
            expect(values).toEqual(['2024-01-01']);
        });
    });
});
