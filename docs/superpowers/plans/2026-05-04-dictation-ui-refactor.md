# 单词听写 UI 重构实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 使用 Tailwind CSS v4 全面重构单词听写 UI，MD3 精致风格，移动端适配，细粒度组件拆分。

**Architecture:** 全局 CSS 入口定义 MD3 色彩主题，页面组件组合细粒度子组件，播放逻辑抽离到 composable。Mobile-first 响应式，md 断点切换桌面布局。

**Tech Stack:** Vue 3 + TypeScript + Tailwind CSS v4 + Pinia + vue-router + Web Speech API

---

## 文件结构

```
src/
  styles/
    main.css                              — 新建：Tailwind 入口 + MD3 @theme
  main.ts                                 — 修改：引入 main.css
  stores/
    dictation.ts                          — 修改：新增 removeWord
  views/dictation/
    Dictation.vue                         — 重写：组合子组件
    DictationPlayer.vue                   — 重写：极简沉浸式
    components/
      WordInput.vue                       — 新建：textarea + 单词解析
      PlaybackSettings.vue                — 新建：range slider 设置
      WordConfirmModal.vue                — 重写：可编辑/删除，移动端底部抽屉
      PlayerControls.vue                  — 新建：播放控制栏
      ProgressBar.vue                     — 新建：进度条
      WordDisplay.vue                     — 新建：单词展示
    composables/
      useSpeechPlayer.ts                  — 新建：语音播放逻辑
```

---

### Task 1: 创建 Tailwind 全局 CSS 入口 + MD3 主题

**Files:**
- Create: `src/styles/main.css`
- Modify: `src/main.ts`

- [ ] **Step 1: 创建全局 CSS 入口文件**

```css
/* src/styles/main.css */
@import "tailwindcss";

@theme {
  --color-primary: #1a73e8;
  --color-on-primary: #ffffff;
  --color-surface: #f8f9ff;
  --color-surface-container: #ffffff;
  --color-surface-container-high: #e8eaf6;
  --color-on-surface: #1a1c20;
  --color-on-surface-variant: #44474e;
  --color-outline: #74777f;
  --color-outline-variant: #c4c6d0;
}
```

- [ ] **Step 2: 在 main.ts 中引入**

在 `src/main.ts` 顶部添加：

```ts
import './styles/main.css';
```

添加在 `import { createApp } from 'vue'` 之前。

- [ ] **Step 3: 验证 Tailwind 生效**

Run: `pnpm dev`

在浏览器中打开，检查页面是否正常加载，Tailwind 的 preflight 样式是否生效（字体、margin 重置等）。

- [ ] **Step 4: 提交**

```bash
git add src/styles/main.css src/main.ts
git commit -m "feat(dictation): 创建 Tailwind 全局 CSS 入口和 MD3 主题"
```

---

### Task 2: Store 新增 removeWord 方法

**Files:**
- Modify: `src/stores/dictation.ts`

- [ ] **Step 1: 添加 removeWord 方法**

在 `src/stores/dictation.ts` 的 `resetPlayState` 函数之后，`return` 之前添加：

```ts
function removeWord(index: number) {
  if (index >= 0 && index < words.value.length) {
    words.value.splice(index, 1);
    words.value.forEach((w, i) => { w.index = i; });
  }
}
```

- [ ] **Step 2: 在 return 中导出**

在 return 对象中添加 `removeWord`：

```ts
return {
  words,
  repeatCount,
  speechRate,
  currentIndex,
  isPlaying,
  isPaused,
  setWords,
  setConfig,
  setPlayState,
  updateWordTranslation,
  resetPlayState,
  removeWord
};
```

- [ ] **Step 3: 提交**

```bash
git add src/stores/dictation.ts
git commit -m "feat(dictation): store 新增 removeWord 方法"
```

---

### Task 3: 创建 useSpeechPlayer composable

**Files:**
- Create: `src/views/dictation/composables/useSpeechPlayer.ts`

- [ ] **Step 1: 创建 composable 文件**

