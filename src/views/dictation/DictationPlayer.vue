<!-- src/views/dictation/DictationPlayer.vue -->
<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useDictationStore } from '@/stores/dictation';
import { useSpeechPlayer } from './composables/useSpeechPlayer';
import WordDisplay from './components/WordDisplay.vue';
import ProgressBar from './components/ProgressBar.vue';
import PlayerControls from './components/PlayerControls.vue';
import DecorativeBackground from './components/DecorativeBackground.vue';
import ProgressBadge from './components/ProgressBadge.vue';

const router = useRouter();
const store = useDictationStore();
const { currentWord, progress, canPrev, canNext, play, pause, resume, prev, next, stop } = useSpeechPlayer();

const isActivelyPlaying = computed(() => store.isPlaying && !store.isPaused);
const displayIndex = computed(() =>
  store.currentIndex < 0 ? 0 : store.currentIndex + 1
);

function goBack() {
  stop();
  router.push('/dictation');
}

onMounted(() => {
  if (store.words.length === 0) router.push('/dictation');
});
</script>

<template>
  <div class="min-h-dvh relative overflow-hidden flex flex-col
              bg-gradient-to-b from-sky-100 via-sky-50 to-emerald-100">
    <!-- Decorative layer -->
    <DecorativeBackground />

    <!-- Main content -->
    <div class="relative z-10 flex flex-col flex-1">
      <!-- Top bar -->
      <div class="flex items-start justify-between px-4 md:px-6 py-3 md:py-4">
        <button @click="goBack" aria-label="返回"
          class="w-11 h-11 rounded-full flex items-center justify-center
                 bg-white/80 backdrop-blur-sm shadow-md shadow-sky-200/40
                 text-slate-600 transition-all
                 hover:bg-white active:scale-95">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
          </svg>
        </button>

        <ProgressBadge :current="displayIndex" :total="store.words.length" />
      </div>

      <!-- Word display -->
      <WordDisplay
        :word="currentWord?.text"
        :translation="currentWord?.translation"
        :is-playing="isActivelyPlaying" />

      <!-- Progress bar -->
      <ProgressBar :progress="progress" />

      <!-- Controls -->
      <PlayerControls
        :is-playing="store.isPlaying" :is-paused="store.isPaused"
        :can-prev="canPrev" :can-next="canNext"
        @play="play" @pause="pause" @resume="resume"
        @prev="prev" @next="next" />
    </div>
  </div>
</template>
