<script setup lang="ts">
import { RouterLink } from 'vue-router';
import AppShellBackground from '@/components/AppShellBackground.vue';
import { tools } from './tools';
</script>

<template>
  <div class="min-h-dvh relative overflow-hidden">
    <AppShellBackground />

    <div
      class="absolute inset-0 flex items-center justify-center pointer-events-none"
      aria-hidden="true"
    >
      <img
        src="@/assets/logo.svg"
        alt="logo"
        draggable="false"
        class="logo-watermark h-auto w-[min(72vw,calc(68vh*1365/1024),720px)] select-none"
      />
    </div>

    <div class="relative z-10 max-w-3xl mx-auto px-4 py-8 md:py-10">
      <header class="mb-8">
        <h1 class="text-2xl md:text-[28px] font-semibold text-slate-700 leading-tight">
          edu-tools
        </h1>
        <p class="text-sm text-slate-500 mt-1">一组自用的小工具集合，点击卡片进入对应工具</p>
      </header>

      <div class="grid gap-4 sm:grid-cols-2">
        <RouterLink
          v-for="tool in tools"
          :key="tool.name"
          :to="tool.path"
          class="tool-card group relative flex items-center gap-3 px-5 py-5 rounded-3xl bg-white/80 backdrop-blur-sm ring-1 ring-white/60 shadow-frosted text-slate-700 no-underline transition-all duration-200 hover:bg-white/92 hover:-translate-y-0.5 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
        >
          <div class="flex-1 min-w-0">
            <h2 class="text-base font-medium text-slate-800 leading-6">
              {{ tool.title }}
            </h2>
            <p class="text-sm text-slate-500 leading-5 mt-1">
              {{ tool.description }}
            </p>
          </div>

          <span
            class="shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-brand-from to-brand-to text-white shadow shadow-sky-400/40 transition-transform duration-200 group-hover:translate-x-0.5"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M8.59 16.59 13.17 12 8.59 7.41 10 6l6 6-6 6z" fill="currentColor" />
            </svg>
          </span>
        </RouterLink>
      </div>
    </div>
  </div>
</template>
