# CQL2 Filtering

This document describes the Common Query Language 2 (CQL2) filtering capabilities supported by the STAC Atlas Collection Search API (`GET /collections`).

## Overview

CQL2 is an OGC standard for expressing filter expressions. The STAC Atlas API supports both CQL2-Text (human-readable) and CQL2-JSON (machine-readable) encodings for filtering collections based on their properties.

## Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `filter` | String | - | CQL2 filter expression |
| `filter-lang` | String | `cql2-text` | Filter language: `cql2-text` or `cql2-json` |

---

## CQL2-Text Syntax

CQL2-Text is a human-readable format for expressing filter conditions.

### Basic Syntax Rules

1. **String literals** must be enclosed in **single quotes**: `'value'`
2. **Property names** are written without quotes: `license`, `title`
3. **Operators** are case-insensitive: `AND`, `and`, `And` are equivalent
4. **Parentheses** can be used to group expressions

**Common Mistake:** Forgetting single quotes around string literals.

```
Correct:   license = 'MIT'
Wrong:     license = MIT        (MIT is interpreted as a property reference)
```

---

## Supported Operators

### Comparison Operators

| Operator | Description | Example |
|----------|-------------|---------|
| `=` | Equal to | `license = 'MIT'` |
| `<>` | Not equal to | `license <> 'proprietary'` |
| `<` | Less than | `id < 100` |
| `>` | Greater than | `id > 50` |
| `<=` | Less than or equal | `id <= 100` |
| `>=` | Greater than or equal | `id >= 1` |

**Examples:**
```
GET /collections?filter=license = 'MIT'
GET /collections?filter=id >= 10
GET /collections?filter=title = 'Sentinel-2 L2A'
```

---

### Logical Operators

| Operator | Description | Example |
|----------|-------------|---------|
| `AND` | Both conditions must be true | `license = 'MIT' AND id < 100` |
| `OR` | At least one condition must be true | `license = 'MIT' OR license = 'Apache-2.0'` |
| `NOT` | Negates a condition | `NOT license = 'proprietary'` |

**Examples:**
```
GET /collections?filter=license = 'CC-BY-4.0' AND title LIKE '%Sentinel%'
GET /collections?filter=id = 1 OR id = 2 OR id = 3
GET /collections?filter=NOT is_active = false
```

---

### Advanced Comparison Operators

| Operator | Description | Example |
|----------|-------------|---------|
| `BETWEEN` | Value is within range (inclusive) | `id BETWEEN 10 AND 50` |
| `IN` | Value is in a list | `license IN ('MIT', 'Apache-2.0', 'CC-BY-4.0')` |
| `IS NULL` | Value is null | `description IS NULL` |

**Examples:**
```
GET /collections?filter=id BETWEEN 1 AND 100
GET /collections?filter=license IN ('MIT', 'CC0-1.0', 'CC-BY-4.0')
GET /collections?filter=title IS NULL
```

---

### Spatial Operators

Spatial operators compare geometry properties against GeoJSON geometries. These use PostGIS functions internally.

| Operator | PostGIS Function | Description |
|----------|------------------|-------------|
| `S_INTERSECTS` | `ST_Intersects` | Geometries share any space |
| `S_WITHIN` | `ST_Within` | First geometry is completely within second |
| `S_CONTAINS` | `ST_Contains` | First geometry completely contains second |

**CQL2-JSON Examples:**

```json
// S_INTERSECTS: Find collections intersecting a bounding box
{
  "op": "s_intersects",
  "args": [
    { "property": "spatial_extent" },
    {
      "type": "Polygon",
      "coordinates": [[[7, 51], [8, 51], [8, 52], [7, 52], [7, 51]]]
    }
  ]
}
```

**HTTP Request:**
```bash
GET /collections?filter-lang=cql2-json&filter={"op":"s_intersects","args":[{"property":"spatial_extent"},{"type":"Polygon","coordinates":[[[7,51],[8,51],[8,52],[7,52],[7,51]]]}]}
```

**Note:** Spatial operators are primarily used with CQL2-JSON encoding due to the complexity of GeoJSON geometry literals.

---

### Temporal Operators

Temporal operators compare datetime properties against timestamps or intervals.

| Operator | Description |
|----------|-------------|
| `T_INTERSECTS` | Temporal extents overlap |
| `T_BEFORE` | Property value is before the given timestamp |
| `T_AFTER` | Property value is after the given timestamp |

**Interval Syntax:**

- Closed interval: `["2020-01-01", "2025-12-31"]`
- Open start: `["..", "2025-12-31"]` (all times up to end)
- Open end: `["2020-01-01", ".."]` (all times from start)

**CQL2-JSON Examples:**

```json
// T_INTERSECTS: Collections overlapping 2020-2025
{
  "op": "t_intersects",
  "args": [
    { "property": "datetime" },
    { "interval": ["2020-01-01", "2025-12-31"] }
  ]
}

// T_BEFORE: Collections created before 2024
{
  "op": "t_before",
  "args": [
    { "property": "created_at" },
    "2024-01-01T00:00:00Z"
  ]
}

// T_AFTER: Collections updated after 2023
{
  "op": "t_after",
  "args": [
    { "property": "updated_at" },
    "2023-01-01T00:00:00Z"
  ]
}
```

---

## Queryable Properties

The following properties can be used in CQL2 filter expressions:

### Core Collection Properties

