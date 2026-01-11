#!/bin/bash
set -e

# This script creates users for teh api and crawler group with different permissions.

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    
    -- Create read-only user for API access
    CREATE USER stac_api WITH PASSWORD '$STAC_API_PASSWORD';

    -- Create read-write user for crawler
    CREATE USER stac_crawler WITH PASSWORD '$STAC_CRAWLER_PASSWORD';

    GRANT CONNECT ON DATABASE stac_db TO stac_api;
    GRANT CONNECT ON DATABASE stac_db TO stac_crawler;
    GRANT USAGE ON SCHEMA public TO stac_api;
    GRANT USAGE ON SCHEMA public TO stac_crawler;

    -- For stac_api: Grant SELECT (read-only) on all existing tables in public
    GRANT SELECT ON ALL TABLES IN SCHEMA public TO stac_api;

    -- For stac_crawler: Grant all privileges on all existing tables in public
    GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO stac_crawler;

    -- For stac_api: Auto-grant SELECT on future tables
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO stac_api;

    -- For stac_crawler: Auto-grant all privileges on future tables
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO stac_crawler;

    -- For stac_crawler: Grant USAGE on all sequences (needed for SERIAL/IDENTITY columns)
    GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO stac_crawler;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE ON SEQUENCES TO stac_crawler;
EOSQL
