# STAC-Atlas UI

Vue 3 + TypeScript frontend for the STAC-Atlas project. This is a modern single-page application (SPA) that provides a user-friendly interface for searching, browsing, and exploring STAC (SpatioTemporal Asset Catalog) collections.

## Table of Contents

- [Overview](#overview)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Local Development](#local-development)
  - [Docker Deployment](#docker-deployment)
- [Environment Variables](#environment-variables)
- [How It Works](#how-it-works)
- [Design Decisions](#design-decisions)
- [Libraries & Dependencies](#libraries--dependencies)
- [Project Structure](#project-structure)
- [Documentation](#documentation)

---

## Overview

STAC-Atlas UI is a responsive web application that connects to the STAC-Atlas API to provide:

- **Collection Search**: Full-text search across STAC collection titles, descriptions, and keywords
- **Advanced Filtering**: Filter by bounding box, temporal range, provider, license, and more
- **Interactive Maps**: Visualize collection spatial extents using MapLibre GL
- **Pagination**: Efficiently browse through large numbers of collections
- **Internationalization**: Support for English and German languages
- **CQL2 Filtering**: Advanced query support using OGC CQL2 filter expressions

---

## Getting Started

### Prerequisites

- **Node.js** >= 18.x
- **npm** >= 9.x (or pnpm)
- **Docker** and **Docker Compose** (for containerized deployment)

### Local Development

```bash
# Navigate to the UI directory
cd ui

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Update queryables data (providers/licenses)
npm run update-queryables
```

The development server runs at `http://localhost:5173/` with hot module replacement (HMR) enabled.

### Docker Deployment

The UI can be deployed as a standalone Docker container serving static files via Nginx.

#### Using Docker Compose (Recommended)

```bash
# From the ui directory
cd ui

# Build and start the container
docker-compose up -d

# Stop the container
docker-compose down
```

The UI will be available at `http://localhost:8080`.

#### Using Docker Directly

```bash
# Build the Docker image
docker build -t stac-atlas-ui .

# Run the container
docker run -d -p 8080:80 --name stac-atlas-ui stac-atlas-ui

# Stop and remove
docker stop stac-atlas-ui && docker rm stac-atlas-ui
```

#### Full Stack Deployment

To run the complete STAC-Atlas stack (UI, API, Database), use the root `docker-compose.yml`:

```bash
# From the project root
docker-compose up -d
```

---

## Environment Variables

The UI uses Vite's environment variable system. Variables must be prefixed with `VITE_` to be exposed to the client.

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_BASE_URL` | `http://localhost:3000` | Base URL of the STAC-Atlas API. Change this to point to your API server in production. |

### Configuration

Create a `.env` file in the `ui/` directory:

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:3000

# Production example
# VITE_API_BASE_URL=https://api.stac-atlas.example.com
```

**Note**: Environment variables are embedded at build time. For Docker deployments, you need to rebuild the image after changing `.env` values, or use runtime configuration injection.

---

## How It Works

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     STAC-Atlas UI                           │
├─────────────────────────────────────────────────────────────┤
│  Views (Home, CollectionDetail)                             │
│    └── Components (FilterSection, SearchResults, ...)       │
│          └── Composables (useI18n, useQueryables)           │
│                └── Services (API calls)                     │
│                      └── Stores (Pinia state management)    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  STAC-Atlas API │
                    │   (REST API)    │
                    └─────────────────┘
```

### Core Functionality

1. **Collection Search & Filtering**
   - The `FilterSection` component provides UI controls for all filter parameters
   - Filters are managed centrally in the `filterStore` (Pinia store)
   - Changes trigger API requests with debounced search queries

2. **API Communication**
   - The `api.ts` service handles all HTTP requests to the STAC-Atlas API
   - Supports collection search parameters: `q`, `bbox`, `datetime`, `provider`, `license`, `filter` (CQL2)
   - Implements RFC 7807 error response parsing

3. **State Management**
   - Pinia store (`filterStore`) maintains filter state, pagination, and loading states
   - Reactive computed properties automatically format API request parameters

4. **Internationalization**
   - Custom `useI18n` composable provides English/German translations
   - Language preference is persisted in localStorage
   - Browser language is auto-detected on first visit

5. **Queryables**
   - Available providers and licenses are loaded from a static JSON file
   - The file is generated by the `update-queryables` script which fetches from the API
   - Auto-refreshes every 24 hours

---

## Design Decisions

### 1. Vue 3 Composition API

**Decision**: Use Vue 3 with the Composition API exclusively (no Options API).

**Rationale**:
- Better TypeScript integration with improved type inference
- More flexible code organization through composables
- Improved code reusability across components
- Better tree-shaking for smaller bundle sizes

### 2. Vite as Build Tool

**Decision**: Use Vite instead of Vue CLI or Webpack.

**Rationale**:
- Significantly faster development server startup (native ES modules)
- Faster hot module replacement (HMR)
- Simpler configuration
- Better TypeScript support out of the box
- Modern build output with Rollup

### 3. Pinia for State Management

**Decision**: Use Pinia instead of Vuex.

**Rationale**:
- Official Vue 3 state management library
- Better TypeScript support with full type inference
- Simpler API without mutations (just actions)
- Modular by design - each store is independent
- DevTools support built-in

### 4. Custom i18n Implementation

**Decision**: Implement a lightweight custom i18n solution instead of using vue-i18n.

**Rationale**:
- Simpler implementation for a two-language application
- Smaller bundle size (no external dependency)
- Reactive language switching with Vue's reactivity system
- Full type safety for translation keys

### 5. MapLibre GL for Maps

**Decision**: Use MapLibre GL instead of Leaflet or other mapping libraries.

**Rationale**:
- Open-source and free (forked from Mapbox GL before license change)
- WebGL-based rendering for smooth performance
- Better handling of vector tiles
- Modern API with good TypeScript support

### 6. Static Queryables File

**Decision**: Fetch filter options (providers, licenses) from a static JSON file instead of the API.

**Rationale**:
- Reduces API load - no need to query for filter options on every page load
- Faster initial page load
- Can be cached aggressively
- Updated via a script that runs periodically

### 7. CSS Custom Properties (CSS Variables)

**Decision**: Use CSS custom properties for theming instead of a CSS-in-JS solution.

**Rationale**:
- Native browser support - no runtime overhead
- Easy theme switching (future dark mode support)
- Works well with scoped component styles
- No additional library needed

### 8. Multi-Stage Docker Build

**Decision**: Use a multi-stage Dockerfile with Node for building and Nginx for serving.

**Rationale**:
- Smaller final image size (Nginx Alpine is ~20MB)
- No Node.js runtime needed in production
- Efficient static file serving with Nginx
- Built-in gzip compression and caching headers

---

## Libraries & Dependencies

### Core Framework

| Library | Version | Purpose |
|---------|---------|---------|
| **Vue** | 3.5.x | Progressive JavaScript framework for building user interfaces |
| **TypeScript** | 5.9.x | Typed superset of JavaScript for better developer experience and code quality |

### Routing & State Management

| Library | Version | Purpose |
|---------|---------|---------|
| **Vue Router** | 4.6.x | Official client-side router for Vue.js with history mode support |
| **Pinia** | 3.0.x | State management library for Vue with TypeScript support |

### UI & Visualization

| Library | Version | Purpose |
|---------|---------|---------|
| **MapLibre GL** | 5.13.x | Open-source WebGL-based library for interactive maps and spatial extent visualization |
| **Lucide Vue Next** | 0.556.x | Icon library providing consistent, customizable SVG icons throughout the UI |

### Utilities

| Library | Version | Purpose |
|---------|---------|---------|
| **VueUse** | 14.1.x | Collection of Vue composition utilities for common tasks (debounce, localStorage, etc.) |

### Development Tools

| Library | Purpose |
|---------|---------|
| **Vite** | Fast build tool with native ES modules support and HMR |
| **vue-tsc** | TypeScript type-checking for Vue single-file components |
| **@vitejs/plugin-vue** | Official Vue plugin for Vite |

---

## Project Structure

```
ui/
├── public/               # Static assets (served as-is)
│   └── data/             # Generated queryables JSON
├── scripts/              # Build and utility scripts
│   └── update-queryables.js  # Fetches providers/licenses from API
├── src/
│   ├── assets/           # Static assets (bundled)
│   │   └── styles/       # Global CSS architecture
│   ├── components/       # Reusable UI components
│   │   ├── BoundingBoxModal.vue  # Map-based bbox selection
│   │   ├── CustomSelect.vue      # Styled select dropdown
│   │   ├── FilterSection.vue     # Main filter controls
│   │   ├── InfoCard.vue          # Collection info display
│   │   ├── ItemCard.vue          # Collection card in grid
│   │   ├── Navbar.vue            # Navigation header
│   │   ├── SearchResultCard.vue  # Search result item
│   │   ├── SearchResults.vue     # Results grid layout
│   │   └── SearchSection.vue     # Search input area
│   ├── composables/      # Shared composition functions
│   │   ├── useI18n.ts    # Internationalization logic
│   │   └── useQueryables.ts  # Filter options management
│   ├── i18n/             # Translation files
│   │   ├── en.ts         # English translations
│   │   ├── de.ts         # German translations
│   │   └── index.ts      # i18n exports
│   ├── router/           # Vue Router configuration
│   │   └── index.ts      # Route definitions
│   ├── services/         # API communication layer
│   │   └── api.ts        # STAC-Atlas API client
│   ├── stores/           # Pinia state stores
│   │   └── filterStore.ts    # Filter and pagination state
│   ├── types/            # TypeScript type definitions
│   │   └── collection.ts # STAC collection types
│   ├── views/            # Page-level components
│   │   ├── Home.vue          # Main search page
│   │   └── CollectionDetail.vue  # Single collection view
│   ├── App.vue           # Root component
│   └── main.ts           # Application entry point
├── docs/                 # Internal documentation
│   ├── STRUCTURE.md      # Folder structure guide
│   ├── STYLING.md        # CSS architecture guide
│   └── i18n.md           # Internationalization guide
├── docker-compose.yml    # Docker Compose configuration
├── Dockerfile            # Multi-stage Docker build
├── nginx.conf            # Nginx server configuration
├── package.json          # npm dependencies and scripts
├── tsconfig.json         # TypeScript configuration
├── vite.config.ts        # Vite build configuration
└── .env                  # Environment variables (not in git)
```

---

## Documentation

- [Folder Structure Guide](./docs/STRUCTURE.md) - Detailed breakdown of project organization
- [Styling Guide](./docs/STYLING.md) - CSS architecture and component styling patterns
- [Internationalization](./docs/i18n.md) - How to add and manage translations

---

## API Requirements

The UI requires the STAC-Atlas API to be running. The API should support:

- `GET /collections` - Search and list collections
- `GET /collections/:id` - Get single collection details
- Query parameters: `q`, `bbox`, `datetime`, `limit`, `token`, `provider`, `license`, `filter`, `filter-lang`

See the [API documentation](../api/README.md) for full details.

---

## License

This project is part of the STAC-Atlas project. See the [LICENSE](../LICENSE) file in the project root for details.
