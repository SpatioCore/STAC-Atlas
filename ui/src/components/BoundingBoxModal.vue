<template>
  <Teleport to="body">
    <div v-if="isOpen" class="modal-overlay" @click.self="close">
      <div class="modal-container">
        <div class="modal-header">
          <h2>Draw Bounding Box</h2>
          <button class="modal-close" @click="close">
            <X :size="20" />
          </button>
        </div>
        
        <div class="modal-body">
          <div ref="mapContainer" class="map-container"></div>
          
          <p class="map-instructions">
            Click and drag on the map to draw a bounding box, or enter coordinates manually below.
          </p>
          
          <div class="bbox-inputs">
            <div class="bbox-row">
              <div class="bbox-field">
                <label>Min Longitude (West)</label>
                <input 
                  v-model.number="minLon" 
                  type="number" 
                  step="0.0001" 
                  min="-180" 
                  max="180"
                  placeholder="-180"
                />
              </div>
              <div class="bbox-field">
                <label>Max Longitude (East)</label>
                <input 
                  v-model.number="maxLon" 
                  type="number" 
                  step="0.0001" 
                  min="-180" 
                  max="180"
                  placeholder="180"
                />
              </div>
            </div>
            <div class="bbox-row">
              <div class="bbox-field">
                <label>Min Latitude (South)</label>
                <input 
                  v-model.number="minLat" 
                  type="number" 
                  step="0.0001" 
                  min="-90" 
                  max="90"
                  placeholder="-90"
                />
              </div>
              <div class="bbox-field">
                <label>Max Latitude (North)</label>
                <input 
                  v-model.number="maxLat" 
                  type="number" 
                  step="0.0001" 
                  min="-90" 
                  max="90"
                  placeholder="90"
                />
              </div>
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <button class="btn-clear" @click="clearBbox">Clear</button>
          <button class="btn-cancel" @click="close">Cancel</button>
          <button class="btn-save" @click="save" :disabled="!isValidBbox">Save</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, computed, onUnmounted, nextTick } from 'vue'
import { X } from 'lucide-vue-next'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

const props = defineProps<{
  isOpen: boolean
  initialBbox?: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'save', bbox: string): void
}>()

const mapContainer = ref<HTMLElement | null>(null)
let map: maplibregl.Map | null = null
let isDrawing = false
let startPoint: { lng: number; lat: number } | null = null

const minLon = ref<number | null>(null)
const minLat = ref<number | null>(null)
const maxLon = ref<number | null>(null)
const maxLat = ref<number | null>(null)

const isValidBbox = computed(() => {
  return minLon.value !== null && 
         minLat.value !== null && 
         maxLon.value !== null && 
         maxLat.value !== null &&
         minLon.value >= -180 && minLon.value <= 180 &&
         maxLon.value >= -180 && maxLon.value <= 180 &&
         minLat.value >= -90 && minLat.value <= 90 &&
         maxLat.value >= -90 && maxLat.value <= 90 &&
         minLon.value < maxLon.value &&
         minLat.value < maxLat.value
})

// Parse initial bbox when modal opens
watch(() => props.isOpen, async (open) => {
  if (open) {
    // Parse initial bbox if provided
    if (props.initialBbox) {
      const parts = props.initialBbox.split(',').map(Number)
      if (parts.length === 4 && parts.every((value) => Number.isFinite(value))) {
        const [parsedMinLon, parsedMinLat, parsedMaxLon, parsedMaxLat] = parts as [number, number, number, number]
        minLon.value = parsedMinLon
        minLat.value = parsedMinLat
        maxLon.value = parsedMaxLon
        maxLat.value = parsedMaxLat
      }
    }
    
    await nextTick()
    initMap()
  } else {
    destroyMap()
  }
})

// Update map when inputs change
watch([minLon, minLat, maxLon, maxLat], () => {
  if (map && isValidBbox.value) {
    updateBboxLayer()
  }
})

function initMap() {
  if (!mapContainer.value || map) return
  
  map = new maplibregl.Map({
    container: mapContainer.value,
    style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
    center: [0, 20],
    zoom: 1.5,
    dragRotate: false,
    pitchWithRotate: false,
    touchPitch: false,
    dragPan: false // Disable default left-click panning, we'll handle it manually
  })
  
  // Disable rotation completely
  map.dragRotate.disable()
  map.touchZoomRotate.disableRotation()
  
  map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right')
  
  map.on('load', () => {
    // Add bbox source and layer
    map!.addSource('bbox', {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'Polygon',
          coordinates: [[]]
        }
      }
    })
    
    map!.addLayer({
      id: 'bbox-fill',
      type: 'fill',
      source: 'bbox',
      paint: {
        'fill-color': '#00a59b',
        'fill-opacity': 0.2
      }
    })
    
    map!.addLayer({
      id: 'bbox-line',
      type: 'line',
      source: 'bbox',
      paint: {
        'line-color': '#00a59b',
        'line-width': 2
      }
    })
    
    // If we have initial bbox, show it and fit to it
    if (isValidBbox.value) {
      updateBboxLayer()
      map!.fitBounds(
        [[minLon.value!, minLat.value!], [maxLon.value!, maxLat.value!]],
        { padding: 50 }
      )
    }
  })
  
  // Drawing handlers - only on left click (button 0)
  map.on('mousedown', onMouseDown)
  map.on('mousemove', onMouseMove)
  map.on('mouseup', onMouseUp)
  
  // Prevent context menu on right-click
  map.getCanvas().addEventListener('contextmenu', (e) => e.preventDefault())
  
  // Change cursor
  map.getCanvas().style.cursor = 'crosshair'
}

