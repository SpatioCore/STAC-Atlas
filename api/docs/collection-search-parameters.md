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

### `provider` - Provider Filter

**Type:** String  
**Required:** No  
**Description:** Filter collections by data provider name (case-insensitive match).

**Constraints:**
- Maximum length: 255 characters
- Whitespace is trimmed

**Examples:**
```
GET /collections?provider=USGS
GET /collections?provider=Copernicus
GET /collections?provider=ESA
```

**Implementation Note:** Matches against provider names in the `collection_providers` join table.

---

### `license` - License Filter

**Type:** String  
**Required:** No  
**Description:** Filter collections by license identifier (exact match).

**Constraints:**
- Maximum length: 255 characters
- Whitespace is trimmed

**Examples:**
```
GET /collections?license=CC-BY-4.0
GET /collections?license=MIT
GET /collections?license=proprietary
```

**Implementation Note:** Matches directly against the `license` column in the collection table.

---

### `active` - Active Status Filter

**Type:** Boolean  
**Required:** No  
**Description:** Filter collections by their active status.

**Accepted Values:**
- `true`, `1`, `yes` - Only active collections
- `false`, `0`, `no` - Only inactive collections

**Examples:**
```
GET /collections?active=true
GET /collections?active=false
GET /collections?active=1
```

**Implementation Note:** Filters on the `is_active` boolean column in the collection table.

---

### `api` - API Status Filter

**Type:** Boolean  
**Required:** No  
**Description:** Filter collections by whether they originate from a STAC API or a static catalog.

**Accepted Values:**
- `true`, `1`, `yes` - Only collections from STAC APIs
- `false`, `0`, `no` - Only collections from static catalogs

**Examples:**
```
GET /collections?api=true
GET /collections?api=false
GET /collections?api=1
```

**Implementation Note:** Filters on the `is_api` boolean column in the collection table.

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
| `q` | Implemented | PostgreSQL full-text search with TSVector |
| `bbox` | Implemented | PostGIS spatial intersection query |
| `datetime` | Implemented | Temporal overlap query |
| `limit` | Implemented | Pagination limit |
| `sortby` | Implemented | Multi-field sorting support |
| `token` | Implemented | Offset-based pagination |
| `provider` | Implemented | Case-insensitive provider name filter |
| `license` | Implemented | Exact match license filter |
| `active` | Implemented | Boolean filter for is_active status |
| `api` | Implemented | Boolean filter for is_api status |

---

## CQL2 Filtering

In addition to the standard query parameters, the API supports CQL2 filter expressions for advanced filtering. See the [CQL2 Filtering documentation](../README.md#cql2-filtering) for details.

**Example:**
```
GET /collections?filter=license = 'CC-BY-4.0' AND active = true
GET /collections?filter=api = true AND title LIKE '%Sentinel%'
```

---

## See Also

- [STAC API Specification](https://github.com/radiantearth/stac-api-spec)
- [Collection Search Extension](https://github.com/stac-api-extensions/collection-search)
- [OGC API - Features](https://docs.ogc.org/is/17-069r4/17-069r4.html)
