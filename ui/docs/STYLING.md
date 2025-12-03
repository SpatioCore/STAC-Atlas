# Styling Guide

## CSS Architecture

The project uses a structured CSS system with custom properties for consistency.

### File Structure

```
src/assets/styles/
├── base/
│   ├── reset.css       # CSS reset
│   ├── vars.css        # CSS custom properties
│   └── base.css        # Global styles
├── components/         # Component-specific styles
└── main.css           # Main entry (imports all)
```

## CSS Custom Properties

All design tokens are defined in `base/vars.css`:

### Colors

```css
/* Light mode */
--bg                  /* Background */
--fg                  /* Foreground/text */
--primary             /* Primary brand color */
--primary-fg          /* Primary text color */
--secondary           /* Secondary color */
--muted               /* Muted background */
--muted-fg            /* Muted text */
--border              /* Border color */
--destructive         /* Error/danger color */

/* Semantic aliases */
--color-text          /* Main text */
--color-text-muted    /* Secondary text */
--color-success       /* Success state */
--color-warning       /* Warning state */
--color-info          /* Info state */
```

**Dark mode:** Add `.dark` class to `<html>` or `<body>`.

### Spacing

```css
--spacing-xs    /* 0.25rem */
--spacing-sm    /* 0.5rem */
--spacing-md    /* 1rem */
--spacing-lg    /* 1.5rem */
--spacing-xl    /* 2rem */
--spacing-2xl   /* 3rem */
--spacing-3xl   /* 4rem */
```

### Typography

```css
--font-size-xs     /* 0.75rem */
--font-size-base   /* 1rem */
--font-size-2xl    /* 1.5rem */
/* ... more sizes */

--font-weight-normal    /* 400 */
--font-weight-semibold  /* 600 */
--font-weight-bold      /* 700 */
```

### Border Radius

```css
--radius        /* Base: 0.625rem */
--radius-sm     /* Small */
--radius-lg     /* Large */
--radius-full   /* Pill shape */
```

### Other

- **Shadows:** `--shadow-sm`, `--shadow-md`, `--shadow-lg`
- **Transitions:** `--transition-fast`, `--transition-base`, `--transition-slow`
- **Z-index:** `--z-index-modal`, `--z-index-dropdown`, etc.

## Component Styling

Each component gets its own dedicated CSS file in `src/assets/styles/components/`.

### Naming Convention

Component: `src/components/SearchBar.vue`  
Stylesheet: `src/assets/styles/components/search-bar.css`

Use kebab-case for CSS filenames matching the component name.

### Setup Steps

1. **Create the component CSS file:**

```css
/* src/assets/styles/components/button.css */
.btn {
  padding: var(--spacing-sm) var(--spacing-lg);
  background: var(--primary);
  color: var(--primary-fg);
  border-radius: var(--radius);
  font-weight: var(--font-weight-semibold);
  transition: background-color var(--transition-fast);
  cursor: pointer;
}

.btn:hover {
  opacity: 0.9;
}

.btn-primary {
  background: var(--primary);
  color: var(--primary-fg);
}

.btn-secondary {
  background: var(--secondary);
  color: var(--secondary-fg);
}

.btn-destructive {
  background: var(--destructive);
  color: var(--destructive-fg);
}
```

2. **Import in `main.css`:**

```css
/* src/assets/styles/main.css */
@import './base/reset.css';
@import './base/vars.css';
@import './base/base.css';

/* Component styles */
@import './components/button.css';
@import './components/search-bar.css';
@import './components/card.css';
```

3. **Use classes in component:**

```vue
<!-- src/components/Button.vue -->
<template>
  <button 
    class="btn"
    :class="`btn-${variant}`"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
defineProps<{
  variant?: 'primary' | 'secondary' | 'destructive'
}>()
</script>
```

**No `<style>` block needed in the component file.**

## Best Practices

### ✅ DO

- Create dedicated CSS files for each component in `styles/components/`
- Use CSS custom properties for all values
- Use semantic color names (`--fg`, `--primary`)
- Leverage existing spacing/sizing scales
- Create component variants with modifier classes
- Import component styles in `main.css`

