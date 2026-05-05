# 单词听写播报页视觉重设计

**日期**：2026-05-05
**范围**：仅 `/dictation/player` 页（`src/views/dictation/DictationPlayer.vue` 及其子组件）
**目标用户**：9–12 岁中段小学生
**问题陈述**：当前播报页使用 `#0a0a0a` 全黑背景 + 半透明白色元素，与项目其余浅色 MD3 风格脱节，对儿童学习场景显得压抑。

## 设计目标

1. 去除全黑背景，整体明亮、清爽、专注
2. 风格"轻松活泼、适当幼龄化"，但不要过度卡通（贴合 9–12 岁审美）
3. 强化"正在播报"的视觉反馈
4. 保留现有控件语义和功能；仅做视觉重设计 + 极少结构调整

## 视觉系统

### 配色

| 用途 | 颜色 |
|---|---|
| 背景顶部 | `#E0F2FE` (sky-100) |
| 背景中部 | `#F0F9FF` (sky-50) |
| 背景底部 | `#D1FAE5` (emerald-100) |
| 强调渐变 | `from-sky-400 (#38BDF8) to-emerald-400 (#34D399)` |
| 主文字 | `#0F172A` (slate-900) |
| 次文字 | `#475569` (slate-600) |
| 激励黄 | `#F59E0B` (amber-500) on `bg-amber-100` |

整页背景采用 `bg-gradient-to-b from-sky-100 via-sky-50 to-emerald-100`。

### 字体与节奏

- 单词主体：`font-semibold tracking-wide`，移动端 `text-[56px]`，桌面 `text-[88px]`
- 译文：`text-base md:text-lg`，包裹在白色半透明圆角 chip 内
- 维持现有 8dp 间距节奏

## 组件改动清单

### 1. `DictationPlayer.vue`（重写模板）

**改动**：
- 根容器换为 `min-h-dvh relative overflow-hidden bg-gradient-to-b from-sky-100 via-sky-50 to-emerald-100`
- 新增 `<DecorativeBackground>` 装饰层（z-0）
- 主内容包一层 `relative z-10`
- 顶部栏右侧由"`X / Y`"文字改为新组件 `<ProgressBadge>`

### 2. 新增 `components/DecorativeBackground.vue`

**职责**：背景装饰云朵 + 星点。

**实现**：
- 根 `<div absolute inset-0 pointer-events-none aria-hidden="true">`
- 内联 2 个云朵 SVG（白色填充，不透明度 30%），分别绝对定位在左上 / 中右
- 内联 3 个小星 / 气泡 SVG（白色填充，不透明度 12–18%），散落
- 云朵带 `animate-float-slow` 动画（自定义 keyframes，translateX 周期 18s，幅度 ±20px）
- `@media (prefers-reduced-motion: reduce)` 关闭动画

**自定义动画**：在 `src/styles/main.css` 中追加：
```css
@keyframes float-slow {
  0%, 100% { transform: translateX(0); }
  50% { transform: translateX(20px); }
}
.animate-float-slow {
  animation: float-slow 18s ease-in-out infinite;
}
@media (prefers-reduced-motion: reduce) {
  .animate-float-slow { animation: none; }
}
```

### 3. `components/WordDisplay.vue`（重写）

**Props**：保持现有 `word?: string; translation?: string`，新增 `isPlaying?: boolean`。

**布局**：`flex-1 flex flex-col items-center justify-center relative px-4`

**层叠结构**（从下到上）：
1. **径向光晕底层**：`absolute inset-0 flex items-center justify-center`，内嵌 600×600 div：`bg-[radial-gradient(closest-side,rgba(125,211,252,0.35),transparent)]`
2. **脉动圈层**（仅 `isPlaying` 时挂载，2 个）：每个 `w-60 h-60 rounded-full bg-sky-300/25 absolute animate-pulse-ring`，第二个加 `animation-delay: 2s`
3. **单词层**（`relative z-10`）：`<div class="text-[56px] md:text-[88px] font-semibold tracking-wide text-slate-900 text-center">{{ word }}</div>`
4. **译文 chip**：`<div class="mt-4"><span class="inline-block px-5 py-1.5 rounded-full bg-white/70 backdrop-blur-sm shadow-sm shadow-sky-200/50 text-slate-600 text-base md:text-lg">{{ translation }}</span></div>`

