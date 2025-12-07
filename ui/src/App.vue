<script setup lang="ts">
import { ref } from 'vue'
import Navbar from '@/components/Navbar.vue'
import FilterSection from '@/components/FilterSection.vue'
import SearchSection from '@/components/SearchSection.vue'
import SearchResults from '@/components/SearchResults.vue'

const searchQuery = ref('')

// Collections would typically be fetched from an API
const Collections = ref([])
</script>

<template>
  <div class="app-layout">
    <Navbar />
    
    <div class="main-content">
      <FilterSection />
      
      <div class="content-area">
        <SearchSection 
          v-model="searchQuery"
          :result-count="Collections.length"
        />
        
        <SearchResults :collections="Collections" />
      </div>
    </div>
  </div>
</template>

