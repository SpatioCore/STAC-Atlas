import { ref, onMounted, watch } from 'vue'

export interface QueryablesData {
  providers: string[]
  licenses: string[]
  lastUpdated: string | null
}

const STATIC_FILE_URL = '/data/queryables.json'
const REFRESH_INTERVAL_MS = 24 * 60 * 60 * 1000 // 24 hours

// Shared state across components
const queryables = ref<QueryablesData>({
  providers: [],
  licenses: [],
  lastUpdated: null
})
const loading = ref(false)
const error = ref<string | null>(null)
let refreshInterval: ReturnType<typeof setInterval> | null = null
let isInitialized = false

/**
 * Load queryables from the static JSON file
 * This file is updated daily by the update-queryables script
 */
async function loadQueryables(): Promise<void> {
  loading.value = true
  error.value = null

  try {
    // Add cache-busting parameter to ensure we get the latest version
    const cacheBuster = `?t=${Date.now()}`
    const response = await fetch(`${STATIC_FILE_URL}${cacheBuster}`)
    
    if (!response.ok) {
      throw new Error(`Failed to load queryables: ${response.statusText}`)
    }
    
    const data: QueryablesData = await response.json()
    queryables.value = data
    
    console.log(`[Queryables] Loaded ${data.providers.length} providers and ${data.licenses.length} licenses (updated: ${data.lastUpdated})`)
    
  } catch (err) {
    error.value = 'Failed to load filter options'
    console.error('Error loading queryables:', err)
  } finally {
    loading.value = false
  }
}

/**
 * Start auto-refresh interval (daily check)
 */
function startAutoRefresh(): void {
  if (refreshInterval) return

  refreshInterval = setInterval(() => {
    loadQueryables()
  }, REFRESH_INTERVAL_MS)
}

/**
 * Stop auto-refresh interval
 */
function stopAutoRefresh(): void {
  if (refreshInterval) {
    clearInterval(refreshInterval)
    refreshInterval = null
  }
}

/**
 * Composable for accessing queryables (providers and licenses)
 * Data is loaded from a static JSON file that is updated daily by update-queryables script
 * The file is refreshed every 24 hours to check for updates
 */
export function useQueryables() {
  // Convert to select options format (computed from queryables)
  const providerOptions = ref<Array<{ value: string; label: string }>>([])
  const licenseOptions = ref<Array<{ value: string; label: string }>>([])

  // Update options when queryables change
  const updateOptions = () => {
    providerOptions.value = [
      { value: '', label: 'All Providers' },
      ...queryables.value.providers.map(p => ({ value: p, label: p }))
    ]
    licenseOptions.value = [
      { value: '', label: 'All Licenses' },
      ...queryables.value.licenses.map(l => ({ value: l, label: l }))
    ]
  }

  // Watch for changes and update options reactively
  watch(queryables, updateOptions, { deep: true, immediate: true })

  onMounted(async () => {
    // Only initialize once across all component instances
    if (!isInitialized) {
      isInitialized = true
      await loadQueryables()
      startAutoRefresh()
    }
  })

  return {
    queryables,
    providerOptions,
    licenseOptions,
    loading,
    error,
    refresh: loadQueryables,
    updateOptions,
    stopAutoRefresh
  }
}
