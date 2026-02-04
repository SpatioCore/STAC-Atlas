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
          +{{ remainingTagsCount }} {{ t.common.more }}
        </span>
      </div>
    </div>

    <div class="card-footer">
      <button @click="viewDetails">
        {{ t.collectionCard.viewDetails }}
      </button>
      
      <button @click="openSource" :disabled="!sourceLink">
        {{ t.collectionCard.source }}
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
import { useI18n } from '@/composables/useI18n';

const router = useRouter();
const { t } = useI18n();

const props = defineProps<{
  collection: Collection;
}>();

// Extract data from STAC-conformant collection (no more full_json wrapper)
const title = computed(() => props.collection.title || t.value.collectionCard.untitledCollection);
const description = computed(() => props.collection.description || t.value.collectionCard.noDescription);

// Get provider from providers array
const provider = computed(() => {
  const providers = props.collection.providers;
  if (providers && providers.length > 0 && providers[0]) {
    return providers[0].name;
  }
  return t.value.collectionCard.unknownProvider;
});

// Get platform from keywords (first keyword)
const platform = computed(() => {
  const keywords = props.collection.keywords;
  if (keywords && keywords.length > 0) {
    return keywords[0];
  }
  return t.value.collectionCard.noPlatformData;
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
  if (!tagList.value || tagList.value.length === 0) return [];
  
  let totalLength = 0;
  let visibleTags: string[] = [];
  
  for (let i = 0; i < tagList.value.length; i++) {
    const tag = tagList.value[i];
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

// Get source link from STAC links array - prefer source_root for external catalogs
const sourceLink = computed(() => {
  const links = props.collection.links;
  if (links) {
    // Prefer source_root (original external catalog) over self/root (local API)
    const sourceRootLink = links.find(link => link.rel === 'source_root');
    const selfLink = links.find(link => link.rel === 'self');
    const rootLink = links.find(link => link.rel === 'root');
    return sourceRootLink?.href || selfLink?.href || rootLink?.href;
  }
  return null;
});

const viewDetails = () => {
  router.push(`/collections/${props.collection.id}`);
};

const openSource = () => {
  if (sourceLink.value) {
    // Open in STAC Browser - remove protocol from URL
    const urlWithoutProtocol = sourceLink.value.replace(/^https?:\/\//, '');
    const stacBrowserUrl = `https://radiantearth.github.io/stac-browser/#/external/${urlWithoutProtocol}`;
    window.open(stacBrowserUrl, '_blank');
  }
};
</script>

<style scoped>
@import '@/assets/styles/components/search-result-card.css';
</style>