<script setup lang="ts">
import { RouterLink } from 'vue-router';
import { tools } from './tools';
</script>

<template>
  <div class="tool-list-page">
    <header class="page-header">
      <h1 class="headline">x-tools</h1>
      <p class="subtitle">一组自用的小工具集合，点击卡片进入对应工具</p>
    </header>

    <div class="tool-grid">
      <RouterLink
        v-for="tool in tools"
        :key="tool.name"
        :to="tool.path"
        class="tool-card"
      >
        <div class="card-body">
          <h2 class="card-title">{{ tool.title }}</h2>
          <p class="card-desc">{{ tool.description }}</p>
        </div>
        <svg class="card-arrow" width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M8.59 16.59 13.17 12 8.59 7.41 10 6l6 6-6 6z"
            fill="currentColor"
          />
        </svg>
      </RouterLink>
    </div>
  </div>
</template>

<style scoped>
.tool-list-page {
  --md-primary: #1a73e8;
  --md-on-primary: #ffffff;
  --md-surface: #f8f9ff;
  --md-surface-container: #ffffff;
  --md-on-surface: #1a1c20;
  --md-on-surface-variant: #44474e;
  --md-outline: #74777f;
  --md-outline-variant: #c4c6d0;

  max-width: 960px;
  margin: 0 auto;
  padding: 32px 16px;
  font-family:
    system-ui,
    -apple-system,
    sans-serif;
  color: var(--md-on-surface);
}

.page-header {
  margin-bottom: 24px;
}

.headline {
  font-size: 28px;
  font-weight: 400;
  line-height: 36px;
  margin: 0 0 8px;
}

.subtitle {
  font-size: 14px;
  color: var(--md-on-surface-variant);
  margin: 0;
}

.tool-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.tool-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px;
  border-radius: 16px;
  background: var(--md-surface-container);
  border: 1px solid var(--md-outline-variant);
  color: var(--md-on-surface);
  text-decoration: none;
  cursor: pointer;
  transition:
    box-shadow 0.2s,
    border-color 0.2s,
    transform 0.05s;
}

.tool-card::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: currentColor;
  opacity: 0;
  transition: opacity 0.2s;
  pointer-events: none;
}

.tool-card:hover {
  box-shadow:
    0 1px 3px 1px rgba(0, 0, 0, 0.1),
    0 1px 2px rgba(0, 0, 0, 0.2);
  border-color: transparent;
}

.tool-card:hover::before {
  opacity: 0.04;
}

.tool-card:focus-visible {
  outline: 2px solid var(--md-primary);
  outline-offset: 2px;
}

.tool-card:active {
  transform: scale(0.995);
}

.tool-card:active::before {
  opacity: 0.08;
}

.card-body {
  flex: 1;
  min-width: 0;
}

.card-title {
  font-size: 16px;
  font-weight: 500;
  line-height: 24px;
  margin: 0 0 4px;
  color: var(--md-on-surface);
}

.card-desc {
  font-size: 14px;
  line-height: 20px;
  color: var(--md-on-surface-variant);
  margin: 0;
}

.card-arrow {
  flex-shrink: 0;
  color: var(--md-on-surface-variant);
}
</style>
