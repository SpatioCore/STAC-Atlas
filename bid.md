# Pflichtenheft STAC Atlas

## 1. Zielbestimmung <!-- Jakob -->

Das Projekt STAC Atlas zielt darauf ab, eine zentralisierte Plattform zur Verwaltung, Indexierung und Bereitstellung von STAC-Collection-Metadaten zu entwickeln. In der heutigen Geodaten-Landschaft existieren zahlreiche dezentrale STAC-Kataloge und -APIs verschiedener Datenanbieter, was die Auffindbarkeit und den Zugriff auf relevante Geodaten-Collections erschwert. STAC Atlas adressiert dieses Problem, indem es als zentrale Anlaufstelle fungiert, die Metadaten aus verschiedenen Quellen aggregiert und durchsuchbar macht.

Die Plattform ermöglicht es Nutzern, Collections anbieterübergreifend zu suchen, zu filtern und zu vergleichen, ohne jeden einzelnen STAC-Katalog manuell durchsuchen zu müssen. Durch die Implementierung standardkonformer Schnittstellen (STAC API) wird sowohl die programmatische Nutzung durch Entwickler als auch die interaktive Nutzung über eine Web-Oberfläche ermöglicht. Dies steigert die Effizienz bei der Arbeit mit Geodaten erheblich und fördert die Wiederverwendbarkeit von Datenressourcen.

Das Projekt besteht aus vier Hauptkomponenten, die nahtlos zusammenarbeiten:
- **Crawler** – erfasst automatisch Daten aus verschiedenen STAC-Katalogen und hält diese aktuell
- **Datenbank** – speichert Metadaten persistent und ermöglicht effiziente Abfragen
- **STAC API** – ermöglicht standardisierten, programmatischen Zugriff auf die indexierten Collections <!-- VI ViKu -->
- **UI** – bietet eine nutzerfreundliche Web-Oberfläche mit visueller Suche und interaktiver Kartenansicht

### 1.1 Abnahmekriterien

Die Abnahmekriterien definieren die zwingend erforderlichen Funktionalitäten des Systems. Diese Anforderungen müssen vollständig erfüllt werden, damit das Projekt als erfolgreich gilt. Sie bilden den Kern der Systemfunktionalität und sind für den produktiven Einsatz unerlässlich.

#### Crawler
- Automatisches Crawlen und Indexieren von STAC Collections aus verschiedenen Quellen
- Erfassung aller Collections im STAC Index
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
- Abruf einzelner Collections (GET /collections/{id})
- Erweiterte Suchfunktion (GET /colllections) mit Filterung nach:
  - id
  - Titel
  - Beschreibung
  - Räumlicher Ausdehnung
  - Zeitlicher Ausdehnung
  - Schlüsselwörtern
  - Provider
  - Lizenz
  - DOIs
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
  - Auswahlliste für Lizenzen
  - Textsuche mit Vorschlägen für Provider 
- Responsive Design für verschiedene Bildschirmgrößen
- Sprache (Deutsch oder Englisch))
- Barrierefreiheit (farbenblindentauglich)
- Anzeige der Collection-Metadaten

#### Allgemein
- Containerisierung aller Komponenten mit Docker
- System startbar per Einzeiler: `docker-compose up --build`
- Open Source unter Apache 2.0 Lizenz
- Standardkonforme Datenmodellierung nach STAC Specification

### 1.2 Wunschkriterien

Die Wunschkriterien beschreiben optionale Funktionalitäten, die das System über die Grundanforderungen hinaus erweitern würden. Diese Features sind nicht zwingend erforderlich, würden aber den Nutzen und die Attraktivität der Plattform erheblich steigern. Ihre Implementierung erfolgt in Abhängigkeit von verfügbaren Ressourcen und Zeit.

#### Allgemein
- On-Demand Abruf von Items einer Collection (ohne persistente Speicherung)
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
- Vergleich zwischen Collections verschiedener Anbieter

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

## 2. Anwendungsbereiche und Zielgruppen <!-- Jakob -->

Das System richtet sich an verschiedene Nutzergruppen mit unterschiedlichen Anforderungen und Anwendungsfällen:

#### 2.1 Data Scientists and Researchers
Wissenschaftler und Datenanalysten, die für ihre Forschungsprojekte passende Geodaten-Collections finden müssen.

**User Stories:**
- Als Data Scientist möchte ich nach Satellitenbildern eines bestimmten Zeitraums und Gebiets suchen, um Veränderungen in der Landnutzung zu analysieren.
- Als Forscherin möchte ich verschiedene Sentinel-2 Collections unterschiedlicher Anbieter vergleichen, um die für meine Studie am besten geeignete Datenquelle zu identifizieren.
- Als Klimaforscher möchte ich Collections nach spezifischen Attributen (z.B. Auflösung, Sensortyp) filtern, um geeignete Daten für meine Klimamodelle zu finden.
- Als Researcher möchte ich über die API automatisiert nach Collections suchen, um sie in meine Analyse-Pipeline zu integrieren.

#### 2.2 GIS Professionals
GIS-Experten und Geoinformatiker, die regelmäßig mit Geodaten arbeiten und diese in ihren Projekten einsetzen.

**User Stories:**
- Als GIS-Analyst möchte ich auf einer Karte nach verfügbaren Collections in meinem Projektgebiet suchen, um schnell passende Datenquellen zu identifizieren.
- Als Kartograf möchte ich Collections nach Lizenzen filtern, um nur solche Daten zu finden, die ich in meinen kommerziellen Projekten verwenden darf.
- Als GIS-Consultant möchte ich die zeitliche Verfügbarkeit verschiedener Collections vergleichen, um meinen Kunden die beste Datenlösung empfehlen zu können.
- Als Geoinformatiker möchte ich Collections nach Provider durchsuchen, um alle Datenquellen eines bestimmten Anbieters zu evaluieren.

#### 2.3 Application Developers
Softwareentwickler, die Anwendungen mit Geodaten-Funktionalitäten erstellen und STAC-Collections programmatisch nutzen möchten.

**User Stories:**
- Als Entwickler möchte ich über eine standardkonforme STAC API auf Collections zugreifen, um diese in meine Anwendung zu integrieren.
- Als Backend-Entwickler möchte ich automatisiert Collections nach bestimmten Kriterien abfragen, um meinen Nutzern relevante Datensätze vorzuschlagen.
- Als Software-Architekt möchte ich die API-Dokumentation einsehen, um die Integration in unsere bestehende Geodaten-Infrastruktur zu planen.

#### 2.4 Data Providers
Datenanbieter und -kuratoren, die ihre STAC-Kataloge bekannter machen und die Nutzung ihrer Daten fördern möchten.

**User Stories:**
- Als Datenanbieter möchte ich sicherstellen, dass meine Collections korrekt indexiert werden, um die Sichtbarkeit meiner Daten zu erhöhen.
- Als Data Curator möchte ich verstehen, wie meine Collections im Vergleich zu anderen Anbietern gefunden werden, um die Metadaten-Qualität zu optimieren.
- Als Open-Data-Anbieter möchte ich sehen, welche meiner Collections am häufigsten gesucht werden, um zukünftige Datenbereitstellung zu priorisieren.
- Als Infrastrukturbetreiber möchte ich, dass mein STAC-Katalog automatisch gecrawlt wird, um ohne zusätzlichen Aufwand in der Plattform präsent zu sein.