```ts
// src/views/dictation/composables/useSpeechPlayer.ts
import { computed, onUnmounted } from 'vue';
import { useDictationStore } from '@/stores/dictation';
import { translateWord } from '@/utils/translate';

export function useSpeechPlayer() {
  const store = useDictationStore();
  let utterance: SpeechSynthesisUtterance | null = null;

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
      utterance = new SpeechSynthesisUtterance(word);
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
      const translation = await translateWord(word.text);
      store.updateWordTranslation(index, translation);
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
    for (let i = 0; i < store.repeatCount; i++) {
      if (!store.isPlaying || store.isPaused) break;
      await speakWord(word.text);
      if (i < store.repeatCount - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    if (store.isPlaying && !store.isPaused) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      playNext();
    }
  }

  function play() {
    if (store.words.length === 0) return;
    store.setPlayState(true, false, store.currentIndex === -1 ? -1 : store.currentIndex);
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
```

- [ ] **Step 2: 提交**

```bash
git add src/views/dictation/composables/useSpeechPlayer.ts
git commit -m "feat(dictation): 创建 useSpeechPlayer composable"
```

---

### Task 4: 创建 WordInput 组件

**Files:**
- Create: `src/views/dictation/components/WordInput.vue`

- [ ] **Step 1: 创建组件**

```vue
<!-- src/views/dictation/components/WordInput.vue -->
<script setup lang="ts">
import { computed } from 'vue';

const model = defineModel<string>({ required: true });
const props = defineProps<{ disabled?: boolean }>();

const wordCount = computed(() => {
  const text = model.value.trim();
  if (!text) return 0;
  return text.split(/[\n,，、\s]+/).filter(w => w.length > 0).length;
});
</script>

<template>
  <div>
    <label for="word-input"
      class="block text-xs font-medium text-on-surface-variant mb-2 uppercase tracking-wider"
    >单词列表</label>
    <textarea
      id="word-input"
      v-model="model"
      class="w-full p-4 border-[1.5px] border-outline-variant rounded-xl text-[15px] leading-relaxed
             text-on-surface bg-surface resize-y min-h-[160px] md:min-h-[200px]
             transition-colors duration-200 outline-none
             focus:border-primary
             disabled:opacity-60 disabled:cursor-not-allowed"
      placeholder="输入单词，支持空格、逗号、换行分隔&#10;例如：apple banana orange"
      rows="6"
      :disabled="props.disabled"
    />
    <p class="text-xs text-on-surface-variant mt-2 text-right">
      已输入 {{ wordCount }} 个单词
    </p>
  </div>
</template>
```

- [ ] **Step 2: 提交**

```bash
git add src/views/dictation/components/WordInput.vue
git commit -m "feat(dictation): 创建 WordInput 组件"
```

---

### Task 5: 创建 PlaybackSettings 组件

**Files:**
- Create: `src/views/dictation/components/PlaybackSettings.vue`

- [ ] **Step 1: 创建组件**

```vue
<!-- src/views/dictation/components/PlaybackSettings.vue -->
<script setup lang="ts">
const repeatCount = defineModel<number>('repeatCount', { required: true });
const speechRate = defineModel<number>('speechRate', { required: true });
const props = defineProps<{ disabled?: boolean }>();
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-surface rounded-xl">
    <div>
      <label for="repeat-count"
        class="block text-xs font-medium text-on-surface-variant mb-2"
      >重复次数</label>
      <div class="flex items-center gap-3">
        <input
          id="repeat-count"
          v-model.number="repeatCount"
          type="range" min="1" max="5" step="1"
          class="flex-1 accent-primary"
          :disabled="props.disabled"
        />
        <span class="text-sm font-medium text-on-surface min-w-6 text-center">
          {{ repeatCount }}
        </span>
      </div>
    </div>
    <div>
      <label for="speech-rate"
        class="block text-xs font-medium text-on-surface-variant mb-2"
      >语速</label>
      <div class="flex items-center gap-3">
        <input
          id="speech-rate"
          v-model.number="speechRate"
          type="range" min="0.5" max="2" step="0.1"
          class="flex-1 accent-primary"
          :disabled="props.disabled"
        />
        <span class="text-sm font-medium text-on-surface min-w-8 text-center">
          {{ speechRate }}
        </span>
      </div>
    </div>
  </div>
</template>
```

