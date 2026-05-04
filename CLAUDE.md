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

使用 **Vue 3 + `<script setup>` + TypeScript + Vite 8** 构建的 SPA，使用 Pinia 和 vue-router（hash 历史模式，`createWebHashHistory`）。路径别名 `@` → `src/`。构建 `base` 为 `./`（相对路径），因此输出可作为静态包从任意子路径部署。

应用是一组自包含的诊断/工具"视图"集合，挂载在 `src/views/<tool-name>/` 下。每个视图将其组件、`types.ts` 和包含工具核心逻辑的 `composables/` 文件夹放在一起，核心逻辑以组合式函数形式实现。路由器懒加载每个视图。要添加新工具，在 `src/views/` 下创建新文件夹遵循此布局，并在 `src/router/index.ts` 中注册路由。

### OSS 检测功能（`src/views/oss-check/`）

从浏览器对阿里云 OSS 运行 4 步顺序健康检查：公网可达性 → OSS 端点可达性 → 令牌获取 + PUT 端点探测 → 实际签名上传。必须保留的非显而易见的关键实现说明：

- **仅开发环境的 Vite 代理** `/api-dihw-smarthw` → 令牌服务（`zytestaliyun.ceshiservice.cn`）在 `vite.config.ts` 中。
- OSS 请求**直接**发往 `https://${bucket}.${endPoint}/...`；目标存储桶必须配置 CORS 以允许应用源（以及 `Authorization`、`x-oss-*` 头）。可达性探测使用 `mode: 'no-cors'`，因此 CORS 缺失不会错误地导致失败。
- **OSS V4 签名**在 `useOssCheck.ts` 中使用 `crypto.subtle` 手动实现。两个容易破坏的不变量：
  - `CanonicalURI` 必须包含存储桶前缀（`/<bucket>/<object>`），即使使用虚拟托管样式请求 — 这是 OSS↔AWS SigV4 的差异。
  - 最终签名是 `HEX(HMAC-SHA256(signingKey, stringToSign))` — **不要**再对其进行 SHA-256。
- `docs/api-getOSSToken.md` 记录了令牌端点响应结构；`src/views/oss-check/types.ts` 是 TS 类型的真实来源。

## 约定

- TypeScript 严格模式；Vue SFC 使用 `<script setup lang="ts">`。应用 `eslint-plugin-vue` 的 Vue 特定 ESLint 规则。
- 格式化工具是 **oxfmt**（不是 Prettier — `eslint-config-prettier` 仅用于禁用冲突的样式规则）。期望使用分号和尾随逗号（参见最近的提交）。
- 提交消息遵循 Conventional Commits，**中文主题/正文**（参见用户的全局 `CLAUDE.md`）。

## UI / UX（Material Design 3）

新增或修改 UI 时遵循 **Material Design 3**：语义化颜色角色（primary / surface / on-surface，状态层），清晰的类型比例，一致的形状和间距（8dp 节奏），MD3 风格的组件和表面，简短有目的的动效，以及可见的键盘焦点。在添加新样式之前重用现有的应用令牌和样式。