**自定义动画**（追加到 `main.css`）：
```css
@keyframes pulse-ring {
  0% { transform: scale(1); opacity: 0.25; }
  100% { transform: scale(2); opacity: 0; }
}
.animate-pulse-ring {
  animation: pulse-ring 4s ease-out infinite;
}
@media (prefers-reduced-motion: reduce) {
  .animate-pulse-ring { animation: none; opacity: 0; }
}
```

**Props 来源**：`DictationPlayer.vue` 把 `store.isPlaying && !store.isPaused` 传入。

### 4. `components/ProgressBar.vue`（重写）

**Props**：保持 `progress: number`。

**结构**：
```html
<div class="px-6 py-2">
  <div class="relative h-2 rounded-full bg-white/60 overflow-visible">
    <div class="h-full rounded-full bg-gradient-to-r from-sky-400 to-emerald-400
                transition-[width] duration-300 ease-out"
         :style="{ width: `${progress}%` }" />
    <div class="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5
                rounded-full bg-white shadow-md shadow-sky-300/60
                transition-[left] duration-300 ease-out"
         :style="{ left: `${progress}%` }" />
  </div>
</div>
```

注意：进度条容器从 `overflow-hidden` 改为 `overflow-visible`，以便小圆点露出。

### 5. `components/PlayerControls.vue`（重写）

**布局**：`flex items-center justify-center gap-7 px-4 py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]`

**前/后键（56×56）**：
```html
<button class="w-14 h-14 rounded-full flex items-center justify-center
               bg-white/80 backdrop-blur-sm shadow-md shadow-sky-200/40
               text-slate-600 transition-transform
               hover:bg-white active:scale-95
               disabled:opacity-40 disabled:cursor-not-allowed">
  <!-- 22px svg -->
</button>
```

**主播放/暂停键（80×80）**：
```html
<button class="w-20 h-20 rounded-full flex items-center justify-center
               bg-gradient-to-br from-sky-400 to-emerald-400
               shadow-lg shadow-sky-400/40
               text-white transition-transform
               hover:scale-105 active:scale-95">
  <!-- 32px svg -->
</button>
```

`aria-label` 分别为"上一个"、"播放" / "暂停" / "继续"、"下一个"。

### 6. 新增 `components/ProgressBadge.vue`

**Props**：`current: number; total: number`。

**派生**：`percent = total > 0 ? Math.round((current / total) * 100) : 0; done = current >= total && total > 0`

**结构**：
```html
<div class="flex flex-col items-end gap-1">
  <div class="text-xl font-semibold text-slate-700 tabular-nums">
    {{ current }} / {{ total }}
  </div>
  <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium"
        :class="done ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'">
    <!-- 完成时显示奖杯 svg, 否则显示星星 svg, 14×14 -->
    {{ done ? '全部完成' : `已完成 ${percent}%` }}
  </span>
</div>
```

星星 SVG 用 `currentColor`，确保配色一致；不使用 emoji，避免跨平台字形不一致。

### 7. 顶部返回按钮（在 `DictationPlayer.vue` 内更新）

```html
<button class="w-11 h-11 rounded-full flex items-center justify-center
               bg-white/80 backdrop-blur-sm shadow-md shadow-sky-200/40
               text-slate-600 transition-all
               hover:bg-white active:scale-95"
        aria-label="返回">
  <!-- 20px arrow svg -->
</button>
```

## 无障碍

- 装饰层 `aria-hidden="true"`
- 控件按钮全部带 `aria-label`
- `prefers-reduced-motion`：禁用云朵漂浮 + 光晕脉动，只保留静态光斑和过渡效果
- 文本对比度：主文字 `#0F172A` 对浅蓝背景 ≥ 14:1；次文字 `#475569` 对白色 chip ≥ 7:1

## 不做的事（YAGNI）

- 不引入吉祥物 / 角色插画
- 不添加完成里程碑庆祝动画（仅在 100% 时换 chip 颜色和文字）
- 不引入新字体文件
- 不修改 `useSpeechPlayer` 或 store —— 纯视觉重写
- 不动 `/dictation` 输入页

## 测试要点

- 浏览器实机走一遍：空状态（无单词跳回）、播放中、暂停、上一个/下一个、最末完成
- 检查移动端宽度（375px）和桌面宽度（≥1024px）的字号 / 间距
- 切换系统"减少动效"偏好后云朵和光晕静止
- 启停光晕：暂停时光晕静止，停止时淡出