- [ ] **Step 2: 提交**

```bash
git add src/views/dictation/components/PlaybackSettings.vue
git commit -m "feat(dictation): 创建 PlaybackSettings 组件"
```

---

### Task 6: 重写 WordConfirmModal 组件

**Files:**
- Rewrite: `src/views/dictation/components/WordConfirmModal.vue`

- [ ] **Step 1: 重写组件**

```vue
<!-- src/views/dictation/components/WordConfirmModal.vue -->
<script setup lang="ts">
import type { WordItem } from '@/stores/dictation';

const props = defineProps<{ words: WordItem[]; show: boolean }>();
const emit = defineEmits<{
  (e: 'confirm'): void;
  (e: 'cancel'): void;
  (e: 'remove', index: number): void;
  (e: 'updateTranslation', index: number, translation: string): void;
}>();
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="props.show" class="fixed inset-0 z-50 flex items-center justify-center md:p-4"
           @click="emit('cancel')">
        <!-- Overlay -->
        <div class="absolute inset-0 bg-black/50" />

        <!-- Desktop: centered dialog / Mobile: bottom sheet -->
        <div class="relative w-full md:max-w-[520px] md:rounded-2xl
                    max-md:fixed max-md:bottom-0 max-md:left-0 max-md:right-0
                    max-md:rounded-t-2xl max-md:max-h-[85vh]
                    bg-surface-container flex flex-col shadow-2xl"
             @click.stop>

          <!-- Mobile drag handle -->
          <div class="flex justify-center pt-2 pb-0 md:hidden">
            <div class="w-8 h-1 bg-outline-variant rounded-full" />
          </div>

          <!-- Header -->
          <div class="flex items-center justify-between px-6 py-4 md:pt-5">
            <h2 class="text-lg md:text-xl font-medium text-on-surface">确认单词列表</h2>
            <span class="text-xs md:text-sm text-on-surface-variant">共 {{ props.words.length }} 个</span>
          </div>

          <!-- Word list -->
          <div class="flex-1 overflow-y-auto px-6 pb-4">
            <div class="flex flex-col gap-2">
              <div v-for="(word, i) in props.words" :key="word.index"
                class="flex items-center gap-3 p-3 bg-surface-container-high rounded-xl">
                <span class="text-xs text-on-surface-variant min-w-5">{{ i + 1 }}</span>
                <div class="flex-1 min-w-0">
                  <div class="text-sm md:text-[15px] font-medium text-on-surface">{{ word.text }}</div>
                  <input
                    :value="word.translation"
                    @change="emit('updateTranslation', word.index, ($event.target as HTMLInputElement).value)"
                    class="text-xs md:text-sm text-on-surface-variant bg-transparent border-b border-dashed
                           border-transparent focus:border-primary outline-none w-full py-0.5"
                    placeholder="点击编辑翻译"
                  />
                </div>
                <button @click="emit('remove', word.index)"
                  class="w-8 h-8 rounded-lg flex items-center justify-center text-red-700
                         opacity-50 hover:opacity-100 hover:bg-red-700/8 transition-all shrink-0">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="px-6 py-4 border-t border-surface-container-high
                      flex gap-3 max-md:pb-[max(1rem,env(safe-area-inset-bottom))]">
            <button @click="emit('cancel')"
              class="max-md:flex-1 px-6 py-2.5 rounded-xl text-sm font-medium
                     md:bg-transparent md:text-primary md:hover:bg-primary/8
                     max-md:border-[1.5px] max-md:border-outline-variant max-md:text-on-surface
                     transition-colors">
              返回修改
            </button>
            <button @click="emit('confirm')"
              class="max-md:flex-1 px-6 py-2.5 rounded-xl text-sm font-medium
                     bg-primary text-on-primary shadow-sm shadow-primary/30
                     hover:shadow-md transition-all">
              确认开始
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
```

- [ ] **Step 2: 提交**

```bash
git add src/views/dictation/components/WordConfirmModal.vue
git commit -m "refactor(dictation): 重写确认弹框支持编辑删除和移动端底部抽屉"
```

