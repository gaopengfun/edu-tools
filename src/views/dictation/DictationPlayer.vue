<!-- eslint-disable vue/multi-word-component-names -->
<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useDictationStore } from '@/stores/dictation';
import { translateWord } from '@/utils/translate';

const router = useRouter();
const store = useDictationStore();

let utterance: SpeechSynthesisUtterance | null = null;

const currentWord = computed(() => {
  if (store.currentIndex >= 0 && store.currentIndex < store.words.length) {
    return store.words[store.currentIndex];
  }
  return null;
});

const progress = computed(() => {
  if (store.words.length === 0) return 0;
  return ((store.currentIndex + 1) / store.words.length) * 100;
});

const canPrev = computed(() => store.currentIndex > 0);
const canNext = computed(() => store.currentIndex < store.words.length - 1);

function speakWord(word: string) {
  return new Promise<void>((resolve, reject) => {
    if (!('speechSynthesis' in window)) {
      reject(new Error('浏览器不支持语音合成'));
      return;
    }

    utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = 'en-US';
    utterance.rate = store.speechRate;

    utterance.onend = () => resolve();
    utterance.onerror = (e) => reject(e);

    speechSynthesis.speak(utterance);
  });
}

async function loadTranslation(index: number) {
  const word = store.words[index];
  if (word && !word.translation) {
    const translation = await translateWord(word.text);
    store.updateWordTranslation(index, translation);
  }
}

async function playNext() {
  if (store.currentIndex >= store.words.length - 1) {
    stop();
    return;
  }

  const nextIndex = store.currentIndex + 1;
  store.setPlayState(true, false, nextIndex);

  await loadTranslation(nextIndex);

  const word = store.words[nextIndex];
  if (!word) return;

  for (let i = 0; i < store.repeatCount; i++) {
    if (!store.isPlaying || store.isPaused) break;
    await speakWord(word.text);
    if (i < store.repeatCount - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  if (store.isPlaying && !store.isPaused) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    playNext();
  }
}

function play() {
  if (store.words.length === 0) return;
  store.setPlayState(true, false, store.currentIndex === -1 ? -1 : store.currentIndex);
  playNext();
}

function pause() {
  store.setPlayState(true, true, store.currentIndex);
  speechSynthesis.cancel();
}

function resume() {
  store.setPlayState(true, false, store.currentIndex);
  playNext();
}

function stop() {
  store.resetPlayState();
  speechSynthesis.cancel();
}

function prev() {
  if (store.currentIndex > 0) {
    const wasPlaying = store.isPlaying && !store.isPaused;
    speechSynthesis.cancel();
    store.setPlayState(store.isPlaying, store.isPaused, store.currentIndex - 1);
    if (wasPlaying) {
      playNext();
    }
  }
}

function next() {
  if (store.currentIndex < store.words.length - 1) {
    const wasPlaying = store.isPlaying && !store.isPaused;
    speechSynthesis.cancel();
    if (wasPlaying) {
      playNext();
    } else {
      store.setPlayState(false, false, store.currentIndex + 1);
    }
  }
}

function goBack() {
  stop();
  router.push('/dictation');
}

onMounted(() => {
  if (store.words.length === 0) {
    router.push('/dictation');
  }
});

onUnmounted(() => {
  speechSynthesis.cancel();
});
</script>

<template>
  <div class="player-page">
    <header class="player-header">
      <button @click="goBack" class="btn-back" title="返回">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
        </svg>
      </button>
      <div class="header-info">
        <h1 class="headline">单词听写</h1>
        <p class="progress-text">{{ store.currentIndex + 1 }} / {{ store.words.length }}</p>
      </div>
    </header>

    <div class="player-content">
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: `${progress}%` }"></div>
      </div>

      <div class="word-display">
        <div v-if="currentWord" class="current-word">
          {{ currentWord.text }}
        </div>
        <div v-if="currentWord?.translation" class="word-translation">
          {{ currentWord.translation }}
        </div>
      </div>

      <div class="controls">
        <button
          @click="prev"
          class="btn btn-icon"
          :disabled="!canPrev"
          title="上一个"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
          </svg>
        </button>

        <button
          v-if="!store.isPlaying"
          @click="play"
          class="btn btn-icon btn-play"
          title="播放"
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
        </button>

        <button
          v-else-if="!store.isPaused"
          @click="pause"
          class="btn btn-icon btn-play"
          title="暂停"
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 4h4v16H6zm8 0h4v16h-4z" />
          </svg>
        </button>

        <button
          v-else
          @click="resume"
          class="btn btn-icon btn-play"
          title="继续"
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
        </button>

        <button
          @click="next"
          class="btn btn-icon"
          :disabled="!canNext"
          title="下一个"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
          </svg>
        </button>

        <button
          @click="stop"
          class="btn btn-icon"
          :disabled="!store.isPlaying"
          title="停止"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 6h12v12H6z" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.player-page {
  --md-primary: #1a73e8;
  --md-on-primary: #ffffff;
  --md-surface: #f8f9ff;
  --md-surface-container: #ffffff;
  --md-surface-container-high: #e8eaf6;
  --md-on-surface: #1a1c20;
  --md-on-surface-variant: #44474e;
  --md-outline: #74777f;

  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--md-surface);
  font-family: system-ui, -apple-system, sans-serif;
  color: var(--md-on-surface);
}

.player-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 24px;
  background: var(--md-surface-container);
  border-bottom: 1px solid var(--md-outline);
}

.btn-back {
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: var(--md-on-surface);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.btn-back:hover {
  background: rgba(0, 0, 0, 0.08);
}

.header-info {
  flex: 1;
}

.headline {
  font-size: 20px;
  font-weight: 500;
  margin: 0 0 4px;
}

.progress-text {
  font-size: 14px;
  color: var(--md-on-surface-variant);
  margin: 0;
}

.player-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 16px;
  gap: 48px;
}

.progress-bar {
  width: 100%;
  max-width: 600px;
  height: 4px;
  background: var(--md-surface-container-high);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--md-primary);
  transition: width 0.3s ease;
}

.word-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  min-height: 200px;
  justify-content: center;
}

.current-word {
  font-size: 48px;
  font-weight: 500;
  color: var(--md-primary);
  text-align: center;
}

.word-translation {
  font-size: 24px;
  color: var(--md-on-surface-variant);
  text-align: center;
}

.controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.btn {
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  overflow: hidden;
}

.btn::before {
  content: '';
  position: absolute;
  inset: 0;
  background: currentColor;
  opacity: 0;
  transition: opacity 0.2s;
}

.btn:hover::before {
  opacity: 0.08;
}

.btn:active {
  transform: scale(0.98);
}

.btn:disabled {
  opacity: 0.38;
  cursor: not-allowed;
}

.btn-icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  color: var(--md-on-surface);
}

.btn-play {
  width: 80px;
  height: 80px;
  background: var(--md-primary);
  color: var(--md-on-primary);
}

@media (max-width: 640px) {
  .current-word {
    font-size: 36px;
  }

  .word-translation {
    font-size: 18px;
  }

  .controls {
    gap: 8px;
  }

  .btn-icon {
    width: 48px;
    height: 48px;
  }

  .btn-play {
    width: 64px;
    height: 64px;
  }
}
</style>






