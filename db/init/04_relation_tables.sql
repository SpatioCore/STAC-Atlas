-- creates every table needed for relations between tables for catalogs and collections

CREATE TABLE catalog_keywords (
    catalog_id INTEGER REFERENCES catalog(id) ON DELETE CASCADE,
    keyword_id INTEGER REFERENCES keywords(id) ON DELETE CASCADE,
    PRIMARY KEY (catalog_id, keyword_id)
);

CREATE TABLE catalog_stac_extension (
    catalog_id INTEGER REFERENCES catalog(id) ON DELETE CASCADE,
    stac_extension_id INTEGER REFERENCES stac_extensions(id) ON DELETE CASCADE,
    PRIMARY KEY (catalog_id, stac_extension_id)
);

CREATE TABLE collection_keywords (
    collection_id INTEGER REFERENCES collection(id) ON DELETE CASCADE,
    keyword_id INTEGER REFERENCES keywords(id) ON DELETE CASCADE,
    PRIMARY KEY (collection_id, keyword_id)
);

CREATE TABLE collection_stac_extension (
    collection_id INTEGER REFERENCES collection(id) ON DELETE CASCADE,
    stac_extension_id INTEGER REFERENCES stac_extensions(id) ON DELETE CASCADE,
    PRIMARY KEY (collection_id, stac_extension_id)
);

CREATE TABLE collection_providers (
    collection_id INTEGER REFERENCES collection(id) ON DELETE CASCADE,
    provider_id INTEGER REFERENCES providers(id) ON DELETE CASCADE,
    collection_provider_roles TEXT,
    PRIMARY KEY (collection_id, provider_id)
);

CREATE TABLE collection_assets (
    collection_id INTEGER REFERENCES collection(id) ON DELETE CASCADE,
    asset_id INTEGER REFERENCES assets(id) ON DELETE CASCADE,
    collection_asset_roles TEXT,
    PRIMARY KEY (collection_id, asset_id)
);