---

### Task 7: 创建 ProgressBar 组件

**Files:**
- Create: `src/views/dictation/components/ProgressBar.vue`

- [ ] **Step 1: 创建组件**

```vue
<!-- src/views/dictation/components/ProgressBar.vue -->
<script setup lang="ts">
defineProps<{ progress: number }>();
</script>

<template>
  <div class="w-full h-0.5 bg-white/8">
    <div class="h-full bg-primary transition-[width] duration-300 ease-out"
         :style="{ width: `${progress}%` }" />
  </div>
</template>
```

- [ ] **Step 2: 提交**

```bash
git add src/views/dictation/components/ProgressBar.vue
git commit -m "feat(dictation): 创建 ProgressBar 组件"
```

---

### Task 8: 创建 WordDisplay 组件

**Files:**
- Create: `src/views/dictation/components/WordDisplay.vue`

- [ ] **Step 1: 创建组件**

```vue
<!-- src/views/dictation/components/WordDisplay.vue -->
<script setup lang="ts">
defineProps<{ word?: string; translation?: string }>();
</script>

<template>
  <div class="flex-1 flex flex-col items-center justify-center gap-3 md:gap-4 px-4">
    <div v-if="word"
      class="text-[42px] md:text-[56px] font-light text-white tracking-wide text-center">
      {{ word }}
    </div>
    <div v-if="translation"
      class="text-[17px] md:text-xl text-white/45 text-center">
      {{ translation }}
    </div>
  </div>
</template>
```

- [ ] **Step 2: 提交**

```bash
git add src/views/dictation/components/WordDisplay.vue
git commit -m "feat(dictation): 创建 WordDisplay 组件"
```

---

### Task 9: 创建 PlayerControls 组件

**Files:**
- Create: `src/views/dictation/components/PlayerControls.vue`

- [ ] **Step 1: 创建组件**

```vue
<!-- src/views/dictation/components/PlayerControls.vue -->
<script setup lang="ts">
defineProps<{
  isPlaying: boolean;
  isPaused: boolean;
  canPrev: boolean;
  canNext: boolean;
}>();

const emit = defineEmits<{
  (e: 'play'): void;
  (e: 'pause'): void;
  (e: 'resume'): void;
  (e: 'prev'): void;
  (e: 'next'): void;
}>();
</script>

<template>
  <div class="flex items-center justify-center gap-6 md:gap-8 px-4
              py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
    <!-- Prev -->
    <button @click="emit('prev')" :disabled="!canPrev"
      class="w-10 h-10 md:w-11 md:h-11 rounded-full flex items-center justify-center
             text-white/50 disabled:opacity-25 transition-opacity">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
        <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
      </svg>
    </button>

    <!-- Play / Pause -->
    <button v-if="!isPlaying" @click="emit('play')"
      class="w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center
             bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/15">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
        <path d="M8 5v14l11-7z"/>
      </svg>
    </button>
    <button v-else-if="!isPaused" @click="emit('pause')"
      class="w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center
             bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/15">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
        <path d="M6 4h4v16H6zm8 0h4v16h-4z"/>
      </svg>
    </button>
    <button v-else @click="emit('resume')"
      class="w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center
             bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/15">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
        <path d="M8 5v14l11-7z"/>
      </svg>
    </button>

    <!-- Next -->
    <button @click="emit('next')" :disabled="!canNext"
      class="w-10 h-10 md:w-11 md:h-11 rounded-full flex items-center justify-center
             text-white/50 disabled:opacity-25 transition-opacity">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
        <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
      </svg>
    </button>
  </div>
</template>
```

- [ ] **Step 2: 提交**

```bash
git add src/views/dictation/components/PlayerControls.vue
git commit -m "feat(dictation): 创建 PlayerControls 组件"
```

---

### Task 10: 重写 Dictation.vue 输入配置页

**Files:**
- Rewrite: `src/views/dictation/Dictation.vue`

- [ ] **Step 1: 重写页面组件**

