
-- The crawllog_catalog is required to save the crawler's current location. 
-- If the crawler crashes, for example because the server goes down, it can 
-- now restart at the correct location and does not have to crawl everything again.

CREATE TABLE crawllog_catalog (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    slug TEXT,
    source_url TEXT UNIQUE NOT NULL,
    is_api BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);