let isPanning = false
let panStart: { x: number; y: number } | null = null

function onMouseDown(e: maplibregl.MapMouseEvent) {
  if (!map) return
  
  const button = e.originalEvent.button
  
  // Left click (button 0) - draw bbox
  if (button === 0) {
    isDrawing = true
    startPoint = e.lngLat
    return
  }
  
  // Right click (button 2) or middle click (button 1) - pan
  if (button === 1 || button === 2) {
    isPanning = true
    panStart = { x: e.originalEvent.clientX, y: e.originalEvent.clientY }
    map.getCanvas().style.cursor = 'grabbing'
  }
}

function onMouseMove(e: maplibregl.MapMouseEvent) {
  if (!map) return
  
  // Handle panning with right/middle mouse
  if (isPanning && panStart) {
    const dx = e.originalEvent.clientX - panStart.x
    const dy = e.originalEvent.clientY - panStart.y
    
    map.panBy([-dx, -dy], { duration: 0 })
    
    panStart = { x: e.originalEvent.clientX, y: e.originalEvent.clientY }
    return
  }
  
  // Handle drawing bbox
  if (!isDrawing || !startPoint) return
  
  const current = e.lngLat
  
  minLon.value = Math.min(startPoint.lng, current.lng)
  maxLon.value = Math.max(startPoint.lng, current.lng)
  minLat.value = Math.min(startPoint.lat, current.lat)
  maxLat.value = Math.max(startPoint.lat, current.lat)
  
  updateBboxLayer()
}

function onMouseUp() {
  if (!map) return
  
  if (isPanning) {
    isPanning = false
    panStart = null
    map.getCanvas().style.cursor = 'crosshair'
  }
  
  if (isDrawing) {
    isDrawing = false
    startPoint = null
  }
}

function updateBboxLayer() {
  if (!map || !map.getSource('bbox')) return
  
  const source = map.getSource('bbox') as maplibregl.GeoJSONSource
  
  if (isValidBbox.value) {
    source.setData({
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [minLon.value!, minLat.value!],
          [maxLon.value!, minLat.value!],
          [maxLon.value!, maxLat.value!],
          [minLon.value!, maxLat.value!],
          [minLon.value!, minLat.value!]
        ]]
      }
    })
  } else {
    source.setData({
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'Polygon',
        coordinates: [[]]
      }
    })
  }
}

function destroyMap() {
  if (map) {
    map.remove()
    map = null
  }
}

function clearBbox() {
  minLon.value = null
  minLat.value = null
  maxLon.value = null
  maxLat.value = null
  updateBboxLayer()
}

function close() {
  emit('close')
}

function save() {
  if (isValidBbox.value) {
    const bbox = `${minLon.value},${minLat.value},${maxLon.value},${maxLat.value}`
    emit('save', bbox)
  }
}

onUnmounted(() => {
  destroyMap()
})
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-container {
  background: var(--bg);
  border-radius: var(--radius-lg);
  width: 90%;
  max-width: 700px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md);
  border-bottom: 1px solid var(--border);
}

.modal-header h2 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text, #1a1a1a);
}

.modal-close {
  background: none;
  cursor: pointer;
  padding: 2px;
  color: var(--muted-fg);
  border-radius: var(--radius-sm);
  transition: background-color 0.2s;
  width: 24px;
  height: 24px;
  border: 1.5px solid var(--border);
}

.modal-close:hover {
  background-color: var(--muted-bg);
}

.modal-body {
  padding: var(--spacing-lg, 24px);
  overflow-y: auto;
}

.map-container {
  width: 100%;
  height: 300px;
  border-radius: var(--radius-md);
  overflow: hidden;
  border: 1px solid var(--border);
}

.map-instructions {
  margin: var(--spacing-md) 0;
  font-size: 0.875rem;
  color: var(--muted-fg);
}

.bbox-inputs {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.bbox-row {
  display: flex;
  gap: var(--spacing-md);
}

.bbox-field {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.bbox-field label {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--muted-fg);
}

.bbox-field input {
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  font-size: 0.875rem;
  background: var(--bg);
  color: var(--text);
}

.bbox-field input:focus {
  outline: none;
  border-color: var(--primary);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-sm);
  padding: var(--spacing-md) var(--spacing-lg);
  border-top: 1px solid var(--border);
}


.btn-save {
  background-color: var(--primary);
  border: none;
  color: var(--text-white);
}
</style>
