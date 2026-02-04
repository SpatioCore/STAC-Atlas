import { ref, computed, readonly } from 'vue'
import { messages, type Locale, type Messages } from '@/i18n'

// Global reactive state for current locale
const currentLocale = ref<Locale>('en')

// Helper to get nested value from object by dot-notation path
function getNestedValue(obj: Record<string, unknown>, path: string): string {
  const keys = path.split('.')
  let result: unknown = obj
  
  for (const key of keys) {
    if (result && typeof result === 'object' && key in result) {
      result = (result as Record<string, unknown>)[key]
    } else {
      return path // Return the key if path not found
    }
  }
  
  return typeof result === 'string' ? result : path
}

export function useI18n() {
  // Current translations based on locale
  const t = computed(() => messages[currentLocale.value] as Messages)
  
  // Translation function with dot notation support
  // Usage: $t('navbar.title') or $t('filters.regions.europe')
  const $t = (key: string): string => {
    return getNestedValue(t.value as unknown as Record<string, unknown>, key)
  }
  
  // Set locale
  const setLocale = (locale: Locale) => {
    currentLocale.value = locale
    // Persist to localStorage
    localStorage.setItem('stac-atlas-locale', locale)
    // Update HTML lang attribute
    document.documentElement.lang = locale
  }
  
  // Toggle between languages
  const toggleLocale = () => {
    setLocale(currentLocale.value === 'en' ? 'de' : 'en')
  }
  
  // Initialize locale from localStorage or browser
  const initLocale = () => {
    const stored = localStorage.getItem('stac-atlas-locale') as Locale | null
    if (stored && (stored === 'en' || stored === 'de')) {
      setLocale(stored)
    } else {
      // Try to detect from browser
      const browserLang = navigator.language.split('-')[0]
      if (browserLang === 'de') {
        setLocale('de')
      } else {
        setLocale('en')
      }
    }
  }
  
  return {
    locale: readonly(currentLocale),
    t,
    $t,
    setLocale,
    toggleLocale,
    initLocale
  }
}
