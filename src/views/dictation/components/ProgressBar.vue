<!-- src/views/dictation/components/ProgressBar.vue -->
<script setup lang="ts">
defineProps<{ progress: number }>();
</script>

<template>
  <div class="px-6 py-2">
    <div class="relative h-2 rounded-full bg-white/60 overflow-visible">
      <div
        class="h-full rounded-full bg-gradient-to-r from-sky-400 to-emerald-400
               transition-[width] duration-300 ease-out"
        :style="{ width: `${progress}%` }" />
      <div
        class="absolute top-1/2 -translate-y-1/2 -translate-x-1/2
               w-3.5 h-3.5 rounded-full bg-white shadow-md shadow-sky-300/60
               transition-[left] duration-300 ease-out"
        :style="{ left: `${progress}%` }" />
    </div>
  </div>
</template>
