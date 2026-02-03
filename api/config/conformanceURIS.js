// config/conformanceURIS.js

// Shared list of conformance URIs used by both:
// - GET /
// - GET /conformance

const CONFORMANCE_URIS = [
      // STAC API Core
      'https://api.stacspec.org/v1.0.0/core',
      'https://api.stacspec.org/v1.0.0/collections',
      
      // Collection Search conformance classes
      'https://api.stacspec.org/v1.0.0/collection-search',
      'http://www.opengis.net/spec/ogcapi-common-2/1.0/conf/simple-query',  // Simple Query (bbox, datetime, limit)
      'https://api.stacspec.org/v1.0.0-rc.1/collection-search#free-text',   // Free-text search
      'https://api.stacspec.org/v1.0.0-rc.1/collection-search#filter',      // CQL2 Filter
      'https://api.stacspec.org/v1.1.0/collection-search#sort',             // Sorting
      
      // CQL2 Basic conformance classes
      'http://www.opengis.net/spec/cql2/1.0/conf/basic-cql2',               // Basic CQL2 (=, <, >, <=, >=, <>, and, or, not)
      'http://www.opengis.net/spec/cql2/1.0/conf/advanced-comparison-operators', // between, in, isNull
      'http://www.opengis.net/spec/cql2/1.0/conf/cql2-json',                // CQL2 JSON encoding
      'http://www.opengis.net/spec/cql2/1.0/conf/cql2-text',                // CQL2 Text encoding
      
      // CQL2 Spatial conformance classes
      'http://www.opengis.net/spec/cql2/1.0/conf/basic-spatial-functions',  // s_intersects
      'http://www.opengis.net/spec/cql2/1.0/conf/spatial-functions',        // s_within, s_contains, etc.
      
      // CQL2 Temporal conformance classes
      'http://www.opengis.net/spec/cql2/1.0/conf/temporal-functions',       // t_intersects, t_before, t_after

      'http://www.opengis.net/spec/ogcapi-features-1/1.0/conf/collections',
      'http://www.opengis.net/spec/ogcapi-features-1/1.0/conf/core',
      'https://api.stacspec.org/v1.1.0/collection-search#sortables',

      
    ];

module.exports = {
  CONFORMANCE_URIS
};
