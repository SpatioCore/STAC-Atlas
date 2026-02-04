<template>
  <header class="navbar">
    <RouterLink to="/" class="navbar-brand">
      <div class="navbar-logo">
        <img src="@/assets/Atlas Logo.png" :alt="t.navbar.logoAlt" class="logo-icon" />
      </div>
      <div class="navbar-title">
        <h1>{{ t.navbar.title }}</h1>
        <p class="navbar-subtitle">{{ t.navbar.subtitle }}</p>
      </div>
    </RouterLink>

    <div class="navbar-actions">
      <button 
        class="navbar-btn"
        :title="locale === 'en' ? t.navbar.switchToGerman : t.navbar.switchToEnglish"
        @click="toggleLocale"
      >
        <!-- <Globe :size="18" /> -->
        {{ locale.toUpperCase() }}
      </button>
      
      <button 
        class="navbar-btn"
        :title="isDark ? t.navbar.switchToLightMode : t.navbar.switchToDarkMode"
        @click="isDark = !isDark"
      >
        <Sun v-if="isDark" :size="18" />
        <Moon v-else :size="18" />
      </button>
      
      <!-- Incase of a Information/ About page -->
      <!-- <button 
        class="navbar-btn"
        :title="t.navbar.information"
        @click="showInfo"
      >
        <Info :size="18" />
      </button> -->
    </div>
  </header>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useDark } from '@vueuse/core'
import { Sun, Moon } from 'lucide-vue-next'
import { useI18n } from '@/composables/useI18n'

const { locale, t, toggleLocale, initLocale } = useI18n()

const isDark = useDark({
  selector: 'html',
  attribute: 'class',
  valueDark: 'dark',
  valueLight: ''
})

// Initialize locale on mount
onMounted(() => {
  initLocale()
})
</script>
