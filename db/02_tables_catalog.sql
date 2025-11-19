-- creates every table related to catalogs

CREATE TABLE catalog (
    id SERIAL PRIMARY KEY,
    stac_version TEXT,
    type TEXT,
    title TEXT,
    description TEXT,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE catalog_links (
    id SERIAL PRIMARY KEY,
    catalog_id INTEGER REFERENCES catalog(id) ON DELETE CASCADE,
    rel TEXT,
    href TEXT,
    type TEXT,
    title TEXT
);

CREATE TABLE keywords (
    id SERIAL PRIMARY KEY,
    keyword TEXT UNIQUE
);

CREATE TABLE stac_extensions (
    id SERIAL PRIMARY KEY,
    stac_extension TEXT UNIQUE
);

CREATE TABLE crawllog_catalog (
    id SERIAL PRIMARY KEY,
    catalog_id INTEGER REFERENCES catalog(id) ON DELETE CASCADE,
    last_crawled TIMESTAMP
);
