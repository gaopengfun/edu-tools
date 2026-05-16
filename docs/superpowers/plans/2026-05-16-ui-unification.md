# 全站 UI 风格统一 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让 ToolList 首页与 dictation 模块共享同一套"浅色磨砂"视觉语言，沉淀全局 token 与轻装饰 shell 组件，并同步 CLAUDE.md UI 章节。

**Architecture:** 在 Tailwind v4 的 `@theme` 块新增品牌渐变、页面渐变、磨砂表面、磨砂阴影 token；新增 `src/components/AppShellBackground.vue` 作为索引页共享装饰 shell；ToolList 重写视觉层去消费它们；CLAUDE.md UI 章节描述更新。dictation 现有组件不动（加法，不动存量）。

**Tech Stack:** Vue 3 `<script setup>` + TypeScript + Tailwind v4 + vite。无单测运行器，验证靠 `pnpm type-check` + `pnpm lint` + Chrome DevTools MCP 浏览器走查。

参考 spec：`docs/superpowers/specs/2026-05-16-ui-unification-design.md`。

---

## File Structure

| 路径 | 行为 | 责任 |
|------|------|------|
| `src/styles/main.css` | 修改 | 在 `@theme` 中追加 brand 渐变、页面渐变、磨砂表面、磨砂阴影 token；保留全部既有 token 与桥接 |
| `src/components/AppShellBackground.vue` | 新建 | 渲染页面渐变底 + 2 个柔光 blob，`aria-hidden`、`pointer-events-none`，无 prop（暂） |
| `src/views/tool-list/ToolList.vue` | 重写 | 套上 `AppShellBackground`、磨砂卡、渐变药丸箭头、新焦点环；删除内部 `--md-*` 局部声明 |
| `CLAUDE.md` | 修改 | UI 设计语言章节改写为"浅色磨砂卡 + sky→emerald 渐变"基线 |

---

## Task 1: 扩展全局 token

**Files:**
- Modify: `src/styles/main.css`

- [ ] **Step 1: 阅读现状**

读 `src/styles/main.css` 全文，确认 `@theme` 块结构和位置（应在 `@import "tailwindcss";` 之后）。

- [ ] **Step 2: 在 `@theme` 块末尾追加新 token**

在 `@theme { ... }` 块内已有 `--color-outline-variant` 之后、闭合 `}` 之前追加：

```css
  /* Brand gradient (sky-400 → emerald-400) */
  --color-brand-from: oklch(0.79 0.13 230);
  --color-brand-to: oklch(0.80 0.13 165);

  /* Page background gradient (sky-100 → sky-50 → emerald-100) */
  --color-bg-from: oklch(0.96 0.04 230);
  --color-bg-via: oklch(0.98 0.02 230);
  --color-bg-to: oklch(0.96 0.04 165);

  /* Frosted surface */
  --color-surface-frosted: rgb(255 255 255 / 0.8);
  --color-surface-frosted-strong: rgb(255 255 255 / 0.92);

  /* Frosted shadow (multi-layer, sky-tinted) */
  --shadow-frosted:
    0 10px 30px -10px oklch(0.79 0.13 230 / 0.25),
    0 4px 12px -4px oklch(0.79 0.13 230 / 0.15);
```

- [ ] **Step 3: 不动既有桥接段**

确认 `:root { --md-* : var(--color-*); }` 桥接段、keyframe 与 `prefers-reduced-motion` 段未被改动。

- [ ] **Step 4: 类型检查 + lint**

```bash
pnpm type-check
pnpm lint
```

期望：两者都过；no errors。

- [ ] **Step 5: 提交**

```bash
git add src/styles/main.css
git commit -m "feat(theme): 新增品牌渐变 / 页面渐变 / 磨砂表面 / 磨砂阴影 token"
```

---

## Task 2: 新增 AppShellBackground 组件

**Files:**
- Create: `src/components/AppShellBackground.vue`

- [ ] **Step 1: 创建文件**

写入以下完整内容：

```vue
<!-- 索引/导航页通用渐变 + 柔光装饰背景，无具象图形 -->
<script setup lang="ts"></script>

<template>
  <div
    class="absolute inset-0 pointer-events-none overflow-hidden"
    aria-hidden="true"
  >
    <!-- 页面整体浅色渐变底 -->
    <div
      class="absolute inset-0
             bg-gradient-to-b from-bg-from via-bg-via to-bg-to"
    />

    <!-- 柔光 blob 1 - 左上 -->
    <div
      class="absolute -top-24 -left-16 w-[28rem] h-[28rem]
             rounded-full blur-3xl opacity-30
             bg-gradient-to-br from-brand-from to-brand-to"
    />

    <!-- 柔光 blob 2 - 右下 -->
    <div
      class="absolute -bottom-32 -right-20 w-[32rem] h-[32rem]
             rounded-full blur-3xl opacity-25
             bg-gradient-to-tr from-brand-to to-brand-from"
    />
  </div>
</template>
```