## 3. Produkt-Umgebung
Die Produktumgebung beschreibt die technischen Rahmenbedingungen für Entwicklung, Betrieb und Integration der drei Hauptkomponenten des Projekts – **Crawler**, **STAC API** und **Frontend**.  
Alle Komponenten werden in einer modernen, containerisierten Umgebung entwickelt und bereitgestellt, um eine einheitliche und reproduzierbare Laufzeitumgebung sicherzustellen.
[![](https://mermaid.ink/img/pako:eNptUsGO0zAQ_RVrTkVkS-K4JckBqWQLVCrQbVqQIBysZJoGErvYjlpo--_YYVOtBPJlZt6bN_OsOUMhS4QEdo08FnuuDFmuc0HIGyWFQVF-zWEIyehThyHZLp7l8M1xZquFhbPNLHUhGX2wUuPvmrwg89NBodYD8f615a2kNpXC7GFJnhOXvF1kj3i6nn1ezteWlCp-bFDdtAaF7ON2nc4zy5ifDCrBG9LPzWSnCtRk1GcLUeLJIyk3vJGV9siw26POU2Pk7u7V5d1ms8rIxVH-wdKHJb0hzp8ruu1_dqhq1Bdr68nyPbw9aLRfmMqmwcLUUvyXlUPhbJLRzvLkkTS1-OE2vAw2wYNK1SUkO95o9KBF1XKXw9lp5WD22GIOiQ3tE1fbcODii5QtJEZ1tkXJrtrfBLpDyQ3e17xSvL1VlbWKKpWdMJAEMWW9CiRnOEES0_HLCQ2jyPd9FkU08uAXJCwMxiGjIZsGccD8KZ1cPfjdz_XHUTil08mEsShgMY1DD7CsjVTv_55Yf2nXP1fHwN0?type=png)](https://mermaid.live/edit#pako:eNptUsGO0zAQ_RVrTkVkS-K4JckBqWQLVCrQbVqQIBysZJoGErvYjlpo--_YYVOtBPJlZt6bN_OsOUMhS4QEdo08FnuuDFmuc0HIGyWFQVF-zWEIyehThyHZLp7l8M1xZquFhbPNLHUhGX2wUuPvmrwg89NBodYD8f615a2kNpXC7GFJnhOXvF1kj3i6nn1ezteWlCp-bFDdtAaF7ON2nc4zy5ifDCrBG9LPzWSnCtRk1GcLUeLJIyk3vJGV9siw26POU2Pk7u7V5d1ms8rIxVH-wdKHJb0hzp8ruu1_dqhq1Bdr68nyPbw9aLRfmMqmwcLUUvyXlUPhbJLRzvLkkTS1-OE2vAw2wYNK1SUkO95o9KBF1XKXw9lp5WD22GIOiQ3tE1fbcODii5QtJEZ1tkXJrtrfBLpDyQ3e17xSvL1VlbWKKpWdMJAEMWW9CiRnOEES0_HLCQ2jyPd9FkU08uAXJCwMxiGjIZsGccD8KZ1cPfjdz_XHUTil08mEsShgMY1DD7CsjVTv_55Yf2nXP1fHwN0)

### 3.1 Crawler
Der Crawler wird in JavaScript implementiert und ist zuständig für das automatische Auffinden und Einlesen von STAC Collections aus dem STAC Index sowie verlinkten Katalogen/APIs (6.1.1.1, 6.1.1.2). (6.2.4.2)
Er schreibt die Daten in die Datenbank (6.1.1.7, 6.1.1.3) und führt regelmäßige, inkrementelle Aktualisierungen durch, um eine aktuelle Indexierung sicherzustellen (6.1.1.6). 
Protokollierung (z. B. Zeitstempel/Status) stellt Nachvollziehbarkeit sicher (6.1.1.4, 6.1.1.12). Dokumentation zu Build/Deployment/Testing wird pro Komponente bereitgestellt (6.2.4.3).

### 3.2 Datenbankmanagementsystem
PostgreSQL in Kombination mit PostGIS bildet die zentrale Datengrundlage.  
Die Metadaten werden in normalisierten Teiltabellen gehalten; Primär- und Fremdschlüssel sorgen für Referenzen.  
Für Performance werden B-Tree-Indizes (ID, Zeit), GIN/GiST (Text, Geometrien) und tsvector-Volltextindizes eingesetzt.  
Räumliche Daten werden als PostGIS-Geometrieobjekte gespeichert.  
CQL2-Filter werden serverseitig in SQL-WHERE-Klauseln übersetzt.  
Inkrementelle Updates und Soft-Deletes (active = false) sichern Integrität und Revisionsfähigkeit.

### 3.3 STAC API-konforme Schnittstelle
Das Backend stellt eine API bereit, die vollständig mit der STAC API-Spezifikation kompatibel ist und standardisierte Zugriffe auf die gespeicherten STAC Collections ermöglicht, unter anderem die Endpunkte `/` (Landing), `/conformance`, `/collections`, `/collections/{id}` und `/queryables` (global und/oder pro Collection) (6.1.2.1, 6.1.2.2, 6.1.2.3). 
Die API wird primär in JavaScript / Node.js (22) mit Express umgesetzt (6.2.4.2).  
Für die Übersetzung und Auswertung von CQL2-Abfragen wird cql2-rs (Rust) zu WebAssembly kompiliert und in-process im Node-Prozess eingebunden (geringe Latenz, einfache Containerisierung) (6.1.2.4, 6.1.2.5, 6.1.2.6).  
Als Fallback bleibt alternativ pycql2; sollten sich gravierende Schwierigkeiten mit cql2-rs ergeben, kann optional ein Python-Backend (z. B. FastAPI) implementiert werden, das die Anfrageverarbeitung und CQL2-Übersetzung übernimmt (6.1.2.7).  
Die API ist klar vom Crawler getrennt und fokussiert auf Abfrage und Filterung der gespeicherten Collections. <!-- UIV 80 ViKu -->

### 3.4 UI (Web-Frontend)
Das Web-Frontend wird mit Vue.js (Version 3) entwickelt (6.1.3.2) und bietet eine benutzerfreundliche Oberfläche zur Suche, Filterung und Visualisierung der STAC Collections, inklusive Kartenansicht (6.1.3.1, 6.1.3.3, 6.1.3.4, 6.1.3.5, 6.1.3.7, 6.1.3.8, 6.1.3.9).  
Die Kommunikation zwischen Frontend und Backend erfolgt ausschließlich über die STAC API. Zusätzlich stellt die UI Links zur Originalquelle (STAC Catalog / API) bereit und kann optional Verweise zur Item-Search einer Collection zeigen (6.1.3.6). 
Die UI und die zugehörigen Dokumentationen/Demos sollen so gestaltet sein, dass Schulungs- und Abnahmezwecke unterstützt werden (6.2.1.1, 6.2.1.2) und die Benutzererfahrung folgende Anforderungen erfüllt: intuitive/responsive UI, Accessibility, aussagekräftige Fehlerbehandlung und Sprachunterstützung (6.2.2.1, 6.2.2.2, 6.2.2.3, 6.2.2.4).

### 3.5 Containerisierung
Alle Komponenten (Crawler, Datenbank, STAC-API, UI) werden einzeln mittels Docker containerisiert und als Komplett-Paket miteinander verknüpft, zum Beispiel via Docker Compose, um sowohl die getrennte Verwendung einzelner Komponenten als auch den Betrieb des vollständigen Systems zu ermöglichen.  
Das Gesamtsystem ist mit einem Einzeiler startbar und plattformunabhängig lauffähig.  
Docker gewährleistet eine konsistente Laufzeitumgebung und erleichtert die Integration zwischen den Komponenten.

## 4. Produktfunktionen <!-- Robin -->

Im folgenden werden die Produktfunktionen nach den einzelnen Komponenten unterteilt, nummeriert und beschrieben. Zusätzlich wird eine Priorität zur Orientierung in der Implementierung angegeben inkl. einer kurzen Beschreibung und einem groben Akzeptanzkriterium. Auf Basis der optionalen Elemente des Lastenhefts wurde auch eine Spalte "Optional" gefüllt, welche Features markiert, welche mit nachrangiger Priorität nach der Entwicklung der Hauptfunktionalitäten entwickelt werden, sollte dafür noch Zeit sein.

Komponente | Funktion (Kurzbeschreibung) | Optionale Umsetzung | Akzeptanzkriterium | Prio | Lastenheft-Referenz |
|---|---|---|---|---|---|
| Crawler | Alle im STAC Index gelisteten statischen Kataloge und STAC-APIs nach Collections crawlen | – | Mind. 87 Quellen gecrawlt; Trefferquote ≥ 95 % | M | 6.1.1 1. |
| Crawler | Collections in nahezu beliebiger Verschachtelungstiefe erfassen (nested catalogs) | – | Maximale Tiefe < 1024 | M | 6.1.1 2. |
| Crawler | Metadaten extrahieren: id, title, description, spatial/temporal extent, keywords, provider, license, DOI, summaries(platform/constellation/gsd/processing:level) | – | ≥ 95 % Felder gefüllt bei Stichprobe n=50 | H | 6.1.1 3. |
| Crawler | Quell-URL, Quell-Titel, „zuletzt gecrawlt“ speichern | – | Felder in DB vorhanden und befüllt | M | 6.1.1 4. |
| Crawler | Alle stabilen STAC-Versionen unterstützen (alte Ressourcen werden automatisch auf 1.1 migriert) | – | Collections unterschiedl. Versionen werden gespeichert und ggf. migriert | M | 6.1.1 5. |
| Crawler | Inkrementelle Updates und periodisches Re-Crawling | – | Änderungen können ohne vollständige Neuindexierung hinzugefügt werden | H | 6.1.1 6. |
| Crawler | Vollständige STAC-Collection + extrahierte Suchfelder persistent ablegen | – | ≥ 95 % Felder identisch zwischen Quelle und Datenbank bei Stichprobe n=50 | H | 6.1.1 7. |
| Crawler | Erweiterbares DB-Design für zusätzliche Felder vorschlagen (siehe 5. Produktdaten) | – | Schema-Entwurf dokumentiert & abgenommen | M | 6.1.1 8. |
| Crawler | Rate-Limiting einhalten (Quellen nicht überlasten) | – | Keine 429-Antworten/Blockings in Testlauf über 12 h | M | 6.1.1 9. |
| Crawler | Konfigurierbare Crawl-Zeitpläne/Frequenzen | % | CRON/Intervall vom Anwender frei konfigurierbar | L | 6.1.1 10. |
| Crawler | Fehlerbehandlung + Retry; problematische Quellen überspringen | % | Backoff/Retry-Logik; Fehlerbericht vorhanden | M | 6.1.1 11. |
| Crawler | Logging & Monitoring der Crawl-Aktivitäten | % | Dashboards/Metriken (Rate, Fehler, Status) | M | 6.1.1 12. |
| Crawler | Version-agnostische STAC-Extensions erkennen und als Tags speichern (EO, SAR, Point Cloud) | ✔ | Extensions-Tags in DB & Queryables sichtbar | $ | 6.1.1 13. |
| STAC-API | API gemäß relevanten Spezifikationen gültig (STAC API und Collection Search Extension) | – | GET `/` und `/conformance` enthält zutreffende URIs | H | 6.1.2 1. | <!-- VI ViKu -->
| STAC-API | Erweiterung der bestehenden STAC Index API; bleibt selbst gültige STAC-API | – | Root/Collections gültig - Getestet durch `STAC Validator` und `STAC API Validator` und Jest-Tests für die Collection Search Extension | H | 6.1.2 2. | <!-- VI ViKu -->
| STAC-API | Collection Search: Freitext `q`, Filter, Sortierung | – | Beispiel-Queries liefern erwartete Treffer | H | 6.1.2 3. | <!-- VI ViKu -->
| STAC-API | CQL2-Filtering (Basic CQL2 (`AND`, `OR`, `NOT`, `=`, `<>`, `<`, `<=`, `>`, `>=`, `IS NULL`)) für Collection-Eigenschaften | – | Gültige Filter → 200 Antworten; ungültige → 400 Antworten mit Fehlerbeschreibung | H | 6.1.2 4. | <!-- VI ViKu -->
| STAC-API | Zusätzliche CQL2-Fähigkeiten (Advanced Comparison Operators (`LIKE/BETWEEN/IN`, `casei/accenti`, `Spatial/Temporal`, `Arrays`)) | % | Conformance-URIs ergänzt; Tests erfolgreich | M | 6.1.2 5. (optional) | <!-- VI ViKu -->
| STAC-API | CQL2 als Standalone-Library bereitstellen | $ | Lib mit Parser/Validation + README | L | 6.1.2 6. (optional) |
| STAC-API | Integration der neuen Funktionen in bestehende STAC Index API | $ | End-to-End-Tests (Crawler→API→UI) grün | M | 6.1.2 7. | <!-- VI ViKu -->
| Web-UI | Intuitive Suchoberfläche für Collections | – | Usability-Test: Kernflows bestehen | H | 6.1.3 1. |
| Web-UI | Implementierung in Vue (v3) zur Einbindung in STAC Index | – | Build integriert; Routing/State funktionsfähig | M | 6.1.3 2. |
| Web-UI | Interaktive Auswahl von Bounding Box und Zeitintervall | – | BBox/Datetime erzeugen korrekte Parameter | H | 6.1.3 3. |
| Web-UI | Composable Queryables in der UI → generiert CQL2-Ausdruck | – | UI-Builder erzeugt valide CQL2 (Server-OK) | H | 6.1.3 4. |
| Web-UI | Kartenansicht mit Visualisierung räumlicher Extents | – | Extents werden auf interaktiver Karte dargestellt | M | 6.1.3 5. |
| Web-UI | Links zur Originalquelle (Katalog/API) und optional zur Item Search | – | Links korrekt & erreichbar | M | 6.1.3 6. |
| Web-UI | Inspection-Ansicht für Collections (Details) | – | Detailseite zeigt alle Kernfelder | M | 6.1.3 7. |
| Web-UI | Items der Collections inspizieren können | % | Item-Liste/Detail aufrufbar | L | 6.1.3 8. (optional) |
| Web-UI | Collections vergleichen (Mehrfachauswahl & Vergleich) | % | Vergleichsansicht mit minimum 2 Collections | L | 6.1.3 9. (optional) |

Legende Spalte "Umsetzung"
| Zeichen | Bedeutung |
| ------- | --------- |
| -       | Diese Funtion ist vom Lastenheft verpflichtend vorgegeben und wird umgesetzt |
| %       | Dieses Funktion ist vom Lastenheft optinal vorgegeben und wird umgesetzt    |
| $       | Diese Funktion ist vom Lastenheft optional vorgegeben und es ist nicht geplant dieses umzusetzen|

## 5. Produktdaten <!-- Humam & Sönke -->

Die Datenbankkomponente bildet das zentrale Rückgrat der gesamten Datenverwaltung und dient zur strukturierten, effizienten und STAC-konformen Speicherung sämtlicher durch den Crawler erfassten (Meta-) Daten. Grundlage ist eine relationale PostgreSQL-Datenbank mit PostGIS-Erweiterung, um sowohl klassische als auch räumliche Abfragen performant verarbeiten zu können.  
Die Struktur ist so aufgebaut, dass sie die in STAC definierten Entitäten (Catalog, Collection, Extensions, Keywords usw.) logisch und referenziell abbildet. Sämtliche Primär- und Fremdschlüsselbeziehungen gewährleisten dabei eine hohe Datenintegrität und ermöglichen zugleich schnelle Abfragen über verschiedene Zugriffspfade.  

Für eine bessere Wartbarkeit und klare Trennung der logischen Einheiten ist die Datenbank in **mehrere thematisch abgegrenzte Tabellenbereiche** gegliedert: *Catalogs*, *Collections* sowie allgemeine, nicht spezifische Tabellen.  
Die Tabellen enthalten jeweils Primärschlüssel zur eindeutigen Identifikation sowie Zeitstempel-Felder zur Nachvollziehbarkeit von Änderungen. Darüber hinaus sind alle textbasierten Felder, Geometrien und Zeitinformationen für effiziente Suchvorgänge indexiert.  

---

### Tabellenbereich „Catalogs“

Der Bereich **Catalogs** bildet die hierarchische Struktur der STAC-Kataloge ab. Jeder Katalog speichert seine Metadaten inklusive Versionierung, Typ, Beschreibung und zugehöriger Links. Über Zwischentabellen werden Erweiterungen (STAC Extensions) referenziert.  

#### Tabelle: `catalog`

| Spalte        | Beschreibung / Inhalt                   | Datentyp / Format     |
|---------------|------------------------------------------|------------------------|
| **id**        | Eindeutige Identifikationsnummer des Katalogs | integer (PK)          |
| stac_version  | STAC-Versionsnummer                     | text                  |
| type          | Typ des STAC-Objekts                   | text                  |
| title         | Titel des Katalogs                     | text                  |
| description   | Beschreibung des Kataloginhalts         | text                  |
| created_at    | Zeitpunkt der Erstellung                | timestamp             |
| updated_at    | Zeitpunkt der letzten Änderung          | timestamp             |

Die Haupttabelle `catalog` bildet den zentralen Einstiegspunkt der Kataloghierarchie. Sie speichert allgemeine Metadaten und dient als Ankerpunkt für die zugehörigen Relationen. Diese Tabelle ist notwenidg um zu schauen, ob der crawler die aktueller Version des `catalogs` gespeichert hat, oder diesen `catalog` erneut crawlen muss. Somit kann der crawler bei einem erneuten crawl effektiver und schneller arbeiten.

#### Tabelle: `catalog_links`

| Spalte       | Beschreibung / Inhalt                        | Datentyp / Format     |
|---------------|----------------------------------------------|------------------------|
| **id**        | Eindeutige Identifikationsnummer des Links   | integer (PK)          |
| catalog_id    | Verweis auf den zugehörigen Katalog         | integer (FK)          |
| rel           | Beziehungstyp (z. B. *parent*, *child*, *self*) | text              |
| href          | Ziel-URL des Links                          | text                  |
| type          | MIME-Type des Zielobjekts                   | text                  |
| title         | Titel oder Name des Links                   | text                  |

Die Tabelle `catalog_links` beschreibt die Verknüpfungen zwischen einzelnen Katalogen oder externen Referenzen und implementiert damit die STAC-Link-Struktur.

#### Tabelle: catalog:stac_extension

| Spalte              | Beschreibung / Inhalt                    | Datentyp / Format |
|----------------------|------------------------------------------|-------------------|
| **catalog_id**       | Referenz auf `catalog.id`                | integer (FK)      |
| **stac_extension_id**| Referenz auf `stac_extension.id`         | integer (FK)      |

Diese Relation beschreibt, welche STAC-Erweiterungen in einem bestimmten Katalog verwendet werden. Hier wird eine eigene Tabelle benötigt da hier eine (n:n)-Beziehung zwischen den beiden tabellen vorliegt.

---

### Tabellenbereich „Collections“

Der Bereich **Collections** bildet die Sammlungen von Collections innerhalb eines Katalogs ab. Jede Collection enthält spezifische Metadaten, räumliche Ausdehnungen, zeitliche Intervalle sowie referenzierte Provider, Assets und Summaries.  

#### Tabelle: collection

| Spalte                | Beschreibung / Inhalt                                    | Datentyp / Format  |
|------------------------|----------------------------------------------------------|--------------------|
| **id**                 | Eindeutige Identifikationsnummer der Collection          | integer (PK)       |
| stac_version           | STAC-Versionsnummer                                     | text               |
| type                   | Typ des STAC-Objekts                                    | text               |
| title                  | Titel der Collection                                    | text               |
| description            | Beschreibung der Collection                              | text               |
| license                | Lizenzinformation                                       | text               |
| created_at             | Zeitpunkt der Erstellung                                 | timestamp          |
| updated_at             | Zeitpunkt der letzten Änderung                           | timestamp          |
| spatial_extent         | Räumliche Ausdehnung (Bounding Box)                     | bbox (geometry)    |
| temporal_extent_start  | Startzeitpunkt des zeitlichen Gültigkeitsbereichs        | timestamp          |
| temporal_extent_end    | Endzeitpunkt des zeitlichen Gültigkeitsbereichs          | timestamp          |
| is_api?    | ist die collection in einem catalog oder api          | boolean          |
| is_active?    | ist die collection noch aktuell, oder wurde diese gelöscht          | boolean          |
| full_json    | Hier werden alle JSON-Daten einer collection gespeichert          | JSON          |

Die `collection`-Tabelle dient als zentrales Objekt für die Speicherung der Sammlungsinformationen. Neben den textuellen Attributen werden hier räumliche und zeitliche Dimensionen gespeichert, die für Filter- und Suchoperationen entscheidend sind.  

#### Tabelle: collection_summaries

| Spalte        | Beschreibung / Inhalt                                 | Datentyp / Format |
|----------------|-------------------------------------------------------|-------------------|
| **id**         | Eindeutige Identifikation                             | integer (PK)      |
| collection_id  | Referenz auf `collection.id`                          | integer (FK)      |
| name           | Name des Attributs oder Parameters                    | text              |
| kind           | Art der Zusammenfassung (*range*, *set* etc.)         | text              |
| range_min      | Minimalwert eines Wertebereichs                       | numeric           |
| range_max      | Maximalwert eines Wertebereichs                       | numeric           |
| set_value      | Einzelwerte bei Set-basierten Attributen              | text / json       |
| json_schema    | Schema für strukturierte Daten            | json |

Diese Tabelle speichert statistische oder beschreibende Zusammenfassungen einzelner Collections. Über den Fremdschlüssel `collection_id` wird sichergestellt, dass alle Summary-Werte eindeutig zugeordnet werden können.  

#### Tabelle: collection:assets

| Spalte                 | Beschreibung / Inhalt                 | Datentyp / Format |
|-------------------------|---------------------------------------|-------------------|
| **collection_id**       | Referenz auf `collection.id`          | integer (FK)      |
| **asset_id**            | Referenz auf `asset.id`               | integer (FK)      |
| collection_asset_roles  | Rollenbeschreibung des Assets         | text              |

Dient der Verknüpfung von Collections mit ihren zugehörigen Assets, einschließlich der Angabe spezifischer Rollen. Dies ist nötig, da hier eine (n:n)-Beziehung vorliegt.

#### Tabelle: collection:keywords

| Spalte        | Beschreibung / Inhalt                | Datentyp / Format |
|----------------|--------------------------------------|-------------------|
| **collection_id** | Referenz auf `collection.id`    | integer (FK)      |
| **keyword_id**    | Referenz auf `keyword.id`        | integer (FK)      |

Relationstabelle zur Mehrfachzuordnung von Keywords an Collections. Dadurch können Colletions gezielt über Schlagwörter gefiltert werden. Diese Tabelle wird benötigt, da hier eine (n:n)-Beziehung vorliegt.

#### Tabelle: collection:stac_extension

| Spalte              | Beschreibung / Inhalt                 | Datentyp / Format |
|----------------------|---------------------------------------|-------------------|
| **collection_id**    | Referenz auf `collection.id`          | integer (FK)      |
| **stac_extension_id**| Referenz auf `stac_extension.id`      | integer (FK)      |

Relationstabelle zur Mehrfachzuordnung von stac_extension an Collections. Dadurch können Colletions gezielt über die stac_extension gefiltert werden. Diese Tabelle wird benötigt, da hier eine (n:n)-Beziehung vorliegt.

#### Tabelle: collection:providers

| Spalte                  | Beschreibung / Inhalt                   | Datentyp / Format |
|--------------------------|-----------------------------------------|-------------------|
| **collection_id**        | Referenz auf `collection.id`            | integer (FK)      |
| **provider_id**          | Referenz auf `provider.id`              | integer (FK)      |
| collection_provider_roles| Rolle des Providers (z. B. *producer*)  | text              |

Definiert die Zuordnung von Datenanbietern (Providern) zu einzelnen Collections. Über das Feld `collection_provider_roles` können die jeweiligen Rollen (z. B. „producer“, „licensor“) eindeutig beschrieben werden.

---

### Allgemeine und Hilfstabellen

Neben den spezifischen Tabellen für Catalogs und Collections existieren mehrere **nicht-spezifische Hilfstabellen**, die für eine einheitliche Referenzierung, Nachverfolgung und Filterung verwendet werden. Diese werden benötigt, da diese Tabellen mit den Tabellen `collections` und `catalogs` eine n:n-Beziehung haben und somit die datenbank unnötig viele Daten speichern würde wenn man diese Daten direkt in einer der beiden Tabellen referenzieren würde.

#### Tabelle: providers

| Spalte | Beschreibung / Inhalt                 | Datentyp / Format |
|---------|---------------------------------------|-------------------|
| **id**  | Eindeutige ID des Providers           | integer (PK)      |
| provider| Name oder Organisation des Providers  | text              |

Speichert die Informationen zu Datenanbietern, Organisationen oder Institutionen.  

#### Tabelle: keywords

| Spalte | Beschreibung / Inhalt          | Datentyp / Format |
|---------|--------------------------------|-------------------|
| **id**  | Eindeutige ID des Keywords     | integer (PK)      |
| keyword | Bezeichnung des Schlagworts    | text              |

Liste aller verwendeten Schlagwörter, die in unterschiedlichen Kontexten wiederverwendet werden können.  

#### Tabelle: stac_extensions

| Spalte | Beschreibung / Inhalt               | Datentyp / Format |
|---------|-------------------------------------|-------------------|
| **id**  | Eindeutige ID der Extension         | integer (PK)      |
| stac_extension | Name oder URL der Erweiterung | text             |

Verwaltet die in STAC definierten Erweiterungen, die sowohl von Catalogs als auch von Collections genutzt werden können.  

#### Tabelle: crawllog_catalog

| Spalte       | Beschreibung / Inhalt                    | Datentyp / Format |
|---------------|------------------------------------------|-------------------|
| **id**        | Eindeutige ID des Crawlvorgangs          | integer (PK)      |
| catalog_id    | Referenz auf `catalog.id`                | integer (FK)      |
| last_crawled  | Zeitpunkt des letzten Crawls             | timestamp         | 

Protokolliert die Zeitpunkte der letzten Crawling-Vorgänge für jeden Katalog.  

#### Tabelle: crawllog_collection

| Spalte       | Beschreibung / Inhalt                    | Datentyp / Format |
|---------------|------------------------------------------|-------------------|
| **id**        | Eindeutige ID des Crawlvorgangs          | integer (PK)      |
| collection_id | Referenz auf `collection.id`             | integer (FK)      |
| last_crawled  | Zeitpunkt des letzten Crawls             | timestamp         |

Analog zur vorherigen Tabelle dient `crawllog_collection` der Nachverfolgung der Crawling-Zyklen für Collections.  

---

### Zusammenfassung

Mit dieser Datenbankstruktur wird eine **vollständig STAC-kompatible, referenzielle und hochperformante Datenspeicherung** gewährleistet.  
Durch den modularen Aufbau mit klar getrennten Tabellenbereichen, Mehrfachbeziehungen und Protokollierungseinheiten ist die Architektur sowohl **skalierbar als auch wartungsfreundlich**.  
Indizes auf allen relevanten Attributen (IDs, Zeitstempel, Textfelder und Geometrien) sowie die Integration von PostgreSQL-TSVector und PostGIS stellen sicher, dass **alle Such-, Filter- und Analyseoperationen** in kurzer Zeit und mit minimalem Ressourcenverbrauch ausgeführt werden können.

## 6. Leistungsanforderungen

### 6.1 Crawler <!-- Humam -->
Die Crawler-Komponente soll eine hohe Effizienz, Stabilität und Skalierbar sein, um große Mengen an STAC-Katalogen und -APIs regelmäißg und zuverlässig zu erfassen.

#### 6.1.1 Crawling Leistung
Der Crawler soll in der Lage sein aus dem STAC-Index Quellen innerhalb einer Woche zu analysieren. In folge dessen soll auch die Aktualisierung aller bekannter und neuer Quellen maximal eine Woche betragen. Die einzelnen STAC-Collections sollen jeweils innerhalb von < 5 Sekunden abgerufen und verarbeitet werden. Zudem soll der Crawler alle vorgegebenen Rate-Limits einhalten, um die externen Dienste nicht zu überlasten (z.B. max. 20 Request/Minute pro Quelle).

#### 6.1.2 Crawling Parallelität und Skalierbarkeit
Die Implementierung soll asynchrones und paralleles Crawling unterstützten. Es wird nur ein einzelene Crawler-Instanz sein, um die Komplexität mit Datenbankkonflikten zu vermeiden. Es wird darauf geachtet so zu programmieren, um in Zukunft horizontale Skalierung mit mehren Crawlern möglich zu machen.

#### 6.1.3 Crawling Zuverlässigkeit unf Fehlertoleranz
Der Crawler darf bei fehlerhaften oder inaktiven Quellen nicht vollständig abbrechen. Die Quellen, die dreimal hintereinander fehlschlagen, sollen als inaktiv bis zum Crawling Event behandelt werden. Fehler und Wiederholungen müssen protokolliert werden. Alle ursprünglich erreichbaren STAC collections und catalogs sollen in der Datenbank dann als inaktiv gekennzeichnet werden.

#### 6.1.4 Ressourcenverbrauch
Der Crawler darf im Normalbetrieb auf einer Standard-VM mit (2 vCPUs, 8GB RAM) betrieben werden. Dies ist der alleinstehende Verbrauch. Eine CPU-Auslastung von über 80% im Mittel einer Woche darf nicht überschritten werden. RAM Verbrauch ist maximal 4GB pro Crawler.

#### 6.1.7 Wartbarkeit und Monitoring
Die Crawling-Durchläufe sollen über Logging und Metriken wie der Anzahl gecrawlter Quellen, Anzahl gecrawlter Collections und Laufzeit überwacht werden. Die Metriken werden nur über eine Lokale Datei von einem System-Admin abrufbar sein.

#### 6.1.8 Abnahmekriterien
- Der Crawler kann mindestens einen realen STAC Katalog vollständig traversieren.
- Collections werden in PostgreSQL mit PostGIS persistiert.
- Die Validierung erfolgt gegen das STAC JSON Schema und auftretende Fehler werden protokolliert.
- Bei Fehlern sind Wiederholungsversuche implementiert und dauerhaft fehlerhafte Quellen können als inaktiv markiert werden.
- Strukturierte Logs sind vorhanden.

### 6.2 Datenbank <!-- Sönke -->

#### 6.2.1 Funktionale Leistungsanforderungen

1. **Antwortzeiten der Datenbankabfragen**  
   - Standardabfragen (z. B. Abruf einer Collection nach ID) müssen innerhalb von **< 1 Sekunde** beantwortet werden.  
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

## 6.3 STAC API
Die STAC API-Komponente bildet die zentrale Datenschnittstelle des Systems und ermöglicht einen standardkonformen Zugriff auf die in der Datenbank gespeicherten STAC collections und catalogs. Sie erfüllt vollständig die Anforderungen der SpatioTemporal Asset Catalog (STAC) API sowie der Collection Search Extension und bietet erweiterte Such- und Filterfunktionen.

Über die Endpunkte /collections und /search können Nutzer Collections nach Attributen wie Titel, Lizenz, Schlüsselwörtern sowie räumlicher und zeitlicher Ausdehnung durchsuchen, filtern und sortieren. Dabei wird die CQL2-Filterung unterstützt, um standardkonforme und einheitliche Datensuche zu ermöglichen. Dabei stehen logische Operatoren (AND, OR, NOT) und Vergleichsoperatoren (=, <, >, IN) zur Verfügung; optional sind auch erweiterte Funktionen wie LIKE, BETWEEN oder INTERSECTS vorgesehen.

Die API bietet eine hohe Performance:
Zugriff auf indizierte Daten mit Antwortzeiten unter 1 s,
Verarbeitung von mindestens 100 parallelen Anfragen,
Antwortzeiten unter 5 s für einfache Abfragen und unter 1 min für komplexe Filterabfragen.

Damit stellt die STAC API eine leistungsfähige, flexible und erweiterbare Grundlage für die standardisierte Suche innerhalb der indizierten STAC Collections dar.
<!-- UVI 90 ViKu -->

## 6.4 UI <!-- Justin -->
Die UI-Komponente dient als benutzerfreundliche Schnittstelle zur Suche, Filterung und Exploration von STAC-Collections über die bereitgestellte STAC API.  
Sie visualisiert Metadaten und räumliche Extents der Collections und ermöglicht Nutzenden eine interaktive, responsive und barrierearme Bedienung.

### 6.4.1 Funktionale Leistungsanforderungen

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

### 6.4.2 Nichtfunktionale Leistungsanforderungen

- Die Benutzeroberfläche ist responsiv und muss auf verschiedenen Endgeräten (Desktop, Tablet, Smartphone) funktionsfähig sein.  
- Das Design muss für Personen mit Farbfehlsichtigkeit geeignet sein; kontrastreiche Darstellungen sind sicherzustellen.  
- Die UI ist mit allen gängigen Browsern kompatibel, die zusammen mindestens 80 % der Nutzerbasis repräsentieren (aktuelle Versionen von Chrome, Firefox, Edge, Safari).  
- Fehlerbehandlung: Fehlerzustände (z. B. Verbindungsprobleme, ungültige Filter) werden klar und verständlich kommuniziert, ohne dass die Anwendung abstürzt.  
- **Sprache**:
  - Die API-Kommunikation erfolgt in Englisch.  
  - Das Frontend wird zweisprachig (Englisch / Deutsch) bereitgestellt.  
- **Reaktionszeiten**:
  - Benutzerinteraktionen (außer Suchanfragen) sollen innerhalb von 1 Sekunde eine sichtbare Rückmeldung liefern.
    - Dies kann z. B. durch einen Ladeindikator, Fortschrittsbalken oder ähnliches visuelles Feedback erfolgen.  
  - Einfache Suchanfragen (z. B. Freitextsuche nach Keywords) müssen in unter 5 Sekunden abgeschlossen sein.  
  - Komplexe geometrische oder kombinierte CQL2-Filter dürfen maximal 1 Minute dauern.  
- **Pagination**: Bei umfangreichen Ergebnismengen erfolgt eine seitenweise Darstellung, um Performance und Übersichtlichkeit zu gewährleisten.  
- **Asynchrones Laden**: Aufwändige Datenabfragen werden parallel und schrittweise geladen, um die Reaktionsfähigkeit der Oberfläche zu erhalten.  

## 7. Qualitätsanforderungen <!-- Vincent -->
Zur Sicherstellung einer hohen Code-, System- und Datenqualität werden im Projekt *STAC-Atlas* folgende Qualitätsanforderungen definiert.
Die nachfolgenden Maßnahmen gewährleisten die Korrektheit, Wartbarkeit, Standardkonformität und Zuverlässigkeit der entwickelten Software.

### 7.1 Code-Qualität und Tests
  #### 7.1.1 Unit-Tests 
   - Für alle zentralen Backend-Module (insbesondere STAC-API-Routen, CQL2-Parser, Datenbank-Abfrage-Logik und Crawler-Importfunktionen) werden Unit-Tests mit einem geeigneten Framework (jest) erstellt. <!-- VI ViKu -->
   - Für das Frontend werden Unit-Tests mit einem geeigneten Framework (Jest) erstellt. <!-- VI ViKu -->
   - Zielabdeckung: mindestens 80 % Branch- und Statement-Coverage. <!-- UVI 70 ViKu -->
   - Tests werden automatisiert bei jedem Commit und Merge-Request in der GitHub-Pipeline ausgeführt. <!-- VI ViKu -->
   - Fehlgeschlagene Unit-Tests blockieren den Merge in den Haupt-Branch, um jederzeit lauffähigen Code in geteilten Systemen zu ermöglichen. <!-- VI ViKu -->

  #### 7.1.2 Integrationstests
   - Zusätzlich zu den Unit-Tests werden Integrationstests definiert, um das Zusammenspiel der Komponenten (STAC-API ↔ Crawler-DB ↔ Web UI) zu verifizieren.
   - Diese Tests prüfen:
     - Korrektes Schreiben von Collection-Metadaten durch den Crawler in die Datenbank.
     - Abrufbarkeit und Filterbarkeit dieser Daten über die STAC-API-Endpunkte (/collections, /search).
     - Validität der API-Antworten im STAC-Standardformat. <!-- VI ViKu -->
     - Pagination-, Sortier- und Filterfunktionen (CQL2). <!-- VI ViKu -->
   - Die Integrationstests werden in einer getrennten Testumgebung ausgeführt, die der realen Systemarchitektur entspricht (wahlweise über ein separates Docker-Compose-Setup oder im Rahmen des regulären Setups). <!-- NI ViKu -->
  
### 7.2 Kontinuierliche Integration (CI)
- Es wird eine GitHub Actions-Pipeline eingerichtet, die alle wesentlichen Qualitätssicherungs-Schritte automatisiert:
   - Build – Installation aller Abhängigkeiten und Prüfung auf erfolgreiche Kompilierung. <!-- VI ViKu -->
   - Linting – Automatische Kontrolle der Codequalität (z. B. mit flake8 für Python und ESLint für JavaScript/Vue-Komponenten). <!-- VI ViKu -->
   - Test – Ausführung sämtlicher Unit-Tests und Komponententests (jest und pytest) sowie Integrationstests über die GitHub Actions-Pipeline. <!-- VI ViKu -->
   - Validation – Ausführung der STAC- und API-Validatoren (s. Abschnitte 7.3 und 7.4). <!-- VI ViKu -->
   - Coverage-Report – automatische Generierung und Veröffentlichung in den Pipeline-Logs. <!-- NI ViKu -->
- Die CI-Pipeline wird bei jedem Push und Pull-Request gegen den head-Branch jeder Komponente ausgeführt. <!-- VI ViKu -->
- Nur bei erfolgreicher Pipeline-Ausführung dürfen Änderungen in den stabilen Branch übernommen werden (Branch-Protection-Rule). <!-- VI ViKu -->
  

### 7.3 STAC-Validator
- Jede durch den Crawler importierte und in der Datenbank gespeicherte Collection wird mit dem offiziellen STAC Validator
  geprüft.
- Validierung erfolgt:
   - beim erstmaligen Import (Crawler-Phase),
   - bei Änderungen oder Re-Crawls,
   - zusätzlich regelmäßig in der CI-Pipeline anhand von Stichproben. 
- Collections, die nicht vollständig dem aktuellen STAC-Standard entsprechen, werden automatisch strukturell angepasst oder konvertiert, bevor sie in den       Index übernommen werden. 
- Kann eine automatische Anpassung nicht durchgeführt werden, wird die betreffende Collection als inkompatibel markiert, nicht in den Index               aufgenommen und in einem separaten Fehlerprotokoll dokumentiert.
- Die Validierungsergebnisse, sowie alle Anpassungen werden im Crawler-Log und in den CI-Reports dokumentiert. 

### 7.4 STAC-API-Validator
- Die implementierte STAC API wird mit dem offiziellen stac-api-validator
  (bzw. OGC Conformance-Tests) überprüft. 
- Geprüfte Aspekte:
   - Gültigkeit der API-Antworten nach STAC API-Spezifikation (v1.x). 
   - Unterstützung der Collection Search Extension und der CQL2-Query Language (Basic). 
   - Korrekte Implementierung der Endpoints (`/`, `/conformance`, `/collections`, `/collections/{id}`). 
-Die Collection Search Extension wird zusätzlich durch eigene Integrationstests validiert, da der offizielle Validator derzeit keine automatisierte Prüfung dieser Erweiterung unterstützt. 
- Der Validator wird:
   - nach jedem erfolgreichen Build in der CI-Pipeline ausgeführt, 
   - manuell vor der Endabgabe für einen vollständigen Compliance-Report verwendet. 
- Ziel: 100 % bestehende STAC-Validator-Tests, sowie erfolgreiche interne Validierung der Collection Search Extension.
<!-- UVI 70 ViKu -->

### 7.5 Dokumentations- und Wartungsqualität
- Alle Module werden mit aussagekräftigen Kommentaren dokumentiert, entsprechend der jeweils verwendeten Programmiersprache (z. B. PyDoc für Python-Module oder JSDoc für JavaScript/Vue-Komponenten). <!-- UVI 90 ViKu -->

## 8. Sonstige nichtfunktionale Anforderungen <!-- Jakob -->

### 8.1 Dokumentation und Code-Qualität
- Code-Dokumentation mit JSDoc (JavaScript/TypeScript) <!-- VI ViKu -->
- Repository-Dokumentation (README, Setup-Anleitungen) <!-- VI ViKu -->
- API-Dokumentation via OpenAPI/Swagger <!-- UVI-80 ViKu -->
- Bedienungsanleitung für Endnutzer <!-- VI ViKu -->
- Linter: ESLint (JavaScript/TypeScript) <!-- VI ViKu -->
- Code-Formatierung: Prettier (JavaScript/TypeScript) 
- Modulare Architektur <!-- VI ViKu -->

### 8.2 Projektmanagement und Entwicklungsprozess
- Traditionelles Projektmanagement über GitHub-Projekte (Kunde erhält Zugriff) <!-- VI ViKu -->
- Versionskontrolle mit Git <!-- VI ViKu -->
- GitHub-Pipeline für CI/CD <!-- VI ViKu -->
- Jeder Code wird vor einem Push reviewed (Vier-Augen-Prinzip) <!-- VI ViKu -->
- Open Source unter Apache 2.0 Lizenz <!-- VI ViKu -->
- Lizenzkonforme Verweise auf genutzte Software <!-- VI ViKu -->

### 8.3 Deployment und Wartbarkeit
- Jede Komponente als eigenständiger Docker-Container <!-- VI ViKu -->
- System startbar per Einzeiler: `docker-compose up --build` 
- Konfigurierbarkeit über Umgebungsvariablen <!-- VI ViKu -->
- Klare Trennung der Komponenten (Crawler, Datenbank, API, UI) <!-- VI ViKu -->
- Definierte Schnittstellen zwischen Komponenten <!-- VI ViKu -->
- API-Versionierung und Erweiterbarkeit <!-- VI ViKu -->

### 8.4 Sicherheit und Logging
- Sichere Datenbankverbindungen
- Eingabevalidierung (SQL-Injection-Schutz)
- Sanitization von Nutzereingaben
- Gegen XSS abgesichert
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

## 9. Gliederung in Teilprodukte

### 9.1 Crawler-Komponente <!-- Lenn -->
Der Crawler bekommt über die STAC Index API, alle STAC Kataloge und STAC APIs die gecrawled werden müssen. Dabei sollen alle Collections erfolgreich erfasst werden.
Das Crawling erfolgt rekursiv, sodass Collections in nahezu beliebiger Tiefe (<1024 Ebenen) innerhalb verschachtelter Kataloge erkannt werden. Es werden ausschließlich Catalogs und Collections und keine Items erfasst. Die Crawling Vorgänge extrahieren die relevanten Metadaten jeder Collection (6.1.1.3), das vollständige JSON-Objekt jeder Kollektion und speichern sie zusammen mit der Quell-URL, dem Katalognamen und dem Zeitstempel des letzten Crawls. Zusätzlich wird auch ein Parameter, über die aktuelle Verfügbarkeit der Collection hinzugefügt.

Es werden alle stabilen STAC-Versionen, durch Migration unterstützt. 
Eine Crawling-Plan (Schedule) ermöglicht die zeitliche Steuerung einzelner Crawl-Vorgänge. Es soll eine wöchentliche Aktualisierungen des Indexes durchgeführt werden.
Die Ergebnisse werden in einer PostgreSQL-Datenbank gespeichert.

### 9.2 Datenbank-Komponente <!-- Sönke -->
Die Datenbankkomponente stellt die zentrale Grundlage für die Speicherung, Verwaltung und Abfrage aller vom Crawler erfassten Metadaten dar. Sie dient der persistenten Ablage sämtlicher Inhalte, einschließlich der vollständigen STAC-JSON-Strukturen, und ermöglicht deren effiziente Weiterverarbeitung innerhalb der Gesamtarchitektur. Als Datenbanksystem wird **PostgreSQL** in Kombination mit der Erweiterung **PostGIS** eingesetzt, um sowohl relationale als auch geographische Abfragen performant unterstützen zu können.

Die Struktur der Datenbank ist in mehrere logisch voneinander getrennte Teiltabellen gegliedert. Neben der Haupttabelle, in der alle grundlegenden Informationen abgelegt werden, existieren Tabellen wie `collection`, `catalog`, sowie vielen anderen (vgl. 5. Produktdaten). Diese Unterteilung sorgt für eine klare Trennung der Metadatenbereiche und ermöglicht eine performante Abfrage durch gezielte Normalisierung. Über Primär- und Fremdschlüsselbeziehungen sind die Tabellen miteinander verknüpft, sodass alle relevanten Daten effizient referenziert werden können.

Um eine schnelle und ressourcenschonende Datensuche zu gewährleisten, werden verschiedene Indizes eingerichtet. Neben klassischen **B-Tree-Indizes** für ID- und Zeitspalten kommen **GIN-** und **GiST-Indizes** zum Einsatz, um Text- und Geometrieabfragen zu optimieren. Dies betrifft insbesondere die Felder für Titel, Beschreibung, Keywords, zeitliche Angaben sowie die räumlichen Geometrien. Die Implementierung einer **Volltextsuche** auf Basis von **PostgreSQL-TSVector** ermöglicht zudem eine performante Freitextsuche über Titel, Beschreibungen und Schlagwörter, einschließlich Relevanzbewertung und optionaler Mehrsprachigkeit.

Für die geographische Filterung wird die räumliche Ausdehnung eines Datensatzes als **PostGIS-Geometrieobjekt** gespeichert. Dadurch sind Abfragen nach Bounding Boxes, Überschneidungen, Entfernungen oder räumlichem Enthaltensein möglich. Zusätzlich werden Start- und Endzeitpunkte in separaten Spalten abgelegt, um zeitbasierte Filterungen zu unterstützen. Ein zusammengesetzter Index auf diesen Zeitfeldern gewährleistet eine effiziente Ausführung von Abfragen über Zeiträume hinweg.

Ein zentrales Merkmal der Datenbankkomponente ist die **Übersetzung von CQL2-Ausdrücken** in entsprechende SQL-WHERE-Bedingungen. Diese Funktionalität erlaubt es, standardisierte Filterausdrücke (z. B. aus STAC-konformen API-Abfragen) direkt in SQL-Statements umzusetzen, wodurch eine hohe Kompatibilität und Erweiterbarkeit erreicht wird.

Zur Unterstützung inkrementeller Updates ist die Datenbank so ausgelegt, dass der Crawler neue oder geänderte Datensätze erkennen und gezielt aktualisieren kann, ohne dass ein vollständiger Neuimport erforderlich ist. Änderungen werden anhand eindeutiger Identifikatoren identifiziert, wodurch sowohl die Datenintegrität als auch die Verarbeitungsgeschwindigkeit verbessert werden.

Gelöschte oder aktuell vom Crawler nicht mehr erreichbare Datensätze werden in der Datenbank **nicht physisch entfernt**, sondern erhalten das Attribut `active = false`. Auf diese Weise bleibt der historische Zustand der Datensätze erhalten, was eine revisionssichere Nachverfolgung und spätere Analyse ermöglicht. Dieses Vorgehen unterstützt zudem eine transparente Datenhaltung und erleichtert eventuelle Wiederherstellungen.

Insgesamt ermöglicht die Datenbankkomponente eine robuste, skalierbare und abfrageoptimierte Verwaltung der Metadaten. Durch den Einsatz von Indizes, Geometrieunterstützung und standardisierten Filtermechanismen (CQL2) bildet sie die Grundlage für eine performante Bereitstellung der Daten innerhalb der gesamten Systemarchitektur.

### 9.3 STAC API-Komponente <!-- Vincent -->
Die STAC API-Komponente bildet das zentrale Bindeglied zwischen der Datenbank und der Web-UI.
  Sie implementiert die SpatioTemporal Asset Catalog (STAC) API Specification in der jeweils aktuellen stabilen Version
  sowie die Collection Search Extension, um eine standardisierte und effiziente Abfrage der gespeicherten STAC Collections zu ermöglichen.
  
#### 9.3.1 Technische Grundlagen
Die STAC API-Komponente stellt eine standardisierte Schnittstelle bereit, über die alle gespeicherten STAC-Collections abgefragt und gefiltert werden können.
Sie verbindet das Datenbank-Backend, in dem die Metadaten der Collections gespeichert sind, mit der Web-Benutzeroberfläche und externen Anwendungen.

Über die API können Nutzende:
   - Alle verfügbaren Collections abrufen oder gezielt nach bestimmten Daten suchen <!-- VI ViKu -->
   - Filterungen und Sortierungen anhand von Schlüsselwörtern, räumlichen und zeitlichen Ausdehnungen oder weiteren Metadaten durchführen <!-- VI ViKu -->
   - Details einzelner Collections abrufen, einschließlich Beschreibung, Lizenz, Provider und räumlicher Ausdehnung <!-- UVI 80 ViKu -->
   - die Ergebnisse als STAC-konformes JSON-Format abrufen, das auch von anderen STAC-fähigen Anwendungen weiterverarbeitet werden kann <!-- VI ViKu -->

Damit bildet die API die zentrale Kommunikationsschnittstelle zwischen der Datenbank und der Web-UI
und ermöglicht einen einheitlichen, standardkonformen Zugriff auf alle gespeicherten STAC-Daten.

#### 9.3.2 Endpunkte
1. Bereitstellung von Collections
   - `GET /collections` 
     - Gibt eine Liste aller gespeicherten Collections aus der Datenbank zurück. <!-- VI ViKu -->
   - Die Antwort ist konform zum STAC API Standard und enthält Metadaten wie `id`, `title`, `description`, `extent`, `keywords`, `providers`, `license`, sowie relevante links. <!-- UVI 80 ViKu -->
   - Ergebnisse werden pagininiert und alphabetisch nach `title` sortiert (Standardverhalten).
<!-- CR: Default-Sortierung erfolgt nach id bzw. Rank und nicht strikt alphabetisch nach title ViKu -->

2. Abruf einer bestimmten Collection
   - `GET /collections/{id}`
     - Liefert die vollständigen Metadaten einer einzelnen Collection, einschließlich des gesamten STAC-konformen JSON-Objekts.<!-- VI ViKu -->
   - Wird eine unbekannte ID angefragt, gibt die API eine strukturierte Fehlermeldung gemäß STAC-Spezifikation zurück (`404 Not Found`, JSON mit `code`, `description`, `id`). <!-- UVI 90 ViKu -->
   - Die Antwort enthält auch links zur zugehörigen Quelle (Original-STAC-API oder Katalog). <!-- VI ViKu -->
   - `GET /collections/{id}` -> Liefert die vollständigen Metadaten einer einzelnen Collection <!-- VI ViKu -->
   
3. Collection Search
- `GET /collections`
  und
- `POST /collections`
- Ermöglicht die gezielte Filterung und Suche nach Collections innerhalb des Index.
- Unterstützt wird sowohl die einfache Query-Parameter-Variante (GET) als auch komplexe CQL2-Abfragen (POST). <!-- VI ViKu -->

- Unterstützte Filterparameter (GET):
   - `q` → Freitextsuche über Titel, Beschreibung und Schlüsselwörter
   - `bbox` → Räumliche Einschränkung (Bounding Box, `[minX, minY, maxX, maxY])`
   - `datetime` → Zeitintervall (ISO8601-Format, z. B. 2019-01-01/2021-12-31)
   - `provider` → Name oder Kürzel des Datenanbieters
   - `license` → Lizenzfilter 
   - `limit` → Anzahl der zurückgegebenen Ergebnisse pro Seite
   - `sortby` → Sortierung
  <!-- VI ViKu -->

- Erweiterte Filterung über CQL2 (POST):
   - Die API implementiert CQL2 Basic Filtering zur semantischen Abfrage von Eigenschaften:
   - Vergleichsoperatoren: `=`, `!=`, `<`, `<=`, `>`, `>=`
   - Logische Operatoren: `and`, `or`, `not`
  <!-- VI ViKu -->
  
#### 9.3.3 Sicherheit, Performance und Erweiterbarkeit
Die STAC API-Komponente bildet das zentrale Zugriffssystem auf die indexierten STAC-Collections.
Sie stellt eine standardisierte und sichere Schnittstelle bereit, über die Nutzende oder andere Systeme gezielt nach Sammlungen suchen, diese filtern und abrufen können.
Die API verarbeitet Anfragen zuverlässig und unterstützt den Zugriff über alle implementierten Suchfunktionen (Freitext, räumliche und zeitliche Filter, CQL2).
Durch die modulare Architektur kann die API zukünftig um weitere STAC-Endpunkte, wie etwa „Items“ oder „Item Search“, erweitert werden.
Zudem erlaubt der Aufbau eine einfache Integration mit der Web-UI-Komponente und externen Anwendungen über REST-Schnittstellen.

### 9.4 UI-Komponente <!-- Simon -->
Die UI-Komponente stellt die grafische Benutzeroberfläche (GUI) der Plattform dar. Sie dient als Schnittstelle für die interaktive Nutzung der indexierten STAC-Sammlungen. Die Kernaufgabe ist die Gewährleistung einer effizienten Suche, Filterung und Exploration der Sammlungen.
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


## 10. Implementierungsdetails
<!-- Hier bitte pro Gruppe eintragen, wie genau die Teilprodukte implementiert werden sollen.
Also auch sowas wie verwendete Technologie, Teilschritte (Meilensteine?) etc.. WBS wäre auch nett-->
### 10.1 Crawler

Ziel des Crawler‑Moduls ist die automatische Erfassung, Validierung und Speicherung von STAC‑Collections aus verteilten Quellen in einer PostgreSQL‑Datenbank mit PostGIS‑Erweiterung. Der Crawler soll robust gegenüber transienten Fehlern sein (konfigurierbare Retries mit Backoff), Monitoring‑Metriken liefern und idempotente Persistenz gewährleisten, damit wiederholte Crawls keine Duplikate erzeugen.

#### 10.1.1 Technologien

Der Crawler wird als Node.js‑Anwendung konzipiert werden. Es wird JavaScript genutzt, um bessere Wartbarkeit und Weiterentwicklung innerhalb der Gruppe zu erreichen und die Probleme mit bestimmten Versionen von z.B. Python zu unterbinden.
Für das STAC‑Handling kommen [stac-js](https://github.com/moregeo-it/stac-js) und [stac-migrate](https://github.com/stac-utils/stac-migrate) zum Migrieren älterer STAC‑Versionen zum Einsatz. Für HTTP‑Zugriffe eignen sich `axios`, da es Timeouts und Retries unterstützt. Alternativ kann `node‑fetch` verwendet werden. 
Beim Crawling und Queueing sind für komplexe Szenarien, Frameworks wie `Crawlee (Apify)` oder vergleichbare Lösungen mit integrierter Queue/Retry‑Logik empfehlenswert, für leichtere Implementierungen bieten sich `p‑queue` oder `Bottleneck` zur Steuerung von Parallelität und Rate‑Limits an. 
Zur zeitgesteuerten Ausführung kann lokal `node‑cron` genutzt werden. Die Validierung erfolgt via JSON‑Schema Validator (z. B. `ajv`) unter Verwendung der offiziellen STAC‑Schemas. 
Die Anbindung an die Datenbank kann mit `node‑postgres (pg)` erfolgen. 
Für Logging und Monitoring werden strukturierte Logs eingesetzt. 
Zur Auslieferung und Reproduzierbarkeit der Laufzeitumgebung wird Docker genutzt.

#### 10.1.2 Architektur

Die Architektur ist modular aufgebaut und besteht aus folgenden Komponenten: 
Der Source Manager persistiert Quellendaten (URL, Typ, Crawl‑Intervall, Status, letzte Ausführung) und stellt eine Admin‑API zum Aktivieren/Deaktivieren sowie für manuelle Trigger bereit. 
Der Scheduler plant die periodischen Crawls gemäß der konfigurierten Intervalle. 
Die Crawler Engine lädt STAC‑Kataloge und STAC‑APIs asynchron, folgt relevanten Link‑Relationen (child, catalog, collection) und beachtet dabei Rate‑Limits, mögliche robots.txt‑Regeln sowie Parallelitätsgrenzen. 
Der Metadata Extractor / Normalizer migriert STAC‑Versionen mit stac‑migrate, modelliert Objekte (z. B. mit stac‑js) und extrahiert die relevanten Felder. 
Der Validator prüft die Objekte gegen die STAC JSON‑Schemas (z. B. mit `ajv)` und protokolliert Validierungsfehler samt Persistenz der Rohdaten zur Analyse. 
Der Database Writer verwaltet Indizes und Transaktionen. Die Logger / Monitor‑Komponente erfasst Fehler, Durchsatz, Latenzen und stellt Health‑Checks bzw. Metriken bereit. 
Optional existiert eine Admin UI / API zur Anzeige von Quellen, Fehlerlogs und für manuelle Resets.

#### 10.1.3 Ablauf

1. Initialisierung: Beim Start liest der Crawler die aktiven Quellen aus der Datenbank und plant die Crawls entsprechend der konfigurierten Intervalle.

2. Start eines Crawls (pro Quelle): Für jede Quelle wird deren Typ bestimmt (statischer STAC‑Catalog JSON, STAC API mit search/collections‑Endpunkten oder Verzeichnisstruktur) und die Start‑URL geladen — unter Verwendung von Timeouts und konfigurierten Retries.

3. Rekursives Crawling und Pagination: Die Engine folgt Link‑Rela‑Typen wie child, catalog und collection sowie paginiert bei STAC APIs; neue URLs/Tasks werden in die Queue aufgenommen und asynchron abgearbeitet, wobei Rate‑Limits und Parallelität berücksichtigt werden.

4. Migration: Gefundene STAC‑Objekte werden mit stac‑migrate in eine einheitliche STAC‑Version überführt und anschließend in ein internes Datenmodell für die Suche umgewandelt.

5. Extraktion & Normalisierung: Aus den STAC‑Objekten werden Schlüsselattribute extrahiert (z. B. id, title, description, extent – bbox und temporal, providers, license, assets, HREFs). Die BBOX‑Angaben werden in eine PostGIS‑Geometrie konvertiert (z. B. Envelope/Polygon), zeitliche Angaben als TIMESTAMP abgelegt.

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
   In dieser Phase werden das Datenmodell und die Schnittstellenanforderungen definiert. Die STAC-konformen Metadatenstrukturen werden analysiert und in ein relationales Schema überführt. Hierzu wird ein erstes **Prisma-Datenmodell** erstellt, das alle Tabellen (z.B. `collection`, `catalog`, `keywords` usw.) sowie deren Beziehungen enthält.  
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

5. **Deployment und Dokumentation (M5)**  
   Die produktive Bereitstellung erfolgt über **Docker Compose** <!-- , wobei separate Umgebungen für Entwicklung und Produktion eingerichtet werden.-->
   Das Prisma-Schema, die Migrationsdateien und die API-Routen werden versioniert und dokumentiert. Eine technische Dokumentation beschreibt die Struktur, Indexierung und Updateprozesse der Datenbank.  
   Ergebnis: einsatzbereite, dokumentierte Datenbankkomponente.


### 10.3 STAC API <!-- Robin -->
| ID | Arbeitspaket | Ziel/Output | Schritte (Stichpunkte) | Reuse/Technologien |
|----|--------------|-------------|-------------------------|--------------------|
| AP-01 | Projekt-Skeleton & Infrastruktur | Lauffähiges API-Grundgerüst mit Konfiguration & Logging | Repo-Struktur (`/api`, `/docs`); Apache-2.0 LICENSE; ENV-Konfig (Port, DB-URL vom DB-Team); strukturierte Logs; einfache Health-Route `GET /` | Python+FastAPI *oder* Node+Fastify/Express; uvicorn/node pm2; dotenv | <!-- VI ViKu -->
| AP-02 | Daten-Vertrag & Queryables (API-Seite) | Konsistentes Feld-Set & ` /queryables` für die UI | Such-/Filterfelder festlegen (id, title, description, extent, keywords, providers.name, license, doi, `summaries.platform/constellation/gsd/processing:level`); Datentypen (CQL2-kompatibel) definieren; `GET /queryables` (global/optional pro Collection); Dokumentation für UI | STAC Collections/Queryables Best Practices; CQL2 Typen |<!-- UVI-80 ViKu-->
| AP-03 | STAC-Core Endpunkte | STAC-konforme Basisrouten bereitstellen | `GET /` (Landing + Links), `GET /conformance` (Core+Collections vorerst), `GET /collections`, `GET /collections/{id}`; Link-Relationen & Service-Doku referenzieren | OpenAPI/Swagger-UI; STAC API Core/Collections | <!-- VI ViKu -->
| AP-04 | Collection Search – Routen & Parameter | Collection-Search-Schnittstelle mit `q`, `filter`, `sort`, Paging | Route definieren (Parametrisierung von `/collections`); Request-Validierung; Paging-Links | STAC Collection Search Extension; API Framework Middleware |<!-- VI ViKu -->
| AP-05 | CQL2 Basic – Parsing & Validierung | Gültige CQL2-Basic-Filter erkennen & valide/klare Fehlermeldungen liefern | Bestehende Parser/Validator-Lib einbinden; Request-Modelle (JSON/Text); Fehlermeldungen standardisieren | *cql2-rs* oder *pycql2* | <!-- VI ViKu -->
| AP-06 | CQL2-Ausführung – AST → SQL | CQL2-AST in effiziente SQL-Where-Klauseln übersetzen | Visitor/Mapper je Knotentyp (Vergleich, Logik, `IS NULL`, optional `LIKE/IN/BETWEEN`); Parametrisiertes SQL; Schutz vor teuren Scans (Zeit/Seite begrenzen) | — | <!-- VI ViKu -->
| AP-07 | Freitext `q` & Sortierung | Relevanzbasierte Freitextsuche + stabile Sortierung | Felder für `q` bestimmen (title, description, keywords, providers); Whitelist für `sortby`; Validierung bei nicht unterstützten Feldern → 400 | API-seitige Param-Validierung | <!-- VI ViKu -->
| AP-08 | Conformance & OpenAPI | Vollständige Konformitätsangaben & saubere API-Doku | `/conformance` um Collection Search + Filter (Basic CQL2) erweitern (später optional Advanced); OpenAPI/Service-Desc verlinken; Beispiele dokumentieren | STAC Conformance-URIs; OpenAPI Generator/Swagger-UI | <!-- VI ViKu -->
| AP-09 | Fehlerbehandlung & Antwortformate | Konsistente HTTP-Fehler & STAC-kompatible Antworten | Einheitliche Fehlerstruktur (400/404/422/500) | RFC7807 | <!-- VI ViKu -->
| AP-10 | Performance & Parallelität (API-Ebene) | Anforderungen an Latenz/Parallelität API-seitig erfüllen | Server-Worker/Threading konfigurieren; DB-Poolgrößen (Client-Seite) abstimmen; Limits/Timeouts setzen; typische Queries als Synthetic-Checks | uvicorn/gunicorn-Workers oder Node Cluster; Locust/k6 für Synthetic | <!-- NI ViKu -->
| AP-11 | Security & Betrieb (API-Ebene) | Sichere Standardkonfiguration & Betriebsfähigkeit | CORS/Headers; Request-Größenlimits; Rate-Limiting/Burst-Schutz; strukturierte Logs & Basis-Metriken; einfache Traces | fastapi-middlewares/helmet/express-rate-limit; OpenTelemetry (leichtgewichtig) | <!-- NI ViKu -->
| AP-12 | Deployment & Cross-OS | Reproduzierbare Bereitstellung der API | Container/Dockerfile nur für API; Compose (optional) ohne DB-Build; Windows & Linux Smoke-Tests; ENV-Templates | Docker/Podman; Make/Taskfile; `.env.example` | <!-- NI ViKu -->
| AP-13 | Integration & E2E Demo | Nachweis „Crawler → API → UI“ aus API-Sicht | DB- & UI-Team liefern Staging-Instanzen | curl/Postman Collections; minimaler Demo-Guide | <!-- NI ViKu -->


### 10.4 UI <!-- Justin -->

#### 10.4.1
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

- **Testing:** Jest (Unit-Tests), Playwright (End-to-End-Tests)  
  Jest wird für Komponententests auf Funktionsebene eingesetzt, um die Logik einzelner Module zu prüfen.  
  Playwright dient der automatisierten End-to-End-Validierung der Benutzerinteraktionen über verschiedene Browser hinweg.  
  Diese Kombination gewährleistet eine stabile, reproduzierbare und testbare Benutzeroberfläche.

- **Qualitätssicherung:** ESLint + Prettier, Lighthouse Performance Audits  
  Durch statische Codeanalyse (ESLint), automatische Formatierung (Prettier) und regelmäßige Lighthouse-Audits wird eine gleichbleibend hohe Codequalität und Performance sichergestellt.

#### 10.4.2 **Architektur und Aufbau** <!-- Justin -->

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

#### 10.4.3 **WBS (Work Breakdown Structure)**  <!-- Justin -->

1. **Workspace:** Aufbau der Projekt- und Ordnerstruktur  
2. **Design:** Definition des Farbsystems und Erstellung eines Figma-Mockups der Hauptkomponenten  
3. **Implementierung:** Überführung der entworfenen Komponenten in das Frontend  
4. **Funktionalität (Zusammenarbeit mit API):** Anbindung der Komponenten an die STAC-API und Implementierung der Such- und Filterlogik  

**Durchgängige Aufgaben:**  <!-- Justin -->
- **Revisions:**  
  - Design-Optimierung und kontinuierliche Verbesserung der Benutzerfreundlichkeit  
  - Qualitätssicherung durch Testing und Code Reviews  

## 11. Zeitplan
**Projektlaufzeit (Implementierung):** Start **12.11.2025** · **Pre-Release 17.12.2025** · **Projektabschluss 28.01.2026**  
**Hinweis:** Kalenderwochen (KW) entsprechen ISO-Wochen, angegeben mit **Montag–Sonntag**.
**Roadmap nach Kalenderwochen**
| Zeitraum (Mo–So) | KW  | Phase/Meilenstein                     | Hauptaktivitäten                                                                | Artefakte/Outputs |
|---|:--:|---|---|---|
| **12.11.2025** (Mi) | 46 | **Kick-off Implementierung**          | Projektstart, Scope & Schnittstellen finalisieren, Tooling/Standards festlegen                      | Kick-off-Protokoll, To-Do-Übersicht |
| 10.11–16.11.2025   | 46 | **Struktur Repo**                      | Monorepo/Repos anlegen (`/api`, `/crawler`, `/frontend`, `/ops`, `/docs`), CI/Lint/Format einrichten | Repo-Struktur, CI-Baseline, CONTRIBUTING.md |
| 10.11–16.11.2025   | 46 | **API-Endpoints (Core)**               | API-Skeleton, Routen `/`, `/conformance`, `/collections`, Stubs/Swagger                             | Laufende API-Instanz, OpenAPI-Draft |
| 10.11–16.11.2025   | 46 | **DB-Modell (Entwurf)**                | Datenvertrag/Views, Queryables-Felder abstimmen (Collections-Suche)                                  | Datenmodell-Notiz, Queryables-Liste |
| 17.11–23.11.2025   | 47 | **Beta Datenbank**                     | Staging-DB (Read-only) bereitstellen, Connection/ENV verteilen                                       | `DATABASE_URL` (staging), Read-Views |
| 24.11–30.11.2025   | 48 | **Beta Crawler**                       | Erste Collection-Datensätze befüllen, Crawl-Protokolle/IDs testen                                   | Beispiel-Collections in Staging |
| 01.12–07.12.2025   | 49 | **Beta API**                           | Collection-Search (Route, `q`, `filter` CQL2 Basic, `sort`, Paging), AST→SQL-Mapping                 | Funktionsfähige Suche (staging) |
| 08.12–14.12.2025   | 50 | **Beta Frontend**                      | UI integriert API (BBox/Zeit/CQL2), Pagination/Fehlerflüsse prüfen                                   | Klickbarer Prototyp |
| **17.12.2025** (Mi) | 51 | **Pre-Release v0.9**                  | Systemweiter Freeze light; **Abgleich Pflichtenheft** (Stand gegen Anforderungen prüfen)             | Pre-Release-Tag, Abgleich-Protokoll |
| 15.12–21.12.2025   | 51 | **Einzelkomponenten Final**            | Komponenten auf „Final“ heben (Bugfixes, Kantenfälle, Fehlerformat, Logging)                         | Komponenten-Releases (final) |
| 22.12–28.12.2025   | 52 | **Puffer**                             | Reserve/Bugfix/Feinschliff                                                                            | – |
| 29.12–04.01.2026   | 01 | **Puffer**                             | Reserve/Bugfix/Feinschliff                                                                            | – |
| 05.01–11.01.2026   | 02 | **Puffer**                             | Reserve/Bugfix/Feinschliff                                                                            | – |
| 12.01–18.01.2026   | 03 | **Finaler Integrationstest**           | End-to-End: Crawler → DB → API → Frontend; **Abgleich Pflichtenheft** final                         | Testprotokolle, Abgleich-Checkliste |
| 19.01–25.01.2026   | 04 | **Fixes**                              | Behebung aus Integrationstests, Stabilität/Performance nachziehen                                     | Fix-Liste, Release-Notes-Entwurf |
| 26.01–01.02.2026   | 05 | **Finalisierung Doku & Bonus**         | Entwickler-/Betriebsdoku final, Übergabepaket; optionale Bonus-Features abschließen                  | Finale Doku, Übergabe-Bundle |
| **28.01.2026** (Mi) | 05 | **Projektabschluss**                  | Finales Tagging/Release, Abgabe, Präsentationsvorbereitung                                           | Release v1.0, Abgabepaket |

## 12. Zuständigkeiten
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
