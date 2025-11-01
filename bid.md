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

Die Datenbankkomponente bildet das zentrale Rückgrat der gesamten Datenverwaltung und dient zur strukturierten, effizienten und STAC-konformen Speicherung sämtlicher durch den Crawler erfassten (Meta-) Daten. Grundlage ist eine relationale PostgreSQL-Datenbank mit PostGIS-Erweiterung, um sowohl klassische als auch räumliche Abfragen performant verarbeiten zu können.  
Die Struktur ist so aufgebaut, dass sie die in STAC definierten Entitäten (Catalog, Collection, Extensions, Keywords usw.) logisch und referenziell abbildet. Sämtliche Primär- und Fremdschlüsselbeziehungen gewährleisten dabei eine hohe Datenintegrität und ermöglichen zugleich schnelle Abfragen über verschiedene Zugriffspfade.  

Für eine bessere Wartbarkeit und klare Trennung der logischen Einheiten ist die Datenbank in **mehrere thematisch abgegrenzte Tabellenbereiche** gegliedert: *Catalogs*, *Collections* sowie allgemeine, nicht spezifische Tabellen.  
Die Tabellen enthalten jeweils Primärschlüssel zur eindeutigen Identifikation sowie Zeitstempel-Felder zur Nachvollziehbarkeit von Änderungen. Darüber hinaus sind alle textbasierten Felder, Geometrien und Zeitinformationen für effiziente Suchvorgänge indexiert.  

---

### Tabellenbereich „Catalogs“

Der Bereich **Catalogs** bildet die hierarchische Struktur der STAC-Kataloge ab. Jeder Katalog speichert seine Metadaten inklusive Versionierung, Typ, Beschreibung und zugehöriger Links. Über Zwischentabellen werden Keywords sowie Erweiterungen (STAC Extensions) referenziert.  

#### catalog
- **id**  
- stac_version  
- type  
- title  
- description  
- created_at  
- updated_at  

Die Haupttabelle `catalog` bildet den zentralen Einstiegspunkt der Kataloghierarchie. Sie speichert allgemeine Metadaten und dient als Ankerpunkt für die zugehörigen Relationen.

#### catalog_links
- **id**  
- catalog_id  
- rel  
- href  
- type  
- title  

Die Tabelle `catalog_links` beschreibt die Verknüpfungen zwischen einzelnen Katalogen oder externen Referenzen und implementiert damit die STAC-Link-Struktur.

#### catalog:keywords
- **catalog_id**  
- **keyword_id**  

Relationstabelle zur Mehrfachzuordnung von Keywords an Catalogs. Dadurch können Sammlungen gezielt über Schlagwörter gefiltert werden. Diese Tabelle wird benötigt, da hier eine (n:n)-Beziehung vorliegt.

#### catalog:stac_extension
- **catalog_id**  
- **stac_extension_id**  

Diese Relation beschreibt, welche STAC-Erweiterungen in einem bestimmten Katalog verwendet werden. Hier wird eine eigene Tabelle benötigt da hier eine (n:n)-Beziehung zwischen den beiden tabellen vorliegt.

---

### Tabellenbereich „Collections“

Der Bereich **Collections** bildet die Sammlungen von Collections innerhalb eines Katalogs ab. Jede Collection enthält spezifische Metadaten, räumliche Ausdehnungen, zeitliche Intervalle sowie referenzierte Provider, Assets und Summaries.  

#### collection
- **id**  
- stac_version  
- type  
- title  
- description  
- license  
- created_at  
- updated_at  
- spatial_extend  
- temporal_extend_start  
- temporal_extend_end  

Die `collection`-Tabelle dient als zentrales Objekt für die Speicherung der Sammlungsinformationen. Neben den textuellen Attributen werden hier räumliche und zeitliche Dimensionen gespeichert, die für Filter- und Suchoperationen entscheidend sind.  

#### collection_summaries
- **id**  
- collection_id  
- name  
- kind  
- range_min  
- mange_max  
- set_value  
- json_schema  

Diese Tabelle speichert statistische oder beschreibende Zusammenfassungen einzelner Collections. Über den Fremdschlüssel `collection_id` wird sichergestellt, dass alle Summary-Werte eindeutig zugeordnet werden können.  

