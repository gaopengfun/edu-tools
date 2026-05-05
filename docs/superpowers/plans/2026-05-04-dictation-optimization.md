# 单词听写工具优化实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 优化单词听写工具，实现两步流程（输入配置 → 全屏播报），增加单词翻译、确认弹框和三单词预览功能

**Architecture:** 使用 pinia store 管理状态，通过 vue-router 在输入页和播报页间导航。输入页集成有道翻译 API 批量获取翻译，播报页实时获取单词翻译并全屏展示。

**Tech Stack:** Vue 3 Composition API, TypeScript, Pinia, Vue Router, Vite 8, Web Speech API, 有道智云翻译 API

---

## 文件结构

### 新建文件
- `src/stores/dictation.ts` - Pinia store，管理单词数据和播放状态
- `src/views/dictation/DictationPlayer.vue` - 全屏播报页组件
- `src/views/dictation/components/WordConfirmModal.vue` - 单词确认弹框组件
- `src/utils/translate.ts` - 翻译 API 工具函数

### 修改文件
- `src/views/dictation/Dictation.vue` - 改造输入配置页
- `src/router/index.ts` - 添加播报页路由
- `vite.config.ts` - 配置翻译 API 代理
- `.env.local` - 添加翻译 API 密钥（需手动创建）

---

## Task 1: 创建 Pinia Store

**Files:**
- Create: `src/stores/dictation.ts`

- [ ] **Step 1: 编写 store 类型定义和初始状态**

```typescript
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

  return {
    words,
    repeatCount,
    speechRate,
    currentIndex,
    isPlaying,
    isPaused
  };
});
```

- [ ] **Step 2: 添加 setWords action**

```typescript
function setWords(newWords: WordItem[]) {
  words.value = newWords;
  currentIndex.value = -1;
  isPlaying.value = false;
  isPaused.value = false;
}
```

在 return 中添加 `setWords`

- [ ] **Step 3: 添加 setConfig action**

```typescript
function setConfig(repeat: number, rate: number) {
  repeatCount.value = repeat;
  speechRate.value = rate;
}
```

在 return 中添加 `setConfig`

- [ ] **Step 4: 添加播放状态控制 actions**

```typescript
function setPlayState(playing: boolean, paused: boolean, index: number) {
  isPlaying.value = playing;
  isPaused.value = paused;
  currentIndex.value = index;
}

function updateWordTranslation(index: number, translation: string) {
  if (index >= 0 && index < words.value.length) {
    words.value[index].translation = translation;
  }
}

function resetPlayState() {
  currentIndex.value = -1;
  isPlaying.value = false;
  isPaused.value = false;
}
```

在 return 中添加这三个函数

- [ ] **Step 5: 验证 store 导出完整**

确保 return 语句包含所有状态和 actions：

```typescript
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
  resetPlayState
};
```

- [ ] **Step 6: 提交**

```bash
git add src/stores/dictation.ts
git commit -m "feat(dictation): 创建 pinia store 管理单词和播放状态"
```

---

## Task 2: 创建翻译 API 工具函数

**Files:**
- Create: `src/utils/translate.ts`

- [ ] **Step 1: 安装依赖**

```bash
pnpm add crypto-js
pnpm add -D @types/crypto-js
```

- [ ] **Step 2: 编写 MD5 签名函数**

```typescript
import CryptoJS from 'crypto-js';

function generateSign(appKey: string, query: string, salt: string, appSecret: string): string {
  const str = appKey + query + salt + appSecret;
  return CryptoJS.MD5(str).toString();
}
```

- [ ] **Step 3: 编写单个单词翻译函数**

```typescript
export async function translateWord(word: string): Promise<string> {
  const appKey = import.meta.env.VITE_YOUDAO_APP_KEY;
  const appSecret = import.meta.env.VITE_YOUDAO_APP_SECRET;

  if (!appKey || !appSecret) {
    return '';
  }

  const salt = Date.now().toString();
  const sign = generateSign(appKey, word, salt, appSecret);

  try {
    const response = await fetch('/api/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        q: word,
        from: 'en',
        to: 'zh-CHS',
        appKey,
        salt,
        sign
      }),
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      return '';
    }

    const data = await response.json();
    if (data.errorCode === '0' && data.translation && data.translation.length > 0) {
      return data.translation[0];
    }
    return '';
  } catch {
    return '';
  }
}
```

- [ ] **Step 4: 编写批量翻译函数**

```typescript
function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

export async function batchTranslate(words: string[]): Promise<string[]> {
  const chunks = chunkArray(words, 50);
  const results: string[] = [];

  for (const chunk of chunks) {
    const chunkResults = await Promise.all(
      chunk.map(word => translateWord(word))
    );
    results.push(...chunkResults);
  }

  return results;
}
```