```vue
<!-- src/views/dictation/Dictation.vue -->
<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useDictationStore, type WordItem } from '@/stores/dictation';
import { batchTranslate } from '@/utils/translate';
import WordInput from './components/WordInput.vue';
import PlaybackSettings from './components/PlaybackSettings.vue';
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
  <div class="max-w-2xl mx-auto px-4 py-8 md:py-10 text-on-surface">
    <header class="mb-8">
      <h1 class="text-2xl md:text-[28px] font-normal leading-tight">单词听写</h1>
      <p class="text-sm text-on-surface-variant mt-1">输入单词列表，自动播报朗读</p>
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
</template>
```

- [ ] **Step 2: 提交**

```bash
git add src/views/dictation/Dictation.vue
git commit -m "refactor(dictation): 重写输入配置页使用 Tailwind 和子组件"
```

---

### Task 11: 重写 DictationPlayer.vue 极简沉浸播报页

**Files:**
- Rewrite: `src/views/dictation/DictationPlayer.vue`

- [ ] **Step 1: 重写页面组件**

```vue
<!-- src/views/dictation/DictationPlayer.vue -->
<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useDictationStore } from '@/stores/dictation';
import { useSpeechPlayer } from './composables/useSpeechPlayer';
import WordDisplay from './components/WordDisplay.vue';
import ProgressBar from './components/ProgressBar.vue';
import PlayerControls from './components/PlayerControls.vue';

const router = useRouter();
const store = useDictationStore();
const { currentWord, progress, canPrev, canNext, play, pause, resume, prev, next, stop } = useSpeechPlayer();

function goBack() {
  stop();
  router.push('/dictation');
}

onMounted(() => {
  if (store.words.length === 0) router.push('/dictation');
});
</script>

<template>
  <div class="min-h-dvh flex flex-col bg-[#0a0a0a]">
    <!-- Top bar -->
    <div class="flex items-center justify-between px-4 md:px-6 py-3 md:py-4">
      <button @click="goBack"
        class="w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center
               bg-white/8 text-white/70 hover:bg-white/12 transition-colors">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
        </svg>
      </button>
      <span class="text-xs md:text-sm text-white/40 font-medium tracking-wider">
        {{ store.currentIndex + 1 }} / {{ store.words.length }}
      </span>
    </div>

    <!-- Word display -->
    <WordDisplay :word="currentWord?.text" :translation="currentWord?.translation" />

    <!-- Progress bar -->
    <ProgressBar :progress="progress" />

    <!-- Controls -->
    <PlayerControls
      :is-playing="store.isPlaying" :is-paused="store.isPaused"
      :can-prev="canPrev" :can-next="canNext"
      @play="play" @pause="pause" @resume="resume"
      @prev="prev" @next="next" />
  </div>
</template>
```

- [ ] **Step 2: 提交**

```bash
git add src/views/dictation/DictationPlayer.vue
git commit -m "refactor(dictation): 重写极简沉浸播报页使用 Tailwind 和子组件"
```

---

### Task 12: 清理和验证

**Files:**
- 无新文件，全面验证

- [ ] **Step 1: 类型检查**

Run: `pnpm type-check`
Expected: 无错误

- [ ] **Step 2: Lint 检查**

Run: `pnpm lint`
Expected: 无错误（或仅自动修复的警告）

- [ ] **Step 3: 启动开发服务器手动验证**

Run: `pnpm dev`

验证清单：
1. 访问 `/dictation`，输入配置页正常显示
2. textarea 输入单词，实时计数正确
3. range slider 拖动正常，数值显示正确
4. 点击"加载单词"，弹框显示单词列表和翻译
5. 弹框中可编辑翻译、删除单词
6. 点击"确认开始"，跳转到播报页
7. 播报页纯黑背景，单词大字显示
8. 播放/暂停/上下一个按钮正常工作
9. 返回按钮停止播放并返回输入页
10. 缩小浏览器窗口到移动端宽度，验证响应式布局
11. 确认弹框在移动端显示为底部抽屉

- [ ] **Step 4: 提交最终清理（如有）**

```bash
git add -A
git commit -m "refactor(dictation): 完成听写 UI 重构清理"
```