```css
/* src/assets/styles/components/card.css */
.card {
  background: var(--card);
  padding: var(--spacing-lg);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
}
```

### ❌ DON'T

- Use `<style>` or `<style scoped>` blocks in components
- Hardcode colors, spacing, or font sizes
- Use inline styles for complex styling
- Override base styles without reason
- Create one-off custom properties in components

```css
/* BAD - Don't hardcode values */
.card {
  background: #ffffff;
  padding: 16px;
  border-radius: 8px;
}
```

## Dark Mode

Dark mode is applied via `.dark` class:

```vue
<script setup>
import { useDark, useToggle } from '@vueuse/core'

const isDark = useDark()
const toggleDark = useToggle(isDark)
</script>

<template>
  <button @click="toggleDark()">
    Toggle Dark Mode
  </button>
</template>
```

All color variables automatically switch when `.dark` is present.

## Utility Classes

Global utilities in `base/base.css`:

```css
.container    /* Max-width container with padding */
.sr-only      /* Screen reader only (accessibility) */
```

Add more utilities as needed in `base.css`.
## Examples

### Card Component

**Component:** `src/components/Card.vue`
```vue
<template>
  <div class="card">
    <h3 class="card-title">{{ title }}</h3>
    <p class="card-text">{{ description }}</p>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  description: string
}>()
</script>
```

**Styles:** `src/assets/styles/components/card.css`
```css
.card {
  background: var(--card);
  color: var(--card-fg);
  padding: var(--spacing-lg);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border);
  box-shadow: var(--shadow-sm);
  transition: box-shadow var(--transition-fast);
}

.card:hover {
  box-shadow: var(--shadow-md);
}

.card-title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  margin-bottom: var(--spacing-sm);
  color: var(--fg);
}

.card-text {
  color: var(--muted-fg);
  line-height: var(--line-height-relaxed);
}
```

**Import:** Add to `src/assets/styles/main.css`
```css
@import './components/card.css';
```

### Button with Variants

**Component:** `src/components/Button.vue`
```vue
<template>
  <button 
    class="btn"
    :class="`btn-${variant}`"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
defineProps<{
  variant?: 'primary' | 'secondary' | 'destructive'
}>()
</script>
```

**Styles:** `src/assets/styles/components/button.css`
```css
.btn {
  padding: var(--spacing-sm) var(--spacing-lg);
  border-radius: var(--radius);
  font-weight: var(--font-weight-semibold);
  transition: opacity var(--transition-fast);
  cursor: pointer;
}

.btn:hover {
  opacity: 0.9;
}

.btn-primary {
  background: var(--primary);
  color: var(--primary-fg);
}

.btn-secondary {
  background: var(--secondary);
  color: var(--secondary-fg);
}

.btn-destructive {
  background: var(--destructive);
  color: var(--destructive-fg);
}
```

**Import:** Add to `src/assets/styles/main.css`
```css
@import './components/button.css';
```

### SearchBar Component

**Component:** `src/components/SearchBar.vue`
```vue
<template>
  <div class="search-bar">
    <input 
      type="text"
      class="search-input"
      :value="modelValue"
      @input="$emit('update:modelValue', $event.target.value)"
      placeholder="Search..."
    />
    <button class="search-btn">
      <slot name="icon">🔍</slot>
    </button>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: string
}>()

defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>
```

**Styles:** `src/assets/styles/components/search-bar.css`
```css
.search-bar {
  display: flex;
  gap: var(--spacing-xs);
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: var(--spacing-xs);
}

.search-input {
  flex: 1;
  padding: var(--spacing-sm);
  border: none;
  background: transparent;
  color: var(--fg);
  font-size: var(--font-size-base);
}

.search-input:focus {
  outline: none;
}

.search-input::placeholder {
  color: var(--muted-fg);
}

.search-btn {
  padding: var(--spacing-sm);
  background: var(--primary);
  color: var(--primary-fg);
  border-radius: var(--radius-sm);
  transition: opacity var(--transition-fast);
}

.search-btn:hover {
  opacity: 0.9;
}
```

**Import:** Add to `src/assets/styles/main.css`
```css
@import './components/search-bar.css';
```
