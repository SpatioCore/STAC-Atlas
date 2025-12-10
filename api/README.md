# STAC Atlas API

STAC-konforme API für die Verwaltung und Bereitstellung von STAC Collection Metadaten.

## 🚀 Schnellstart

### Voraussetzungen

- Node.js >= 22.0.0
- PostgreSQL mit PostGIS Extension
- npm oder yarn

### Installation

```bash
# Dependencies installieren
npm install

# Umgebungsvariablen konfigurieren
cp .env.example .env
# .env bearbeiten und DATABASE_URL etc. anpassen
```

### Entwicklung

```bash
# Development Server mit Auto-Reload starten
npm run dev

# Oder Production Server
npm start
```

Die API läuft dann auf `http://localhost:3000`

### Tests

```bash
# Alle Tests ausführen
npm test

# Tests im Watch-Mode
npm run test:watch
```

### Code-Qualität

```bash
# Linting
npm run lint

# Automatisches Fixing
npm run lint:fix

# Code formatieren
npm run format
```

## CI/CD Pipeline

This Project uses GitHub Actions for Continous Integration:

- **Automatic Tests** at every push and pull request
- **Branch Protection** prevent merges if tests failed
- **Code Quality Checks** (ESLint, Tests, Build-Validation)
- **Test Coverage Reports** as artifacts

**Status:** ![CI Status](https://github.com/SpatioCore/STAC-Atlas/workflows/API%20CI%2FCD%20Pipeline/badge.svg?branch=dev-api)

## 📋 API Endpunkte

### Core Endpoints

| Methode | Endpoint | Beschreibung |
|---------|----------|--------------|
| GET | `/` | Landing Page (STAC Catalog Root) |
| GET | `/conformance` | Conformance Classes |
| GET | `/collections` | Liste aller Collections (mit Filterung) |
| POST | `/collections` | Collection Search mit CQL2 |
| GET | `/collections/:id` | Einzelne Collection abrufen |
| GET | `/collections-queryables` | Queryable Properties Schema |

### Query Parameters (GET /collections)

Die Collection Search API unterstützt folgende Query-Parameter:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `q` | String | No | Free-text search (max 500 chars) |
| `bbox` | String | No | Bounding box: `minX,minY,maxX,maxY` |
| `datetime` | String | No | ISO8601 datetime or interval |
| `limit` | Integer | No | Result limit (default: 10, max: 10000) |
| `sortby` | String | No | Sort by field: `+/-field` (title, id, license, created, updated) |
| `token` | Integer | No | Pagination token (offset, default: 0) |

**Beispiele:**
```bash
# Free-text search
GET /collections?q=sentinel

# Spatial + temporal filter
GET /collections?bbox=-10,40,10,50&datetime=2020-01-01/2021-12-31

# Pagination with sorting
GET /collections?limit=20&sortby=-created&token=2
```

📖 **Detaillierte Dokumentation:** Siehe [docs/collection-search-parameters.md](docs/collection-search-parameters.md)

### API Dokumentation

- **Swagger UI**: `http://localhost:3000/api-docs` (wenn `docs/openapi.yaml` existiert)
- **OpenAPI Spec**: `docs/openapi.yaml`

## 🏗️ Projektstruktur

```
api/
├── bin/
│   └── www                 # Server-Startskript
├── config/
│   └── conformanceURIS.js  # STAC Conformance URIs
├── data/
│   └── collections.js      # Test collections
├── docs/
│   └── collection-search-parameters.md  # Query Parameter Dokumentation
├── middleware/
│   └── validateCollectionSearch.js  # Query Parameter Validation
├── routes/
│   ├── index.js            # Landing Page (/)
│   ├── conformance.js      # Conformance Classes
│   ├── collections.js      # Collections Endpoints
│   └── queryables.js       # Queryables Schema
├── validators/
│   └── collectionSearchParams.js  # Parameter Validators
├── __tests__/
│   └── api.test.js         # API Tests
├── app.js                  # Express App Setup
├── package.json
├── .env.example            # Beispiel-Umgebungsvariablen
└── README.md
```

## 🔧 Konfiguration

Alle Konfigurationen erfolgen über Umgebungsvariablen (`.env`):

```env
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://user:password@localhost:5432/stac_atlas
CORS_ORIGIN=*
```

## 🧪 STAC Conformance

Diese API implementiert:

- ✅ STAC API Core (v1.0.0)
- ✅ OGC API Features Core
- ✅ STAC Collections
- ✅ Collection Search Extension
- 🚧 CQL2 Basic Filtering (in Entwicklung)
- 🚧 CQL2 Advanced Operators (in Entwicklung)

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

## 📦 Nächste Schritte

### TODO

- [ ] Datenbank-Integration (PostgreSQL + PostGIS)
  - [ ] Implement q (full-text search with TSVector)
  - [ ] Implement bbox (PostGIS spatial queries)
  - [ ] Implement datetime (temporal overlap queries)
  - [ ] Implement sortby (ORDER BY in SQL)
- [ ] CQL2-Parser Integration (cql2-rs via WASM)
- [ ] Controller-Layer implementieren
- [ ] Service-Layer für Business Logic
- [ ] OpenAPI Dokumentation vervollständigen
- [ ] Erweiterte Tests (Integration, E2E)
  - [ ] Unit tests for validators
  - [ ] Integration tests for filtered queries
- [ ] Docker Setup
- [ ] CI/CD Pipeline

### Implementierungsplan (siehe bid.md)

1. ✅ **AP-01**: Projekt-Skeleton & Infrastruktur
2. ✅ **AP-02**: Query Parameter Validation (q, bbox, datetime, limit, sortby, token)
3. 🚧 **AP-03**: STAC-Core Endpunkte (Basis vorhanden)
4. 🚧 **AP-04**: Collection Search – Filter-Implementierung (DB-Integration pending)
5. ⏳ **AP-05**: CQL2-Filtering Integration

## 📄 Lizenz

Apache-2.0

## 👥 Team

STAC Atlas API Team - Robin (Teamleiter), Jonas, George, Vincent
