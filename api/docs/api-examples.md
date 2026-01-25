# Disclaimer on Special Characters

When using filter parameters or search queries, special characters (such as spaces, umlauts, or symbols) must be properly URL-encoded. 
Most browsers and tools like curl handle this automatically. 
However, if you write URLs by hand, make sure to encode special characters:
- Space → `%20` (e.g., `Sentinel-2 L2A` → `Sentinel-2%20L2A`)
- Umlaut (ü) → `%C3%BC` (e.g., `Münster` → `M%C3%BCnster`)

For a complete list of URL-encoded special characters, see:
https://www.w3schools.com/tags/ref_urlencode.asp

All examples in this documentation use clear, human-readable text for better readability. 
When copying URLs into a browser or terminal, ensure special characters are encoded as needed.

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

### Limit the number of results
Returns only the specified number of collections (e.g., 1 result):

"http://localhost:3000/collections?limit=1"

### Collections (with parameters)
Returns a list of collections. You can filter the search with parameters.

"http://localhost:3000/collections?limit=5&q=landsat"

### Single Collection
To retrieve the metadata of a specific collection, use the endpoint `/collections/{id}` where `{id}` is the STAC ID string of the desired collection. Replace `{id}` with the actual collection identifier (e.g., `vegetation`).

For example:
"http://localhost:3000/collections/vegetation"

### Queryables
Lists all available fields (properties) that can be used for filtering and sorting in collection searches. 
The response includes each field’s name, data type, and—where applicable—possible values or value ranges. 
Use this endpoint to discover which attributes you can use in your queries and how to reference them in filter expressions.

"http://localhost:3000/collections-queryables"

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
Retrieve large result lists page by page. 
The `token` parameter in this API is a simple offset: it tells the server how many collections to skip before starting to return results.
For example, `token=0` means start at the beginning, `token=10` means skip the first 10 collections and return the next ones. 
It is not a page number, and it is not related to a specific collection ID. 
Always use the value provided by the API for consistent paging, especially if the API ever changes its paging logic.

For example:

"http://localhost:3000/collections?limit=10&token=0"

"http://localhost:3000/collections?limit=10&token=10"

---

## CQL2 Filter Examples

CQL2 is a powerful language for complex filters. 
The API supports both CQL2-Text and CQL2-JSON.

To use CQL2 filtering, provide your filter expression in the `filter` parameter. 
The `filter-lang` parameter specifies the format: use `cql2-text` for human-readable filters (default), or `cql2-json` for machine-readable JSON filters.

For a complete list of all supported CQL2 operators and filter options in this API, see:
- [CQL2 Filtering Documentation](cql2-filtering.md)

### CQL2-Text
CQL2-Text is a human-readable format for filter expressions.

- License filter:
  
  "http://localhost:3000/collections?filter=license='MIT'"

- Title exactly "Sentinel-2 L2A":

  "http://localhost:3000/collections?filter=title='Sentinel-2 L2A'"

- Title is one of several:

  "http://localhost:3000/collections?filter=title IN ('Sentinel-2 L2A','CHELSA Climatologies')"

- Combined filters:

  "http://localhost:3000/collections?filter=license='MIT' AND id>10"

- Multiple licenses (OR):

  "http://localhost:3000/collections?filter=license='CC-BY-4.0' OR license='MIT'"



### CQL2-JSON
CQL2-JSON is machine-readable and especially suitable for complex, nested filters and geo-objects.

**Note:** All filters shown here can also be expressed using CQL2-Text. 
However, for complex or deeply nested filters (especially with geo-objects), CQL2-JSON is often easier to write and more commonly used.

- Bounding Box (S_INTERSECTS):

  "http://localhost:3000/collections?filter-lang=cql2-json&filter={"op":"s_intersects","args":[{"property":"spatial_extend"},{"type":"Polygon","coordinates":[[[7,51],[8,51],[8,52],[7,52],[7,51]]]}]}"

- Time interval (T_INTERSECTS):

  "http://localhost:3000/collections?filter-lang=cql2-json&filter={"op":"t_intersects","args":[{"property":"datetime"},{"interval":["2020-01-01","2025-12-31"]}]}"

- Combined spatial and temporal filter:

  "http://localhost:3000/collections?filter-lang=cql2-json&filter={"op":"and","args":[{"op":"s_intersects","args":[{"property":"spatial_extend"},{"type":"Polygon","coordinates":[[[7,51],[8,51],[8,52],[7,52],[7,51]]]}]},{"op":"t_intersects","args":[{"property":"datetime"},{"interval":["2020-01-01","2025-12-31"]}]}]}"

## Example of a successful collection search

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
