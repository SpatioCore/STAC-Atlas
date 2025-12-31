<template>
  <div class="search-section">
    <div class="search-header">
      <h2 class="search-title">Search Results</h2>
      <p class="search-count">{{ resultCount }} of {{ totalCount }} collections</p>
    </div>
    
    <div class="search-bar">
      <Search class="search-icon" :size="20" />
      <input 
        type="text"
        class="search-input"
        :value="modelValue"
        @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
        placeholder="Search collections by title, description, keywords..."
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { Search } from 'lucide-vue-next'

defineProps<{
  modelValue: string
  resultCount: number
  totalCount: number
}>()

defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>
