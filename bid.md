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

## 3. Produkt-Umgebung (ALLE)
Server-Umgebung: Docker-Container
Datenbank:  CQL2
Backend:Python, Node.js, JavaScript
Frontend: Vue.js, css, Disign ählich mit STAC websites
Kommunikation:GitHub, Discord,WhattsApp

## 4. Produktfunktionen (UNTERTEILT)


## 5. Produktdaten (Crawler & Datenbank)


## 6. Leistungsanforderungen (ALLE)
Die STAC API-Komponente bildet die zentrale Datenschnittstelle des Systems und ermöglicht einen standardkonformen Zugriff auf die im Index gespeicherten STAC Collections. Sie erfüllt vollständig die Anforderungen der SpatioTemporal Asset Catalog (STAC) API sowie der Collection Search Extension und bietet erweiterte Such- und Filterfunktionen.

Über die Endpunkte /collections und /search können Nutzer Collections nach Attributen wie Titel, Lizenz, Schlüsselwörtern sowie räumlicher und zeitlicher Ausdehnung durchsuchen, filtern und sortieren. Zusätzlich wird die CQL2-Filterung unterstützt, um gezielt nach Attributen wie platform, gsd oder processing:level zu suchen. Dabei stehen logische Operatoren (AND, OR, NOT) und Vergleichsoperatoren (=, <, >, IN) zur Verfügung; optional sind auch erweiterte Funktionen wie LIKE, BETWEEN oder INTERSECTS vorgesehen.

Die Architektur ist modular aufgebaut, sodass insbesondere die CQL2-Filterlogik als eigenständige Library wiederverwendet oder in andere Systeme integriert werden kann.

Die API bietet eine hohe Performance:

Zugriff auf indizierte Daten mit Antwortzeiten unter 100 ms,

Verarbeitung von mindestens 100 parallelen Anfragen,

Antwortzeiten unter 1 s für einfache Abfragen und unter 5 s für komplexe Filterabfragen,

maximale Anfragezeit: 1 Minute.

Damit stellt die STAC API eine leistungsfähige, flexible und erweiterbare Grundlage für die standardisierte Suche innerhalb der indizierten STAC Collections dar.
## 7. Qualitätsanforderungen (ALLE)
Benutzerfreundlich: einfache, klare Bedienoberfläche
Robust: Fehlerbehandlung bei Crawling & API-Anfragen
Open Source: Apache 2.0 Lizenz
Testabdeckung: grundlegende Unit- und Integrationstests
## 8. Sonstige nichtfunktionale Anforderungen (ALLE)


## 9. Gliederung in Teilprodukte (Unterteilt)
### 9.1 Crawler-Komponente

### 9.2 Datenbank-Komponente

### 9.3 STAC API-Komponente
- implementiert die STAC API Specification und die Collection Search Extension

# Bereitstellung von Collections
- GET /collections -> Gibt eine Liste aller gespeicherten Collections aus der    Datenbank zurück

# Abruf einer bestimmten Collection
- GET /collections/{id} -> Liefert die vollständigen Metadaten einer einzelnen Collection

# Collection Search
GET /search -> Ermöglicht Filterung nach:

- Schlüsselwörtern
- räumlicher Ausdehnung (Bounding Box)
- Zeitraum (temporal extent)
- Provider oder Lizenz
- Unterstützt CQL2-Filterung für erweiterte Abfragen

### 9.4 UI-Komponente
- Weboberfläche (Vue.js ) mit Suchfeld, Filteroptionen, Zeit- und Raum-Auswahl sowie Kartendarstellung der Ergebnisse

## 10. Entwicklungsumgebung (ALLE)


## 11. Glossar (ALLE)
