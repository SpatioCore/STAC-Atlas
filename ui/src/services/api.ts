import type { CollectionsResponse } from '@/types/collection'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

export const api = {
  async getCollections(params?: {
    q?: string
    bbox?: string
    datetime?: string
    limit?: number
    sortby?: string
    token?: number
  }): Promise<CollectionsResponse> {
    const queryParams = new URLSearchParams()
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString())
        }
      })
    }
    
    const url = `${API_BASE_URL}/collections${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`Failed to fetch collections: ${response.statusText}`)
    }
    
    return response.json()
  }
}
