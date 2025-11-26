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

### API Dokumentation

- **Swagger UI**: `http://localhost:3000/api-docs` (wenn `docs/openapi.yaml` existiert)
- **OpenAPI Spec**: `docs/openapi.yaml`

## 🏗️ Projektstruktur

```
api/
├── bin/
│   └── www                 # Server-Startskript
├── data/
│   ├── collections.js  # Test collections 
├── routes/
│   ├── index.js           # Landing Page (/)
│   ├── conformance.js     # Conformance Classes
│   ├── collections.js     # Collections Endpoints
│   └── queryables.js      # Queryables Schema
├── __tests__/
│   └── api.test.js        # API Tests
├── docs/
├── app.js                 # Express App Setup
├── package.json
├── .env.example           # Beispiel-Umgebungsvariablen
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

## 📦 Nächste Schritte

### TODO

- [ ] Datenbank-Integration (PostgreSQL + PostGIS)
- [ ] CQL2-Parser Integration (cql2-rs via WASM)
- [ ] Controller-Layer implementieren
- [ ] Service-Layer für Business Logic
- [ ] OpenAPI Dokumentation vervollständigen
- [ ] Erweiterte Tests (Integration, E2E)
- [ ] Docker Setup
- [ ] CI/CD Pipeline

### Implementierungsplan (siehe bid.md)

1. ✅ **AP-01**: Projekt-Skeleton & Infrastruktur
2. 🚧 **AP-02**: Daten-Vertrag & Queryables
3. ⏳ **AP-03**: STAC-Core Endpunkte (Basis vorhanden)
4. ⏳ **AP-04**: Collection Search – Routen & Parameter
5. ⏳ **AP-05**: CQL2-Filtering Integration

## 📄 Lizenz

Apache-2.0

## 👥 Team

STAC Atlas API Team - Robin (Teamleiter), Jonas, George, Vincent
