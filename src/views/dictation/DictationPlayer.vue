<!-- src/views/dictation/DictationPlayer.vue -->
<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useDictationStore } from '@/stores/dictation';
import { useSpeechPlayer } from './composables/useSpeechPlayer';
import WordDisplay from './components/WordDisplay.vue';
import ProgressBar from './components/ProgressBar.vue';
import PlayerControls from './components/PlayerControls.vue';
import DecorativeBackground from './components/DecorativeBackground.vue';
import ProgressBadge from './components/ProgressBadge.vue';

const router = useRouter();
const store = useDictationStore();
const { currentWord, progress, canPrev, canNext, speechSupported, hasEnglishVoice, play, pause, resume, prev, next, stop } = useSpeechPlayer();

const isActivelyPlaying = computed(() => store.isPlaying && !store.isPaused);
const displayIndex = computed(() =>
  store.currentIndex < 0 ? 0 : store.currentIndex + 1
);

const previewWord = computed(() =>
  currentWord.value ?? (store.words.length > 0 ? store.words[0] : null)
);

const showStartHint = computed(
  () => speechSupported && !store.isPlaying && store.currentIndex < 0 && store.words.length > 0
);

// 异常提示只用作首次告知，3 秒后自动消失，避免长期占据顶部视觉空间
const BANNER_AUTO_HIDE_MS = 3000;
const showUnsupportedBanner = ref(false);
const showNoEnglishBanner = ref(false);

function goBack() {
  stop();
  router.push('/dictation');
}

onMounted(() => {
  if (store.words.length === 0) router.push('/dictation');
  if (!speechSupported) {
    showUnsupportedBanner.value = true;
    setTimeout(() => { showUnsupportedBanner.value = false; }, BANNER_AUTO_HIDE_MS);
  }
});

// hasEnglishVoice 在 voices 加载后才会变成 false，watch 捕获此次跃迁后再起计时
watch(hasEnglishVoice, (hasEn) => {
  if (!hasEn && speechSupported) {
    showNoEnglishBanner.value = true;
    setTimeout(() => { showNoEnglishBanner.value = false; }, BANNER_AUTO_HIDE_MS);
  }
}, { immediate: true });
</script>

<template>
  <div class="min-h-dvh relative overflow-hidden flex flex-col
              bg-gradient-to-b from-sky-100 via-sky-50 to-emerald-100">
    <!-- Decorative layer -->
    <DecorativeBackground />

    <!-- Main content -->
    <div class="relative z-10 flex flex-col flex-1">
      <!-- Top bar -->
      <div class="flex items-start justify-between px-4 md:px-6 py-3 md:py-4">
        <button @click="goBack" aria-label="返回"
          class="w-11 h-11 rounded-full flex items-center justify-center
                 bg-white/80 backdrop-blur-sm shadow-md shadow-sky-200/40
                 text-slate-600 transition-all
                 hover:bg-white active:scale-95">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
          </svg>
        </button>

        <ProgressBadge :current="displayIndex" :total="store.words.length" />
      </div>

      <!-- 当前浏览器不支持 Web Speech API（如部分国产手机浏览器） -->
      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0 -translate-y-1"
        leave-active-class="transition duration-300 ease-in"
        leave-to-class="opacity-0 -translate-y-1">
        <div v-if="showUnsupportedBanner"
          class="mx-4 md:mx-6 mb-2 px-4 py-2.5 rounded-2xl
                 bg-rose-50/90 backdrop-blur-sm
                 text-[13px] leading-snug text-rose-800
                 ring-1 ring-rose-200/70 shadow-sm">
          当前浏览器不支持语音合成，无法播报单词。请改用
          <span class="font-medium">Chrome 或 Edge</span> 打开本页面。
        </div>
      </Transition>

      <!-- 系统未安装英文语音时的提示：中文 SAPI 对英文文本会静默 -->
      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0 -translate-y-1"
        leave-active-class="transition duration-300 ease-in"
        leave-to-class="opacity-0 -translate-y-1">
        <div v-if="showNoEnglishBanner"
          class="mx-4 md:mx-6 mb-2 px-4 py-2.5 rounded-2xl
                 bg-amber-50/90 backdrop-blur-sm
                 text-[13px] leading-snug text-amber-800
                 ring-1 ring-amber-200/70 shadow-sm">
          当前系统未安装英文语音，可能听不到声音。请在
          <span class="font-medium">Windows 设置 → 时间和语言 → 语言和区域 → 添加语言（英语）</span>
          中安装英文语音包后重试。
        </div>
      </Transition>

      <!-- Word display -->
      <div class="relative flex-1 flex flex-col">
        <WordDisplay
          :word="previewWord?.text"
          :translation="currentWord?.translation"
          :is-playing="isActivelyPlaying" />

        <!-- Initial-state overlay: tap to start -->
        <button
          v-if="showStartHint"
          type="button"
          @click="play"
          aria-label="点击开始播报"
          class="group absolute inset-0 z-20 flex items-center justify-center
                 cursor-pointer focus:outline-none">
          <span
            class="absolute inset-0 bg-white/30 backdrop-blur-[2px]
                   transition-colors group-hover:bg-white/40" />
          <span
            class="relative flex items-center gap-3 px-6 py-3 rounded-full
                   bg-white/85 backdrop-blur-md
                   shadow-lg shadow-sky-300/40
                   ring-1 ring-white/60
                   text-slate-700 text-base md:text-lg font-medium
                   animate-hint-bob
                   transition-transform duration-200
                   group-hover:scale-105 group-active:scale-95
                   group-focus-visible:ring-2 group-focus-visible:ring-sky-400">
            <span
              class="w-9 h-9 rounded-full flex items-center justify-center
                     bg-gradient-to-br from-sky-400 to-emerald-400
                     shadow shadow-sky-400/40 text-white">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
            点击开始播报
          </span>
        </button>
      </div>

      <!-- Progress bar -->
      <ProgressBar :progress="progress" />

      <!-- Controls -->
      <PlayerControls
        :is-playing="store.isPlaying" :is-paused="store.isPaused"
        :can-prev="canPrev" :can-next="canNext"
        @play="play" @pause="pause" @resume="resume"
        @prev="prev" @next="next" />
    </div>
  </div>
</template>
