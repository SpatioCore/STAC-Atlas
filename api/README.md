# STAC Atlas API

STAC-compliant API for managing and serving STAC Collection metadata.

## 🚀 Quick Start

### Prerequisites

- Node.js >= 22.0.0
- PostgreSQL with PostGIS extension
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env and set DATABASE_URL etc.
```

### Development

```bash
# Start development server with auto-reload
npm run dev

# Or start production server
npm start
```

The API will be available at `http://localhost:3000`.

### Tests

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

# Automatic fixing
npm run lint:fix

# Code formatting
npm run format
```

## CI/CD Pipeline

This project uses GitHub Actions for Continuous Integration:

- **Automated tests** on every push and pull request
- **Branch protection** prevents merges if tests fail
- **Code quality checks** (ESLint, tests, build validation)
- **Test coverage reports** as artifacts

**Status:** ![CI Status](https://github.com/SpatioCore/STAC-Atlas/workflows/API%20CI%2FCD%20Pipeline/badge.svg?branch=dev-api)

## 🚦 Rate Limiting

All API endpoints are protected by rate limiting:

- **Limit:** 1000 requests per 15 minutes per IP address
- If the limit is exceeded, HTTP status **429 Too Many Requests** is returned
- The headers `RateLimit-Limit`, `RateLimit-Remaining`, and `RateLimit-Reset` are set

**Example response when limit is exceeded:**

```json
{
  "status": 429,
  "error": "Too many requests, please try again later."
}
```

## 📋 API Endpoints

### Core Endpoints

| Method | Endpoint | Description |
|---------|----------|--------------|
| GET | `/` | Landing page (STAC catalog root) |
| GET | `/conformance` | Conformance classes |
| GET | `/collections` | List all collections (with filtering) |
| POST | `/collections` | Collection search with CQL2 |
| GET | `/collections/:id` | Retrieve a single collection |
| GET | `/collections-queryables` | Queryable properties schema |

### Query Parameters (GET /collections)

The collection search API supports the following query parameters:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `q` | String | No | Free-text search (max 500 chars) |
| `bbox` | String | No | Bounding box: `minX,minY,maxX,maxY` |
| `datetime` | String | No | ISO8601 datetime or interval |
| `limit` | Integer | No | Result limit (default: 10, max: 10000) |
| `sortby` | String | No | Sort by field: `+/-field` (title, id, license, created, updated) |
| `token` | Integer | No | Pagination token (offset, default: 0) |

**Examples:**
```bash
# Free-text search
GET /collections?q=sentinel

# Spatial + temporal filter
GET /collections?bbox=-10,40,10,50&datetime=2020-01-01/2021-12-31

# Pagination with sorting
GET /collections?limit=20&sortby=-created&token=2
```

📖 **Detailed documentation:** See [docs/collection-search-parameters.md](docs/collection-search-parameters.md)

### CQL2 Filtering (GET /collections)

The API supports advanced filtering using the Common Query Language 2 (CQL2) standard. Both CQL2-Text and CQL2-JSON encodings are supported.

| Parameter | Type | Description |
|-----------|------|-------------|
| `filter` | String | CQL2 filter expression |
| `filter-lang` | String | Filter language: `cql2-text` (default) or `cql2-json` |

**Supported Operators:**
- **Comparison:** `=`, `<`, `>`, `<=`, `>=`, `<>`, `BETWEEN`, `IN`, `IS NULL`
- **Logical:** `AND`, `OR`, `NOT`
- **Spatial:** `S_INTERSECTS`, `S_WITHIN`, `S_CONTAINS`
- **Temporal:** `T_INTERSECTS`, `T_BEFORE`, `T_AFTER`

**Examples:**
```bash
# Filter by license (note: string literals require single quotes)
GET /collections?filter=license = 'MIT'

# Combined filters
GET /collections?filter=license = 'CC-BY-4.0' AND title LIKE '%Sentinel%'

# Spatial filter with GeoJSON
GET /collections?filter-lang=cql2-json&filter={"op":"s_intersects","args":[{"property":"spatial_extend"},{"type":"Polygon","coordinates":[[[7,51],[8,51],[8,52],[7,52],[7,51]]]}]}

# Temporal filter
GET /collections?filter-lang=cql2-json&filter={"op":"t_intersects","args":[{"property":"datetime"},{"interval":["2020-01-01","2025-12-31"]}]}
```

⚠️ **Important:** In CQL2-Text, string literals must be enclosed in single quotes (`'MIT'`), not bare words (`MIT`) as they will be interpreted as propertys.

📖 **Detailed documentation:** See [docs/cql2-filtering.md](docs/cql2-filtering.md)

### API Documentation

- **Swagger UI**: `http://localhost:3000/api-docs` (if `docs/openapi.yaml` exists)
- **OpenAPI Spec**: `docs/openapi.yaml`