#### collection:assets
- **collection_id**  
- **asset_id**  
- collection_asset_roles  

Dient der Verknüpfung von Collections mit ihren zugehörigen Assets, einschließlich der Angabe spezifischer Rollen. Dies ist nötig, da hier eine (n:n)-Beziehung vorliegt.

#### collection:keywords
- **collection_id**  
- **keyword_id**  

Relationstabelle zur Mehrfachzuordnung von Keywords an Collections. Dadurch können Colletions gezielt über Schlagwörter gefiltert werden. Diese Tabelle wird benötigt, da hier eine (n:n)-Beziehung vorliegt.

#### collection:stac_extension
- **collection_id**  
- **stac_extension_id**  

Relationstabelle zur Mehrfachzuordnung von stac_extension an Collections. Dadurch können Colletions gezielt über die stac_extension gefiltert werden. Diese Tabelle wird benötigt, da hier eine (n:n)-Beziehung vorliegt.

#### collection:providers
- **collection_id**  
- **provider_id**  
- collection_provider_roles  

Definiert die Zuordnung von Datenanbietern (Providern) zu einzelnen Collections. Über das Feld `collection_provider_roles` können die jeweiligen Rollen (z. B. „producer“, „licensor“) eindeutig beschrieben werden.

---

### Allgemeine und Hilfstabellen

Neben den spezifischen Tabellen für Catalogs und Collections existieren mehrere **nicht-spezifische Hilfstabellen**, die für eine einheitliche Referenzierung, Nachverfolgung und Filterung verwendet werden. Diese werden benötigt, da diese Tabellen mit den Tabellen `collections` und `catalogs` eine n:n-Beziehung haben und somit die datenbank unnötig viele Daten speichern würde wenn man diese Daten direkt in einer der beiden Tabellen referenzieren würde.

#### providers
- **id**  
- provider  

Speichert die Informationen zu Datenanbietern, Organisationen oder Institutionen.  

#### keywords
- **id**  
- keyword  

Liste aller verwendeten Schlagwörter, die in unterschiedlichen Kontexten wiederverwendet werden können.  

#### stac_extensions
- **id**  
- stac_extension  

Verwaltet die in STAC definierten Erweiterungen, die sowohl von Catalogs als auch von Collections genutzt werden können.  

#### crawllog_catalog
- **id**  
- catalog_id  
- last_crawled  

Protokolliert die Zeitpunkte der letzten Crawling-Vorgänge für jeden Katalog.  

#### crawllog_collection
- **id**  
- collection_id  
- last_crawled  

Analog zur vorherigen Tabelle dient `crawllog_collection` der Nachverfolgung der Crawling-Zyklen für Collections.  

---

### Zusammenfassung

Mit dieser Datenbankstruktur wird eine **vollständig STAC-kompatible, referenzielle und hochperformante Datenspeicherung** gewährleistet.  
Durch den modularen Aufbau mit klar getrennten Tabellenbereichen, Mehrfachbeziehungen und Protokollierungseinheiten ist die Architektur sowohl **skalierbar als auch wartungsfreundlich**.  
Indizes auf allen relevanten Attributen (IDs, Zeitstempel, Textfelder und Geometrien) sowie die Integration von PostgreSQL-TSVector und PostGIS stellen sicher, dass **alle Such-, Filter- und Analyseoperationen** in kurzer Zeit und mit minimalem Ressourcenverbrauch ausgeführt werden können.

<!-->
### bezüglich den catalogs

#### catalog
- **id**
- stac_version
- type
- title
- description
- created_at
- updated_at

#### catalog_links
- **id**
- catalog_id
- rel
- href
- type
- title

#### catalog:keywords
- **catalog_id**
- **keyword_id**

#### catalog:stac_extension
- **catalog_id**
- **stac_extension_id**


### bezüglich den collections

#### collection
- **id**
- stac_version
- type
- title
- description
- license
- created_at
- updated_at
- spatial_extend
- temporal_extend_start
- temporal_extend_end

#### collection_summaries
- **id**
- collection_id
- name
- kind
- range_min
- mange_max
- set_value
- json_schema

