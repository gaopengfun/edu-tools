# 单词听写播报页视觉重设计 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 `/dictation/player` 从全黑沉浸式风格改造为浅蓝→薄荷绿渐变 + 装饰云朵 + 圆胖控件 + 进度激励的"轻松活泼、适当幼龄化"风格，仅做视觉重写不动业务逻辑。

**Architecture:** 在保留现有 5 个文件（`DictationPlayer.vue` + `WordDisplay/ProgressBar/PlayerControls`）结构的基础上，重写它们的模板与样式；新增 2 个纯视觉子组件 `DecorativeBackground.vue` 和 `ProgressBadge.vue`；在全局 CSS 追加 2 段自定义 keyframes。无 store/composable 改动。

**Tech Stack:** Vue 3 `<script setup lang="ts">` + Tailwind CSS v4 + 内联 SVG。无新依赖。本仓库无测试运行器，因此采用**视觉/手工验证 + `pnpm type-check` + `pnpm lint`** 替代单元测试。

参考 spec：`docs/superpowers/specs/2026-05-05-dictation-player-redesign-design.md`

---

## 文件改动清单

| 路径 | 动作 | 职责 |
|---|---|---|
| `src/styles/main.css` | Modify | 追加 `float-slow` 与 `pulse-ring` keyframes 及 reduced-motion 兜底 |
| `src/views/dictation/components/DecorativeBackground.vue` | Create | 装饰层：云朵 + 星点 SVG，aria-hidden |
| `src/views/dictation/components/ProgressBadge.vue` | Create | 顶栏右上"X / Y"+ 完成进度 chip |
| `src/views/dictation/components/WordDisplay.vue` | Modify | 加播报脉动光晕、字重 600、译文 chip 化；新增 `isPlaying` prop |
| `src/views/dictation/components/ProgressBar.vue` | Modify | 渐变填充 + 末端进度小球 |
| `src/views/dictation/components/PlayerControls.vue` | Modify | 主键放大渐变 80px、副键白底 56px、加 aria-label |
| `src/views/dictation/DictationPlayer.vue` | Modify | 换背景渐变、挂装饰层、顶栏接 ProgressBadge、传 isPlaying 给 WordDisplay |

---

## Task 1：追加全局动画 keyframes

**Files:**
- Modify: `src/styles/main.css`

- [ ] **Step 1：在 main.css 末尾追加 keyframes**

打开 `src/styles/main.css`，在文件末尾追加以下内容：

```css
@keyframes float-slow {
  0%, 100% { transform: translateX(0); }
  50% { transform: translateX(20px); }
}

@keyframes pulse-ring {
  0% { transform: scale(1); opacity: 0.25; }
  100% { transform: scale(2); opacity: 0; }
}

.animate-float-slow {
  animation: float-slow 18s ease-in-out infinite;
}

.animate-pulse-ring {
  animation: pulse-ring 4s ease-out infinite;
}

@media (prefers-reduced-motion: reduce) {
  .animate-float-slow {
    animation: none;
  }
  .animate-pulse-ring {
    animation: none;
    opacity: 0;
  }
}
```

- [ ] **Step 2：类型检查 + lint**

Run: `pnpm type-check`
Expected: PASS（仅修改 CSS，无 TS 影响）

Run: `pnpm lint`
Expected: PASS

- [ ] **Step 3：提交**

```bash
git add src/styles/main.css
git commit -m "style(dictation): 追加播报页装饰云与脉动光晕动画 keyframes"
```

---

## Task 2：新建 DecorativeBackground 装饰层组件

**Files:**
- Create: `src/views/dictation/components/DecorativeBackground.vue`

- [ ] **Step 1：创建 DecorativeBackground.vue**

完整文件内容：

