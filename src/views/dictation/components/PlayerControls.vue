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
  <div class="flex items-center justify-center gap-7 px-4
              py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
    <!-- Prev -->
    <button @click="emit('prev')" :disabled="!canPrev" aria-label="上一个"
      class="w-14 h-14 rounded-full flex items-center justify-center
             bg-white/80 backdrop-blur-sm shadow-md shadow-sky-200/40
             text-slate-600 transition-transform
             hover:bg-white active:scale-95
             disabled:opacity-40 disabled:cursor-not-allowed">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
        <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
      </svg>
    </button>

    <!-- Play / Pause / Resume -->
    <button v-if="!isPlaying" @click="emit('play')" aria-label="播放"
      class="w-20 h-20 rounded-full flex items-center justify-center
             bg-gradient-to-br from-sky-400 to-emerald-400
             shadow-lg shadow-sky-400/40 text-white transition-transform
             hover:scale-105 active:scale-95">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
        <path d="M8 5v14l11-7z"/>
      </svg>
    </button>
    <button v-else-if="!isPaused" @click="emit('pause')" aria-label="暂停"
      class="w-20 h-20 rounded-full flex items-center justify-center
             bg-gradient-to-br from-sky-400 to-emerald-400
             shadow-lg shadow-sky-400/40 text-white transition-transform
             hover:scale-105 active:scale-95">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
        <path d="M6 4h4v16H6zm8 0h4v16h-4z"/>
      </svg>
    </button>
    <button v-else @click="emit('resume')" aria-label="继续"
      class="w-20 h-20 rounded-full flex items-center justify-center
             bg-gradient-to-br from-sky-400 to-emerald-400
             shadow-lg shadow-sky-400/40 text-white transition-transform
             hover:scale-105 active:scale-95">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
        <path d="M8 5v14l11-7z"/>
      </svg>
    </button>

    <!-- Next -->
    <button @click="emit('next')" :disabled="!canNext" aria-label="下一个"
      class="w-14 h-14 rounded-full flex items-center justify-center
             bg-white/80 backdrop-blur-sm shadow-md shadow-sky-200/40
             text-slate-600 transition-transform
             hover:bg-white active:scale-95
             disabled:opacity-40 disabled:cursor-not-allowed">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
        <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
      </svg>
    </button>
  </div>
</template>
