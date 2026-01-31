<template>
  <div class="collection-detail">
    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <p>Loading collection details...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-container">
      <p>Error: {{ error }}</p>
    </div>

    <!-- Content -->
    <div v-else-if="collection" class="collection-detail__main">
      <!-- Left Section: Overview, BBox, and Metadata -->
      <div class="collection-detail__left-section">
        <!-- Header -->
        <div class="collection-detail__header">
          <h1 class="collection-detail__title">{{ collectionTitle }}</h1>
          <div class="collection-detail__badges">
            <span class="badge badge--primary">{{ provider }}</span>
            <span class="badge">{{ platform }}</span>
            <span class="badge" v-if="license">{{ license }}</span>
          </div>
        </div>
        <!-- Overview and Bounding Box together -->
        <div class="collection-detail__top-row">
          <!-- Overview -->
          <section class="overview-section">
            <h2 class="section-title">Overview</h2>
            <div class="overview-section__description">
              <!-- <h3>Description</h3> -->
              <p>{{ description }}</p>
            </div>
          </section>

          <!-- Bounding Box Preview -->
          <section class="bbox-section">
            <div class="bbox-section__map" ref="mapContainer">
              <!-- Map will be rendered here -->
            </div>

            <div class="bbox-section__coordinates">
              <div class="coordinate-system">
                <Globe :size="16" />
                <span>{{ coordinateSystem }}</span>
              </div>
              <div class="coordinate-values">
                <span>W: {{ bbox.west }}</span>
                <span>S: {{ bbox.south }}</span>
                <span>E: {{ bbox.east }}</span>
                <span>N: {{ bbox.north }}</span>
              </div>
            </div>

            <div class="bbox-section__actions">
              <div class="source-wrapper">
                <button @click="toggleSourceModal">
                  <ExternalLink :size="16" />
                  View Source
                </button>
                
                <!-- Source Popover -->
                <div v-if="showSourceModal" class="source-popover">
                  <h3 class="popover-title">Source Links</h3>
                  
                  <div v-if="sourceLinks.length > 0" class="source-links-list">
                    <div v-for="(link, index) in sourceLinks" :key="index" class="source-link-item">
                      <div class="source-link-header">
                        <span class="source-link-rel">{{ link.rel }}</span>
                        <span v-if="link.type" class="source-link-type">{{ link.type }}</span>
                      </div>
                      <div class="source-link-actions">
                        <a 
                          :href="link.href" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          class="source-link-url"
                          @click="showCopiedFeedback($event, 'Opening link...')"
                        >
                          {{ truncateUrl(link.href) }}
                        </a>
                        <button 
                          class="copy-btn" 
                          @click="copyToClipboardWithFeedback(link.href, $event)"
                          title="Copy to clipboard"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                  <p v-else class="no-data-message">No source links available</p>
                </div>
              </div>
              
              <div class="contact-wrapper">
                <button 
                  @click="toggleContactModal"
                  :disabled="providerInfo.length === 0"
                  :class="{ 'button--disabled': providerInfo.length === 0 }"
                >
                  <Building2 :size="16" />
                  Providers
                </button>
                
                <!-- Providers Popover -->
                <div v-if="showContactModal" class="contact-popover">
                  <h3 class="popover-title">Provider Information</h3>
                  
                  <div v-if="providerInfo.length > 0" class="providers-list">
                    <div v-for="(provider, index) in providerInfo" :key="index" class="provider-item">
                      <div class="provider-header">
                        <span class="provider-name">{{ provider.name }}</span>
                        <span class="provider-roles">{{ provider.roles }}</span>
                      </div>
                      <p v-if="provider.description" class="provider-description">{{ provider.description }}</p>
                      <div v-if="provider.url" class="provider-url-wrapper">
                        <a 
                          :href="provider.url" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          class="provider-url"
                          @click="showCopiedFeedback($event, 'Opening website...')"
                        >
                          {{ provider.url }}
                        </a>
                        <button 
                          class="copy-btn" 
                          @click="copyToClipboardWithFeedback(provider.url, $event)"
                          title="Copy to clipboard"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                  <p v-else class="no-data-message">No provider information available</p>
                </div>
              </div>
            </div>
            
            <!-- Copy Feedback Toast -->
            <div v-if="showCopyToast" class="copy-toast">
              {{ copyToastMessage }}
            </div>
          </section>
        </div>

        <!-- Metadata and Info Cards Row -->
        <div class="collection-detail__bottom-row">
          <!-- Info Cards -->
          <section class="info-cards-section">
            <div class="info-cards-section__grid">
              <InfoCard
                v-for="card in infoCards"
                :key="card.label"
                :icon="card.icon"
                :label="card.label"
                :value="card.value"
              />
            </div>
          </section>

          <!-- Metadata -->
          <section class="metadata-section">
            <h2 class="section-title">Metadata</h2>
            <div class="metadata-section__grid">
              <div class="metadata-item" v-for="meta in metadata" :key="meta.label">
                <span class="metadata-item__label">{{ meta.label }}</span>
                <span class="metadata-item__value">{{ meta.value }}</span>
              </div>
            </div>
          </section>
        </div>
      </div>

      <!-- Right Section: Items -->
      <div class="collection-detail__right-section">
        <section class="items-section">
          <h2 class="section-title">Items ({{ items.length }})</h2>
          <div class="items-section__list">
            <ItemCard
              v-for="item in items"
              :key="item.id"
              :id="item.id"
              :date="item.date"
              :coverage="item.coverage"
              :thumbnail="item.thumbnail"
            />
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Globe, ExternalLink, Building2 } from 'lucide-vue-next'
import InfoCard from '@/components/InfoCard.vue'
import ItemCard from '@/components/ItemCard.vue'
import { api } from '@/services/api'
import type { Collection } from '@/types/collection'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

