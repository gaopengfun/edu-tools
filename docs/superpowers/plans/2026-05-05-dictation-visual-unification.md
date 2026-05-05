# 单词听写「输入页 + 确认弹框」视觉统一实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 `/dictation` 输入页和 `WordConfirmModal` 视觉对齐已经定型的 `/dictation/player`：浅色 sky→emerald 渐变背景、白色磨砂卡、sky-emerald 渐变胖按钮、星徽语言。

**Architecture:** 纯样式调整，不改逻辑、不改 props/emits、不增依赖。复用 `DecorativeBackground.vue`、`main.css` 已有的 `animate-float-slow` keyframes 和 player 控制条的 token 体系。

**Tech Stack:** Vue 3 `<script setup>` + Tailwind utility class + 原生 `<Transition>`。

**Spec:** `docs/superpowers/specs/2026-05-05-dictation-visual-unification-design.md`

---

## 文件结构

### 修改文件
- `src/views/dictation/Dictation.vue` — 渐变背景 + 装饰层 + 磨砂大卡 + 渐变主键
- `src/views/dictation/components/WordInput.vue` — label/textarea/单词数 pill 风格
- `src/views/dictation/components/PlaybackSettings.vue` — 嵌套子卡背景 + slider 色
- `src/views/dictation/components/WordConfirmModal.vue` — overlay/卡片/列表/footer 全套换装

### 不修改
- `composables/useSpeechPlayer.ts`、`stores/dictation.ts`、`router/index.ts`、`utils/translate.ts`：纯逻辑层，本计划不涉及。
- `DecorativeBackground.vue`、`PlayerControls.vue`、`ProgressBadge.vue`、`ProgressBar.vue`、`WordDisplay.vue`：参考来源，不改。
- `main.css`：`animate-float-slow` 已存在（grep 已确认 line 28-47）。

---

## 验证基线

仓库无单测，每个 Task 的"验证"步骤统一为：

```bash
pnpm dev
# 浏览器打开 http://localhost:5173/dictation
# 按 Task 内的「目视验证」清单逐项核对
```

最后整体跑一次：

```bash
pnpm lint
pnpm type-check
```

---

## Task 1: Dictation.vue 页面骨架（渐变背景 + 装饰层 + Header）

**Files:**
- Modify: `src/views/dictation/Dictation.vue`

- [ ] **Step 1: 引入 DecorativeBackground**

在 `<script setup>` 区块末尾、`function handleConfirm()` 之前，新增 import：

```ts
import DecorativeBackground from './components/DecorativeBackground.vue';
```

完整 import 区块应为：

```ts
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useDictationStore, type WordItem } from '@/stores/dictation';
import { batchTranslate } from '@/utils/translate';
import WordInput from './components/WordInput.vue';
import PlaybackSettings from './components/PlaybackSettings.vue';
import WordConfirmModal from './components/WordConfirmModal.vue';
import DecorativeBackground from './components/DecorativeBackground.vue';
```

- [ ] **Step 2: 替换 `<template>` 的根 div + header**

把整个 `<template>` 段替换为以下内容（仅页面骨架与 header，大卡内容仍保留旧样式，下个 Task 再换）：

```vue
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
```

- [ ] **Step 3: 目视验证**

在浏览器 `/dictation` 中确认：

- 背景从 sky-100 顶部渐变到 emerald-100 底部。
- 看到云朵 SVG 缓慢漂浮（来自 DecorativeBackground，在卡片背后）。
- 标题「单词听写」字色变成深灰（slate-700）且更粗。
- 副标题「输入单词列表...」字色变成中灰（slate-500）。
- 旧的 MD3 卡片仍在原位（这是预期的，下一个 Task 才换）。

- [ ] **Step 4: 提交**

```bash
git add src/views/dictation/Dictation.vue
git commit -m "refactor(dictation): 输入页换浅色渐变背景与装饰层"
```

---

## Task 2: Dictation.vue 大卡 + 加载按钮换装

**Files:**
- Modify: `src/views/dictation/Dictation.vue`

- [ ] **Step 1: 替换大卡容器和加载按钮**

把 `<template>` 中的「大卡 div + button」段替换为：

