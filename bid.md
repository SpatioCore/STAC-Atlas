# Pflichtenheft STAC Atlas

## 1. Zielbestimmung (ALLE)


## 2. Anwendungsbereiche und Zielgruppen (ALLE)


## 3. Produkt-Umgebung (ALLE)
    - Crawler: Python
        


## 4. Produktfunktionen (UNTERTEILT)


## 5. Produktdaten (Crawler & Datenbank)


## 6. Leistungsanforderungen (ALLE)


## 7. Qualitätsanforderungen (ALLE)


## 8. Sonstige nichtfunktionale Anforderungen (ALLE)


## 9. Gliederung in Teilprodukte (Unterteilt)
### 9.1 Crawler-Komponente
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

### 9.2 Datenbank-Komponente

### 9.3 STAC API-Komponente

### 9.4 UI-Komponente


## 10. Entwicklungsumgebung (ALLE)


## 11. Glossar (ALLE)
