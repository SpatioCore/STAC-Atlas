# Pflichtenheft STAC Atlas

## 1. Zielbestimmung (ALLE) <!-- Jakob -->

Das Projekt STAC Atlas zielt darauf ab, eine zentralisierte Plattform zur Verwaltung, Indexierung und Bereitstellung von STAC-Collection-Metadaten zu entwickeln. In der heutigen Geodaten-Landschaft existieren zahlreiche dezentrale STAC-Kataloge und -APIs verschiedener Datenanbieter, was die Auffindbarkeit und den Zugriff auf relevante Geodaten-Collections erschwert. STAC Atlas adressiert dieses Problem, indem es als zentrale Anlaufstelle fungiert, die Metadaten aus verschiedenen Quellen aggregiert und durchsuchbar macht.

Die Plattform ermöglicht es Nutzern, Collections anbieterübergreifend zu suchen, zu filtern und zu vergleichen, ohne jeden einzelnen STAC-Katalog manuell durchsuchen zu müssen. Durch die Implementierung standardkonformer Schnittstellen (STAC API) wird sowohl die programmatische Nutzung durch Entwickler als auch die interaktive Nutzung über eine Web-Oberfläche ermöglicht. Dies steigert die Effizienz bei der Arbeit mit Geodaten erheblich und fördert die Wiederverwendbarkeit von Datenressourcen.

Das Projekt besteht aus vier Hauptkomponenten, die nahtlos zusammenarbeiten:
- **Crawler** – erfasst automatisch Daten aus verschiedenen STAC-Katalogen und hält diese aktuell
- **Datenbank** – speichert Metadaten persistent und ermöglicht effiziente Abfragen
- **STAC API** – ermöglicht standardisierten, programmatischen Zugriff auf die indexierten Collections
- **UI** – bietet eine nutzerfreundliche Web-Oberfläche mit visueller Suche und interaktiver Kartenansicht

### 1.1 Musskriterien

Die Musskriterien definieren die zwingend erforderlichen Funktionalitäten des Systems. Diese Anforderungen müssen vollständig erfüllt werden, damit das Projekt als erfolgreich gilt. Sie bilden den Kern der Systemfunktionalität und sind für den produktiven Einsatz unerlässlich.

#### Crawler
- Automatisches Crawlen und Indexieren von STAC Collections aus verschiedenen Quellen
- Erfassung von mehr als 95% der Collections vom STAC Index
- Rekursive Navigation durch STAC-Kataloge
- Wöchentliches Re-Crawling zur Aktualisierung der Daten
- Robustes Error-Handling mit Retry-Logic

#### Datenbank
- Persistente Speicherung von STAC-Collection-Metadaten
- Unterstützung strukturierter Suchabfragen (CQL2)
- Volltextsuche über Titel, Beschreibung und Keywords
- Räumliche Filterung (Bounding Box) mittels PostGIS
- Zeitliche Filterung nach Start- und Endzeitpunkten
- Effiziente Indizierung für schnelle Abfragen (< 100 ms)

#### STAC API
- Konforme Implementierung der STAC API Specification
- Implementierung der Collection Search Extension
- Bereitstellung von Collections (GET /collections)
- Abruf einzelner Collections (GET /collections/{id})
- Erweiterte Suchfunktion (GET /search) mit Filterung nach:
  - Schlüsselwörtern
  - Räumlicher Ausdehnung
  - Zeitraum
  - Provider und Lizenz
- CQL2-Filterung für komplexe Abfragen
- Parallele Verarbeitung von mindestens 100 Anfragen
- Antwortzeiten: einfache Abfragen ≤ 1s, komplexe Abfragen ≤ 5s

#### UI (Web-Interface)
- Nutzerfreundliche Web-Oberfläche zur Suche und Filterung
- Interaktive Kartenansicht zur räumlichen Suche
- Filterung nach:
  - Bounding Box / räumlicher Ausdehnung
  - Zeitraum
  - Thema / Keywords
- Responsive Design für verschiedene Bildschirmgrößen
- Mehrsprachigkeit (Deutsch und Englisch)
- Barrierefreiheit (farbenblindentauglich)
- Anzeige der Collection-Metadaten

#### Allgemein
- Containerisierung aller Komponenten mit Docker
- System startbar per Einzeiler: `docker-compose up --build`
- Open Source unter Apache 2.0 Lizenz
- Standardkonforme Datenmodellierung nach STAC Specification

