# Pflichtenheft STAC Atlas

## 1. Zielbestimmung (ALLE)
- Zentrailisierte Plattform
- Automatisches Crawlen und Indexieren von STAC collections
  - von unterschiedlichen Quellen
- Soll ermöglichen:
  - Auffindbar machen von Collections
  - Suche nach Collection auf Basis von zeitlicher/räumlicher Ausdehnung oder Thema
  - Einen vergleich zwischen collections verschiedener Anbieter
  - Einen Zugriff auf die Metadaten der Collections ermöglichen

- API-Schnittstelle für Entwickler
- Nutzerfreundliche Web-UI

## 2. Anwendungsbereiche und Zielgruppen (ALLE)

### 2.1 Zielgruppe
- Data scientists and researchers
- GIS professionals
- Application developers
- Data providers

**Userstorys noch hinzufügen**

## 3. Produkt-Umgebung (ALLE)
- STAC API konforme API-Schnittstelle
- Backend vermutlich Python übersetzung von CQL2 (https://pypi.org/project/pycql2/)
- Backend-Server der für das Backend inkl. Crawlen verantwortlich ist
- Starten per Docker einzeiler
- Crawler in Python
- Frontend in VueJS v3

## 4. Produktfunktionen (UNTERTEILT)
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

## 5. Produktdaten (Crawler & Datenbank)

## 6. Leistungsanforderungen (ALLE)

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

## 7. Qualitätsanforderungen (ALLE)
- Backend Unit-Test mit jest
- Verwendung von GitHub-Pipeline
- STAC Validator
- STAC API Validator

## 8. Sonstige nichtfunktionale Anforderungen (ALLE)
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
- Jede Komponente als eigenständiger Docker-Container
### 9.1 Crawler-Komponente

### 9.2 Datenbank-Komponente

### 9.3 STAC API-Komponente

### 9.4 UI-Komponente
Die UI-Komponente stellt die grafische Benutzeroberfläche (GUI) der Plattform dar. Sie dient als Schnittstelle für die interaktive Nutzung der indexierten STAC-Sammlungen. Die Kernaufgabe ist die Gewährleistung einer effizienten Suche, Filterung und Exploration der Sammlungen.

Funktionen beinhalten die Übersetzung der Benutzereingaben (Filter) in CQL2-Suchanfragen und die visuelle Darstellung der Daten in einer Liste sowie auf einer Karte.  
Die Umsetzung erfolgt in VueJS v3 und soll eine potenzielle zukünftige Integration in den bestehenden STAC-Index ermöglichen.

Der Fokus liegt auf der Suche und Darstellung von Collections.

### 9.4.1 UI 
Bereitstellung einer intuitiven Suchoberfläche:
- Filter (Queryables): Nutzer können Filterkriterien definieren.
  - CQL2-Generierung: Die UI komponiert die Eingaben zu einem CQL2-Ausdruck und übermittelt diesen an den Server.
  - Karten-Filter: Filterung nach räumlichen Bereichen (Bounding Box) und Zeiträumen.
- Kartenvisualisierung: Die räumliche Ausdehnung der Suchergebnisse wird auf einer Karte visualisiert.
- Ergebnisdarstellung:
  - Die Inspektion der Metadaten einzelner Sammlungen ist möglich.
  - Quelle: Ein Link zum originalen STAC-Katalog (Quell-API) wird pro Sammlung bereitgestellt.
  - Paginierung: Für große Treffermengen steht eine erweiterte Seitenansicht zur Verfügung.

### 9.4.2 UX
- Performance:
  - Interaktion: Sichtbare Reaktion auf Standardinteraktionen (z. B. Klicks) innerhalb von 1 Sekunde.
  - Suche: Abschluss typischer Suchanfragen innerhalb von 5 Sekunden (Ladezeit).
- Barrierefreiheit: Es werden farbenblindenfreundliche Farben verwendet.
- Browser-Kompatibilität: Funktional und getestet für 80 % der gängigen Browser.
- Fehlerbehandlung: Klare, informative Fehlermeldungen.
- Sprache: Alle Komponenten sind auf Englisch, alternativ auf Deutsch verfügbar.

### 9.4.2 UX

## 10. Entwicklungsumgebung (ALLE)
- Git
- Python
- JavaScript

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
