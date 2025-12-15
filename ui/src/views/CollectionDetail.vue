<template>
  <div class="collection-detail">
    

    <div class="collection-detail__main">
      <!-- Left Section: Overview, BBox, and Metadata -->
      <div class="collection-detail__left-section">
        <!-- Header -->
        <div class="collection-detail__header">
          <h1 class="collection-detail__title">{{ collectionTitle }}</h1>
          <div class="collection-detail__badges">
            <span class="badge badge--primary">{{ provider }}</span>
            <span class="badge">{{ platform }}</span>
            <span class="badge" v-if="license">{{ license }}</span>
          </div>
        </div>
        <!-- Overview and Bounding Box together -->
        <div class="collection-detail__top-row">
          <!-- Overview -->
          <section class="overview-section">
            <h2 class="section-title">Overview</h2>
            <div class="overview-section__description">
              <h3>Description</h3>
              <p>{{ description }}</p>
            </div>

            <div class="overview-section__info-cards">
              <InfoCard
                v-for="card in infoCards"
                :key="card.label"
                :icon="card.icon"
                :label="card.label"
                :value="card.value"
              />
            </div>
          </section>

          <!-- Bounding Box Preview -->
          <section class="bbox-section">
            <div class="bbox-section__map" ref="mapContainer">
              <!-- Map will be rendered here -->
            </div>

            <div class="bbox-section__coordinates">
              <div class="coordinate-system">
                <Globe :size="16" />
                <span>{{ coordinateSystem }}</span>
              </div>
              <div class="coordinate-values">
                <span>W: {{ bbox.west }}</span>
                <span>S: {{ bbox.south }}</span>
                <span>E: {{ bbox.east }}</span>
                <span>N: {{ bbox.north }}</span>
              </div>
            </div>

            <div class="bbox-section__actions">
              <button>
                <ExternalLink :size="16" />
                View Source
              </button>
              <div class="contact-wrapper">
                <button @click="toggleContactModal">
                  <User :size="16" />
                  Contact
                </button>
                
                <!-- Contact Popover -->
                <div v-if="showContactModal" class="contact-popover">
                  <h3 class="popover-title">Contact Information</h3>
                  
                  <div class="contact-field">
                    <label class="contact-label">Name</label>
                    <div class="contact-value-wrapper">
                      <span class="contact-value">{{ collectionData.contact?.name || 'N/A' }}</span>
                      <button 
                        class="copy-btn" 
                        @click="copyToClipboard(collectionData.contact?.name || '')"
                        title="Copy to clipboard"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div class="contact-field">
                    <label class="contact-label">Email</label>
                    <div class="contact-value-wrapper">
                      <span class="contact-value">{{ collectionData.contact?.email || 'N/A' }}</span>
                      <button 
                        class="copy-btn" 
                        @click="copyToClipboard(collectionData.contact?.email || '')"
                        title="Copy to clipboard"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        <!-- Metadata -->
        <section class="metadata-section">
          <h2 class="section-title">Metadata</h2>
          <div class="metadata-section__grid">
            <div class="metadata-item" v-for="meta in metadata" :key="meta.label">
              <span class="metadata-item__label">{{ meta.label }}</span>
              <span class="metadata-item__value">{{ meta.value }}</span>
            </div>
          </div>
        </section>
      </div>

      <!-- Right Section: Items -->
      <div class="collection-detail__right-section">
        <section class="items-section">
          <h2 class="section-title">Items ({{ items.length }})</h2>
          <div class="items-section__list">
            <ItemCard
              v-for="item in items"
              :key="item.id"
              :id="item.id"
              :date="item.date"
              :coverage="item.coverage"
              :thumbnail="item.thumbnail"
            />
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { Globe, ExternalLink, User } from 'lucide-vue-next'
import InfoCard from '@/components/InfoCard.vue'
import ItemCard from '@/components/ItemCard.vue'

