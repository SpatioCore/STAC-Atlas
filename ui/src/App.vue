<script setup lang="ts">
import Navbar from '@/components/Navbar.vue'
</script>

<template>
  <div class="app-layout">
    <Navbar />
    
    <div class="main-content">
      <router-view />
    </div>
  </div>
</template>