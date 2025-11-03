# Pflichtenheft STAC Atlas

## 1. Zielbestimmung (ALLE)
- Verwaltungvon Metadaten zu Geodaten
- Ermöglicht Suche und Filterung
- Verlinkt auf die echte Daten
- Anwendung soll Geodaten verschiedener Anbieter automatisiert erfassen
- werden in einer DB gespeichert 
- sollen über eine standardisierte API sowie eine benutzerfreundliche Weboberfläche zugänglich sein

Das Projekt besteht aus vier Hauptkomponenten:

- Crawler – erfasst Daten aus STAC-Katalogen
- Datenbank – speichert Metadaten
- STAC API – ermöglicht standardisierten Zugriff
- UI – bietet visuelle Suche und Kartenansicht

## 2. Anwendungsbereiche und Zielgruppen (ALLE)
STAC-Index website
GIS-Fachleute
Datenanbieter
Entwickler
Datenwissenschaftler

## 3. Produkt-Umgebung

Die Produktumgebung beschreibt die technischen Rahmenbedingungen für Entwicklung, Betrieb und Integration der drei Hauptkomponenten des Projekts – **Crawler**, **STAC API** und **Frontend**.  
Alle Komponenten werden in einer modernen, containerisierten Umgebung entwickelt und bereitgestellt, um eine einheitliche und reproduzierbare Laufzeitumgebung sicherzustellen.

### 3.1 STAC API-konforme Schnittstelle
Das Backend stellt eine API bereit, die vollständig mit der **STAC API-Spezifikation** kompatibel ist und standardisierte Zugriffe auf die gespeicherten STAC Collections ermöglicht.

### 3.2 Backend
Das Backend wird primär in **JavaScript / Node.js** umgesetzt und als dedizierter Backend‑Server betrieben. 
Als API‑Framework wird **Express** (unter Verwendung von Node.js 20) empfohlen, um Anfragen zu verarbeiten und das Crawlen externer STAC‑Kataloge zu koordinieren. 
Für die Übersetzung und Auswertung von **CQL2**‑Abfragen wird die robuste Rust‑Implementierung **cql2‑rs** eingesetzt. 
Die bevorzugte Integrationsvariante ist das Kompilieren von **cql2‑rs** zu **WebAssembly** und das direkte Einbinden in den Node‑Prozess (Vorteile: In‑Process‑Ausführung, geringere Latenz, einfache Containerisierung). 
Als Fallback bleibt alternativ die Python‑Option mit **pycql2**, wird aber nicht als Primärvariante verwendet, um Konsistenz mit dem JavaScript‑Stack und der Team‑Expertise sicherzustellen. 
Sollten sich große Schwierigkeiten mit der cql2-rs-Library ergeben, kann ein Backend in Python (z. B. mit FastAPI) implementiert werden, das die Anfrageverarbeitung und CQL2‑Übersetzung übernimmt.

### 3.3 Crawler
Der **Crawler** wird in **Python** implementiert und ist zuständig für das automatische Auffinden und Einlesen von STAC Collections aus dem STAC Index.  
Er aktualisiert regelmäßig die Datenbank, um eine aktuelle Indexierung sicherzustellen.

### 3.4 Frontend
Das **Web-Frontend** wird mit **Vue.js (Version 3)** entwickelt und bietet eine benutzerfreundliche Oberfläche zur Suche, Filterung und Visualisierung der STAC Collections.  
Die Kommunikation zwischen Frontend und Backend erfolgt über die STAC API.

### 3.5 Datenbankmanagementsystem
PostgreSQL in Kombination mit PostGIS bildet die zentrale Datengrundlage. 
Die Metadaten werden in normalisierten Teiltabellen gehalten; Primär‑/Fremdschlüssel sorgen für Referenzen. 
Für Performance werden B‑Tree‑Indizes (ID, Zeit), GIN/GiST (Text, Geometrien) und `tsvector`‑Volltextindizes eingesetzt. 
Datensätze werden als PostGIS-Geometrieobjekt gespeichert.
CQL2‑Filter werden serverseitig in SQL‑WHERE‑Klauseln übersetzt. 
Inkremetelle Updates und Soft‑Deletes (`active = false`) sichern Integrität und Revisionsfähigkeit. 

