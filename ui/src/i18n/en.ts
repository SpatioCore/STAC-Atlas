export default {
  // Navbar
  navbar: {
    title: 'STAC Atlas',
    subtitle: 'Geospatial Data Explorer',
    logoAlt: 'STAC Atlas Logo',
    switchToGerman: 'Switch to German',
    switchToEnglish: 'Switch to English',
    switchToLightMode: 'Switch to light mode',
    switchToDarkMode: 'Switch to dark mode',
    information: 'Information'
  },

  // Common
  common: {
    loading: 'Loading...',
    error: 'Error',
    all: 'All',
    save: 'Save',
    cancel: 'Cancel',
    clear: 'Clear',
    reset: 'Reset',
    apply: 'Apply',
    go: 'Go',
    of: 'of',
    total: 'total',
    more: 'more',
    unknown: 'Unknown',
    notAvailable: 'N/A',
    copyToClipboard: 'Copy to clipboard',
    copiedToClipboard: 'Copied to clipboard!',
    failedToCopy: 'Failed to copy',
    openingLink: 'Opening link...',
    openingWebsite: 'Opening website...'
  },

  // Filter Section
  filters: {
    spatialFilter: 'Spatial Filter',
    drawBoundingBox: 'Draw Bounding Box',
    selectRegion: 'Select Region',
    selectARegion: 'Select a region',
    west: 'West',
    east: 'East',
    south: 'South',
    north: 'North',
    
    temporalFilter: 'Temporal Filter',
    startDate: 'Start Date',
    endDate: 'End Date',
    
    provider: 'Provider',
    allProviders: 'All Providers',
    
    license: 'License',
    allLicenses: 'All Licenses',
    
    collectionStatus: 'Collection Status',
    activeStatus: 'Active Status',
    active: 'Active',
    inactive: 'Inactive',
    
    apiStatus: 'API Status',
    accessibleViaApi: 'Accessible via API',
    staticCatalog: 'Static Catalog',
    
    cql2Filter: 'CQL2 Filter',
    cql2Placeholder: 'Text: title LIKE \'%Sentinel%\'\nJSON: {"op":"=","args":[{"property":"license"},"CC-BY-4.0"]}',
    formattingJson: 'Formatting JSON...',
    cql2Hint: 'CQL2-Text or CQL2-JSON',
    
    applyFilters: 'Apply Filters',
    
    // Regions
    regions: {
      europe: 'Europe',
      asia: 'Asia',
      africa: 'Africa',
      americas: 'Americas',
      oceania: 'Oceania',
      global: 'Global'
    }
  },

  // Bounding Box Modal
  bboxModal: {
    title: 'Draw Bounding Box',
    instructions: 'Click and drag on the map to draw a bounding box, or enter coordinates manually below.',
    minLongitude: 'Min Longitude (West)',
    maxLongitude: 'Max Longitude (East)',
    minLatitude: 'Min Latitude (South)',
    maxLatitude: 'Max Latitude (North)'
  },

  // Search
  search: {
    title: 'Search Results',
    collections: 'collections',
    placeholder: 'Search collections by title, description, keywords...',
    noResults: 'No results found.',
    noResultsHint: 'Adjust your query or filter parameters.',
    loadingCollections: 'Loading collections...'
  },

  // Collection Card
  collectionCard: {
    untitledCollection: 'Untitled Collection',
    noDescription: 'No description available',
    unknownProvider: 'Unknown Provider',
    noPlatformData: 'No platform data',
    viewDetails: 'View Details',
    source: 'Source'
  },

  // Collection Detail
  collectionDetail: {
    loading: 'Loading collection details...',
    errorPrefix: 'Error:',
    
    // Sections
    overview: 'Overview',
    metadata: 'Metadata',
    items: 'Items',
    
    // Source
    viewSource: 'View Source',
    sourceLinks: 'Source Links',
    noSourceLinks: 'No source links available',
    
    // Providers
    providers: 'Providers',
    providerInfo: 'Provider Information',
    noProviderInfo: 'No provider information available',
    
    // Items
    loadingItems: 'Loading items from source...',
    noItems: 'No items available',
    
    // Coordinates
    coordinateLabels: {
      west: 'W:',
      south: 'S:',
      east: 'E:',
      north: 'N:'
    },
    
    // Metadata labels
    collectionId: 'Collection ID',
    stacVersion: 'STAC Version',
    keywords: 'Keywords',
    
    // Default values
    untitledCollection: 'Untitled Collection',
    unknownProvider: 'Unknown Provider',
    unknownLicense: 'Unknown',
    noDescription: 'No description available'
  },

  // Pagination
  pagination: {
    goToPage: 'Go to page'
  }
}
