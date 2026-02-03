<template>
  <div class="item-card" :class="{ 'item-card--clickable': hasLink }" @click="openInStacBrowser">
    <div class="item-card__content">
      <span class="item-card__title">{{ title }}</span>
      <span class="item-card__id">{{ id }}</span>
      <span class="item-card__date">{{ date }}</span>
    </div>
    <svg v-if="hasLink" class="item-card__external-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
      <polyline points="15 3 21 3 21 9"></polyline>
      <line x1="10" y1="14" x2="21" y2="3"></line>
    </svg>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  title: string;
  id: string;
  date: string;
  selfUrl?: string;
}>();

const hasLink = computed(() => !!props.selfUrl);

const openInStacBrowser = () => {
  if (!props.selfUrl) return;
  
  // Remove https:// or http:// from the URL
  const urlWithoutProtocol = props.selfUrl.replace(/^https?:\/\//, '');
  const stacBrowserUrl = `https://radiantearth.github.io/stac-browser/#/external/${urlWithoutProtocol}`;
  
  window.open(stacBrowserUrl, '_blank');
};
</script>

<style scoped>
@import '@/assets/styles/components/item-card.css';
</style>