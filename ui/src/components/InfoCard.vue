<template>
  <div class="info-card">
    <div class="info-card__icon-wrapper">
      <component :is="iconComponent" :size="20" />
    </div>

    <div class="info-card__content">
      <span class="info-card__label">{{ label }}</span>
      <span class="info-card__value">{{ value }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { FileText, Ruler, Calendar } from 'lucide-vue-next'

const props = defineProps<{
  icon: string;
  label: string;
  value: string;
}>()

const iconMap: Record<string, any> = {
  'file': FileText,
  'ruler': Ruler,
  'calendar': Calendar
}

const iconComponent = computed(() => iconMap[props.icon] || FileText)
</script>

<style scoped>

@import '@/assets/styles/components/info-card.css';
</style>