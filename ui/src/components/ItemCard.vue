<template>
  <div class="item-card">
    <img 
      :src="thumbnail" 
      :alt="`Thumbnail for ${id}`" 
      class="item-card__thumbnail"
    />

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
defineProps<{
  id: string;
  date: string;
  coverage: string;
  thumbnail: string;
}>();
</script>

<style scoped>
@import '@/assets/styles/components/item-card.css';
</style>