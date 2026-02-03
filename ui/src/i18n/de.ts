export default {
  // Navbar
  navbar: {
    title: 'STAC Atlas',
    subtitle: 'Geodaten-Explorer',
    logoAlt: 'STAC Atlas Logo',
    switchToGerman: 'Zu Deutsch wechseln',
    switchToEnglish: 'Zu Englisch wechseln',
    switchToLightMode: 'Zum hellen Modus wechseln',
    switchToDarkMode: 'Zum dunklen Modus wechseln',
    information: 'Information'
  },

  // Common
  common: {
    loading: 'Lädt...',
    error: 'Fehler',
    all: 'Alle',
    save: 'Speichern',
    cancel: 'Abbrechen',
    clear: 'Löschen',
    reset: 'Zurücksetzen',
    apply: 'Anwenden',
    go: 'Los',
    of: 'von',
    total: 'gesamt',
    more: 'mehr',
    unknown: 'Unbekannt',
    notAvailable: 'k.A.',
    copyToClipboard: 'In Zwischenablage kopieren',
    copiedToClipboard: 'In Zwischenablage kopiert!',
    failedToCopy: 'Kopieren fehlgeschlagen',
    openingLink: 'Link wird geöffnet...',
    openingWebsite: 'Website wird geöffnet...'
  },

  // Filter Section
  filters: {
    spatialFilter: 'Räumlicher Filter',
    drawBoundingBox: 'Begrenzungsrahmen zeichnen',
    selectRegion: 'Region auswählen',
    selectARegion: 'Region auswählen',
    west: 'West',
    east: 'Ost',
    south: 'Süd',
    north: 'Nord',
    
    temporalFilter: 'Zeitlicher Filter',
    startDate: 'Startdatum',
    endDate: 'Enddatum',
    
    provider: 'Anbieter',
    allProviders: 'Alle Anbieter',
    
    license: 'Lizenz',
    allLicenses: 'Alle Lizenzen',
    
    collectionStatus: 'Collectionstatus',
    activeStatus: 'Aktivstatus',
    active: 'Aktiv',
    inactive: 'Inaktiv',
    
    apiStatus: 'API Status',
    accessibleViaApi: 'Über API zugänglich',
    staticCatalog: 'Statischer Katalog',
    
    cql2Filter: 'CQL2 Filter',
    cql2Placeholder: 'Text: title LIKE \'%Sentinel%\'\nJSON: {"op":"=","args":[{"property":"license"},"CC-BY-4.0"]}',
    formattingJson: 'JSON wird formatiert...',
    cql2Hint: 'CQL2-Text oder CQL2-JSON',
    
    applyFilters: 'Filter anwenden',
    
    // Regions
    regions: {
      europe: 'Europa',
      asia: 'Asien',
      africa: 'Afrika',
      americas: 'Amerika',
      oceania: 'Ozeanien',
      global: 'Global'
    }
  },

  // Bounding Box Modal
  bboxModal: {
    title: 'Begrenzungsrahmen zeichnen',
    instructions: 'Klicken und ziehen Sie auf der Karte, um einen Begrenzungsrahmen zu zeichnen, oder geben Sie die Koordinaten unten manuell ein.',
    minLongitude: 'Min. Längengrad (West)',
    maxLongitude: 'Max. Längengrad (Ost)',
    minLatitude: 'Min. Breitengrad (Süd)',
    maxLatitude: 'Max. Breitengrad (Nord)'
  },

  // Search
  search: {
    title: 'Suchergebnisse',
    collections: 'Collections',
    placeholder: 'Collections nach Titel, Beschreibung, Schlüsselwörtern durchsuchen...',
    noResults: 'Keine Ergebnisse gefunden.',
    noResultsHint: 'Passen Sie Ihre Abfrage- oder Filterparameter an.',
    loadingCollections: 'Collections werden geladen...'
  },

  // Collection Card
  collectionCard: {
    untitledCollection: 'Unbenannte Collection',
    noDescription: 'Keine Beschreibung verfügbar',
    unknownProvider: 'Unbekannter Anbieter',
    noPlatformData: 'Keine Plattformdaten',
    viewDetails: 'Details anzeigen',
    source: 'Quelle'
  },

  // Collection Detail
  collectionDetail: {
    loading: 'Collection-Details werden geladen...',
    errorPrefix: 'Fehler:',
    
    // Sections
    overview: 'Übersicht',
    metadata: 'Metadaten',
    items: 'Elemente',
    additionalProperties: 'Zusätzliche Eigenschaften',
    
    // Source
    viewSource: 'Quelle anzeigen',
    sourceLinks: 'Quell-Links',
    noSourceLinks: 'Keine Quell-Links verfügbar',
    
    // Providers
    providers: 'Anbieter',
    providerInfo: 'Anbieterinformationen',
    noProviderInfo: 'Keine Anbieterinformationen verfügbar',
    providerRoles: {
      producer: 'Produzent',
      licensor: 'Lizenzgeber',
      processor: 'Verarbeiter',
      host: 'Host'
    },
    
    // Items
    loadingItems: 'Elemente werden von der Quelle geladen...',
    noItems: 'Keine Elemente verfügbar',
    
    // Coordinates
    coordinateLabels: {
      west: 'W:',
      south: 'S:',
      east: 'O:',
      north: 'N:'
    },
    
    // Metadata labels
    collectionId: 'Collection ID',
    stacVersion: 'STAC Version',
    keywords: 'Schlüsselwörter',
    
    // Default values
    untitledCollection: 'Unbenannte Collection',
    unknownProvider: 'Unbekannter Anbieter',
    unknownLicense: 'Unbekannt',
    noDescription: 'Keine Beschreibung verfügbar'
  },

  // Pagination
  pagination: {
    goToPage: 'Zur Seite'
  }
}
