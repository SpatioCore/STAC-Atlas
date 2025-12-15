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
  summaries?: Record<string, any>
}

// API Collection response structure (database model)
export interface Collection {
  id: number
  stac_version: string
  type: string
  title?: string
  description?: string
  license?: string
  spatial_extend?: string // WKT format
  temporal_extend_start?: string
  temporal_extend_end?: string
  created_at: string
  updated_at: string
  is_api: boolean
  is_active: boolean
  full_json: STACCollection
}

export interface CollectionsResponse {
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
