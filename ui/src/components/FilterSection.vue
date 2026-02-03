<template>
  <aside class="filter-section">
    <div class="filter-top">
      <div class="filter-group">
        <h3 class="filter-title">
          <MapPin class="filter-icon" :size="20" />
          {{ t.filters.spatialFilter }}
        </h3>
        <button class="filter-action-btn" @click="openBboxModal">
          <Box class="icon" :size="16" />
          {{ t.filters.drawBoundingBox }}
        </button>
        <div v-if="drawnBbox" class="drawn-bbox-display">
          <div class="bbox-coords">
            <div class="bbox-coord-row">
              <div class="bbox-coord-content">
                <span class="bbox-coord-label">{{ t.filters.west }}:</span>
                <span class="bbox-coord-value">{{ formattedBbox.west }}</span>
              </div>
              
              <div class="bbox-coord-content">
                <span class="bbox-coord-label">{{ t.filters.east }}:</span>
                <span class="bbox-coord-value">{{ formattedBbox.east }}</span>
              </div>
            </div>
            <div class="bbox-coord-row">
              <div class="bbox-coord-content">
                <span class="bbox-coord-label">{{ t.filters.south }}:</span>
                <span class="bbox-coord-value">{{ formattedBbox.south }}</span>
              </div>
              <div class="bbox-coord-content">
                <span class="bbox-coord-label">{{ t.filters.north }}:</span>
                <span class="bbox-coord-value">{{ formattedBbox.north }}</span>
              </div>
            </div>
          </div>
          <button class="bbox-clear" @click="clearDrawnBbox">
            <X :size="14" />
          </button>
        </div>
        <div class="filter-field">
          <label class="filter-label" for="region-select">{{ t.filters.selectRegion }}</label>
          <CustomSelect
            id="region-select"
            v-model="selectedRegion"
            :options="regionOptions"
            placeholder="Select a region"
            :disabled="!!drawnBbox"
          />
        </div>
      </div>

      <div class="filter-group">
        <h3 class="filter-title">
          <Calendar class="filter-icon" :size="20" />
          {{ t.filters.temporalFilter }}
        </h3>
        <div class="filter-field">
          <label class="filter-label" for="start-date">{{ t.filters.startDate }}</label>
          <input 
            id="start-date"
            v-model="startDate"
            type="date" 
            class="filter-input"
            placeholder="tt.mm.jjjj"
          />
        </div>
        <div class="filter-field">
          <label class="filter-label" for="end-date">{{ t.filters.endDate }}</label>
          <input 
            id="end-date"
            v-model="endDate"
            type="date" 
            class="filter-input"
            placeholder="tt.mm.jjjj"
          />
        </div>
      </div>

      <div class="filter-group">
        <h3 class="filter-title">{{ t.filters.provider }}</h3>
        <div class="filter-field">
          <CustomSelect
            v-model="selectedProvider"
            :options="providerOptions"
            placeholder="All Providers"
          />
        </div>
      </div>

      <div class="filter-group">
        <h3 class="filter-title">{{ t.filters.license }}</h3>
        <div class="filter-field">
          <CustomSelect
            v-model="selectedLicense"
            :options="licenseOptions"
            placeholder="All Licenses"
          />
        </div>
      </div>

      <div class="filter-group">
        <h3 class="filter-title">
          <Settings class="filter-icon" :size="20" />
          {{ t.filters.collectionStatus }}
        </h3>
        <div class="filter-field">
          <label class="filter-label" for="active-filter">{{ t.filters.activeStatus }}</label>
          <CustomSelect
            id="active-filter"
            v-model="activeFilter"
            :options="activeOptions"
            placeholder="All"
          />
        </div>
        <div class="filter-field">
          <label class="filter-label" for="api-filter">{{ t.filters.apiStatus }}</label>
          <CustomSelect
            id="api-filter"
            v-model="apiFilter"
            :options="apiOptions"
            placeholder="All"
          />
        </div>
      </div>
    </div>

    <div class="filter-bottom">
      <div class="filter-group">
        <h3 class="filter-title">
          <Code class="filter-icon" :size="20" />
          {{ t.filters.cql2Filter }}
        </h3>
        <div class="filter-field">
          <textarea
            id="cql2-filter"
            v-model="cql2Filter"
            class="filter-textarea"
            placeholder="Text: title LIKE '%Sentinel%'&#10;JSON: {&quot;op&quot;:&quot;=&quot;,&quot;args&quot;:[{&quot;property&quot;:&quot;license&quot;},&quot;CC-BY-4.0&quot;]}"
            rows="4"
          ></textarea>
          <p class="filter-hint" :class="{ 'formatting': isFormattingJson }">
            <template v-if="isFormattingJson">{{ t.filters.formattingJson }}</template>
            <template v-else>{{ t.filters.cql2Hint }}</template>
          </p>
        </div>
      </div>
    </div>

    <div class="filter-actions">
      <button class="btn-apply" @click="applyFilters">{{ t.filters.applyFilters }}</button>
      <button class="btn-reset" @click="resetFilters">{{ t.common.reset }}</button>
    </div>
    
    <BoundingBoxModal
      :is-open="isBboxModalOpen"
      :initial-bbox="drawnBbox"
      @close="closeBboxModal"
      @save="saveBbox"
    />
  </aside>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import { MapPin, Calendar, Box, X, Code, Settings } from 'lucide-vue-next'
