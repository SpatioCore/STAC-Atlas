<template>
  <div class="collection-detail">
    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <p>{{ t.collectionDetail.loading }}</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-container">
      <p>{{ t.collectionDetail.errorPrefix }} {{ error }}</p>
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
            <span class="badge" v-if="platform">{{ platform }}</span>
            <span class="badge" v-if="license">{{ license }}</span>
          </div>
        </div>
        <!-- Overview and Bounding Box together -->
        <div class="collection-detail__top-row">
          <!-- Overview -->
          <section class="overview-section">
            <h2 class="section-title">{{ t.collectionDetail.overview }}</h2>
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
                <span>{{ t.collectionDetail.coordinateLabels.west }} {{ bbox.west }}</span>
                <span>{{ t.collectionDetail.coordinateLabels.south }} {{ bbox.south }}</span>
                <span>{{ t.collectionDetail.coordinateLabels.east }} {{ bbox.east }}</span>
                <span>{{ t.collectionDetail.coordinateLabels.north }} {{ bbox.north }}</span>
              </div>
            </div>

            <div class="bbox-section__actions">
              <div class="source-wrapper">
                <button @click="toggleSourceModal">
                  <ExternalLink :size="16" />
                  {{ t.collectionDetail.viewSource }}
                </button>
                
                <!-- Source Popover -->
                <div v-if="showSourceModal" class="source-popover">
                  <h3 class="popover-title">{{ t.collectionDetail.sourceLinks }}</h3>
                  
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
                          :title="t.common.copyToClipboard"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                  <p v-else class="no-data-message">{{ t.collectionDetail.noSourceLinks }}</p>
                </div>
              </div>
              
              <div class="contact-wrapper">
                <button 
                  @click="toggleContactModal"
                  :disabled="providerInfo.length === 0"
                  :class="{ 'button--disabled': providerInfo.length === 0 }"
                >
                  <Building2 :size="16" />
                  {{ t.collectionDetail.providers }}
                </button>
                
                <!-- Providers Popover -->
                <div v-if="showContactModal" class="contact-popover">
                  <h3 class="popover-title">{{ t.collectionDetail.providerInfo }}</h3>
                  
                  <div v-if="providerInfo.length > 0" class="providers-list">
                    <div v-for="(provider, index) in providerInfo" :key="index" class="provider-item">
                      <div class="provider-header">
                        <span class="provider-name">{{ provider.name }}</span>
                        <span class="provider-roles">{{ translateRoles(provider.roles) }}</span>
                      </div>
                      <p v-if="provider.description" class="provider-description">{{ provider.description }}</p>
                      <div v-if="provider.url" class="provider-url-wrapper">
                        <a 
                          :href="provider.url" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          class="provider-url"
                          @click="showCopiedFeedback($event, t.common.openingWebsite)"
                        >
                          {{ provider.url }}
                        </a>
                        <button 
                          class="copy-btn" 
                          @click="copyToClipboardWithFeedback(provider.url, $event)"
                          :title="t.common.copyToClipboard"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                  <p v-else class="no-data-message">{{ t.collectionDetail.noProviderInfo }}</p>
                </div>
              </div>
            </div>
            
            <!-- Copy Feedback Toast -->
            <div v-if="showCopyToast" class="copy-toast">
              {{ copyToastMessage }}
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
            <h2 class="section-title">{{ t.collectionDetail.metadata }}</h2>
            <div class="metadata-section__grid">
              <div class="metadata-item" v-for="meta in metadata" :key="meta.label">
                <span class="metadata-item__label">{{ meta.label }}</span>
                <span class="metadata-item__value">{{ meta.value }}</span>
              </div>
            </div>
          </section>
        </div>

        <!-- Additional Properties Section (like STAC-Browser) -->
        <section v-if="additionalProperties.length > 0" class="additional-properties-section">
          <h2 class="section-title">{{ t.collectionDetail.additionalProperties }}</h2>
          <div class="additional-properties-grid">
            <div 
              v-for="prop in additionalProperties" 
              :key="prop.key" 
              class="additional-property-item"
            >
              <div 
                class="additional-property-header"
                @click="toggleProperty(prop.key)"
              >
                <span class="collapse-icon" :class="{ 'collapse-icon--expanded': expandedProperties.has(prop.key) }">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </span>
                <span class="additional-property-key">{{ prop.key }}</span>
              </div>
              <div v-show="expandedProperties.has(prop.key)" class="additional-property-value">
                <!-- Array values -->
                <template v-if="Array.isArray(prop.value)">
                  <span 
                    v-for="(item, idx) in prop.value" 
                    :key="idx" 
                    class="property-tag"
                  >{{ formatPropertyValue(item) }}</span>
                </template>
                <!-- Object values -->
                <template v-else-if="typeof prop.value === 'object' && prop.value !== null">
                  <pre class="property-object">{{ JSON.stringify(prop.value, null, 2) }}</pre>
                </template>
                <!-- Primitive values -->
                <template v-else>
                  <span>{{ formatPropertyValue(prop.value) }}</span>
                </template>
              </div>
            </div>
          </div>
        </section>
      </div>

      <!-- Right Section: Items -->
      <div class="collection-detail__right-section">
        <section class="items-section">
          <h2 class="section-title">
            {{ t.collectionDetail.items }} 
            <span v-if="itemsLoading && !itemsInitialLoading" class="items-count-loading">
              ({{ itemsCountDisplay }}<span class="loading-dots">...</span>)
            </span>
            <span v-else>({{ itemsCountDisplay }})</span>
          </h2>
          <div v-if="itemsInitialLoading" class="items-section__loading">
            <p>{{ t.collectionDetail.loadingItems }}</p>
          </div>
          <div v-else-if="items.length === 0 && !itemsLoading" class="items-section__empty">
            <p>{{ t.collectionDetail.noItems }}</p>
          </div>
          <!-- Scrollable list for 12 or fewer items -->
          <div v-else-if="!usePagination" class="items-section__list items-section__list--scrollable">
            <ItemCard
              v-for="item in items"
              :key="item.id"
              :title="item.title"
              :id="item.id"
              :date="item.date"
              :selfUrl="item.selfUrl"
            />
          </div>
          <!-- Paginated list for 13+ items -->
          <template v-else>
            <div class="items-section__list items-section__list--paginated">
              <ItemCard
                v-for="item in items"
                :key="item.id"
                :title="item.title"
                :id="item.id"
                :date="item.date"
                :selfUrl="item.selfUrl"
              />
            </div>
            <div class="items-section__pagination">
              <button 
                class="pagination-btn arrow" 
                @click="goToFirstPage" 
                :disabled="currentPage === 1"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="11 17 6 12 11 7"></polyline>
                  <polyline points="18 17 13 12 18 7"></polyline>
                </svg>
              </button>
              
              <button 
                class="pagination-btn arrow" 
                @click="prevPage" 
                :disabled="currentPage === 1"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
              </button>
              
              <button
                v-for="page in visiblePages"
                :key="page"
                class="pagination-btn"
                :class="{ active: page === currentPage }"
                @click="goToPage(page)"
              >
                {{ page }}
              </button>
              
              <button 
                class="pagination-btn arrow" 
                @click="nextPage" 
                :disabled="currentPage === totalPages"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </button>
              
              <button 
                class="pagination-btn arrow" 
                @click="goToLastPage" 
                :disabled="currentPage === totalPages"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="13 17 18 12 13 7"></polyline>
                  <polyline points="6 17 11 12 6 7"></polyline>
                </svg>
              </button>
              
              <div class="pagination-jump">
                <input
                  v-model="pageInput"
                  type="number"
                  class="pagination-input"
                  :min="1"
                  :max="totalPages"
                  :placeholder="String(currentPage)"
                  @keyup.enter="goToInputPage"
                />
                <span class="pagination-of">/ {{ totalPages }}</span>
                <button class="pagination-go-btn" @click="goToInputPage">{{ t.common.go }}</button>
              </div>
              
              <span class="pagination-info">
                ({{ items.length }} {{ t.common.total }})
              </span>
            </div>
          </template>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { Globe, ExternalLink, Building2 } from 'lucide-vue-next'
