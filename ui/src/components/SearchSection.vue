<template>
  <div class="search-section">
    <div class="search-header">
      <h2 class="search-title">{{ t.search.title }}</h2>
      <p class="search-count">{{ totalCount }} {{ t.search.collections }}</p>
    </div>
    
    <div class="search-bar">
      <Search class="search-icon" :size="20" />
      <input 
        type="text"
        class="search-input"
        :value="modelValue"
        @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
        :placeholder="t.search.placeholder"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { Search } from 'lucide-vue-next'
import { useI18n } from '@/composables/useI18n'

const { t } = useI18n()

defineProps<{
  modelValue: string
  resultCount: number
  totalCount: number
}>()

defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>
