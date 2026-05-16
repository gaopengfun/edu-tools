# 全站 UI 风格统一设计稿

- **日期**：2026-05-16
- **目标**：将首页（ToolList）的视觉语言对齐到 dictation 模块已收敛的"浅色磨砂"风格，沉淀可复用的全局 token 与轻量装饰 shell，给后续工具页打好地基。
- **范围**：ToolList 改造 + 全局 token 抽取 + 轻装饰 shell 组件 + CLAUDE.md UI 章节同步。**不动** dictation 现有组件的内部样式（已稳定，本次为加法）。

## 现状与问题

- ToolList（`src/views/tool-list/ToolList.vue`）用经典 MD3：白底卡 + `#1a73e8` 实色蓝 + `--md-*` CSS 变量。
- Dictation 全套（最近 10+ commit 已重塑）用糖果浅色风：`sky→emerald` 渐变背景、`bg-white/80 backdrop-blur` 磨砂卡、`sky-400→emerald-400` 渐变胖按钮、`rounded-2xl/3xl`。
- 用户从首页点入 dictation 时存在视觉断层。`CLAUDE.md` 仍写 "Material Design 3"，与实际代码偏离。

## 设计基线

**核心 token（在 `src/styles/main.css` 的 `@theme` 块新增；保留 MD3 token 作为语义化基础不删）：**

| token | 值 | 用途 |
|------|------|------|
| `--color-brand-from` | `oklch(0.79 0.13 230)` ≈ sky-400 | 品牌渐变起 |
| `--color-brand-to` | `oklch(0.80 0.13 165)` ≈ emerald-400 | 品牌渐变止 |
| `--color-bg-from` | `oklch(0.96 0.04 230)` ≈ sky-100 | 页面渐变起 |
| `--color-bg-via` | `oklch(0.98 0.02 230)` ≈ sky-50 | 中间过渡 |
| `--color-bg-to` | `oklch(0.96 0.04 165)` ≈ emerald-100 | 页面渐变止 |
| `--color-surface-frosted` | `rgb(255 255 255 / 0.8)` | 磨砂卡底 |
| `--color-surface-frosted-strong` | `rgb(255 255 255 / 0.92)` | 强调磨砂面 |
| `--shadow-frosted` | 多层柔影（sky tint） | 磨砂卡阴影 |

> 因为是 Tailwind v4，新加的 `--color-*` token 会自动产出 `bg-bg-from / bg-brand-from / from-brand-from` 等工具类，dictation 现有的 `from-sky-400` 写法继续工作不动。

**装饰强度分级（重要决策）：**
- **学习内容页**（dictation）：保留 `DecorativeBackground.vue`（云朵 + 闪星 SVG），原地不动。
- **索引/导航页**（ToolList，以及未来的工具索引）：使用新组件 `AppShellBackground.vue` —— 仅含 2 个柔光 blob 圆形（`blur-3xl`、`opacity-30`），无具象图形，避免索引页装饰喧宾夺主。

## 组件与文件改动

### 1. `src/styles/main.css`
- 在 `@theme {}` 中追加上述 token。
- 新增一个 `--shadow-frosted` token（多层柔影、带 sky 微染）。
- 保留原 `--color-primary / --md-*` 桥接，**不删** ——dictation 内部和首页里若仍引用不破。

### 2. 新增 `src/components/AppShellBackground.vue`
- 单一职责：渲染页面渐变底 + 2 个柔光 blob，`aria-hidden`，`pointer-events-none`。
- 接受可选 prop `variant?: 'default' | 'soft'` 给未来留扩展位（本次先只实现 `default`）。
- 不依赖业务 store，可全站复用。

### 3. `src/views/tool-list/ToolList.vue` 重写视觉
- 整页包一层 `min-h-dvh relative overflow-hidden` + `AppShellBackground`。
- header 标题字重收到 `font-semibold`、颜色 `slate-700`，副标题 `slate-500`，与 dictation 标题尺度一致。
- 卡片：`bg-white/80 backdrop-blur-sm`、`rounded-3xl`、`shadow-frosted`、ring 替换原 `border`；hover 时 `bg-white/92` + 阴影抬高 + 轻微 `scale-[1.01]`；focus 用 `ring-2 ring-sky-400`。
- 卡片箭头改为渐变小药丸（`bg-gradient-to-br from-brand-from to-brand-to`），是首页唯一保留的强调渐变面，引导点击。
- 删除 `.tool-card::before` 的全色覆盖 hover —— 与磨砂卡不兼容。
- 删除 ToolList 内部独立的 `--md-*` 变量声明（统一吃 main.css 全局桥接）。

### 4. `CLAUDE.md` UI 设计语言章节
更新为：
> 视觉基线：**浅色磨砂卡 + sky→emerald 品牌渐变**。沿用 MD3 的语义化颜色角色（primary / surface / on-surface、状态层）与类型比例、键盘焦点可见性，但表面材质走"磨砂玻璃"路线：页面背景 `--color-bg-from/via/to` 渐变 + `AppShellBackground` 柔光装饰，卡片用 `bg-white/80 backdrop-blur` + `--shadow-frosted`，强调按钮用 `--color-brand-from → --color-brand-to` 渐变。圆角节奏：小元素 `rounded-xl`，卡片 `rounded-2xl/3xl`，胖主按钮 `rounded-2xl + h-14`。装饰分级：学习内容页可放具象 SVG（云、星），索引/导航页只放柔光 blob。

## 数据流与状态

无新状态。`AppShellBackground` 是纯展示组件，`ToolList` 仍只消费 `tools` 列表。

## 错误与边界

- `prefers-reduced-motion`：blob 在 main.css 已有的 `@media (prefers-reduced-motion: reduce)` 块中追加暂停（或本来就静态）。本次设计里 blob 不带动效（避免和 dictation 云朵的 float 动效重复），所以不需要新增 reduce-motion 处理。
- 暗色模式：当前项目未做暗色，本次不引入；token 命名保持中性以便未来一次性补 `prefers-color-scheme: dark` 覆盖。

## 自测口径

1. `pnpm type-check` 必过。
2. `pnpm lint` 必过（oxlint + eslint）。
3. `pnpm dev` 起开发服 → Chrome DevTools MCP：
   - 加载 `/` 首页截图；
   - 点入 `/dictation`，观察过渡无视觉撕裂；
   - 主流断面：1024 桌面宽度 + 375 移动宽度（最小验收：布局不破，磨砂卡可见）。
   - 控制台无报错。

## 显式不做

- 不抽 `SharedFrostedCard` / `SharedGradientButton` 共享组件（暂未到三处复用阈值）。
- 不重构 dictation 内部 utility 写法去消费新 token（dictation 已稳定，本次为加法）。
- 不引入暗色模式。
- 不改 router、store、translate 任何业务逻辑。

## 验收信号

- 从首页跳 dictation 入口，视觉感觉是同一应用、同一语言。
- ToolList 卡片在 hover/focus/active 三态都有清晰反馈，键盘可达。
- `CLAUDE.md` UI 章节描述能匹配 ToolList 与 dictation 实际像素。
