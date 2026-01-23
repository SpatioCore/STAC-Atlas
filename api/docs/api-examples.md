
# STAC Atlas API – Beispielanfragen & Suchmuster

Diese Datei zeigt, wie du die wichtigsten Endpunkte der STAC Atlas API mit curl testen kannst. Sie enthält praktische Beispiele für Suchanfragen, Filter, Paging und Fehlerfälle. Alle Beispiele gehen davon aus, dass dein Server lokal unter http://localhost:3000 läuft.

---

## curl-Beispiele für alle Endpunkte

### Landing Page (API-Root)
Zeigt Basisinformationen und Links zu weiteren Endpunkten.

### Landing Page
```bash
curl -X GET "http://localhost:3000/" -H "accept: application/json"
```

### Conformance
Listet die unterstützten OGC/STAC-Konformitätsklassen auf.
```bash
curl -X GET "http://localhost:3000/conformance" -H "accept: application/json"
```

### Collections (mit Parametern)
Gibt eine Liste von Collections zurück. Mit Parametern kannst du die Suche filtern.
```bash
curl -X GET "http://localhost:3000/collections?limit=5&q=landsat" -H "accept: application/json"
```

### Einzelne Collection
Gibt die Metadaten einer bestimmten Collection (z.B. "vegetation") zurück.
```bash
curl -X GET "http://localhost:3000/collections/vegetation" -H "accept: application/json"
```

### Queryables
Zeigt, welche Felder für Filter und Sortierung verwendet werden können.
```bash
curl -X GET "http://localhost:3000/queryables" -H "accept: application/schema+json"
```

---

## CQL2-Filter-Beispiele

CQL2 ist eine mächtige Sprache für komplexe Filter. Die API unterstützt sowohl CQL2-Text als auch CQL2-JSON.

### CQL2-Text
CQL2-Text ist menschenlesbar und eignet sich für einfache bis mittlere Filter.
- Lizenzfilter:
  ```bash
  curl "http://localhost:3000/collections?filter=license%20%3D%20'MIT'"
  ```
- Titel exakt "Sentinel-2 L2A":
  ```bash
  curl "http://localhost:3000/collections?filter=title%20%3D%20'Sentinel-2%20L2A'"
  ```
- Titel ist einer von mehreren:
  ```bash
  curl "http://localhost:3000/collections?filter=title%20IN%20('Sentinel-2%20L2A','CHELSA%20Climatologies')"
  ```
- Kombinierte Filter:
  ```bash
  curl "http://localhost:3000/collections?filter=license%20%3D%20'MIT'%20AND%20id%20%3E%2010"
  ```
  
- Mehrere Lizenzen (OR):
  ```bash
  curl "http://localhost:3000/collections?filter=license%20%3D%20'CC-BY-4.0'%20OR%20license%20%3D%20'MIT'"
  ```

### CQL2-JSON
CQL2-JSON ist maschinenlesbar und besonders für komplexe, verschachtelte Filter und Geo-Objekte geeignet.
- Bounding Box (S_INTERSECTS):
  ```bash
  curl "http://localhost:3000/collections?filter-lang=cql2-json&filter=%7B%22op%22%3A%22s_intersects%22%2C%22args%22%3A%5B%7B%22property%22%3A%22spatial_extend%22%7D%2C%7B%22type%22%3A%22Polygon%22%2C%22coordinates%22%3A%5B%5B%5B7%2C51%5D%2C%5B8%2C51%5D%2C%5B8%2C52%5D%2C%5B7%2C52%5D%2C%5B7%2C51%5D%5D%5D%7D%5D%7D"
  ```
- Zeitintervall (T_INTERSECTS):
  ```bash
  curl "http://localhost:3000/collections?filter-lang=cql2-json&filter=%7B%22op%22%3A%22t_intersects%22%2C%22args%22%3A%5B%7B%22property%22%3A%22datetime%22%7D%2C%7B%22interval%22%3A%5B%222020-01-01%22%2C%222025-12-31%22%5D%7D%5D%7D"
  ```

---

## Häufige Suchmuster

Hier findest du typische Anwendungsfälle für die Suche, Paginierung und Sortierung.

### Paging (Seitenweise Ergebnisse)
Hole dir große Ergebnislisten seitenweise ab. Die Links im Response helfen beim Blättern.
```bash
curl "http://localhost:3000/collections?limit=10&token=0"
curl "http://localhost:3000/collections?limit=10&token=10"
```

### Sortierung
Sortiere nach verschiedenen Feldern, z.B. nach Erstellungsdatum oder Titel.
```bash
curl "http://localhost:3000/collections?sortby=-created"
curl "http://localhost:3000/collections?sortby=title"
```

---

## Fehlerfälle

- Ungültige Collection-ID:
  ```bash
  curl -X GET "http://localhost:3000/collections/doesnotexist" -H "accept: application/json"
  ```
  _Response: 404 Not Found with error object._

- Ungültiger Parameter:
  ```bash
  curl "http://localhost:3000/collections?limit=abc"
  ```
  _Response: 400 Bad Request with error description._

- Falsches Filterformat:
  ```bash
  curl "http://localhost:3000/collections?filter=license%20LIKE%20MIT"
  ```
  _Response: 400 Bad Request (unsupported CQL2 operator)._ 

---

## Erweiterte Beispiele

- CQL2-JSON: Kombinierter räumlicher und zeitlicher Filter
  ```bash
  curl "http://localhost:3000/collections?filter-lang=cql2-json&filter=%7B%22op%22%3A%22and%22%2C%22args%22%3A%5B%7B%22op%22%3A%22s_intersects%22%2C%22args%22%3A%5B%7B%22property%22%3A%22spatial_extend%22%7D%2C%7B%22type%22%3A%22Polygon%22%2C%22coordinates%22%3A%5B%5B%5B7%2C51%5D%2C%5B8%2C51%5D%2C%5B8%2C52%5D%2C%5B7%2C52%5D%2C%5B7%2C51%5D%5D%5D%7D%5D%7D%2C%7B%22op%22%3A%22t_intersects%22%2C%22args%22%3A%5B%7B%22property%22%3A%22datetime%22%7D%2C%7B%22interval%22%3A%5B%222020-01-01%22%2C%222025-12-31%22%5D%7D%5D%7D%5D%7D"
  ```

- Freitextsuche mit Umlauten/Sonderzeichen (Münster):
  ```bash
  curl "http://localhost:3000/collections?q=M%C3%BCnster"
  ```

- Nur bestimmte Felder anzeigen:
  ```bash
  curl -s "http://localhost:3000/collections?limit=1"
  ```

---

## Queryables-Details prüfen

Der Queryables-Endpunkt zeigt, welche Felder du für Filter und Sortierung nutzen kannst:
```bash
curl -X GET "http://localhost:3000/queryables" -H "accept: application/schema+json"
```
_Response: JSON schema with all queryable properties._

---

## Header & Formate

- Die API antwortet standardmäßig mit `application/json`.
- Für Queryables: `application/schema+json`.
- CORS ist aktiviert, sodass du auch aus dem Browser testen kannst.

---

### Beispiel für eine erfolgreiche Collection-Suche
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
      // ... weitere Felder ...
    }
  ],
  "links": [ /* ... */ ]
}
```

### Fehlerfall: Nicht unterstützte Filter-Syntax
```bash
curl "http://localhost:3000/collections?filter=title%20LIKE%20'%25landsat%25'"
```
_Response: 400 Bad Request (unsupported CQL2 operator: LIKE)_