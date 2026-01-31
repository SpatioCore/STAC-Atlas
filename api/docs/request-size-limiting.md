# Request Size Limiting

This document describes the request size limiting middleware that protects the STAC Atlas API from excessively large requests.

## Overview

The `requestSizeLimitMiddleware` enforces limits on:
- **URL length** (including query parameters)
- **HTTP header size** (total size of all headers)
- **Request body size** (for future POST/PUT support)

## Configuration

Limits are configured via environment variables in `.env`:

```env
# Request Size Limits
MAX_URL_LENGTH=1MB      # Maximum URL length (default: 1MB)
MAX_HEADER_SIZE=100KB   # Maximum total header size (default: 100KB)
MAX_BODY_SIZE=10MB      # Maximum request body size (default: 10MB)
```

### Size Format

Sizes can be specified in multiple formats:
- `1024` - bytes
- `100KB` - kilobytes
- `1MB` - megabytes
- `10MB` - megabytes

## Default Limits

| Limit | Default Value | Rationale |
|-------|--------------|-----------|
| URL Length | 1MB | Allows very complex CQL2 filter expressions while protecting against abuse |
| Header Size | 100KB | Sufficient for authentication tokens, custom headers, and metadata |
| Body Size | 10MB | For future POST/PUT operations (e.g., bulk updates) |

## Why These Limits?

### URL Length: 1MB
- **CQL2 Filters**: Complex filter expressions can be quite large when expressed in CQL2-JSON format
- **Multiple Parameters**: Users may combine many parameters (bbox, datetime, q, filter, etc.)
- **Safe Buffer**: 1MB is generous for legitimate use while preventing resource exhaustion

### Header Size: 100KB
- **Authentication**: JWT tokens, API keys, session cookies
- **Custom Headers**: X-Request-ID, X-Forwarded-For, User-Agent, etc.
- **Tracing**: Distributed tracing headers can be verbose

### Body Size: 10MB
- **Future-proofing**: Although current API only uses GET, we may add POST/PUT endpoints
- **Bulk Operations**: Potential future support for batch operations

## Error Response

When a request exceeds the configured limits, the API returns a **413 Payload Too Large** error in RFC 7807 format:

```json
{
  "type": "about:blank",
  "title": "Invalid Parameter",
  "status": 413,
  "code": "InvalidParameter",
  "description": "Request URL too long: 1.2 MB exceeds maximum of 1.0 MB. Consider using shorter query parameters or splitting the request.",
  "instance": "/collections?filter=...",
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2026-01-31T12:34:56.789Z"
}
```

## Usage Examples

### Valid Request with Large CQL2 Filter

```http
GET /collections?filter-lang=cql2-json&filter={"op":"and","args":[...]} HTTP/1.1
Host: api.stacatlas.org
```

This request will succeed if the total URL length is under 1MB.

### Oversized Request

```http
GET /collections?data=xxxx...xxxx (>1MB) HTTP/1.1
Host: api.stacatlas.org
```

Response:
```http
HTTP/1.1 413 Payload Too Large
Content-Type: application/json

{
  "type": "about:blank",
  "title": "Invalid Parameter",
  "status": 413,
  "code": "InvalidParameter",
  "description": "Request URL too long: 1.1 MB exceeds maximum of 1.0 MB..."
}
```

## Implementation Details

### Middleware Order

The middleware is applied early in the request pipeline, after request ID generation but before body parsing:

```javascript
app.use(requestIdMiddleware);        // 1. Generate request ID
app.use(httpLogger);                 // 2. Log request
app.use(rateLimitMiddleware);        // 3. Rate limiting
app.use(requestSizeLimitMiddleware); // 4. Size limiting ← HERE
app.use(express.json());             // 5. Parse body
```

### Size Calculation

- **URL**: `Buffer.byteLength(req.originalUrl, 'utf8')`
- **Headers**: Sum of all header names and values plus separators (`: ` and `\r\n`)
- **Body**: Handled by `express.json({ limit: MAX_BODY_SIZE })`

### Performance

The middleware is extremely lightweight:
- URL size check: O(1) - just byte length
- Header size check: O(n) where n = number of headers (typically < 20)
- No body reading: Delegate to express middleware

## Customization

### Adjusting Limits for Specific Deployments

For high-volume APIs with simple queries:
```env
MAX_URL_LENGTH=100KB  # Reduced for simple queries
MAX_HEADER_SIZE=50KB  # Reduced
```

For APIs with very complex CQL2 filters:
```env
MAX_URL_LENGTH=5MB    # Increased for complex filters
MAX_HEADER_SIZE=200KB # Increased for extensive tracing
```

### Disabling Limits (Not Recommended)

To effectively disable limits (use with caution):
```env
MAX_URL_LENGTH=100MB
MAX_HEADER_SIZE=10MB
```

## Security Considerations

1. **DoS Protection**: Limits prevent attackers from exhausting server resources with huge requests
2. **Memory Safety**: Prevents OOM errors from buffering massive URLs or headers
3. **Network Safety**: Reduces bandwidth waste from malicious or misconfigured clients
4. **Defense in Depth**: Works alongside rate limiting for comprehensive protection

## Monitoring

Monitor these metrics to adjust limits:
- Number of 413 errors
- Distribution of URL lengths
- Distribution of header sizes
- P95/P99 request sizes

If legitimate users frequently hit limits, consider increasing them.

## Related Documentation

- [Rate Limiting](./rate-limiting.md)
- [Error Handling](./error-handling.md)
- [CQL2 Filtering](./cql2-filtering.md)
