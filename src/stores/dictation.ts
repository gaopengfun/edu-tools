import { ref, watch } from 'vue';
import { defineStore } from 'pinia';

export interface WordItem {
  text: string;
  translation: string;
  index: number;
}

const CONFIG_STORAGE_KEY = 'dictation:config';

interface StoredConfig {
  repeatCount: number;
  speechRate: number;
}

function loadStoredConfig(): StoredConfig | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredConfig>;
    if (typeof parsed.repeatCount !== 'number' || typeof parsed.speechRate !== 'number') {
      return null;
    }
    return { repeatCount: parsed.repeatCount, speechRate: parsed.speechRate };
  } catch {
    return null;
  }
}

export const useDictationStore = defineStore('dictation', () => {
  const stored = loadStoredConfig();
  const words = ref<WordItem[]>([]);
  const repeatCount = ref(stored?.repeatCount ?? 2);
  const speechRate = ref(stored?.speechRate ?? 0.8);

  watch([repeatCount, speechRate], ([r, rate]) => {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify({ repeatCount: r, speechRate: rate }));
    } catch {
      // localStorage 写入失败（隐私模式 / 配额）就静默放过，不影响主流程
    }
  });
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
    resetPlayState
  };
});
