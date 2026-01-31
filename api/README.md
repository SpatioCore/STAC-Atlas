# STAC Atlas API

A centralized platform for managing, indexing, and providing STAC (SpatioTemporal Asset Catalog) Collection metadata from distributed catalogs and APIs.

---

## Table of Contents

1. [Getting Started](#getting-started)
   - [Prerequisites](#prerequisites)
   - [Installation](#installation)
   - [Configuration](#configuration)
   - [Running the Server](#running-the-server)
   - [Docker Deployment](#docker-deployment)
2. [API Endpoints](#api-endpoints)
   - [Landing Page](#landing-page)
   - [Conformance](#conformance)
   - [Collections](#collections)
   - [Single Collection](#single-collection)
   - [Queryables](#queryables)
   - [Health Check](#health-check)
3. [Query Parameters](#query-parameters)
   - [Free-Text Search](#free-text-search-q)
   - [Bounding Box](#bounding-box-bbox)
   - [Datetime](#datetime-datetime)
   - [Pagination](#pagination-limit-and-token)
   - [Sorting](#sorting-sortby)
   - [Provider and License](#provider-and-license)
4. [CQL2 Filtering](#cql2-filtering)
   - [Basic Syntax](#basic-syntax)
   - [Comparison Operators](#comparison-operators)
   - [Logical Operators](#logical-operators)
   - [Advanced Operators](#advanced-operators)
   - [Pattern Matching with LIKE](#pattern-matching-with-like)
   - [Spatial Operators](#spatial-operators)
   - [Temporal Operators](#temporal-operators)
5. [Response Format](#response-format)
6. [Error Handling](#error-handling)
7. [Rate Limiting and Request Size Limits](#rate-limiting-and-request-size-limits)
8. [API Documentation](#api-documentation)
9. [Technical Architecture](#technical-architecture)
10. [Testing](#testing)
11. [STAC Conformance](#stac-conformance)
12. [Project Structure](#project-structure)
13. [License](#license)

---

## Getting Started

### Prerequisites

- **Node.js** version 22.0.0 or higher
- **PostgreSQL** with PostGIS extension (for spatial queries)
- **npm** or **yarn** package manager

### Installation

1. Clone the repository and navigate to the API directory:

```bash
cd api
```

2. Install dependencies:

```bash
npm install
```

3. Create a local environment file from the example:

```bash
cp .env.example .env
```

4. Edit `.env` and configure your database connection (see [Configuration](#configuration)).

### Configuration

The API is configured using environment variables. Copy `.env.example` to `.env` and adjust the following settings:

#### Server Settings

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Port the API server listens on |
| `NODE_ENV` | `development` | Environment mode (`development`, `production`, `test`) |

#### Database Connection

You can configure the database using either a connection string or individual variables:

**Option 1: Connection String**
```env
DATABASE_URL=postgresql://stac_api:password@localhost:5432/stac_db
```

**Option 2: Individual Variables**
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=stac_db
DB_USER=stac_api
DB_PASSWORD=your_password
DB_SSL=false
```

#### Connection Pool Settings

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_POOL_MAX` | `20` | Maximum connections in pool |
| `DB_POOL_MIN` | `2` | Minimum connections in pool |
| `DB_IDLE_TIMEOUT` | `30000` | Idle connection timeout (ms) |
| `DB_CONNECTION_TIMEOUT` | `10000` | Connection timeout (ms) |

#### Other Settings

| Variable | Default | Description |
|----------|---------|-------------|
| `CORS_ORIGIN` | `*` | Allowed CORS origins |
| `LOG_LEVEL` | `debug` | Logging verbosity |

### Running the Server

**Development mode** (with auto-reload on change):
```bash
npm run dev
```

**Production mode**:
```bash
npm start
```

The API will be available at `http://localhost:3000`.

### Docker Deployment

Build and run the API using Docker:

```bash
# Build the image
docker build -t stac-atlas-api .

# Run with docker-compose
docker-compose up
```

The Dockerfile uses Node.js 22 Alpine and exposes port 3000.

---

## API Endpoints

All endpoints return JSON responses with `Content-Type: application/json`.

### Landing Page

```
GET /
```

Returns the STAC API landing page with links to all available resources.

**Example Request:**
```bash
curl http://localhost:3000/
```

**Example Response:**
```json
{
  "type": "Catalog",
  "id": "stac-atlas",
  "title": "STAC Atlas",
  "description": "A centralized platform for managing, indexing, and providing STAC Collection metadata from distributed catalogs and APIs.",
  "stac_version": "1.0.0",
  "conformsTo": ["https://api.stacspec.org/v1.0.0/core", "..."],
  "links": [
    {"rel": "self", "href": "http://localhost:3000", "type": "application/json"},
    {"rel": "conformance", "href": "http://localhost:3000/conformance", "type": "application/json"},
    {"rel": "data", "href": "http://localhost:3000/collections", "type": "application/json"},
    {"rel": "health", "href": "http://localhost:3000/health", "type": "application/json"},
    {"rel": "queryables", "href": "http://localhost:3000/collections-queryables", "type": "application/schema+json"},
    {"rel": "service-doc", "href": "http://localhost:3000/api-docs", "type": "text/html"},
    {"rel": "service-desc", "href": "http://localhost:3000/openapi.yaml", "type": "application/vnd.oai.openapi+json;version=3.0"}
  ]
}
```

---

### Conformance

```
GET /conformance
```

Returns the list of conformance classes implemented by the API.

**Example Request:**
```bash
curl http://localhost:3000/conformance
```

**Example Response:**
```json
{
  "conformsTo": [
    "https://api.stacspec.org/v1.0.0/core",
    "https://api.stacspec.org/v1.0.0/collections",
    "https://api.stacspec.org/v1.0.0/collection-search",
    "http://www.opengis.net/spec/cql2/1.0/conf/basic-cql2",
    "http://www.opengis.net/spec/cql2/1.0/conf/advanced-comparison-operators",
    "http://www.opengis.net/spec/cql2/1.0/conf/cql2-json",
    "http://www.opengis.net/spec/cql2/1.0/conf/cql2-text",
    "http://www.opengis.net/spec/cql2/1.0/conf/basic-spatial-functions",
    "http://www.opengis.net/spec/cql2/1.0/conf/spatial-functions",
    "http://www.opengis.net/spec/cql2/1.0/conf/temporal-functions"
  ]
}
```

---

### Collections

```
GET /collections
```

Returns a paginated list of STAC Collections with optional filtering.

See [Query Parameters](#query-parameters) and [CQL2 Filtering](#cql2-filtering) for filtering options.

**Example Request:**
```bash
curl "http://localhost:3000/collections?limit=10&q=sentinel"
```

**Example Response:**
```json
{
  "collections": [
    {
      "type": "Collection",
      "stac_version": "1.0.0",
      "id": "sentinel-2-l2a",
      "stac_id": "sentinel-2-l2a",
      "source_id": "sentinel-2-l2a",
      "source_url": "https://example.com/stac/collections/sentinel-2-l2a",
      "title": "Sentinel-2 Level-2A",
      "description": "Sentinel-2 atmospherically corrected surface reflectance",
      "license": "CC-BY-4.0",
      "extent": {
        "spatial": {"bbox": [[-180, -90, 180, 90]]},
        "temporal": {"interval": [["2015-06-27T00:00:00Z", null]]}
      },
      "links": [
        {"rel": "self", "href": "http://localhost:3000/collections/sentinel-2-l2a"},
        {"rel": "root", "href": "http://localhost:3000"},
        {"rel": "parent", "href": "http://localhost:3000"},
        {"rel": "items", "href": "https://example.com/stac/collections/sentinel-2-l2a/items", "title": "Source Item Reference"}
      ]
    }
  ],
  "links": [
    {"rel": "self", "href": "http://localhost:3000/collections?limit=10&q=sentinel"},
    {"rel": "root", "href": "http://localhost:3000"},
    {"rel": "next", "href": "http://localhost:3000/collections?limit=10&token=10&q=sentinel"}
  ],
  "context": {
    "returned": 10,
    "limit": 10,
    "matched": 42
  }
}
```

---

### Single Collection

```
GET /collections/{collectionId}
```

Returns a single STAC Collection by its identifier.

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `collectionId` | string | Collection identifier |

**Example Request:**
```bash
curl http://localhost:3000/collections/sentinel-2-l2a
```

**Response:** A single STAC Collection object (same structure as in the collections list).

**Error Response (404):**
```json
{
  "type": "https://stacspec.org/errors/NotFound",
  "title": "Not Found",
  "status": 404,
  "code": "NotFound",
  "description": "Collection with id 'unknown-collection' not found",
  "instance": "/collections/unknown-collection",
  "requestId": "550e8400-e29b-41d4-a716-446655440000"
}
```

---

### Queryables

```
GET /collections-queryables
```

Returns a JSON Schema describing properties that can be used in CQL2 filter expressions.

**Example Request:**
```bash
curl http://localhost:3000/collections-queryables
```

**Example Response (abbreviated):**
```json
{
  "$schema": "https://json-schema.org/draft/2019-09/schema",
  "$id": "http://localhost:3000/collections-queryables",
  "type": "object",
  "title": "STAC Atlas Collections Queryables",
  "properties": {
    "id": {
      "title": "Collection ID",
      "type": ["string", "integer"],
      "x-ogc-operators": ["=", "<>", "<", "<=", ">", ">=", "between", "in", "isNull", "like"]
    },
    "title": {
      "title": "Title",
      "type": "string",
      "x-ogc-operators": ["=", "<>", "<", "<=", ">", ">=", "between", "in", "isNull", "like"]
    },
    "license": {
      "title": "License",
      "type": "string",
      "x-ogc-operators": ["=", "<>", "<", "<=", ">", ">=", "between", "in", "isNull", "like"]
    },
    "spatial_extent": {
      "title": "Spatial Extent",
      "type": "object",
      "x-ogc-operators": ["s_intersects", "s_within", "s_contains", "isNull"]
    }
  },
  "links": [...]
}
```

---

### Health Check

```
GET /health
```

Returns health status and readiness information for monitoring and Kubernetes probes.

**Example Request:**
```bash
curl http://localhost:3000/health
```

**Example Response (healthy):**
```json
{
  "type": "Health",
  "id": "stac-atlas-health",
  "title": "STAC Atlas API Health Check",
  "description": "Health status and readiness information for the STAC Atlas API",
  "status": "ok",
  "ready": true,
  "uptimeSec": 3600,
  "timestamp": "2026-01-31T12:00:00.000Z",
  "checks": {
    "alive": {"status": "ok"},
    "db": {"status": "ok", "latencyMs": 5}
  },
  "links": [
    {"rel": "self", "href": "http://localhost:3000/health"},
    {"rel": "root", "href": "http://localhost:3000"},
    {"rel": "parent", "href": "http://localhost:3000"}
  ]
}
```

**Response when database is unavailable (503):**
```json
{
  "type": "Health",
  "status": "degraded",
  "ready": false,
  "checks": {
    "alive": {"status": "ok"},
    "db": {"status": "error", "latencyMs": 150, "code": "ECONNREFUSED", "message": "Database connectivity check failed"}
  }
}
```

| Status Code | Meaning |
|-------------|---------|
| 200 | Service is healthy and ready |
| 503 | Service is alive but degraded (database unavailable) |

---

## Query Parameters

All query parameters for `GET /collections` are optional and can be combined.

### Free-Text Search (`q`)

Search across collection `title`, `description`, and `keywords` using PostgreSQL full-text search.

| Constraint | Value |
|------------|-------|
| Maximum length | 500 characters |

**Examples:**
```bash
# Search for "sentinel"
GET /collections?q=sentinel

# Search for multiple terms (AND logic)
GET /collections?q=landsat%20climate
```

---

### Bounding Box (`bbox`)

Filter collections by spatial extent intersection.

**Format:** `minLon,minLat,maxLon,maxLat` (WGS84 coordinates)

| Constraint | Value |
|------------|-------|
| Longitude | -180 to 180 |
| Latitude | -90 to 90 |
| Coordinates | Exactly 4 values |

**Examples:**
```bash
# Collections in Germany
GET /collections?bbox=5.9,47.3,15.0,55.1

# Collections in California
GET /collections?bbox=-124.4,32.5,-114.1,42.0
```

---

### Datetime (`datetime`)

Filter collections by temporal extent overlap.

**Supported formats:**

| Format | Example | Description |
|--------|---------|-------------|
| Single | `2020-01-01T00:00:00Z` | Exact timestamp |
| Interval | `2020-01-01/2025-12-31` | Closed interval |
| Open start | `../2025-12-31` | Everything before date |
| Open end | `2020-01-01/..` | Everything after date |

**Examples:**
```bash
# Collections from 2020
GET /collections?datetime=2020-01-01T00:00:00Z/2020-12-31T23:59:59Z

# Collections before 2020
GET /collections?datetime=../2019-12-31

# Collections after 2023
GET /collections?datetime=2023-01-01/..
```

---

### Pagination (`limit` and `token`)

Control the number of results and navigate through pages.

| Parameter | Type | Default | Range | Description |
|-----------|------|---------|-------|-------------|
| `limit` | integer | 10 | 1-10000 | Maximum results per page |
| `token` | integer | 0 | 0+ | Offset (number of results to skip) |

**Pagination workflow:**

1. Initial request: `GET /collections?limit=20`
2. Check `context.matched` for total results
3. Follow `next` link in response: `GET /collections?limit=20&token=20`
4. Continue until no `next` link is present

**Examples:**
```bash
# First 20 results
GET /collections?limit=20

# Results 21-40
GET /collections?limit=20&token=20

# Results 41-60
GET /collections?limit=20&token=40
```

---

### Sorting (`sortby`)

Sort results by a specific field.

**Format:** `[+|-]fieldname`

| Prefix | Direction |
|--------|-----------|
| `+` or none | Ascending (A-Z, oldest first) |
| `-` | Descending (Z-A, newest first) |

**Available fields:**

| Field | Description |
|-------|-------------|
| `title` | Collection title (alphabetical) |
| `id` | Collection identifier |
| `license` | License identifier |
| `created` | Creation timestamp |
| `updated` | Last update timestamp |

**Examples:**
```bash
# Newest first
GET /collections?sortby=-created

# Alphabetical by title
GET /collections?sortby=+title

# Most recently updated
GET /collections?sortby=-updated
```

---

### Provider and License

Filter by provider name or license identifier.

| Parameter | Type | Max Length | Description |
|-----------|------|------------|-------------|
| `provider` | string | 255 | Filter by provider name (partial match) |
| `license` | string | 255 | Filter by license identifier |

**Examples:**
```bash
# Collections from USGS
GET /collections?provider=USGS

# Open data collections
GET /collections?license=CC-BY-4.0

# Combine with other parameters
GET /collections?provider=ESA&license=CC-BY-4.0&sortby=-created
```

---

## CQL2 Filtering

The API supports the Common Query Language 2 (CQL2) standard for advanced filtering. Both CQL2-Text (human-readable) and CQL2-JSON (machine-readable) encodings are supported.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `filter` | string | - | CQL2 filter expression |
| `filter-lang` | string | `cql2-text` | Language: `cql2-text` or `cql2-json` |

### Basic Syntax

**Important rules for CQL2-Text:**

1. String literals must be enclosed in **single quotes**: `'value'`
2. Property names are written without quotes: `license`, `title`
3. Operators are case-insensitive: `AND`, `and`, `And`

**Common mistake:**
```
Correct:   license = 'CC-BY-4.0'
Wrong:     license = CC-BY-4.0        (CC-BY-4.0 is interpreted as a property)
```

---

### Comparison Operators

| Operator | Description | Example |
|----------|-------------|---------|
| `=` | Equal | `license = 'CC-BY-4.0'` |
| `<>` | Not equal | `license <> 'proprietary'` |
| `<` | Less than | `field < 100` |
| `>` | Greater than | `field > 50` |
| `<=` | Less than or equal | `field <= 100` |
| `>=` | Greater than or equal | `field >= 1` |

**Examples:**
```bash
GET /collections?filter=license = 'CC-BY-4.0'
GET /collections?filter=field >= 10
```

---

### Logical Operators

| Operator | Description |
|----------|-------------|
| `AND` | Both conditions must be true |
| `OR` | At least one condition must be true |
| `NOT` | Negates a condition |

**Examples:**
```bash
# Both conditions
GET /collections?filter=license = 'CC-BY-4.0' AND title LIKE '%Sentinel%'

# Either condition
GET /collections?filter=license = 'MIT' OR license = 'Apache-2.0'

# Negation
GET /collections?filter=NOT license = 'proprietary'
```

---

### Advanced Operators

| Operator | Description | Example |
|----------|-------------|---------|
| `BETWEEN` | Value within range (inclusive) | `id BETWEEN 10 AND 50` |
| `IN` | Value in list | `license IN ('MIT', 'Apache-2.0')` |
| `IS NULL` | Value is null | `description IS NULL` |
| `LIKE` | Pattern matching | `title LIKE '%Sentinel%'` |

**Examples:**
```bash
GET /collections?filter=field BETWEEN 1 AND 100
GET /collections?filter=license IN ('MIT', 'CC0-1.0', 'CC-BY-4.0')
GET /collections?filter=title IS NULL
```

---

### Pattern Matching with LIKE

The `LIKE` operator supports SQL-style wildcard patterns:

| Wildcard | Description | Example Match |
|----------|-------------|---------------|
| `%` | Zero or more characters | `'%Sentinel%'` matches "Sentinel-2", "Copernicus Sentinel" |
| `_` | Exactly one character | `'Sentinel-_'` matches "Sentinel-1", "Sentinel-2" |

**Examples:**
```bash
# Contains "Sentinel"
GET /collections?filter=title LIKE '%Sentinel%'

# Starts with "USGS"
GET /collections?filter=title LIKE 'USGS%'

# Ends with "L2A"
GET /collections?filter=title LIKE '%L2A'

# Sentinel followed by single character
GET /collections?filter=title LIKE 'Sentinel-_'
```

**CQL2-JSON format:**
```json
{
  "op": "like",
  "args": [{"property": "title"}, "%Sentinel%"]
}
```

**Note:** Pattern matching is case-sensitive. Use the `q` parameter for case-insensitive full-text search.

---

### Spatial Operators

Spatial operators filter collections based on geometry relationships using PostGIS.

| Operator | Description |
|----------|-------------|
| `S_INTERSECTS` | Geometries share any space |
| `S_WITHIN` | Collection extent is within geometry |
| `S_CONTAINS` | Collection extent contains geometry |

**CQL2-JSON Example:**
```bash
# Collections intersecting a bounding box around Muenster
GET /collections?filter-lang=cql2-json&filter={"op":"s_intersects","args":[{"property":"spatial_extent"},{"type":"Polygon","coordinates":[[[7,51],[8,51],[8,52],[7,52],[7,51]]]}]}
```

---

### Temporal Operators

Temporal operators filter collections based on time relationships.

| Operator | Description |
|----------|-------------|
| `T_INTERSECTS` | Temporal extents overlap |
| `T_BEFORE` | Collection is before timestamp |
| `T_AFTER` | Collection is after timestamp |

**Interval formats:**
- Closed: `["2020-01-01", "2025-12-31"]`
- Open start: `["..", "2025-12-31"]`
- Open end: `["2020-01-01", ".."]`

**CQL2-JSON Example:**
```bash
# Collections from 2020-2025
GET /collections?filter-lang=cql2-json&filter={"op":"t_intersects","args":[{"property":"datetime"},{"interval":["2020-01-01","2025-12-31"]}]}
```

---

## Response Format

### Collections Response

```json
{
  "collections": [...],
  "links": [
    {"rel": "self", "href": "..."},
    {"rel": "root", "href": "..."},
    {"rel": "next", "href": "..."},
    {"rel": "prev", "href": "..."}
  ],
  "context": {
    "returned": 10,
    "limit": 10,
    "matched": 156
  }
}
```

| Field | Description |
|-------|-------------|
| `collections` | Array of STAC Collection objects |
| `links` | Navigation links including pagination |
| `context.returned` | Number of collections in this response |
| `context.limit` | Maximum results per page |
| `context.matched` | Total collections matching the query |

### Collection Links

Each collection includes links to both STAC Atlas and the original source:

| Rel | Description |
|-----|-------------|
| `self` | This collection in STAC Atlas |
| `root` | STAC Atlas landing page |
| `parent` | STAC Atlas landing page |
| `items` / `item` | Original source item references |
| `source_*` | Other links from original source catalog |

---

## Error Handling

All errors follow the RFC 7807 Problem Details format.

**Example error response:**
```json
{
  "type": "https://stacspec.org/errors/InvalidParameter",
  "title": "Invalid Parameter",
  "status": 400,
  "code": "InvalidParameter",
  "description": "Parameter 'bbox' must contain exactly 4 coordinates",
  "instance": "/collections?bbox=1,2,3",
  "requestId": "550e8400-e29b-41d4-a716-446655440000"
}
```

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Bad Request - Invalid parameters |
| 404 | Not Found - Resource does not exist |
| 413 | Payload Too Large - Request exceeds size limits |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error |
| 503 | Service Unavailable - Database unavailable |

---

## Rate Limiting and Request Size Limits

### Rate Limiting

All endpoints are protected by rate limiting:

| Setting | Value |
|---------|-------|
| Requests per window | 1000 |
| Window duration | 15 minutes |
| Scope | Per IP address |

When exceeded, the API returns HTTP 429 with headers:
- `RateLimit-Limit`: Maximum requests allowed
- `RateLimit-Remaining`: Requests remaining in window
- `RateLimit-Reset`: Time when limit resets

### Request Size Limits

| Limit | Default | Description |
|-------|---------|-------------|
| URL length | 1 MB | Maximum URL including query string |
| Header size | 100 KB | Maximum total header size |
| Body size | 10 MB | Maximum request body (for future POST support) |

These limits can be configured via environment variables:
- `MAX_URL_LENGTH`
- `MAX_HEADER_SIZE`
- `MAX_BODY_SIZE`

---

## API Documentation

### Swagger UI

Interactive API documentation is available at:
```
http://localhost:3000/api-docs
```

### OpenAPI Specification

The raw OpenAPI 3.0 specification is available at:
```
http://localhost:3000/openapi.yaml
```

---

## Technical Architecture

### Technology Stack

| Component | Technology |
|-----------|------------|
| Runtime | Node.js 22+ |
| Framework | Express.js 4.x |
| Database | PostgreSQL with PostGIS |
| CQL2 Parser | cql2-wasm (Rust WASM) |
| Documentation | Swagger UI / OpenAPI 3.0 |
| Logging | Winston |
| Testing | Jest + Supertest |

### Middleware Stack

Requests pass through the following middleware in order:

1. **Request ID** - Assigns unique ID for tracing
2. **HTTP Logger** - Logs request/response details
3. **Rate Limiting** - Prevents abuse
4. **Request Size Limiting** - Protects against oversized requests
5. **Body Parsing** - Parses JSON and URL-encoded bodies
6. **CORS** - Handles cross-origin requests
7. **Route Handlers** - Processes API requests
8. **Error Handler** - Returns standardized error responses

### Database Architecture

The API connects to PostgreSQL with PostGIS for:
- Full-text search using TSVector
- Spatial queries using PostGIS geometry functions
- Temporal range queries
- JSONB storage for complete STAC Collection metadata

Connection pooling is configured for optimal performance with configurable pool sizes and timeouts.

---

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```

### Code Quality

```bash
# Linting
npm run lint

# Auto-fix linting issues
npm run lint:fix

# Format code
npm run format
```

### STAC API Validator

The API can be validated using the official STAC API Validator:

```bash
# Install validator (Python 3.11 required)
pip install stac-api-validator

# Validate core conformance
python -m stac_api_validator --root-url http://localhost:3000 --conformance core
```

---

## STAC Conformance

This API implements the following conformance classes:

| Conformance Class | Status |
|-------------------|--------|
| STAC API Core 1.0.0 | Implemented |
| STAC Collections | Implemented |
| Collection Search | Implemented |
| CQL2 Basic | Implemented |
| CQL2 Advanced Comparison | Implemented |
| CQL2 Spatial Functions | Implemented |
| CQL2 Temporal Functions | Implemented |
| CQL2-Text Encoding | Implemented |
| CQL2-JSON Encoding | Implemented |
| Sorting | Implemented |
| Free-Text Search | Implemented |

---

## Project Structure

```
api/
├── bin/
│   └── www                      # Server entry point
├── config/
│   ├── conformanceURIS.js       # STAC conformance URIs
│   └── queryablesSchema.js      # CQL2 queryables definition
├── db/
│   ├── db_APIconnection.js      # Database connection pool
│   └── buildCollectionSearchQuery.js  # SQL query builder
├── docs/
│   ├── openapi.yaml             # OpenAPI specification
│   ├── collection-search-parameters.md
│   └── cql2-filtering.md
├── middleware/
│   ├── cors.js                  # CORS configuration
│   ├── errorHandler.js          # Global error handler
│   ├── rateLimit.js             # Rate limiting
│   ├── requestId.js             # Request ID generation
│   ├── requestSize.js           # Size limit enforcement
│   ├── validateCollectionId.js  # Collection ID validation
│   └── validateCollectionSearch.js  # Query parameter validation
├── routes/
│   ├── index.js                 # Landing page (/)
│   ├── conformance.js           # Conformance (/conformance)
│   ├── collections.js           # Collections (/collections)
│   ├── queryables.js            # Queryables (/collections-queryables)
│   └── health.js                # Health check (/health)
├── utils/
│   ├── cql2.js                  # CQL2 parser interface
│   ├── cql2ToSql.js             # CQL2 to SQL converter
│   ├── errorResponse.js         # RFC 7807 error formatting
│   └── logger.js                # Winston logger
├── validators/
│   └── collectionSearchParams.js  # Parameter validators
├── __tests__/                   # Test files
├── app.js                       # Express application
├── Dockerfile                   # Docker configuration
├── docker-compose.yml           # Docker Compose configuration
├── package.json
├── .env.example                 # Environment template
└── README.md
```

---

## License

Apache-2.0

---

## Team

STAC Atlas API Team (Robin Gummels, Vincent Kühn, Jonas Klaer) - University of Muenster, Geosoftware II (Winter Semester 2025/2026)
