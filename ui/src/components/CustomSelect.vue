<template>
  <div class="custom-select" :class="{ 'is-open': isOpen }" v-click-outside="close">
    <button 
      class="select-trigger"
      @click="toggle"
      type="button"
    >
      <span class="select-value">{{ displayValue }}</span>
      <ChevronDown class="select-icon" :size="16" />
    </button>
    
    <div v-if="isOpen" class="select-dropdown">
      <div 
        v-for="option in options"
        :key="option.value"
        class="select-option"
        :class="{ 'is-selected': modelValue === option.value }"
        @click="selectOption(option.value)"
      >
        {{ option.label }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ChevronDown } from 'lucide-vue-next'

interface Option {
  value: string
  label: string
}

const props = defineProps<{
  modelValue: string
  options: Option[]
  placeholder?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const isOpen = ref(false)

const displayValue = computed(() => {
  const selected = props.options.find(opt => opt.value === props.modelValue)
  return selected ? selected.label : (props.placeholder || 'Select...')
})

const toggle = () => {
  isOpen.value = !isOpen.value
}

const close = () => {
  isOpen.value = false
}

const selectOption = (value: string) => {
  emit('update:modelValue', value)
  close()
}

// Click outside directive
interface ClickOutsideElement extends HTMLElement {
  clickOutsideEvent?: (event: Event) => void
}

const vClickOutside = {
  mounted(el: ClickOutsideElement, binding: any) {
    el.clickOutsideEvent = (event: Event) => {
      if (!(el === event.target || el.contains(event.target as Node))) {
        binding.value()
      }
    }
    document.addEventListener('click', el.clickOutsideEvent)
  },
  unmounted(el: ClickOutsideElement) {
    if (el.clickOutsideEvent) {
      document.removeEventListener('click', el.clickOutsideEvent)
    }
  }
}
</script>

<script lang="ts">
export default {
  name: 'CustomSelect'
}
</script>
