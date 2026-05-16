import { ref } from 'vue';
import { defineStore } from 'pinia';

export interface WordItem {
  text: string;
  translation: string;
  index: number;
}

export const useDictationStore = defineStore('dictation', () => {
  const words = ref<WordItem[]>([]);
  const repeatCount = ref(2);
  const speechRate = ref(0.8);
  const currentIndex = ref(-1);
  const isPlaying = ref(false);
  const isPaused = ref(false);
  // 整轮听写跑完的"庆祝态"。stop() 会把 currentIndex 重置为 -1，
  // 没有这个 flag 进度就会在最后一个词播完后瞬间塌回 0/N。
  const isComplete = ref(false);

  function setWords(newWords: WordItem[]) {
    words.value = newWords;
    currentIndex.value = -1;
    isPlaying.value = false;
    isPaused.value = false;
    isComplete.value = false;
  }

  function setConfig(repeat: number, rate: number) {
    repeatCount.value = repeat;
    speechRate.value = rate;
  }

  function setPlayState(playing: boolean, paused: boolean, index: number) {
    isPlaying.value = playing;
    isPaused.value = paused;
    currentIndex.value = index;
  }

  function updateWordTranslation(index: number, translation: string) {
    if (index >= 0 && index < words.value.length) {
      const word = words.value[index];
      if (word) {
        word.translation = translation;
      }
    }
  }

  function resetPlayState() {
    currentIndex.value = -1;
    isPlaying.value = false;
    isPaused.value = false;
    // 注意：不在这里清 isComplete。stop() 会调用本函数，但跑完最后一个词
    // 的"庆祝态"需要在 stop() 之后仍然可见，由 setComplete 单独管理。
  }

  function setComplete(value: boolean) {
    isComplete.value = value;
  }

  function removeWord(index: number) {
    if (index >= 0 && index < words.value.length) {
      words.value.splice(index, 1);
      words.value.forEach((w, i) => {
        w.index = i;
      });

      // Adjust currentIndex if needed
      if (currentIndex.value > index) {
        currentIndex.value--;
      } else if (currentIndex.value === index) {
        // If removing the current word, reset to previous or -1
        currentIndex.value = Math.max(-1, index - 1);
      }

      // If we removed the last word and currentIndex is now out of bounds
      if (currentIndex.value >= words.value.length) {
        currentIndex.value = words.value.length - 1;
      }
    }
  }

  return {
    words,
    repeatCount,
    speechRate,
    currentIndex,
    isPlaying,
    isPaused,
    isComplete,
    setWords,
    setConfig,
    setPlayState,
    setComplete,
    updateWordTranslation,
    resetPlayState,
    removeWord
  };
});
