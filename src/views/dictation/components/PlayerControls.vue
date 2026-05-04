<!-- src/views/dictation/components/PlayerControls.vue -->
<script setup lang="ts">
defineProps<{
  isPlaying: boolean;
  isPaused: boolean;
  canPrev: boolean;
  canNext: boolean;
}>();

const emit = defineEmits<{
  (e: 'play'): void;
  (e: 'pause'): void;
  (e: 'resume'): void;
  (e: 'prev'): void;
  (e: 'next'): void;
}>();
</script>

<template>
  <div class="flex items-center justify-center gap-6 md:gap-8 px-4
              py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
    <!-- Prev -->
    <button @click="emit('prev')" :disabled="!canPrev"
      class="w-10 h-10 md:w-11 md:h-11 rounded-full flex items-center justify-center
             text-white/50 disabled:opacity-25 transition-opacity">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
        <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
      </svg>
    </button>

    <!-- Play / Pause -->
    <button v-if="!isPlaying" @click="emit('play')"
      class="w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center
             bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/15">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
        <path d="M8 5v14l11-7z"/>
      </svg>
    </button>
    <button v-else-if="!isPaused" @click="emit('pause')"
      class="w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center
             bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/15">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
        <path d="M6 4h4v16H6zm8 0h4v16h-4z"/>
      </svg>
    </button>
    <button v-else @click="emit('resume')"
      class="w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center
             bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/15">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
        <path d="M8 5v14l11-7z"/>
      </svg>
    </button>

    <!-- Next -->
    <button @click="emit('next')" :disabled="!canNext"
      class="w-10 h-10 md:w-11 md:h-11 rounded-full flex items-center justify-center
             text-white/50 disabled:opacity-25 transition-opacity">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
        <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
      </svg>
    </button>
  </div>
</template>
