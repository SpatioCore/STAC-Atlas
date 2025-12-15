<script setup lang="ts">
import { ref } from 'vue'
import FilterSection from '@/components/FilterSection.vue'
import SearchSection from '@/components/SearchSection.vue'
import SearchResults from '@/components/SearchResults.vue'

const searchQuery = ref('')
const Collections = ref([])
</script>

<template>
  <div class="home">
    <FilterSection />
    
    <div class="content-area">
      <SearchSection 
        v-model="searchQuery"
        :result-count="Collections.length"
      />
      
      <SearchResults :collections="Collections" />
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
</style>
