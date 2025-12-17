<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import FilterSection from '@/components/FilterSection.vue'
import SearchSection from '@/components/SearchSection.vue'
import SearchResults from '@/components/SearchResults.vue'
import { api } from '@/services/api'
import type { Collection } from '@/types/collection'

const searchQuery = ref('')
const Collections = ref<Collection[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

// Pagination state
const currentPage = ref(1)
const itemsPerPage = 25
const totalCollections = ref(0)

// Calculate total pages
const totalPages = computed(() => Math.ceil(totalCollections.value / itemsPerPage))

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

// Fetch collections with pagination
const fetchCollections = async (page: number = 1) => {
  loading.value = true
  error.value = null
  
  try {
    const token = (page - 1) * itemsPerPage
    const response = await api.getCollections({ 
      limit: itemsPerPage,
      token: token
    })
    Collections.value = response.collections
    totalCollections.value = response.context?.matched || 0
    currentPage.value = page
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to fetch collections'
    console.error('Error fetching collections:', err)
  } finally {
    loading.value = false
  }
}

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

// Initial load
onMounted(() => {
  fetchCollections(1)
})
</script>

<template>
  <div class="home">
    <FilterSection />
    
    <div class="content-area">
      <SearchSection 
        v-model="searchQuery"
        :result-count="Collections.length"
      />
      
      <div v-if="loading" class="loading-message">
        Loading collections...
      </div>
      
      <div v-else-if="error" class="error-message">
        {{ error }}
      </div>
      
      <template v-else>
        <SearchResults :collections="Collections" />
        
        <!-- Pagination Controls -->
        <div v-if="totalPages > 1" class="pagination">
          <button 
            class="pagination-btn" 
            :disabled="currentPage === 1"
            @click="goToFirstPage"
          >
            ««
          </button>
          
          <button 
            class="pagination-btn" 
            :disabled="currentPage === 1"
            @click="goToPrevPage"
          >
            «
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
            »
          </button>
          
          <button 
            class="pagination-btn" 
            :disabled="currentPage === totalPages"
            @click="goToLastPage"
          >
            »»
          </button>
          
          <span class="pagination-info">
            Page {{ currentPage }} of {{ totalPages }} ({{ totalCollections }} total)
          </span>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.home {
  display: flex;
  width: 100vw;
}

.content-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: auto;
}

.loading-message,
.error-message {
  padding: 2rem;
  text-align: center;
  font-size: 1.1rem;
}

.loading-message {
  color: var(--color-text-secondary, #666);
}

.error-message {
  color: var(--color-error, #d32f2f);
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm);
  margin-top: auto;
  border-top: 1px solid var(--border);
}

.pagination-btn {
  min-width: 20px;
  height: 25px;
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px solid var(--border);
  background-color: var(--bg);
  color: var(--text);
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  transition: all var(--transition-fast);
}

.pagination-btn:hover:not(:disabled) {
  background-color: var(--muted-bg);
  border-color: var(--primary);
}

.pagination-btn.active {
  background-color: var(--primary);
  border-color: var(--primary);
}

.pagination-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.pagination-info {
  min-width: 150px;
  margin-left: var(--spacing-md);
  font-size: var(--font-size-sm, 13px);
  color: var(--muted-fg, #666);
}
</style>
