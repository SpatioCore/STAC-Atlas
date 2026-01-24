
# STAC Atlas API – Example Requests & Search Patterns

This file shows how to test the main endpoints of the STAC Atlas API using curl. It contains practical examples for search queries, filters, paging, and error cases. All examples assume your server is running locally at http://localhost:3000.

---

## Headers & Formats

- The API responds by default with `application/json`.
- For Queryables: `application/schema+json`.
- CORS is enabled, so you can also test from the browser.

---

## How to Use curl with This API

`curl` is a widely used command-line tool for making HTTP requests to web servers and APIs. It is available by default on most Unix-based systems (Linux, macOS) and can be installed on Windows. With `curl`, you can retrieve data, test endpoints, and inspect API responses directly from your terminal.

To interact with this API, open your terminal or command prompt and enter the following command, replacing `<URL>` with the desired endpoint from the list below:

```bash
curl "<URL>"
```

This will send a GET request to the specified endpoint and print the server's response (usually in JSON format) to your terminal. 
For example, to retrieve the landing page, use:

```bash
curl "http://localhost:3000/"
```

---

## API Endpoints

### Landing Page (API Root)
Shows basic information and links to further endpoints.

"http://localhost:3000/"

### Conformance
Lists the supported OGC/STAC conformance classes.

"http://localhost:3000/conformance"

### Collections
Returns a list of all collections.

"http://localhost:3000/collections"

### Collections (with parameters)
Returns a list of collections. You can filter the search with parameters.

"http://localhost:3000/collections?limit=5&q=landsat"

### Single Collection
To retrieve the metadata of a specific collection, use the endpoint `/collections/{id}` where `{id}` is the STAC ID string of the desired collection. Replace `{id}` with the actual collection identifier (e.g., `vegetation`).

For example:
"http://localhost:3000/collections/vegetation"

### Queryables
Shows which fields can be used for filtering and sorting.

"http://localhost:3000/queryables"

---

## Common Search Patterns

Here you will find typical use cases for sorting and pagination.

### Sorting
Sort by different fields, e.g., by creation date or title. 
Use a minus sign (`-`) before a field name to sort in descending order, or a plus sign (`+`) or no sign for ascending order. 
For example:

"http://localhost:3000/collections?sortby=-created"

"http://localhost:3000/collections?sortby=title"

### Paging (Page-wise Results)
Retrieve large result lists page by page. The links in the response help you to navigate.

"http://localhost:3000/collections?limit=10&token=0"

"http://localhost:3000/collections?limit=10&token=10"

---

## CQL2 Filter Examples

CQL2 is a powerful language for complex filters. The API supports both CQL2-Text and CQL2-JSON.

### CQL2-Text
CQL2-Text is human-readable and suitable for simple to medium filters.
- License filter:
  
  "http://localhost:3000/collections?filter=license%20%3D%20'MIT'"
  
- Title exactly "Sentinel-2 L2A":

  "http://localhost:3000/collections?filter=title%20%3D%20'Sentinel-2%20L2A'"

- Title is one of several:

  "http://localhost:3000/collections?filter=title%20IN%20('Sentinel-2%20L2A','CHELSA%20Climatologies')"

- Combined filters:

  "http://localhost:3000/collections?filter=license%20%3D%20'MIT'%20AND%20id%20%3E%2010"

- Multiple licenses (OR):

  "http://localhost:3000/collections?filter=license%20%3D%20'CC-BY-4.0'%20OR%20license%20%3D%20'MIT'"


### CQL2-JSON
CQL2-JSON is machine-readable and especially suitable for complex, nested filters and geo-objects.
- Bounding Box (S_INTERSECTS):

  "http://localhost:3000/collections?filter-lang=cql2-json&filter=%7B%22op%22%3A%22s_intersects%22%2C%22args%22%3A%5B%7B%22property%22%3A%22spatial_extend%22%7D%2C%7B%22type%22%3A%22Polygon%22%2C%22coordinates%22%3A%5B%5B%5B7%2C51%5D%2C%5B8%2C51%5D%2C%5B8%2C52%5D%2C%5B7%2C52%5D%2C%5B7%2C51%5D%5D%5D%7D%5D%7D"

- Time interval (T_INTERSECTS):

  "http://localhost:3000/collections?filter-lang=cql2-json&filter=%7B%22op%22%3A%22t_intersects%22%2C%22args%22%3A%5B%7B%22property%22%3A%22datetime%22%7D%2C%7B%22interval%22%3A%5B%222020-01-01%22%2C%222025-12-31%22%5D%7D%5D%7D"

## Advanced Examples

- CQL2-JSON: Combined spatial and temporal filter

  "http://localhost:3000/collections?filter-lang=cql2-json&filter=%7B%22op%22%3A%22and%22%2C%22args%22%3A%5B%7B%22op%22%3A%22s_intersects%22%2C%22args%22%3A%5B%7B%22property%22%3A%22spatial_extend%22%7D%2C%7B%22type%22%3A%22Polygon%22%2C%22coordinates%22%3A%5B%5B%5B7%2C51%5D%2C%5B8%2C51%5D%2C%5B8%2C52%5D%2C%5B7%2C52%5D%2C%5B7%2C51%5D%5D%5D%7D%5D%7D%2C%7B%22op%22%3A%22t_intersects%22%2C%22args%22%3A%5B%7B%22property%22%3A%22datetime%22%7D%2C%7B%22interval%22%3A%5B%222020-01-01%22%2C%222025-12-31%22%5D%7D%5D%7D%5D%7D"

- Free text search with special characters (Münster):

  "http://localhost:3000/collections?q=M%C3%BCnster"

- Show only certain fields:

  "http://localhost:3000/collections?limit=1"

---

## Check Queryables Details

The Queryables endpoint shows which fields you can use for filtering and sorting:

"http://localhost:3000/queryables"

---

### Example of a successful collection search

"http://localhost:3000/collections?limit=1&q=sentinel"

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
