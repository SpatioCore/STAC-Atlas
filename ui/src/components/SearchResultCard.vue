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
      <button class="btn btn-primary" @click="viewDetails">
        View Details
      </button>
      
      <button class="btn btn-secondary">
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

const router = useRouter();

const props = defineProps<{
  id: string;
  title: string;
  tags: string; // Kommt als String rein, z.B. "Optical, Sentinel, ESA"
  provider: string;
  platform: string;
  description: string;
  license: string;
}>();

// Hilfsfunktion: Macht aus "Tag1, Tag2" ein Array ["Tag1", "Tag2"]
const tagList = computed(() => {
  if (!props.tags) return [];
  return props.tags.split(',').map(tag => tag.trim());
});

const viewDetails = () => {
  router.push(`/collections/${props.id}`);
};
</script>

<style scoped>
@import '@/assets/styles/components/search-result-card.css';
</style>