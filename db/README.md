# STAC-Atlas Database

This directory contains the PostgreSQL database setup for STAC-Atlas, a system for managing and searching STAC (SpatioTemporal Asset Catalog) catalogs and collections.

## Overview

The database is built on **PostgreSQL 16** with **PostGIS 3.4** extensions, providing spatial capabilities for geospatial data management. It stores STAC catalogs, collections, and their associated metadata with full-text search and spatial indexing support.

## Database Structure

### Core Tables

#### Catalogs
- **`catalog`**: Main catalog metadata (title, description, STAC version, type)
- **`catalog_links`**: Related links for each catalog
- **`crawllog_catalog`**: Tracks when catalogs were last crawled

#### Collections
- **`collection`**: Collection metadata with spatial and temporal extents
  - Stores spatial extent as PostGIS geometry (POLYGON, EPSG:4326)
  - Includes temporal extent (start/end timestamps)
  - Full JSON representation of collection stored in `full_json` (JSONB)
- **`collection_summaries`**: Collection summary statistics and ranges
- **`crawllog_collection`**: Tracks when collections were last crawled

#### Supporting Tables
- **`keywords`**: Searchable keywords for catalogs and collections
- **`stac_extensions`**: STAC extensions used by catalogs/collections
- **`providers`**: Data providers
- **`assets`**: Assets associated with collections

#### Relation Tables
- **`catalog_keywords`**: Many-to-many relationship between catalogs and keywords
- **`catalog_stac_extension`**: Links catalogs to STAC extensions
- **`collection_keywords`**: Many-to-many relationship between collections and keywords
- **`collection_stac_extension`**: Links collections to STAC extensions
- **`collection_providers`**: Links collections to providers with roles
- **`collection_assets`**: Links collections to assets with roles

### Extensions

The database uses the following PostgreSQL extensions:
- **PostGIS**: Spatial data types and functions
- **pg_trgm**: Trigram-based text search for fuzzy matching

### Indexes

Comprehensive indexing for optimal query performance:
- **Full-text search** on titles and descriptions
- **Spatial indexes** (GIST) on geographic extents
- **JSONB indexes** (GIN) for flexible JSON queries
- **Temporal indexes** on date ranges
- **Foreign key indexes** for efficient joins

## Getting Started

### Starting the Database

```bash
cd ./db/
docker-compose up
```

### Connection Details

- **Host**: `atlas.stacindex.org`
- **Port**: `5432` and `5433`

## Port Configuration

This project exposes the database service on a port that can be changed.  Update the port in the described place and restart the service.

The database uses port mapping in the format `HOST:CONTAINER`:
- **`5432:5432`** means:
  - Left side (`5432`): Port on your local machine (host) (must be changed in the `.env`)
  - Right side (`5432`): Port inside the Docker container

What to change the environment parameters in the Docker Compose file
- Open the `docker-compose.yml`.
- Locate e.g. `ports:` and change the host side:
- Format: `"<host_port>:<container_port>"`
- Example: change `5432:5432` to `5433:5432` to expose the container's 5432 on host port 5433.
- If the compose file references environment variables (e.g. `${DB_PORT}`), change the value in the corresponding `.env` file.

**Important**: Do not modify the `docker-compose.yml` file directly. Instead, update the port configuration in the `.env` file by changing the `${DB_PORT}`, `${POSTGRES_DB}`, `${POSTGRES_USER}` and `${POSTGRES_PASSWORD}` variable, then restart the service with `docker-compose up`. 
- The change in the `.env` does not count for the `<container-port>`, you can change that directly in the `docker-compose.yml` if needed. 
- There is an `example.env` provided that can be renamed into `.env` and then modified.

## Initialization Scripts

All SQL scripts in the `./db/init/` folder are automatically executed on the start of the database. The numbering ensures guaranteed execution order:

1. **`01_extensions.sql`** - Installs PostGIS and pg_trgm extensions
2. **`02_tables_catalog.sql`** - Creates catalog-related tables
3. **`03_tables_collections.sql`** - Creates collection-related tables
4. **`04_relation_tables.sql`** - Creates relationship n:n tables
5. **`05_indexes.sql`** - Creates the performance indexes
