<template>
  <aside class="filter-section">
    <div class="filter-group">
      <h3 class="filter-title">
        <MapPin class="filter-icon" :size="20" />
        Spatial Filter
      </h3>
      <button class="filter-action-btn">
        <Box class="icon" :size="16" />
        Draw Bounding Box
      </button>
      <div class="filter-field">
        <label class="filter-label" for="region-select">Select Region</label>
        <CustomSelect
          id="region-select"
          v-model="selectedRegion"
          :options="regionOptions"
          placeholder="Select a region"
        />
      </div>
    </div>

    <div class="section-divider"></div>

    <div class="filter-group">
      <h3 class="filter-title">
        <Calendar class="filter-icon" :size="20" />
        Temporal Filter
      </h3>
      <div class="filter-field">
        <label class="filter-label" for="start-date">Start Date</label>
        <input 
          id="start-date"
          type="date" 
          class="filter-input"
          placeholder="tt.mm.jjjj"
        />
      </div>
      <div class="filter-field">
        <label class="filter-label" for="end-date">End Date</label>
        <input 
          id="end-date"
          type="date" 
          class="filter-input"
          placeholder="tt.mm.jjjj"
        />
      </div>
    </div>

    <div class="section-divider"></div>

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

    <div class="filter-actions">
      <button class="btn-apply">Apply Filters</button>
      <button class="btn-reset">Reset</button>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { MapPin, Calendar, Box } from 'lucide-vue-next'
import CustomSelect from '@/components/CustomSelect.vue'

const selectedRegion = ref('')
const selectedProvider = ref('')
const selectedLicense = ref('')


/* Mockdata */
const regionOptions = [
  { value: '', label: 'Select a region' },
  { value: 'europe', label: 'Europe' },
  { value: 'asia', label: 'Asia' },
  { value: 'africa', label: 'Africa' },
  { value: 'americas', label: 'Americas' },
  { value: 'oceania', label: 'Oceania' }
]

const providerOptions = [
  { value: '', label: 'All Providers' },
  { value: 'esa', label: 'ESA' },
  { value: 'usgs', label: 'USGS' },
  { value: 'nasa', label: 'NASA' },
  { value: 'copernicus', label: 'Copernicus' }
]

const licenseOptions = [
  { value: '', label: 'All Licenses' },
  { value: 'open', label: 'Open Data' },
  { value: 'cc0', label: 'CC0' },
  { value: 'proprietary', label: 'Proprietary' }
]
</script>