```vue
<!-- src/views/dictation/components/DecorativeBackground.vue -->
<script setup lang="ts"></script>

<template>
  <div class="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
    <!-- Cloud 1 - top left -->
    <svg class="absolute top-[8%] left-[6%] w-32 h-20 text-white/30 animate-float-slow"
         viewBox="0 0 100 60" fill="currentColor">
      <ellipse cx="30" cy="40" rx="22" ry="16" />
      <ellipse cx="55" cy="30" rx="26" ry="20" />
      <ellipse cx="78" cy="42" rx="18" ry="14" />
    </svg>

    <!-- Cloud 2 - mid right -->
    <svg class="absolute top-[28%] right-[8%] w-40 h-24 text-white/25 animate-float-slow"
         style="animation-delay: -6s" viewBox="0 0 100 60" fill="currentColor">
      <ellipse cx="28" cy="42" rx="20" ry="14" />
      <ellipse cx="52" cy="32" rx="28" ry="22" />
      <ellipse cx="80" cy="40" rx="20" ry="16" />
    </svg>

    <!-- Cloud 3 - bottom left -->
    <svg class="absolute bottom-[18%] left-[12%] w-28 h-16 text-white/20 animate-float-slow"
         style="animation-delay: -12s" viewBox="0 0 100 60" fill="currentColor">
      <ellipse cx="32" cy="38" rx="22" ry="16" />
      <ellipse cx="60" cy="30" rx="24" ry="18" />
    </svg>

    <!-- Sparkle 1 -->
    <svg class="absolute top-[20%] right-[28%] w-4 h-4 text-white/60"
         viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l2 8 8 2-8 2-2 8-2-8-8-2 8-2z" />
    </svg>

    <!-- Sparkle 2 -->
    <svg class="absolute top-[60%] right-[18%] w-3 h-3 text-white/40"
         viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l2 8 8 2-8 2-2 8-2-8-8-2 8-2z" />
    </svg>

    <!-- Sparkle 3 -->
    <svg class="absolute top-[42%] left-[18%] w-3 h-3 text-white/50"
         viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l2 8 8 2-8 2-2 8-2-8-8-2 8-2z" />
    </svg>
  </div>
</template>
```

- [ ] **Step 2：类型检查**

Run: `pnpm type-check`
Expected: PASS

- [ ] **Step 3：lint**

Run: `pnpm lint`
Expected: PASS

- [ ] **Step 4：提交**

```bash
git add src/views/dictation/components/DecorativeBackground.vue
git commit -m "feat(dictation): 新增 DecorativeBackground 装饰云朵与星点组件"
```

---

## Task 3：新建 ProgressBadge 进度激励组件

**Files:**
- Create: `src/views/dictation/components/ProgressBadge.vue`

- [ ] **Step 1：创建 ProgressBadge.vue**

完整文件内容：

```vue
<!-- src/views/dictation/components/ProgressBadge.vue -->
<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{ current: number; total: number }>();

const percent = computed(() =>
  props.total > 0 ? Math.round((props.current / props.total) * 100) : 0
);
const done = computed(() => props.total > 0 && props.current >= props.total);
</script>

<template>
  <div class="flex flex-col items-end gap-1">
    <div class="text-xl font-semibold text-slate-700 tabular-nums">
      {{ current }} / {{ total }}
    </div>
    <span
      class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium"
      :class="done ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'">
      <!-- Star (in progress) -->
      <svg v-if="!done" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2l2.9 7h7.1l-5.7 4.4 2.2 7.1L12 16l-6.5 4.5 2.2-7.1L2 9h7.1z" />
      </svg>
      <!-- Trophy (done) -->
      <svg v-else class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M7 4h10v3a5 5 0 01-10 0V4zM4 5h2v2a3 3 0 003 3v2H8a4 4 0 01-4-4V5zm16 0v3a4 4 0 01-4 4h-1v-2a3 3 0 003-3V5h2zM10 13h4l-.5 3H14v2h-4v-2h.5L10 13zm-2 7h8v2H8v-2z" />
      </svg>
      <span>{{ done ? '全部完成' : `已完成 ${percent}%` }}</span>
    </span>
  </div>
</template>
```

- [ ] **Step 2：类型检查**

Run: `pnpm type-check`
Expected: PASS

- [ ] **Step 3：lint**

Run: `pnpm lint`
Expected: PASS

- [ ] **Step 4：提交**

