# Pflichtenheft STAC Atlas

## 1. Zielbestimmung (ALLE) <!-- Jakob -->

Das Projekt STAC Atlas zielt darauf ab, eine zentralisierte Plattform zur Verwaltung, Indexierung und Bereitstellung von STAC-Collection-Metadaten zu entwickeln. In der heutigen Geodaten-Landschaft existieren zahlreiche dezentrale STAC-Kataloge und -APIs verschiedener Datenanbieter, was die Auffindbarkeit und den Zugriff auf relevante Geodaten-Collections erschwert. STAC Atlas adressiert dieses Problem, indem es als zentrale Anlaufstelle fungiert, die Metadaten aus verschiedenen Quellen aggregiert und durchsuchbar macht.

Die Plattform ermöglicht es Nutzern, Collections anbieterübergreifend zu suchen, zu filtern und zu vergleichen, ohne jeden einzelnen STAC-Katalog manuell durchsuchen zu müssen. Durch die Implementierung standardkonformer Schnittstellen (STAC API) wird sowohl die programmatische Nutzung durch Entwickler als auch die interaktive Nutzung über eine Web-Oberfläche ermöglicht. Dies steigert die Effizienz bei der Arbeit mit Geodaten erheblich und fördert die Wiederverwendbarkeit von Datenressourcen.

Das Projekt besteht aus vier Hauptkomponenten, die nahtlos zusammenarbeiten:
- **Crawler** – erfasst automatisch Daten aus verschiedenen STAC-Katalogen und hält diese aktuell
- **Datenbank** – speichert Metadaten persistent und ermöglicht effiziente Abfragen
- **STAC API** – ermöglicht standardisierten, programmatischen Zugriff auf die indexierten Collections
- **UI** – bietet eine nutzerfreundliche Web-Oberfläche mit visueller Suche und interaktiver Kartenansicht

### 1.1 Abnahmekriterien

Die Abnahmekriterien definieren die zwingend erforderlichen Funktionalitäten des Systems. Diese Anforderungen müssen vollständig erfüllt werden, damit das Projekt als erfolgreich gilt. Sie bilden den Kern der Systemfunktionalität und sind für den produktiven Einsatz unerlässlich.

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
Die Craler-Komponente soll eine hohe Effizienz, Stabilität und Skalierbar sein, um große Mengen an STAC-Katalogen und -APIs regelmäißg und zuverlässig zu erfassen.

#### Crawling Leistung
Der Crawler soll in der Lage sein aus dem STAC-Index Quellen innerhlab einer Woche zu analysieren. In folge dessen soll auch die Aktualisierung aller bekannter und neuer Quellen maximal eine Woche betragen. Die einzelnen STAC-Collections sollen jeweils innerhalb von < 5 Sekunden abgerufen und verarbeitet werden. Zudem wollen wir selber den Crawler Rate-Limiting einhalten, um die externen Dienste nicht zu überlasten (z.B. max. 5 Request/Sekunde pro Quelle).

#### Crawling Parallelität und Skalierbarkeit
Die Implementierung soll asynchrones und paralleles Crawling unterstützten. Es wird nur ein einzelene Crawler-Instanz sein, um die Komplexität mit Datenbankkonflikten zu vermeiden. Es wird darauf geachtet eine Modulare weise zu programmieren um in Zukunft horizontale Skalierung mit mehren Cralwern möglich zu machen.

#### Crawling Zuverlässigkeit unf Fehlertoleranz
Der Crawler darf bei fehlerhaften oder inaktiven Quellen nicht vollständig abbrechen. Die Quellen, die dreimal hintereinander fehlschlagen, sollen als inaktiv bis zum Crawling Event behandelt werden. Fehler und Wiederholungen müssen in protokolliert werden.

#### Ressourcenverbrauch
Der Crawler darf im Normalbetrieb auf einer Standard-VM mit (2 vCPUs,8GB RAM) betrieben werden. Dies ist der alleinstehende Verbrauch. Eine CPU-Auslatung von über 80% im Mittel einer Woche darf nicht überschritten werden. RAM Verbrauch ist maximal 4GB pro Crawler.

#### Wartbarkeit und Monitoring
Die Crawling-Durchläufe sollen über Logging und Metriken wie der Anzahl gecrawlter Quellen, Anzahl gecrawlter Collections und Laufzeit überwacht werden. Die Metriken werden nur über eine Lokale Datei von einem System-Admin abrufbar sein.

