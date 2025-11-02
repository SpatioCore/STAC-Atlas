# Pflichtenheft STAC Atlas

## 1. Zielbestimmung (ALLE)


## 2. Anwendungsbereiche und Zielgruppen (ALLE)


## 3. Produkt-Umgebung

Die Produktumgebung beschreibt die technischen Rahmenbedingungen für Entwicklung, Betrieb und Integration der drei Hauptkomponenten des Projekts – **Crawler**, **STAC API** und **Frontend**.  
Alle Komponenten werden in einer modernen, containerisierten Umgebung entwickelt und bereitgestellt, um eine einheitliche und reproduzierbare Laufzeitumgebung sicherzustellen.

### 3.1 STAC API-konforme Schnittstelle
Das Backend stellt eine API bereit, die vollständig mit der **STAC API-Spezifikation** kompatibel ist und standardisierte Zugriffe auf die gespeicherten STAC Collections ermöglicht.

### 3.2 Backend
Das Backend wird primär in **JavaScript / Node.js** umgesetzt und als dedizierter Backend‑Server betrieben. 
Als API‑Framework wird **Express** (unter Verwendung von Node.js 20) empfohlen, um Anfragen zu verarbeiten und das Crawlen externer STAC‑Kataloge zu koordinieren. 
Für die Übersetzung und Auswertung von **CQL2**‑Abfragen wird die robuste Rust‑Implementierung **cql2‑rs** eingesetzt. 
Die bevorzugte Integrationsvariante ist das Kompilieren von **cql2‑rs** zu **WebAssembly** und das direkte Einbinden in den Node‑Prozess (Vorteile: In‑Process‑Ausführung, geringere Latenz, einfache Containerisierung). 
Als Fallback bleibt alternativ die Python‑Option mit **pycql2**, wird aber nicht als Primärvariante verwendet, um Konsistenz mit dem JavaScript‑Stack und der Team‑Expertise sicherzustellen. 
Sollten sich große Schwierigkeiten mit der cql2-rs-Library ergeben, kann ein Backend in Python (z. B. mit FastAPI) implementiert werden, das die Anfrageverarbeitung und CQL2‑Übersetzung übernimmt.

### 3.3 Crawler
Der **Crawler** wird in **Python** implementiert und ist zuständig für das automatische Auffinden und Einlesen von STAC Collections aus dem STAC Index.  
Er aktualisiert regelmäßig die Datenbank, um eine aktuelle Indexierung sicherzustellen.

### 3.4 Frontend
Das **Web-Frontend** wird mit **Vue.js (Version 3)** entwickelt und bietet eine benutzerfreundliche Oberfläche zur Suche, Filterung und Visualisierung der STAC Collections.  
Die Kommunikation zwischen Frontend und Backend erfolgt über die STAC API.

### 3.5 Datenbankmanagementsystem
PostgreSQL in Kombination mit PostGIS bildet die zentrale Datengrundlage. 
Die Metadaten werden in normalisierten Teiltabellen gehalten; Primär‑/Fremdschlüssel sorgen für Referenzen. 
Für Performance werden B‑Tree‑Indizes (ID, Zeit), GIN/GiST (Text, Geometrien) und `tsvector`‑Volltextindizes eingesetzt. 
Datensätze werden als PostGIS-Geometrieobjekt gespeichert.
CQL2‑Filter werden serverseitig in SQL‑WHERE‑Klauseln übersetzt. 
Inkremetelle Updates und Soft‑Deletes (`active = false`) sichern Integrität und Revisionsfähigkeit. 

### 3.6 Containerisierung
Alle Komponenten werden einzeln mittels **Docker** containerisiert.
Dadurch kann das gesamte System mit einem einzigen Startbefehl (**Docker-Einzeiler**) ausgeführt werden und ist plattformunabhängig lauffähig.  
Docker gewährleistet eine konsistente Laufzeitumgebung und erleichtert die Integration zwischen den Komponenten.


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
