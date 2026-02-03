-- creates every table needed for relations between tables for collections

-- Junction table: Links collections to their associated keywords (many-to-many)
CREATE TABLE collection_keywords (
    collection_id INTEGER REFERENCES collection(id) ON DELETE CASCADE,
    keyword_id INTEGER REFERENCES keywords(id) ON DELETE CASCADE,
    PRIMARY KEY (collection_id, keyword_id)
);

-- Junction table: Links collections to STAC extensions they implement (many-to-many)
CREATE TABLE collection_stac_extension (
    collection_id INTEGER REFERENCES collection(id) ON DELETE CASCADE,
    stac_extension_id INTEGER REFERENCES stac_extensions(id) ON DELETE CASCADE,
    PRIMARY KEY (collection_id, stac_extension_id)
);

-- Junction table: Links collections to their data providers with roles (many-to-many)
CREATE TABLE collection_providers (
    collection_id INTEGER REFERENCES collection(id) ON DELETE CASCADE,
    provider_id INTEGER REFERENCES providers(id) ON DELETE CASCADE,
    collection_provider_roles TEXT,
    PRIMARY KEY (collection_id, provider_id)
);

-- Junction table: Links collections to their assets (many-to-many)
CREATE TABLE collection_assets (
    collection_id INTEGER REFERENCES collection(id) ON DELETE CASCADE,
    asset_id INTEGER REFERENCES assets(id) ON DELETE CASCADE,
    collection_asset_roles TEXT,
    PRIMARY KEY (collection_id, asset_id)
);
