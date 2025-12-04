-- creates every table related to collections

-- Main collection table: Stores STAC collection metadata with spatial and temporal extents
-- Collections group related STAC items and define their common properties
-- full_json: Complete JSONB representation the whole collection
CREATE TABLE collection (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    stac_version TEXT,
    stac_id INTEGER,
    type TEXT,
    title TEXT,
    description TEXT,
    license TEXT,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),

    spatial_extend GEOMETRY(POLYGON, 4326),
    temporal_extend_start TIMESTAMP,
    temporal_extend_end TIMESTAMP,

    is_api BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,

    full_json JSONB
);

-- Collection summaries: Stores summaries for collection properties
-- represent ranges (min/max), sets of values, or JSON schemas
-- Used to describe the range of values found in collection items
CREATE TABLE collection_summaries (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    collection_id INTEGER REFERENCES collection(id) ON DELETE CASCADE,
    name TEXT,
    kind TEXT,
    range_min NUMERIC,
    range_max NUMERIC,
    set_value TEXT,
    json_schema JSONB
);

-- Providers lookup table: Stores unique data provider names
-- Providers are organizations or entities that produce, host, or process the data
CREATE TABLE providers (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    provider TEXT UNIQUE
);

-- Assets table: Stores downloadable assets (data files, thumbnails, metadata files, etc.)
-- Assets are the actual data products or resources associated with collections
CREATE TABLE assets (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name TEXT,
    href TEXT,
    type TEXT,
    roles TEXT[],
    metadata JSONB
);

-- Crawl log for collections: Tracks when each collection was last crawled for updates
-- Used to schedule re-crawling and maintain freshness of collection data
-- (same usecase as the crawllog for catalogs)
CREATE TABLE crawllog_collection (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    collection_id INTEGER REFERENCES collection(id) ON DELETE CASCADE,
    last_crawled TIMESTAMP
);
