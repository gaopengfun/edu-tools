// src/views/dictation/composables/useSpeechPlayer.ts
import { computed, onUnmounted, ref } from 'vue';
import { useDictationStore } from '@/stores/dictation';
import { translateWord } from '@/utils/translate';

const REPEAT_DELAY_MS = 500;
const WORD_INTERVAL_MS = 1000;

export function useSpeechPlayer() {
  const store = useDictationStore();

  // 单调递增的会话号；任一新的 playFrom 调用都会让先前的循环作废
  let playSession = 0;

  // 部分浏览器（如小米手机浏览器）不暴露 speechSynthesis 全局，裸引用会抛
  // ReferenceError。此处一次性绑定 synth，后续全部走 synth?.xxx，避免裸名访问。
  const synth: SpeechSynthesis | null =
    typeof window !== 'undefined' && 'speechSynthesis' in window
      ? window.speechSynthesis
      : null;
  const speechSupported = synth !== null;

  // 语音列表在浏览器中是异步加载的，第一次 getVoices() 可能为空；通过
  // voiceschanged 事件保持 voices 反应式。
  const initialVoices = synth?.getVoices() ?? [];
  const voices = ref<SpeechSynthesisVoice[]>(initialVoices);
  // voicesLoaded 用作「能否信任 hasEnglishVoice」的闸门：Chrome 首屏同步
  // getVoices() 常返回 []，若直接据此渲染未装英文语音的提示，会闪一下。
  const voicesLoaded = ref(initialVoices.length > 0);
  const handleVoicesChanged = () => {
    voices.value = synth?.getVoices() ?? [];
    voicesLoaded.value = true;
  };
  synth?.addEventListener('voiceschanged', handleVoicesChanged);

  // 是否存在英文语音（en-US / en-GB / en-* 任一）。无英文语音时，Windows 中
  // 文 SAPI 对英文文本会静默——这是「单词播报没有声音」的最常见根因。
  // 不支持 / 未加载语音时一律按「有」处理避免误报；不支持的情况由
  // speechSupported 单独驱动 UI。
  const hasEnglishVoice = computed(() =>
    !speechSupported ||
    !voicesLoaded.value ||
    voices.value.some(v => v.lang.toLowerCase().startsWith('en'))
  );

  // 选一个最合适的语音：优先 en-US，其次任何 en-*，再退化到默认/任意可用。
  // 显式赋值 utterance.voice 可避免某些浏览器在 lang 不匹配时静默失败。
  function pickVoice(): SpeechSynthesisVoice | null {
    const list = voices.value;
    return (
      list.find(v => v.lang === 'en-US') ||
      list.find(v => v.lang.toLowerCase().startsWith('en')) ||
      list.find(v => v.default) ||
      list[0] ||
      null
    );
  }

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
      if (!synth) {
        reject(new Error('浏览器不支持语音合成'));
        return;
      }
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = 'en-US';
      utterance.rate = store.speechRate;
      const v = pickVoice();
      if (v) utterance.voice = v;
      utterance.onend = () => resolve();
      utterance.onerror = (e) => {
        // 用户主动中断（pause / prev / next / stop）走这里，不应视为播放失败
        if (e.error === 'canceled' || e.error === 'interrupted') {
          resolve();
        } else {
          reject(e);
        }
      };
      synth.speak(utterance);
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
    // 翻译只用于视觉展示，不阻塞发声；await 会丢失用户手势激活态，并在
    // 后端慢/不可达时把第一次 speak 推迟最长 10s（请求超时）。
    void loadTranslation(index);

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
    if (store.words.length === 0 || !speechSupported) return;
    const startIndex = store.currentIndex < 0 ? 0 : store.currentIndex;
    playFrom(startIndex);
  }

  function pause() {
    store.setPlayState(true, true, store.currentIndex);
    synth?.cancel();
  }

  function resume() {
    if (store.words.length === 0 || !speechSupported) return;
    const target = store.currentIndex < 0 ? 0 : store.currentIndex;
    playFrom(target);
  }

  function stop() {
    playSession++;
    store.resetPlayState();
    synth?.cancel();
  }

  function prev() {
    if (!canPrev.value) return;
    const wasPlaying = store.isPlaying && !store.isPaused;
    const target = store.currentIndex - 1;
    synth?.cancel();
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
    synth?.cancel();
    if (wasPlaying) {
      playFrom(target);
    } else {
      store.setPlayState(store.isPlaying, store.isPaused, target);
    }
  }

  onUnmounted(() => {
    playSession++;
    synth?.removeEventListener('voiceschanged', handleVoicesChanged);
    synth?.cancel();
  });

  return { currentWord, progress, canPrev, canNext, speechSupported, hasEnglishVoice, play, pause, resume, stop, prev, next };
}
