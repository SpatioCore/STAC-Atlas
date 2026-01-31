# STAC Crawler

A Node.js crawler for STAC Index API that fetches and processes catalog and collection data with configurable options.

## Configuration

The crawler can be configured using environment variables, CLI arguments, or a combination of both. CLI arguments take precedence over environment variables.

### Configuration Options

| Option | CLI Flag | Environment Variable | Default | Description |
|--------|----------|---------------------|---------|-------------|
| Mode | `-m, --mode` | `CRAWL_MODE` | `both` | Crawl mode: `catalogs`, `apis`, or `both` |
| Max Catalogs | `-c, --max-catalogs` | `MAX_CATALOGS` | `10` | Maximum number of catalogs to process |
| Max APIs | `-a, --max-apis` | `MAX_APIS` | `5` | Maximum number of APIs to process |
| Timeout | `-t, --timeout` | `TIMEOUT_MS` | `30000` | Timeout per operation in milliseconds |
| Max Depth | `-d, --max-depth` | `MAX_DEPTH` | `3` | Maximum recursion depth for nested catalogs |

### Using Environment Variables

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Edit `.env` to customize settings:
```bash
CRAWL_MODE=both
MAX_CATALOGS=20
MAX_APIS=10
TIMEOUT_MS=60000
MAX_DEPTH=5
```

3. Run the crawler:
```bash
npm start
```

### Using CLI Arguments

Run the crawler with command-line arguments to override defaults or environment variables:

```bash
# Crawl only catalogs with custom limits
node index.js --mode catalogs --max-catalogs 20

# Crawl only APIs with extended timeout
node index.js -m apis -a 10 -t 60000

# Crawl both with all custom settings
node index.js -m both -c 50 -a 20 -t 45000 -d 5
```

### Show Help

Display all available options:

```bash
node index.js --help
```

## Running Locally

```bash
# Install dependencies
npm install

# Run with default configuration
npm start

# Run with custom configuration
node index.js --mode catalogs --max-catalogs 15
```

## Docker

### Build and run with Docker

```bash
# Build the image
docker build -t stac-crawler .

# Run with default configuration
docker run --rm stac-crawler

# Run with environment variables
docker run --rm -e CRAWL_MODE=apis -e MAX_APIS=10 stac-crawler

# Run with CLI arguments
docker run --rm stac-crawler --mode catalogs --max-catalogs 20
```

Or use npm scripts:

```bash
npm run docker:build
npm run docker:run
```

### Using Docker Compose

Create a `.env` file or modify `docker-compose.yml` to set environment variables:

```bash
# Start the crawler
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the crawler
docker-compose down
```

Or use npm scripts:

```bash
npm run docker:compose:up
npm run docker:compose:down
```

## Testing

### Running Tests

Run the complete test suite:
```bash
npm test
```

Run tests in watch mode during development:
```bash
npm run test:watch
```

Run tests with coverage report:
```bash
npm test -- --coverage
```

### Test Structure

The test suite covers utility functions with **110 tests** across three modules:

- **`normalization.test.js`** (46 tests) - Tests for catalog and collection normalization
  - Coverage: 91% statements, 92% branches
  - Tests `deriveCategories()`, `normalizeCatalog()`, `normalizeCollection()`, `processCatalogs()`

- **`parallel.test.js`** (53 tests) - Tests for parallel execution utilities
  - Coverage: 100% statements, 100% branches
  - Tests `getDomain()`, `groupByDomain()`, `createDomainBatches()`, `aggregateStats()`, `executeWithConcurrency()`, `calculateRateLimits()`, `logDomainStats()`

- **`api.test.js`** (29 tests) - Tests for API crawling utilities
  - Tests batch management, URL validation, STAC API response structures
  - Uses real STAC API endpoints (Microsoft Planetary Computer, Element 84, USGS, NASA CMR)

All tests use **real STAC domain names and collection IDs** from production STAC APIs for realistic testing.

## Examples

### Example 1: Quick API Test
Crawl only the first 3 APIs with a short timeout:
```bash
node index.js -m apis -a 3 -t 15000
```

### Example 2: Deep Catalog Exploration
Crawl 100 catalogs with maximum depth and extended timeout:
```bash
node index.js -m catalogs -c 100 -d 10 -t 120000
```

### Example 3: Balanced Crawl
Crawl both catalogs and APIs with moderate settings:
```bash
node index.js -m both -c 25 -a 15 -t 45000 -d 4
```

### Example 4: Production Environment
Set up `.env` for production:
```bash
CRAWL_MODE=both
MAX_CATALOGS=1000
MAX_APIS=500
TIMEOUT_MS=60000
MAX_DEPTH=5
```

Then run:
```bash
npm start
```
