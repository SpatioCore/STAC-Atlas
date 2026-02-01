# STAC Crawler

A Node.js crawler for STAC Index API that fetches and processes catalog and collection data with configurable options. Includes an automated scheduler for periodic crawling.

## Features

- **Single-run Mode**: Execute crawler once and exit
- **Scheduled Mode**: Automated periodic crawling with configurable intervals
- **Time Window Control**: Optional restriction to specific hours (e.g., night-time crawling)
- **Retry Logic**: Automatic retry on crawl errors with configurable delay
- **Environment-based Configuration**: All settings configurable via `.env` file
- **CLI Arguments**: Override settings with command-line flags
- **Database Integration**: PostgreSQL storage with deadlock handling
- **Parallel Execution**: Efficient domain-based parallel processing

## Quick Start

```bash
# Install dependencies
npm install

# Copy and configure environment file
cp .env.example .env
```
### Single Crawl Run

```bash
# Run crawler once
npm start
```

### Scheduled Crawling

```bash
# Run scheduler for automatic periodic crawling
node scheduler.js
```

The scheduler will:
- Run the crawler immediately on startup (configurable)
- Schedule next runs based on configured interval (default: 7 days)
- Respect time window restrictions if enabled
- Automatically retry on errors

## Configuration

The crawler can be configured using environment variables, CLI arguments, or a combination of both. CLI arguments take precedence over environment variables.

### Configuration Options

#### Crawler Configuration

| Option | CLI Flag | Environment Variable | Default | Description |
|--------|----------|---------------------|---------|-------------|
| Mode | `-m, --mode` | `CRAWL_MODE` | `both` | Crawl mode: `catalogs`, `apis`, or `both` |
| Max Catalogs | `-c, --max-catalogs` | `MAX_CATALOGS` | `10` | Maximum number of catalogs to process |
| Max APIs | `-a, --max-apis` | `MAX_APIS` | `5` | Maximum number of APIs to process |
| Timeout | `-t, --timeout` | `TIMEOUT_MS` | `30000` | Timeout per operation in milliseconds |
| Max Depth | `-d, --max-depth` | `MAX_DEPTH` | `3` | Maximum recursion depth for nested catalogs |

#### Scheduler Configuration

| Environment Variable | Default | Description |
|---------------------|---------|-------------|
| `CRAWL_DAYS_INTERVAL` | `7` | Days between crawl runs |
| `CRAWL_RUN_ON_STARTUP` | `true` | Run crawler immediately on startup |
| `CRAWL_RETRY_ON_ERROR` | `true` | Retry if crawl fails but DB is ok |
| `CRAWL_RETRY_DELAY_HOURS` | `2` | Hours to wait before retry on error |
| `CRAWL_ENFORCE_TIME_WINDOW` | `false` | Enable time window restrictions |
| `CRAWL_ALLOWED_START_HOUR` | `22` | Start hour (0-23) when time window is enforced |
| `CRAWL_ALLOWED_END_HOUR` | `7` | End hour (0-23) when time window is enforced |
| `CRAWL_GRACE_PERIOD_MINUTES` | `30` | Grace period in minutes after end hour |

#### Database Configuration

| Environment Variable | Description |
|---------------------|-------------|
| `PGHOST` | PostgreSQL host |
| `PGPORT` | PostgreSQL port (default: 5432) |
| `PGUSER` | PostgreSQL username |
| `PGPASSWORD` | PostgreSQL password |
| `PGDATABASE` | PostgreSQL database name |

### Using Environment Variables

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Edit `.env` to customize settings:
```bash
# Database Configuration
PGHOST=localhost
PGPORT=5432
PGUSER=postgres
PGPASSWORD=yourpassword
PGDATABASE=stac_db

# Crawler Configuration
CRAWL_MODE=both
MAX_CATALOGS=0  # 0 = unlimited
MAX_APIS=0      # 0 = unlimited
TIMEOUT_MS=30000
MAX_DEPTH=3

# Scheduler Configuration
CRAWL_DAYS_INTERVAL=7
CRAWL_RUN_ON_STARTUP=true
CRAWL_RETRY_ON_ERROR=true
CRAWL_RETRY_DELAY_HOURS=2

# Time Window Configuration (optional)
# Set CRAWL_ENFORCE_TIME_WINDOW=true to restrict crawling to specific hours
CRAWL_ENFORCE_TIME_WINDOW=false
CRAWL_ALLOWED_START_HOUR=22  # 10 PM
CRAWL_ALLOWED_END_HOUR=7     # 7 AM
CRAWL_GRACE_PERIOD_MINUTES=30
```

3. Run the crawler or scheduler:
```bash
# Single run
npm start

# Scheduled runs
node scheduler.js
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

### Single Crawl Run

```bash
# Install dependencies
npm install

# Run with default configuration
npm start

# Run with custom configuration via CLI
node index.js --mode catalogs --max-catalogs 15
```

### Scheduled Crawling

```bash
# Start the scheduler (runs in foreground)
node scheduler.js

