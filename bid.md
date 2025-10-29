# Pflichtenheft STAC Atlas

## 1. Zielbestimmung (ALLE)


## 2. Anwendungsbereiche und Zielgruppen (ALLE)


## 3. Produkt-Umgebung

Die Produktumgebung beschreibt die technischen Rahmenbedingungen für Entwicklung, Betrieb und Integration der drei Hauptkomponenten des Projekts – **Crawler**, **STAC API** und **Frontend**.  
Alle Komponenten werden in einer modernen, containerisierten Umgebung entwickelt und bereitgestellt, um eine einheitliche und reproduzierbare Laufzeitumgebung sicherzustellen.

### 3.1 STAC API-konforme Schnittstelle
Das Backend stellt eine API bereit, die vollständig mit der **STAC API-Spezifikation** kompatibel ist und standardisierte Zugriffe auf die gespeicherten STAC Collections ermöglicht.

### 3.2 Backend
Das Backend wird überwiegend in **Python** umgesetzt und umfasst u. a. eine Übersetzung von **CQL2**-Abfragen (mittels [pycql2](https://pypi.org/project/pycql2/)).  
Ein dedizierter **Backend-Server** ist für die Verarbeitung von Anfragen sowie das **Crawlen externer STAC-Kataloge** verantwortlich.  
Neben Python können für Teilkomponenten auch **Node.js** und **JavaScript** verwendet werden.

### 3.3 Crawler
Der **Crawler** wird in **Python** implementiert und ist zuständig für das automatische Auffinden und Einlesen von STAC Collections aus verschiedenen Quellen.  
Er aktualisiert regelmäßig die Datenbank, um eine aktuelle Indexierung sicherzustellen.

### 3.4 Frontend
Das **Web-Frontend** wird mit **Vue.js (Version 3)** entwickelt und bietet eine benutzerfreundliche Oberfläche zur Suche, Filterung und Visualisierung der STAC Collections.  
Die Kommunikation zwischen Frontend und Backend erfolgt über die STAC API.

### 3.5 Datenbankmanagementsystem
Zur Speicherung der Metadaten wird **PostgreSQL** eingesetzt.  
Das Datenbankschema ist erweiterbar gestaltet, um zusätzliche Metadatenfelder aufnehmen zu können, beispielsweise Informationen aus STAC-Erweiterungen oder Providerdaten.

### 3.6 Containerisierung
Alle Komponenten werden mittels **Docker** containerisiert.  
Dadurch kann das gesamte System mit einem einzigen Startbefehl (**Docker-Einzeiler**) ausgeführt werden und ist plattformunabhängig lauffähig.  
Docker gewährleistet eine konsistente Laufzeitumgebung und erleichtert die Integration zwischen den Komponenten.

### 3.7 Entwicklungsumgebung
Die Entwicklungsumgebung basiert auf **Node.js 20** und ermöglicht eine einheitliche lokale Entwicklungs- und Testumgebung.  
Abhängigkeiten werden über **npm** verwaltet.  
Die Ausführung und Integration aller Komponenten kann lokal über Docker Compose oder direkt in der Node.js-Umgebung erfolgen.

## 4. Produktfunktionen (UNTERTEILT)


## 5. Produktdaten (Crawler & Datenbank)


## 6. Leistungsanforderungen (ALLE)


## 7. Qualitätsanforderungen (ALLE)


## 8. Sonstige nichtfunktionale Anforderungen (ALLE)


## 9. Gliederung in Teilprodukte (Unterteilt)
### 9.1 Crawler-Komponente

### 9.2 Datenbank-Komponente

### 9.3 STAC API-Komponente

### 9.4 UI-Komponente


## 10. Entwicklungsumgebung (ALLE)


## 11. Glossar (ALLE)
