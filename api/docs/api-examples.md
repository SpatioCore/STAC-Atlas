
# STAC Atlas API – Example Requests & Search Patterns

This file shows how to test the main endpoints of the STAC Atlas API using curl. It contains practical examples for search queries, filters, paging, and error cases. All examples assume your server is running locally at http://localhost:3000.

---

## curl Examples for All Endpoints

### Landing Page (API Root)
Shows basic information and links to further endpoints.

### Landing Page
```bash
curl -X GET "http://localhost:3000/" -H "accept: application/json"
```

### Conformance
Lists the supported OGC/STAC conformance classes.
```bash
curl -X GET "http://localhost:3000/conformance" -H "accept: application/json"
```

### Collections (with parameters)
Returns a list of collections. You can filter the search with parameters.
```bash
curl -X GET "http://localhost:3000/collections?limit=5&q=landsat" -H "accept: application/json"
```

### Single Collection
Returns the metadata of a specific collection (e.g., "vegetation").
```bash
curl -X GET "http://localhost:3000/collections/vegetation" -H "accept: application/json"
```

### Queryables
Shows which fields can be used for filtering and sorting.
```bash
curl -X GET "http://localhost:3000/queryables" -H "accept: application/schema+json"
```

---

## CQL2 Filter Examples

CQL2 is a powerful language for complex filters. The API supports both CQL2-Text and CQL2-JSON.

### CQL2-Text
CQL2-Text is human-readable and suitable for simple to medium filters.
- License filter:
  ```bash
  curl "http://localhost:3000/collections?filter=license%20%3D%20'MIT'"
  ```
- Title exactly "Sentinel-2 L2A":
  ```bash
  curl "http://localhost:3000/collections?filter=title%20%3D%20'Sentinel-2%20L2A'"
  ```
- Title is one of several:
  ```bash
  curl "http://localhost:3000/collections?filter=title%20IN%20('Sentinel-2%20L2A','CHELSA%20Climatologies')"
  ```
- Combined filters:
  ```bash
  curl "http://localhost:3000/collections?filter=license%20%3D%20'MIT'%20AND%20id%20%3E%2010"
  ```
  
- Multiple licenses (OR):
  ```bash
  curl "http://localhost:3000/collections?filter=license%20%3D%20'CC-BY-4.0'%20OR%20license%20%3D%20'MIT'"
  ```

### CQL2-JSON
CQL2-JSON is machine-readable and especially suitable for complex, nested filters and geo-objects.
- Bounding Box (S_INTERSECTS):
  ```bash
  curl "http://localhost:3000/collections?filter-lang=cql2-json&filter=%7B%22op%22%3A%22s_intersects%22%2C%22args%22%3A%5B%7B%22property%22%3A%22spatial_extend%22%7D%2C%7B%22type%22%3A%22Polygon%22%2C%22coordinates%22%3A%5B%5B%5B7%2C51%5D%2C%5B8%2C51%5D%2C%5B8%2C52%5D%2C%5B7%2C52%5D%2C%5B7%2C51%5D%5D%5D%7D%5D%7D"
  ```
- Time interval (T_INTERSECTS):
  ```bash
  curl "http://localhost:3000/collections?filter-lang=cql2-json&filter=%7B%22op%22%3A%22t_intersects%22%2C%22args%22%3A%5B%7B%22property%22%3A%22datetime%22%7D%2C%7B%22interval%22%3A%5B%222020-01-01%22%2C%222025-12-31%22%5D%7D%5D%7D"
  ```

---

## Common Search Patterns

Here you will find typical use cases for search, pagination, and sorting.

### Paging (Page-wise Results)
Retrieve large result lists page by page. The links in the response help you to navigate.
```bash
curl "http://localhost:3000/collections?limit=10&token=0"
curl "http://localhost:3000/collections?limit=10&token=10"
```

### Sorting
Sort by different fields, e.g., by creation date or title.
```bash
curl "http://localhost:3000/collections?sortby=-created"
curl "http://localhost:3000/collections?sortby=title"
```

---

## Advanced Examples

- CQL2-JSON: Combined spatial and temporal filter
  ```bash
  curl "http://localhost:3000/collections?filter-lang=cql2-json&filter=%7B%22op%22%3A%22and%22%2C%22args%22%3A%5B%7B%22op%22%3A%22s_intersects%22%2C%22args%22%3A%5B%7B%22property%22%3A%22spatial_extend%22%7D%2C%7B%22type%22%3A%22Polygon%22%2C%22coordinates%22%3A%5B%5B%5B7%2C51%5D%2C%5B8%2C51%5D%2C%5B8%2C52%5D%2C%5B7%2C52%5D%2C%5B7%2C51%5D%5D%5D%7D%5D%7D%2C%7B%22op%22%3A%22t_intersects%22%2C%22args%22%3A%5B%7B%22property%22%3A%22datetime%22%7D%2C%7B%22interval%22%3A%5B%222020-01-01%22%2C%222025-12-31%22%5D%7D%5D%7D%5D%7D"
  ```

- Free text search with special characters (Münster):
  ```bash
  curl "http://localhost:3000/collections?q=M%C3%BCnster"
  ```

- Show only certain fields:
  ```bash
  curl -s "http://localhost:3000/collections?limit=1"
  ```

---

## Check Queryables Details

The Queryables endpoint shows which fields you can use for filtering and sorting:
```bash
curl -X GET "http://localhost:3000/queryables" -H "accept: application/schema+json"
```
_Response: JSON schema with all queryable properties._

---

## Headers & Formats

- The API responds by default with `application/json`.
- For Queryables: `application/schema+json`.
- CORS is enabled, so you can also test from the browser.

---

### Example of a successful collection search
```bash
curl "http://localhost:3000/collections?limit=1&q=sentinel"
```
_Response:_
```json
{
  "collections": [
    {
      "id": "sentinel-2-l2a",
      "title": "Sentinel-2 L2A",
      "description": "Multispectral satellite data...",
      "license": "CC-BY-4.0",
      "keywords": ["satellite", "sentinel", "multispectral"],
      "extent": {
        "spatial": { "bbox": [[-180, -90, 180, 90]] },
        "temporal": { "interval": [["2015-06-23T00:00:00Z", null]] }
      }
      // ... more fields ...
    }
  ],
  "links": [ /* ... */ ]
}
```
