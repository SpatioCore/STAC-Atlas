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

// Data would typically be fetched from an API based on collectionId
const collectionTitle = ref('')
const provider = ref('')
const platform = ref('')
const license = ref('')
const description = ref('')
const coordinateSystem = ref('EPSG:4326')
const bbox = ref({ west: '0', south: '0', east: '0', north: '0' })
const infoCards = ref<Array<{ icon: string; label: string; value: string }>>([])
const metadata = ref<Array<{ label: string; value: string }>>([])
const items = ref<Array<{ id: string; date: string; coverage: string; thumbnail: string }>>([])
const collectionData = ref<{ contact?: { name: string; email: string } }>({})

onMounted(() => {
  // Fetch collection data here based on collectionId.value
  console.log('Collection ID:', collectionId.value)
  // Example: fetchCollectionData(collectionId.value)
})
</script>

<style scoped>
@import '@/assets/styles/components/collection-detail.css';
</style>
