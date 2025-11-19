
-- catalogs

CREATE INDEX idx_catalog_title ON catalog (title);
CREATE INDEX idx_catalog_updated_at ON catalog (updated_at);

CREATE INDEX idx_catalog_fulltext ON catalog
USING GIN (to_tsvector('simple', coalesce(title,'') || ' ' || coalesce(description,'')));

CREATE INDEX idx_catalog_links_catalog_id ON catalog_links (catalog_id);
CREATE INDEX idx_catalog_keywords_catalog ON catalog_keywords (catalog_id);
CREATE INDEX idx_catalog_stac_ext_catalog ON catalog_stac_extension (catalog_id);

CREATE INDEX idx_crawllog_catalog_last ON crawllog_catalog (last_crawled);


-- collections

CREATE INDEX idx_collection_title ON collection (title);

CREATE INDEX idx_collection_temp ON collection (temporal_extend_start, temporal_extend_end);
CREATE INDEX idx_collection_active ON collection (is_active);

CREATE INDEX idx_collection_spatial ON collection USING GIST (spatial_extend);

CREATE INDEX idx_collection_fulltext ON collection
USING GIN (to_tsvector('simple', coalesce(title,'') || ' ' || coalesce(description,'')));

CREATE INDEX idx_collection_jsonb ON collection USING GIN (full_json);

CREATE INDEX idx_collection_summaries_collection ON collection_summaries (collection_id);
CREATE INDEX idx_collection_keywords_collection ON collection_keywords (collection_id);
CREATE INDEX idx_collection_stac_ext_collection ON collection_stac_extension (collection_id);
CREATE INDEX idx_collection_providers_collection ON collection_providers (collection_id);
CREATE INDEX idx_collection_assets_collection ON collection_assets (collection_id);

CREATE INDEX idx_crawllog_collection_last ON crawllog_collection (last_crawled);


-- providers / assets
CREATE INDEX idx_providers_provider ON providers (provider);

CREATE INDEX idx_assets_name ON assets (name);
CREATE INDEX idx_assets_roles ON assets USING GIN (roles);
CREATE INDEX idx_assets_metadata ON assets USING GIN (metadata);


-- keywords / stac_extensions

CREATE INDEX idx_keywords_keyword ON keywords (keyword);
CREATE INDEX idx_stac_extensions ON stac_extensions (stac_extension);