import CustomSelect from '@/components/CustomSelect.vue'
import BoundingBoxModal from '@/components/BoundingBoxModal.vue'
import { useFilterStore } from '@/stores/filterStore'
import { useQueryables } from '@/composables/useQueryables'
import { useI18n } from '@/composables/useI18n'

const { t } = useI18n()

const emit = defineEmits<{
  (e: 'apply'): void
  (e: 'reset'): void
}>()

const filterStore = useFilterStore()
const { 
  selectedRegion, 
  selectedProvider, 
  selectedLicense,
  activeFilter,
  apiFilter,
  startDate, 
  endDate, 
  drawnBbox,
  cql2Filter
} = storeToRefs(filterStore)

// Load providers and licenses from static file (auto-refreshes every 24 hours)
const { queryables, providerOptions, licenseOptions, updateOptions } = useQueryables()

// Update options when queryables data changes
watch(queryables, () => {
  updateOptions()
}, { deep: true })

// Format bbox coordinates for display (4 decimal places)
const formattedBbox = computed(() => {
  if (!drawnBbox.value) return { west: '', east: '', south: '', north: '' }
  const parts = drawnBbox.value.split(',').map(Number)
  return {
    west: parts[0]?.toFixed(4) ?? '',
    south: parts[1]?.toFixed(4) ?? '',
    east: parts[2]?.toFixed(4) ?? '',
    north: parts[3]?.toFixed(4) ?? ''
  }
})

// Bounding box modal state (local UI state)
const isBboxModalOpen = ref(false)

function openBboxModal() {
  isBboxModalOpen.value = true
}

function closeBboxModal() {
  isBboxModalOpen.value = false
}

function saveBbox(bbox: string) {
  filterStore.setDrawnBbox(bbox)
  isBboxModalOpen.value = false
}

function clearDrawnBbox() {
  filterStore.clearDrawnBbox()
  emit('apply') // Re-apply filters to update search results
}

function applyFilters() {
  emit('apply')
}

function resetFilters() {
  filterStore.resetFilters()
  emit('reset')
}

// JSON formatting state
const isFormattingJson = ref(false)
let formatDebounceTimer: ReturnType<typeof setTimeout> | null = null

// Watch CQL2 filter and auto-format JSON after user stops typing
watch(cql2Filter, (newValue) => {
  // Clear any pending format timer
  if (formatDebounceTimer) {
    clearTimeout(formatDebounceTimer)
    formatDebounceTimer = null
  }
  
  const trimmed = newValue.trim()
  
  // Only attempt formatting if it looks like JSON
  if (!trimmed || !trimmed.startsWith('{')) {
    isFormattingJson.value = false
    return
  }
  
  // Show formatting indicator
  isFormattingJson.value = true
  
  // Debounce the formatting (800ms after user stops typing)
  formatDebounceTimer = setTimeout(() => {
    try {
      const parsed = JSON.parse(trimmed)
      const formatted = JSON.stringify(parsed, null, 2)
      // Only update if it's actually different (avoid infinite loop)
      if (formatted !== trimmed) {
        cql2Filter.value = formatted
      }
    } catch {
      // Not valid JSON yet, leave as-is
    }
    isFormattingJson.value = false
  }, 800)
})

// Cleanup timer on unmount
onUnmounted(() => {
  if (formatDebounceTimer) {
    clearTimeout(formatDebounceTimer)
  }
})

// Region options with bounding boxes (minLon, minLat, maxLon, maxLat)
const regionOptions = computed(() => [
  { value: '', label: t.value.filters.selectARegion },
  { value: '-25,35,40,72', label: t.value.filters.regions.europe },
  { value: '25,-10,180,82', label: t.value.filters.regions.asia },
  { value: '-18,-35,52,38', label: t.value.filters.regions.africa },
  { value: '-170,-56,-30,84', label: t.value.filters.regions.americas },
  { value: '110,-50,180,-10', label: t.value.filters.regions.oceania },
  { value: '-180,-90,180,90', label: t.value.filters.regions.global }
])

// Active/API status filter options
const activeOptions = computed(() => [
  { value: '', label: t.value.common.all },
  { value: 'true', label: t.value.filters.active },
  { value: 'false', label: t.value.filters.inactive }
])

const apiOptions = computed(() => [
  { value: '', label: t.value.common.all },
  { value: 'true', label: t.value.filters.accessibleViaApi },
  { value: 'false', label: t.value.filters.staticCatalog }
])
</script>