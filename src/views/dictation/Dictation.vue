<!-- eslint-disable vue/multi-word-component-names -->
<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useDictationStore, type WordItem } from '@/stores/dictation';
import { batchTranslate } from '@/utils/translate';
import WordInput from './components/WordInput.vue';
import PlaybackSettings from './components/PlaybackSettings.vue';
import WordConfirmModal from './components/WordConfirmModal.vue';
import DecorativeBackground from './components/DecorativeBackground.vue';

const router = useRouter();
const store = useDictationStore();

const wordInput = ref('');
const repeatCount = ref(2);
const speechRate = ref(0.8);
const isLoading = ref(false);
const showModal = ref(false);
const previewWords = ref<WordItem[]>([]);

// mock data, 自测使用，暂时不要删除
// wordInput.value = 'apple,banana,orange、clever、naughty、enjoy、want、need、everyone、go';

async function handleLoadWords() {
  const text = wordInput.value.trim();
  if (!text) return;
  isLoading.value = true;
  try {
    const wordList = text.split(/[\n,，、\s]+/).map(w => w.trim()).filter(w => w.length > 0);
    const translations = await batchTranslate(wordList);
    previewWords.value = wordList.map((text, index) => ({ text, translation: translations[index] || '', index }));
    showModal.value = true;
  } catch (error) {
    console.error('加载单词失败:', error);
  } finally {
    isLoading.value = false;
  }
}

function handleRemoveWord(index: number) {
  previewWords.value = previewWords.value.filter(w => w.index !== index);
  previewWords.value.forEach((w, i) => { w.index = i; });
}

function handleUpdateTranslation(index: number, translation: string) {
  const word = previewWords.value.find(w => w.index === index);
  if (word) word.translation = translation;
}

function handleConfirm() {
  store.setWords(previewWords.value);
  store.setConfig(repeatCount.value, speechRate.value);
  showModal.value = false;
  router.push('/dictation/player');
}

function goBack() {
  router.push('/');
}
</script>

<template>
  <div class="min-h-dvh relative overflow-hidden bg-gradient-to-b from-sky-100 via-sky-50 to-emerald-100">
    <DecorativeBackground />

    <div class="relative z-10 max-w-2xl mx-auto px-4 py-8 md:py-10">
      <button @click="goBack" aria-label="返回工具列表"
        class="mb-5 w-11 h-11 rounded-full flex items-center justify-center
               bg-white/80 backdrop-blur-sm shadow-md shadow-sky-200/40
               text-slate-600 transition-all
               hover:bg-white active:scale-95">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
        </svg>
      </button>

      <header class="mb-8">
        <h1 class="text-2xl md:text-[28px] font-semibold text-slate-700 leading-tight">
          单词听写
        </h1>
        <p class="text-sm text-slate-500 mt-1">输入单词列表，自动播报朗读</p>
      </header>

      <div class="bg-white/80 backdrop-blur-sm shadow-lg shadow-sky-200/40
                  rounded-3xl p-5 md:p-7">
        <WordInput v-model="wordInput" :disabled="isLoading" />

        <PlaybackSettings v-model:repeat-count="repeatCount" v-model:speech-rate="speechRate"
          :disabled="isLoading" class="mt-5" />

        <button @click="handleLoadWords"
          :disabled="!wordInput.trim() || isLoading"
          class="w-full mt-6 h-14 rounded-2xl text-[15px] font-medium
                 bg-gradient-to-br from-sky-400 to-emerald-400
                 shadow-lg shadow-sky-400/40 text-white
                 hover:scale-[1.01] active:scale-[0.98]
                 disabled:opacity-50 disabled:saturate-50
                 disabled:cursor-not-allowed disabled:hover:scale-100
                 transition-all duration-200">
          {{ isLoading ? '加载中...' : '加载单词' }}
        </button>
      </div>

      <WordConfirmModal :words="previewWords" :show="showModal"
        @confirm="handleConfirm" @cancel="showModal = false"
        @remove="handleRemoveWord" @update-translation="handleUpdateTranslation" />
    </div>
  </div>
</template>
