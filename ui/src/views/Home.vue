<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { storeToRefs } from 'pinia'
import FilterSection from '@/components/FilterSection.vue'
import SearchSection from '@/components/SearchSection.vue'
import SearchResults from '@/components/SearchResults.vue'
import { api } from '@/services/api'
import type { Collection } from '@/types/collection'
import { useFilterStore } from '@/stores/filterStore'
import { useI18n } from '@/composables/useI18n'

const { t } = useI18n()

// Use Pinia store
const filterStore = useFilterStore()
const { searchQuery, currentPage, totalCollections, totalPages, activeFilters } = storeToRefs(filterStore)

const Collections = ref<Collection[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const pageInput = ref('')

const itemsPerPage = 48

// Debounce timer for search
let searchDebounceTimer: ReturnType<typeof setTimeout> | null = null

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

// Fetch collections with pagination and search
const fetchCollections = async (page: number = 1) => {
  loading.value = true
  error.value = null
  
  try {
    const token = (page - 1) * itemsPerPage
    const response = await api.getCollections({ 
      limit: itemsPerPage,
      token: token,
      q: searchQuery.value.trim() || undefined,
      ...activeFilters.value
    })
    Collections.value = response.collections
    filterStore.totalCollections = response.context?.matched || 0
    filterStore.currentPage = page
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to fetch collections'
    console.error('Error fetching collections:', err)
  } finally {
    loading.value = false
  }
}

// Handle filter apply - uses store's activeFilters computed property
const handleFilterApply = () => {
  fetchCollections(1) // Reset to page 1 when filters change
}

// Handle filter reset
const handleFilterReset = () => {
  filterStore.resetFilters()
  fetchCollections(1)
}

// Watch for search query changes with debounce
watch(searchQuery, () => {
  if (searchDebounceTimer) {
    clearTimeout(searchDebounceTimer)
  }
  
  searchDebounceTimer = setTimeout(() => {
    // Reset to page 1 when searching
    fetchCollections(1)
  }, 300) // 300ms debounce
})

// Page navigation handlers
const goToPage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    fetchCollections(page)
  }
}

const goToFirstPage = () => goToPage(1)
const goToLastPage = () => goToPage(totalPages.value)
const goToNextPage = () => goToPage(currentPage.value + 1)
const goToPrevPage = () => goToPage(currentPage.value - 1)

// Handle page input jump
const goToInputPage = () => {
  const page = parseInt(pageInput.value, 10)
  if (!isNaN(page) && page >= 1 && page <= totalPages.value) {
    goToPage(page)
    pageInput.value = ''
  }
}

// Initial load
onMounted(() => {
  fetchCollections(1)
})
</script>

<template>
  <div class="home">
    <FilterSection 
      @apply="handleFilterApply"
      @reset="handleFilterReset"
    />
    
    <div class="content-area">
      <SearchSection 
        v-model="searchQuery"
        :result-count="Collections.length"
        :total-count="totalCollections"
      />
      
      <div v-if="loading" class="loading-container">
        <div class="loading-spinner"></div>
        <span class="loading-text">{{ t.search.loadingCollections }}</span>
      </div>
      
      <div v-else-if="error" class="error-message">
        {{ error }}
      </div>
      
      <template v-else>
        <div v-if="Collections.length === 0" class="no-results">
          <p class="no-results-text">{{ t.search.noResults }}</p>
          <p class="no-results-hint">{{ t.search.noResultsHint }}</p>
        </div>
        
        <SearchResults v-else :collections="Collections" />
        
        <!-- Pagination Controls -->
        <div v-if="totalPages > 1" class="pagination">
          <button 
            class="pagination-btn" 
            :disabled="currentPage === 1"
            @click="goToFirstPage"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="11 17 6 12 11 7"></polyline>
              <polyline points="18 17 13 12 18 7"></polyline>
            </svg>
          </button>
          
          <button 
            class="pagination-btn" 
            :disabled="currentPage === 1"
            @click="goToPrevPage"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
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
            class="pagination-btn" 
            :disabled="currentPage === totalPages"
            @click="goToNextPage"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
          
          <button 
            class="pagination-btn" 
            :disabled="currentPage === totalPages"
            @click="goToLastPage"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
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
            ({{ totalCollections }} {{ t.common.total }})
          </span>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
@import '@/assets/styles/views/home.css';
</style>