import InfoCard from '@/components/InfoCard.vue'
import ItemCard from '@/components/ItemCard.vue'
import { api } from '@/services/api'
import type { Collection } from '@/types/collection'
import { useI18n } from '@/composables/useI18n'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

const route = useRoute()
const { t } = useI18n()
const collectionId = computed(() => route.params.id as string)
const mapContainer = ref<HTMLElement | null>(null)
const map = ref<maplibregl.Map | null>(null)
const showContactModal = ref(false)
const showSourceModal = ref(false)
const expandedProperties = ref<Set<string>>(new Set())
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
  
  showToast(success ? t.value.common.copiedToClipboard : t.value.common.failedToCopy)
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

const toggleProperty = (key: string) => {
  if (expandedProperties.value.has(key)) {
    expandedProperties.value.delete(key)
  } else {
    expandedProperties.value.add(key)
  }
  // Trigger reactivity by creating a new Set
  expandedProperties.value = new Set(expandedProperties.value)
}

const truncateUrl = (url: string, maxLength: number = 40) => {
  if (url.length <= maxLength) return url
  return url.substring(0, maxLength - 3) + '...'
}

// Computed properties from STAC-conformant collection data (no more full_json wrapper)
const collectionTitle = computed(() => 
  collection.value?.title || t.value.collectionDetail.untitledCollection
)