```bash
git add src/views/dictation/components/ProgressBadge.vue
git commit -m "feat(dictation): 新增 ProgressBadge 顶栏完成进度激励组件"
```

---

## Task 4：重写 WordDisplay 加光晕与字重

**Files:**
- Modify: `src/views/dictation/components/WordDisplay.vue`

- [ ] **Step 1：用以下完整内容覆盖 WordDisplay.vue**

```vue
<!-- src/views/dictation/components/WordDisplay.vue -->
<script setup lang="ts">
defineProps<{
  word?: string;
  translation?: string;
  isPlaying?: boolean;
}>();
</script>

<template>
  <div class="flex-1 flex flex-col items-center justify-center relative px-4">
    <!-- Static radial halo -->
    <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div
        class="w-[600px] h-[600px] max-w-[120vw] max-h-[120vw] rounded-full"
        style="background: radial-gradient(closest-side, rgba(125, 211, 252, 0.35), transparent);" />
    </div>

    <!-- Pulsing rings (only when playing) -->
    <template v-if="isPlaying">
      <div
        class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
               w-60 h-60 rounded-full bg-sky-300/25 animate-pulse-ring pointer-events-none" />
      <div
        class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
               w-60 h-60 rounded-full bg-sky-300/25 animate-pulse-ring pointer-events-none"
        style="animation-delay: -2s" />
    </template>

    <!-- Word -->
    <div
      v-if="word"
      class="relative z-10 text-[56px] md:text-[88px] font-semibold tracking-wide
             text-slate-900 text-center leading-tight">
      {{ word }}
    </div>

    <!-- Translation chip -->
    <div v-if="translation" class="relative z-10 mt-4">
      <span
        class="inline-block px-5 py-1.5 rounded-full
               bg-white/70 backdrop-blur-sm shadow-sm shadow-sky-200/50
               text-slate-600 text-base md:text-lg">
        {{ translation }}
      </span>
    </div>
  </div>
</template>
```

- [ ] **Step 2：类型检查**

Run: `pnpm type-check`
Expected: PASS

- [ ] **Step 3：lint**

Run: `pnpm lint`
Expected: PASS

- [ ] **Step 4：提交**

```bash
git add src/views/dictation/components/WordDisplay.vue
git commit -m "refactor(dictation): WordDisplay 加播报脉动光晕与字重 600 译文 chip"
```

---

## Task 5：重写 ProgressBar 加渐变与小球

**Files:**
- Modify: `src/views/dictation/components/ProgressBar.vue`

- [ ] **Step 1：用以下完整内容覆盖 ProgressBar.vue**

```vue
<!-- src/views/dictation/components/ProgressBar.vue -->
<script setup lang="ts">
defineProps<{ progress: number }>();
</script>

<template>
  <div class="px-6 py-2">
    <div class="relative h-2 rounded-full bg-white/60 overflow-visible">
      <div
        class="h-full rounded-full bg-gradient-to-r from-sky-400 to-emerald-400
               transition-[width] duration-300 ease-out"
        :style="{ width: `${progress}%` }" />
      <div
        class="absolute top-1/2 -translate-y-1/2 -translate-x-1/2
               w-3.5 h-3.5 rounded-full bg-white shadow-md shadow-sky-300/60
               transition-[left] duration-300 ease-out"
        :style="{ left: `${progress}%` }" />
    </div>
  </div>
</template>
```

- [ ] **Step 2：类型检查**

Run: `pnpm type-check`
Expected: PASS

- [ ] **Step 3：lint**

Run: `pnpm lint`
Expected: PASS

- [ ] **Step 4：提交**

```bash
git add src/views/dictation/components/ProgressBar.vue
git commit -m "refactor(dictation): ProgressBar 改为渐变填充加进度小圆点"
```

---

## Task 6：重写 PlayerControls 圆胖按钮

**Files:**
- Modify: `src/views/dictation/components/PlayerControls.vue`

