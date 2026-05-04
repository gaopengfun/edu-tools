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

遵循 **Material Design 3**：语义化颜色角色（primary / surface / on-surface，状态层），清晰的类型比例，一致的形状和间距（8dp 节奏），MD3 风格的组件和表面，简短有目的的动效，以及可见的键盘焦点。在添加新样式之前重用现有的应用令牌和样式。
