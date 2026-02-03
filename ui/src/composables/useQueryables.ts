import { ref, onMounted } from 'vue'

export interface QueryablesData {
  providers: string[]
  licenses: string[]
  lastUpdated: string | null
}

const QUERYABLES_URL = '/data/queryables.json'
const REFRESH_INTERVAL_MS = 15 * 60 * 1000 // 15 minutes

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
 * Fetch queryables from the static JSON file
 */
async function fetchQueryables(): Promise<void> {
  loading.value = true
  error.value = null

  try {
    const response = await fetch(QUERYABLES_URL)
    if (!response.ok) {
      throw new Error(`Failed to load queryables: ${response.statusText}`)
    }
    const data: QueryablesData = await response.json()
    queryables.value = data
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load queryables'
    console.error('Error loading queryables:', err)
  } finally {
    loading.value = false
  }
}

/**
 * Start auto-refresh interval
 */
function startAutoRefresh(): void {
  if (refreshInterval) return

  refreshInterval = setInterval(() => {
    fetchQueryables()
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
 * Data is fetched from a static JSON file and refreshed every 15 minutes
 */
export function useQueryables() {
  onMounted(async () => {
    // Only initialize once across all component instances
    if (!isInitialized) {
      isInitialized = true
      await fetchQueryables()
      startAutoRefresh()
    }
  })

  // Convert to select options format
  const providerOptions = ref<Array<{ value: string; label: string }>>([])
  const licenseOptions = ref<Array<{ value: string; label: string }>>([])

  // Watch for changes and update options
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

  // Initial update
  updateOptions()

  return {
    queryables,
    providerOptions,
    licenseOptions,
    loading,
    error,
    refresh: fetchQueryables,
    updateOptions,
    stopAutoRefresh
  }
}
