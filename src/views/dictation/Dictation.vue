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
wordInput.value = 'apple,banana,orange、clever、naughty、enjoy、want、need、everyone、go';

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
</script>

<template>
  <div class="min-h-dvh relative overflow-hidden
              bg-gradient-to-b from-sky-100 via-sky-50 to-emerald-100">
    <DecorativeBackground />

    <div class="relative z-10 max-w-2xl mx-auto px-4 py-8 md:py-10">
      <header class="mb-8">
        <h1 class="text-2xl md:text-[28px] font-semibold text-slate-700 leading-tight">
          单词听写
        </h1>
        <p class="text-sm text-slate-500 mt-1">输入单词列表，自动播报朗读</p>
      </header>

      <div class="bg-surface-container border border-outline-variant rounded-2xl p-4 md:p-6">
        <WordInput v-model="wordInput" :disabled="isLoading" />

        <PlaybackSettings v-model:repeat-count="repeatCount" v-model:speech-rate="speechRate"
          :disabled="isLoading" class="mt-5" />

        <button @click="handleLoadWords"
          :disabled="!wordInput.trim() || isLoading"
          class="w-full mt-6 py-3.5 rounded-xl text-[15px] font-medium
                 bg-primary text-on-primary shadow-sm shadow-primary/30
                 hover:shadow-md active:scale-[0.98]
                 disabled:opacity-38 disabled:cursor-not-allowed disabled:shadow-none
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
