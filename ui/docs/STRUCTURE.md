# Project Structure

## Overview

The UI follows a modular architecture with clear separation of concerns.

## Folders

### `src/assets/`

Static assets like images, fonts, and global styles.

**styles/** - Structured CSS architecture:

- `base/reset.css` - CSS reset
- `base/vars.css` - CSS custom properties
- `base/base.css` - Global styles
- `main.css` - Main entry point

### `src/components/`

Reusable UI components used across multiple views.

**Examples:**

- `Button.vue`
- `SearchBar.vue`
- `MapViewer.vue`

**Convention:** PascalCase naming, single component per file.

### `src/composables/`

Shared composition functions (Vue Composition API logic).

**Examples:**

- `useMap.ts` - Map interaction logic
- `useFetch.ts` - Data fetching utilities
- `useDebounce.ts` - Debounce helper

**Convention:** Prefix with `use`, export as default.

### `src/services/`

External API calls and business logic.

**Examples:**

- `stacApi.ts` - STAC catalog API
- `geocoding.ts` - Geocoding service
- `api.ts` - Base API configuration

**Convention:** Pure functions, no component logic.

### `src/stores/`

Pinia state management stores.

**Examples:**

- `catalogStore.ts` - STAC catalog state
- `mapStore.ts` - Map state and settings
- `userStore.ts` - User preferences

**Convention:** One store per domain, use `defineStore`.

### `src/types/`

TypeScript type definitions and interfaces.

**Examples:**

- `stac.ts` - STAC specification types
- `map.ts` - Map-related types
- `api.ts` - API response types

**Convention:** Group by domain, export interfaces.

### `src/views/`

Page-level components (one per route).

**Examples:**

- `Home.vue`
- `CatalogView.vue`
- `MapView.vue`

**Convention:** PascalCase with `View` suffix for clarity.

## Import Aliases

```typescript
// Configured in vite.config.ts
import Component from '@/components/Component.vue'
import { useStore } from '@/stores/store'
import type { STACItem } from '@/types/stac'
```

## File Naming

- **Components/Views:** PascalCase (`SearchBar.vue`)
- **Services/Composables:** camelCase (`stacApi.ts`, `useMap.ts`)
- **Types:** camelCase (`stac.ts`)
- **Stores:** camelCase with `Store` suffix (`catalogStore.ts`)