#### collection_assets
- **collection_id**
- **asset_id**
- collection_asset_roles

#### collection:keywords
- **collection_id**
- **keyword_id**

#### collection:stac_extension
- **collection_id**
- **stac_extension_id**

#### collection:providers
- **collection_id**
- **provider_id**
- collection_provider_roles

#### collection_links
- **id**
- collection_id
- rel
- href
- type
- title


### nicht spezifische tabellen

#### providers
- **id**
- provider

#### keywords
- **id**
- keyword

#### stac_extensions
- **id**
- stac_extension

#### crawllog_catalog
- **id**
- catalog_id
- last_crawled

#### crawllog_collection
- **id**
- collection_id
- last_crawled
<-->


## 6. Leistungsanforderungen (ALLE)

### 6.1 Crawler <!-- Humam -->

### 6.2 Datenbank <!-- Sönke -->

#### Funktionale Leistungsanforderungen

1. **Antwortzeiten der Datenbankabfragen**  
   - Standardabfragen (z. B. Abruf einer Collection nach ID) müssen innerhalb von **< 5 Sekunde** beantwortet werden.  
   - Komplexe Suchanfragen mit Filtern (z. B. Freitextsuche, räumliche und zeitliche Filterung) müssen innerhalb von **≤ 30 Sekunden** abgeschlossen sein.  
   - Langlaufende Abfragen dürfen eine maximale Bearbeitungszeit von **≤ 60 Sekunden** nicht überschreiten.

2. **Gleichzeitige Zugriffe (Concurrency)**  
   - Das System muss mindestens **50 gleichzeitige Leseanfragen** und **10 gleichzeitige Schreibanfragen** ohne merkliche Leistungseinbußen (< 10 % längere Antwortzeit) verarbeiten können.  
   - Gleichzeitige API-Anfragen dürfen keine Deadlocks oder Timeout-Fehler erzeugen.

3. **Suchindex und Filterleistung**  
   - Die Datenbank muss einen Volltextindex bereitstellen, der Suchabfragen über Metadatenfelder (`title`, `description`, `keywords`, `providers`) innerhalb von **≤ 3 Sekunden** ermöglicht.  
   - CQL2-Filter (Basic) müssen vollständig innerhalb von **≤ 5 Sekunden** evaluiert werden können.  

---

#### Nicht-funktionale Leistungsanforderungen

1. **Skalierbarkeit**  
   - Das System muss bei einer Verdopplung der Datensatzmenge (z. B. von 1 Mio. auf 2 Mio. Collections) einen **Leistungsabfall von höchstens 20 %** bei Abfragezeiten aufweisen.  
   - Horizontales Skalieren (z. B. über mehrere Container/Instanzen) muss ohne Systemneustart möglich sein.

2. **Datenpersistenz und Verfügbarkeit**  
   - Die Datenbankverfügbarkeit (Uptime) muss im Dauerbetrieb bei **≥ 99 %** liegen.  
   - Nach einem Systemausfall dürfen maximal **1 Minute an Datenverlust** (Write-Ahead-Log oder Transaktionsverlust) auftreten.

3. **Datenintegrität und Fehlerbehandlung**  
   - Transaktionen müssen atomar ausgeführt werden (ACID-konform).  
   - Schreibfehler oder Integritätsverletzungen dürfen in **< 0,1 %** der Transaktionen auftreten.  

4. **Speichereffizienz**  
   - Der Speicherbedarf pro STAC-Collection (inkl. Metadaten und Indexeinträge) darf **50 kB** im Durchschnitt nicht überschreiten.  
   - Die Datenbank muss mindestens **10 Millionen Collections** verwalten können, ohne dass die Antwortzeiten die unter Punkt 1 definierten Grenzwerte überschreiten.

---

#### Zusammenfassung

Die Datenbankkomponente muss somit nachweislich in der Lage sein, große Mengen an STAC-Kollektionen performant, skalierbar und zuverlässig zu speichern und zu durchsuchen. Die hier genannten Werte dienen als verbindliche, messbare Leistungsziele für die Implementierung, Abnahme und spätere Systemtests.


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

