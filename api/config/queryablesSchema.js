// config/queryablesSchema.js
/**
 * Queryables Schema for STAC Atlas (Collections)
 *
 * - Defined from bid.md (required search facets) + actual CQL2→SQL support
 * - Explicitly documents supported operators per field (vendor extension)
 *
 * Notes:
 * - Operator lists are expressed via `x-ogc-operators`.
 * - Some fields (keywords/providers/stac_extensions) are required by bid, but need explicit SQL semantics
 *   to be fully filterable via CQL2. We keep them queryable but mark limitations honestly.
 */

function buildCollectionsQueryablesSchema(baseUrl) {
  const cleanBase = String(baseUrl || '').replace(/\/+$/, '');
  const schemaId = `${cleanBase}/collections-queryables`;

  // Operator sets based on utils/cql2ToSql.js
  const OPS_STRING_BASIC = ['=', '<>', 'isNull'];
  const OPS_STRING_ADV = ['=', '<>', 'in', 'between', 'isNull']; // only if you implement semantics correctly per field
  const OPS_TEMPORAL = ['t_intersects', 't_before', 't_after', 'between', 'isNull'];
  const OPS_SPATIAL = ['s_intersects', 's_within', 's_contains', 'isNull'];

  // For keywords/providers/extensions we include them because bid expects them,
  // but filtering semantics must be implemented explicitly (e.g., EXISTS / jsonb operators).
  // Until implemented, we only claim `isNull` as truly safe.
  const OPS_ARRAY_PLANNED = ['isNull']; // upgrade later to ['in','isNull'] once semantics are implemented

  // Minimal GeoJSON Geometry schema (enough for queryables docs)
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
      'Queryable properties for STAC Atlas Collection Search. This JSON Schema defines the properties that can be referenced in CQL2 filters and documents supported operators per field.',
    additionalProperties: true,

    properties: {
      /**
       * Core fields mentioned/implicitly required for collection search
       */
      id: {
        title: 'Collection ID',
        description: 'STAC Collection identifier.',
        type: 'string',
        'x-ogc-operators': OPS_STRING_BASIC
      },
      title: {
        title: 'Title',
        description: 'Human-readable title of the collection.',
        type: 'string',
        'x-ogc-operators': OPS_STRING_BASIC
      },
      description: {
        title: 'Description',
        description: 'Human-readable description of the collection.',
        type: 'string',
        'x-ogc-operators': OPS_STRING_BASIC
      },
      license: {
        title: 'License',
        description: 'License identifier/name of the collection.',
        type: 'string',
        'x-ogc-operators': OPS_STRING_BASIC
      },

      /**
       * keywords, providers
       * TODO: explicit SQL semantics for full CQL2 filtering beyond isNull.
       */
      keywords: {
        title: 'Keywords',
        description:
          'Keywords/tags of the collection. Planned semantics: keyword membership filtering (e.g., keywords IN (...)).',
        type: 'array',
        items: { type: 'string' },
        'x-ogc-operators': OPS_ARRAY_PLANNED,
        'x-implementation-status':
          'Filtering semantics beyond isNull require explicit SQL (array/jsonb membership).'
      },
      providers: {
        title: 'Providers',
        description:
          'Providers associated with the collection. Planned semantics: provider name membership filtering (e.g., providers IN (...), matching provider.name).',
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' }
          },
          additionalProperties: true
        },
        'x-ogc-operators': OPS_ARRAY_PLANNED,
        'x-implementation-status':
          'Filtering semantics beyond isNull require explicit SQL (jsonb array elements / join).'
      },

      /**
       * Spatial/Temporal constraints (bbox, datetime, spatial_extent, temporal operators)
       */
      'extent.spatial.bbox': {
        title: 'Extent Spatial BBox',
        description:
          'STAC extent spatial bbox (informational). For CQL2 spatial operators, prefer spatial_extent with GeoJSON geometry literals.',
        type: 'array',
        items: { type: 'number' },
        'x-ogc-operators': OPS_SPATIAL
      },
      spatial_extent: {
        title: 'Spatial Extent Geometry',
        description:
          'Collection spatial extent geometry (used for CQL2 spatial operators s_intersects/s_within/s_contains). Provide GeoJSON geometry literals in the filter.',
        ...GEOJSON_GEOMETRY,
        'x-ogc-operators': OPS_SPATIAL
      },
      'extent.temporal.interval': {
        title: 'Extent Temporal Interval',
        description:
          'STAC temporal interval (informational). For CQL2 temporal operators, use datetime/temporal filtering.',
        type: 'array',
        'x-ogc-operators': OPS_TEMPORAL
      },
      datetime: {
        title: 'Datetime',
        description:
          'Datetime or interval used for temporal filtering. Supports CQL2 temporal operators (t_intersects/t_before/t_after).',
        type: 'string',
        'x-ogc-operators': OPS_TEMPORAL,
        'x-format-hint': 'ISO8601 timestamp or interval (start/end)'
      },

      /**
       * Include stac_extensions as queryable.
       */
      stac_extensions: {
        title: 'STAC Extensions',
        description:
          'List of STAC extensions used by the collection (e.g., EO, SAR, Point Cloud). Planned semantics: membership filtering.',
        type: 'array',
        items: { type: 'string' },
        'x-ogc-operators': OPS_ARRAY_PLANNED,
        'x-implementation-status':
          'Filtering semantics beyond isNull require explicit SQL (array/jsonb membership).'
      }
    }
  };
}

module.exports = { buildCollectionsQueryablesSchema };