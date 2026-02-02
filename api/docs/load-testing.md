# Load Testing Documentation

This document describes how to perform load tests on the STAC Atlas API to evaluate its performance under different load conditions.

## Overview

Two load test configurations are provided:

1. **Simple Load Test** (`load-test-simple.yml`) - Tests basic API operations with simple query parameters
2. **Complex Load Test** (`load-test-complex.yml`) - Tests complex queries including CQL2 filters, spatial operations, and combined filters

## Prerequisites

### Install Artillery

Artillery is a modern load testing toolkit. Install it globally or as a dev dependency:

```bash
# Global installation
npm install -g artillery@latest

# Or as dev dependency in the project
npm install --save-dev artillery
```

### Disable Rate Limiting

**IMPORTANT:** The API has rate limiting enabled by default (1000 requests per 15 minutes per IP). This will cause load tests to fail with 429 errors.

To disable rate limiting for testing, set the environment variable:

```bash
# Windows PowerShell
$env:DISABLE_RATE_LIMIT="true"

# Linux/macOS
export DISABLE_RATE_LIMIT=true
```

Or add to your `.env` file:
```
DISABLE_RATE_LIMIT=true
```

**WARNING:** Never disable rate limiting in production! Only use this for local testing.

### Start the API Server

Before running load tests, ensure the API server is running with rate limiting disabled:

```bash
# Windows PowerShell
$env:DISABLE_RATE_LIMIT="true"; npm run dev

# Linux/macOS
DISABLE_RATE_LIMIT=true npm run dev
```

The server should be accessible at `http://localhost:3000`.

## Running Load Tests

### Simple Load Test

The simple load test focuses on basic API operations:
- Landing page and conformance endpoints
- Collection listings with basic filters
- Simple query parameters (`q`, `license`, `active`, `api`)
- Pagination and sorting
- Text-based searches

**Run the simple load test:**

```bash
artillery run load-test-simple.yml
```

**Test phases:**
1. Warm-up: 10s at 5 requests/sec
2. Ramp-up: 30s ramping from 10 to 50 requests/sec
3. Sustained load: 60s at 50 requests/sec
4. Peak load: 30s at 100 requests/sec
5. Cool-down: 10s at 5 requests/sec

**Total duration:** ~140 seconds

### Complex Load Test

The complex load test focuses on computationally intensive operations:
- Complex CQL2-Text filters with multiple conditions
- CQL2-JSON filters with nested logic
- Spatial filters (bounding boxes and polygon intersections)
- Temporal filters
- Combined filters (spatial + temporal + text search)
- Maximum complexity queries with all available parameters

**Run the complex load test:**

```bash
artillery run load-test-complex.yml
```

**Test phases:**
1. Warm-up: 10s at 3 requests/sec
2. Ramp-up: 30s ramping from 5 to 20 requests/sec
3. Sustained load: 60s at 20 requests/sec
4. Peak load: 30s at 30 requests/sec
5. Cool-down: 10s at 3 requests/sec

**Total duration:** ~140 seconds

**Note:** The complex test uses lower request rates because the queries are more resource-intensive.

## Understanding the Results

Artillery provides detailed performance metrics after each test:

### Key Metrics

**Response Time Metrics:**
- `http.response_time.min` - Fastest response time
- `http.response_time.max` - Slowest response time
- `http.response_time.median` - Median response time (50th percentile)
- `http.response_time.p95` - 95th percentile (95% of requests faster than this)
- `http.response_time.p99` - 99th percentile (99% of requests faster than this)

**Throughput Metrics:**
- `http.requests` - Total number of requests sent
- `http.responses` - Total number of responses received
- `http.request_rate` - Requests per second

**Status Codes:**
- `http.codes.200` - Successful responses
- `http.codes.4xx` - Client errors
- `http.codes.5xx` - Server errors

**Errors:**
- `errors.*` - Any errors that occurred during the test

### Performance Targets

**Simple Load Test - Recommended targets:**
- p95 response time: < 500ms
- p99 response time: < 1000ms
- Success rate: > 99%
- Peak throughput: 100+ requests/sec

**Complex Load Test - Recommended targets:**
- p95 response time: < 2000ms
- p99 response time: < 5000ms
- Success rate: > 95%
- Peak throughput: 30+ requests/sec

## Advanced Options

### Generate HTML Report

Create a detailed HTML report with visualizations:

```bash
# Simple test with report
artillery run load-test-simple.yml --output simple-report.json
artillery report simple-report.json

# Complex test with report
artillery run load-test-complex.yml --output complex-report.json
artillery report complex-report.json
```

This generates an `simple-report.json.html` file you can open in a browser.

### Custom Duration

Modify the test duration by editing the YAML configuration files. Adjust the `duration` and `arrivalRate` values in the `phases` section.

### Target Different Environments

To test against a different server (e.g., production):

```bash
# Override the target URL
artillery run load-test-simple.yml --target https://your-api-domain.com

# Or edit the target in the YAML file
```

### Parallel Testing

Run multiple Artillery instances for extreme load:

```bash
# Terminal 1
artillery run load-test-simple.yml

# Terminal 2
artillery run load-test-simple.yml

# Terminal 3
artillery run load-test-complex.yml
```

## Monitoring During Tests

### Monitor Server Resources

While running load tests, monitor your server's performance:

**On Linux/macOS:**
```bash
# CPU and memory usage
htop

# Or basic top
top

# Network connections
netstat -an | grep :3000 | wc -l
```

**On Windows:**
```powershell
# Task Manager or Resource Monitor
# Or use Performance Monitor (perfmon)
```

### Monitor API Logs

Check the API logs for errors or warnings during the test:

```bash
# In the API directory
npm run dev
```

Watch for:
- Database connection pool exhaustion
- Memory leaks
- Timeout errors
- Rate limiting (if enabled)


## Additional Resources

- [Artillery Documentation](https://www.artillery.io/docs)
- [PostgreSQL Performance Tips](https://wiki.postgresql.org/wiki/Performance_Optimization)
- [Node.js Performance Best Practices](https://nodejs.org/en/docs/guides/simple-profiling/)

## Support

For questions or issues related to load testing this API:
1. Check the API logs for error details
2. Review Artillery documentation
3. Consult the project's main README for general troubleshooting
