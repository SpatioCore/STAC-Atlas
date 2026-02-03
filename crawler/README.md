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

## Dependencies

The crawler uses carefully selected libraries for specific functionality:

### Core Dependencies

#### **Crawlee** (v3.15.3)
- **Purpose**: Advanced web crawling framework with built-in request management
- **Why chosen**: 
  - Automatic retry logic with exponential backoff
  - Built-in rate limiting per domain
  - Concurrent request handling with configurable concurrency
  - Request queue management for large-scale crawling
  - Automatic handling of timeouts and errors
- **Key features used**:
  - `HttpCrawler` - For HTTP requests with JSON parsing
  - Request/response handlers for custom processing
  - Domain-based crawling strategies
- **Alternative considered**: Axios alone - rejected because it lacks built-in queue management and retry logic

#### **axios** (v1.13.2)
- **Purpose**: HTTP client for direct API calls (non-crawling requests)
- **Why chosen**: 
  - Simple interface for one-off requests (e.g., fetching catalog list)
  - Wide adoption and reliability
  - Promise-based async/await support
- **Used for**: Initial STAC Index API calls before crawling starts

#### **stac-js** (v0.1.9)
- **Purpose**: STAC object manipulation and metadata extraction
- **Why chosen**:
  - Official STAC library with spec-compliant parsers
  - Type detection (Collection, Catalog, Item)
  - Built-in methods for extent extraction (`getBoundingBox()`, `getTemporalExtent()`)
  - Link resolution (relative to absolute URLs)
- **Key features used**:
  - `create()` - Parse JSON into STAC objects
  - `isCollection()`, `isCatalog()` - Type checking
  - Extent extraction methods

#### **stac-node-validator** (v2.0.0-rc.1)
- **Purpose**: Validate STAC JSON against official schemas
- **Why chosen**:
  - Uses official STAC JSON schemas
  - Validates core spec + extensions (EO, SAT, Projection, etc.)
  - Detailed error reporting with field-level messages
  - Async validation suitable for high-volume crawling
- **Key features used**:
  - Full STAC spec validation (v1.0.0, v1.1.0 support)
  - Extension schema validation
  - Error message extraction for debugging
- **Critical for**: Data quality - filters out malformed STAC metadata before database insertion

#### **@databases/pg** (v5.5.0)
- **Purpose**: PostgreSQL database client with modern async/await support
- **Why chosen**:
  - Type-safe SQL queries with tagged template literals
  - Connection pooling built-in
  - Better TypeScript support than `pg` alone
  - Cleaner API than raw `pg`
- **Key features used**:
  - Connection pool management
  - Parameterized queries (SQL injection prevention)
  - Transaction support


#### **dotenv** (v17.2.3)
- **Purpose**: Environment variable management from `.env` files
- **Why chosen**:
  - Standard solution for 12-factor app configuration
  - Keeps sensitive credentials out of source code
  - Development/production environment separation
- **Used for**: Database credentials, crawler configuration, scheduler settings

### Development Dependencies

#### **Jest** (v29.7.0)
- **Purpose**: Testing framework
- **Why chosen**:
  - Industry standard for Node.js testing
  - Built-in assertion library
  - Parallel test execution
  - Coverage reporting
  - Module mocking support
- **Test coverage**: 110 tests across normalization, parallel execution, and API utilities
- **Configuration**: Uses ES modules (`--experimental-vm-modules`) for modern JavaScript support

### Implicit Dependencies

**Node.js built-ins**:
- `pg` (Pool) - Part of `@databases/pg`, PostgreSQL connection pooling
- `process.env` - Environment variable access
- `console` - Logging (no external logger to keep dependencies minimal)


## Technical Decisions

### 1. Why PostgreSQL?

**Decision**: Use PostgreSQL as the primary database

**Rationale**:
- **PostGIS extension**: Native geospatial support for bounding box queries
- **JSONB type**: Efficient storage of STAC summaries and nested metadata
- **Robust transactions**: ACID compliance prevents data corruption during concurrent crawls
- **Indexing**: B-tree, GiST, and GIN indexes for fast spatial and text searches
- **Scalability**: Handles millions of collections without performance degradation


### 2. Why Domain-Based Parallel Processing?

**Decision**: Group catalogs/APIs by domain and process domains in parallel

**Rationale**:
- **Rate limiting**: Each domain has independent rate limits - prevents throttling
- **Politeness**: Distributes load across servers, avoiding overwhelming single hosts
- **Efficiency**: Processes multiple domains simultaneously while respecting per-domain limits
- **Fairness**: Prevents slow domains from blocking fast domains


### 3. Why Separate Crawler and Scheduler?

**Decision**: Keep single-run crawler (`index.js`) separate from scheduler (`scheduler.js`)

