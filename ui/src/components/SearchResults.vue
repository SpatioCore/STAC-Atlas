<template>
  <div class="search-results">
    <div class="results-grid">
      <SearchResultCard
        v-for="collection in collections"
        :key="collection.id"
        :id="collection.id"
        :title="collection.title"
        :tags="collection.tags"
        :provider="collection.provider"
        :platform="collection.platform"
        :description="collection.description"
        :license="collection.license"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import SearchResultCard from './SearchResultCard.vue'

defineProps<{
  collections: Array<{
    id: string
    title: string
    tags: string
    provider: string
    platform: string
    description: string
    license: string
  }>
}>()
</script>
