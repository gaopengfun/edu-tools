<!-- eslint-disable vue/multi-word-component-names -->
<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue';

interface Word {
  text: string;
  index: number;
}

const wordInput = ref('');
const words = ref<Word[]>([]);
const currentIndex = ref(-1);
const isPlaying = ref(false);
const isPaused = ref(false);
const repeatCount = ref(2);
const speechRate = ref(0.8);

let utterance: SpeechSynthesisUtterance | null = null;

const currentWord = computed(() => {
  if (currentIndex.value >= 0 && currentIndex.value < words.value.length) {
    return words.value[currentIndex.value];
  }
  return null;
});

const progress = computed(() => {
  if (words.value.length === 0) return 0;
  return ((currentIndex.value + 1) / words.value.length) * 100;
});

const canPlay = computed(() => words.value.length > 0 && !isPlaying.value);
const canPause = computed(() => isPlaying.value && !isPaused.value);
const canResume = computed(() => isPlaying.value && isPaused.value);
const canStop = computed(() => isPlaying.value);
const canPrev = computed(() => currentIndex.value > 0);
const canNext = computed(() => currentIndex.value < words.value.length - 1);

function parseWords() {
  const text = wordInput.value.trim();
  if (!text) return;

  const wordList = text
    .split(/[\n,，、\s]+/)
    .map(w => w.trim())
    .filter(w => w.length > 0);

  words.value = wordList.map((text, index) => ({ text, index }));
  currentIndex.value = -1;
  isPlaying.value = false;
  isPaused.value = false;
}

function speakWord(word: string) {
  return new Promise<void>((resolve, reject) => {
    if (!('speechSynthesis' in window)) {
      reject(new Error('浏览器不支持语音合成'));
      return;
    }

    utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = 'en-US';
    utterance.rate = speechRate.value;

    utterance.onend = () => resolve();
    utterance.onerror = (e) => reject(e);

    speechSynthesis.speak(utterance);
  });
}

async function playNext() {
  if (currentIndex.value >= words.value.length - 1) {
    stop();
    return;
  }

  currentIndex.value++;

  const currentWord = words.value[currentIndex.value];
  if (!currentWord) return;

  for (let i = 0; i < repeatCount.value; i++) {
    if (!isPlaying.value || isPaused.value) break;
    await speakWord(currentWord.text);
    if (i < repeatCount.value - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  if (isPlaying.value && !isPaused.value) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    playNext();
  }
}

function play() {
  if (words.value.length === 0) return;
  isPlaying.value = true;
  isPaused.value = false;
  if (currentIndex.value === -1) {
    currentIndex.value = -1;
  }
  playNext();
}

function pause() {
  isPaused.value = true;
  speechSynthesis.cancel();
}

function resume() {
  isPaused.value = false;
  playNext();
}

function stop() {
  isPlaying.value = false;
  isPaused.value = false;
  currentIndex.value = -1;
  speechSynthesis.cancel();
}

function prev() {
  if (currentIndex.value > 0) {
    const wasPlaying = isPlaying.value && !isPaused.value;
    speechSynthesis.cancel();
    currentIndex.value--;
    if (wasPlaying) {
      playNext();
    }
  }
}

function next() {
  if (currentIndex.value < words.value.length - 1) {
    const wasPlaying = isPlaying.value && !isPaused.value;
    speechSynthesis.cancel();
    if (wasPlaying) {
      playNext();
    } else {
      currentIndex.value++;
    }
  }
}

onUnmounted(() => {
  speechSynthesis.cancel();
});
</script>

<template>
  <div class="dictation-page">
    <header class="page-header">
      <h1 class="headline">单词听写</h1>
      <p class="subtitle">输入单词列表，自动播报朗读</p>
    </header>

    <div class="content-container">
      <!-- 输入区域 -->
      <section class="input-section">
        <label for="word-input" class="section-label">单词列表</label>
        <textarea
          id="word-input"
          v-model="wordInput"
          class="word-textarea"
          placeholder="输入单词，支持空格、逗号、换行分隔&#10;例如：apple banana orange"
          rows="6"
        ></textarea>

        <div class="settings-row">
          <div class="setting-item">
            <label for="repeat-count" class="setting-label">重复次数</label>
            <input
              id="repeat-count"
              v-model.number="repeatCount"
              type="number"
              min="1"
              max="5"
              class="setting-input"
            />
          </div>

          <div class="setting-item">
            <label for="speech-rate" class="setting-label">语速</label>
            <input
              id="speech-rate"
              v-model.number="speechRate"
              type="number"
              min="0.5"
              max="2"
              step="0.1"
              class="setting-input"
            />
          </div>
        </div>

        <button
          @click="parseWords"
          class="btn btn-primary"
          :disabled="!wordInput.trim()"
        >
          加载单词
        </button>
      </section>

      <!-- 播放控制区域 -->
      <section v-if="words.length > 0" class="player-section">
        <div class="progress-container">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: `${progress}%` }"></div>
          </div>
          <div class="progress-text">
            {{ currentIndex + 1 }} / {{ words.length }}
          </div>
        </div>

        <div v-if="currentWord" class="current-word">
          {{ currentWord.text }}
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
            v-if="!isPlaying"
            @click="play"
            class="btn btn-icon btn-play"
            :disabled="!canPlay"
            title="播放"
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          </button>

          <button
            v-else-if="!isPaused"
            @click="pause"
            class="btn btn-icon btn-play"
            :disabled="!canPause"
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
            :disabled="!canResume"
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
            :disabled="!canStop"
            title="停止"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 6h12v12H6z" />
            </svg>
          </button>
        </div>
      </section>

      <!-- 单词列表 -->
      <section v-if="words.length > 0" class="word-list-section">
        <h2 class="section-label">单词列表</h2>
        <div class="word-list">
          <div
            v-for="word in words"
            :key="word.index"
            class="word-item"
            :class="{ active: word.index === currentIndex }"
          >
            {{ word.text }}
          </div>
        </div>
      </section>
    </div>
  </div>