const route = useRoute()
const collectionId = computed(() => route.params.id as string)
const mapContainer = ref<HTMLElement | null>(null)
const map = ref<maplibregl.Map | null>(null)
const showContactModal = ref(false)
const showSourceModal = ref(false)
const showCopyToast = ref(false)
const copyToastMessage = ref('')
const loading = ref(false)
const error = ref<string | null>(null)
const collection = ref<Collection | null>(null)

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (err) {
    console.error('Failed to copy:', err)
    return false
  }
}

const copyToClipboardWithFeedback = async (text: string, event: Event) => {
  event.stopPropagation()
  const button = (event.currentTarget as HTMLElement)
  const success = await copyToClipboard(text)
  
  if (success) {
    // Change icon to checkmark
    button.classList.add('copied')
    button.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>`
    
    // Revert after 2 seconds
    setTimeout(() => {
      button.classList.remove('copied')
      button.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
      </svg>`
    }, 2000)
  }
  
  showToast(success ? 'Copied to clipboard!' : 'Failed to copy')
}

const showToast = (message: string) => {
  copyToastMessage.value = message
  showCopyToast.value = true
  setTimeout(() => {
    showCopyToast.value = false
  }, 2000)
}

const showCopiedFeedback = (_event: Event, message: string) => {
  showToast(message)
}

const toggleContactModal = () => {
  showContactModal.value = !showContactModal.value
  if (showContactModal.value) {
    showSourceModal.value = false
  }
}

const toggleSourceModal = () => {
  showSourceModal.value = !showSourceModal.value
  if (showSourceModal.value) {
    showContactModal.value = false
  }
}

const truncateUrl = (url: string, maxLength: number = 40) => {
  if (url.length <= maxLength) return url
  return url.substring(0, maxLength - 3) + '...'
}

// Computed properties from STAC-conformant collection data (no more full_json wrapper)
const collectionTitle = computed(() => 
  collection.value?.title || 'Untitled Collection'
)

const provider = computed(() => {
  const providers = collection.value?.providers
  return providers && providers.length > 0 ? providers[0].name : 'Unknown Provider'
})

const platform = computed(() => {
  const keywords = collection.value?.keywords
  return keywords && keywords.length > 0 ? keywords[0] : 'N/A'
})

const license = computed(() => 
  collection.value?.license || 'Unknown'
)

const description = computed(() => 
  collection.value?.description || 'No description available'
)

const coordinateSystem = computed(() => 'EPSG:4326')

const bbox = computed(() => {
  const extent = collection.value?.extent?.spatial?.bbox
  if (extent && extent.length > 0 && extent[0].length === 4) {
    const [west, south, east, north] = extent[0]
    return {
      west: west.toFixed(2),
      south: south.toFixed(2),
      east: east.toFixed(2),
      north: north.toFixed(2)
    }
  }
  return { west: '0', south: '0', east: '0', north: '0' }
})

const infoCards = computed(() => {
  const cards = []
  
  const temporalExtent = collection.value?.extent?.temporal?.interval
  if (temporalExtent && temporalExtent.length > 0) {
    const [start, end] = temporalExtent[0]
    if (start) {
      cards.push({
        icon: 'calendar',
        label: 'Start Date',
        value: new Date(start).toLocaleDateString()
      })
    }
    if (end) {
      cards.push({
        icon: 'calendar',
        label: 'End Date',
        value: new Date(end).toLocaleDateString()
      })
    }
  }
  
  // Note: created_at/updated_at are not part of STAC spec, removed
  
  return cards
})

