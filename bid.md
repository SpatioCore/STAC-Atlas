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
Die UI-Komponente dient als benutzerfreundliche Schnittstelle zur Suche, Filterung und Exploration von STAC-Collections über die bereitgestellte STAC API.  
Sie visualisiert Metadaten und räumliche Extents der Collections und ermöglicht Nutzenden eine interaktive, responsive und barrierearme Bedienung.

#### Funktionale Leistungsanforderungen

- Das Design orientiert sich am bestehenden STAC Index sowie dessen Komponenten, um Konsistenz innerhalb des STAC-Ökosystems zu gewährleisten.  
- Die Implementierung erfolgt mit Vue.js v3, unter Verwendung moderner Webstandards und komponentenbasierter Architektur.  
- Die Anwendung muss Nutzenden ermöglichen:
  - die Auswahl eines räumlichen Bereichs (Bounding Box, ggf. Polygon) über eine interaktive Karte,  
  - die Definition eines zeitlichen Intervalls,  
  - die Suche nach Collections über Keywords, Provider, Lizenz oder Themenbereich,  
  - die Kombination mehrerer Suchparameter zu komplexen CQL2-Filtern („Scratch-Modus“ zum Erstellen logischer Bedingungen).  
- Die UI zeigt die räumliche Ausdehnung der Suchergebnisse auf einer interaktiven Karte an (MapLibre GL JS).  
- Die Ergebnisse sollen in einer scrollbaren Liste/ Grid mit Titel, Beschreibung, Lizenz und Provider dargestellt werden.  
- Für jede Collection werden lizenzkonforme Verweise auf die Originalquelle (STAC Catalog oder API) bereitgestellt.  
- Die UI muss das Filtern, Anzeigen und Vergleichen mehrerer Collections ermöglichen.

#### Nichtfunktionale Leistungsanforderungen

- Die Benutzeroberfläche ist responsiv und muss auf verschiedenen Endgeräten (Desktop, Tablet, Smartphone) funktionsfähig sein.  
- Das Design muss für Personen mit Farbfehlsichtigkeit geeignet sein; kontrastreiche Darstellungen sind sicherzustellen.  
- Die UI ist mit allen gängigen Browsern kompatibel, die zusammen mindestens 80 % der Nutzerbasis repräsentieren (aktuelle Versionen von Chrome, Firefox, Edge, Safari).  
- Fehlerbehandlung: Fehlerzustände (z. B. Verbindungsprobleme, ungültige Filter) werden klar und verständlich kommuniziert, ohne dass die Anwendung abstürzt.  
- **Sprache**:
  - Die API-Kommunikation erfolgt in Englisch.  
  - Das Frontend wird zweisprachig (Englisch / Deutsch) bereitgestellt.  
- **Reaktionszeiten**:
  - Benutzerinteraktionen (außer Suchanfragen) sollen innerhalb von 1 Sekunde eine sichtbare Rückmeldung liefern.  
  - Einfache Suchanfragen (z. B. Freitextsuche nach Keywords) müssen in unter 5 Sekunden abgeschlossen sein.  
  - Komplexe geometrische oder kombinierte CQL2-Filter dürfen maximal 1 Minute dauern.  
- **Pagination**: Bei umfangreichen Ergebnismengen erfolgt eine seitenweise Darstellung, um Performance und Übersichtlichkeit zu gewährleisten.  
- **Asynchrones Laden**: Aufwändige Datenabfragen werden parallel und schrittweise geladen, um die Reaktionsfähigkeit der Oberfläche zu erhalten.  

---

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

### 10.4 UI <!-- Justin -->

#### **UI/UX Tech Stack**

Die Implementierung der UI-Komponente erfolgt auf Basis moderner Webtechnologien, die eine hohe Performance, Wartbarkeit und Erweiterbarkeit gewährleisten.  
Die folgende Übersicht fasst die wesentlichen Werkzeuge und Frameworks zusammen und erläutert ihre jeweilige Auswahlbegründung:

- **Framework:** Vue 3 (Composition API) 

- **Build-Tool:** Vite (Node.js 20)  
  Vite bietet sehr schnelle Entwicklungs- und Build-Zeiten durch modernes ESM-Bundling und Hot-Module-Replacement.  
  Dadurch kann die Benutzeroberfläche auch bei größeren Datenmengen performant entwickelt und getestet werden.

- **Programmiersprache:** JavaScript / TypeScript

- **Zustandsverwaltung:** Pinia  
  Pinia dient als zentraler State-Store für Filter, Suchparameter und UI-Status.  
  Es ist die offizielle, moderne Alternative zu Vuex und bietet eine klar typisierbare API sowie einfache Integration in Composition-API-Komponenten.

