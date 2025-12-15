<template>
  <div class="search-result-card">
    <div class="card-header">
      <div class="card-header__top">
        <h3 class="card-title">{{ title }}</h3>
        <span class="license-badge">{{ license }}</span>
      </div>
      
      <div class="provider-info">
        {{ provider }} • {{ platform }}
      </div>
    </div>

    <div class="card-body">
      <p class="description">{{ description }}</p>
      
      <div class="tags-list">
        <span v-for="tag in tagList" :key="tag" class="tag">
          {{ tag }}
        </span>
      </div>
    </div>

    <div class="card-footer">
      <button @click="viewDetails">
        View Details
      </button>
      
      <button @click="openSource" :disabled="!sourceLink">
        Source
        <ExternalLink :size="16" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { ExternalLink } from 'lucide-vue-next';
import type { Collection } from '@/types/collection';

const router = useRouter();

const props = defineProps<{
  collection: Collection;
}>();

// Extract data from full_json (STAC Collection) or fallback to top-level fields
const title = computed(() => props.collection.title || props.collection.full_json?.title || 'Untitled Collection');
const description = computed(() => props.collection.description || props.collection.full_json?.description || 'No description available');
const license = computed(() => props.collection.license || props.collection.full_json?.license || 'Unknown');

// Get provider from full_json.providers array
const provider = computed(() => {
  const providers = props.collection.full_json?.providers;
  if (providers && providers.length > 0) {
    return providers[0].name;
  }
  return 'Unknown Provider';
});

// Get platform from keywords or just use first keyword
const platform = computed(() => {
  const keywords = props.collection.full_json?.keywords;
  if (keywords && keywords.length > 0) {
    return keywords[0];
  }
  return 'N/A';
});

// Convert keywords array to comma-separated string for tags
const tagList = computed(() => {
  const keywords = props.collection.full_json?.keywords;
  return keywords || [];
});

// Get source link from full_json.links
const sourceLink = computed(() => {
  const links = props.collection.full_json?.links;
  if (links) {
    const selfLink = links.find(link => link.rel === 'self');
    const rootLink = links.find(link => link.rel === 'root');
    return selfLink?.href || rootLink?.href;
  }
  return null;
});

const viewDetails = () => {
  router.push(`/collections/${props.collection.id}`);
};

const openSource = () => {
  if (sourceLink.value) {
    window.open(sourceLink.value, '_blank');
  }
};
</script>

<style scoped>
@import '@/assets/styles/components/search-result-card.css';
</style>