const metadata = computed(() => {
  const meta = []
  
  if (collection.value?.id) {
    meta.push({ label: 'Collection ID', value: collection.value.id })
  }
  
  if (collection.value?.stac_version) {
    meta.push({ label: 'STAC Version', value: collection.value.stac_version })
  }
  
  const keywords = collection.value?.keywords
  if (keywords && keywords.length > 0) {
    meta.push({ label: 'Keywords', value: keywords.join(', ') })
  }
  
  const providers = collection.value?.providers
  if (providers && providers.length > 0) {
    meta.push({ 
      label: 'Providers', 
      value: providers.map(p => p.name).join(', ') 
    })
  }

  if (collection.value?.license) {
    meta.push({ label: 'License', value: collection.value.license })
  }
  
  return meta
})

const items = ref<Array<{ id: string; date: string; coverage: string; thumbnail: string }>>([])

const fetchItems = async () => {
  const links = collection.value?.links || []
  const itemLinks = links.filter(link => link.rel === 'item')
  
  // Fetch first 10 items to avoid too many requests
  const itemsToFetch = itemLinks.slice(0, 10)
  
  const fetchedItems = await Promise.all(
    itemsToFetch.map(async (link) => {
      try {
        const response = await fetch(link.href)
        const itemData = await response.json()
        
        return {
          id: itemData.id || 'Unknown',
          date: itemData.properties?.datetime 
            ? new Date(itemData.properties.datetime).toLocaleDateString()
            : 'N/A',
          coverage: itemData.properties?.gsd 
            ? `${itemData.properties.gsd}m`
            : 'N/A',
          thumbnail: ''
        }
      } catch (error) {
        console.error(`Failed to fetch item from ${link.href}:`, error)
        const filename = link.href.split('/').pop()?.replace('.json', '') || 'Unknown'
        return {
          id: filename,
          date: 'N/A',
          coverage: 'N/A',
          thumbnail: ''
        }
      }
    })
  )
  
  items.value = fetchedItems
}

// Provider information computed from collection
const providerInfo = computed(() => {
  const providers = collection.value?.providers || []
  return providers.map(p => ({
    name: p.name || 'Unknown',
    roles: Array.isArray(p.roles) ? p.roles.join(', ') : (p.roles || ''),
    url: p.url || '',
    description: p.description || ''
  }))
})

// Source links computed from collection links
const sourceLinks = computed(() => {
  const links = collection.value?.links || []
  // Filter to show only relevant links (self, root, parent, license)
  const relevantRels = new Set(['self', 'root', 'parent', 'license'])
  return links.filter(link => relevantRels.has(link.rel))
})

const initializeMap = () => {
  if (!mapContainer.value || map.value) return
  
  const extent = collection.value?.extent?.spatial?.bbox
  if (!extent || extent.length === 0 || extent[0].length !== 4) return
  
  const [west, south, east, north] = extent[0]
  
  // Create map
  map.value = new maplibregl.Map({
    container: mapContainer.value,
    style: {
      version: 8,
      sources: {
        'osm': {
          type: 'raster',
          tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
          tileSize: 256,
          attribution: '© OpenStreetMap contributors'
        }
      },
      layers: [
        {
          id: 'osm',
          type: 'raster',
          source: 'osm'
        }
      ]
    },
    center: [(west + east) / 2, (south + north) / 2],
    zoom: 5
  })
  
  // Wait for map to load before adding bbox
  map.value.on('load', () => {
    if (!map.value) return
    
    // Add bounding box as a source
    map.value.addSource('bbox', {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [west, north],
            [east, north],
            [east, south],
            [west, south],
            [west, north]
          ]]
        }
      }
    })
    
    // Add bbox fill layer
    map.value.addLayer({
      id: 'bbox-fill',
      type: 'fill',
      source: 'bbox',
      paint: {
        'fill-color': '#3b82f6',
        'fill-opacity': 0.2
      }
    })
    
    // Add bbox outline layer
    map.value.addLayer({
      id: 'bbox-outline',
      type: 'line',
      source: 'bbox',
      paint: {
        'line-color': '#3b82f6',
        'line-width': 2
      }
    })
    
    // Fit map to bbox
    map.value.fitBounds([west, south, east, north], {
      padding: 20
    })
  })
}

const fetchCollectionData = async () => {
  loading.value = true
  error.value = null
  
  try {
    console.log('Fetching collection with ID:', collectionId.value)
    const response = await api.getCollection(collectionId.value)
    console.log('Collection response:', response)
    collection.value = response
    
    // Fetch items after collection is loaded
    await fetchItems()
    
    // Initialize map after collection data is loaded
    setTimeout(initializeMap, 100)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to fetch collection'
    console.error('Error fetching collection:', err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchCollectionData()
})
</script>

<style scoped>
@import '@/assets/styles/views/collection-detail.css';
</style>
