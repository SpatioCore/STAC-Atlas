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
- Soll ermöglichen:
  - Auffindbar machen von Collections
  - Suche nach Collection auf Basis von zeitlicher/räumlicher Ausdehnung oder Thema
  - Einen vergleich zwischen collections verschiedener Anbieter
  - Einen Zugriff auf die Metadaten der Collections ermöglichen
Möglich als:
  - Programmatischer Ansatz (API)
  - Webanwendung (Frontend)

Querybare Attribute sind: (TO:DO)
-
-
-
-
-

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
Zur Sicherstellung einer hohen Code-, System- und Datenqualität werden im Projekt *STAC-Atlas* folgende Qualitätsanforderungen definiert.
Sie betreffen alle drei Komponenten – Crawler, STAC API und Web UI – mit Schwerpunkt auf der API, da diese die Kernlogik des Gesamtsystems darstellt.
Die nachfolgenden Maßnahmen gewährleisten die Korrektheit, Wartbarkeit, Standardkonformität und Zuverlässigkeit der entwickelten Software.

### 7.1 Code-Qualität und Tests
  #### 7.1.1 Unit-Tests 
   - Für alle zentralen Backend-Module (insbesondere STAC-API-Routen, CQL2-Parser, Datenbank-Abfrage-Logik und Crawler-Importfunktionen) werden Unit-Tests mit Jest
     erstellt.
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
   - Integrationstests werden mit einem separaten Docker-Compose-Setup ausgeführt, um realitätsnahe Umgebungen zu simulieren.
   
### 7.2 Kontinuierliche Integration (CI)
- Es wird eine GitHub Actions-Pipeline eingerichtet, die alle wesentlichen Qualitätssicherungs-Schritte automatisiert:
   - Build – Installation von Dependencies, Linting-Prüfung.
   - Test – Ausführung sämtlicher Jest-Unit-Tests und Integrationstests.
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
- Jedes Modul wird mit aussagekräftigen JSDoc-Kommentaren versehen.

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
- Die STAC API-Komponente bildet das zentrale Bindeglied zwischen dem Crawler (Datenquelle) und der Web-UI (Frontend).
  Sie implementiert die SpatioTemporal Asset Catalog (STAC) API Specification in der jeweils aktuellen stabilen Version
  sowie die Collection Search Extension, um eine standardisierte und effiziente Abfrage der gespeicherten STAC Collections zu ermöglichen.
  
#### 9.3.2 Technische Grundlagen
- Technologien: Node.js (Express oder Fastify) mit TypeScript
- Datenbank-Anbindung: PostgreSQL (inkl. PostGIS-Erweiterung für räumliche Abfragen)
- API-Format: JSON (konform zur STAC-Spezifikation, RFC 8259)
- Filterlogik: Umsetzung der STAC Collection Search Extension inkl. CQL2 (Basic)

#### 9.3.3 Endpunkte
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
   - Räumliche Operatoren: `t_intersects`
   - Zeitliche Operatoren: `t_before`, `t_after`, `t_during`

#### 9.3.4 Validierung und Qualitätssicherung
Die Konformität der STAC API zur offiziellen STAC-Spezifikation wird durch automatisierte Tests und Validierungen sichergestellt (siehe Kapitel 7 – Qualitätsanforderungen).

#### 9.3.5 Sicherheit, Performance und Erweiterbarkeit
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