#### Abnahmekriterien

- Der Crawler kann mindestens einen realen STAC Katalog vollständig traversieren.
- Collections werden in PostgreSQL mit PostGIS persistiert.
- Die Validierung erfolgt gegen das STAC JSON Schema und auftretende Fehler werden protokolliert.
- Bei Fehlern sind Wiederholungsversuche implementiert und dauerhaft fehlerhafte Quellen können als inaktiv markiert werden.
- Strukturierte Logs sind vorhanden.

### 6.2 Datenbank <!-- Sönke -->

#### 6.2.1 Funktionale Leistungsanforderungen

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

#### 6.2.2 Nicht-funktionale Leistungsanforderungen

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

#### 6.2.3 Zusammenfassung

Die Datenbankkomponente muss somit nachweislich in der Lage sein, große Mengen an STAC-Kollektionen performant, skalierbar und zuverlässig zu speichern und zu durchsuchen. Die hier genannten Werte dienen als verbindliche, messbare Leistungsziele für die Implementierung, Abnahme und spätere Systemtests.

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

## 7. Qualitätsanforderungen (ALLE) <!-- Vincent -->
- Backend Unit-Test mit jest
- Weiterführende Integrationstests
- Verwendung von GitHub-Pipeline
- STAC Validator
- STAC API Validator

## 8. Sonstige nichtfunktionale Anforderungen (ALLE) <!-- Jakob -->

### 8.1 Dokumentation und Code-Qualität
- Code-Dokumentation mit JSDoc (JavaScript/TypeScript)
- Repository-Dokumentation (README, Setup-Anleitungen)
- API-Dokumentation via OpenAPI/Swagger
- Bedienungsanleitung für Endnutzer
- Linter: ESLint (JavaScript/TypeScript)
- Code-Formatierung: Prettier (JavaScript/TypeScript)
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
Der Crawler durchsucht STAC Index nach STAC Kataloge und STAC APIs. Dabei sollen mehr als 95% der Collections erfolgreich erfasst werden.
Das Crawling erfolgt rekursiv, sodass Collections in beliebiger Tiefe innerhalb verschachtelter Kataloge erkannt werden. Es werden ausschließlich Collections und keine Items erfasst. Die Crawling Vorgänge extrahieren die relevanten Metadaten jeder Collection (6.1.1.3) und speichern sie zusammen mit der Quell-URL, dem Katalognamen und dem Zeitstempel des letzten Crawls.

Es werden alle stabilen STAC-Versionen, durch Migration unterstützt. 
Eine Crawling-Plan (Schedule) ermöglicht die zeitliche Steuerung einzelner Crawl-Vorgänge. Es soll eine wöchentliche Aktualisierungen des Indexes durchgeführt werden.

Für die Umsetzung werden PySTAC und asyncio zur Verarbeitung genutzt. Die Ergebnisse werden mittels PypgSTAC in einer PostgreSQL-Datenbank gespeichert.

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

### 9.4 UI-Komponente <!-- Simon -->
Die UI-Komponente stellt die grafische Benutzeroberfläche (GUI) der Plattform dar. Sie dient als Schnittstelle für die interaktive Nutzung der indexierten STAC-Sammlungen. Die Kernaufgabe ist die Gewährleistung einer effizienten Suche, Filterung und Exploration der Sammlungen.
Zur Stabilität trägt ein Fehlerbehandlungssystem mit Retry- und Backoff-Mechanismen bei. Quellen, die wiederholt fehlschlagen, werden nach Erreichen einer konfigurierbaren Fehlerschwelle automatisch übersprungen oder auf eine Blacklist gesetzt.
Außerdem werden alle Crawl-Aktivitäten protokolliert, um Transparenz und Nachvollziehbarkeit zu gewährleisten.

Funktionen beinhalten die Übersetzung der Benutzereingaben (Filter) in CQL2-Suchanfragen und die visuelle Darstellung der Daten in einer Liste sowie auf einer Karte.  
Die Umsetzung erfolgt in VueJS v3 und soll eine potenzielle zukünftige Integration in den bestehenden STAC-Index ermöglichen.

Der Fokus liegt auf der Suche und Darstellung von Collections.

