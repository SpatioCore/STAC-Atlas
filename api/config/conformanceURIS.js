// config/conformanceURIS.js

// Shared list of conformance URIs used by both:
// - GET /
// - GET /conformance

const CONFORMANCE_URIS = [
      'https://api.stacspec.org/v1.0.0/core',
      'https://api.stacspec.org/v1.0.0/collections',
      // Collection Search conformance classes
      'https://api.stacspec.org/v1.0.0/collection-search',
      'http://www.opengis.net/spec/ogcapi-common-2/1.0/conf/simple-query',  // Simple Query (bbox, datetime, limit)
      'https://api.stacspec.org/v1.0.0-rc.1/collection-search#free-text',   // Free-text search
      'https://api.stacspec.org/v1.0.0-rc.1/collection-search#filter',      // CQL2 Filter'
      'https://api.stacspec.org/v1.1.0/collection-search#sort',             // Sorting
      // CQL2 conformance classes
      "http://www.opengis.net/spec/cql2/1.0/conf/basic-cql2",               // Basic CQL2
      "http://www.opengis.net/spec/cql2/1.0/conf/cql2-json",                // CQL2 JSON-Querys
      "http://www.opengis.net/spec/cql2/1.0/conf/cql2-text",                // CQL2 Text-Querys
      "http://www.opengis.net/spec/cql2/1.0/conf/basic-spatial-functions"   // Basic Spatial Functions
    ]];

module.exports = {
  CONFORMANCE_URIS
};