**Rationale**:
- **Flexibility**: Users can run one-off crawls or automated schedules
- **Testing**: Easier to test crawler logic without scheduler complexity
- **Resource efficiency**: Single runs exit immediately, don't hold resources
- **Debugging**: Simpler to debug individual components
- **Docker compatibility**: Can run different commands in containers


### 4. Why Batch Flushing to Database?

**Decision**: Collect 25 collections in memory, then flush to database

**Rationale**:
- **Performance**: Reduces database connection overhead (25x fewer transactions)
- **Memory efficiency**: Prevents unbounded memory growth on large crawls
- **Error recovery**: Smaller batches = less data lost on errors
- **Deadlock mitigation**: Fewer concurrent transactions reduce deadlock risk

**Batch size selection**:
- Tested on 2GB RAM servers → 25 collections = ~10MB memory footprint
- Larger batches (100+) caused OOM on constrained servers
- Smaller batches (5-10) increased database load significantly


### 5. Why Deadlock Retry with Exponential Backoff?

**Decision**: Retry database deadlocks up to 3 times with exponential backoff

**Rationale**:
- **PostgreSQL behavior**: Concurrent inserts on related tables (keywords, extensions) can deadlock
- **Automatic recovery**: Transient deadlocks resolve after retry
- **Exponential backoff**: Reduces contention by spreading out retry attempts
- **Max retries**: Prevents infinite loops on persistent deadlocks






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
- **`utils/handlers.js`** - Request handlers for catalogs and collections with STAC validation
- **`utils/endpoints.js`** - STAC API endpoint discovery utilities
- **`catalogs/catalog.js`** - Static catalog crawling logic
- **`apis/api.js`** - STAC API crawling logic

## How It Works

### Crawling Process Overview

The crawler operates in two modes: **static catalog crawling** and **STAC API crawling**. Both modes follow a similar workflow but use different strategies to discover and process STAC collections.

#### Static Catalog Crawling

1. **Initialization**: Fetch the list of static catalogs from STAC Index API (`https://www.stacindex.org/api/catalogs`)
2. **Domain Grouping**: Group catalogs by domain to enable parallel processing while respecting rate limits
3. **Parallel Execution**: Process multiple domains simultaneously with configurable concurrency
4. **Recursive Traversal**: For each catalog:
   - Fetch the catalog JSON from its URL
   - Validate STAC structure using `stac-node-validator`
   - Migrate to normalized format using `stac-js`
   - Extract child links (catalogs and collections)
   - Recursively follow catalog links up to `MAX_DEPTH` (default: 3)
   - Process collection links to extract metadata
5. **Link Following**: The crawler follows STAC link relations:
   - `rel=child` - Navigate to child catalogs/collections
   - `rel=item` - Skip (items are not processed, only collections)
   - `rel=self` - Used to determine the source URL

#### STAC API Crawling

1. **Initialization**: Fetch the list of STAC APIs from STAC Index API
2. **Domain Grouping**: Same as static catalog crawling
3. **API Discovery**: For each API:
   - Fetch the API root endpoint
   - Validate STAC API compliance
   - Discover `/collections` endpoint from API conformance or links
   - Try multiple endpoint variations if needed (`/collections`, `/search`, etc.)
4. **Collection Enumeration**: 
   - Fetch all collections from `/collections` endpoint
   - Handle pagination if the API returns paged results
   - Process each collection individually
5. **Nested Catalog Support**: If a collection contains child catalog links, recursively crawl them (up to `MAX_DEPTH`)

#### What Gets Stored

The crawler stores the following data in PostgreSQL:

**Collections** (main data):
- **Core metadata**: `stac_id` (generated from slug + collection ID), `title`, `description`, `license`
- **Spatial extent**: Bounding box (`bbox`) stored as PostGIS geometry
- **Temporal extent**: Start and end dates
- **STAC version**: Version of STAC specification used
- **Source tracking**: `source_url` (original collection URL), `crawllog_catalog_id` (reference to source catalog)

**Related data** (linked tables):
- **Keywords**: Extracted from collection metadata, stored in `collection_keywords` with many-to-many relation
- **STAC Extensions**: List of STAC extensions used (e.g., `eo`, `sat`, `proj`), stored in `collection_stac_extension`
- **Providers**: Data providers with name, description, roles, and URL
- **Assets**: Collection-level assets (thumbnails, documentation, etc.)
- **Summaries**: Statistical summaries of collection properties 

**Crawl tracking** (for pause/resume):
- **`crawllog_catalog`**: Stores the catalog/API URLs and slugs for future re-crawling
- **`crawllog_collection`**: Records which collection URLs have been processed and when

