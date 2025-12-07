<template>
  <header class="navbar">
    <div class="navbar-brand">
      <div class="navbar-logo">
        <img src="@/assets/Atlas Logo.png" alt="STAC Atlas Logo" class="logo-icon" />
      </div>
      <div class="navbar-title">
        <h1>STAC Atlas</h1>
        <p class="navbar-subtitle">Geospatial Data Explorer</p>
      </div>
    </div>

    <div class="navbar-actions">
      <button 
        class="navbar-btn"
        :title="`Switch to ${currentLanguage === 'EN' ? 'German' : 'English'}`"
        @click="toggleLanguage"
      >
        <Globe :size="18" />
        {{ currentLanguage }}
      </button>
      
      <button 
        class="navbar-btn"
        :title="`Switch to ${isDark ? 'light' : 'dark'} mode`"
        @click="isDark = !isDark"
      >
        <Sun v-if="isDark" :size="18" />
        <Moon v-else :size="18" />
      </button>
      
      <button 
        class="navbar-btn"
        title="Information"
        @click="showInfo"
      >
        <Info :size="18" />
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useDark } from '@vueuse/core'
import { Globe, Sun, Moon, Info } from 'lucide-vue-next'

const isDark = useDark({
  selector: 'html',
  attribute: 'class',
  valueDark: 'dark',
  valueLight: ''
})

const currentLanguage = ref('EN')

const toggleLanguage = () => {
  currentLanguage.value = currentLanguage.value === 'EN' ? 'DE' : 'EN'
  // TODO: Implement i18n language switching
}

const showInfo = () => {
  // TODO: Implement info modal
}
</script>