- [ ] **Step 2: 验证 Tailwind 类生效**

确认新追加的工具类（`from-bg-from`、`to-bg-to`、`from-brand-from`、`to-brand-to`）会由 Tailwind v4 从 `@theme` 自动产出。如果在 dev 模式下不生效，原因通常是 token 名错——回 Task 1 对照检查。

- [ ] **Step 3: 类型检查 + lint**

```bash
pnpm type-check
pnpm lint
```

期望：通过。

- [ ] **Step 4: 提交**

```bash
git add src/components/AppShellBackground.vue
git commit -m "feat(ui): 新增 AppShellBackground 索引页通用装饰背景"
```

---

## Task 3: 重写 ToolList 视觉层

**Files:**
- Modify: `src/views/tool-list/ToolList.vue`

- [ ] **Step 1: 读现状**

读 `src/views/tool-list/ToolList.vue` 当前内容确认结构（`script setup`、`tool-list-page`、`tool-grid`、`tool-card`、`card-arrow`）。

- [ ] **Step 2: 整体重写**

用以下内容覆盖整个 `src/views/tool-list/ToolList.vue`：

```vue
<script setup lang="ts">
import { RouterLink } from 'vue-router';
import AppShellBackground from '@/components/AppShellBackground.vue';
import { tools } from './tools';
</script>

<template>
  <div class="min-h-dvh relative overflow-hidden">
    <AppShellBackground />

    <div class="relative z-10 max-w-3xl mx-auto px-4 py-8 md:py-10">
      <header class="mb-8">
        <h1 class="text-2xl md:text-[28px] font-semibold text-slate-700 leading-tight">
          x-tools
        </h1>
        <p class="text-sm text-slate-500 mt-1">
          一组自用的小工具集合，点击卡片进入对应工具
        </p>
      </header>

      <div class="grid gap-4 sm:grid-cols-2">
        <RouterLink
          v-for="tool in tools"
          :key="tool.name"
          :to="tool.path"
          class="tool-card group relative flex items-center gap-3
                 px-5 py-5 rounded-3xl
                 bg-white/80 backdrop-blur-sm
                 ring-1 ring-white/60
                 shadow-frosted
                 text-slate-700 no-underline
                 transition-all duration-200
                 hover:bg-white/92 hover:-translate-y-0.5
                 active:scale-[0.99]
                 focus-visible:outline-none
                 focus-visible:ring-2 focus-visible:ring-sky-400"
        >
          <div class="flex-1 min-w-0">
            <h2 class="text-base font-medium text-slate-800 leading-6">
              {{ tool.title }}
            </h2>
            <p class="text-sm text-slate-500 leading-5 mt-1">
              {{ tool.description }}
            </p>
          </div>

          <span
            class="shrink-0 w-10 h-10 rounded-full
                   flex items-center justify-center
                   bg-gradient-to-br from-brand-from to-brand-to
                   text-white shadow shadow-sky-400/40
                   transition-transform duration-200
                   group-hover:translate-x-0.5"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M8.59 16.59 13.17 12 8.59 7.41 10 6l6 6-6 6z"
                fill="currentColor"
              />
            </svg>
          </span>
        </RouterLink>
      </div>
    </div>
  </div>
</template>
```

要点：
- 删除整个 `<style scoped>` 块和内部 `--md-*` 变量，全走 Tailwind v4 工具类。
- header 风格与 dictation 标题对齐（`text-slate-700`、`font-semibold`）。
- 卡片采用磨砂表面 + 渐变药丸箭头；箭头是首页里唯一的"渐变面"，引导点击。
- 焦点环用 `ring-sky-400` 与全局基线一致。

- [ ] **Step 3: 类型检查 + lint**

```bash
pnpm type-check
pnpm lint
```

期望：通过。

- [ ] **Step 4: 提交**

```bash
git add src/views/tool-list/ToolList.vue
git commit -m "refactor(tool-list): 首页换浅色磨砂卡与渐变箭头与 dictation 对齐"
```

---

## Task 4: 同步 CLAUDE.md UI 章节

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: 读现状**

读 `CLAUDE.md` 找到 "## UI 设计语言" 章节（当前内容是 MD3 描述）。