### 3.6 Containerisierung
Alle Komponenten werden einzeln mittels **Docker** containerisiert und als Komplett-Paket miteinander verknüpft um sowohl die Verwendung einzelner Komponenten getrennt voneinander, als auch die Verwendung des vollständigen Systems zu ermöglichen.
Dadurch kann das gesamte System mit einem einzigen Startbefehl (**Docker-Einzeiler**) ausgeführt werden und ist plattformunabhängig lauffähig.  
Docker gewährleistet eine konsistente Laufzeitumgebung und erleichtert die Integration zwischen den Komponenten.

## 4. Produktfunktionen (UNTERTEILT) <!-- Robin -->

Im folgenden werden die einzelnen Produktfunktionen einerseits nach den einzelnen Komponenten unterteilt, nummeriert und beschrieben. Zusätzlich wird eine Priorität zur Orientierung in der Implementierung angegeben inkl. einer kurzen Beschreibung und einem groben Akzeptanzkriterium. Auf Basis der optionalen Elemente des Lastenhefts wurde auch eine Spalte "Optional" gefüllt, welche Features markiert, welche mit nachrangiger Priorität nach der Entwicklung der Hauptfunktionalitäten entwickelt werden, sollte dafür noch Zeit sein.

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

## 6.3 STAC API
Die STAC API-Komponente bildet die zentrale Datenschnittstelle des Systems und ermöglicht einen standardkonformen Zugriff auf die in der Datenbank gespeicherten STAC collections und catalogs. Sie erfüllt vollständig die Anforderungen der SpatioTemporal Asset Catalog (STAC) API sowie der Collection Search Extension und bietet erweiterte Such- und Filterfunktionen.

Über die Endpunkte /collections und /search können Nutzer Collections nach Attributen wie Titel, Lizenz, Schlüsselwörtern sowie räumlicher und zeitlicher Ausdehnung durchsuchen, filtern und sortieren. Dabei wird die CQL2-Filterung unterstützt, um standardkonforme und einheitliche Datensuche zu ermöglichen. Dabei stehen logische Operatoren (AND, OR, NOT) und Vergleichsoperatoren (=, <, >, IN) zur Verfügung; optional sind auch erweiterte Funktionen wie LIKE, BETWEEN oder INTERSECTS vorgesehen.

Die API bietet eine hohe Performance:
Zugriff auf indizierte Daten mit Antwortzeiten unter 1 s,
Verarbeitung von mindestens 100 parallelen Anfragen,
Antwortzeiten unter 5 s für einfache Abfragen und unter 1 min für komplexe Filterabfragen.

Damit stellt die STAC API eine leistungsfähige, flexible und erweiterbare Grundlage für die standardisierte Suche innerhalb der indizierten STAC Collections dar.

## 7. Qualitätsanforderungen (ALLE) <!-- Vincent -->
Zur Sicherstellung einer hohen Code-, System- und Datenqualität werden im Projekt *STAC-Atlas* folgende Qualitätsanforderungen definiert.
Sie betreffen alle drei Komponenten – Crawler, STAC API und Web UI – mit Schwerpunkt auf der API, da diese die Kernlogik des Gesamtsystems darstellt.
Die nachfolgenden Maßnahmen gewährleisten die Korrektheit, Wartbarkeit, Standardkonformität und Zuverlässigkeit der entwickelten Software.

