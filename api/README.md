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

- ✅ STAC API Core (v1.0.0)
- ✅ OGC API Features Core
- ✅ STAC Collections
- ✅ Collection Search Extension
- 🚧 CQL2 Basic Filtering (in development)
- 🚧 CQL2 Advanced Operators (in development)

## 📦 Next Steps

### TODO

- [ ] Database integration (PostgreSQL + PostGIS)
  - [ ] Implement q (full-text search with TSVector)
  - [ ] Implement bbox (PostGIS spatial queries)
  - [ ] Implement datetime (temporal overlap queries)
  - [ ] Implement sortby (ORDER BY in SQL)
- [ ] CQL2 parser integration (cql2-rs via WASM)
- [ ] Implement controller layer
- [ ] Service layer for business logic
- [ ] Complete OpenAPI documentation
- [ ] Advanced tests (integration, E2E)
  - [ ] Unit tests for validators
  - [ ] Integration tests for filtered queries
- [ ] Docker setup
- [ ] CI/CD pipeline

### Implementation Plan (see bid.md)

1. ✅ **AP-01**: Project skeleton & infrastructure
2. ✅ **AP-02**: Query parameter validation (q, bbox, datetime, limit, sortby, token)
3. 🚧 **AP-03**: STAC core endpoints (baseline implemented)
4. 🚧 **AP-04**: Collection search – filter implementation (DB integration pending)
5. ⏳ **AP-05**: CQL2 filtering integration

## 📄 License

Apache-2.0

## 👥 Team

STAC Atlas API Team — Robin (Team lead), Jonas, George, Vincent