# The scheduler will:
# - Run crawler immediately on startup (if CRAWL_RUN_ON_STARTUP=true)
# - Schedule next run based on CRAWL_DAYS_INTERVAL
# - Wait for allowed time window (if CRAWL_ENFORCE_TIME_WINDOW=true)
# - Automatically retry on errors (if CRAWL_RETRY_ON_ERROR=true)
# - Stop gracefully with Ctrl+C
```

### Time Window Examples

**Example 1: Night-time only crawling (22:00 - 07:00)**
```bash
CRAWL_ENFORCE_TIME_WINDOW=true
CRAWL_ALLOWED_START_HOUR=22
CRAWL_ALLOWED_END_HOUR=7
```

**Example 2: Business hours crawling (09:00 - 17:00)**
```bash
CRAWL_ENFORCE_TIME_WINDOW=true
CRAWL_ALLOWED_START_HOUR=9
CRAWL_ALLOWED_END_HOUR=17
```

**Example 3: No restrictions (default)**
```bash
CRAWL_ENFORCE_TIME_WINDOW=false
```

## Docker

### Build and run with Docker

```bash
# Build the image
docker build -t stac-crawler .

# Run single crawl with default configuration
docker run --rm stac-crawler

# Run with environment variables
docker run --rm \
  -e PGHOST=host.docker.internal \
  -e PGPORT=5432 \
  -e PGUSER=postgres \
  -e PGPASSWORD=yourpassword \
  -e PGDATABASE=stac_db \
  -e CRAWL_MODE=apis \
  -e MAX_APIS=10 \
  stac-crawler

# Run with CLI arguments
docker run --rm stac-crawler --mode catalogs --max-catalogs 20

# Run scheduler in Docker (detached)
docker run -d \
  --name stac-scheduler \
  -e PGHOST=host.docker.internal \
  -e CRAWL_DAYS_INTERVAL=7 \
  stac-crawler node scheduler.js
```

Or use npm scripts:

```bash
npm run docker:build
npm run docker:run
```

### Using Docker Compose

Create a `.env` file or modify `docker-compose.yml` to set environment variables:

```bash
# Start the crawler (single run)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the crawler
docker-compose down
```

For scheduled crawling with Docker Compose, modify `docker-compose.yml`:
```yaml
services:
  crawler:
    build: .
    command: node scheduler.js  # Use scheduler instead of single run
    env_file: .env
    restart: unless-stopped  # Auto-restart on failure
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

## Architecture

### Core Components

- **`index.js`** - Main crawler entry point for single runs
- **`scheduler.js`** - Scheduler for periodic automated crawling
- **`utils/db.js`** - Database helper with PostgreSQL connection pool
  - `initDb()` - Initialize and test database connection
  - `insertOrUpdateCollection()` - Insert/update collections with deadlock retry logic
  - `insertOrUpdateCatalog()` - Process catalogs (currently skips saving)
  - Helper functions for keywords, extensions, providers, assets, summaries
- **`utils/normalization.js`** - Data normalization and processing
- **`utils/parallel.js`** - Parallel execution utilities with domain-based batching
- **`utils/config.js`** - Configuration management (env vars + CLI)
- **`utils/time.js`** - Time formatting utilities
- **`catalogs/catalog.js`** - Static catalog crawling logic
- **`apis/api.js`** - STAC API crawling logic

### Database Schema

The crawler stores collections in PostgreSQL with the following key tables:
- `collection` - Main collection data with spatial/temporal extents
- `collection_summaries` - Collection summary metadata
- `collection_keywords` - Keywords linked to collections
- `collection_stac_extension` - STAC extensions used
- `collection_providers` - Data providers
- `collection_assets` - Collection assets
- `crawllog_collection` - Active queue for *all* discovered crawl URLs (catalogs, collection endpoints, and collection links), drained in batches to keep RAM stable

### Scheduler Workflow

1. **Initialization**: Load configuration from `.env`
2. **Startup Check**: Verify if within allowed time window
3. **Initial Run**: Execute crawler immediately (if enabled)
4. **Schedule Next**: Calculate next run time based on interval
5. **Time Window Adjustment**: Shift schedule to fit time window if enforced
6. **Wait**: Sleep until next scheduled time
7. **Execute**: Run crawler and collect statistics
8. **Error Handling**: 
   - DB errors → Stop scheduler
   - Crawl errors → Retry after delay (if enabled)
   - Success → Schedule next run
9. **Repeat**: Loop back to step 6

### Error Handling

- **Database Errors**: Scheduler stops to prevent data corruption
- **Crawl Errors**: Automatic retry with configurable delay (default: 2 hours)
- **Deadlock Handling**: Automatic retry with exponential backoff for database deadlocks
- **Time Window Violations**: Grace period allows crawler to finish current operations
- **Connection Errors**: Detailed error logging with connection details

## Troubleshooting