### 9.4.1 UI <!-- Simon -->
Bereitstellung einer intuitiven Suchoberfläche:
- Filter (Queryables): Nutzer können Filterkriterien definieren.
  - CQL2-Generierung: Die UI komponiert die Eingaben zu einem CQL2-Ausdruck und übermittelt diesen an den Server.
  - Karten-Filter: Filterung nach räumlichen Bereichen (Bounding Box) und Zeiträumen.
- Kartenvisualisierung: Die räumliche Ausdehnung der Suchergebnisse wird auf einer Karte visualisiert.
- Ergebnisdarstellung:
  - Die Inspektion der Metadaten einzelner Sammlungen ist möglich.
  - Quelle: Ein Link zum originalen STAC-Katalog (Quell-API) wird pro Sammlung bereitgestellt.
  - Paginierung: Für große Treffermengen steht eine erweiterte Seitenansicht zur Verfügung.

### 9.4.2 UX <!-- Simon -->
- Performance:
  - Interaktion: Sichtbare Reaktion auf Standardinteraktionen (z. B. Klicks) innerhalb von 1 Sekunde.
  - Suche: Abschluss typischer Suchanfragen innerhalb von 5 Sekunden (Ladezeit).
- Barrierefreiheit: Es werden farbenblindenfreundliche Farben verwendet.
- Browser-Kompatibilität: Funktional und getestet für 80 % der gängigen Browser.
- Fehlerbehandlung: Klare, informative Fehlermeldungen.
- Sprache: Alle Komponenten sind auf Englisch, alternativ auf Deutsch verfügbar.


## 10. Implementierungsdetails (ALLE)
<!-- Hier bitte pro Gruppe eintragen, wie genau die Teilprodukte implementiert werden sollen.
Also auch sowas wie verwendete Technologie, Teilschritte (Meilensteine?) etc.. WBS wäre auch nett-->
### 10.1 Crawler

Ziel des Crawler‑Moduls ist die automatische Erfassung, Validierung und Speicherung von STAC‑Collections aus verteilten Quellen in einer PostgreSQL‑Datenbank mit PostGIS‑Erweiterung. Der Crawler soll robust gegenüber transienten Fehlern sein (konfigurierbare Retries mit Backoff), Monitoring‑Metriken liefern und idempotente Persistenz gewährleisten, damit wiederholte Crawls keine Duplikate erzeugen.

#### Technologien

