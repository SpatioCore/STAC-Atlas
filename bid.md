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
- isApi
- status
- isPrivate
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
Die Craler-Komponente soll eine hohe Effizienz, Stabilität und Skalierbar sein, um große Mengen an STAC-Katalogen und -APIs regelmäißg und zuverlässig zu erfassen.

#### Crawling Leistung
Der Crawler soll in der Lage sein, alle aktuell vorhanden (94) STAC-Quellen innerhlab einer Woche zu analysieren. In folge dessen soll auch die Aktualisierung aller bekannter und neuer Quellen maximal eine Woche betragen. Die einzelnen STAC-Collections sollen jeweils innerhalb von < 5 Sekunden abgerufen und verarbeitet werden. Zudem wollen wir selber den Crawler Rate-Limiting einhalten, um die externen Dienste nicht zu überlasten (z.B. max. 5 Request/Sekunde pro Quelle).

#### Crlawing Parallelität und Skalierbarkeit
Die Implementierung soll asynchrones und paralleles Crawling unterstützten. Es wird nur ein einzelene Crawler-Instanz sein, um die Komplexität mit Datenbankkonflikten zu vermeiden. Es wird darauf geachtet eine Modulare weise zu programmieren um in Zukunft horizontale Skalierung mit mehren Cralwern möglich zu machen.

#### Crawling Zuverlässigkeit unf Fehlertoleranz
Der Crawler darf bei fehlerhaften oder inaktiven Quellen nicht vollständig abbrechen. Die Quellen, die dreimal hintereinander fehlschlagen, sollen als inaktiv bis zum Crawling Event behandelt werden. Fehler und Wiederholungen müssen in protokolliert werden.

#### Ressourcenverbrauch
Der Crawler darf im Normalbetrieb auf einer Standard-VM mit (2 vCPUs,8GB RAM) betrieben werden. Dies ist der alleinstehende Verbrauch. Eine CPU-Auslatung von über 80% im Mittel einer Woche darf nicht überschritten werden. RAM Verbrauch ist maximal 4GB pro Crawler.

#### Wartbarkeit und Monitoring
Die Crawling-Durchläufe sollen über Logging und Metriken wie der Anzahl gecrawlter Quellen, Anzahl gecrawlter Collections und Laufzeit überwacht werden. Die Metriken werden nur über eine Lokale Datei von einem System-Admin abrufbar sein.


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
Der Crawler durchsucht STAC Index nach STAC Kataloge und STAC APIs. Dabei sollen mehr als 95% der Collections erfolgreich erfasst werden.
Das Crawling erfolgt rekursiv, sodass Collections in beliebiger Tiefe innerhalb verschachtelter Kataloge erkannt werden. Es werden ausschließlich Collections und keine Items erfasst. Die Crawling Vorgänge extrahieren die relevanten Metadaten jeder Collection (6.1.1.3) und speichern sie zusammen mit der Quell-URL, dem Katalognamen und dem Zeitstempel des letzten Crawls.

Es werden alle stabilen STAC-Versionen, durch Migration unterstützt. 
Eine Crawling-Plan (Schedule) ermöglicht die zeitliche Steuerung einzelner Crawl-Vorgänge. Es soll eine wöchentliche Aktualisierungen des Indexes durchgeführt werden.

Für die Umsetzung werden PySTAC und asyncio zur Verarbeitung genutzt. Die Ergebnisse werden mittels PypgSTAC in einer PostgreSQL-Datenbank gespeichert.

Zur Stabilität trägt ein Fehlerbehandlungssystem mit Retry- und Backoff-Mechanismen bei. Quellen, die wiederholt fehlschlagen, werden nach Erreichen einer konfigurierbaren Fehlerschwelle automatisch übersprungen oder auf eine Blacklist gesetzt.
Außerdem werden alle Crawl-Aktivitäten protokolliert, um Transparenz und Nachvollziehbarkeit zu gewährleisten.


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
Ziel ist die Automatische Erfassung, Validierung und Speicherung von STAC-Collections aus verteilten Quellen in einer PostgreSQL-Datenbank.

#### Technologien
Dies wird in Python realisiert. Genutzte Bibilotheken sind:
- ```pystac``` / ```pystac-client``` zum Lesen und Traversieren von STAC-Katalogen und -APIs
- ```stactools``` für Migration und Validierung von STAC-Versionen
- ```requests``` oder ```httpx``` für asynchrone API-Aufrufe
- ```asyncio``` für paralleles Crawling
- ```sqlalchemy``` oder ```asyncpg ``` für Datenbankzugriffe
- ```pypgstac``` zum Einspielen von Collections in PostgreSQL (PgSTAC-kompatibel)
- ```logging``` / ```structlog``` für strukturierte Protokollierung
asynchrones Crawlen

Alle verwendeten Bibliotheken 
sollen unter Apache-2.0 oder kompatibler Lizenz verfügbar sein.

#### Architektur

Der Crawler ist als eigenständiger Microservice implementiert.
Komponenten sind:

1. Der Source Manager, der die Quelleinträge verwaltet (aktiv/inaktiv, letzter Crawl).
2. Die Crawler Engine, welches das rekursives Laden von STAC-Katalogen (async) ermöglicht.
3. Der Metadata Extractor, der extrahiert relevante Felder (id, title, extent usw.)
4. Database Writer, der persistiert Daten in PostgreSQL
5. Der Scheduler der die periodische Crawls steuert
6. Logger / Monitor welcher den Status, Fehler und Statistiken auf zeichnet.

#### Ablauf

1. Initialisierung
Lade aktive Quellen und plane Crawls gemäß Konfiguration
2. Crawling
Für jede Quelle:
Erkunde STAC-Katalog/API rekursiv (Follow child, catalog Links) <!-- Prüfe STAC-Version und migriere bei Bedarf (stactools migrate) -->
3. Metadatenextraktion
Extrahiere Felder laut Spezifikation (id, title, extent, provider, license, etc.)
4. Validierung
Prüfe STAC-Konformität (stactools validate oder stac-check)
5. Datenpersistenz
Upsert in PostgreSQL via pypgstac oder sqlalchemy
Aktualisiere last_crawled in sources
6. Fehlerbehandlung
Wiederhole fehlgeschlagene Requests (n = 3)
Markiere Quelle bei dauerhaften Fehlern als inactive
7. Logging & Monitoring
Schreibe Crawling-Logs und Performance-Metriken in Logdateien / DB

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
