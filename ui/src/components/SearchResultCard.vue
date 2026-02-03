<template>
  <div class="search-result-card">
    <div class="card-header">
      <div class="card-header__top">
        <h3 class="card-title">{{ title }}</h3>
      </div>
      
      <div class="provider-info">
        <!-- <span class="license-badge">{{ license }}</span> -->
        {{ provider }} • {{ platform }}  
      </div>
    </div>

    <div class="card-body">
      <p class="description">{{ description }}</p>
      
      <div class="tags-list">
        <span v-for="tag in displayedTags" :key="tag" class="tag">
          {{ tag }}
        </span>
        <span v-if="remainingTagsCount > 0" class="tag tag-more">
          +{{ remainingTagsCount }} more
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

// Extract data from STAC-conformant collection (no more full_json wrapper)
const title = computed(() => props.collection.title || 'Untitled Collection');
const description = computed(() => props.collection.description || 'No description available');

// Get provider from providers array
const provider = computed(() => {
  const providers = props.collection.providers;
  return providers?.[0]?.name ?? 'Unknown Provider';
});

// Get platform from keywords (first keyword)
const platform = computed(() => {
  const keywords = props.collection.keywords;
  return keywords?.[0] ?? 'No platform data';
});

// Convert keywords array for tags
const tagList = computed(() => {
  return props.collection.keywords || [];
});

// Smart tag limiting based on character count to fit in 2 rows
// Approximate: 500px card width, ~8-12 chars per tag average, 2 rows ~= 100-120 chars
const MAX_CHAR_LENGTH = 100; // Total character budget for 2 rows
const MORE_TAG_LENGTH = 10; // Reserve space for "+X more" tag

const displayedTags = computed(() => {
  if (tagList.value.length === 0) return [];
  
  let totalLength = 0;
  let visibleTags: string[] = [];
  
  for (const [i, tag] of tagList.value.entries()) {
    if (!tag) continue;
    const tagLength = tag.length;
    
    // Check if adding this tag would exceed the limit
    // If there are more tags after this, reserve space for "+X more"
    const hasMoreTags = i < tagList.value.length - 1;
    const maxAllowed = hasMoreTags ? MAX_CHAR_LENGTH - MORE_TAG_LENGTH : MAX_CHAR_LENGTH;
    
    if (totalLength + tagLength <= maxAllowed) {
      visibleTags.push(tag);
      totalLength += tagLength;
    } else {
      // This tag would overflow, stop here
      break;
    }
  }
  
  return visibleTags;
});

const remainingTagsCount = computed(() => {
  const remaining = tagList.value.length - displayedTags.value.length;
  return remaining > 0 ? remaining : 0;
});

// Get source link from STAC links array
const sourceLink = computed(() => {
  const links = props.collection.links || [];
  const selfLink = links.find(link => link.rel === 'self');
  const rootLink = links.find(link => link.rel === 'root');
  return selfLink?.href ?? rootLink?.href ?? null;
});

const viewDetails = () => {
  router.push(`/collections/${props.collection.id}`);
};

const openSource = () => {
  const link = sourceLink.value;
  if (link) {
    window.open(link, '_blank');
  }
};
</script>

<style scoped>
@import '@/assets/styles/components/search-result-card.css';
</style>