-- creates every table related to collections

-- Main collection table: Stores STAC collection metadata with spatial and temporal extents
-- Collections group related STAC items and define their common properties
-- full_json: Complete JSONB representation the whole collection
CREATE TABLE collection (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    stac_version TEXT,
    stac_id TEXT,
    type TEXT,
    title TEXT,
    description TEXT,
    license TEXT,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),

    spatial_extent GEOMETRY(POLYGON, 4326),
    temporal_extent_start TIMESTAMP,
    temporal_extent_end TIMESTAMP,

    is_api BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,

    full_json JSONB,
    search_vector tsvector
);

-- Collection summaries: Stores summaries for collection properties
-- represent ranges (min/max), sets of values, or JSON schemas
-- Used to describe the range of values found in collection items
CREATE TABLE collection_summaries (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    collection_id INTEGER REFERENCES collection(id) ON DELETE CASCADE,
    name TEXT,
    kind TEXT,
    source_url TEXT,
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

-- ========================================
-- FULL-TEXT SEARCH TRIGGERS
-- ========================================

-- Trigger function to auto-update search_vector when collection is inserted or updated
-- Includes title, description, and all associated keywords for comprehensive search
CREATE OR REPLACE FUNCTION update_collection_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('simple', 
    coalesce(NEW.title, '') || ' ' ||
    coalesce(NEW.description, '') || ' ' ||
    coalesce(
      (
        SELECT string_agg(k.keyword, ' ')
        FROM collection_keywords ck
        JOIN keywords k ON k.id = ck.keyword_id
        WHERE ck.collection_id = NEW.id
      ),
      ''
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER collection_search_vector_update
BEFORE INSERT OR UPDATE ON collection
FOR EACH ROW
EXECUTE FUNCTION update_collection_search_vector();

-- Trigger function to update search_vector when keywords are added/removed
-- Ensures search index stays in sync with keyword changes
CREATE OR REPLACE FUNCTION update_collection_search_vector_on_keyword_change()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE collection
  SET search_vector = to_tsvector('simple', 
    coalesce(title, '') || ' ' ||
    coalesce(description, '') || ' ' ||
    coalesce(
      (
        SELECT string_agg(k.keyword, ' ')
        FROM collection_keywords ck
        JOIN keywords k ON k.id = ck.keyword_id
        WHERE ck.collection_id = collection.id
      ),
      ''
    )
  )
  WHERE id = COALESCE(NEW.collection_id, OLD.collection_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- NOTE: The trigger for collection_keywords is defined in 06_triggers.sql
-- because it depends on the catalog_keywords table which is created there