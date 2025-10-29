# Pflichtenheft STAC Atlas

## 1. Zielbestimmung (ALLE)


## 2. Anwendungsbereiche und Zielgruppen (ALLE)


## 3. Produkt-Umgebung (ALLE)


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
- Stellt die grafische Benutzeroberfläche (GUI) der Plattform dar.
- Dient als Schnittstelle zum Anwender für die interaktive Nutzung der indexierten STAC-Sammlungen.
- Kernaufgabe: Gewährleistung einer effizienten Suche, Filterung und Exploration der Sammlungen.
- Funktion: Übersetzt Benutzereingaben in CQL2 Suchanfragen für das Backend (API).
- Funktion: Bereitet die Ergebnisse der API visuell auf.
- Technologie: Umsetzung in VueJS (v2 oder v3) Wir setzen es in v3 um.
- Ziel (Technologie): Ermöglichung einer potenziellen zukünftigen Integration in den bestehenden STAC Index.
- Grenze: Fokus liegt auf der Suche und Darstellung von Collections.
- Grenze (Bonus): Inspektion von Items oder ein Sammlungsvergleich sind optionale Bonus-Anforderungen.
- Grenze (Scope): Die finale Integration in die bestehende STAC-Index-Webseite ist nicht Teil dieses Projekts.

### 9.4.1 UI 
- Suchschnittstelle: Bereitstellung einer intuitiven Suchoberfläche (Orientierung am STAC Browser, fangen aber von neu an).
- Filter (Queryables): Nutzer müssen Filterkriterien (Queryables) definieren können.
- CQL2-Generierung: Die UI muss die Eingaben zu einem CQL2-Ausdruck komponieren und an den Server übermitteln.
- Muss-Filter: Zwingende Unterstützung für Filterung nach räumlichem Bereich (Bounding Box) und Zeitraum.
- Kartenvisualisierung: Die räumlichen Ausdehnungen der Suchergebnisse müssen auf einer Karte visualisiert werden.
- Ergebnisdarstellung (Details): Die Inspektion der Metadaten einzelner Sammlungen muss möglich sein.
- Ergebnisdarstellung (Quelle): Ein Link zum originalen STAC-Katalog (Quell-API) muss pro Sammlung bereitgestellt werden.
- Ergebnisdarstellung (Paginierung): Implementierung einer Paginierung für große Treffermengen, also Seitenanzahlen ermöglichen.

  ### 9.4.2 UX
- Performance (Interaktion): Sichtbare Reaktion auf Standard-Interaktionen (z.B. Klicks) innerhalb von 1 Sekunde.
- Performance (Suche): Abschluss typischer Suchanfragen innerhalb von 5 Sekunden - hauptsächlich Aufgabe des API-Teams
- Design: Gestaltung als cleanes und modernes Interface
- Barrierefreiheit: Sicherstellung der bestmöglichen Zugänglichkeit; explizite Eignung für farbenblinde Nutzer.
- Browser-Kompatibilität: Funktionalität muss für Browser gewährleistet sein, die mind. 80% der Nutzer abdecken (65% sind alleine Chrome-Nutzer).
- Fehlerbehandlung: Klare, informative Fehlermeldungen und ein kontrolliertes Erholen von Fehlern.
- Sprache: Alle Komponenten müssen vorzugsweise in Englisch, alternativ in Deutsch, verfügbar sein.
## 10. Entwicklungsumgebung (ALLE)


## 11. Glossar (ALLE)
