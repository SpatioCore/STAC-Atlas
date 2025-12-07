-- PostGIS: Provides spatial data types (geometry, geography) and functions for GIS operations
-- Used for storing and querying geographic bounding boxes of collections
CREATE EXTENSION IF NOT EXISTS postgis;

-- pg_trgm: Enables trigram-based text similarity and fuzzy text search
-- Used for full-text search on catalog and collection titles/descriptions
CREATE EXTENSION IF NOT EXISTS pg_trgm;
