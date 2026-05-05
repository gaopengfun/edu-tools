<!-- src/views/dictation/components/WordDisplay.vue -->
<script setup lang="ts">
defineProps<{
  word?: string;
  translation?: string;
  isPlaying?: boolean;
}>();
</script>

<template>
  <div class="flex-1 flex flex-col items-center justify-center relative px-4">
    <!-- Static radial halo -->
    <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div
        class="w-[600px] h-[600px] max-w-[120vw] max-h-[120vw] rounded-full"
        style="background: radial-gradient(closest-side, rgba(125, 211, 252, 0.35), transparent);" />
    </div>

    <!-- Pulsing rings (only when playing) -->
    <template v-if="isPlaying">
      <div
        class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
               w-60 h-60 rounded-full bg-sky-300/25 animate-pulse-ring pointer-events-none" />
      <div
        class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
               w-60 h-60 rounded-full bg-sky-300/25 animate-pulse-ring pointer-events-none"
        style="animation-delay: -2s" />
    </template>

    <!-- Word -->
    <div
      v-if="word"
      class="relative z-10 text-[56px] md:text-[88px] font-semibold tracking-wide
             text-slate-900 text-center leading-tight">
      {{ word }}
    </div>

    <!-- Translation chip -->
    <div v-if="translation" class="relative z-10 mt-4">
      <span
        class="inline-block px-5 py-1.5 rounded-full
               bg-white/70 backdrop-blur-sm shadow-sm shadow-sky-200/50
               text-slate-600 text-base md:text-lg">
        {{ translation }}
      </span>
    </div>
  </div>
</template>