```vue
      <div class="bg-white/80 backdrop-blur-sm shadow-lg shadow-sky-200/40
                  rounded-3xl p-5 md:p-7">
        <WordInput v-model="wordInput" :disabled="isLoading" />

        <PlaybackSettings v-model:repeat-count="repeatCount" v-model:speech-rate="speechRate"
          :disabled="isLoading" class="mt-5" />

        <button @click="handleLoadWords"
          :disabled="!wordInput.trim() || isLoading"
          class="w-full mt-6 h-14 rounded-2xl text-[15px] font-medium
                 bg-gradient-to-br from-sky-400 to-emerald-400
                 shadow-lg shadow-sky-400/40 text-white
                 hover:scale-[1.01] active:scale-[0.98]
                 disabled:opacity-50 disabled:saturate-50
                 disabled:cursor-not-allowed disabled:hover:scale-100
                 transition-all duration-200">
          {{ isLoading ? '加载中...' : '加载单词' }}
        </button>
      </div>
```

注意点：
- 容器去掉了 `border border-outline-variant`，圆角从 `rounded-2xl` 升到 `rounded-3xl`，padding 从 `p-4 md:p-6` 升到 `p-5 md:p-7`。
- 按钮从 `py-3.5 + rounded-xl + bg-primary` 改为 `h-14 + rounded-2xl + 渐变`。
- disabled 加 `hover:scale-100` 防止禁用时还在缩放。

- [ ] **Step 2: 目视验证**

在 `/dictation` 中确认：

- 大卡变成磨砂半透明白底，能透出渐变背景的颜色。
- 卡片下方有一层柔和的 sky 阴影。
- 「加载单词」按钮变成 sky→emerald 渐变胖按钮，与 player 主键风格一致。
- 清空 textarea 后，按钮变灰（不饱和），鼠标悬停不再放大。
- 输入文字后，按钮恢复活力，hover 微微放大。

- [ ] **Step 3: 提交**

```bash
git add src/views/dictation/Dictation.vue
git commit -m "refactor(dictation): 输入页大卡换磨砂卡 主键换渐变胖按钮"
```

---

## Task 3: WordInput.vue 换装

**Files:**
- Modify: `src/views/dictation/components/WordInput.vue`

- [ ] **Step 1: 整体替换 `<template>` 区块**

把整个 `<template>` 替换为：

```vue
<template>
  <div>
    <label for="word-input"
      class="block text-xs font-medium text-slate-500 mb-2"
    >单词列表</label>
    <textarea
      id="word-input"
      v-model="model"
      class="w-full p-4 border-[1.5px] border-sky-200 rounded-xl text-[15px] leading-relaxed
             text-slate-700 bg-white/60 resize-y min-h-[160px] md:min-h-[200px]
             transition-colors duration-200 outline-none
             focus:border-sky-400 focus:ring-2 focus:ring-sky-200/50
             placeholder:text-slate-400
             disabled:opacity-60 disabled:cursor-not-allowed"
      placeholder="输入单词,支持空格、逗号、换行分隔&#10;例如:apple banana orange"
      rows="6"
      :disabled="props.disabled"
    />
    <div class="mt-2 flex justify-end">
      <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full
                   bg-amber-100 text-amber-700 text-xs font-medium">
        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 2l2.9 7h7.1l-5.7 4.4 2.2 7.1L12 16l-6.5 4.5 2.2-7.1L2 9h7.1z" />
        </svg>
        <span>已输入 {{ wordCount }} 个</span>
      </span>
    </div>
  </div>
</template>
```

修改点：
- `label` 去掉了 `uppercase tracking-wider`，色改 `text-slate-500`。
- `textarea` 边框换 `border-sky-200 / focus:border-sky-400`，背景 `bg-white/60`，加 focus ring 和 placeholder 色。
- 单词数从右下小字改为右下 amber pill + ✨（星形 SVG，与 ProgressBadge 进行中态同款）。

- [ ] **Step 2: 目视验证**

在 `/dictation` 中确认：

- 输入框边框从灰色变成淡蓝。
- 点击输入框聚焦时，边框变深 sky-400 并出现一圈淡蓝光晕（ring）。
- 输入框背景半透明，能透出白色磨砂卡的层次。
- 右下角的「已输入 N 个」变成黄底圆 pill，左侧带星星图标。
- 清空输入框后 pill 显示「已输入 0 个」（不消失，符合预期）。

- [ ] **Step 3: 提交**

```bash
git add src/views/dictation/components/WordInput.vue
git commit -m "refactor(dictation): WordInput 换淡蓝聚焦色 单词数换星徽"
```

---