- [ ] **Step 2: 改写章节**

把整段 "## UI 设计语言" 替换为：

```markdown
## UI 设计语言

视觉基线：**浅色磨砂卡 + sky→emerald 品牌渐变**。沿用 Material Design 3 的语义化颜色角色（primary / surface / on-surface、状态层）、清晰类型比例与可见的键盘焦点，但表面材质走"磨砂玻璃"路线。

**核心 token（见 `src/styles/main.css` 的 `@theme` 块）**

- 页面渐变：`--color-bg-from` / `--color-bg-via` / `--color-bg-to`
- 品牌渐变：`--color-brand-from` → `--color-brand-to`（sky-400 → emerald-400）
- 磨砂表面：`--color-surface-frosted`（`bg-white/80 backdrop-blur-sm`）/ `--color-surface-frosted-strong`
- 磨砂阴影：`--shadow-frosted`（多层柔影、sky 微染）

**形状与间距**

- 圆角节奏：小元素 `rounded-xl`，卡片 `rounded-2xl/3xl`，胖主按钮 `rounded-2xl + h-14`。
- 间距遵循 8dp 节奏（Tailwind 默认 4/8/12/16/20/24...）。

**装饰分级**

- 索引/导航页（如 ToolList）：使用共享组件 `AppShellBackground`（仅 2 个柔光 blob，无具象图形）。
- 学习内容页（如 dictation）：可在 `AppShellBackground` 之上叠加自己的具象装饰（云、星等）。

**动效**

- 主要状态过渡 150–250ms；保留 `prefers-reduced-motion` 关停。

**复用守则**

- 添加新样式前优先复用上述 token 与 Tailwind 工具类；只有在出现 3+ 处重复时再抽组件。
```

- [ ] **Step 3: 提交**

```bash
git add CLAUDE.md
git commit -m "docs: 更新 UI 设计语言章节为浅色磨砂卡基线"
```

---

## Task 5: 自测验证（type-check + lint + 浏览器）

**Files:** 无

- [ ] **Step 1: 静态检查**

```bash
pnpm type-check
pnpm lint
```

期望：两者都过；no errors / no warnings 阻塞。

- [ ] **Step 2: 起 dev 服务**

```bash
pnpm dev
```

后台运行，等待 vite "ready in" 输出。

- [ ] **Step 3: Chrome DevTools MCP 走查（桌面宽度）**

调用 MCP：
- `new_page` 打开 `http://localhost:5173/`
- `resize_page` 至 1280 × 800
- `take_screenshot` 保存到本会话上下文供对比
- `list_console_messages` 确认无 `error` 级别消息
- `click` ToolList 上"单词听写"卡片 → 落到 `/dictation`
- `take_screenshot` 看两页过渡是否同语言
- `click` 返回箭头回首页（或 `navigate_page` 回 `/`）

期望：
- 首页磨砂卡、渐变箭头、柔光 blob 都正常渲染
- hover 时卡片轻微浮起、阴影增强
- focus（Tab 键）出现可见 sky 焦点环
- 跳到 dictation 后无视觉撕裂感（同样的浅色渐变 + 磨砂表面）

- [ ] **Step 4: 移动宽度断面**

- `resize_page` 至 375 × 812
- `take_screenshot`
- 期望：卡片单列、文字不溢出、磨砂卡和渐变箭头依然清晰可辨

- [ ] **Step 5: 关 dev 服务**

如果起在前台用 Ctrl+C；若用 `run_in_background` 启动则用对应 PID 关闭。

- [ ] **Step 6: 如发现回归，按问题增量修复并复跑 Step 3-5；通过后不需额外提交（验证步骤本身不产生代码改动）**

---

## Self-Review

- ✅ Spec 覆盖：token 抽取（Task 1）/ shell 组件（Task 2）/ ToolList 改造（Task 3）/ CLAUDE.md 同步（Task 4）/ 自测（Task 5），每条都映射到任务。
- ✅ Placeholder：无 TBD/TODO/"补 xxx 即可"等占位。
- ✅ 类型一致：token 命名在 Task 1 定义、Task 2/3 消费，名称完全一致；组件名 `AppShellBackground` 在 Task 2 创建、Task 3 import。
- ✅ DRY/YAGNI：不抽 prop（暂只一种用法），不抽共享卡片组件（未到三处复用阈值），保留 MD3 token 桥接（避免一次性修动 dictation）。
- ✅ TDD 调整：本仓库无测试运行器，把"测试"节点替换为 type-check + lint + 浏览器走查，仍保留"失败 → 修复 → 再跑"的反馈环。