### 7.1 Code-Qualität und Tests
  #### 7.1.1 Unit-Tests 
   - Für alle zentralen Backend-Module (insbesondere STAC-API-Routen, CQL2-Parser, Datenbank-Abfrage-Logik und Crawler-Importfunktionen) werden Unit-Tests mit einem geeigneten Framework (z. B. pytest) erstellt.
   - Für das Frontend werden Unit-Tests mit einem geeigneten Framework (Jest) erstellt.
   - Zielabdeckung: mindestens 80 % Branch- und Statement-Coverage laut Jest-Bericht.
   - Tests werden automatisiert bei jedem Commit und Merge-Request in der GitHub-Pipeline ausgeführt.
   - Fehlgeschlagene Unit-Tests blockieren den Merge in den Haupt-Branch.

  #### 7.1.2 Integrationstests
   - Zusätzlich zu den Unit-Tests werden Integrationstests definiert, um das Zusammenspiel der Komponenten (STAC-API ↔ Crawler-DB ↔ Web UI) zu verifizieren.
   - Diese Tests prüfen:
     - Korrektes Schreiben von Collection-Metadaten durch den Crawler in die Datenbank.
     - Abrufbarkeit und Filterbarkeit dieser Daten über die STAC-API-Endpunkte (/collections, /collections/search).
     - Validität der API-Antworten im STAC-Standardformat.
     - Pagination-, Sortier- und Filterfunktionen (CQL2).
   - Die Integrationstests werden in einer getrennten Testumgebung ausgeführt, die der realen Systemarchitektur entspricht (wahlweise über ein separates Docker-Compose-Setup oder im Rahmen des regulären Setups).
  
### 7.2 Kontinuierliche Integration (CI)
- Es wird eine GitHub Actions-Pipeline eingerichtet, die alle wesentlichen Qualitätssicherungs-Schritte automatisiert:
   - Build – Installation aller Abhängigkeiten und Prüfung auf erfolgreiche Kompilierung.
   - Linting – Automatische Kontrolle der Codequalität (z. B. mit flake8 für Python und ESLint für JavaScript/Vue-Komponenten).
   - Test – Ausführung sämtlicher Unit-Tests (pytest Backend) und Komponententests (Jest Frontend) sowie Integrationstests über die GitHub Actions-Pipeline.
   - Validation – Ausführung der STAC- und API-Validatoren (s. Abschnitte 7.3 und 7.4).
   - Coverage-Report – automatische Generierung und Veröffentlichung in den Pipeline-Logs.
- Die CI-Pipeline wird bei jedem Push und Pull-Request gegen den Main-Branch ausgeführt.
- Nur bei erfolgreicher Pipeline-Ausführung dürfen Änderungen in den stabilen Branch übernommen werden (Branch-Protection-Rule).

### 7.3 STAC-Validator
- Jede durch den Crawler importierte und in der Datenbank gespeicherte Collection wird mit dem offiziellen STAC Validator
  geprüft.
- Validierung erfolgt:
   - beim erstmaligen Import (Crawler-Phase),
   - bei Änderungen oder Re-Crawls,
   - zusätzlich regelmäßig in der CI-Pipeline anhand von Stichproben.
- Collections, die nicht den STAC-Spezifikationen (z. B. Version 1.1) entsprechen, werden protokolliert und nicht in den Index aufgenommen, bis sie korrigiert sind.
- Die Validierungsergebnisse werden im Crawler-Log und in den CI-Reports dokumentiert.

### 7.4 STAC-API-Validator
- Die implementierte STAC API wird mit dem offiziellen stac-api-validator
  (bzw. OGC Conformance-Tests) überprüft.
- Geprüfte Aspekte:
   - Gültigkeit der API-Antworten nach STAC API-Spezifikation (v1.x).
   - Unterstützung der Collection Search Extension und der CQL2-Query Language (Basic).
   - Korrekte Implementierung der Endpoints (/collections, /collections/search, /conformance, /queryables).
- Der Validator wird:
   - nach jedem erfolgreichen Build in der CI-Pipeline ausgeführt,
   - manuell vor der Endabgabe für einen vollständigen Compliance-Report verwendet.
- Ziel: 100 % bestehende STAC-Validator-Tests.

### 7.5 Dokumentations- und Wartungsqualität
- Alle Module werden mit aussagekräftigen Kommentaren dokumentiert, entsprechend der jeweils verwendeten Programmiersprache (z. B. PyDoc für Python-Module oder JSDoc für JavaScript/Vue-Komponenten).

