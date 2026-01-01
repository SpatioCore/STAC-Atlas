import type { CollectionsResponse, Collection } from '@/types/collection'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

/**
 * Collection search parameters matching the STAC Atlas API
 * See: api/docs/collection-search-parameters.md
 */
export interface CollectionSearchParams {
  /** Free-text search query (max 500 chars) */
  q?: string
  /** Bounding box filter: minX,minY,maxX,maxY */
  bbox?: string
  /** ISO8601 datetime or interval (e.g., "2020-01-01/2021-12-31") */
  datetime?: string
  /** Result limit (default: 10, max: 10000) */
  limit?: number
  /** Sort by field: +/-field (title, id, license, created, updated) */
  sortby?: string
  /** Pagination token (offset, default: 0) */
  token?: number
  /** Filter by provider name */
  provider?: string
  /** Filter by license identifier */
  license?: string
}

export interface ProvidersResponse {
  providers: string[]
  total: number
}

export interface LicensesResponse {
  licenses: string[]
  total: number
}

export const api = {
  /**
   * Fetch collections with optional filtering and pagination
   * Supports: q, bbox, datetime, limit, sortby, token, provider, license
   */
  async getCollections(params?: CollectionSearchParams): Promise<CollectionsResponse> {
    const queryParams = new URLSearchParams()
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value.toString())
        }
      })
    }
    
    const url = `${API_BASE_URL}/collections${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    
    const response = await fetch(url)
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.description || `Failed to fetch collections: ${response.statusText}`)
    }
    
    return response.json()
  },

  /**
   * Fetch a single collection by ID
   */
  async getCollection(id: string | number): Promise<Collection> {
    const url = `${API_BASE_URL}/collections/${id}`
    
    const response = await fetch(url)
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.description || `Failed to fetch collection: ${response.statusText}`)
    }
    
    return response.json()
  },

  /**
   * Fetch all distinct providers from the database
   */
  async getProviders(): Promise<ProvidersResponse> {
    const url = `${API_BASE_URL}/queryables/providers`
    
    const response = await fetch(url)
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.description || `Failed to fetch providers: ${response.statusText}`)
    }
    
    return response.json()
  },

  /**
   * Fetch all distinct licenses from the database
   */
  async getLicenses(): Promise<LicensesResponse> {
    const url = `${API_BASE_URL}/queryables/licenses`
    
    const response = await fetch(url)
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.description || `Failed to fetch licenses: ${response.statusText}`)
    }
    
    return response.json()
  }
}