## 🏗️ Project Structure

```
api/
├── bin/
│   └── www                 # Server start script
├── config/
│   └── conformanceURIS.js  # STAC conformance URIs
├── data/
│   └── collections.js      # Test collections
├── docs/
│   └── collection-search-parameters.md  # Query parameter documentation
├── middleware/
│   └── validateCollectionSearch.js  # Query parameter validation
├── routes/
│   ├── index.js            # Landing page (/)
│   ├── conformance.js      # Conformance classes
│   ├── collections.js      # Collections endpoints
│   └── queryables.js       # Queryables schema
├── validators/
│   └── collectionSearchParams.js  # Parameter validators
├── __tests__/
│   └── api.test.js         # API tests
├── app.js                  # Express App Setup
├── package.json
├── .env.example            # Example environment variables
└── README.md
```

## 🔧 Configuration

All configuration is managed via environment variables (`.env`):

```env
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://user:password@localhost:5432/stac_atlas
CORS_ORIGIN=*
```

## 🧪 STAC Conformance

This API implements:

- ✅ STAC API Core (v1.1.0)
- ✅ OGC API Features Core
- ✅ STAC Collections
- ✅ Collection Search Extension
- ✅ CQL2 Basic Filtering (comparison, logical operators)
- ✅ CQL2 Advanced Comparison Operators (between, in, isNull)
- ✅ CQL2 Spatial Functions (s_intersects, s_within, s_contains)
- ✅ CQL2 Temporal Functions (t_intersects, t_before, t_after)
- ✅ CQL2-Text and CQL2-JSON encodings

### STAC API Validator

The API can be tested using the official [STAC API Validator](https://github.com/stac-utils/stac-api-validator):

#### Installation

```bash
# Python 3.11 required
pip install stac-api-validator
```

#### Usage

```bash
# Validate Core Conformance Class
python -m stac_api_validator --root-url http://localhost:3000 --conformance core

# Validate Collections Extension (requires collection ID)
python -m stac_api_validator \
  --root-url http://localhost:3000 \
  --conformance core \
  --conformance collections \
  --collection <collection-id>

# With spatial filtering (requires geometry in dataset)
python -m stac_api_validator \
  --root-url http://localhost:3000 \
  --conformance core \
  --conformance collections \
  --collection <collection-id> \
  --geometry '{"type": "Polygon", "coordinates": [[[7.0, 51.0], [8.0, 51.0], [8.0, 52.0], [7.0, 52.0], [7.0, 51.0]]]}'
```

#### Validation Status

| Conformance Class | Status | Date | Errors | Warnings |
|-------------------|--------|------|--------|----------|
| **STAC API - Core** | ✅ Passed | 2025-12-10 | 0 | 0 |
| STAC API - Collections | ⏳ Pending | - | - | - |
| STAC API - Features | ⏳ Pending | - | - | - |
| STAC API - Item Search | ⏳ Pending | - | - | - |
| CQL2 - Basic | ⏳ Pending | - | - | - |
| CQL2 - Advanced | ⏳ Pending | - | - | - |

**Note:** The Collection Search Extension is not currently validated automatically by the validator and is instead validated through custom Jest integration tests (see `__tests__/`).

## 📦 Next Steps

### TODO

- [x] Database integration (PostgreSQL + PostGIS)
  - [x] Implement q (full-text search with TSVector)
  - [x] Implement bbox (PostGIS spatial queries)
  - [x] Implement datetime (temporal overlap queries)
  - [x] Implement sortby (ORDER BY in SQL)
- [x] CQL2 parser integration (cql2-rs via WASM)
- [ ] Implement controller layer
- [ ] Service layer for business logic
- [ ] Complete OpenAPI documentation
- [x] Advanced tests (integration, E2E)
  - [x] Unit tests for validators
  - [x] Integration tests for filtered queries
- [ ] Docker setup
- [x] CI/CD pipeline

### Implementation Plan (see bid.md)

1. ✅ **AP-01**: Project skeleton & infrastructure
2. ✅ **AP-02**: Query parameter validation (q, bbox, datetime, limit, sortby, token)
3. ✅ **AP-03**: STAC core endpoints (implemented)
4. ✅ **AP-04**: Collection search – filter implementation (DB integration complete)
5. ✅ **AP-05**: CQL2 filtering integration (Basic, Advanced, Spatial, Temporal)

## 📄 License

Apache-2.0

## 👥 Team

STAC Atlas API Team — Robin (Team lead), Jonas, Vincent