Die Datenbankkomponente stellt die zentrale Grundlage für die Speicherung, Verwaltung und Abfrage aller vom Crawler erfassten Metadaten dar. Sie dient der persistenten Ablage sämtlicher Inhalte, einschließlich der vollständigen STAC-JSON-Strukturen, und ermöglicht deren effiziente Weiterverarbeitung innerhalb der Gesamtarchitektur. Als Datenbanksystem wird **PostgreSQL** in Kombination mit der Erweiterung **PostGIS** eingesetzt, um sowohl relationale als auch geographische Abfragen performant unterstützen zu können.

Die Struktur der Datenbank ist in mehrere logisch voneinander getrennte Teiltabellen gegliedert. Neben der Haupttabelle, in der alle grundlegenden Informationen abgelegt werden, existieren die Tabellen `collection`, `catalog`, `keywords`, `source` sowie `summaries`. Diese Unterteilung sorgt für eine klare Trennung der Metadatenbereiche und ermöglicht eine performante Abfrage durch gezielte Normalisierung. Über Primär- und Fremdschlüsselbeziehungen sind die Tabellen miteinander verknüpft, sodass alle relevanten Daten effizient referenziert werden können.

Um eine schnelle und ressourcenschonende Datensuche zu gewährleisten, werden verschiedene Indizes eingerichtet. Neben klassischen **B-Tree-Indizes** für ID- und Zeitspalten kommen **GIN-** und **GiST-Indizes** zum Einsatz, um Text- und Geometrieabfragen zu optimieren. Dies betrifft insbesondere die Felder für Titel, Beschreibung, Keywords, zeitliche Angaben sowie die räumlichen Geometrien. Die Implementierung einer **Volltextsuche** auf Basis von **PostgreSQL-TSVector** ermöglicht zudem eine performante Freitextsuche über Titel, Beschreibungen und Schlagwörter, einschließlich Relevanzbewertung und optionaler Mehrsprachigkeit.

Für die geographische Filterung wird die räumliche Ausdehnung eines Datensatzes als **PostGIS-Geometrieobjekt** gespeichert. Dadurch sind Abfragen nach Bounding Boxes, Überschneidungen, Entfernungen oder räumlichem Enthaltensein möglich. Zusätzlich werden Start- und Endzeitpunkte in separaten Spalten abgelegt, um zeitbasierte Filterungen zu unterstützen. Ein zusammengesetzter Index auf diesen Zeitfeldern gewährleistet eine effiziente Ausführung von Abfragen über Zeiträume hinweg.

Ein zentrales Merkmal der Datenbankkomponente ist die **Übersetzung von CQL2-Ausdrücken** in entsprechende SQL-WHERE-Bedingungen. Diese Funktionalität erlaubt es, standardisierte Filterausdrücke (z. B. aus STAC-konformen API-Abfragen) direkt in SQL-Statements umzusetzen, wodurch eine hohe Kompatibilität und Erweiterbarkeit erreicht wird.

Zur Unterstützung inkrementeller Updates ist die Datenbank so ausgelegt, dass der Crawler neue oder geänderte Datensätze erkennen und gezielt aktualisieren kann, ohne dass ein vollständiger Neuimport erforderlich ist. Änderungen werden anhand eindeutiger Identifikatoren identifiziert, wodurch sowohl die Datenintegrität als auch die Verarbeitungsgeschwindigkeit verbessert werden.

Gelöschte Datensätze werden in der Datenbank **nicht physisch entfernt**, sondern erhalten das Attribut `active = false`. Auf diese Weise bleibt der historische Zustand der Datensätze erhalten, was eine revisionssichere Nachverfolgung und spätere Analyse ermöglicht. Dieses Vorgehen unterstützt zudem eine transparente Datenhaltung und erleichtert eventuelle Wiederherstellungen.

Insgesamt ermöglicht die Datenbankkomponente eine robuste, skalierbare und abfrageoptimierte Verwaltung der Metadaten. Durch den Einsatz von Indizes, Geometrieunterstützung und standardisierten Filtermechanismen (CQL2) bildet sie die Grundlage für eine performante Bereitstellung der Daten innerhalb der gesamten Systemarchitektur.


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

### 10.2 Implementierungsdetails der Datenbankkomponente <!-- Sönke -->