const provider = computed(() => {
  const providers = collection.value?.providers
  return providers && providers.length > 0 && providers[0] ? providers[0].name : t.value.collectionDetail.unknownProvider
})

const platform = computed(() => {
  const keywords = collection.value?.keywords
  return keywords && keywords.length > 0 ? keywords[0] : null
})

const license = computed(() => 
  collection.value?.license || t.value.collectionDetail.unknownLicense
)

const description = computed(() => 
  collection.value?.description || t.value.collectionDetail.noDescription
)

const coordinateSystem = computed(() => 'EPSG:4326')

const bbox = computed(() => {
  const extent = collection.value?.extent?.spatial?.bbox
  if (extent && extent.length > 0 && extent[0] && extent[0].length === 4) {
    const bboxArray = extent[0]
    const west = bboxArray[0] ?? 0
    const south = bboxArray[1] ?? 0
    const east = bboxArray[2] ?? 0
    const north = bboxArray[3] ?? 0
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
  const cards: { icon: string; label: string; value: string }[] = []
  
  const temporalExtent = collection.value?.extent?.temporal?.interval
  if (temporalExtent && temporalExtent.length > 0 && temporalExtent[0]) {
    const interval = temporalExtent[0]
    const start = interval[0]
    const end = interval[1]
    if (start) {
      cards.push({
        icon: 'calendar',
        label: t.value.filters.startDate,
        value: new Date(start).toLocaleDateString()
      })
    }
    if (end) {
      cards.push({
        icon: 'calendar',
        label: t.value.filters.endDate,
        value: new Date(end).toLocaleDateString()
      })
    }
  }
  
  // Note: created_at/updated_at are not part of STAC spec, removed
  
  return cards
})

const metadata = computed(() => {
  const meta: { label: string; value: string }[] = []
  
  if (collection.value?.id) {
    meta.push({ label: t.value.collectionDetail.collectionId, value: collection.value.id })
  }
  
  if (collection.value?.stac_version) {
    meta.push({ label: t.value.collectionDetail.stacVersion, value: collection.value.stac_version })
  }
  
  const keywords = collection.value?.keywords
  if (keywords && keywords.length > 0) {
    meta.push({ label: t.value.collectionDetail.keywords, value: keywords.join(', ') })
  }
  
  const providers = collection.value?.providers
  if (providers && providers.length > 0) {
    meta.push({ 
      label: t.value.collectionDetail.providers, 
      value: providers.map(p => p.name).join(', ') 
    })
  }

  if (collection.value?.license) {
    meta.push({ label: t.value.filters.license, value: collection.value.license })
  }
  
  return meta
})

// Standard STAC fields that should not appear in "Additional Properties"
const standardStacFields = new Set([
  'type', 'id', 'stac_version', 'stac_extensions', 'title', 'description',
  'keywords', 'license', 'providers', 'extent', 'summaries', 'links', 'assets',
  // Our custom API fields
  'source_links', 'source_url', 'source_id', 'rank', 'is_active', 'is_api', 'stac_id'
])

// Helper to check if a value is empty/should not be displayed
const isEmptyValue = (value: unknown): boolean => {
  if (value === null || value === undefined) return true
  if (value === '') return true
  if (Array.isArray(value) && value.length === 0) return true
  if (typeof value === 'object' && !Array.isArray(value)) {
    // Check if all values in the object are null/empty
    const obj = value as Record<string, unknown>
    const values = Object.values(obj)
    if (values.length === 0) return true
    if (values.every(v => v === null || v === undefined || v === '')) return true
  }
  return false
}

// Additional properties computed from collection (STAC extensions, custom fields)
const additionalProperties = computed(() => {
  if (!collection.value) return []
  
  const props: { key: string; value: unknown }[] = []
  
  // Iterate through all collection properties
  for (const [key, value] of Object.entries(collection.value)) {
    // Skip standard STAC fields and empty values
    if (standardStacFields.has(key) || isEmptyValue(value)) {
      continue
    }
    
    props.push({ key, value })
  }
  
  // Sort by key name for consistent display
  props.sort((a, b) => a.key.localeCompare(b.key))
  
  return props
})

// Format property values for display
const formatPropertyValue = (value: unknown): string => {
  if (value === null || value === undefined) return 'N/A'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (typeof value === 'number') return String(value)
  if (typeof value === 'string') return value
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

const items = ref<Array<{ id: string; title: string; date: string; selfUrl: string }>>([])  
const itemsLoading = ref(false)
const itemsInitialLoading = ref(true) // For skeleton/initial state
const currentPage = ref(1)
const itemsPerPage = 9
const pageInput = ref('')
const allItemLinks = ref<Array<{ rel: string; href: string; type?: string }>>([])
// For API-based items (rel: "items"), store the fetched items directly
const isApiItems = ref(false)
// Track if there are more pages available (for "+" indicator)
const hasMorePages = ref(false)
// Store the base items URL for API pagination
const apiItemsBaseUrl = ref<string | null>(null)
// Total items count from first page features.length (used as page size indicator)
const apiPageSize = ref<number>(10)
// Cache for fetched API pages (page -> items)
const apiPagesCache = ref<Map<number, Array<{ id: string; title: string; date: string; selfUrl: string }>>>(new Map())
// Track loaded items count for display (from features.length on current page)
const loadedItemsCount = ref(0)
// Total matched items from API (numberMatched or context.matched)
const apiTotalMatched = ref<number | null>(null)
// Cache for fetched static items (page -> items)
const staticItemsCache = ref<Map<number, Array<{ id: string; title: string; date: string; selfUrl: string }>>>(new Map())

// Pagination logic - use pagination if more pages exist or enough items
const usePagination = computed(() => {
  if (isApiItems.value) {
    const count = apiTotalMatched.value ?? loadedItemsCount.value
    return count >= 13 || hasMorePages.value
  }
  return allItemLinks.value.length >= 13
})
const totalPages = computed(() => {
  if (isApiItems.value) {
    // If we know the total, calculate pages properly
    if (apiTotalMatched.value !== null) {
      return Math.ceil(apiTotalMatched.value / apiPageSize.value)
    }
    // If we have more pages but don't know the total, show current + 1
    if (hasMorePages.value) {
      return currentPage.value + 1
    }
    return currentPage.value
  }
  return Math.ceil(allItemLinks.value.length / itemsPerPage)
})
const totalItemsCount = computed(() => {
  if (isApiItems.value) {
    // Use API's total count if available
    return apiTotalMatched.value ?? loadedItemsCount.value
  }
  return allItemLinks.value.length
})
// Display string for items count (includes "+" if more pages exist but no total known)
const itemsCountDisplay = computed(() => {
  if (isApiItems.value) {
    // If we have the actual total from API, show it
    if (apiTotalMatched.value !== null) {
      return String(apiTotalMatched.value)
    }
    // Otherwise show loaded count with "+" if more exist
    if (hasMorePages.value) {
      return `${loadedItemsCount.value}+`
    }
  }
  return String(totalItemsCount.value)
})

// Calculate visible page numbers (show 5 pages at a time)
const visiblePages = computed(() => {
  const pages: number[] = []
  const maxVisible = 5
  let start = Math.max(1, currentPage.value - Math.floor(maxVisible / 2))
  let end = Math.min(totalPages.value, start + maxVisible - 1)
  
  // Adjust start if we're near the end
  if (end - start < maxVisible - 1) {
    start = Math.max(1, end - maxVisible + 1)
  }
  
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  
  return pages
})

const goToPage = async (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    await fetchItemsForPage(page)
  }
}

const goToFirstPage = () => goToPage(1)
const goToLastPage = () => goToPage(totalPages.value)
const nextPage = () => goToPage(currentPage.value + 1)
const prevPage = () => goToPage(currentPage.value - 1)

// Handle page input jump
const goToInputPage = () => {
  const page = parseInt(pageInput.value, 10)
  if (!isNaN(page) && page >= 1 && page <= totalPages.value) {
    goToPage(page)
    pageInput.value = ''
  }
}

// Helper function to resolve relative URLs against a base URL
const resolveUrl = (baseUrl: string, relativePath: string): string => {
  // Remove the filename from the base URL to get the directory
  const baseDir = baseUrl.substring(0, baseUrl.lastIndexOf('/') + 1)
  
  // Handle relative paths starting with ./
  if (relativePath.startsWith('./')) {
    relativePath = relativePath.substring(2)
  }
  
  // Handle parent directory references (..)
  let resolvedBase = baseDir
  while (relativePath.startsWith('../')) {
    relativePath = relativePath.substring(3)
    resolvedBase = resolvedBase.substring(0, resolvedBase.slice(0, -1).lastIndexOf('/') + 1)
  }
  
  return resolvedBase + relativePath
}

const fetchItems = async (page: number = 1) => {
  // Use source_links if available, otherwise fallback to links
  const sourceUrl = collection.value?.source_url
  const sourceLinks = collection.value?.source_links || []
  const regularLinks = collection.value?.links || []
  
  // Helper to format date nicely
  const formatDate = (isoString: string): string => {
    const date = new Date(isoString)
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })
  }
  
  // Helper to extract item data from a STAC item object
  const parseItemData = (itemData: Record<string, unknown>): { id: string; title: string; date: string; selfUrl: string } => {
    const props = (itemData.properties || {}) as Record<string, unknown>
    const title = (props.title as string) || (itemData.id as string) || 'Unknown'
    
    let dateStr = 'N/A'
    if (props.datetime) {
      dateStr = formatDate(props.datetime as string)
    } else if (props.start_datetime) {
      if (props.end_datetime) {
        dateStr = `${formatDate(props.start_datetime as string)} – ${formatDate(props.end_datetime as string)}`
      } else {
        dateStr = formatDate(props.start_datetime as string)
      }
    }
    
    // Extract self link from item links
    const links = (itemData.links || []) as Array<{ rel: string; href: string }>
    const selfLink = links.find(l => l.rel === 'self')
    const selfUrl = selfLink?.href || ''
    
    return {
      id: (itemData.id as string) || 'Unknown',
      title,
      date: dateStr,
      selfUrl
    }
  }
  
  // Separate links by type: 'item' (static catalog) vs 'items' (API endpoint)
  let singleItemLinks = sourceLinks.filter(link => link.rel === 'item')
  let itemsEndpointLinks = sourceLinks.filter(link => link.rel === 'items')
  
  // If no source_links, fallback to regular links
  if (singleItemLinks.length === 0 && itemsEndpointLinks.length === 0) {
    singleItemLinks = regularLinks.filter(link => link.rel === 'item')
    itemsEndpointLinks = regularLinks.filter(link => link.rel === 'items')
  }
  
  // Case 1: API-based items (rel: "items") - fetch from the items endpoint
  if (itemsEndpointLinks.length > 0 && singleItemLinks.length === 0) {
    isApiItems.value = true
    itemsLoading.value = true
    itemsInitialLoading.value = true
    
    try {
      const itemsLink = itemsEndpointLinks[0]
      if (!itemsLink) {
        throw new Error('No items endpoint link found')
      }
      let itemsUrl = itemsLink.href
      if (sourceUrl && !itemsLink.href.startsWith('http')) {
        itemsUrl = resolveUrl(sourceUrl, itemsLink.href)
      }
      
      // Store base URL for pagination
      apiItemsBaseUrl.value = itemsUrl
      
      // Fetch the first page for display
      const response = await fetch(itemsUrl)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      const data = await response.json()
      
      // Extract total count from API response (STAC API uses numberMatched or context.matched)
      if (data.numberMatched !== undefined) {
        apiTotalMatched.value = data.numberMatched
        console.log('[Items] API numberMatched:', data.numberMatched)
      } else if (data.context?.matched !== undefined) {
        apiTotalMatched.value = data.context.matched
        console.log('[Items] API context.matched:', data.context.matched)
      } else {
        apiTotalMatched.value = null
        console.log('[Items] No total count in API response')
      }
      
      // STAC API returns items in "features" array (GeoJSON FeatureCollection)
      const features = data.features || []
      console.log('[Items] First page features.length:', features.length, 'hasNext:', !!(data.links || []).find((l: { rel: string }) => l.rel === 'next'))
      
      const firstPageItems: Array<{ id: string; title: string; date: string; selfUrl: string }> = []
      for (const feature of features) {
        firstPageItems.push(parseItemData(feature))
      }
      
      // Use features.length as the page size and initial count
      apiPageSize.value = features.length || 10
      loadedItemsCount.value = features.length
      console.log('[Items] Set loadedItemsCount to:', loadedItemsCount.value, 'apiTotalMatched:', apiTotalMatched.value)
      
      // Cache first page and display it
      apiPagesCache.value.set(1, firstPageItems)
      items.value = firstPageItems
      
      // Check if more pages exist via "next" link
      const links = data.links || []
      const nextLink = links.find((l: { rel: string; href: string }) => l.rel === 'next')
      hasMorePages.value = !!nextLink
      console.log('[Items] hasMorePages:', hasMorePages.value)
      
      itemsLoading.value = false
      itemsInitialLoading.value = false
      
    } catch (error) {
      console.error('Failed to fetch items from API endpoint:', error)
      items.value = []
      itemsLoading.value = false
      itemsInitialLoading.value = false
    }
    
    return
  }
  
  // Case 2: Static catalog items (rel: "item") - individual item links
  isApiItems.value = false
  hasMorePages.value = false
  allItemLinks.value = singleItemLinks
  
  if (singleItemLinks.length === 0) {
    items.value = []
    itemsInitialLoading.value = false
    return
  }
  
  itemsLoading.value = true
  itemsInitialLoading.value = true
  
  // Calculate which items to fetch for the current page
  const start = (page - 1) * itemsPerPage
  const end = start + itemsPerPage
  const itemsToFetch = singleItemLinks.slice(start, end)
  
  const fetchedItems = await Promise.all(
    itemsToFetch.map(async (link) => {
      try {
        // Resolve the URL - if it's relative and we have a source_url, resolve against it
        let itemUrl = link.href
        if (sourceUrl && !link.href.startsWith('http')) {
          itemUrl = resolveUrl(sourceUrl, link.href)
        }
        
        const response = await fetch(itemUrl)
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }
        const itemData = await response.json()
        return parseItemData(itemData)
      } catch (error) {
        console.error(`Failed to fetch item from ${link.href}:`, error)
        // Extract item name from the href for display
        const filename = link.href.split('/').pop()?.replace('.json', '') || 'Unknown'
        return {
          id: filename,
          title: filename,
          date: 'N/A'
        }
      }
    })
  )
  
  items.value = fetchedItems
  staticItemsCache.value.set(page, fetchedItems)
  itemsLoading.value = false
  itemsInitialLoading.value = false
}

