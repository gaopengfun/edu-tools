<!-- src/views/dictation/components/ProgressBar.vue -->
<script setup lang="ts">
defineProps<{ progress: number }>();
</script>

<template>
  <div class="w-full h-0.5 bg-white/8">
    <div class="h-full bg-primary transition-[width] duration-300 ease-out"
         :style="{ width: `${progress}%` }" />
  </div>
</template>
