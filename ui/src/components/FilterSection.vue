<template>
  <aside class="filter-section">
    <div class="filter-top">
      <div class="filter-group">
        <h3 class="filter-title">
          <MapPin class="filter-icon" :size="20" />
          Spatial Filter
        </h3>
        <button class="filter-action-btn" @click="openBboxModal">
          <Box class="icon" :size="16" />
          Draw Bounding Box
        </button>
        <div v-if="drawnBbox" class="drawn-bbox-display">
          <div class="bbox-coords">
            <div class="bbox-coord-row">
              <div class="bbox-coord-content">
                <span class="bbox-coord-label">West:</span>
                <span class="bbox-coord-value">{{ formattedBbox.west }}</span>
              </div>
              
              <div class="bbox-coord-content">
                <span class="bbox-coord-label">East:</span>
                <span class="bbox-coord-value">{{ formattedBbox.east }}</span>
              </div>
            </div>
            <div class="bbox-coord-row">
              <div class="bbox-coord-content">
                <span class="bbox-coord-label">South:</span>
                <span class="bbox-coord-value">{{ formattedBbox.south }}</span>
              </div>
              <div class="bbox-coord-content">
                <span class="bbox-coord-label">North:</span>
                <span class="bbox-coord-value">{{ formattedBbox.north }}</span>
              </div>
            </div>
          </div>
          <button class="bbox-clear" @click="clearDrawnBbox">
            <X :size="14" />
          </button>
        </div>
        <div class="filter-field">
          <label class="filter-label" for="region-select">Select Region</label>
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
          Temporal Filter
        </h3>
        <div class="filter-field">
          <label class="filter-label" for="start-date">Start Date</label>
          <input 
            id="start-date"
            v-model="startDate"
            type="date" 
            class="filter-input"
            placeholder="tt.mm.jjjj"
          />
        </div>
        <div class="filter-field">
          <label class="filter-label" for="end-date">End Date</label>
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
        <h3 class="filter-title">Provider</h3>
        <div class="filter-field">
          <CustomSelect
            v-model="selectedProvider"
            :options="providerOptions"
            placeholder="All Providers"
          />
        </div>
      </div>

      <div class="filter-group">
        <h3 class="filter-title">License</h3>
        <div class="filter-field">
          <CustomSelect
            v-model="selectedLicense"
            :options="licenseOptions"
            placeholder="All Licenses"
          />
        </div>
      </div>
    </div>

    <div class="filter-actions">
      <button class="btn-apply" @click="applyFilters">Apply Filters</button>
      <button class="btn-reset" @click="resetFilters">Reset</button>
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
import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { MapPin, Calendar, Box, X } from 'lucide-vue-next'
import CustomSelect from '@/components/CustomSelect.vue'
import BoundingBoxModal from '@/components/BoundingBoxModal.vue'
import { useFilterStore } from '@/stores/filterStore'

const emit = defineEmits<{
  (e: 'apply'): void
  (e: 'reset'): void
}>()

const filterStore = useFilterStore()
const { 
  selectedRegion, 
  selectedProvider, 
  selectedLicense, 
  startDate, 
  endDate, 
  drawnBbox
} = storeToRefs(filterStore)

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

// Provider options from database
const providerOptions = [
  { value: '', label: 'All Providers' },
  { value: 'Agroscope', label: 'Agroscope' },
  { value: 'Deltares', label: 'Deltares' },
  { value: 'ESA', label: 'ESA' },
  { value: 'Federal Office for Civil Protection - FOCP', label: 'Federal Office for Civil Protection - FOCP' },
  { value: 'Federal Office for Civil Protection FOCP', label: 'Federal Office for Civil Protection FOCP' },
  { value: 'Federal Office for Defence Procurement armasuisse', label: 'Federal Office for Defence Procurement armasuisse' },
  { value: 'Federal Office for Spatial Development - ARE', label: 'Federal Office for Spatial Development - ARE' },
  { value: 'Federal Office for the Environment - FOEN', label: 'Federal Office for the Environment - FOEN' },
  { value: 'Federal Roads Office - FEDRO', label: 'Federal Roads Office - FEDRO' },
  { value: 'Microsoft', label: 'Microsoft' },
  { value: 'Planet Labs', label: 'Planet Labs' },
  { value: 'Salo Sciences', label: 'Salo Sciences' }
]

// License options from database
const licenseOptions = [
  { value: '', label: 'All Licenses' },
  { value: 'CC-0', label: 'CC-0' },
  { value: 'CC-BY', label: 'CC-BY' },
  { value: 'CC-BY-4.0', label: 'CC-BY-4.0' },
  { value: 'CC-BY-NC-4.0', label: 'CC-BY-NC-4.0' },
  { value: 'CC-BY-SA-4.0', label: 'CC-BY-SA-4.0' },
  { value: 'Other (Non-Commercial)', label: 'Other (Non-Commercial)' },
  { value: 'proprietary', label: 'proprietary' }
]

// Region options with bounding boxes (minLon, minLat, maxLon, maxLat)
const regionOptions = [
  { value: '', label: 'Select a region' },
  { value: '-25,35,40,72', label: 'Europe' },
  { value: '25,-10,180,82', label: 'Asia' },
  { value: '-18,-35,52,38', label: 'Africa' },
  { value: '-170,-56,-30,84', label: 'Americas' },
  { value: '110,-50,180,-10', label: 'Oceania' },
  { value: '-180,-90,180,90', label: 'Global' }
]
</script>