Die Implementierung der Datenbankkomponente erfolgt auf Basis von **JavaScript** unter Verwendung der **Node.js**-Laufzeitumgebung. Für die Interaktion mit der Datenbank wird ein objekt-relationales Mapping (ORM) eingesetzt, um den Zugriff auf die PostgreSQL-Datenbank zu abstrahieren und gleichzeitig die Konsistenz der Daten zu gewährleisten. Die Bibliothek **Prisma ORM** wird hierfür bevorzugt, da sie sowohl eine typsichere Datenmodellierung als auch automatisierte Migrationen unterstützt.

Der Datenbankzugriff erfolgt asynchron und wird durch Connection-Pooling optimiert, um parallele Abfragen effizient zu verarbeiten. Zur Unterstützung geographischer Abfragen wird die PostgreSQL-Erweiterung **PostGIS** integriert, die direkt über das ORM oder über native SQL-Befehle angesprochen werden kann.

Die Implementierung folgt einem klar strukturierten Vorgehen in mehreren Phasen, die jeweils definierte Meilensteine umfassen und eine schrittweise Integration in das Gesamtsystem ermöglichen.

#### Verwendete Technologien
- **NodeJS 20**  
- **PostgreSQL** als relationales Datenbanksystem  
- **PostGIS** für Geometrie- und Raumdaten  
- **Prisma ORM** zur Datenmodellierung und Migration  
- **Express.js** als REST-Schnittstelle zur Integration mit dem Crawler  
- **Jest** als Testumgebung
- **Docker** zur Bereitstellung der Entwicklungs- und Testumgebung  

#### Phasen und Meilensteine

1. **Analyse- und Entwurfsphase (M1)**  
   In dieser Phase werden das Datenmodell und die Schnittstellenanforderungen definiert. Die STAC-konformen Metadatenstrukturen werden analysiert und in ein relationales Schema überführt. Hierzu wird ein erstes **Prisma-Datenmodell** erstellt, das alle Tabellen (`collection`, `catalog`, `keywords`, `source`, `summaries`) sowie deren Beziehungen enthält.  
   Ergebnis: Validiertes ER-Diagramm und initiales Datenmodell (`schema.prisma`).

2. **Implementierungsphase (M2)**  
   Aufbauend auf dem Datenmodell wird die Datenbank über Prisma-Migrationen aufgebaut. Dabei werden alle Tabellen und Fremdschlüsselbeziehungen erzeugt.  
   Parallel werden erste API-Endpunkte über **Express.js** implementiert, um einfache CRUD-Operationen zu testen.  
   Ergebnis: funktionierendes Datenbankschema mit Zugriff über ORM und API-Testendpunkte.

3. **Integration mit dem Crawler (M3)**  
   In dieser Phase wird eine Importkomponente entwickelt, die die vom Crawler gelieferten **STAC-JSON-Dateien** einliest, validiert und in die Datenbank einfügt.  
   Der Importprozess erkennt über eindeutige URLs, ob Datensätze neu, geändert oder inaktiv sind, und führt inkrementelle Updates durch.  
   Ergebnis: stabile Datenübernahme mit Differenzabgleich und Logging.

4. **Abfrage- und Optimierungsphase (M4)**  
   Anschließend werden die Such- und Filtermechanismen implementiert. Dazu gehört die Integration einer **Volltextsuche** auf Basis von PostgreSQL-TSVector, die Anbindung von **PostGIS** für Bounding-Box- und Distanzabfragen sowie die Umsetzung einer Übersetzungsschicht für **CQL2-Filterausdrücke**.  
   Ergebnis: performante Such- und Filterfunktionen mit optimierten Indizes.

5. **Deployment und Dokumentation (M6)**  
   Die produktive Bereitstellung erfolgt über **Docker Compose** <!-- , wobei separate Umgebungen für Entwicklung und Produktion eingerichtet werden.-->
   Das Prisma-Schema, die Migrationsdateien und die API-Routen werden versioniert und dokumentiert. Eine technische Dokumentation beschreibt die Struktur, Indexierung und Updateprozesse der Datenbank.  
   Ergebnis: einsatzbereite, dokumentierte Datenbankkomponente.


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
