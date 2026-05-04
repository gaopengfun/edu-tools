<!-- eslint-disable vue/multi-word-component-names -->
<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useDictationStore, type WordItem } from '@/stores/dictation';
import { batchTranslate } from '@/utils/translate';
import WordConfirmModal from './components/WordConfirmModal.vue';

const router = useRouter();
const store = useDictationStore();

const wordInput = ref('');
const repeatCount = ref(2);
const speechRate = ref(0.8);
const isLoading = ref(false);
const showModal = ref(false);
const previewWords = ref<WordItem[]>([]);

async function handleLoadWords() {
  const text = wordInput.value.trim();
  if (!text) return;

  isLoading.value = true;

  try {
    const wordList = text
      .split(/[\n,，、\s]+/)
      .map(w => w.trim())
      .filter(w => w.length > 0);

    const translations = await batchTranslate(wordList);

    previewWords.value = wordList.map((text, index) => ({
      text,
      translation: translations[index] || '',
      index
    }));

    showModal.value = true;
  } catch (error) {
    console.error('加载单词失败:', error);
  } finally {
    isLoading.value = false;
  }
}

function handleConfirm() {
  store.setWords(previewWords.value);
  store.setConfig(repeatCount.value, speechRate.value);
  showModal.value = false;
  router.push('/dictation/player');
}

function handleCancel() {
  showModal.value = false;
}
</script>

<template>
  <div class="dictation-page">
    <header class="page-header">
      <h1 class="headline">单词听写</h1>
      <p class="subtitle">输入单词列表，自动播报朗读</p>
    </header>

    <div class="content-container">
      <section class="input-section">
        <label for="word-input" class="section-label">单词列表</label>
        <textarea
          id="word-input"
          v-model="wordInput"
          class="word-textarea"
          placeholder="输入单词，支持空格、逗号、换行分隔&#10;例如：apple banana orange"
          rows="8"
          :disabled="isLoading"
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
              :disabled="isLoading"
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
              :disabled="isLoading"
            />
          </div>
        </div>

        <button
          @click="handleLoadWords"
          class="btn btn-primary"
          :disabled="!wordInput.trim() || isLoading"
        >
          <span v-if="!isLoading">加载单词</span>
          <span v-else>加载中...</span>
        </button>
      </section>

      <section v-if="wordInput.trim()" class="info-section">
        <p class="info-text">
          点击"加载单词"后，系统将自动获取单词翻译并显示确认弹框。
        </p>
      </section>
    </div>

    <WordConfirmModal
      :words="previewWords"
      :show="showModal"
      @confirm="handleConfirm"
      @cancel="handleCancel"
    />
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

.word-textarea:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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

.setting-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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

.btn:disabled {
  opacity: 0.38;
  cursor: not-allowed;
}

.btn-primary {
  background: var(--md-primary);
  color: var(--md-on-primary);
}

.info-section {
  background: var(--md-surface-container-high);
  border-radius: 12px;
  padding: 16px;
}

.info-text {
  font-size: 14px;
  color: var(--md-on-surface-variant);
  margin: 0;
  line-height: 1.5;
}

@media (max-width: 640px) {
  .settings-row {
    flex-direction: column;
  }
}
</style>




