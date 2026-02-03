# STAC-Atlas UI

Vue 3 + TypeScript frontend for the STAC-Atlas project.

## Quick Start

```bash
# Go to the ui directory if needed*
cd ui

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Tech Stack

- **Vue 3** - Progressive JavaScript framework
- **TypeScript** - Type-safe JavaScript
- **Vite** - Fast build tool and dev server
- **Pinia** - State management
- **Vue Router** - Client-side routing
- **MapLibre GL** - Interactive maps
- **VueUse** - Vue composition utilities

## Project Structure

```
src/
├── assets/          # Static assets (images, styles)
│   └── styles/      # Global CSS architecture
├── components/      # Reusable UI components
├── composables/     # Shared composition functions
├── services/        # API and STAC service calls
├── stores/          # Pinia state stores
├── types/           # TypeScript type definitions
├── views/           # Page-level components
├── App.vue          # Root component
└── main.ts          # Application entry point
```

## Documentation

- [Folder Structure Guide](./docs/STRUCTURE.md) - Detailed breakdown of project organization
- [Styling Guide](./docs/STYLING.md) - CSS architecture and component styling patterns

## Development

The dev server runs at `http://localhost:5173/` with hot module replacement enabled.
