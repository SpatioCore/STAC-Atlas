# STAC Crawler

A Node.js crawler for STAC Index API that fetches and processes catalog and collection data.

## Running Locally

```bash
npm install
npm start
```

## Docker

### Build and run with Docker

```bash
# Build the image
docker build -t stac-crawler

# Run the container
docker run --rm stac-crawler
```

Or use npm scripts:

```bash
npm run docker:build
npm run docker:run
```

### Using Docker Compose

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