## 8. Sonstige nichtfunktionale Anforderungen (ALLE) <!-- Jakob -->
- Ausführliche Dokumentation
  - Im Code
  - Im Repository
  - Verwendung von JSDoc
  - Verwendung von OpenAPI als Dokumentation


## 9. Gliederung in Teilprodukte (Unterteilt)
### 9.1 Crawler-Komponente
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

### 9.2 Datenbank-Komponente

### 9.3 STAC API-Komponente <!-- Vincent -->
- Die STAC API-Komponente bildet das zentrale Bindeglied zwischen dem Crawler (Datenquelle) und der Web-UI (Frontend).
  Sie implementiert die SpatioTemporal Asset Catalog (STAC) API Specification in der jeweils aktuellen stabilen Version
  sowie die Collection Search Extension, um eine standardisierte und effiziente Abfrage der gespeicherten STAC Collections zu ermöglichen.
  
#### 9.3.1 Technische Grundlagen
Die STAC API-Komponente stellt eine standardisierte Schnittstelle bereit, über die alle gespeicherten STAC-Collections abgefragt und gefiltert werden können.
Sie verbindet das Datenbank-Backend, in dem die Metadaten der Collections gespeichert sind, mit der Web-Benutzeroberfläche und externen Anwendungen.

Über die API können Nutzende:
   - Alle verfügbaren Collections abrufen oder gezielt nach bestimmten Daten suchen
   - Filterungen und Sortierungen anhand von Schlüsselwörtern, räumlichen und zeitlichen Ausdehnungen oder weiteren Metadaten durchführen
   - Details einzelner Collections abrufen, einschließlich Beschreibung, Lizenz, Provider und räumlicher Ausdehnung
   - die Ergebnisse als STAC-konformes JSON-Format abrufen, das auch von anderen STAC-fähigen Anwendungen weiterverarbeitet werden kann

Damit bildet die API die zentrale Kommunikationsschnittstelle zwischen der Datenbank, dem Crawler und der Web-UI
und ermöglicht einen einheitlichen, standardkonformen Zugriff auf alle gespeicherten STAC-Daten.

#### 9.3.2 Endpunkte
1. Bereitstellung von Collections
   - `GET /collections` 
     - Gibt eine Liste aller gespeicherten Collections aus der Datenbank zurück.
   - Die Antwort ist konform zum STAC API Standard und enthält Metadaten wie `id`, `title`, `description`, `extent`, `keywords`, `providers`, `license`, sowie relevante links.
   - Ergebnisse werden pagininiert und alphabetisch nach `title` sortiert (Standardverhalten).

2. Abruf einer bestimmten Collection
   - `GET /collections/{id}`
     - Liefert die vollständigen Metadaten einer einzelnen Collection, einschließlich des gesamten STAC-konformen JSON-Objekts.
   - Wird eine unbekannte ID angefragt, gibt die API eine strukturierte Fehlermeldung gemäß STAC-Spezifikation zurück (`404 Not Found`, JSON mit `code`, `description`, `id`).
   - Die Antwort enthält auch links zur zugehörigen Quelle (Original-STAC-API oder Katalog).
   - `GET /collections/{id}` -> Liefert die vollständigen Metadaten einer einzelnen Collection
   
3. Collection Search
- `GET /search`
  und
- `POST /search`
- Ermöglicht die gezielte Filterung und Suche nach Collections innerhalb des Index.
- Unterstützt wird sowohl die einfache Query-Parameter-Variante (GET) als auch komplexe CQL2-Abfragen (POST).

