// Full STAC Collection structure (from full_json)
export interface STACCollection {
  id: string
  type: string
  stac_version: string
  stac_extensions?: string[]
  title?: string
  description?: string
  keywords?: string[]
  license?: string
  extent?: {
    spatial?: {
      bbox: number[][]
    }
    temporal?: {
      interval: (string | null)[][]
    }
  }
  links?: Array<{
    rel: string
    href: string
    type?: string
    title?: string
  }>
  providers?: Array<{
    name: string
    description?: string
    roles?: string[]
    url?: string
  }>
  summaries?: Record<string, unknown>
  assets?: Record<string, unknown>
}

// API Collection response structure (database model)
// Matches the SELECT columns from buildCollectionSearchQuery.js
export interface Collection {
  id: number
  stac_version: string
  type: string
  title?: string
  description?: string
  license?: string
  spatial_extend?: string // WKT format from PostGIS
  temporal_extend_start?: string
  temporal_extend_end?: string
  created_at: string
  updated_at: string
  is_api: boolean
  is_active: boolean
  full_json: STACCollection
  // Aggregated fields from relation tables
  keywords?: string[]
  stac_extensions?: string[]
  providers?: Array<{
    name: string
    description?: string
    roles?: string[]
    url?: string
  }>
  assets?: Record<string, unknown>
  summaries?: Record<string, unknown>
  last_crawled?: string
  // Full-text search rank (only present when q parameter is used)
  rank?: number
  // Links added by the API
  links?: Array<{
    rel: string
    href: string
    type?: string
  }>
}

export interface CollectionsResponse {
  type?: string // "FeatureCollection"
  collections: Collection[]
  links: Array<{
    rel: string
    href: string
    type?: string
  }>
  context?: {
    returned: number
    matched: number
    limit: number
  }
}