</template>
<style scoped>
.dictation-page {
  --md-primary: #1a73e8;
  --md-on-primary: #ffffff;
  --md-surface: #f8f9ff;
  --md-surface-container: #ffffff;
  --md-surface-container-high: #e8eaf6;
  --md-on-surface: #1a1c20;
  --md-on-surface-variant: #44474e;
  --md-outline: #74777f;
  --md-outline-variant: #c4c6d0;
  --md-error: #ba1a1a;

  max-width: 800px;
  margin: 0 auto;
  padding: 32px 16px;
  font-family: system-ui, -apple-system, sans-serif;
  color: var(--md-on-surface);
}

.page-header {
  margin-bottom: 32px;
}

.headline {
  font-size: 28px;
  font-weight: 400;
  line-height: 36px;
  margin: 0 0 8px;
}

.subtitle {
  font-size: 14px;
  color: var(--md-on-surface-variant);
  margin: 0;
}

.content-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.section-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: var(--md-on-surface);
  margin-bottom: 8px;
}

.input-section {
  background: var(--md-surface-container);
  border: 1px solid var(--md-outline-variant);
  border-radius: 16px;
  padding: 20px;
}

.word-textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid var(--md-outline);
  border-radius: 8px;
  font-family: inherit;
  font-size: 14px;
  line-height: 1.5;
  color: var(--md-on-surface);
  background: var(--md-surface-container);
  resize: vertical;
  transition: border-color 0.2s;
}

.word-textarea:focus {
  outline: none;
  border-color: var(--md-primary);
}

.settings-row {
  display: flex;
  gap: 16px;
  margin: 16px 0;
}

.setting-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.setting-label {
  font-size: 12px;
  color: var(--md-on-surface-variant);
}

.setting-input {
  padding: 8px 12px;
  border: 1px solid var(--md-outline);
  border-radius: 8px;
  font-size: 14px;
  color: var(--md-on-surface);
  background: var(--md-surface-container);
  transition: border-color 0.2s;
}

.setting-input:focus {
  outline: none;
  border-color: var(--md-primary);
}

.btn {
  padding: 10px 24px;
  border: none;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
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

.btn:active::before {
  opacity: 0.12;
}

.btn:disabled {
  opacity: 0.38;
  cursor: not-allowed;
}

.btn-primary {
  background: var(--md-primary);
  color: var(--md-on-primary);
}

.btn-icon {
  width: 48px;
  height: 48px;
  padding: 0;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  color: var(--md-on-surface);
}

.btn-play {
  width: 64px;
  height: 64px;
  background: var(--md-primary);
  color: var(--md-on-primary);
}

.player-section {
  background: var(--md-surface-container);
  border: 1px solid var(--md-outline-variant);
  border-radius: 16px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
}

.progress-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.progress-bar {
  width: 100%;
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

.progress-text {
  font-size: 12px;
  color: var(--md-on-surface-variant);
  text-align: center;
}

.current-word {
  font-size: 32px;
  font-weight: 500;
  color: var(--md-primary);
  min-height: 48px;
  display: flex;
  align-items: center;
}

.controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.word-list-section {
  background: var(--md-surface-container);
  border: 1px solid var(--md-outline-variant);
  border-radius: 16px;
  padding: 20px;
}

.word-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.word-item {
  padding: 6px 12px;
  border-radius: 8px;
  background: var(--md-surface-container-high);
  color: var(--md-on-surface-variant);
  font-size: 14px;
  transition: all 0.2s;
}

.word-item.active {
  background: var(--md-primary);
  color: var(--md-on-primary);
  transform: scale(1.05);
}

@media (max-width: 640px) {
  .settings-row {
    flex-direction: column;
  }

  .controls {
    gap: 4px;
  }

  .btn-icon {
    width: 40px;
    height: 40px;
  }

  .btn-play {
    width: 56px;
    height: 56px;
  }
}
</style>





