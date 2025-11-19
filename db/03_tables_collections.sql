-- creates every table related to collections

CREATE TABLE collection (
    id SERIAL PRIMARY KEY,
    stac_version TEXT,
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

CREATE TABLE collection_summaries (
    id SERIAL PRIMARY KEY,
    collection_id INTEGER REFERENCES collection(id) ON DELETE CASCADE,
    name TEXT,
    kind TEXT,
    range_min NUMERIC,
    range_max NUMERIC,
    set_value TEXT,
    json_schema JSONB
);

CREATE TABLE providers (
    id SERIAL PRIMARY KEY,
    provider TEXT UNIQUE
);

CREATE TABLE assets (
    id SERIAL PRIMARY KEY,
    name TEXT,
    href TEXT,
    type TEXT,
    roles TEXT[],
    metadata JSONB
);

CREATE TABLE crawllog_collection (
    id SERIAL PRIMARY KEY,
    collection_id INTEGER REFERENCES collection(id) ON DELETE CASCADE,
    last_crawled TIMESTAMP
);
