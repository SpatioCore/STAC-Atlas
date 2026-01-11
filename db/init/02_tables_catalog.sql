-- creates every table related to catalogs

-- Main catalog table: Stores STAC catalog metadata including version, type, title, and description
-- Each catalog represents a STAC catalog endpoint that has been discovered and indexed
CREATE TABLE catalog (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    stac_version TEXT,
    type TEXT,
    title TEXT,
    description TEXT,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    search_vector tsvector
);

-- Catalog links table: Stores related links for catalogs (e.g., self, root, child, item links)
-- Links define the navigation structure between STAC resources
CREATE TABLE catalog_links (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    catalog_id INTEGER REFERENCES catalog(id) ON DELETE CASCADE,
    rel TEXT,
    href TEXT,
    type TEXT,
    title TEXT
);

-- Keywords lookup table: Stores unique searchable keywords
-- Used by both catalogs and collections for categorization and search
CREATE TABLE keywords (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    keyword TEXT UNIQUE
);

-- STAC extensions lookup table: Stores unique STAC extension identifiers
-- Extensions provide additional standardized fields beyond core STAC spec
CREATE TABLE stac_extensions (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    stac_extension TEXT UNIQUE
);

-- Crawl log for catalogs: Tracks when each catalog was last crawled for updates
-- Used to schedule re-crawling and maintain freshness of catalog data
CREATE TABLE crawllog_catalog (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    catalog_id INTEGER REFERENCES catalog(id) ON DELETE CASCADE,
    last_crawled TIMESTAMP
);

-- ========================================
-- FULL-TEXT SEARCH TRIGGERS
-- ========================================

-- Trigger function to auto-update search_vector when catalog is inserted or updated
-- Includes title, description, and all associated keywords for comprehensive search
CREATE OR REPLACE FUNCTION update_catalog_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('simple', 
    coalesce(NEW.title, '') || ' ' ||
    coalesce(NEW.description, '') || ' ' ||
    coalesce(
      (
        SELECT string_agg(k.keyword, ' ')
        FROM catalog_keywords ck
        JOIN keywords k ON k.id = ck.keyword_id
        WHERE ck.catalog_id = NEW.id
      ),
      ''
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER catalog_search_vector_update
BEFORE INSERT OR UPDATE ON catalog
FOR EACH ROW
EXECUTE FUNCTION update_catalog_search_vector();

-- Trigger function to update search_vector when keywords are added/removed
-- Ensures search index stays in sync with keyword changes
CREATE OR REPLACE FUNCTION update_catalog_search_vector_on_keyword_change()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE catalog
  SET search_vector = to_tsvector('simple', 
    coalesce(title, '') || ' ' ||
    coalesce(description, '') || ' ' ||
    coalesce(
      (
        SELECT string_agg(k.keyword, ' ')
        FROM catalog_keywords ck
        JOIN keywords k ON k.id = ck.keyword_id
        WHERE ck.catalog_id = catalog.id
      ),
      ''
    )
  )
  WHERE id = COALESCE(NEW.catalog_id, OLD.catalog_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- NOTE: The trigger for catalog_keywords is defined in 06_triggers.sql
-- because it depends on the catalog_keywords table which is created there

