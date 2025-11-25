-- creates every table related to catalogs

-- Main catalog table: Stores STAC catalog metadata including version, type, title, and description
-- Each catalog represents a STAC catalog endpoint that has been discovered and indexed
CREATE TABLE catalog (
    id SERIAL PRIMARY KEY,
    stac_version TEXT,
    type TEXT,
    title TEXT,
    description TEXT,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

-- Catalog links table: Stores related links for catalogs (e.g., self, root, child, item links)
-- Links define the navigation structure between STAC resources
CREATE TABLE catalog_links (
    id SERIAL PRIMARY KEY,
    catalog_id INTEGER REFERENCES catalog(id) ON DELETE CASCADE,
    rel TEXT,
    href TEXT,
    type TEXT,
    title TEXT
);

-- Keywords lookup table: Stores unique searchable keywords
-- Used by both catalogs and collections for categorization and search
CREATE TABLE keywords (
    id SERIAL PRIMARY KEY,
    keyword TEXT UNIQUE
);

-- STAC extensions lookup table: Stores unique STAC extension identifiers
-- Extensions provide additional standardized fields beyond core STAC spec
CREATE TABLE stac_extensions (
    id SERIAL PRIMARY KEY,
    stac_extension TEXT UNIQUE
);

-- Crawl log for catalogs: Tracks when each catalog was last crawled for updates
-- Used to schedule re-crawling and maintain freshness of catalog data
CREATE TABLE crawllog_catalog (
    id SERIAL PRIMARY KEY,
    catalog_id INTEGER REFERENCES catalog(id) ON DELETE CASCADE,
    last_crawled TIMESTAMP
);