// Helper to format date nicely (shared)
const formatDate = (isoString: string): string => {
  const date = new Date(isoString)
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  })
}

// Helper to extract item data from a STAC item object (shared)
const parseItemDataShared = (itemData: Record<string, unknown>): { id: string; title: string; date: string; selfUrl: string } => {
  const props = (itemData.properties || {}) as Record<string, unknown>
  const title = (props.title as string) || (itemData.id as string) || 'Unknown'
  
  let dateStr = 'N/A'
  if (props.datetime) {
    dateStr = formatDate(props.datetime as string)
  } else if (props.start_datetime) {
    if (props.end_datetime) {
      dateStr = `${formatDate(props.start_datetime as string)} – ${formatDate(props.end_datetime as string)}`
    } else {
      dateStr = formatDate(props.start_datetime as string)
    }
  }
  
  // Extract self link from item links
  const links = (itemData.links || []) as Array<{ rel: string; href: string }>
  const selfLink = links.find(l => l.rel === 'self')
  const selfUrl = selfLink?.href || ''
  
  return {
    id: (itemData.id as string) || 'Unknown',
    title,
    date: dateStr,
    selfUrl
  }
}

// Fetch a specific page from API items endpoint (on-demand)
const fetchApiPage = async (page: number): Promise<Array<{ id: string; title: string; date: string; selfUrl: string }>> => {
  if (!apiItemsBaseUrl.value) return []
  
  // Check cache first
  const cached = apiPagesCache.value.get(page)
  if (cached) {
    return cached
  }
  
  // Build URL with pagination - most STAC APIs support limit and offset or page parameter
  // We'll use token-based pagination by following next links from page 1
  // For direct page access, we need to iterate through pages
  
  // If requesting page 1, we already have it cached
  if (page === 1) {
    return apiPagesCache.value.get(1) || []
  }
  
  // For other pages, we need to follow next links sequentially
  // Start from the highest cached page and follow next links
  let highestCachedPage = 1
  for (const [p] of apiPagesCache.value) {
    if (p > highestCachedPage && p < page) {
      highestCachedPage = p
    }
  }
  
  // We need to fetch pages from highestCachedPage+1 to page
  let currentFetchPage = highestCachedPage
  let nextUrl: string | null = null
  
  // If we're at page 1, start from base URL
  if (currentFetchPage === 1) {
    // Fetch page 1 to get the next link
    const response = await fetch(apiItemsBaseUrl.value)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const data = await response.json()
    const links = data.links || []
    const nextLink = links.find((l: { rel: string; href: string }) => l.rel === 'next')
    nextUrl = nextLink ? nextLink.href : null
    currentFetchPage = 1
  }
  
  // Follow next links until we reach the desired page
  while (currentFetchPage < page && nextUrl) {
    currentFetchPage++
    
    const response = await fetch(nextUrl)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const data = await response.json()
    
    // Parse items
    const features = data.features || []
    const pageItems: Array<{ id: string; title: string; date: string; selfUrl: string }> = []
    for (const feature of features) {
      pageItems.push(parseItemDataShared(feature))
    }
    
    // Cache this page
    apiPagesCache.value.set(currentFetchPage, pageItems)
    
    // Update loaded count
    loadedItemsCount.value = Math.max(loadedItemsCount.value, currentFetchPage * apiPageSize.value)
    
    // Get next link
    const links = data.links || []
    const nextLink = links.find((l: { rel: string; href: string }) => l.rel === 'next')
    nextUrl = nextLink ? nextLink.href : null
    hasMorePages.value = !!nextUrl
  }
  
  return apiPagesCache.value.get(page) || []
}

