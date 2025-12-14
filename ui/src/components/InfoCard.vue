<template>
  <div class="info-card">
    <div class="info-card__icon-wrapper">
      <span class="material-icons" v-if="false">image</span> <span class="icon-placeholder">{{ icon }}</span> 
    </div>

    <div class="info-card__content">
      <span class="info-card__label">{{ label }}</span>
      <span class="info-card__value">{{ value }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">

defineProps<{
  icon: string;
  label: string;
  value: string;
}>();
</script>

<style scoped>

@import '@/assets/styles/components/info-card.css';
</style>