## Task 4: PlaybackSettings.vue 换装

**Files:**
- Modify: `src/views/dictation/components/PlaybackSettings.vue`

- [ ] **Step 1: 整体替换 `<template>` 区块**

把整个 `<template>` 替换为：

```vue
<template>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-sky-50/60 rounded-2xl">
    <div>
      <label for="repeat-count"
        class="block text-xs font-medium text-slate-500 mb-2"
      >重复次数</label>
      <div class="flex items-center gap-3">
        <input
          id="repeat-count"
          v-model.number="repeatCount"
          type="range" min="1" max="5" step="1"
          class="flex-1 accent-sky-500"
          :disabled="props.disabled"
        />
        <span class="text-sm font-medium text-slate-700 min-w-6 text-center">
          {{ repeatCount }}
        </span>
      </div>
    </div>
    <div>
      <label for="speech-rate"
        class="block text-xs font-medium text-slate-500 mb-2"
      >语速</label>
      <div class="flex items-center gap-3">
        <input
          id="speech-rate"
          v-model.number="speechRate"
          type="range" min="0.5" max="2" step="0.1"
          class="flex-1 accent-sky-500"
          :disabled="props.disabled"
        />
        <span class="text-sm font-medium text-slate-700 min-w-8 text-center">
          {{ speechRate }}
        </span>
      </div>
    </div>
  </div>
</template>
```

修改点：
- 容器 `bg-surface rounded-xl` → `bg-sky-50/60 rounded-2xl`。
- label `text-on-surface-variant` → `text-slate-500`。
- value 数字 `text-on-surface` → `text-slate-700`。
- slider `accent-primary` → `accent-sky-500`。

- [ ] **Step 2: 目视验证**

在 `/dictation` 中确认：

- 设置区背景从灰白变成淡蓝（与大卡对比柔和）。
- 滑块滑动时手柄/进度变成 sky-500 蓝色。
- 数值字色变成深灰 slate-700。

- [ ] **Step 3: 提交**

```bash
git add src/views/dictation/components/PlaybackSettings.vue
git commit -m "refactor(dictation): PlaybackSettings 子卡换淡蓝底 滑块换 sky 色"
```

---

## Task 5: WordConfirmModal 容器（overlay + 卡片 + drag handle + transition）

**Files:**
- Modify: `src/views/dictation/components/WordConfirmModal.vue`

- [ ] **Step 1: 替换 `<template>` 中 overlay 与卡片容器**

把 `<template>` 整体替换为以下内容（header / 列表 / footer 内部仍保留旧样式，Task 6/7 再换）：