**What is NOT stored**:
- **Individual items**: The crawler only processes collections, not individual STAC items
- **Catalog metadata**: Static catalogs are only used for traversal, not saved to the database
- **Full link arrays**: Only essential links (self, root) are preserved

#### Pause and Resume Functionality

**How Pausing Works**:
1. **Graceful Shutdown**: Press `Ctrl+C` once to trigger graceful shutdown
2. **Batch Completion**: The crawler finishes the current batch of requests before stopping
3. **Progress Saved**: All processed collections are saved to `crawllog_collection` with their source URLs
4. **Safe Exit**: Database connections are properly closed

**How Resuming Works**:
1. **URL Lookup**: When restarting, the crawler queries `crawllog_collection` for already-processed URLs
2. **Skip Logic**: URLs in the crawl log are skipped during traversal
3. **Continue from Interruption**: Only new/unprocessed collections are fetched
4. **Idempotent**: Running the crawler multiple times is safe - duplicates are handled via `ON CONFLICT` clauses

**Force Stop**: Press `Ctrl+C` twice for immediate termination (may leave incomplete transactions)

#### Auto-Recrawling

The scheduler (`scheduler.js`) provides automated periodic crawling:

1. **Interval-based**: Runs every `CRAWL_DAYS_INTERVAL` days (default: 7)
2. **Time Window Enforcement**: Optional restriction to specific hours (e.g., night-time only)
3. **Startup Behavior**: Configurable immediate run on startup (`CRAWL_RUN_ON_STARTUP`)
4. **Error Recovery**: Automatic retry on crawl errors with configurable delay
5. **Recrawl Strategy**: Full re-crawl of all catalogs/APIs - `ON CONFLICT` ensures updates rather than duplicates

**Scheduling Logic**:
```
Startup → DB Check → Time Window Check → Run Crawler → Success?
                                               ↓ Yes        ↓ No (crawl error)
                                         Schedule Next   Wait RETRY_DELAY → Retry
                                               ↓
                                         Wait Until Next → Run Crawler
```

### Data Validation

The crawler implements multi-layer validation to ensure data quality:

#### 1. STAC Specification Validation

**Library**: `stac-node-validator` (v2.0.0-rc.1)

**What it validates**:
- STAC JSON structure compliance with official STAC schemas
- Required fields presence (id, type, stac_version, etc.)
- Field types and formats
- STAC extension schemas (e.g., EO, SAT, Projection)
- Link relation requirements

**When it runs**: Before processing any catalog or collection

**Error handling**: 
- Non-compliant structures are logged with detailed error messages
- Collections with validation errors are skipped
- Statistics track compliant vs. non-compliant items



#### 2. STAC Migration Validation

**Library**: `stac-js` (v0.1.9)

**What it validates**:
- Converts raw JSON to typed STAC objects
- Validates object type (Collection, Catalog, Item)
- Validates link structure and relationships
- Extracts spatial/temporal extents using STAC-aware parsers
- Resolves relative URLs to absolute URLs

**When it runs**: After STAC spec validation passes

**Error handling**:
- Migration failures indicate malformed STAC structures
- Failed migrations are logged and skipped
- `stac-js` methods return null for invalid data (e.g., `getBoundingBox()`)



#### 3. Custom Data Normalization

**Module**: `utils/normalization.js`

**What it normalizes**:
- **Categories/Keywords**: Derives from multiple possible fields (categories, keywords, tags)
- **Temporal extents**: Handles null values, open-ended intervals
- **Bounding boxes**: Validates array structure, handles missing coordinates
- **URLs**: Extracts self links, resolves relative paths
- **Provider roles**: Normalizes role names (producer, processor, host, licensor)
- **Fallback strategy**: Uses multiple fallback levels to extract data


#### 4. URL and HTTP Validation

**Validation checks**:
- **URL format**: Ensures valid HTTP/HTTPS URLs before making requests
- **Response status**: Checks for 200 OK status codes
- **Content-Type**: Accepts JSON, GeoJSON, and some binary/text types
- **Timeout enforcement**: Requests timeout after configured duration
- **Retry logic**: Automatic retry with exponential backoff for failed requests

**Rate limiting**:
- Per-domain rate limits prevent overwhelming servers
- Configurable requests per minute per domain
- Crawler respects HTTP 429 (Too Many Requests) responses

#### Validation Statistics

The crawler tracks validation results:
- `stacCompliant` - Collections passing STAC validation
- `nonCompliant` - Collections failing STAC validation  
- `collectionsSaved` - Successfully saved to database
- `collectionsFailed` - Failed database insertion

**Example output**:
```
Validation Results:
  STAC Compliant:     450
  Non-compliant:      12
  Saved to DB:        448
  Failed to save:     2
```

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
CRAWL_DAYS_INTERVAL=7  # Run every week
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