### 1.2 Wunschkriterien

Die Wunschkriterien beschreiben optionale Funktionalitäten, die das System über die Grundanforderungen hinaus erweitern würden. Diese Features sind nicht zwingend erforderlich, würden aber den Nutzen und die Attraktivität der Plattform erheblich steigern. Ihre Implementierung erfolgt in Abhängigkeit von verfügbaren Ressourcen und Zeit.

#### Erweiterte Funktionen
- Vergleich zwischen Collections verschiedener Anbieter
- On-Demand Abruf von Items einer Collection (ohne persistente Speicherung)
- Erweiterte CQL2-Filterung mit zusätzlichen Operatoren
- CQL2-Filterung als eigenständige, wiederverwendbare Library
- Integration der Lösung in das bestehende STAC Index API

#### Crawler
- Konfigurierbare Crawling-Schedule
- Blacklisting fehlerhafter Quellen
- Erfassung zusätzlicher STAC Extensions

#### UI
- Polygon-basierte räumliche Suche (nicht nur Bounding Box)
- Visueller CQL2 Query Builder ("from scratch")
- Erweiterte Visualisierungen und Diagramme
- Export-Funktionen für Suchergebnisse

### 1.3 Abgrenzungskriterien

Die Abgrenzungskriterien definieren bewusst, welche Funktionalitäten nicht Teil des Projekts sind. Diese klare Abgrenzung verhindert Missverständnisse und Scope Creep während der Entwicklung. Sie hilft allen Beteiligten, realistische Erwartungen an das System zu haben und den Fokus auf die Kernfunktionalität zu wahren.

Das System soll explizit **NICHT**:
- Items von STAC Collections persistent speichern (nur Collections)
- Als vollständiger STAC Catalog Ersatz dienen
- Originale Geodaten (Raster-/Vektordaten) speichern oder verarbeiten
- Authentifizierung oder Benutzerverwaltung implementieren
- Schreibzugriff auf externe STAC Catalogs ermöglichen
- Datenanalyse oder -verarbeitung durchführen
- Als Download-Portal für Geodaten fungieren
- Vollständige Historie aller Metadatenänderungen vorhalten
- Real-time Synchronisation mit Quell-Katalogen garantieren

## 2. Anwendungsbereiche und Zielgruppen (ALLE) <!-- Jakob -->

Das System richtet sich an verschiedene Nutzergruppen mit unterschiedlichen Anforderungen und Anwendungsfällen:

#### Data Scientists and Researchers
Wissenschaftler und Datenanalysten, die für ihre Forschungsprojekte passende Geodaten-Collections finden müssen.

**User Stories:**
- Als Data Scientist möchte ich nach Satellitenbildern eines bestimmten Zeitraums und Gebiets suchen, um Veränderungen in der Landnutzung zu analysieren.
- Als Forscherin möchte ich verschiedene Sentinel-2 Collections unterschiedlicher Anbieter vergleichen, um die für meine Studie am besten geeignete Datenquelle zu identifizieren.
- Als Klimaforscher möchte ich Collections nach spezifischen Attributen (z.B. Auflösung, Sensortyp) filtern, um geeignete Daten für meine Klimamodelle zu finden.
- Als Researcher möchte ich über die API automatisiert nach Collections suchen, um sie in meine Analyse-Pipeline zu integrieren.

#### GIS Professionals
GIS-Experten und Geoinformatiker, die regelmäßig mit Geodaten arbeiten und diese in ihren Projekten einsetzen.

**User Stories:**
- Als GIS-Analyst möchte ich auf einer Karte nach verfügbaren Collections in meinem Projektgebiet suchen, um schnell passende Datenquellen zu identifizieren.
- Als Kartograf möchte ich Collections nach Lizenzen filtern, um nur solche Daten zu finden, die ich in meinen kommerziellen Projekten verwenden darf.
- Als GIS-Consultant möchte ich die zeitliche Verfügbarkeit verschiedener Collections vergleichen, um meinen Kunden die beste Datenlösung empfehlen zu können.
- Als Geoinformatiker möchte ich Collections nach Provider durchsuchen, um alle Datenquellen eines bestimmten Anbieters zu evaluieren.

