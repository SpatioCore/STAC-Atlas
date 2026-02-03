# STAC Atlas

A centralized platform for managing, indexing, and providing STAC (SpatioTemporal Asset Catalog) Collection metadata from distributed catalogs and APIs.

---

## Table of Contents

1. [Motivation](#motivation)
2. [System Overview](#system-overview)
   - [Architecture](#architecture)
   - [Component Interaction](#component-interaction)
3. [Features](#features)
4. [Quick Start](#quick-start)
   - [Full System Deployment](#full-system-deployment)
   - [Individual Component Deployment](#individual-component-deployment)
5. [System Components](#system-components)
   - [Database](#database)
   - [Crawler](#crawler)
   - [API](#api)
   - [UI](#ui)
6. [Technology Stack](#technology-stack)
7. [Ports and Networking](#ports-and-networking)
8. [Environment Configuration](#environment-configuration)
9. [Testing](#testing)
10. [STAC Conformance](#stac-conformance)
11. [Target Audience](#target-audience)
12. [Scope and Limitations](#scope-and-limitations)
13. [Project Structure](#project-structure)
14. [License](#license)
15. [Team](#team)

---

## Motivation

In the current geodata landscape, numerous decentralized STAC catalogs and APIs from various data providers exist, making it difficult to discover and access relevant geodata collections. Researchers, GIS professionals, and application developers often need to manually search through individual STAC catalogs to find the datasets they need.

STAC Atlas addresses this problem by serving as a centralized access point that aggregates metadata from various sources and makes it searchable. The platform enables users to search, filter, and compare collections across providers without having to manually browse each individual STAC catalog.

By implementing standard-compliant interfaces (STAC API), both programmatic access by developers and interactive use through a web interface are enabled. This significantly increases efficiency when working with geodata and promotes the reusability of data resources.

---

## System Overview

STAC Atlas consists of four main components that work together seamlessly:

| Component | Description |
|-----------|-------------|
| **Database** | PostgreSQL with PostGIS for persistent storage and efficient spatial queries |
| **Crawler** | Automatically discovers and indexes STAC Collections from distributed sources |
| **API** | Provides STAC-compliant programmatic access to indexed collections |
| **UI** | User-friendly web interface for visual search and exploration |

### Architecture

```
                                    ┌─────────────────┐
                                    │   STAC Index    │
                                    │   (External)    │
             Crawls Data            └────────┬────────┘
            ┌────────────────────────────────┘
            │                                
┌───────────│─────────────────────────────────────────────────────────────┐
│           │                STAC Atlas System                            │
│           │                                                             │
│   ┌───────│─────┐         ┌─────────────┐         ┌─────────────┐       │
│   │             │  write  │             │  read   │             │       │
│   │   Crawler   ├────────►│  Database   │◄────────┤    API      │       │
│   │   (Node.js) │         │ (PostgreSQL │         │  (Node.js)  │       │
│   │             │         │  + PostGIS) │         │             │       │
│   └─────────────┘         └─────────────┘         └──────┬──────┘       │
│                                                          │              │
│                                                          │ HTTP/JSON    │
│                                                          │              │
│                                                   ┌──────▼──────┐       │
│                                                   │             │       │
│                                                   │     UI      │       │
│                                                   │   (Vue.js)  │       │
│                                                   │             │       │
│                                                   └─────────────┘       │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Component Interaction

The components interact in a well-defined data flow:

1. **Crawler to Database**: The crawler fetches STAC catalogs and APIs from the STAC Index, validates and normalizes the data, then writes collections to the PostgreSQL database. It tracks crawl progress to enable pause/resume functionality and periodic re-crawling.

2. **API to Database**: The API reads from the database using parameterized SQL queries. It translates CQL2 filter expressions into PostgreSQL WHERE clauses and leverages PostGIS for spatial queries and TSVector for full-text search.

3. **UI to API**: The frontend communicates exclusively with the API via HTTP/JSON. It uses the STAC-compliant endpoints to search, filter, and retrieve collection metadata. The UI never accesses the database directly.

4. **Crawler Independence**: The crawler operates independently from the API and UI. It can run as a one-time job or as a scheduled service, updating the database without affecting API availability.

---

## Features

### Core Capabilities

- **Automated Indexing**: Crawls and indexes STAC Collections from static catalogs and STAC APIs listed in the STAC Index
- **Recursive Navigation**: Traverses nested catalog structures with configurable depth limits
- **Incremental Updates**: Supports pause/resume and periodic re-crawling without full re-indexing
- **STAC Validation**: Validates collections against official STAC schemas before storage

### Search and Filtering

- **Full-Text Search**: PostgreSQL TSVector-based search across titles, descriptions, and keywords
- **Spatial Filtering**: PostGIS-powered bounding box and geometry intersection queries
- **Temporal Filtering**: Date range queries supporting open-ended intervals
- **CQL2 Support**: Advanced filtering using Common Query Language 2 (both text and JSON encodings)
- **Multi-Criteria Queries**: Combine provider, license, keywords, and custom filters

### API Features

- **STAC Compliant**: Implements STAC API Core, Collections, and Collection Search Extension
- **Queryables Endpoint**: Dynamic JSON Schema describing available filter properties with live enumeration values
- **Pagination**: Efficient navigation through large result sets
- **Sorting**: Configurable sort order by various fields
- **Health Monitoring**: Kubernetes-ready health check endpoint

### User Interface

- **Interactive Map**: MapLibre GL-based visualization of collection spatial extents
- **Advanced Filters**: UI controls for all search parameters including bounding box drawing
- **Internationalization**: Support for English and German languages
- **Responsive Design**: Works across desktop and mobile devices
- **Collection Details**: Detailed view of collection metadata with links to original sources

---

## Quick Start

### Prerequisites

- Docker and Docker Compose installed
- At least 4 GB RAM recommended
- Ports 3000, 5432, and 8080 available

### Full System Deployment

The entire STAC Atlas system can be started with a single command:

```bash
# Clone the repository
git clone https://github.com/your-org/stac-atlas.git
cd stac-atlas

# Create environment files (see Environment Configuration section)
cp db/example.env db/.env
cp api/.env.example api/.env
cp crawler/.env.example crawler/.env

# Start all services
docker-compose up --build
```

This starts:
- **Database** on port 5432
- **API** on port 3000
- **UI** on port 8080

**Note** that if the URI of the API changes, you need to address this in `./ui/.env`. 

This process will create first of all a new Database under your given Port. If this step is done, the Crawler will be started and will automatically beginn to fill you new Database with crawled Collections. The API and the UI will also be started in this step. Be aware that it can take multiple minutes until the crawler inserts the first Collections into the Databse.

### Individual Component Deployment

Each component can also be deployed independently. This is useful for development, scaling, or integrating with existing infrastructure.

#### Database Only

```bash
cd db
cp example.env .env
# Edit .env with your passwords
docker-compose up -d
```

#### Crawler Only

After the database and API are running, populate the database with STAC collections:

```bash
cd crawler
npm install

# Configure environment
cp .env.example .env
# Edit .env with database credentials

# Run a single crawl
npm start

# Or run the scheduler for periodic crawling
node scheduler.js
```

#### API Only

```bash
cd api
cp .env.example .env
# Edit .env with database connection details
docker compose up --build

# Or use npm
npm install
npm start
```

#### UI Only

```bash
cd ui
cp .env.example .env
# Edit .env with API URL
docker compose up --build
```

For a more detailed component-specific instructions, see the README files in each component directory. [db/README.md](./db/README.md), [crawler/README.md](./crawler/README.md), [api/README.md](./api/README.md), [ui/README.md](./ui/README.md)

---

## System Components

### Database

The database layer uses PostgreSQL 16 with PostGIS 3.4 for spatial data support. It implements a normalized schema designed for efficient querying of STAC collection metadata.

**Key Features:**
- Spatial indexing with GiST for bounding box queries
- Full-text search with GIN indexes and TSVector
- Normalized tables with referential integrity
- Role-based access control (read-only API user, read-write crawler user)
- Automatic search vector updates via triggers

**Schema Highlights:**
- `collection` - Main metadata table with spatial/temporal extents
- `keywords`, `providers`, `stac_extensions` - Lookup tables for many-to-many relationships
- `collection_summaries` - Statistical summaries of collection properties
- `crawllog_catalog`, `crawllog_collection` - Crawler progress tracking

For complete database documentation including ER diagrams and initialization scripts, see [db/README.md](db/README.md).

### Crawler

The crawler is a Node.js application that discovers and indexes STAC Collections from the STAC Index. It supports both static catalogs and STAC APIs, with intelligent rate limiting and domain-based parallel processing.

**Key Features:**
- Single-run and scheduled modes
- Configurable depth limits and timeouts
- Domain-based parallel processing with per-domain rate limiting
- Graceful shutdown with pause/resume support
- STAC validation using stac-node-validator
- Automatic cleanup of stale collections

**Crawling Modes:**
- `catalogs` - Crawl only static STAC catalogs
- `apis` - Crawl only STAC APIs
- `both` - Crawl both (default)

**Example Usage:**
```bash
# Quick test crawl
node index.js --mode apis --max-apis 3

# Full production crawl
node index.js --mode both --max-catalogs 0 --max-apis 0

# Start scheduler for weekly re-crawling
node scheduler.js
```

For complete crawler documentation including configuration options and examples, see [crawler/README.md](crawler/README.md).

### API

The API provides STAC-compliant access to indexed collections. Built with Express.js, it implements the STAC API specification with Collection Search Extension and CQL2 filtering.

**Endpoints:**

| Endpoint | Description |
|----------|-------------|
| `GET /` | Landing page with links to all resources |
| `GET /conformance` | List of implemented conformance classes |
| `GET /collections` | Paginated list of collections with filtering |
| `GET /collections/{id}` | Single collection by identifier |
| `GET /collection-queryables` | JSON Schema of queryable properties |
| `GET /health` | Health check for monitoring |
| `GET /api-docs` | Swagger UI documentation |

**Query Parameters:**
- `q` - Full-text search
- `bbox` - Spatial filter (minLon,minLat,maxLon,maxLat)
- `datetime` - Temporal filter (ISO8601 interval)
- `provider` - Filter by provider name
- `license` - Filter by license identifier
- `api`- Boolean, whether a Collection is provided by an STAC API
- `active` - Boolean, whether a collection is still available
- `filter` - CQL2 filter expression
- `filter-lang` - CQL2 encoding (cql2-text or cql2-json)
- `sortby` - Sort field and direction
- `limit` - Results per page (1-10000)
- `token` - Pagination offset

For complete API documentation including CQL2 examples, see [api/README.md](api/README.md).

### UI

The frontend is a Vue 3 application with TypeScript that provides a user-friendly interface for searching and exploring STAC collections.

**Key Features:**
- Interactive map with MapLibre GL for spatial visualization
- Bounding box drawing for spatial filters
- Date range pickers for temporal filters
- Dropdown selectors for providers and licenses (populated from API)
- Full-text search with debounced queries
- Pagination with configurable page sizes
- Collection detail view with complete metadata
- Language switching (English/German)

**Technology Choices:**
- Vue 3 Composition API for better TypeScript integration
- Pinia for state management
- Vite for fast development builds
- Custom i18n implementation for minimal bundle size

For complete UI documentation including component architecture, see [ui/README.md](ui/README.md).

---

## Technology Stack

### Core Technologies

| Component | Technology | Version |
|-----------|------------|---------|
| Database | PostgreSQL | 16 |
| Spatial Extension | PostGIS | 3.4 |
| API Runtime | Node.js | 22+ |
| API Framework | Express.js | 4.x |
| CQL2 Parser | cql2-wasm | - |
| Crawler Runtime | Node.js | 22+ |
| Crawler Framework | Crawlee | 3.x |
| Frontend Framework | Vue.js | 3.5 |
| Frontend Build | Vite | 7.x |
| Map Library | MapLibre GL | 5.x |
| State Management | Pinia | 3.x |

### Development Tools

| Purpose | Technology |
|---------|------------|
| Testing | Jest, Supertest |
| Linting | ESLint |
| Type Checking | TypeScript |
| API Documentation | Swagger UI, OpenAPI 3.0 |
| Containerization | Docker, Docker Compose |

---

## Ports and Networking

| Service | Port | Description |
|---------|------|-------------|
| UI | 8080 | Web interface (Nginx serving static files) |
| API | 3000 | STAC API endpoints |
| Database | 5432 | PostgreSQL connection |

When running with Docker Compose, all services communicate over the `stac_net` internal network. External access is provided through the mapped ports.

---

## Environment Configuration

Each component requires its own environment configuration. Template files are provided:

### Database (.env)

```env
POSTGRES_DB=stac_db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_password
DB_PORT=5432
STAC_API_PASSWORD=api_password
STAC_CRAWLER_PASSWORD=crawler_password
```

### API (.env)

```env
PORT=3000
NODE_ENV=production
DATABASE_URL=postgresql://stac_api:api_password@db:5432/stac_db
# Or individual variables:
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=stac_db
# DB_USER=stac_api
# DB_PASSWORD=api_password
```

### Crawler (.env)

```env
PGHOST=localhost
PGPORT=5432
PGUSER=stac_crawler
PGPASSWORD=crawler_password
PGDATABASE=stac_db

CRAWL_MODE=both
MAX_CATALOGS=0
MAX_APIS=0
CRAWL_DAYS_INTERVAL=7
```

### UI (.env)

```env
VITE_API_BASE_URL=http://localhost:3000
```

For in depth configuration options, have a look into the README files in each component directory. [db/README.md](./db/README.md), [crawler/README.md](./crawler/README.md), [api/README.md](./api/README.md), [ui/README.md](./ui/README.md)

---

## Testing

### API Tests

```bash
cd api
npm test                    # Run all tests
npm run test:watch          # Watch mode
npm run lint                # Code linting
```

### Crawler Tests

```bash
cd crawler
npm test                    # Run all tests
npm run test:watch          # Watch mode
```

### UI Tests

```bash
cd ui
npm run build               # Type checking with vue-tsc
```

### STAC API Validation

The API can be validated using the official STAC API Validator:

```bash
pip install stac-api-validator
python -m stac_api_validator --root-url http://localhost:3000 --conformance core --collections --collection {collectionID}
```

---

## STAC Conformance

STAC Atlas implements the following conformance classes:

- "https://api.stacspec.org/v1.0.0/core"
- "https://api.stacspec.org/v1.0.0/collections"
- "https://api.stacspec.org/v1.0.0/collection-search"
- "http://www.opengis.net/spec/ogcapi-common-2/1.0/conf/simple-query"
- "https://api.stacspec.org/v1.0.0-rc.1/collection-search#free-text"
- "https://api.stacspec.org/v1.0.0-rc.1/collection-search#filter"
- "https://api.stacspec.org/v1.1.0/collection-search#sort"
- "http://www.opengis.net/spec/cql2/1.0/conf/basic-cql2"
- "http://www.opengis.net/spec/cql2/1.0/conf/advanced-comparison-operators"
- "http://www.opengis.net/spec/cql2/1.0/conf/cql2-json"
- "http://www.opengis.net/spec/cql2/1.0/conf/cql2-text"
- "http://www.opengis.net/spec/cql2/1.0/conf/basic-spatial-functions"
- "http://www.opengis.net/spec/cql2/1.0/conf/spatial-functions"
- "http://www.opengis.net/spec/cql2/1.0/conf/temporal-functions"
- "http://www.opengis.net/spec/ogcapi-features-1/1.0/conf/collections"
- "http://www.opengis.net/spec/ogcapi-features-1/1.0/conf/core"
- "https://api.stacspec.org/v1.1.0/collection-search#sortables"

The full list of conformance URIs is also available at `GET /conformance`.

---

## Target Audience

STAC Atlas is designed for several user groups:

### Data Scientists and Researchers
- Search for satellite imagery by region and time period
- Compare collections from different providers
- Filter by specific attributes (resolution, sensor type, etc.)
- Integrate searches into analysis pipelines via API

### GIS Professionals
- Visual map-based search for collections in project areas
- Filter by license for commercial use cases
- Evaluate temporal availability across providers
- Quick identification of relevant data sources

### Application Developers
- Programmatic access via STAC-compliant API
- CQL2 filtering for complex queries
- Integration with existing geodata infrastructure
- Standardized response formats

### Data Providers
- Increased visibility for STAC catalogs
- Automatic indexing through crawler
- No additional integration effort required

---

## Scope and Limitations

### What STAC Atlas Does

- Indexes and searches STAC Collections from distributed sources
- Provides STAC-compliant API access to aggregated metadata
- Offers interactive web interface for exploration
- Maintains periodic updates through scheduled crawling

### What STAC Atlas Does NOT Do

- Store individual STAC Items (only Collections)
- Replace original STAC Catalogs (serves as aggregation layer)
- Store or process original geodata (raster/vector data)
- Implement authentication or user management
- Provide write access to external STAC catalogs
- Perform data analysis or processing
- Serve as a download portal for geodata
- Guarantee real-time synchronization with source catalogs

---

## Project Structure

```
stac-atlas/
├── api/                    # STAC API server
│   ├── bin/                # Server entry point
│   ├── config/             # Configuration files
│   ├── db/                 # Database connection and queries
│   ├── middleware/         # Express middleware
│   ├── routes/             # API route handlers
│   ├── utils/              # Utility functions
│   ├── __tests__/          # Test files
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── README.md
├── crawler/                # STAC Crawler
│   ├── catalogs/           # Static catalog crawling
│   ├── apis/               # STAC API crawling
│   ├── utils/              # Crawler utilities
│   ├── __tests__/          # Test files
│   ├── index.js            # Single-run entry point
│   ├── scheduler.js        # Scheduled crawling
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── README.md
├── db/                     # Database setup
│   ├── init/               # Initialization scripts
│   ├── migrations/         # Schema migrations
│   ├── docker-compose.yml
│   └── README.md
├── ui/                     # Vue.js frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── views/          # Page components
│   │   ├── stores/         # Pinia state stores
│   │   ├── composables/    # Composition functions
│   │   ├── services/       # API client
│   │   └── i18n/           # Translations
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── README.md
├── docs/                   # Additional documentation
├── docker-compose.yml      # Full system orchestration
├── bid.md                  # Project requirements (German)
├── LICENSE
└── README.md               # This file
```

---

## License

This project is licensed under the Apache License 2.0. See the [LICENSE](LICENSE) file for details.

---

## Team

STAC Atlas was developed as part of the Geosoftware II course at the University of Muenster (Winter Semester 2025/2026).

**Team Members:**
- Database: Sönke Hoffmann
- Crawler: Humam Hikmat (Team-Lead), Lenn Kruck, Jakob Wotka 
- API: Robin Gummels (Team- & Project-Lead), Vincent Kuehn, Jonas Klaer
- UI: Justin Krumböhmer (Team-Lead), Simon Imfeld

**Supervisors:**
- Dr. Christian Knoth
- Matthias Mohr

---

## Further Reading

- [STAC Specification](https://stacspec.org/)
- [STAC API Specification](https://api.stacspec.org/)
- [OGC CQL2 Standard](https://docs.ogc.org/is/21-065r2/21-065r2.html)
- [STAC Index](https://stacindex.org/)