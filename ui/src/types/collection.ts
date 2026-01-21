/**
 * STAC-conformant Collection structure
 * The API now returns fully STAC-conformant collections without full_json wrapper
 * See: https://github.com/radiantearth/stac-spec/blob/master/collection-spec/collection-spec.md
 */

export interface STACLink {
  rel: string
  href: string
  type?: string
  title?: string
}

export interface STACProvider {
  name: string
  description?: string
  roles?: string[]
  url?: string
}

export interface STACExtent {
  spatial: {
    bbox: number[][]
  }
  temporal: {
    interval: (string | null)[][]
  }
}

// STAC-conformant Collection structure returned by the API
export interface Collection {
  // Required STAC fields
  type: 'Collection'
  id: string
  stac_version: string
  description: string
  license: string
  extent: STACExtent
  links: STACLink[]

  // Optional STAC fields
  title?: string
  stac_extensions?: string[]
  keywords?: string[]
  providers?: STACProvider[]
  summaries?: Record<string, unknown>
  assets?: Record<string, unknown>

  // Full-text search rank (only present when q parameter is used)
  rank?: number
}

export interface CollectionsResponse {
  type?: string // "FeatureCollection"
  collections: Collection[]
  links: STACLink[]
  context?: {
    returned: number
    matched: number
    limit: number
  }
}

/**
 * RFC 7807 Problem Details error response
 * See: https://datatracker.ietf.org/doc/html/rfc7807
 */
export interface APIError {
  type: string
  title: string
  status: number
  detail: string
  instance?: string
  requestId?: string
  code?: string // backwards compatibility
  description?: string // alias for detail
}
