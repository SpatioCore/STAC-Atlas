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

## 10. Entwicklungsumgebung (ALLE)


## 11. Glossar (ALLE)
