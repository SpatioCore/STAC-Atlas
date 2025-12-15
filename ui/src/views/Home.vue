<script setup lang="ts">
import { ref, onMounted } from 'vue'
import FilterSection from '@/components/FilterSection.vue'
import SearchSection from '@/components/SearchSection.vue'
import SearchResults from '@/components/SearchResults.vue'
import { api } from '@/services/api'
import type { Collection } from '@/types/collection'

const searchQuery = ref('')
const Collections = ref<Collection[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

// Fetch all collections on component mount
onMounted(async () => {
  loading.value = true
  error.value = null
  
  try {
    const response = await api.getCollections({ 
      // limit: 10 // Uncomment to limit results to 10
    })
    Collections.value = response.collections
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to fetch collections'
    console.error('Error fetching collections:', err)
  } finally {
    loading.value = false
  }
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
      
      <SearchResults v-else :collections="Collections" />
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
</style>
