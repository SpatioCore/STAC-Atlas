# Pflichtenheft STAC Atlas

## 1. Zielbestimmung (ALLE) <!-- Jakob -->
- Verwaltung von Metadaten von Geodaten
- DATENBANK: Die Datenbankkomponente dient der persistenten Speicherung und effizienten Abfrage von STAC-Collection-Metadaten, die vom Crawler gesammelt werden und über die STAC API verfügbar gemacht werden. Ziel ist es, eine leistungsfähige, erweiterbare und standardkonforme Datenhaltung zu entwickeln, die sowohl strukturierte Suchabfragen (CQL2) als auch Volltextsuche unterstützt.
- Zentrailisierte Plattform
- Automatisches Crawlen und Indexieren von STAC collections
  - von unterschiedlichen Quellen
- Soll ermöglichen:
  - Auffindbar machen von Collections
  - Suche und Filterung von Collection auf Basis von zeitlicher/räumlicher Ausdehnung oder Thema
  - Einen vergleich zwischen collections verschiedener Anbieter
  - Einen Zugriff auf die Metadaten der Collections ermöglichen

- API-Schnittstelle für Entwickler
- Nutzerfreundliche Web-UI
Das Projekt besteht aus vier Hauptkomponenten:

- Crawler – erfasst Daten aus STAC-Katalogen
- Datenbank – speichert Metadaten
- STAC API – ermöglicht standardisierten Zugriff
- UI – bietet visuelle Suche und Kartenansicht

## 2. Anwendungsbereiche und Zielgruppen (ALLE)

### 2.1 Zielgruppe <!-- Jakob -->
- Data scientists and researchers
- GIS professionals
- Application developers
- Data providers

**Userstorys noch hinzufügen**

