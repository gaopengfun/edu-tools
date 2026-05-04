<!-- src/views/dictation/DictationPlayer.vue -->
<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useDictationStore } from '@/stores/dictation';
import { useSpeechPlayer } from './composables/useSpeechPlayer';
import WordDisplay from './components/WordDisplay.vue';
import ProgressBar from './components/ProgressBar.vue';
import PlayerControls from './components/PlayerControls.vue';

const router = useRouter();
const store = useDictationStore();
const { currentWord, progress, canPrev, canNext, play, pause, resume, prev, next, stop } = useSpeechPlayer();

function goBack() {
  stop();
  router.push('/dictation');
}

onMounted(() => {
  if (store.words.length === 0) router.push('/dictation');
});
</script>

<template>
  <div class="min-h-dvh flex flex-col bg-[#0a0a0a]">
    <!-- Top bar -->
    <div class="flex items-center justify-between px-4 md:px-6 py-3 md:py-4">
      <button @click="goBack"
        class="w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center
               bg-white/8 text-white/70 hover:bg-white/12 transition-colors">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
        </svg>
      </button>
      <span class="text-xs md:text-sm text-white/40 font-medium tracking-wider">
        {{ store.currentIndex + 1 }} / {{ store.words.length }}
      </span>
    </div>

    <!-- Word display -->
    <WordDisplay :word="currentWord?.text" :translation="currentWord?.translation" />

    <!-- Progress bar -->
    <ProgressBar :progress="progress" />

    <!-- Controls -->
    <PlayerControls
      :is-playing="store.isPlaying" :is-paused="store.isPaused"
      :can-prev="canPrev" :can-next="canNext"
      @play="play" @pause="pause" @resume="resume"
      @prev="prev" @next="next" />
  </div>
</template>