- [ ] **Step 1：用以下完整内容覆盖 PlayerControls.vue**

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
  <div class="flex items-center justify-center gap-7 px-4
              py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
    <!-- Prev -->
    <button @click="emit('prev')" :disabled="!canPrev" aria-label="上一个"
      class="w-14 h-14 rounded-full flex items-center justify-center
             bg-white/80 backdrop-blur-sm shadow-md shadow-sky-200/40
             text-slate-600 transition-transform
             hover:bg-white active:scale-95
             disabled:opacity-40 disabled:cursor-not-allowed">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
        <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
      </svg>
    </button>

    <!-- Play / Pause / Resume -->
    <button v-if="!isPlaying" @click="emit('play')" aria-label="播放"
      class="w-20 h-20 rounded-full flex items-center justify-center
             bg-gradient-to-br from-sky-400 to-emerald-400
             shadow-lg shadow-sky-400/40 text-white transition-transform
             hover:scale-105 active:scale-95">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
        <path d="M8 5v14l11-7z"/>
      </svg>
    </button>
    <button v-else-if="!isPaused" @click="emit('pause')" aria-label="暂停"
      class="w-20 h-20 rounded-full flex items-center justify-center
             bg-gradient-to-br from-sky-400 to-emerald-400
             shadow-lg shadow-sky-400/40 text-white transition-transform
             hover:scale-105 active:scale-95">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
        <path d="M6 4h4v16H6zm8 0h4v16h-4z"/>
      </svg>
    </button>
    <button v-else @click="emit('resume')" aria-label="继续"
      class="w-20 h-20 rounded-full flex items-center justify-center
             bg-gradient-to-br from-sky-400 to-emerald-400
             shadow-lg shadow-sky-400/40 text-white transition-transform
             hover:scale-105 active:scale-95">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
        <path d="M8 5v14l11-7z"/>
      </svg>
    </button>

    <!-- Next -->
    <button @click="emit('next')" :disabled="!canNext" aria-label="下一个"
      class="w-14 h-14 rounded-full flex items-center justify-center
             bg-white/80 backdrop-blur-sm shadow-md shadow-sky-200/40
             text-slate-600 transition-transform
             hover:bg-white active:scale-95
             disabled:opacity-40 disabled:cursor-not-allowed">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
        <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
      </svg>
    </button>
  </div>
</template>
```

- [ ] **Step 2：类型检查**

Run: `pnpm type-check`
Expected: PASS

- [ ] **Step 3：lint**

Run: `pnpm lint`
Expected: PASS

- [ ] **Step 4：提交**

```bash
git add src/views/dictation/components/PlayerControls.vue
git commit -m "refactor(dictation): PlayerControls 主键 80px 渐变副键白底圆胖化"
```

---

## Task 7：重写 DictationPlayer 浅色渐变 + 装配新组件

**Files:**
- Modify: `src/views/dictation/DictationPlayer.vue`

- [ ] **Step 1：用以下完整内容覆盖 DictationPlayer.vue**

```vue
<!-- src/views/dictation/DictationPlayer.vue -->
<script setup lang="ts">
import { computed, onMounted } from 'vue';
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
const { currentWord, progress, canPrev, canNext, play, pause, resume, prev, next, stop } = useSpeechPlayer();

const isActivelyPlaying = computed(() => store.isPlaying && !store.isPaused);
const displayIndex = computed(() =>
  store.currentIndex < 0 ? 0 : store.currentIndex + 1
);

function goBack() {
  stop();
  router.push('/dictation');
}

