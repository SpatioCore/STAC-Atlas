<template>
  <div class="search-results">
    <div class="results-grid">
      <SearchResultCard
        v-for="collection in collections"
        :key="collection.id"
        :collection="collection"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import SearchResultCard from './SearchResultCard.vue'
import type { Collection } from '@/types/collection'

defineProps<{
  collections: Collection[]
}>()
</script>