- Unterstützte Filterparameter (GET):
   - `q` → Freitextsuche über Titel, Beschreibung und Schlüsselwörter
   - `bbox` → Räumliche Einschränkung (Bounding Box, `[minX, minY, maxX, maxY])`
   - `datetime` → Zeitintervall (ISO8601-Format, z. B. 2019-01-01/2021-12-31)
   - `provider` → Name oder Kürzel des Datenanbieters
   - `license` → Lizenzfilter 
   - `limit` → Anzahl der zurückgegebenen Ergebnisse pro Seite
   - `sortby` → Sortierung 

- Erweiterte Filterung über CQL2 (POST):
   - Die API implementiert CQL2 Basic Filtering zur semantischen Abfrage von Eigenschaften:
   - Vergleichsoperatoren: `=`, `!=`, `<`, `<=`, `>`, `>=`
   - Logische Operatoren: `and`, `or`, `not`
  
#### 9.3.3 Sicherheit, Performance und Erweiterbarkeit
Die STAC API-Komponente bildet das zentrale Zugriffssystem auf die indexierten STAC-Collections.
Sie stellt eine standardisierte und sichere Schnittstelle bereit, über die Nutzende oder andere Systeme gezielt nach Sammlungen suchen, diese filtern und abrufen können.
Die API verarbeitet Anfragen zuverlässig und unterstützt den Zugriff über alle implementierten Suchfunktionen (Freitext, räumliche und zeitliche Filter, CQL2).
Durch die modulare Architektur kann die API zukünftig um weitere STAC-Endpunkte, wie etwa „Items“ oder „Item Search“, erweitert werden.
Zudem erlaubt der Aufbau eine einfache Integration mit der Web-UI-Komponente und externen Anwendungen über REST-Schnittstellen.

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
| AP-05 | CQL2 Basic – Parsing & Validierung | Gültige CQL2-Basic-Filter erkennen & valide/klare Fehlermeldungen liefern | Bestehende Parser/Validator-Lib einbinden; Request-Modelle (JSON/Text); Fehlermeldungen standardisieren | *cql2-rs* oder *pycql2* |
| AP-06 | CQL2-Ausführung – AST → SQL | CQL2-AST in effiziente SQL-Where-Klauseln übersetzen | Visitor/Mapper je Knotentyp (Vergleich, Logik, `IS NULL`, optional `LIKE/IN/BETWEEN`); Parametrisiertes SQL; Schutz vor teuren Scans (Zeit/Seite begrenzen) | — |
| AP-07 | Freitext `q` & Sortierung | Relevanzbasierte Freitextsuche + stabile Sortierung | Felder für `q` bestimmen (title, description, keywords, providers); Whitelist für `sortby`; Validierung bei nicht unterstützten Feldern → 400 | API-seitige Param-Validierung |
| AP-08 | Conformance & OpenAPI | Vollständige Konformitätsangaben & saubere API-Doku | `/conformance` um Collection Search + Filter (Basic CQL2) erweitern (später optional Advanced); OpenAPI/Service-Desc verlinken; Beispiele dokumentieren | STAC Conformance-URIs; OpenAPI Generator/Swagger-UI |
| AP-09 | Fehlerbehandlung & Antwortformate | Konsistente HTTP-Fehler & STAC-kompatible Antworten | Einheitliche Fehlerstruktur (400/404/422/500) | RFC7807 |
| AP-10 | Performance & Parallelität (API-Ebene) | Anforderungen an Latenz/Parallelität API-seitig erfüllen | Server-Worker/Threading konfigurieren; DB-Poolgrößen (Client-Seite) abstimmen; Limits/Timeouts setzen; typische Queries als Synthetic-Checks | uvicorn/gunicorn-Workers oder Node Cluster; Locust/k6 für Synthetic |
| AP-11 | Security & Betrieb (API-Ebene) | Sichere Standardkonfiguration & Betriebsfähigkeit | CORS/Headers; Request-Größenlimits; Rate-Limiting/Burst-Schutz; strukturierte Logs & Basis-Metriken; einfache Traces | fastapi-middlewares/helmet/express-rate-limit; OpenTelemetry (leichtgewichtig) |
| AP-12 | Deployment & Cross-OS | Reproduzierbare Bereitstellung der API | Container/Dockerfile nur für API; Compose (optional) ohne DB-Build; Windows & Linux Smoke-Tests; ENV-Templates | Docker/Podman; Make/Taskfile; `.env.example` |
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

## 11. Zeitplan

## 12. Glossar (ALLE)
