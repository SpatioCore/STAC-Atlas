// config/queryablesSchema.js
/**
 * Queryables Schema for STAC Atlas (Collections)
 *
 * This schema documents which properties can be used in CQL2 filter expressions.
 * It is based on:
 * - Database schema (collection table + LATERAL JOINs)
 * - Property mappings in utils/cql2ToSql.js
 * - Supported CQL2 operators in the implementation
 *
 * IMPORTANT: This schema describes CQL2 filter properties, NOT query parameters.
 * Query parameters like ?q=, ?bbox=, ?limit= are handled separately via validateCollectionSearchParams.
 *
 * Notes:
 * - Operator lists are expressed via `x-ogc-operators` (vendor extension)
 * - Properties map to database columns (c.title, c.license, etc.)
 * - Aggregated fields (keywords, providers) have limited filtering support
 * - Unknown properties fall back to full_json JSONB column
 */

function buildCollectionsQueryablesSchema(baseUrl) {
  const cleanBase = String(baseUrl || '').replace(/\/+$/, '');
  const schemaId = `${cleanBase}/collection-queryables`;

  // Operator sets based on utils/cql2ToSql.js implementation
  const OPS_COMPARISON = ['=', '<>', '<', '<=', '>', '>='];
  const OPS_RANGE = ['between'];
  const OPS_SET = ['in'];
  const OPS_NULL = ['isNull'];
  const OPS_LIKE = ['like'];
  const OPS_LOGICAL = ['and', 'or', 'not']; // Applied to expressions, not properties
  
  const OPS_STRING = [...OPS_COMPARISON, ...OPS_RANGE, ...OPS_SET, ...OPS_NULL, ...OPS_LIKE];
  const OPS_NUMERIC = [...OPS_COMPARISON, ...OPS_RANGE, ...OPS_SET, ...OPS_NULL];
  const OPS_BOOLEAN = ['=', '<>', ...OPS_NULL];
  const OPS_TIMESTAMP = [...OPS_COMPARISON, ...OPS_RANGE, ...OPS_SET, ...OPS_NULL, 't_before', 't_after', 't_intersects'];
  const OPS_GEOMETRY = ['s_intersects', 's_within', 's_contains', ...OPS_NULL];
  
  // Array fields: Currently only isNull is safe; full filtering requires JSONB/array logic
  const OPS_ARRAY_LIMITED = [...OPS_NULL];

  // Minimal GeoJSON Geometry schema
  const GEOJSON_GEOMETRY = {
    type: 'object',
    required: ['type', 'coordinates'],
    properties: {
      type: {
        type: 'string',
        enum: [
          'Point',
          'MultiPoint',
          'LineString',
          'MultiLineString',
          'Polygon',
          'MultiPolygon',
          'GeometryCollection'
        ]
      },
      coordinates: {},
      geometries: { type: 'array', items: {} }
    },
    additionalProperties: true
  };

  return {
    $schema: 'https://json-schema.org/draft/2019-09/schema',
    $id: schemaId,
    type: 'object',
    title: 'STAC Atlas Collections Queryables',
    description:
      'Queryable properties for STAC Collection Search via CQL2 filters. These properties can be referenced in filter expressions passed via the ?filter= parameter.',
    additionalProperties: true,

    properties: {
      // ==================== Core Collection Fields ====================
      
      id: {
        title: 'Collection ID',
        description: 'STAC Collection identifier (string or numeric). Maps to c.id.',
        type: ['string'],
        'x-ogc-operators': OPS_STRING,
        'x-ogc-property': 'c.id'
      },

      stac_version: {
        title: 'STAC Version',
        description: 'STAC specification version (e.g., "1.0.0"). Maps to c.stac_version.',
        type: 'string',
        'x-ogc-operators': OPS_STRING,
        'x-ogc-property': 'c.stac_version'
      },

      type: {
        title: 'Type',
        description: 'Resource type, typically "Collection". Maps to c.type.',
        type: 'string',
        'x-ogc-operators': OPS_STRING,
        'x-ogc-property': 'c.type'
      },

      title: {
        title: 'Title',
        description: 'Human-readable title of the collection. Maps to c.title.',
        type: 'string',
        'x-ogc-operators': OPS_STRING,
        'x-ogc-property': 'c.title'
      },

      description: {
        title: 'Description',
        description: 'Detailed description of the collection. Maps to c.description.',
        type: 'string',
        'x-ogc-operators': OPS_STRING,
        'x-ogc-property': 'c.description'
      },

      license: {
        title: 'License',
        description: 'License identifier (e.g., "MIT", "CC-BY-4.0"). Maps to c.license.',
        type: 'string',
        'x-ogc-operators': OPS_STRING,
        'x-ogc-property': 'c.license'
      },

      // ==================== Spatial/Temporal ====================

      spatial_extent: {
        title: 'Spatial Extent',
        description: 'Collection spatial extent as PostGIS geometry. Use with spatial operators (s_intersects, s_within, s_contains) and GeoJSON geometry literals. Maps to c.spatial_extent.',
        ...GEOJSON_GEOMETRY,
        'x-ogc-operators': OPS_GEOMETRY,
        'x-ogc-property': 'c.spatial_extent',
        'x-example': 's_intersects(spatial_extent, {"type":"Polygon","coordinates":[[[0,0],[10,0],[10,10],[0,10],[0,0]]]})'
      },

      temporal_extent_start: {
        title: 'Temporal Extent Start',
        description: 'Start of the temporal extent (ISO8601 timestamp). Maps to c.temporal_extent_start.',
        type: 'string',
        format: 'date-time',
        'x-ogc-operators': OPS_TIMESTAMP,
        'x-ogc-property': 'c.temporal_extent_start'
      },

      temporal_extent_end: {
        title: 'Temporal Extent End',
        description: 'End of the temporal extent (ISO8601 timestamp). Maps to c.temporal_extent_end.',
        type: 'string',
        format: 'date-time',
        'x-ogc-operators': OPS_TIMESTAMP,
        'x-ogc-property': 'c.temporal_extent_end'
      },

      // ==================== Metadata Fields ====================

      created_at: {
        title: 'Created At',
        description: 'Collection creation timestamp. Maps to c.created_at.',
        type: 'string',
        format: 'date-time',
        'x-ogc-operators': OPS_TIMESTAMP,
        'x-ogc-property': 'c.created_at'
      },

      updated_at: {
        title: 'Updated At',
        description: 'Collection last update timestamp. Maps to c.updated_at.',
        type: 'string',
        format: 'date-time',
        'x-ogc-operators': OPS_TIMESTAMP,
        'x-ogc-property': 'c.updated_at'
      },

      is_api: {
        title: 'Is API',
        description: 'Whether collection is exposed via API. Maps to c.is_api.',
        type: 'boolean',
        'x-ogc-operators': OPS_BOOLEAN,
        'x-ogc-property': 'c.is_api'
      },

      is_active: {
        title: 'Is Active',
        description: 'Whether collection is currently active. Maps to c.is_active.',
        type: 'boolean',
        'x-ogc-operators': OPS_BOOLEAN,
        'x-ogc-property': 'c.is_active'
      },

      active: {
        title: 'Active (Alias)',
        description: 'Alias for is_active. Filter for active collections. Maps to c.is_active.',
        type: 'boolean',
        'x-ogc-operators': OPS_BOOLEAN,
        'x-ogc-property': 'c.is_active',
        'x-ogc-alias-of': 'is_active'
      },

      api: {
        title: 'API (Alias)',
        description: 'Alias for is_api. Filter for API-based collections. Maps to c.is_api.',
        type: 'boolean',
        'x-ogc-operators': OPS_BOOLEAN,
        'x-ogc-property': 'c.is_api',
        'x-ogc-alias-of': 'is_api'
      },

      // ==================== Aggregated Fields (LATERAL JOINs) ====================

      keywords: {
        title: 'Keywords',
        description: 'Collection keywords/tags. Maps to kw.keywords from LATERAL JOIN. Limited filtering support: only isNull is guaranteed.',
        type: 'array',
        items: { type: 'string' },
        'x-ogc-operators': OPS_ARRAY_LIMITED,
        'x-ogc-property': 'kw.keywords',
        'x-implementation-status': 'Array filtering beyond isNull requires explicit JSONB/array membership logic (not yet implemented).'
      },

      stac_extensions: {
        title: 'STAC Extensions',
        description: 'List of STAC extensions used (e.g., "eo", "sar"). Maps to ext.stac_extensions from LATERAL JOIN. Limited filtering support: only isNull is guaranteed.',
        type: 'array',
        items: { type: 'string' },
        'x-ogc-operators': OPS_ARRAY_LIMITED,
        'x-ogc-property': 'ext.stac_extensions',
        'x-implementation-status': 'Array filtering beyond isNull requires explicit JSONB/array membership logic (not yet implemented).'
      },

      providers: {
        title: 'Providers',
        description: 'Providers associated with the collection. Maps to prov.providers from LATERAL JOIN. Limited filtering support: only isNull is guaranteed.',
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            roles: { type: 'array', items: { type: 'string' } }
          },
          additionalProperties: true
        },
        'x-ogc-operators': OPS_ARRAY_LIMITED,
        'x-ogc-property': 'prov.providers',
        'x-implementation-status': 'Provider filtering beyond isNull requires explicit JSONB array/join logic (not yet implemented).'
      },

      assets: {
        title: 'Assets',
        description: 'Collection assets. Maps to a.assets from LATERAL JOIN.',
        type: 'array',
        items: { type: 'object', additionalProperties: true },
        'x-ogc-operators': OPS_ARRAY_LIMITED,
        'x-ogc-property': 'a.assets',
        'x-implementation-status': 'Asset filtering beyond isNull requires explicit JSONB logic (not yet implemented).'
      },

      summaries: {
        title: 'Summaries',
        description: 'Collection summaries object. Maps to s.summaries from LATERAL JOIN.',
        type: 'object',
        additionalProperties: true,
        'x-ogc-operators': OPS_NULL,
        'x-ogc-property': 's.summaries',
        'x-implementation-status': 'Summary filtering requires JSONB key/value logic (not yet implemented).'
      },

      // ==================== Property Aliases ====================

      created: {
        title: 'Created (Alias)',
        description: 'Alias for created_at. Maps to c.created_at.',
        type: 'string',
        format: 'date-time',
        'x-ogc-operators': OPS_TIMESTAMP,
        'x-ogc-property': 'c.created_at',
        'x-ogc-alias-of': 'created_at'
      },

      updated: {
        title: 'Updated (Alias)',
        description: 'Alias for updated_at. Maps to c.updated_at.',
        type: 'string',
        format: 'date-time',
        'x-ogc-operators': OPS_TIMESTAMP,
        'x-ogc-property': 'c.updated_at',
        'x-ogc-alias-of': 'updated_at'
      },

      collection: {
        title: 'Collection (Alias)',
        description: 'Alias for id. Maps to c.id.',
        type: ['string'],
        'x-ogc-operators': OPS_STRING,
        'x-ogc-property': 'c.id',
        'x-ogc-alias-of': 'id'
      }
    },

    // ==================== Additional Information ====================

    'x-query-parameters': {
      description: 'Non-CQL2 query parameters supported by GET /collections endpoint',
      parameters: {
        q: {
          description: 'Free-text search across title, description',
          type: 'string',
          maxLength: 500
        },
        bbox: {
          description: 'Spatial bounding box filter: minX,minY,maxX,maxY',
          type: 'string',
          pattern: '^-?\\d+(\\.\\d+)?,-?\\d+(\\.\\d+)?,-?\\d+(\\.\\d+)?,-?\\d+(\\.\\d+)?$'
        },
        datetime: {
          description: 'Temporal filter: ISO8601 timestamp or interval',
          type: 'string',
          format: 'date-time or interval'
        },
        limit: {
          description: 'Maximum number of results (1-10000, default 10)',
          type: 'integer',
          minimum: 1,
          maximum: 10000,
          default: 10
        },
        token: {
          description: 'Pagination offset token (0-based)',
          type: 'integer',
          minimum: 0,
          default: 0
        },
        sortby: {
          description: 'Sort field with direction: +field (ASC) or -field (DESC). Allowed: id, title, license, created, updated',
          type: 'string',
          pattern: '^[+-]?(id|title|license|created|updated)$'
        },
        provider: {
          description: 'Filter by provider name',
          type: 'string',
          maxLength: 255
        },
        license: {
          description: 'Filter by license identifier',
          type: 'string',
          maxLength: 255
        },
        active: {
          description: 'Filter by active status (true/false)',
          type: 'boolean'
        },
        api: {
          description: 'Filter by API status (true/false)',
          type: 'boolean'
        },
        filter: {
          description: 'CQL2 filter expression',
          type: 'string'
        },
        'filter-lang': {
          description: 'CQL2 filter language (cql2-text or cql2-json)',
          type: 'string',
          enum: ['cql2-text', 'cql2-json'],
          default: 'cql2-text'
        }
      }
    },

    'x-cql2-operators': {
      description: 'CQL2 operators supported by the implementation',
      logical: ['and', 'or', 'not'],
      comparison: ['=', '<>', '<', '<=', '>', '>='],
      spatial: ['s_intersects', 's_within', 's_contains'],
      temporal: ['t_intersects', 't_before', 't_after'],
      array: ['in'],
      other: ['between', 'isNull']
    },

    'x-property-mapping': {
      description: 'Properties not explicitly listed are queried via c.full_json JSONB column using ->> operator',
      example: 'unknown_field = "value" → c.full_json ->> \'unknown_field\' = $n'
    }
  };
}

module.exports = { buildCollectionsQueryablesSchema };