#### Application Developers
Softwareentwickler, die Anwendungen mit Geodaten-Funktionalitäten erstellen und STAC-Collections programmatisch nutzen möchten.

**User Stories:**
- Als Entwickler möchte ich über eine standardkonforme STAC API auf Collections zugreifen, um diese in meine Anwendung zu integrieren.
- Als Frontend-Entwicklerin möchte ich CQL2-Queries programmatisch erstellen und ausführen, um komplexe Suchfunktionen in meiner App zu implementieren.
- Als Backend-Entwickler möchte ich automatisiert Collections nach bestimmten Kriterien abfragen, um meinen Nutzern relevante Datensätze vorzuschlagen.
- Als Software-Architekt möchte ich die API-Dokumentation einsehen, um die Integration in unsere bestehende Geodaten-Infrastruktur zu planen.

#### Data Providers
Datenanbieter und -kuratoren, die ihre STAC-Kataloge bekannter machen und die Nutzung ihrer Daten fördern möchten.

**User Stories:**
- Als Datenanbieter möchte ich sicherstellen, dass meine Collections korrekt indexiert werden, um die Sichtbarkeit meiner Daten zu erhöhen.
- Als Data Curator möchte ich verstehen, wie meine Collections im Vergleich zu anderen Anbietern gefunden werden, um die Metadaten-Qualität zu optimieren.
- Als Open-Data-Anbieter möchte ich sehen, welche meiner Collections am häufigsten gesucht werden, um zukünftige Datenbereitstellung zu priorisieren.
- Als Infrastrukturbetreiber möchte ich, dass mein STAC-Katalog automatisch gecrawlt wird, um ohne zusätzlichen Aufwand in der Plattform präsent zu sein.

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
- Backend Unit-Test mit jest
- Weiterführende Integrationstests
- Verwendung von GitHub-Pipeline
- STAC Validator
- STAC API Validator

## 8. Sonstige nichtfunktionale Anforderungen (ALLE) <!-- Jakob -->

### 8.1 Dokumentation und Code-Qualität
- Code-Dokumentation mit JSDoc (JavaScript/TypeScript) und Docstrings (Python)
- Repository-Dokumentation (README, Setup-Anleitungen)
- API-Dokumentation via OpenAPI/Swagger
- Bedienungsanleitung für Endnutzer
- Linter: ESLint (JavaScript/TypeScript), Pylint/Flake8 (Python)
- Code-Formatierung: Prettier (JavaScript/TypeScript), Black (Python)
- Einhaltung von Coding-Standards
- Modulare Architektur

### 8.2 Projektmanagement und Entwicklungsprozess
- Agiles Projektmanagement über GitHub-Projekte (Kunde erhält Zugriff)
- Versionskontrolle mit Git
- GitHub-Pipeline für CI/CD
- Code Reviews
- Open Source unter Apache 2.0 Lizenz
- Lizenzkonforme Verweise auf genutzte Software

### 8.3 Deployment und Wartbarkeit
- Jede Komponente als eigenständiger Docker-Container
- System startbar per Einzeiler: `docker-compose up --build`
- Konfigurierbarkeit über Umgebungsvariablen
- Klare Trennung der Komponenten (Crawler, Datenbank, API, UI)
- Definierte Schnittstellen zwischen Komponenten
- API-Versionierung und Erweiterbarkeit

### 8.4 Sicherheit und Logging
- Sichere Datenbankverbindungen
- Eingabevalidierung (SQL-Injection-Schutz)
- Sanitization von Nutzereingaben
- Keine Exposition sensibler Daten in Logs
- Protokollierung der Crawl-Aktivitäten
- Strukturierte Error-Logs mit konfigurierbaren Log-Levels

### 8.5 Benutzerfreundlichkeit
- API in Englisch
- Frontend in Englisch und Deutsch mit Sprachumschaltung
- Browser-Kompatibilität (80% User-Abdeckung)
- Farbenblindentauglich (kontrastreiche Farbschemata)
- Semantisches HTML und Tastaturnavigation

### 8.6 Projektabschluss
- Live-Präsentation des finalen Produkts
- Projektbericht (PDF) mit:
  - Bedienungsanleitung
  - Beschreibung der Anwendungsfälle und Lösungen
  - Zusammenspiel der Komponenten (Crawler, API, UI)
  - Lessons Learned


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