Der Crawler wird als Node.js‑Anwendung konzipiert wir werden JavaScript (vielleicht TypeScript) nutzten, um bessere Wartbarkeit und Weiternetwicklung innerhalb der Gruppe zu erreichen und die Probleme mit bestimmten Versionen von z.B. Python zu unterbinden. Für das STAC‑Handling kommen [stac-js](https://github.com/moregeo-it/stac-js) und [stac-migrate](https://github.com/stac-utils/stac-migrate) zum Migrieren älterer STAC‑Versionen zum Einsatz. Für HTTP‑Zugriffe eignen sich axios oder got (unterstützen Timeouts und Retries). Alternativ kann node‑fetch verwendet werden. Beim Crawling und Queueing sind für komplexe Szenarien Frameworks wie Crawlee (Apify) oder vergleichbare Lösungen mit integrierter Queue/Retry‑Logik empfehlenswert, für leichtere Implementierungen bieten sich p‑queue oder Bottleneck zur Steuerung von Parallelität und Rate‑Limits an. Zur zeitgesteuerten Ausführung kann lokal node‑cron genutzt werden. Die Validierung erfolgt via JSON‑Schema Validator (z. B. ajv) unter Verwendung der offiziellen STAC‑Schemas. Als Datenbank wird PostgreSQL mit PostGIS empfohlen. Die Anbindung kann mit node‑postgres (pg) erfolgen. Für Logging und Monitoring werden strukturierte Logs eingesetzt. Zur Auslieferung und Reproduzierbarkeit der Laufzeitumgebung wird Docker genutzt.

#### Architektur

Die Architektur ist modular aufgebaut und besteht aus folgenden Komponenten: Der Source Manager persistiert Quellendaten (URL, Typ, Crawl‑Intervall, Status, letzte Ausführung) und stellt eine Admin‑API zum Aktivieren/Deaktivieren sowie für manuelle Trigger bereit. Der Scheduler plant die periodischen Crawls gemäß der konfigurierten Intervalle. Die Crawler Engine lädt STAC‑Kataloge und STAC‑APIs asynchron, folgt relevanten Link‑Relationen (child, catalog, collection) und beachtet dabei Rate‑Limits, mögliche robots.txt‑Regeln sowie Parallelitätsgrenzen. Der Metadata Extractor / Normalizer migriert STAC‑Versionen mit stac‑migrate, modelliert Objekte (z. B. mit stac‑js) und extrahiert die relevanten Felder. Der Validator prüft die Objekte gegen die STAC JSON‑Schemas (z. B. mit ajv) und protokolliert Validierungsfehler samt Persistenz der Rohdaten zur Analyse. Der Database Writer verwaltet Indizes und Transaktionen. Die Logger / Monitor‑Komponente erfasst Fehler, Durchsatz, Latenzen und stellt Health‑Checks bzw. Metriken bereit. Optional existiert eine Admin UI / API zur Anzeige von Quellen, Fehlerlogs und für manuelle Resets.

#### Ablauf

1. Initialisierung: Beim Start liest der Crawler die aktiven Quellen aus der Datenbank und plant die Crawls entsprechend der konfigurierten Intervalle.

2. Start eines Crawls (pro Quelle): Für jede Quelle wird deren Typ bestimmt (statischer STAC‑Catalog JSON, STAC API mit search/collections‑Endpunkten oder Verzeichnisstruktur) und die Start‑URL geladen — unter Verwendung von Timeouts und konfigurierten Retries.

3. Rekursives Crawling und Pagination: Die Engine folgt Link‑Rela‑Typen wie child, catalog und collection sowie paginiert bei STAC APIs; neue URLs/Tasks werden in die Queue aufgenommen und asynchron abgearbeitet, wobei Rate‑Limits und Parallelität berücksichtigt werden.

4. Migration & Modeling: Gefundene STAC‑Objekte werden mit stac‑migrate in eine einheitliche STAC‑Version überführt und anschließend in ein internes Datenmodell (z. B. stac‑js‑Objekt oder DTO) umgewandelt.

5. Extraktion & Normalisierung: Aus den STAC‑Objekten werden Schlüsselattribute extrahiert (z. B. id, title, description, extent – bbox und temporal, providers, license, assets, HREFs). Die BBOX‑Angaben werden in eine PostGIS‑Geometrie konvertiert (z. B. Envelope/Polygon), zeitliche Angaben als TIMESTAMPTZ abgelegt.

6. Validierung: Die Objekte werden gegen die STAC JSON‑Schemas validiert; bei Nicht‑Konformität werden die Fehler protokolliert und die Rohdaten je nach Policy entweder gespeichert, markiert oder ignoriert.

7. Persistenz: Validierte Collections werden idempotent in die collections‑Tabelle geschrieben (Upsert). Zusätzlich wird sources.last_crawled aktualisiert. Optional können Audit/History‑Einträge erzeugt werden oder Änderungen nur dann persistiert werden, wenn sich der Inhalt (z. B. hash(collection)) geändert hat.

8. Fehlerbehandlung: Transiente Fehler werden mit einem exponentiellen Backoff mehrfach (z. B. bis zu 3 Versuche) neu versucht; bei dauerhaften Fehlern wird die Quelle markiert und ein Alert/Notification erzeugt. Es soll eine Dead‑Letter‑Queue für manuelle Analyse existieren.

9. Monitoring: Der Crawler sammelt Metriken zu erfolgreich verarbeiteten Objekten, Fehlern, Laufzeiten und stellt einen Health‑Endpoint (/metrics) zur Verfügung, damit Monitoring‑Systeme (z. B. Prometheus/Grafana) diese Metriken abfragen können.

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

#### **UI/UX Tech Stack**  <!-- Justin -->

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

#### **Architektur und Aufbau** <!-- Justin -->

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

Die Kommunikation mit der STAC-API erfolgt asynchron über HTTPS-Requests.  
Filterparameter werden in den Anfragen nach dem CQL2-Standard übergeben.

#### **WBS (Work Breakdown Structure)**  <!-- Justin -->

1. **Workspace:** Aufbau der Projekt- und Ordnerstruktur  
2. **Design:** Definition des Farbsystems und Erstellung eines Figma-Mockups der Hauptkomponenten  
3. **Implementierung:** Überführung der entworfenen Komponenten in das Frontend  
4. **Funktionalität (Zusammenarbeit mit API):** Anbindung der Komponenten an die STAC-API und Implementierung der Such- und Filterlogik  

**Durchgängige Aufgaben:**  <!-- Justin -->
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
