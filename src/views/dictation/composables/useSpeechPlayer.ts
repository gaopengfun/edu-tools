// src/views/dictation/composables/useSpeechPlayer.ts
import { computed, onUnmounted } from 'vue';
import { useDictationStore } from '@/stores/dictation';
import { translateWord } from '@/utils/translate';

const REPEAT_DELAY_MS = 500;
const WORD_INTERVAL_MS = 1000;

export function useSpeechPlayer() {
  const store = useDictationStore();

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
      const utterance = new SpeechSynthesisUtterance(word);
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
      try {
        const translation = await translateWord(word.text);
        store.updateWordTranslation(index, translation);
      } catch (error) {
        console.error('翻译加载失败:', error);
      }
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

    try {
      for (let i = 0; i < store.repeatCount; i++) {
        if (!store.isPlaying || store.isPaused) break;
        await speakWord(word.text);
        if (i < store.repeatCount - 1) {
          await new Promise(resolve => setTimeout(resolve, REPEAT_DELAY_MS));
        }
      }
      if (store.isPlaying && !store.isPaused) {
        await new Promise(resolve => setTimeout(resolve, WORD_INTERVAL_MS));
        await playNext();
      }
    } catch (error) {
      console.error('播放失败:', error);
      stop();
    }
  }

  function play() {
    if (store.words.length === 0) return;
    const startIndex = store.currentIndex === -1 ? 0 : store.currentIndex;
    store.setPlayState(true, false, startIndex);
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
    if (!canPrev.value) return;
    const wasPlaying = store.isPlaying && !store.isPaused;
    speechSynthesis.cancel();
    store.setPlayState(store.isPlaying, store.isPaused, store.currentIndex - 1);
    if (wasPlaying) playNext();
  }

  function next() {
    if (!canNext.value) return;
    const wasPlaying = store.isPlaying && !store.isPaused;
    speechSynthesis.cancel();
    if (wasPlaying) {
      playNext();
    } else {
      store.setPlayState(false, false, store.currentIndex + 1);
    }
  }

  onUnmounted(() => {
    speechSynthesis.cancel();
  });

  return { currentWord, progress, canPrev, canNext, play, pause, resume, stop, prev, next };
}

