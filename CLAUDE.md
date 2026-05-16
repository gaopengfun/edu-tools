# CLAUDE.md

本文件为 Claude Code (claude.ai/code) 在此代码库中工作时提供指导。

## 命令

包管理器：**pnpm**（锁文件为 `pnpm-lock.yaml`）。

- `pnpm dev` — 启动 Vite 开发服务器（已配置代理，开发环境下 OSS 检测功能需要）。
- `pnpm build` — 通过 `npm-run-all2` 并行运行 `type-check` 和 `build-only`。
- `pnpm type-check` — `vue-tsc --build`（支持项目引用，仅类型检查）。
- `pnpm build-only` — `vite build` 不进行类型检查。
- `pnpm preview` — 预览生产构建。
- `pnpm lint` — 先运行 **oxlint** 再运行 **eslint**（均带 `--fix`）。Lint 栈是两遍设置，不要跳过 oxlint。
- `pnpm format` — `oxfmt src/`。

本仓库未配置测试运行器。

## 架构

使用 **Vue 3 + `<script setup>` + TypeScript + Vite 8 + vue-router + pinia + tailwindcss** 。

## 约定

- TypeScript 严格模式；Vue SFC 使用 `<script setup lang="ts">`。应用 `eslint-plugin-vue` 的 Vue 特定 ESLint 规则。
- 提交消息遵循 Conventional Commits，**中文主题/正文**（参见用户的全局 `CLAUDE.md`）。

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
