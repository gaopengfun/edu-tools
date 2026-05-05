// src/views/dictation/composables/useSpeechPlayer.ts
import { computed, onUnmounted } from 'vue';
import { useDictationStore } from '@/stores/dictation';
import { translateWord } from '@/utils/translate';

const REPEAT_DELAY_MS = 500;
const WORD_INTERVAL_MS = 1000;

export function useSpeechPlayer() {
  const store = useDictationStore();

  // 单调递增的会话号；任一新的 playFrom 调用都会让先前的循环作废
  let playSession = 0;

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
      utterance.onerror = (e) => {
        // 用户主动中断（pause / prev / next / stop）走这里，不应视为播放失败
        if (e.error === 'canceled' || e.error === 'interrupted') {
          resolve();
        } else {
          reject(e);
        }
      };
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

  function isStale(session: number, index: number) {
    return (
      session !== playSession ||
      !store.isPlaying ||
      store.isPaused ||
      store.currentIndex !== index
    );
  }

  async function playFrom(index: number) {
    if (index < 0 || index >= store.words.length) {
      stop();
      return;
    }
    const session = ++playSession;
    store.setPlayState(true, false, index);
    await loadTranslation(index);
    if (isStale(session, index)) return;

    const word = store.words[index];
    if (!word) return;

    try {
      for (let i = 0; i < store.repeatCount; i++) {
        if (isStale(session, index)) return;
        await speakWord(word.text);
        if (isStale(session, index)) return;
        if (i < store.repeatCount - 1) {
          await new Promise(resolve => setTimeout(resolve, REPEAT_DELAY_MS));
          if (isStale(session, index)) return;
        }
      }
      if (index < store.words.length - 1) {
        await new Promise(resolve => setTimeout(resolve, WORD_INTERVAL_MS));
        if (isStale(session, index)) return;
        await playFrom(index + 1);
      } else {
        stop();
      }
    } catch (error) {
      console.error('播放失败:', error);
      stop();
    }
  }

  function play() {
    if (store.words.length === 0) return;
    const startIndex = store.currentIndex < 0 ? 0 : store.currentIndex;
    playFrom(startIndex);
  }

  function pause() {
    store.setPlayState(true, true, store.currentIndex);
    speechSynthesis.cancel();
  }

  function resume() {
    if (store.words.length === 0) return;
    const target = store.currentIndex < 0 ? 0 : store.currentIndex;
    playFrom(target);
  }

  function stop() {
    playSession++;
    store.resetPlayState();
    speechSynthesis.cancel();
  }

  function prev() {
    if (!canPrev.value) return;
    const wasPlaying = store.isPlaying && !store.isPaused;
    const target = store.currentIndex - 1;
    speechSynthesis.cancel();
    if (wasPlaying) {
      playFrom(target);
    } else {
      store.setPlayState(store.isPlaying, store.isPaused, target);
    }
  }

  function next() {
    if (!canNext.value) return;
    const wasPlaying = store.isPlaying && !store.isPaused;
    const target = store.currentIndex + 1;
    speechSynthesis.cancel();
    if (wasPlaying) {
      playFrom(target);
    } else {
      store.setPlayState(store.isPlaying, store.isPaused, target);
    }
  }

  onUnmounted(() => {
    playSession++;
    speechSynthesis.cancel();
  });

  return { currentWord, progress, canPrev, canNext, play, pause, resume, stop, prev, next };
}
