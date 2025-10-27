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
- Jede Benutzerinteraktion (außer Suchanfragen) soll innerhalb von 1 Sekunde eine sichtbare Reaktion in der Benutzeroberfläche auslösen
- Komplexe Inhalte (z. B. Kartenansichten oder umfangreiche Ergebnislisten) dürfen asynchron nachgeladen werden, um die Reaktionszeit gering zu halten
- Suchanfragen sollen innerhalb von 5 Sekunden abgeschlossen sein, typische Filterabfragen (z. B. zeitlich oder räumlich eingeschränkt) innerhalb von 1–3 Sekunden
- Eine maximale Ausführungszeit von 1 Minute pro Anfrage darf nicht überschritten werden.

- Die API muss mehrere gleichzeitige Anfragen (Concurrent Requests) verarbeiten können, ohne dass die durchschnittliche Antwortzeit signifikant steigt

Web UI	Reaktion auf Benutzerinteraktion	≤ 1 Sekunde
Web UI	Vollständige Suchabfrage	≤ 5 Sekunden
STAC API	GET-Abfrage /collections	≤ 1 Sekunde
STAC API	Komplexe Filterabfrage /search	≤ 5 Sekunden
STAC API	Maximale Anfragezeit	≤ 1 Minute
Crawler	Vollständiger Crawl-Zyklus	≤ 7 Tage
Datenbank	Lesezugriff auf indizierte Felder	< 100 ms pro Query
System	Parallel verarbeitbare Anfragen	≥ 100 gleichzeitig

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