// Fetch items for a specific page (uses cached data or fetches on-demand)
const fetchItemsForPage = async (page: number) => {
  // For API-based items, fetch the specific page on-demand
  if (isApiItems.value) {
    // Check cache first
    const cached = apiPagesCache.value.get(page)
    if (cached) {
      items.value = cached
      return
    }
    
    // Fetch the page
    itemsLoading.value = true
    try {
      const pageItems = await fetchApiPage(page)
      items.value = pageItems
    } catch (error) {
      console.error('Failed to fetch API page:', error)
      items.value = []
    }
    itemsLoading.value = false
    return
  }
  
  // For static catalog items, check cache first
  const cached = staticItemsCache.value.get(page)
  if (cached) {
    items.value = cached
    return
  }
  
  // Fetch the specific page
  const sourceUrl = collection.value?.source_url
  const start = (page - 1) * itemsPerPage
  const end = start + itemsPerPage
  
  if (allItemLinks.value.length === 0) {
    items.value = []
    return
  }
  
  itemsLoading.value = true
  
  const itemsToFetch = allItemLinks.value.slice(start, end)
  
  const fetchedItems = await Promise.all(
    itemsToFetch.map(async (link) => {
      try {
        let itemUrl = link.href
        if (sourceUrl && !link.href.startsWith('http')) {
          itemUrl = resolveUrl(sourceUrl, link.href)
        }
        
        const response = await fetch(itemUrl)
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }
        const itemData = await response.json()
        return parseItemDataShared(itemData)
      } catch (error) {
        console.error(`Failed to fetch item from ${link.href}:`, error)
        const filename = link.href.split('/').pop()?.replace('.json', '') || 'Unknown'
        return {
          id: filename,
          title: filename,
          date: 'N/A',
          selfUrl: link.href
        }
      }
    })
  )
  
  items.value = fetchedItems
  staticItemsCache.value.set(page, fetchedItems)
  itemsLoading.value = false
}

