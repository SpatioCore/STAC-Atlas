<template>
  <div class="item-card">
    <div class="item-card__thumbnail-container">
      <img 
        v-if="!imageError && thumbnail"
        :src="thumbnail" 
        :alt="`Thumbnail for ${id}`" 
        class="item-card__thumbnail"
        @error="imageError = true"
      />
      <div v-else class="item-card__placeholder">
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          stroke-width="1.5" 
          stroke-linecap="round" 
          stroke-linejoin="round"
          class="item-card__placeholder-icon"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <circle cx="8.5" cy="8.5" r="1.5"/>
          <polyline points="21 15 16 10 5 21"/>
        </svg>
      </div>
    </div>

    <div class="item-card__content">
      <span class="item-card__id">{{ id }}</span>
      
      <div class="item-card__meta">
        <span class="item-card__date">{{ date }}</span>
        <span class="item-card__coverage">{{ coverage }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

defineProps<{
  id: string;
  date: string;
  coverage: string;
  thumbnail: string;
}>();

const imageError = ref(false);
</script>

<style scoped>
@import '@/assets/styles/components/item-card.css';
</style>