onMounted(() => {
  if (store.words.length === 0) router.push('/dictation');
});
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

      <!-- Word display -->
      <WordDisplay
        :word="currentWord?.text"
        :translation="currentWord?.translation"
        :is-playing="isActivelyPlaying" />

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
```

- [ ] **Step 2：类型检查**

Run: `pnpm type-check`
Expected: PASS

- [ ] **Step 3：lint**

Run: `pnpm lint`
Expected: PASS

- [ ] **Step 4：开发服务器手动验证**

Run: `pnpm dev` （如果未运行）。在浏览器打开应用，从首页进入"单词听写"页输入几个单词加载，跳转到 `/dictation/player`。

视觉验证清单：
- [ ] 整页背景为浅蓝→浅薄荷绿渐变，无任何深色块
- [ ] 背景能看到淡白色云朵和星点，云朵缓慢左右漂移
- [ ] 顶部左侧返回按钮为白色半透明圆按钮
- [ ] 顶部右侧显示"1 / N"和琥珀色"⭐ 已完成 X%"chip
- [ ] 单词以深色 600 字重显示在中央，下方有白色半透明圆角译文 chip
- [ ] 点击播放后单词周围出现两层蓝色脉动圆环（约 4s 一周期）
- [ ] 进度条为白色轨道 + 蓝绿渐变填充 + 末端白色小球
- [ ] 主播放按钮 80px 蓝绿渐变带阴影，hover 时放大
- [ ] 上一个/下一个按钮为白色半透明圆，禁用时变浅
- [ ] 播放完所有单词后顶部 chip 切换为绿色"🏆 全部完成"
- [ ] 暂停时脉动停止保持现状，点击继续后恢复
- [ ] 点击返回回到 `/dictation` 输入页

如有任何项不符，回到对应 Task 调整。

- [ ] **Step 5：减少动效偏好测试**

打开 Chrome DevTools → Rendering → "Emulate CSS media feature prefers-reduced-motion" 设为 `reduce`，刷新页面。

验证：
- [ ] 云朵停止漂移
- [ ] 播放时无脉动圆环

- [ ] **Step 6：移动端宽度验证**

DevTools 切换到 iPhone 14 (390px) 视口刷新：
- [ ] 单词字号缩小到 56px 仍居中
- [ ] 控件区不溢出，间距合理
- [ ] 装饰云朵不挡主内容

- [ ] **Step 7：提交**

```bash
git add src/views/dictation/DictationPlayer.vue
git commit -m "refactor(dictation): 播报页换为浅色渐变背景挂装载饰层与进度激励"
```

---

## Task 8：最终一致性收尾

- [ ] **Step 1：完整 lint + type-check**

Run: `pnpm lint && pnpm type-check`
Expected: 全部 PASS

- [ ] **Step 2：构建验证**

Run: `pnpm build`
Expected: 构建成功，无类型错误，无遗漏的资源引用

- [ ] **Step 3：(可选) 截图对比**

打开播报页截图保存为 `dictation-player-redesigned.png`，与原 `dictation-final.png` 对比确认风格切换符合预期。无需提交截图。

- [ ] **Step 4：检查 git 状态**

Run: `git status`
Expected: working tree clean（除可能的非本计划相关未跟踪文件）。如有遗漏的本计划相关文件，补一次提交。

---

## Self-Review

**Spec coverage：**
- §1 配色与背景：Task 7 渐变背景 + Task 2 装饰层 + Task 1 漂移动画 ✅
- §2 单词主体（光晕 + 字重 + 译文 chip）：Task 4 + Task 1 pulse-ring ✅
- §3 进度条 + 控件：Task 5（渐变小球） + Task 6（圆胖按钮） ✅
- §4 顶栏（返回 + 激励 chip）+ 整体骨架：Task 7 + Task 3 ✅
- 无障碍（aria-hidden / aria-label / reduced-motion）：Task 2 装饰层 aria-hidden、Task 6 控件 aria-label、Task 1 reduced-motion 兜底、Task 7 Step 5 验证 ✅

**Placeholder 扫描：** 无 TBD/TODO；每个 Step 都有完整代码或具体命令；无"参考前面 Task"占位。

**类型一致性：** `WordDisplay` 新增的 `isPlaying?: boolean` 在 Task 4 定义，在 Task 7 通过 `:is-playing="isActivelyPlaying"` 传入；`ProgressBadge` 的 `current/total` 在 Task 3 定义、Task 7 调用，名字一致；`isActivelyPlaying` 派生自 `store.isPlaying && !store.isPaused`，与 spec §2 描述对齐；`displayIndex` 在 currentIndex 为 -1 时回落为 0，避免显示 "0 / N"，符合 spec 顶栏交互。

无问题，计划完成。