// Provider information computed from collection
const providerInfo = computed(() => {
  const providers = collection.value?.providers || []
  return providers.map(p => ({
    name: p.name || t.value.common.unknown,
    roles: Array.isArray(p.roles) ? p.roles : (p.roles ? [p.roles] : []),
    url: p.url || '',
    description: p.description || ''
  }))
})

// Translate provider roles
const translateRoles = (roles: string[]): string => {
  if (!roles || roles.length === 0) return ''
  const roleTranslations = t.value.collectionDetail.providerRoles as Record<string, string>
  return roles.map(role => roleTranslations[role.toLowerCase()] || role).join(', ')
}

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
  if (!extent || extent.length === 0 || !extent[0] || extent[0].length !== 4) return
  
  const bboxArray = extent[0]
  const west = bboxArray[0] ?? 0
  const south = bboxArray[1] ?? 0
  const east = bboxArray[2] ?? 0
  const north = bboxArray[3] ?? 0
  
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
    center: [(west + east) / 2, (south + north) / 2] as [number, number],
    zoom: 5
  })
  
  // Wait for map to load before adding bbox
  // @ts-expect-error - maplibre-gl types cause deep recursion
  map.value.on('load', () => {
    if (!map.value) return
    
    // Add bounding box as a source
    map.value.addSource('bbox', {
      type: 'geojson',
      data: {
        type: 'Feature' as const,
        properties: {},
        geometry: {
          type: 'Polygon' as const,
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
    
    // Show collection data immediately, initialize map
    loading.value = false
    setTimeout(initializeMap, 100)
    
    // Fetch items asynchronously (non-blocking)
    fetchItems()
    
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to fetch collection'
    console.error('Error fetching collection:', err)
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
