# Collection Search Parameters

This document describes the query parameters supported by the STAC Atlas Collection Search API (`GET /collections`).

## Overview

The Collection Search endpoint supports filtering and pagination through query parameters. All parameters are optional and can be combined to refine search results.

## Supported Parameters

### `q` - Free-Text Search

**Type:** String  
**Required:** No  
**Description:** Free-text search across collection `title`, `description`, and `keywords` fields.

**Constraints:**
- Maximum length: 500 characters
- Whitespace is trimmed

**Examples:**
```
GET /collections?q=sentinel
GET /collections?q=landsat%20Münster
```

**Implementation Note:** When database is connected, this will use PostgreSQL full-text search (TSVector) for efficient matching.

---

### `bbox` - Bounding Box Filter

**Type:** String (comma-separated) or Array  
**Required:** No  
**Format:** `minX,minY,maxX,maxY` or `[west, south, east, north]`

**Description:** Spatial filter to find collections whose spatial extent intersects with the specified bounding box.

**Constraints:**
- Must contain exactly 4 coordinates
- Longitude (X): -180 to 180
- Latitude (Y): -90 to 90
- minX < maxX
- minY < maxY

**Examples:**
```
GET /collections?bbox=-10,40,10,50
GET /collections?bbox=-122.4,37.8,-122.3,37.9
```

**Implementation Note:** Will use PostGIS spatial intersection queries (`ST_Intersects`) when database is connected.

---

### `datetime` - Temporal Filter

**Type:** String (ISO8601)  
**Required:** No  
**Description:** Temporal filter to find collections whose temporal extent overlaps with the specified time range.

**Formats Supported:**
1. **Single datetime:** `2020-01-01T00:00:00Z`
2. **Closed interval:** `2019-01-01/2021-12-31`
3. **Open start:** `../2021-12-31` (all collections ending before date)
4. **Open end:** `2019-01-01/..` (all collections starting after date)

**Constraints:**
- Must be valid ISO8601 format
- Intervals must have exactly one `/` separator
- Cannot be unbounded on both sides (`../..` is invalid)

**Examples:**
```
GET /collections?datetime=2020-01-01T00:00:00Z
GET /collections?datetime=2019-01-01/2021-12-31
GET /collections?datetime=../2021-12-31
GET /collections?datetime=2020-06-01/..
```

**Implementation Note:** Will query `temporal_extent_start` and `temporal_extent_end` columns with overlap logic.

---

### `limit` - Result Limit

**Type:** Integer  
**Required:** No  
**Default:** 10  
**Description:** Maximum number of collections to return in a single response.

**Constraints:**
- Minimum: 1
- Maximum: 10000
- Default: 10

**Examples:**
```
GET /collections?limit=50
GET /collections?limit=100
```

**Pagination Note:** Use together with `token` parameter to paginate through large result sets.

---

### `sortby` - Sort Order

**Type:** String  
**Required:** No  
**Format:** `[+|-]field`  
**Description:** Specifies the field and direction for sorting results.

**Direction Syntax:**
- `+field` or `field` = Ascending order (A-Z, 0-9)
- `-field` = Descending order (Z-A, 9-0)

**Allowed Fields:**
- `title` - Collection title (alphabetical)
- `id` - Collection identifier
- `license` - License identifier
- `created` - Creation timestamp
- `updated` - Last update timestamp

**Examples:**
```
GET /collections?sortby=title         # Ascending by title (default)
GET /collections?sortby=+title        # Explicit ascending
GET /collections?sortby=-created      # Newest first
GET /collections?sortby=-updated      # Most recently updated first
```

**Default Behavior:** When no `sortby` is specified, results are returned in database order (typically by ID).

---

### `token` - Pagination Token

**Type:** Integer  
**Required:** No  
**Default:** 0  
**Description:** Pagination continuation token (offset) to retrieve the next page of results.

**Constraints:**
- Must be non-negative integer
- Value represents the offset into the result set

**Examples:**
```
GET /collections?limit=10&token=0     # First page (results 0-9)
GET /collections?limit=10&token=10    # Second page (results 10-19)
GET /collections?limit=50&token=100   # Results 100-149
```

**Pagination Workflow:**
1. Initial request: `GET /collections?limit=10`
2. Response includes `links` with `rel: "next"` containing next token
3. Follow next link: `GET /collections?limit=10&token=10`
4. Repeat until no `next` link is present

**Response Links:**
```json
{
  "collections": [...],
  "links": [
    { "rel": "self", "href": "/collections?limit=10&token=0" },
    { "rel": "next", "href": "/collections?limit=10&token=10" },
    { "rel": "prev", "href": "/collections?limit=10&token=0" }
  ],
  "context": {
    "returned": 10,
    "limit": 10,
    "matched": 156
  }
}
```

---

## Combining Parameters

Multiple parameters can be combined to create complex queries:

```
GET /collections?q=sentinel&bbox=-10,40,10,50&datetime=2020-01-01/2021-12-31&limit=20&sortby=-created
```

This query searches for:
- Collections matching "sentinel"
- Within the specified bounding box
- With temporal extent overlapping 2020-2021
- Returns 20 results
- Sorted by creation date (newest first)

---

## Error Responses

All validation errors return HTTP **400 Bad Request** with the following format:

```json
{
  "code": "InvalidParameterValue",
  "description": "Parameter \"bbox\" minX must be less than maxX"
}
```

Multiple errors are concatenated:

```json
{
  "code": "InvalidParameterValue",
  "description": "Parameter \"limit\" must be at least 1; Parameter \"bbox\" contains invalid numeric values"
}
```

---

## Conformance Classes

This API implements the following STAC Collection Search conformance classes:

- **Simple Query** (`http://www.opengis.net/spec/ogcapi-common-2/1.0/conf/simple-query`)
  - Parameters: `bbox`, `datetime`, `limit`

- **Free-Text Search** (`https://api.stacspec.org/v1.0.0-rc.1/collection-search#free-text`)
  - Parameter: `q`

- **Sorting** (`https://api.stacspec.org/v1.1.0/collection-search#sort`)
  - Parameter: `sortby`

---

## Implementation Status

| Parameter | Status | Notes |
|-----------|--------|-------|
| `q` | Validated | TODO: Implement full-text search in DB |
| `bbox` | Validated | TODO: Implement PostGIS spatial query |
| `datetime` | Validated | TODO: Implement temporal overlap query |
| `limit` | Implemented | Working with in-memory store |
| `sortby` | Validated | TODO: Apply sorting in DB query |
| `token` | Implemented | Working with in-memory store |

---

## Future Extensions

The following parameters are defined in `bid.md` but not yet implemented:

- `provider` - Filter by data provider name
- `license` - Filter by license identifier

These will be added in a future release as extended search parameters beyond the standard conformance classes. Or the bid will be changed with a change-request.

---

## See Also

- [STAC API Specification](https://github.com/radiantearth/stac-api-spec)
- [Collection Search Extension](https://github.com/stac-api-extensions/collection-search)
- [OGC API - Features](https://docs.ogc.org/is/17-069r4/17-069r4.html)
