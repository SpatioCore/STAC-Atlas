import type { CollectionsResponse, Collection, APIError } from '@/types/collection'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

/**
 * Collection search parameters matching the STAC Atlas API
 * See: api/docs/collection-search-parameters.md
 */
export interface CollectionSearchParams {
  /** Free-text search query (max 500 chars) - searches title, description, keywords */
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
  /** CQL2 filter expression for advanced queries */
  filter?: string
  /** Filter language: 'cql2-text' or 'cql2-json' */
  'filter-lang'?: 'cql2-text' | 'cql2-json'
}

/**
 * Parse RFC 7807 error response
 */
async function parseErrorResponse(response: Response): Promise<string> {
  try {
    const errorData: APIError = await response.json()
    // RFC 7807 uses 'detail', with 'description' as backwards compatibility alias
    return errorData.detail || errorData.description || errorData.title || `Request failed: ${response.statusText}`
  } catch {
    return `Request failed: ${response.statusText}`
  }
}

export const api = {
  /**
   * Fetch collections with optional filtering and pagination
   * Supports: q, bbox, datetime, limit, sortby, token, provider, license, filter, filter-lang
   * 
   * Note: API has rate limit of 1000 requests per 15 minutes
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
      throw new Error(await parseErrorResponse(response))
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
      throw new Error(await parseErrorResponse(response))
    }
    
    return response.json()
  }
}