- [ ] **Step 5: 提交**

```bash
git add src/utils/translate.ts package.json pnpm-lock.yaml
git commit -m "feat(dictation): 添加有道翻译 API 工具函数"
```

---

## Task 3: 配置 Vite 代理和环境变量

**Files:**
- Modify: `vite.config.ts`
- Create: `.env.local` (手动创建，不提交)

- [ ] **Step 1: 读取现有 vite.config.ts**

```bash
cat vite.config.ts
```

- [ ] **Step 2: 添加代理配置**

在 `defineConfig` 的 `server` 配置中添加：

```typescript
server: {
  proxy: {
    '/api/translate': {
      target: 'https://openapi.youdao.com',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api\/translate/, '/api')
    }
  }
}
```

- [ ] **Step 3: 创建 .env.local 文件**

```bash
cat > .env.local << 'EOF'
VITE_YOUDAO_APP_KEY=your_app_key_here
VITE_YOUDAO_APP_SECRET=your_app_secret_here
EOF
```

- [ ] **Step 4: 确保 .gitignore 包含 .env.local**

```bash
grep -q "\.env\.local" .gitignore || echo ".env.local" >> .gitignore
```

- [ ] **Step 5: 提交**

```bash
git add vite.config.ts .gitignore
git commit -m "feat(dictation): 配置翻译 API 代理和环境变量"
```

---

## Task 4: 创建单词确认弹框组件

**Files:**
- Create: `src/views/dictation/components/WordConfirmModal.vue`

- [ ] **Step 1: 创建组件目录**

```bash
mkdir -p src/views/dictation/components
```

- [ ] **Step 2: 编写组件 script 部分**

```vue
<script setup lang="ts">
import type { WordItem } from '@/stores/dictation';

interface Props {
  words: WordItem[];
  show: boolean;
}

interface Emits {
  (e: 'confirm'): void;
  (e: 'cancel'): void;
}

defineProps<Props>();
const emit = defineEmits<Emits>();

function handleConfirm() {
  emit('confirm');
}

function handleCancel() {
  emit('cancel');
}
</script>
```

- [ ] **Step 3: 编写组件 template 部分（前25行）**

```vue
<template>
  <div v-if="show" class="modal-overlay" @click="handleCancel">
    <div class="modal-container" @click.stop>
      <div class="modal-header">
        <h2 class="modal-title">确认单词列表</h2>
      </div>

      <div class="modal-body">
        <div class="word-list">
          <div
            v-for="word in words"
            :key="word.index"
            class="word-item"
          >
            <span class="word-text">{{ word.text }}</span>
            <span v-if="word.translation" class="word-translation">
              {{ word.translation }}
            </span>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button @click="handleCancel" class="btn btn-secondary">
          返回修改
```

- [ ] **Step 4: 编写组件 template 部分（后续）**

```vue
        </button>
        <button @click="handleConfirm" class="btn btn-primary">
          确认开始
        </button>
      </div>
    </div>
  </div>
</template>
```

- [ ] **Step 5: 编写组件样式（前30行）**

```vue
<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-container {
  background: var(--md-surface-container, #ffffff);
  border-radius: 16px;
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
}

.modal-header {
  padding: 20px 24px;
  border-bottom: 1px solid var(--md-outline-variant, #c4c6d0);
}

.modal-title {
  font-size: 20px;
  font-weight: 500;
  margin: 0;
```

- [ ] **Step 6: 编写组件样式（后续）**

```vue
  color: var(--md-on-surface, #1a1c20);
}

.modal-body {
  padding: 16px 24px;
  overflow-y: auto;
  flex: 1;
}

.word-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.word-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px;
  background: var(--md-surface-container-high, #e8eaf6);
  border-radius: 8px;
}

.word-text {
  font-size: 16px;
  font-weight: 500;
  color: var(--md-on-surface, #1a1c20);
}

.word-translation {
  font-size: 14px;
  color: var(--md-on-surface-variant, #44474e);
}

.modal-footer {
  padding: 16px 24px;
  border-top: 1px solid var(--md-outline-variant, #c4c6d0);
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.btn {
  padding: 10px 24px;
  border: none;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary {
  background: transparent;
  color: var(--md-primary, #1a73e8);
}

.btn-secondary:hover {
  background: rgba(26, 115, 232, 0.08);
}

.btn-primary {
  background: var(--md-primary, #1a73e8);
  color: var(--md-on-primary, #ffffff);
}

.btn-primary:hover {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}
</style>
```

- [ ] **Step 7: 提交**

```bash
git add src/views/dictation/components/WordConfirmModal.vue
git commit -m "feat(dictation): 创建单词确认弹框组件"
```

---