- **Routing:** Vue Router  
  Der Vue Router ermöglicht die Abbildung komplexer Navigations- und Filterzustände in der URL.  
  Dadurch können Suchergebnisse oder Filterparameter als Deep-Link geteilt und reproduzierbar gespeichert werden.

- **Kartenbibliothek:** MapLibre GL JS  
  MapLibre wurde aufgrund seiner hohen Performance bei der Darstellung großer Geometriedatensätze und der Unterstützung von Vektorkarten gewählt.  
  Im Gegensatz zu alternativen Bibliotheken wie Leaflet bietet MapLibre native Unterstützung für Layer-Styles, Clustering und interaktive Filterung, was den Anforderungen an die Visualisierung räumlicher Extents entspricht.

- **Styling:** Plain CSS mit strukturierter Aufteilung (`reset.css`, `vars.css`, `components/*.css`)  
  Auf den Einsatz eines UI-Frameworks (z. B. Tailwind oder Bootstrap) wird bewusst verzichtet, um volle Kontrolle über Design, Barrierefreiheit und Performance zu behalten.  
  Die Trennung in Reset-, Variablen- und Komponenten-Dateien ermöglicht eine klare Strukturierung und spätere Erweiterbarkeit (z. B. Theme-Unterstützung).

- **Design & Prototyping:** Figma  
  Figma wird zur Erstellung interaktiver Prototypen, Farbschemata und UI-Komponenten eingesetzt.  
  Dadurch kann das Design frühzeitig mit Nutzenden und im Team abgestimmt werden, bevor die Implementierung erfolgt.

- **Testing:** Vitest (Unit-Tests), Playwright (End-to-End-Tests)  
  Vitest wird für Komponententests auf Funktionsebene eingesetzt, um die Logik einzelner Module zu prüfen.  
  Playwright dient der automatisierten End-to-End-Validierung der Benutzerinteraktionen über verschiedene Browser hinweg.  
  Diese Kombination gewährleistet eine stabile, reproduzierbare und testbare Benutzeroberfläche.

- **Qualitätssicherung:** ESLint + Prettier, Lighthouse Performance Audits  
  Durch statische Codeanalyse (ESLint), automatische Formatierung (Prettier) und regelmäßige Lighthouse-Audits wird eine gleichbleibend hohe Codequalität und Performance sichergestellt.

<!-- Optional: - **Internationalisierung:** vue-i18n (Deutsch / Englisch) -->

---

#### **Architektur und Aufbau**

Das Frontend folgt einer komponentenbasierten Architektur, um eine klare Trennung der Verantwortlichkeiten, Wiederverwendbarkeit und Wartbarkeit zu gewährleisten.  
Zentrale Bestandteile sind:

- **Karten-Komponente:**  
  Stellt den zentralen Kartenbereich auf Basis von MapLibre GL JS dar.  
  Zeigt räumliche Extents der STAC-Collections an und ermöglicht Interaktion durch Zoom, Pan, Bounding-Box-Selektion und Hover-Informationen.

- **FilterPanel-Komponente:**  
  Sidebar zur Definition von Suchparametern wie Zeitintervall, Raumfilter, Schlüsselwörtern, Provider und Lizenz.  
  Die Filterparameter werden intern im Pinia-Store verwaltet und in CQL2-kompatible Suchanfragen übersetzt.

- **Ergebnisliste-Komponente:**  
  Scrollbare Listen-/ Gridansicht mit Kurzinfos zu gefundenen Collections (z. B. Titel, Beschreibung, Provider, Lizenz).  
  Bietet Aktionen zum Öffnen der Detailansicht oder zur Navigation in die Karte.

- **Modal/Seiten-Komponente:**  
  Popup- oder Seitenansicht zur Anzeige vollständiger Metadaten einer Collection, einschließlich DOI, Lizenz, zeitlicher und räumlicher Extent sowie verfügbarer Vorschaubilder.

<!-- Optional: - **CompareView-Komponente:** Darstellung zweier Collections im Vergleich (Seiten-an-Seite-Layout). -->

Die Kommunikation mit der STAC-API erfolgt asynchron über HTTPS-Requests.  
Filterparameter werden in den Anfragen nach dem CQL2-Standard übergeben.

---

#### **WBS (Work Breakdown Structure)**

1. **Workspace:** Aufbau der Projekt- und Ordnerstruktur  
2. **Design:** Definition des Farbsystems und Erstellung eines Figma-Mockups der Hauptkomponenten  
3. **Implementierung:** Überführung der entworfenen Komponenten in das Frontend  
4. **Funktionalität (Zusammenarbeit mit API):** Anbindung der Komponenten an die STAC-API und Implementierung der Such- und Filterlogik  

**Durchgängige Aufgaben:**
- **Revisions:**  
  - Design-Optimierung und kontinuierliche Verbesserung der Benutzerfreundlichkeit  
  - Qualitätssicherung durch Testing und Code Reviews  

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