| Property | Type | Description |
|----------|------|-------------|
| `id` | Integer | Collection database ID |
| `stac_version` | String | STAC specification version |
| `type` | String | Always "Collection" |
| `title` | String | Collection title |
| `description` | String | Collection description |
| `license` | String | License identifier (e.g., "MIT", "CC-BY-4.0") |
| `spatial_extent` | Geometry | Spatial bounding box (for spatial operators) |
| `temporal_extent_start` | Timestamp | Start of temporal extent |
| `temporal_extent_end` | Timestamp | End of temporal extent |
| `created_at` | Timestamp | Creation timestamp |
| `updated_at` | Timestamp | Last update timestamp |
| `is_api` | Boolean | Whether collection has an API |
| `is_active` | Boolean | Whether collection is active |

### Aggregated Properties

| Property | Type | Description |
|----------|------|-------------|
| `keywords` | Array | Collection keywords |
| `stac_extensions` | Array | STAC extensions used |
| `providers` | Array | Data providers |
| `assets` | Array | Collection assets |
| `summaries` | Object | Property summaries |

### Aliases

| Alias | Maps To |
|-------|---------|
| `datetime` | `temporal_extent_start` / `temporal_extent_end` |
| `temporal_extent` | `temporal_extent_start` / `temporal_extent_end` |
| `created` | `created_at` |
| `updated` | `updated_at` |
| `collection` | `id` |

### Custom Properties

Properties not in the above lists are queried from the `full_json` JSONB column if possible:

```
GET /collections?filter=custom_property = 'some_value'
```

This translates to: `c.full_json ->> 'custom_property' = 'some_value'`

---

## CQL2-JSON Format

CQL2-JSON is a structured JSON format for filter expressions.

### Structure

```json
{
  "op": "<operator>",
  "args": [<argument1>, <argument2>, ...]
}
```

### Property References

```json
{ "property": "license" }
```

### Literal Values

- Strings: `"MIT"`
- Numbers: `42`, `3.14`
- Booleans: `true`, `false`
- Null: `null`

### Examples

**Simple equality:**
```json
{
  "op": "=",
  "args": [{ "property": "license" }, "MIT"]
}
```

**Logical AND:**
```json
{
  "op": "and",
  "args": [
    { "op": "=", "args": [{ "property": "license" }, "CC-BY-4.0"] },
    { "op": "=", "args": [{ "property": "type" }, "Collection"] }
  ]
}
```

**IN operator:**
```json
{
  "op": "in",
  "args": [
    { "property": "license" },
    ["MIT", "Apache-2.0", "CC-BY-4.0"]
  ]
}
```

---

## Combining CQL2 with Other Parameters

CQL2 filters can be combined with standard query parameters:

```bash
# CQL2 filter + bbox + limit + sorting
GET /collections?filter=license = 'MIT'&bbox=-10,40,10,50&limit=20&sortby=-created
```

The filters are combined with AND logic internally.

---

## Error Handling

### Invalid CQL2 Syntax

```json
{
  "code": "InvalidParameterValue",
  "description": "Invalid CQL2 Text: Expected operator at position 15"
}
```

### Unsupported Operator

```json
{
  "code": "InvalidParameterValue", 
  "description": "CQL2 filter error: Unsupported CQL2 operator: like_regex"
}
```

---

## Implementation Details

### WASM Parser

The API uses [cql2-wasm](https://github.com/stac-utils/cql2-rs) (Rust compiled to WebAssembly) to parse CQL2 expressions:

1. CQL2-Text is parsed to CQL2-JSON using `parseText()`
2. CQL2-JSON is validated using `parseJson()`
3. The JSON AST is converted to PostgreSQL WHERE clauses using `cql2ToSql()`

### SQL Translation

CQL2 expressions are translated to parameterized PostgreSQL queries for security:

```javascript
// CQL2-JSON input
{ "op": "=", "args": [{ "property": "license" }, "MIT"] }

// SQL output
WHERE c.license = $1
// Values: ['MIT']
```

### PostGIS Integration

Spatial operators use PostGIS functions with ST_GeomFromGeoJSON for geometry parsing:

```sql
ST_Intersects(c.spatial_extent, ST_GeomFromGeoJSON($1))
```

---

## Conformance Classes

This implementation conforms to:

| Conformance Class | URI |
|-------------------|-----|
| Basic CQL2 | `http://www.opengis.net/spec/cql2/1.0/conf/basic-cql2` |
| Advanced Comparison | `http://www.opengis.net/spec/cql2/1.0/conf/advanced-comparison-operators` |
| CQL2-JSON | `http://www.opengis.net/spec/cql2/1.0/conf/cql2-json` |
| CQL2-Text | `http://www.opengis.net/spec/cql2/1.0/conf/cql2-text` |
| Basic Spatial Functions | `http://www.opengis.net/spec/cql2/1.0/conf/basic-spatial-functions` |
| Spatial Functions | `http://www.opengis.net/spec/cql2/1.0/conf/spatial-functions` |
| Temporal Functions | `http://www.opengis.net/spec/cql2/1.0/conf/temporal-functions` |

---

## See Also

- [OGC CQL2 Standard](https://docs.ogc.org/is/21-065r2/21-065r2.html)
- [STAC API Filter Extension](https://github.com/stac-api-extensions/filter)
- [cql2-rs (WASM Parser)](https://github.com/stac-utils/cql2-rs)
- [Collection Search Parameters](collection-search-parameters.md)