const route = useRoute()
const collectionId = computed(() => route.params.id as string)
const mapContainer = ref<HTMLElement | null>(null)
const showContactModal = ref(false)

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
  } catch (err) {
    console.error('Failed to copy:', err)
  }
}

const toggleContactModal = () => {
  showContactModal.value = !showContactModal.value
}

// Mock data for different collections
const mockCollections: Record<string, any> = {
  '1': {
    title: 'Sentinel-2 Level-2A',
    provider: 'ESA',
    platform: 'Sentinel-2',
    license: 'Open Data',
    contact: {
      name: 'ESA Support Team',
      email: 'support@esa.int'
    },
    description: 'Sentinel-2 carries an optical instrument payload that samples 13 spectral bands: four bands at 10m, six bands at 20m and three bands at 60m spatial resolution.',
    bbox: { west: '-18', south: '35', east: '30', north: '70' },
    infoCards: [
      { icon: 'file', label: 'Data Format', value: 'GeoTIFF, COG' },
      { icon: 'ruler', label: 'Resolution', value: '10m - 60m' },
      { icon: 'calendar', label: 'Temporal Range', value: '2015 - Present' }
    ],
    metadata: [
      { label: 'Collection ID', value: '1' },
      { label: 'Provider', value: 'ESA' },
      { label: 'Platform', value: 'Sentinel-2' },
      { label: 'License', value: 'Open Data' },
      { label: 'Update Frequency', value: 'Daily' },
      { label: 'Bands', value: '13 spectral bands' }
    ],
    items: [
      { id: 'S2A_2024_001', date: '2024-01-15', coverage: '95%', thumbnail: 'https://via.placeholder.com/150/4169E1/FFFFFF?text=S2A_001' },
      { id: 'S2A_2024_002', date: '2024-01-20', coverage: '92%', thumbnail: 'https://via.placeholder.com/150/4169E1/FFFFFF?text=S2A_002' },
      { id: 'S2A_2024_003', date: '2024-01-25', coverage: '98%', thumbnail: 'https://via.placeholder.com/150/4169E1/FFFFFF?text=S2A_003' },
      { id: 'S2A_2024_004', date: '2024-02-01', coverage: '87%', thumbnail: 'https://via.placeholder.com/150/4169E1/FFFFFF?text=S2A_004' },
      { id: 'S2A_2024_005', date: '2024-02-05', coverage: '94%', thumbnail: 'https://via.placeholder.com/150/4169E1/FFFFFF?text=S2A_005' }
    ]
  },
  '2': {
    title: 'Landsat 8 Collection 2',
    provider: 'USGS',
    platform: 'Landsat-8',
    license: 'Open Data',
    contact: {
      name: 'USGS EROS Center',
      email: 'custserv@usgs.gov'
    },
    description: 'Landsat 8 orbits the Earth in a sun-synchronous, near-polar orbit, at an altitude of 705 km, with 11 bands in the visible, near-infrared, short wave infrared, and thermal infrared portions of the spectrum.',
    bbox: { west: '-180', south: '-90', east: '180', north: '90' },
    infoCards: [
      { icon: 'file', label: 'Data Format', value: 'GeoTIFF' },
      { icon: 'ruler', label: 'Resolution', value: '15m - 100m' },
      { icon: 'calendar', label: 'Temporal Range', value: '2013 - Present' }
    ],
    metadata: [
      { label: 'Collection ID', value: '2' },
      { label: 'Provider', value: 'USGS' },
      { label: 'Platform', value: 'Landsat-8' },
      { label: 'License', value: 'Open Data' },
      { label: 'Update Frequency', value: '16 days' },
      { label: 'Bands', value: '11 bands' }
    ],
    items: [
      { id: 'LC08_2024_001', date: '2024-01-10', coverage: '100%', thumbnail: 'https://via.placeholder.com/150/228B22/FFFFFF?text=LC08_001' },
      { id: 'LC08_2024_002', date: '2024-01-26', coverage: '100%', thumbnail: 'https://via.placeholder.com/150/228B22/FFFFFF?text=LC08_002' },
      { id: 'LC08_2024_003', date: '2024-02-11', coverage: '95%', thumbnail: 'https://via.placeholder.com/150/228B22/FFFFFF?text=LC08_003' }
    ]
  },
  '3': {
    title: 'MODIS Terra Daily',
    provider: 'NASA',
    platform: 'Terra',
    license: 'Open Data',
    contact: {
      name: 'NASA MODIS Support',
      email: 'modis-ops@lists.nasa.gov'
    },
    description: 'The Moderate Resolution Imaging Spectroradiometer (MODIS) is a key instrument aboard the Terra satellite. It captures data in 36 spectral bands ranging in wavelength from 0.4 µm to 14.4 µm.',
    bbox: { west: '-180', south: '-90', east: '180', north: '90' },
    infoCards: [
      { icon: 'file', label: 'Data Format', value: 'HDF-EOS' },
      { icon: 'ruler', label: 'Resolution', value: '250m - 1km' },
      { icon: 'calendar', label: 'Temporal Range', value: '2000 - Present' }
    ],
    metadata: [
      { label: 'Collection ID', value: '3' },
      { label: 'Provider', value: 'NASA' },
      { label: 'Platform', value: 'Terra' },
      { label: 'License', value: 'Open Data' },
      { label: 'Update Frequency', value: 'Daily' },
      { label: 'Bands', value: '36 spectral bands' }
    ],
    items: [
      { id: 'MOD09_2024_001', date: '2024-01-01', coverage: '100%', thumbnail: 'https://via.placeholder.com/150/FF6347/FFFFFF?text=MOD_001' },
      { id: 'MOD09_2024_002', date: '2024-01-02', coverage: '100%', thumbnail: 'https://via.placeholder.com/150/FF6347/FFFFFF?text=MOD_002' },
      { id: 'MOD09_2024_003', date: '2024-01-03', coverage: '98%', thumbnail: 'https://via.placeholder.com/150/FF6347/FFFFFF?text=MOD_003' },
      { id: 'MOD09_2024_004', date: '2024-01-04', coverage: '100%', thumbnail: 'https://via.placeholder.com/150/FF6347/FFFFFF?text=MOD_004' }
    ]
  },
  '4': {
    title: 'Sentinel-1 GRD',
    provider: 'ESA',
    platform: 'Sentinel-1',
    license: 'Open Data',
    contact: {
      name: 'ESA Support Team',
      email: 'support@esa.int'
    },
    description: 'Sentinel-1 is a C-band synthetic aperture radar (SAR) mission providing all-weather, day-and-night imagery for land and ocean services.',
    bbox: { west: '-180', south: '-90', east: '180', north: '90' },
    infoCards: [
      { icon: 'file', label: 'Data Format', value: 'GeoTIFF, NetCDF' },
      { icon: 'ruler', label: 'Resolution', value: '10m' },
      { icon: 'calendar', label: 'Temporal Range', value: '2014 - Present' }
    ],
    metadata: [
      { label: 'Collection ID', value: '4' },
      { label: 'Provider', value: 'ESA' },
      { label: 'Platform', value: 'Sentinel-1' },
      { label: 'License', value: 'Open Data' },
      { label: 'Update Frequency', value: '6 days' },
      { label: 'Bands', value: 'C-band SAR' }
    ],
    items: [
      { id: 'S1A_GRD_001', date: '2024-01-08', coverage: '100%', thumbnail: 'https://via.placeholder.com/150/8B4513/FFFFFF?text=S1A_001' },
      { id: 'S1A_GRD_002', date: '2024-01-14', coverage: '100%', thumbnail: 'https://via.placeholder.com/150/8B4513/FFFFFF?text=S1A_002' },
      { id: 'S1A_GRD_003', date: '2024-01-20', coverage: '98%', thumbnail: 'https://via.placeholder.com/150/8B4513/FFFFFF?text=S1A_003' }
    ]
  },
  '5': {
    title: 'NAIP Imagery',
    provider: 'USDA',
    platform: 'Aircraft',
    license: 'Public Domain',
    contact: {
      name: 'USDA FSA APFO',
      email: 'apfo.sales@usda.gov'
    },
    description: 'The National Agriculture Imagery Program (NAIP) acquires aerial imagery during the agricultural growing seasons in the continental U.S. at 1-meter ground sample distance.',
    bbox: { west: '-125', south: '24', east: '-66', north: '49' },
    infoCards: [
      { icon: 'file', label: 'Data Format', value: 'GeoTIFF' },
      { icon: 'ruler', label: 'Resolution', value: '1m' },
      { icon: 'calendar', label: 'Temporal Range', value: '2003 - Present' }
    ],
    metadata: [
      { label: 'Collection ID', value: '5' },
      { label: 'Provider', value: 'USDA' },
      { label: 'Platform', value: 'Aircraft' },
      { label: 'License', value: 'Public Domain' },
      { label: 'Update Frequency', value: '2-3 years' },
      { label: 'Bands', value: 'RGB, NIR' }
    ],
    items: [
      { id: 'NAIP_2023_CA', date: '2023-06-15', coverage: '100%', thumbnail: 'https://via.placeholder.com/150/FFD700/000000?text=NAIP_CA' },
      { id: 'NAIP_2023_TX', date: '2023-07-20', coverage: '100%', thumbnail: 'https://via.placeholder.com/150/FFD700/000000?text=NAIP_TX' }
    ]
  },
  '6': {
    title: 'Planet SkySat',
    provider: 'Planet Labs',
    platform: 'SkySat',
    license: 'Commercial',
    contact: {
      name: 'Planet Sales Team',
      email: 'sales@planet.com'
    },
    description: 'SkySat is a constellation of sub-meter resolution Earth observation satellites providing high-resolution optical imagery and video.',
    bbox: { west: '-122', south: '37', east: '-121', north: '38' },
    infoCards: [
      { icon: 'file', label: 'Data Format', value: 'GeoTIFF' },
      { icon: 'ruler', label: 'Resolution', value: '0.5m - 1m' },
      { icon: 'calendar', label: 'Temporal Range', value: '2013 - Present' }
    ],
    metadata: [
      { label: 'Collection ID', value: '6' },
      { label: 'Provider', value: 'Planet Labs' },
      { label: 'Platform', value: 'SkySat' },
      { label: 'License', value: 'Commercial' },
      { label: 'Update Frequency', value: 'Daily' },
      { label: 'Bands', value: '4 bands (RGB + NIR)' }
    ],
    items: [
      { id: 'SKY_2024_001', date: '2024-01-05', coverage: '100%', thumbnail: 'https://via.placeholder.com/150/9370DB/FFFFFF?text=SKY_001' },
      { id: 'SKY_2024_002', date: '2024-01-06', coverage: '100%', thumbnail: 'https://via.placeholder.com/150/9370DB/FFFFFF?text=SKY_002' },
      { id: 'SKY_2024_003', date: '2024-01-07', coverage: '95%', thumbnail: 'https://via.placeholder.com/150/9370DB/FFFFFF?text=SKY_003' }
    ]
  }
}

// Get collection data based on ID
const collectionData = computed(() => mockCollections[collectionId.value] || mockCollections['1'])

const collectionTitle = computed(() => collectionData.value.title)
const provider = computed(() => collectionData.value.provider)
const platform = computed(() => collectionData.value.platform)
const license = computed(() => collectionData.value.license)
const description = computed(() => collectionData.value.description)
const coordinateSystem = ref('EPSG:4326')
const bbox = computed(() => collectionData.value.bbox)
const infoCards = computed(() => collectionData.value.infoCards)
const metadata = computed(() => collectionData.value.metadata)
const items = computed(() => collectionData.value.items)

onMounted(() => {
  // Initialize map here
  console.log('Collection ID:', collectionId.value)
  // You can add MapLibre GL initialization here
})
</script>

<style scoped>
@import '@/assets/styles/components/collection-detail.css';
</style>