```vue
<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="props.show" class="fixed inset-0 z-50 flex items-center justify-center md:p-4"
           @click="emit('cancel')">
        <!-- Overlay -->
        <div class="modal-overlay absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />

        <!-- Card / Bottom sheet -->
        <div class="modal-card relative w-full max-h-[85vh] md:max-w-[560px] md:rounded-3xl
                    max-md:fixed max-md:bottom-0 max-md:left-0 max-md:right-0
                    max-md:rounded-t-3xl
                    bg-white/90 backdrop-blur-md shadow-2xl shadow-sky-300/30
                    flex flex-col"
             @click.stop>

          <!-- Mobile drag handle -->
          <div class="flex justify-center pt-3 pb-0 md:hidden">
            <div class="w-10 h-1 rounded-full bg-gradient-to-r from-sky-300 to-emerald-300" />
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

注意：
- overlay class 改为 `bg-slate-900/40 backdrop-blur-sm`，新增 `modal-overlay` 钩子供 transition 使用。
- 卡片改为 `bg-white/90 backdrop-blur-md shadow-2xl shadow-sky-300/30`，桌面 `md:rounded-3xl`，移动 `rounded-t-3xl`，新增 `modal-card` 钩子。
- drag handle 宽 `w-10`，背景换成 `bg-gradient-to-r from-sky-300 to-emerald-300`。
- header / 列表 / footer 暂保持旧样式，Task 6/7 替换。

- [ ] **Step 2: 在 `<script setup>` 后追加 `<style scoped>` 区块**

在文件末尾（`</template>` 之后）追加：

```vue
<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 150ms ease-out;
}
.modal-enter-active .modal-card,
.modal-leave-active .modal-card {
  transition: opacity 150ms ease-out, transform 150ms ease-out;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.modal-enter-from .modal-card,
.modal-leave-to .modal-card {
  opacity: 0;
  transform: scale(0.95) translateY(8px);
}
</style>
```

- [ ] **Step 3: 目视验证**

在 `/dictation` 输入若干单词后点「加载单词」，确认：

- 弹框背后是柔和的深灰半透明 + 模糊背景，不再是纯黑遮罩。
- 弹框卡片是磨砂白底，圆角更大，阴影偏 sky 蓝调。
- 移动视口（DevTools 切换到 iPhone）能看到顶部的渐变小条 drag handle。
- 弹框打开/关闭有 150ms 的淡入 + 微缩放动画，不再硬切。
- 列表条目和 footer 仍是旧样式（这是预期）。

- [ ] **Step 4: 提交**

```bash
git add src/views/dictation/components/WordConfirmModal.vue
git commit -m "refactor(dictation): Modal 容器换磨砂卡 overlay 柔化加缩放过渡"
```

---

## Task 6: WordConfirmModal Header + 列表条目换装

**Files:**
- Modify: `src/views/dictation/components/WordConfirmModal.vue`

- [ ] **Step 1: 替换 Header 区块**

在 `<template>` 中找到 `<!-- Header -->` 注释下方的 div，整段替换为：

```vue
          <!-- Header -->
          <div class="flex items-center justify-between px-6 py-4 md:pt-5">
            <h2 class="flex items-center gap-2 text-lg md:text-xl font-semibold text-slate-700">
              <svg class="w-4 h-4 text-amber-500" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 2l2.9 7h7.1l-5.7 4.4 2.2 7.1L12 16l-6.5 4.5 2.2-7.1L2 9h7.1z" />
              </svg>
              <span>确认单词列表</span>
            </h2>
            <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full
                         bg-amber-100 text-amber-700 text-xs font-medium">
              <svg class="w-3 h-3" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1s-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
              </svg>
              <span>共 {{ props.words.length }} 个</span>
            </span>
          </div>
```

修改点：
- 标题左侧加 ✨（amber-500），字色 `text-slate-700`，字重 `font-semibold`。
- 「共 N 个」改成 amber pill，左侧带 📋 SVG。

- [ ] **Step 2: 替换列表条目**

把 `<!-- Word list -->` 注释下方的整个 div 替换为：

```vue
          <!-- Word list -->
          <div class="flex-1 overflow-y-auto px-6 pb-4">
            <div class="flex flex-col gap-2">
              <div v-for="(word, i) in props.words" :key="word.index"
                class="flex items-center gap-3 p-3.5 rounded-2xl
                       bg-sky-50/70 hover:bg-sky-100/80 border border-white/60
                       transition-colors">
                <span class="flex items-center justify-center w-6 h-6 rounded-full
                             bg-white text-sky-600 text-xs font-medium tabular-nums shrink-0">
                  {{ i + 1 }}
                </span>
                <div class="flex-1 min-w-0">
                  <div class="text-sm md:text-[15px] font-semibold text-slate-700">{{ word.text }}</div>
                  <input
                    :value="word.translation"
                    @change="emit('updateTranslation', word.index, ($event.target as HTMLInputElement).value)"
                    class="text-xs md:text-sm text-slate-500 bg-transparent border-b border-dashed
                           border-transparent focus:border-sky-400 outline-none w-full py-0.5
                           placeholder:text-slate-400"
                    placeholder="点击编辑翻译"
                  />
                </div>
                <button @click="emit('remove', word.index)"
                  class="w-8 h-8 rounded-full flex items-center justify-center text-rose-500
                         opacity-60 hover:opacity-100 hover:bg-rose-50 transition-all shrink-0">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
```

修改点：
- 条目背景 `bg-surface-container-high` → `bg-sky-50/70 hover:bg-sky-100/80 border border-white/60`，padding 从 `p-3` 升到 `p-3.5`，圆角到 `rounded-2xl`。
- 序号变成 `w-6 h-6 rounded-full bg-white text-sky-600` 小圆章。
- 单词文本字色 → `text-slate-700`，字重 → `semibold`。
- 翻译 input 聚焦色 `border-primary` → `border-sky-400`。
- 删除按钮 `text-red-700` → `text-rose-500`，`rounded-lg` → `rounded-full`，hover 背景换 `bg-rose-50`。

- [ ] **Step 3: 目视验证**

打开弹框确认：

- 标题左侧出现 amber 小星星，右上角的「共 N 个」变成黄色 pill 带表单图标。
- 列表条目变成淡蓝磨砂卡，每条左侧有白色圆形序号章。
- 鼠标悬停条目颜色加深一档，过渡平滑。
- 翻译输入框聚焦时下划线变 sky-400。
- 删除按钮变成圆形玫红色，悬停背景变浅粉。

- [ ] **Step 4: 提交**

```bash
git add src/views/dictation/components/WordConfirmModal.vue
git commit -m "refactor(dictation): Modal header 加星徽 列表条目换淡蓝磨砂卡"
```

---

## Task 7: WordConfirmModal Footer 按钮换装 + 空列表禁用

**Files:**
- Modify: `src/views/dictation/components/WordConfirmModal.vue`

- [ ] **Step 1: 替换 Footer 区块**

把 `<!-- Footer -->` 注释下方的整个 div 替换为：

```vue
          <!-- Footer -->
          <div class="px-6 py-4 flex gap-3
                      max-md:pb-[max(1rem,env(safe-area-inset-bottom))]">
            <button @click="emit('cancel')"
              class="max-md:flex-1 px-7 h-12 rounded-full text-sm font-medium
                     bg-white/80 backdrop-blur-sm shadow-md shadow-sky-200/40
                     text-slate-600 hover:bg-white active:scale-95
                     transition-all">
              返回修改
            </button>
            <button @click="emit('confirm')" :disabled="props.words.length === 0"
              class="max-md:flex-1 px-7 h-12 rounded-full text-sm font-medium
                     bg-gradient-to-br from-sky-400 to-emerald-400
                     shadow-lg shadow-sky-400/40 text-white
                     hover:scale-[1.02] active:scale-[0.98]
                     disabled:opacity-50 disabled:saturate-50
                     disabled:cursor-not-allowed disabled:hover:scale-100
                     transition-all">
              确认开始
            </button>
          </div>
```

修改点：
- 去掉 `border-t border-surface-container-high` 顶部分隔线（靠 padding 留白即可）。
- 「返回修改」改为 player 副键调性：`bg-white/80 backdrop-blur-sm shadow-md shadow-sky-200/40 text-slate-600 rounded-full h-12`。
- 「确认开始」改为 player 主键同款渐变胖按钮：`bg-gradient-to-br from-sky-400 to-emerald-400 shadow-lg shadow-sky-400/40 rounded-full h-12`。
- 主键加 `:disabled="props.words.length === 0"`，列表删空时禁用。

- [ ] **Step 2: 目视验证**

在弹框中确认：

- footer 顶部分隔线消失，两键之间靠间距分隔。
- 「返回修改」是白底磨砂圆胖按钮，悬停背景变纯白。
- 「确认开始」是 sky→emerald 渐变圆胖按钮，悬停微放大。
- 桌面与移动视口下两键尺寸一致（移动端撑满）。
- 删除列表中所有单词，「确认开始」变灰、不饱和、不可点击；保留至少一个单词时恢复活力。

- [ ] **Step 3: 提交**

```bash
git add src/views/dictation/components/WordConfirmModal.vue
git commit -m "refactor(dictation): Modal footer 改 player 主副键调性 空列表禁用确认"
```

---

## Task 8: 整体回归 + 静态检查

**Files:** 无修改，仅验证

- [ ] **Step 1: 跑 lint**

```bash
pnpm lint
```

期望：oxlint 与 eslint 均通过（仅样式 class 调整，不应触发新错误）。

- [ ] **Step 2: 跑类型检查**

```bash
pnpm type-check
```

期望：vue-tsc 通过。

- [ ] **Step 3: 完整流程目视回归**

在浏览器走一遍：

1. 打开 `/dictation`，输入若干单词，点「加载单词」打开 Modal，目视确认输入页 → 弹框 → 进入 player 三页之间视觉语言连贯（同一套渐变背景调性 + 同款按钮）。
2. 弹框中删几个单词、改几个翻译、删空看主键禁用、再返回修改、再加载——交互不卡顿。
3. DevTools 切换到 iPhone 视口，重复上述流程，确认 bottom sheet、drag handle、按钮 flex-1 都正常。
4. 点「确认开始」进入 `/dictation/player`，确认从 Modal 到 player 的过渡没有"换皮"突兀感。

- [ ] **Step 4: （无需提交，本 Task 只跑验证）**

如果上述任意一步失败，回到对应 Task 修复后重跑。
