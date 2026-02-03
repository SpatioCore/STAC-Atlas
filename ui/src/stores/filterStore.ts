import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface FilterState {
  bbox?: string
  datetime?: string
  provider?: string
  license?: string
  active?: boolean
  api?: boolean
  q?: string
  filter?: string
  'filter-lang'?: 'cql2-text' | 'cql2-json'
}

export const useFilterStore = defineStore('filters', () => {
  // Filter values
  const selectedRegion = ref('')
  const drawnBbox = ref('')
  const startDate = ref('')
  const endDate = ref('')
  const selectedProvider = ref('')
  const selectedLicense = ref('')
  const activeFilter = ref<string>('') // '', 'true', 'false' - default to all
  const apiFilter = ref<string>('') // '', 'true', 'false'
  const searchQuery = ref('')
  const cql2Filter = ref('')

  // Pagination state
  const currentPage = ref(1)
  const itemsPerPage = ref(48)
  const totalCollections = ref(0)

  // UI state
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Computed: active bbox (drawn takes priority over region)
  const activeBbox = computed(() => drawnBbox.value || selectedRegion.value || undefined)

  // Computed: datetime interval for API
  const datetime = computed(() => {
    if (!startDate.value && !endDate.value) return undefined
    
    const start = startDate.value || '..'
    const end = endDate.value || '..'
    
    if (start === '..' && end === '..') return undefined
    
    return `${start}/${end}`
  })

  // Computed: detect CQL2 filter language (JSON if starts with {, otherwise text)
  const cql2FilterLang = computed<'cql2-text' | 'cql2-json' | undefined>(() => {
    const trimmed = cql2Filter.value.trim()
    if (!trimmed) return undefined
    return trimmed.startsWith('{') ? 'cql2-json' : 'cql2-text'
  })

  // Computed: all active filters for API request
  const activeFilters = computed<FilterState>(() => ({
    bbox: activeBbox.value,
    datetime: datetime.value,
    provider: selectedProvider.value || undefined,
    license: selectedLicense.value || undefined,
    active: activeFilter.value ? activeFilter.value === 'true' : undefined,
    api: apiFilter.value ? apiFilter.value === 'true' : undefined,
    q: searchQuery.value.trim() || undefined,
    filter: cql2Filter.value.trim() || undefined,
    'filter-lang': cql2FilterLang.value
  }))

  // Computed: formatted bbox for display
  const formattedBbox = computed(() => {
    if (!drawnBbox.value) return { minLon: '', minLat: '', maxLon: '', maxLat: '' }
    const parts = drawnBbox.value.split(',').map(Number)
    return {
      minLon: parts[0]?.toFixed(4) ?? '',
      minLat: parts[1]?.toFixed(4) ?? '',
      maxLon: parts[2]?.toFixed(4) ?? '',
      maxLat: parts[3]?.toFixed(4) ?? ''
    }
  })

  // Computed: total pages
  const totalPages = computed(() => Math.ceil(totalCollections.value / itemsPerPage.value))

  // Actions
  function setDrawnBbox(bbox: string) {
    drawnBbox.value = bbox
    selectedRegion.value = '' // Clear region when custom bbox is set
  }

  function clearDrawnBbox() {
    drawnBbox.value = ''
  }

  function resetFilters() {
    selectedRegion.value = ''
    drawnBbox.value = ''
    startDate.value = ''
    endDate.value = ''
    selectedProvider.value = ''
    selectedLicense.value = ''
    activeFilter.value = 'true' // Reset to active by default
    apiFilter.value = ''
    searchQuery.value = ''
    cql2Filter.value = ''
    currentPage.value = 1
  }

  function setPage(page: number) {
    if (page >= 1 && page <= totalPages.value) {
      currentPage.value = page
    }
  }

  function resetPagination() {
    currentPage.value = 1
  }

  function setLoading(value: boolean) {
    loading.value = value
  }

  function setError(message: string | null) {
    error.value = message
  }

  function setTotalCollections(count: number) {
    totalCollections.value = count
  }

  return {
    // State
    selectedRegion,
    drawnBbox,
    startDate,
    endDate,
    selectedProvider,
    selectedLicense,
    activeFilter,
    apiFilter,
    searchQuery,
    cql2Filter,
    currentPage,
    itemsPerPage,
    totalCollections,
    loading,
    error,

    // Computed
    activeBbox,
    datetime,
    activeFilters,
    formattedBbox,
    totalPages,

    // Actions
    setDrawnBbox,
    clearDrawnBbox,
    resetFilters,
    setPage,
    resetPagination,
    setLoading,
    setError,
    setTotalCollections
  }
})
