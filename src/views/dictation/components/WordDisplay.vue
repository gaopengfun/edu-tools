<!-- src/views/dictation/components/WordDisplay.vue -->
<script setup lang="ts">
defineProps<{ word?: string; translation?: string }>();
</script>

<template>
  <div class="flex-1 flex flex-col items-center justify-center gap-3 md:gap-4 px-4">
    <div v-if="word"
      class="text-[42px] md:text-[56px] font-light text-white tracking-wide text-center">
      {{ word }}
    </div>
    <div v-if="translation"
      class="text-[17px] md:text-xl text-white/45 text-center">
      {{ translation }}
    </div>
  </div>
</template>
