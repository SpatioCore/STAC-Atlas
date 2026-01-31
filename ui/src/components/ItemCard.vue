<template>
  <div class="item-card">
    <div class="item-card__content">
      <span class="item-card__title">{{ title }}</span>
      <span class="item-card__id">{{ id }}</span>
      <span class="item-card__date">{{ date }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string;
  id: string;
  date: string;
}>();
</script>

<style scoped>
@import '@/assets/styles/components/item-card.css';
</style>