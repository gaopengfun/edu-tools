// src/views/dictation/composables/useSpeechPlayer.ts
import { computed, onUnmounted, ref } from 'vue';
import { useDictationStore } from '@/stores/dictation';
import { translateWord } from '@/utils/translate';

const REPEAT_DELAY_MS = 500;
const WORD_INTERVAL_MS = 1000;
// 有道发音接口起播超时；超过则视作失败，降级到本地 TTS
const AUDIO_START_TIMEOUT_MS = 4000;
// type=1 美音，type=2 英音
const YOUDAO_VOICE_URL = (word: string) =>
  `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(word)}&type=1`;

export function useSpeechPlayer() {
  const store = useDictationStore();

  // 单调递增的会话号；任一新的 playFrom 调用都会让先前的循环作废
  let playSession = 0;
  // cancelCurrentSpeech 通过它同步落定当前正在 pending 的 audio promise，
  // 避免下一次 speakWithAudio 复用同一个 audio 元素时被旧 src 的延迟 error 事件误伤
  let activeAudioCancel: (() => void) | null = null;

  // 主路径：HTML5 audio + 有道发音 mp3。几乎所有浏览器都可用，且发音质量
  // 比本地 TTS 稳定（不依赖系统语音包）。
  const audio: HTMLAudioElement | null = typeof Audio !== 'undefined' ? new Audio() : null;
  audio?.setAttribute('preload', 'auto');

  // 降级路径：Web Speech API。部分浏览器（如小米手机浏览器）不暴露
  // speechSynthesis 全局，裸引用会抛 ReferenceError；统一走 synth?.xxx。
  const synth: SpeechSynthesis | null =
    typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null;

  // 只要 audio 或 synth 任一可用，就认为可发声
  const speechSupported = audio !== null || synth !== null;

  // 语音列表在浏览器中是异步加载的，第一次 getVoices() 可能为空；通过
  // voiceschanged 事件保持 voices 反应式。仅用于本地 TTS 降级路径。
  const initialVoices = synth?.getVoices() ?? [];
  const voices = ref<SpeechSynthesisVoice[]>(initialVoices);
  const voicesLoaded = ref(initialVoices.length > 0);
  const handleVoicesChanged = () => {
    voices.value = synth?.getVoices() ?? [];
    voicesLoaded.value = true;
  };
  synth?.addEventListener('voiceschanged', handleVoicesChanged);

  // 主路径走有道音频时，本地是否有英文语音不影响发声；只有当 audio 不可用
  // 且必须降级到本地 TTS 时才相关。这里仍保留以兼容上游 UI 提示。
  const hasEnglishVoice = computed(
    () =>
      audio !== null ||
      !synth ||
      !voicesLoaded.value ||
      voices.value.some((v) => v.lang.toLowerCase().startsWith('en'))
  );

  function pickVoice(): SpeechSynthesisVoice | null {
    const list = voices.value;
    return (
      list.find((v) => v.lang === 'en-US') ||
      list.find((v) => v.lang.toLowerCase().startsWith('en')) ||
      list.find((v) => v.default) ||
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

  // 进度按"已经播完的单词数"计：刚切到第 N 个词时还没播完，不应该已经满。
  // 跑完整轮后由 isComplete 顶到 100%，否则 stop() 把 currentIndex 拉回 -1
  // 时进度会瞬间塌回 0。
  const progress = computed(() => {
    const total = store.words.length;
    if (total === 0) return 0;
    if (store.isComplete) return 100;
    const completed = Math.max(0, store.currentIndex);
    return (completed / total) * 100;
  });

  const canPrev = computed(() => store.currentIndex > 0);
  const canNext = computed(() => store.currentIndex < store.words.length - 1);

  // 主播放路径：拉取并播放有道音频。任何异常（网络失败、超时、未起播）
  // 都 reject，由 speakWord 决定是否降级。
  function speakWithAudio(word: string) {
    return new Promise<void>((resolve, reject) => {
      if (!audio) {
        reject(new Error('audio_unavailable'));
        return;
      }
      // 每次调用各自持有 canceled，闭包不会被下次调用覆盖
      let canceled = false;
      let settled = false;
      let started = false;

      const cleanup = () => {
        audio.onended = null;
        audio.onerror = null;
        audio.onplaying = null;
        clearTimeout(startTimer);
        if (activeAudioCancel === cancel) activeAudioCancel = null;
      };
      const finish = (fn: () => void) => {
        if (settled) return;
        settled = true;
        cleanup();
        fn();
      };

      audio.onended = () => finish(resolve);
      audio.onerror = () => {
        if (canceled) finish(resolve);
        else finish(() => reject(new Error('audio_error')));
      };
      audio.onplaying = () => {
        started = true;
        clearTimeout(startTimer);
      };

      const startTimer = setTimeout(() => {
        if (!started) finish(() => reject(new Error('audio_timeout')));
      }, AUDIO_START_TIMEOUT_MS);

      const cancel = () => {
        canceled = true;
        finish(resolve);
      };
      activeAudioCancel = cancel;

      audio.src = YOUDAO_VOICE_URL(word);
      // 调速保留音调（Chrome / Firefox 默认 true，部分浏览器忽略 — 可接受）
      audio.playbackRate = store.speechRate;
      audio.play().catch((err) => {
        if (canceled) finish(resolve);
        else finish(() => reject(err));
      });
    });
  }

  // 降级路径：Web Speech API。
  function speakWithSynth(word: string) {
    return new Promise<void>((resolve, reject) => {
      if (!synth) {
        reject(new Error('speech_synthesis_unavailable'));
        return;
      }
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = 'en-US';
      utterance.rate = store.speechRate;
      const v = pickVoice();
      if (v) utterance.voice = v;
      utterance.onend = () => resolve();
      utterance.onerror = (e) => {
        if (e.error === 'canceled' || e.error === 'interrupted') {
          resolve();
        } else {
          reject(new Error(e.error || 'speech_synthesis_error'));
        }
      };
      synth.speak(utterance);
    });
  }

  async function speakWord(word: string) {
    try {
      await speakWithAudio(word);
    } catch (err) {
      console.warn('[dictation] 有道发音失败，降级到本地 TTS', err);
      await speakWithSynth(word);
    }
  }

  function cancelCurrentSpeech() {
    // 先同步把 pending 的 audio promise 落定，避免后续 audio.pause / load
    // 引发的 error 事件被下一次 speakWithAudio 误收
    activeAudioCancel?.();
    if (audio) {
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
    }
    synth?.cancel();
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
      session !== playSession || !store.isPlaying || store.isPaused || store.currentIndex !== index
    );
  }

  async function playFrom(index: number) {
    if (index < 0 || index >= store.words.length) {
      stop();
      return;
    }
    const session = ++playSession;
    store.setPlayState(true, false, index);
    void loadTranslation(index);

    const word = store.words[index];
    if (!word) return;

    try {
      for (let i = 0; i < store.repeatCount; i++) {
        if (isStale(session, index)) return;
        await speakWord(word.text);
        if (isStale(session, index)) return;
        if (i < store.repeatCount - 1) {
          await new Promise((resolve) => setTimeout(resolve, REPEAT_DELAY_MS));
          if (isStale(session, index)) return;
        }
      }
      if (index < store.words.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, WORD_INTERVAL_MS));
        if (isStale(session, index)) return;
        await playFrom(index + 1);
      } else {
        stop();
        // stop() 之后置位：让"3/3 全部完成"在 currentIndex 复位后仍可见
        store.setComplete(true);
      }
    } catch (error) {
      console.error('播放失败:', error);
      stop();
    }
  }

  function play() {
    if (store.words.length === 0 || !speechSupported) return;
    // 从初始态或上一轮完成态按 play 都视作新一轮，清掉庆祝态
    store.setComplete(false);
    const startIndex = store.currentIndex < 0 ? 0 : store.currentIndex;
    playFrom(startIndex);
  }

  function pause() {
    if (!store.isPlaying) return;
    store.setPlayState(true, true, store.currentIndex);
    cancelCurrentSpeech();
  }

  function resume() {
    if (store.words.length === 0 || !speechSupported) return;
    const target = store.currentIndex < 0 ? 0 : store.currentIndex;
    playFrom(target);
  }

  function stop() {
    playSession++;
    store.resetPlayState();
    cancelCurrentSpeech();
  }

  function prev() {
    if (!canPrev.value) return;
    const wasPlaying = store.isPlaying && !store.isPaused;
    const target = store.currentIndex - 1;
    cancelCurrentSpeech();
    // 用户显式导航走出"全部完成"态，复位庆祝标记，避免徽章和进度卡在 100%
    store.setComplete(false);
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
    cancelCurrentSpeech();
    store.setComplete(false);
    if (wasPlaying) {
      playFrom(target);
    } else {
      store.setPlayState(store.isPlaying, store.isPaused, target);
    }
  }

  onUnmounted(() => {
    playSession++;
    synth?.removeEventListener('voiceschanged', handleVoicesChanged);
    cancelCurrentSpeech();
  });

  return {
    currentWord,
    progress,
    canPrev,
    canNext,
    speechSupported,
    hasEnglishVoice,
    play,
    pause,
    resume,
    stop,
    prev,
    next
  };
}