## 3. Produkt-Umgebung (ALLE) <!-- Jonas -->
- STAC API konforme API-Schnittstelle
- Backend vermutlich Python übersetzung von CQL2 (https://pypi.org/project/pycql2/)
- Backend-Server der für das Backend inkl. Crawlen verantwortlich ist
- Backend:Python, Node.js, JavaScript
- Crawler in Python
- Frontend in VueJS v3
- Datenbankmanagementsystem: PostgreSQL
- Containerisierung: Docker
- Starten per Docker Einzeiler
- Entwicklungsumgebung: Node.js 20

## 4. Produktfunktionen (UNTERTEILT) <!-- Robin -->
| ID | Komponente | Funktion (Kurzbeschreibung) | Optional | Akzeptanzkriterium | Prio |
|---|---|---|---|---|---|
| PF-CR-01 | Crawler | Alle im STAC Index gelisteten statischen Kataloge und STAC-APIs nach Collections crawlen | – | Mind. 87 Quellen gecrawlt; Trefferquote ≥ 95 % | M |
| PF-CR-02 | Crawler | Collections in beliebiger Verschachtelungstiefe erfassen (nested catalogs) | – | Nachweis Crawl über ≥ N  Ebenen <!-- @Mammutor bitte anpassen -->; keine Duplikate | M |
| PF-CR-03 | Crawler | Metadaten extrahieren: id, title, description, spatial/temporal extent, keywords, provider, license, DOI, summaries(platform/constellation/gsd/processing:level) | – | ≥ 95 % Felder gefüllt bei Stichprobe n=50 | H |
| PF-CR-04 | Crawler | Quell-URL, Quell-Titel, „zuletzt gecrawlt“ speichern | – | Felder in DB vorhanden und befüllt | M |
| PF-CR-05 | Crawler | Alle stabilen STAC-Versionen unterstützen (alte Ressourcen werden automatisch auf 1.1 migriert) | – | Collections unterschiedl. Versionen werden gespeichert und ggf. migriert | M |
| PF-CR-06 | Crawler | Inkrementelle Updates und periodisches Re-Crawling | – | Änderungen können ohne vollständige Neuindexierung hinzugefügt werden | H |
| PF-CR-07 | Crawler | Vollständige STAC-Collection + extrahierte Suchfelder persistent ablegen | – | ≥ 95 % Felder identisch zwischen Quelle und Datenbank bei Stichprobe n=50 | H |
| PF-CR-08 | Crawler | Erweiterbares DB-Design für zusätzliche Felder vorschlagen (siehe 5. Produktdaten) | – | Schema-Entwurf dokumentiert & abgenommen | M |
| PF-CR-09 | Crawler | Rate-Limiting einhalten (Quellen nicht überlasten) | – | Keine 429-Antworten/Blockings in Testlauf über 12 h | M |
| PF-CR-10 | Crawler | Konfigurierbare Crawl-Zeitpläne/Frequenzen | ✔ | CRON/Intervall vom Anwender frei konfigurierbar | L |
| PF-CR-11 | Crawler | Fehlerbehandlung + Retry; problematische Quellen überspringen | ✔ | Backoff/Retry-Logik; Fehlerbericht vorhanden | M |
| PF-CR-12 | Crawler | Logging & Monitoring der Crawl-Aktivitäten | ✔ | Dashboards/Metriken (Rate, Fehler, Status) | M |
| PF-CR-13 | Crawler | Version-agnostische STAC-Extensions erkennen und als Tags speichern (EO, SAR, Point Cloud) | ✔ | Extensions-Tags in DB & Queryables sichtbar | L |
| PF-API-01 | STAC-API | API gemäß relevanten Spezifikationen gültig (STAC API und Collection Search Extension) | – | `/conformance` enthält zutreffende URIs | H |
| PF-API-02 | STAC-API | Erweiterung der bestehenden STAC Index API; bleibt selbst gültige STAC-API | – | Root/Collections gültig - Getestet durch `STAC Validator` und `STAC API Validator` | H |
| PF-API-03 | STAC-API | Collection Search: Freitext `q`, Filter, Sortierung | – | Beispiel-Queries liefern erwartete Treffer | H |
| PF-API-04 | STAC-API | CQL2-Filtering (Basic CQL2 (`AND`, `OR`, `NOT`, `=`, `<>`, `<`, `<=`, `>`, `>=`, `IS NULL`)) für Collection-Eigenschaften | – | Gültige Filter → 200 Antworten; ungültige → 400 Antworten mit Fehlerbeschreibung | H |
| PF-API-05 | STAC-API | Zusätzliche CQL2-Fähigkeiten (Advanced Comparison Operators (`LIKE/BETWEEN/IN`, `casei/accenti`, `Spatial/Temporal`, `Arrays`)) | ✔ | Conformance-URIs ergänzt; Tests grün | M |
| PF-API-06 | STAC-API | CQL2 als Standalone-Library bereitstellen | ✔ | Lib mit Parser/Validation + README | L |
| PF-API-07 | STAC-API | Integration der neuen Funktionen in bestehende STAC Index API | ✔ | End-to-End-Tests (Crawler→API→UI) grün | M |
| PF-UI-01 | Web-UI | Intuitive Suchoberfläche für Collections | – | Usability-Test: Kernflows bestehen | H |
| PF-UI-02 | Web-UI | Implementierung in Vue (v3) zur Einbindung in STAC Index | – | Build integriert; Routing/State funktionsfähig | M |
| PF-UI-03 | Web-UI | Interaktive Auswahl von Bounding Box und Zeitintervall | – | BBox/Datetime erzeugen korrekte Parameter | H |
| PF-UI-04 | Web-UI | Composable Queryables in der UI → generiert CQL2-Ausdruck | – | UI-Builder erzeugt valide CQL2 (Server-OK) | H |
| PF-UI-05 | Web-UI | Kartenansicht mit Visualisierung räumlicher Extents | – | Extents werden auf interaktiver Karte dargestellt | M |
| PF-UI-06 | Web-UI | Links zur Originalquelle (Katalog/API) und optional zur Item Search | – | Links korrekt & erreichbar | M |
| PF-UI-07 | Web-UI | Inspection-Ansicht für Collections (Details) | – | Detailseite zeigt alle Kernfelder | M |
| PF-UI-08 | Web-UI | Items der Collections inspizieren können | ✔ | Item-Liste/Detail aufrufbar | L |
| PF-UI-09 | Web-UI | Collections vergleichen (Mehrfachauswahl & Vergleich) | ✔ | Vergleichsansicht mit minimum 2 Collections | L |


## 5. Produktdaten (Crawler & Datenbank) <!-- Humam & Sönke -->

### collection
- title
- description
- spatial extent
- temporal extent (start-end)
- provider names
- license 
- DOIs
- created_timestamp
- last_crawled
- extracted collection metadata

- STAC extensions 
- active boolean

### catalog
- title
(- description)
- catalog_parent 

### keywords

- keyword

### source 
- source_url
- title
- type
- status
- last_crawled

### summaries
- collection_id	
- platform	TEXT	(z. B. „Sentinel-2“)
- constellation	TEXT	(z. B. „Sentinel“)
- gsd
- processing_level
- summary_json

## 6. Leistungsanforderungen (ALLE)

### 6.1 Crawler <!-- Humam -->

### 6.2 Datenbank <!-- Sönke -->

### 6.3 STAC API <!-- George -->

### 6.4 UI <!-- Justin -->
### UI-Komponente
- Design orientiert am STAC Index und Komponenten
- VueJS v3
- Selektion
    - BoundingBox/?Polygon?
    - Zeit
- Responsive
- Scratch?? CQL2 Filter & Kondition bauen
- Interaktive Karte
- Lizenzkonforme Verweise auf genutzte Software (Verweis auf STAC Catalog, STAC API, ...)
- Kollektionen suchen und filtern
- BONUS Kollektionen vergleichen
- (TO:DO Abklären) BONUS Items einer Collection im Frontend anzeigen lassen 
  - Also nicht Items abspeichern, sondern On-Demand abrufen

- System Startbar per Einzeiler (docker-compose up --build)

- Datenspeicherung Konform zu STAC
- Datenschnittstelle Konform zur STAC API
- Datenschnittstelle Konform zur STAC API Collection Search Extension
- Implementierung der STAC API Collection Search Extension (Free-text search, Filter, Sort)
- Implementierung der CQL2 Filterung für Attribute der Collections

- BONUS:
  - Erweiterte CQL2 Filterung
  - CQL2 Filterung als eigenständige Library
  - Integrations unserer Lösung ins bisherige STAC Index API

- API ist Querybar nach folgenden Attributen: (TO:DO)
  -
  -
  -
  -

- Datenbank	Lesezugriff auf indizierte Felder	< 100 ms pro Query
- System	Parallel verarbeitbare Anfragen	≥ 100 gleichzeitig
- STAC API	GET-Abfrage /collections	≤ 1 Sekunde
- STAC API	Komplexe Filterabfrage /search	≤ 5 Sekunden
- STAC API	Maximale Anfragezeit	≤ 1 Minute

### Frontend
- Kompatibel mit Browsern, die 80% der User repräsentieren
- Geeignet für farbenblinde Personen
- Ausführliches Errorhandling
- API in Englisch
- Frontend in Englisch und Deutsch
- Reaktionszeit (außer Query in weniger als einer Sekunde)
- Asynchrones Laden komplexer Anfragen
- Einfache textuelle Queries nach Keywords etc. < 5s
- Komplexe geometrische Queries < 1min
- Unterteilung von Suchergebnissen auf mehrere Seiten

### Crawler
- Full Crawl < one week

### API
- Unterstützung gleichzeitiger Anfragen

### Datenbank
- Effiziente Datenhaushaltung

## 7. Qualitätsanforderungen (ALLE) <!-- Vincent -->
- Backend Unit-Test mit jest
- Weiterführende Integrationstests
- Verwendung von GitHub-Pipeline
- STAC Validator
- STAC API Validator

## 8. Sonstige nichtfunktionale Anforderungen (ALLE) <!-- Jakob -->
- Ausführliche Dokumentation
  - Im Code
  - Im Repository
  - Verwendung von JSDoc
  - Verwendung von OpenAPI als Dokumentation

- Live Präsentation des finalen Produkts

- Projektbericht
  - als PDF
  - mit Bedienungsanleitung
  - Beschreibung, wie die verschiedenen Anwendungsfälle durch unser Produkt gelöst werden
  - Beschreibung des Zusammenspiels aus den drei Komponenten Crawler, API und UI

- Open Source unter Apache 2.0
- Verwendung von Lintern

- Agiles Projektmanagement über GitHub-Projekte
  - Kunde erhält Zugriff


## 9. Gliederung in Teilprodukte (Unterteilt)
<!-- Was kann jedes Teilprodukt, wo sind die Grenzen. Welche Aufgaben erfüllt es -->
- Jede Komponente als eigenständiger Docker-Container
### 9.1 Crawler-Komponente <!-- Lenn -->
- crawlen der STAC Kataloge und STAC API von STAC Index
- mehr als 95% der Collections von STAC Index werden erfolgreich gecrawlt
- vollständiges Crawlen der vorgebenen Kategorien (Keywords) (6.1.1.3)
- wöchentliches crawlen des Indexes für die STAC API
- crawlen der Collections und nicht der Items (siehe 6.1.1.7)
- erstellen einer konfigurierbaren Crawling schedule
- nutzung von Pystac and asyncio
- Speicherung durch PypgSTAC 
- rekursive Navigation
- Error-Handling mit Retry-, Backoff-Logic und Failure Threshold oder Blacklisting
- Protokollierung der Crawl-Aktivitäten
- Frage: sollen gelöschte Collections beim Überschreiben auch gelöscht werden?

### 9.2 Datenbank-Komponente <!-- Sönke -->
- Bereitstellung effizienter Indizes für Such- und Filteroperationen
- Vollständige Speicherung der vom Crawler gelieferten Metadaten (inkl. STAC JSON).
- Ermöglicht Freitextsuche über Titel, Beschreibung, Keywords.
- Nutzung von PostGIS-Geometrien zur Filterung nach Bounding Box.
- Indexierung und Abfrage nach Start- und Endzeitpunkten.
- Übersetzung von CQL2-Ausdrücken in SQL WHERE-Bedingungen.
- Unterstützung inkrementeller Updates durch den Crawler.
- gelöschte Datensätze bleiben erhalten und bekommen ein active=false

- Unterteilung der Datenbank in verschiedene Tabellen
    - collection
    - catalog
    - keywords
    - source
    - summaries
    - last_crawled
    => führt zu persistenter Speicherung der Daten und schnellen Abfragemöglichkeiten

### 9.3 STAC API-Komponente <!-- Vincent -->
- implementiert die STAC API Specification und die Collection Search Extension
#### Bereitstellung von Collections
- GET /collections -> Gibt eine Liste aller gespeicherten Collections aus der    Datenbank zurück
#### Abruf einer bestimmten Collection
- GET /collections/{id} -> Liefert die vollständigen Metadaten einer einzelnen Collection
#### Collection Search
GET /search -> Ermöglicht Filterung nach:

- Schlüsselwörtern
- räumlicher Ausdehnung (Bounding Box)
- Zeitraum (temporal extent)
- Provider oder Lizenz
- Unterstützt CQL2-Filterung für erweiterte Abfragen

### 9.4 UI-Komponente <!-- Simon -->

### 9.4.1 UI

### 9.4.2 UX

## 10. Implementierungsdetails (ALLE)
<!-- Hier bitte pro Gruppe eintragen, wie genau die Teilprodukte implementiert werden sollen.
Also auch sowas wie verwendete Technologie, Teilschritte (Meilensteine?) etc.. WBS wäre auch nett-->
### 10.1 Crawler <!-- Humam -->

### 10.2 Datenbank <!-- Sönke -->

### 10.3 STAC API <!-- Robin -->
| ID | Arbeitspaket | Ziel/Output | Schritte (Stichpunkte) | Reuse/Technologien |
|----|--------------|-------------|-------------------------|--------------------|
| AP-01 | Projekt-Skeleton & Infrastruktur | Lauffähiges API-Grundgerüst mit Konfiguration & Logging | Repo-Struktur (`/api`, `/docs`, `/ops`); Apache-2.0 LICENSE; ENV-Konfig (Port, DB-URL vom DB-Team); strukturierte Logs; einfache Health-Route `GET /` | Python+FastAPI *oder* Node+Fastify/Express; uvicorn/node pm2; dotenv |
| AP-02 | Daten-Vertrag & Queryables (API-Seite) | Konsistentes Feld-Set & ` /queryables` für die UI | Such-/Filterfelder festlegen (id, title, description, extent, keywords, providers.name, license, doi, `summaries.platform/constellation/gsd/processing:level`); Datentypen (CQL2-kompatibel) definieren; `GET /queryables` (global/optional pro Collection); Dokumentation für UI | STAC Collections/Queryables Best Practices; CQL2 Typen |
| AP-03 | STAC-Core Endpunkte | STAC-konforme Basisrouten bereitstellen | `GET /` (Landing + Links), `GET /conformance` (Core+Collections vorerst), `GET /collections`, `GET /collections/{id}`; Link-Relationen & Service-Doku referenzieren | OpenAPI/Swagger-UI; STAC API Core/Collections |
| AP-04 | Collection Search – Routen & Parameter | Collection-Search-Schnittstelle mit `q`, `filter`, `sort`, Paging | Route definieren (`/collections/search` oder Parametrisierung von `/collections`); Request-Validierung; Paging-Links | STAC Collection Search Extension; API Framework Middleware |
| AP-05 | CQL2 Basic – Parsing & Validierung | Gültige CQL2-Basic-Filter erkennen & valide/klare Fehlermeldungen liefern | Bestehende Parser/Validator-Lib einbinden; Request-Modelle (JSON/Text); Fehlermeldungen standardisieren | **cql2-rs** (Py-Bindings) oder **pycql2**; Pydantic/zod |
| AP-06 | CQL2-Ausführung – AST → SQL | CQL2-AST in effiziente SQL-Where-Klauseln übersetzen | Visitor/Mapper je Knotentyp (Vergleich, Logik, `IS NULL`, optional `LIKE/IN/BETWEEN`); Parametrisiertes SQL; Schutz vor teuren Scans (Zeit/Seite begrenzen) | — |
| AP-07 | Freitext `q` & Sortierung | Relevanzbasierte Freitextsuche + stabile Sortierung | Felder für `q` bestimmen (title, description, keywords, providers); Whitelist für `sortby`; Validierung bei nicht unterstützten Feldern → 400 | API-seitige Param-Validierung |
| AP-08 | Conformance & OpenAPI | Vollständige Konformitätsangaben & saubere API-Doku | `/conformance` um **Collection Search** + **Filter (Basic CQL2)** erweitern (später optional Advanced); OpenAPI/Service-Desc verlinken; Beispiele dokumentieren | STAC Conformance-URIs; OpenAPI Generator/Swagger-UI |
| AP-09 | Fehlerbehandlung & Antwortformate | Konsistente HTTP-Fehler & STAC-kompatible Antworten | Einheitliche Fehlerstruktur (400/404/422/500) | RFC7807 |
| AP-10 | Performance & Parallelität (API-Ebene) | Anforderungen an Latenz/Parallelität API-seitig erfüllen | Server-Worker/Threading konfigurieren; DB-Poolgrößen (Client-Seite) abstimmen; Limits/Timeouts setzen; typische Queries als Synthetic-Checks | uvicorn/gunicorn-Workers oder Node Cluster; Locust/k6 für Synthetic |
| AP-11 | Security & Betrieb (API-Ebene) | Sichere Standardkonfiguration & Betriebsfähigkeit | CORS/Headers; Request-Größenlimits; Rate-Limiting/Burst-Schutz; strukturierte Logs & Basis-Metriken; einfache Traces | fastapi-middlewares/helmet/express-rate-limit; OpenTelemetry (leichtgewichtig) |
| AP-12 | Deployment & Cross-OS | Reproduzierbare Bereitstellung der **API** | Container/Dockerfile nur für API; Compose (optional) ohne DB-Build; Windows & Linux Smoke-Tests; ENV-Templates | Docker/Podman; Make/Taskfile; `.env.example` |
| AP-13 | Integration & E2E Demo | Nachweis „Crawler → API → UI“ aus API-Sicht | DB- & UI-Team liefern Staging-Instanzen | curl/Postman Collections; minimaler Demo-Guide |


### 10.4 UI <!-- Justin -->
- Git
- Python
- JavaScript
- NodeJS

### UI/UX Tech Stack
- VueJS
- Vite
- NodeJS
- OpenLayers/ Leaflet/ MapLibre GL JS
- Plain CSS
    - Reset File, Component Files, Vars
- Figma

## 11. Zeitplan (ALLE)


## 12. Zuständigkeiten (ALLE)
### 12.1 Crawler-Komponente
- Humam (Teamleiter)
- Jakob
- Lenn

### 12.2 Datenbank
- Sönke (Teamleiter)

### 12.3 STAC API-Komponente
- Robin (Projektleiter, Teamleiter)
- Jonas
- George
- Vincent

### 12.4 UI
- Justin (Teamleiter)
- Simon

## 13. Glossar (ALLE)