### Scheduler Not Running

Check that:
1. Database connection is configured correctly in `.env`
2. Database is accessible and running
3. Time window settings allow execution (if `CRAWL_ENFORCE_TIME_WINDOW=true`)

View scheduler status:
```bash
node scheduler.js
# Output shows current configuration and time window status
```

### Crawler Runs Too Frequently

Increase `CRAWL_DAYS_INTERVAL`:
```bash
CRAWL_DAYS_INTERVAL=14  # Run every 2 weeks
```

### Crawler Only Runs at Specific Times

This is controlled by time window enforcement. To allow crawling anytime:
```bash
CRAWL_ENFORCE_TIME_WINDOW=false
```

### Database Connection Errors

Verify database configuration:
```bash
# Test connection manually
psql -h $PGHOST -p $PGPORT -U $PGUSER -d $PGDATABASE
```

Check environment variables are loaded:
```bash
node -e "require('dotenv').config(); console.log(process.env.PGHOST)"
```

### Deadlock Errors

The crawler has automatic deadlock retry logic with exponential backoff. If deadlocks persist:
- Reduce parallel execution settings
- Increase database connection pool size
- Check database load and indexing

## Performance Tuning

### Parallel Execution Settings

Control parallel processing (in `.env.example` or code):
- `PARALLEL_DOMAINS` - Number of domains to process simultaneously
- `MAX_REQUESTS_PER_MINUTE_PER_DOMAIN` - Rate limit per domain
- `MAX_CONCURRENCY_PER_DOMAIN` - Max concurrent requests per domain
- `MAX_CONCURRENCY` - Overall max concurrency

### Database Connection Pool

Adjust pool size in `utils/db.js`:
```javascript
const pool = new Pool({
  // ... other settings
  max: 10,  // Increase for higher parallelism
});
```

### Timeout Configuration

Increase timeouts for slow endpoints:
```bash
TIMEOUT_MS=120000  # 2 minutes
```

## npm Scripts

```bash
npm start              # Run crawler once
npm test               # Run all tests
npm run test:watch     # Run tests in watch mode
npm run docker:build   # Build Docker image
npm run docker:run     # Run Docker container
npm run docker:compose:up    # Start with docker-compose
npm run docker:compose:down  # Stop docker-compose
```

## License

See LICENSE file in the project root.

## Examples

### Single-Run Examples

#### Example 1: Quick API Test
Crawl only the first 3 APIs with a short timeout:
```bash
node index.js -m apis -a 3 -t 15000
```

#### Example 2: Deep Catalog Exploration
Crawl 100 catalogs with maximum depth and extended timeout:
```bash
node index.js -m catalogs -c 100 -d 10 -t 120000
```

#### Example 3: Balanced Crawl
Crawl both catalogs and APIs with moderate settings:
```bash
node index.js -m both -c 25 -a 15 -t 45000 -d 4
```

### Scheduler Examples

#### Example 1: Weekly Full Crawl (Default)
Run complete crawl every 7 days, anytime:
```bash
CRAWL_DAYS_INTERVAL=7
CRAWL_RUN_ON_STARTUP=true
CRAWL_ENFORCE_TIME_WINDOW=false
```

#### Example 2: Night-time Weekly Crawl
Run every 7 days, only between 22:00 and 07:00:
```bash
CRAWL_DAYS_INTERVAL=7
CRAWL_ENFORCE_TIME_WINDOW=true
CRAWL_ALLOWED_START_HOUR=22
CRAWL_ALLOWED_END_HOUR=7
CRAWL_GRACE_PERIOD_MINUTES=30
```

#### Example 3: Daily Updates
Run every day with retry on errors:
```bash
CRAWL_DAYS_INTERVAL=1
CRAWL_RUN_ON_STARTUP=true
CRAWL_RETRY_ON_ERROR=true
CRAWL_RETRY_DELAY_HOURS=2
```

#### Example 4: Production Setup
Full production configuration in `.env`:
```bash
# Database
PGHOST=db.production.com
PGPORT=5432
PGUSER=crawler_user
PGPASSWORD=secure_password
PGDATABASE=stac_production

# Crawler - Full scan
CRAWL_MODE=both
MAX_CATALOGS=0  # Unlimited
MAX_APIS=0      # Unlimited
TIMEOUT_MS=60000
MAX_DEPTH=5

# Scheduler - Weekly night crawls
CRAWL_DAYS_INTERVAL=7
CRAWL_RUN_ON_STARTUP=false  # Wait for scheduled time
CRAWL_RETRY_ON_ERROR=true
CRAWL_RETRY_DELAY_HOURS=2

# Time Window - Night time only
CRAWL_ENFORCE_TIME_WINDOW=true
CRAWL_ALLOWED_START_HOUR=22
CRAWL_ALLOWED_END_HOUR=7
CRAWL_GRACE_PERIOD_MINUTES=30
```

Then run the scheduler:
```bash
node scheduler.js
```
