<script setup lang="ts">
import { ref } from 'vue'
import FilterSection from '@/components/FilterSection.vue'
import SearchSection from '@/components/SearchSection.vue'
import SearchResults from '@/components/SearchResults.vue'

const searchQuery = ref('')

// Mock collections data
const Collections = ref([
  {
    id: '1',
    title: 'Sentinel-2 Level-2A',
    tags: 'Optical, Sentinel, ESA',
    provider: 'ESA',
    platform: 'Sentinel-2',
    description: 'Sentinel-2 carries an optical instrument payload that samples 13 spectral bands: four bands at 10m, six bands at 20m and three bands at 60m spatial resolution.',
    license: 'Open Data'
  },
  {
    id: '2',
    title: 'Landsat 8 Collection 2',
    tags: 'Optical, Landsat, USGS',
    provider: 'USGS',
    platform: 'Landsat-8',
    description: 'Landsat 8 orbits the Earth in a sun-synchronous, near-polar orbit, at an altitude of 705 km, with 11 bands in the visible, near-infrared, short wave infrared, and thermal infrared portions of the spectrum.',
    license: 'Open Data'
  },
  {
    id: '3',
    title: 'MODIS Terra Daily',
    tags: 'Optical, MODIS, NASA',
    provider: 'NASA',
    platform: 'Terra',
    description: 'The Moderate Resolution Imaging Spectroradiometer (MODIS) is a key instrument aboard the Terra satellite. It captures data in 36 spectral bands ranging in wavelength from 0.4 µm to 14.4 µm.',
    license: 'Open Data'
  },
  {
    id: '4',
    title: 'Sentinel-1 GRD',
    tags: 'SAR, Sentinel, ESA',
    provider: 'ESA',
    platform: 'Sentinel-1',
    description: 'Sentinel-1 is a C-band synthetic aperture radar (SAR) mission providing all-weather, day-and-night imagery for land and ocean services.',
    license: 'Open Data'
  },
  {
    id: '5',
    title: 'NAIP Imagery',
    tags: 'Aerial, NAIP, USDA',
    provider: 'USDA',
    platform: 'Aircraft',
    description: 'The National Agriculture Imagery Program (NAIP) acquires aerial imagery during the agricultural growing seasons in the continental U.S. at 1-meter ground sample distance.',
    license: 'Public Domain'
  },
  {
    id: '6',
    title: 'Planet SkySat',
    tags: 'Optical, High-Resolution, Planet',
    provider: 'Planet Labs',
    platform: 'SkySat',
    description: 'SkySat is a constellation of sub-meter resolution Earth observation satellites providing high-resolution optical imagery and video.',
    license: 'Commercial'
  }
])
</script>

<template>
  <div class="home">
    <FilterSection />
    
    <div class="content-area">
      <SearchSection 
        v-model="searchQuery"
        :result-count="Collections.length"
      />
      
      <SearchResults :collections="Collections" />
    </div>
  </div>
</template>

<style scoped>
.home {
  display: flex;
  width: 100vw;
}

.content-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: auto;
}
</style>
