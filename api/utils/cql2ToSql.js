/**
 * Converts CQL2 JSON to SQL WHERE clause with parameterized values.
 * 
 * This function translates CQL2 filter expressions to PostgreSQL WHERE clauses.
 * Property names are mapped to database columns (e.g., 'title' -> 'c.title').
 * 
 * NOTE: String literals in CQL2-Text must be enclosed in single quotes!
 * Example: license = 'MIT'  (correct)
 *          license = MIT    (WRONG - MIT is interpreted as a property reference)
 * 
 * @param {Object} cql - CQL2 JSON object
 * @param {Array} values - Array to append SQL parameters to
 * @returns {string} SQL fragment
 */
function cql2ToSql(cql, values) {
    if (!cql) return 'TRUE';

    // Handle logical operators
    if (cql.op === 'and') {
        const args = cql.args.map(arg => cql2ToSql(arg, values));
        return `(${args.join(' AND ')})`;
    }
    if (cql.op === 'or') {
        const args = cql.args.map(arg => cql2ToSql(arg, values));
        return `(${args.join(' OR ')})`;
    }
    if (cql.op === 'not') {
        return `(NOT ${cql2ToSql(cql.args[0], values)})`;
    }

    // Handle comparison operators
    const opMap = {
        '=': '=',
        '<': '<',
        '>': '>',
        '<=': '<=',
        '>=': '>=',
        '<>': '<>'
    };

    if (opMap[cql.op]) {
        const leftArg = cql.args[0];
        const rightArg = cql.args[1];
        
        const left = processArg(leftArg, values);
        const right = processArg(rightArg, values);
        return `${left} ${opMap[cql.op]} ${right}`;
    }

    if (cql.op === 'between') {
        const val = processArg(cql.args[0], values);
        const min = processArg(cql.args[1], values);
        const max = processArg(cql.args[2], values);
        return `${val} BETWEEN ${min} AND ${max}`;
    }

    if (cql.op === 'in') {
        const val = processArg(cql.args[0], values);
        const list = cql.args[1].map(item => processArg(item, values)).join(', ');
        return `${val} IN (${list})`;
    }
    
    if (cql.op === 'isNull') {
         const val = processArg(cql.args[0], values);
         return `${val} IS NULL`;
    }

    // LIKE operator (pattern matching)
    if (cql.op === 'like') {
        const val = processArg(cql.args[0], values);
        const pattern = processArg(cql.args[1], values);
        return `${val} LIKE ${pattern}`;
    }

    // Spatial operators (CQL2 Advanced)
    if (cql.op === 's_intersects') {
        const geomProp = processArg(cql.args[0], values);
        const geomLiteral = cql.args[1];
        // GeoJSON geometry literal
        values.push(JSON.stringify(geomLiteral));
        return `ST_Intersects(${geomProp}, ST_GeomFromGeoJSON($${values.length}))`;
    }
    
    if (cql.op === 's_within') {
        const geomProp = processArg(cql.args[0], values);
        const geomLiteral = cql.args[1];
        values.push(JSON.stringify(geomLiteral));
        return `ST_Within(${geomProp}, ST_GeomFromGeoJSON($${values.length}))`;
    }
    
    if (cql.op === 's_contains') {
        const geomProp = processArg(cql.args[0], values);
        const geomLiteral = cql.args[1];
        values.push(JSON.stringify(geomLiteral));
        return `ST_Contains(${geomProp}, ST_GeomFromGeoJSON($${values.length}))`;
    }

    // Temporal operators (CQL2 Advanced)
    if (cql.op === 't_intersects') {
        // t_intersects(property, interval)
        // For collections: check if collection's temporal extent overlaps with given interval
        const prop = cql.args[0];
        const interval = cql.args[1];
        
        if (prop.property === 'datetime' || prop.property === 'temporal_extent') {
            // interval can be: { interval: [start, end] } or a single timestamp
            if (interval.interval) {
                const [start, end] = interval.interval;
                if (start !== '..' && end !== '..') {
                    values.push(start, end);
                    return `(c.temporal_extent_start <= $${values.length} AND c.temporal_extent_end >= $${values.length - 1})`;
                } else if (start === '..') {
                    values.push(end);
                    return `c.temporal_extent_start <= $${values.length}`;
                } else if (end === '..') {
                    values.push(start);
                    return `c.temporal_extent_end >= $${values.length}`;
                }
            } else {
                // Single timestamp
                values.push(interval);
                return `(c.temporal_extent_start <= $${values.length} AND c.temporal_extent_end >= $${values.length})`;
            }
        }
        throw new Error(`t_intersects only supported for datetime/temporal_extent property`);
    }
    
    if (cql.op === 't_before') {
        const prop = processArg(cql.args[0], values);
        values.push(cql.args[1]);
        return `${prop} < $${values.length}`;
    }
    
    if (cql.op === 't_after') {
        const prop = processArg(cql.args[0], values);
        values.push(cql.args[1]);
        return `${prop} > $${values.length}`;
    }

    // Incase cql.op hasn't matched yet it's an unsupported operator
    throw new Error(`Unsupported CQL2 operator: ${cql.op}`);
}

function processArg(arg, values) {
    if (arg === null || arg === undefined) {
        return 'NULL';
    }
    
    // Property reference
    if (arg.property) {
        return mapProperty(arg.property);
    }
    
    // Function call (not fully supported yet, but structure exists)
    if (arg.function) {
        throw new Error(`CQL2 functions not supported yet: ${arg.function.name}`);
    }

    // Literal value
    values.push(arg);
    return `$${values.length}`;
}

function mapProperty(propName) {
    // Map CQL2 property names to database columns
    // Based on SELECT columns from buildCollectionSearchQuery.js
    const columnMap = {
        // Core collection fields
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
        'is_active': 'c.is_active',
        

        // Common aliases
        'created': 'c.created_at',
        'updated': 'c.updated_at',
        'collection': 'c.id',
        
        // Aggregated fields (from LATERAL JOINs)
        'keywords': 'kw.keywords',
        'stac_extensions': 'ext.stac_extensions',
        'providers': 'prov.providers',
        'assets': 'a.assets',
        'summaries': 's.summaries',
    };

    if (columnMap[propName]) {
        return columnMap[propName];
    }

    // Fallback: query inside full_json JSONB column
    // Ensure propName is safe (alphanumeric + underscores + dots + hyphens + double colons)
    if (!/^[a-zA-Z0-9_.:-]+$/.test(propName)) {
        throw new Error(`Invalid property name: ${propName}`);
    }
    
    // Use JSONB operator ->> for text extraction
    return `c.full_json ->> '${propName}'`;
}

module.exports = { cql2ToSql };
