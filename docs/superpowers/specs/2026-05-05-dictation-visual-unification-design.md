# 单词听写「输入页 + 确认弹框」视觉统一设计

**Date:** 2026-05-05
**Status:** Draft — pending user review
**Scope:** `src/views/dictation/Dictation.vue`、`src/views/dictation/components/WordConfirmModal.vue`、`src/views/dictation/components/WordInput.vue`、`src/views/dictation/components/PlaybackSettings.vue`

---

## 目标

把 `/dictation` 输入页和 `WordConfirmModal` 单词确认弹框，从原本的 Material Design 3 token（`bg-surface-container` + `bg-primary` 实色）切换到 `/dictation/player` 已经定型的视觉语言：浅色 sky→emerald 渐变背景、白色磨砂卡、sky-emerald 渐变胖按钮、星星/奖杯徽章、云朵装饰层。让"输入 → 确认 → 播报"全流程的视觉一致。

非目标：

- 不动 `useSpeechPlayer.ts`、`stores/dictation.ts` 等逻辑层。
- 不改 `WordInput`、`PlaybackSettings` 的对外 props/model 接口（仅改样式）。
- 不引入新的依赖（继续用 Tailwind utility + 现有 SVG 图标）。
- 不做 dark mode 适配（player 当前也未做，保持一致）。

---

## 视觉风格基线（来自 `DictationPlayer.vue`）

下列 token 为后续两个页面复用的"参考字典"：

| 用途 | Tailwind class |
|---|---|
| 页面背景 | `bg-gradient-to-b from-sky-100 via-sky-50 to-emerald-100` |
| 装饰层 | 复用 `<DecorativeBackground />`（pointer-events-none，云 + 星 SVG） |
| 主键（渐变胖按钮） | `bg-gradient-to-br from-sky-400 to-emerald-400 shadow-lg shadow-sky-400/40 text-white rounded-full hover:scale-[1.02] active:scale-[0.98]` |
| 副键（白底磨砂胖按钮） | `bg-white/80 backdrop-blur-sm shadow-md shadow-sky-200/40 text-slate-600 rounded-full hover:bg-white active:scale-95` |
| 文本主色 | `text-slate-700`（标题）/ `text-slate-500`（次要） |
| 强调 pill | `bg-amber-100 text-amber-700 rounded-full px-2.5 py-0.5 text-xs font-medium`（含 ✨ SVG） |
| 完成 pill | `bg-emerald-100 text-emerald-700 ...`（含奖杯 SVG） |

---

## § 1 — `/dictation` 输入页改造

### 1.1 页面骨架

```
<div class="min-h-dvh relative overflow-hidden
            bg-gradient-to-b from-sky-100 via-sky-50 to-emerald-100">
  <DecorativeBackground />
  <div class="relative z-10 max-w-2xl mx-auto px-4 py-8 md:py-10">
    <header>...</header>
    <section class="磨砂卡">
      <WordInput />
      <PlaybackSettings />
      <button>加载单词</button>
    </section>
  </div>
</div>
```

### 1.2 元素映射

| 元素 | 现状 | 改为 |
|---|---|---|
| 最外层根 | `max-w-2xl mx-auto px-4 py-8 md:py-10 text-on-surface` | 拆成两层：外层渐变背景 + DecorativeBackground，内层维持原 container（加 `relative z-10`） |
| Header 标题 | `text-2xl md:text-[28px] font-normal text-on-surface` | `text-2xl md:text-[28px] font-semibold text-slate-700`（与 ProgressBadge 字重统一） |
| Header 副标题 | `text-sm text-on-surface-variant mt-1` | `text-sm text-slate-500 mt-1` |
| 大卡 | `bg-surface-container border border-outline-variant rounded-2xl p-4 md:p-6` | `bg-white/80 backdrop-blur-sm shadow-lg shadow-sky-200/40 rounded-3xl p-5 md:p-7`（去边框、加阴影、圆角加大） |
| 加载按钮 | `bg-primary text-on-primary shadow-sm shadow-primary/30 rounded-xl py-3.5` | `bg-gradient-to-br from-sky-400 to-emerald-400 shadow-lg shadow-sky-400/40 text-white rounded-2xl h-14 hover:scale-[1.01] active:scale-[0.98]` |
| 加载按钮 disabled | `opacity-38` | `opacity-50 saturate-50 cursor-not-allowed`（更接近 player 副键的 disabled 样式） |

### 1.3 `WordInput.vue` 改造

| 元素 | 现状 | 改为 |
|---|---|---|
| label | `text-on-surface-variant uppercase tracking-wider` | `text-slate-500`（去掉 uppercase，保留 `text-xs font-medium`） |
| textarea | `border-[1.5px] border-outline-variant bg-surface focus:border-primary` | `border-[1.5px] border-sky-200 bg-white/60 focus:border-sky-400 focus:ring-2 focus:ring-sky-200/50 outline-none` |
| 单词数提示 | `<p class="text-xs text-on-surface-variant text-right">已输入 N 个单词</p> ` | 改为 amber pill：`<span class="inline-flex items-center gap-1 bg-amber-100 text-amber-700 rounded-full px-2.5 py-0.5 text-xs font-medium">✨ 已输入 N 个</span>`（容器右对齐） |

### 1.4 `PlaybackSettings.vue` 改造

| 元素 | 现状 | 改为 |
|---|---|---|
| 容器 | `bg-surface rounded-xl p-4` | `bg-sky-50/60 rounded-2xl p-4`（与大卡形成层次） |
| label | `text-on-surface-variant` | `text-slate-500` |
| value 数字 | `text-on-surface` | `text-slate-700` |
| slider | `accent-primary` | `accent-sky-500` |

### 1.5 容器顶层 padding 调整

由于背景从 `body` 接管到根 div，原 `max-w-2xl ... py-8` container 还要保证移动端最低 `min-h-dvh` 不出现裸白边。做法：外层 div 的 `min-h-dvh` 已经覆盖，内层 container 维持 `py-8 md:py-10`。

---

## § 2 — `WordConfirmModal` 改造

### 2.1 弹框骨架

```
<Teleport to="body">
  <Transition name="modal">
    <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center md:p-4"
         @click="emit('cancel')">
      <!-- Overlay -->
      <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />

      <!-- Card / Bottom sheet -->
      <div class="relative w-full max-h-[85vh] md:max-w-[560px] md:rounded-3xl
                  max-md:fixed max-md:bottom-0 max-md:left-0 max-md:right-0
                  max-md:rounded-t-3xl
                  bg-white/90 backdrop-blur-md shadow-2xl shadow-sky-300/30
                  flex flex-col" @click.stop>
        <!-- Drag handle (mobile) -->
        <!-- Header -->
        <!-- Word list (scroll) -->
        <!-- Footer -->
      </div>
    </div>
  </Transition>
</Teleport>
```

### 2.2 元素映射

| 元素 | 现状 | 改为 |
|---|---|---|
| Overlay | `bg-black/50` | `bg-slate-900/40 backdrop-blur-sm`（柔化、透出渐变） |
| 卡片 / sheet 容器 | `bg-surface-container shadow-2xl rounded-2xl` / `rounded-t-2xl` | `bg-white/90 backdrop-blur-md shadow-2xl shadow-sky-300/30`，桌面 `rounded-3xl`，移动 `rounded-t-3xl` |
| Drag handle | `w-8 h-1 bg-outline-variant rounded-full` | `w-10 h-1 bg-gradient-to-r from-sky-300 to-emerald-300 rounded-full`，容器 `pt-3` |
| Header 标题 | `text-lg md:text-xl font-medium text-on-surface` | 加左侧 ✨ SVG（`w-4 h-4 text-amber-500`）+ `text-slate-700 font-semibold` |
| "共 N 个" | `text-xs md:text-sm text-on-surface-variant` 纯文本 | amber pill：`inline-flex items-center gap-1 bg-amber-100 text-amber-700 rounded-full px-2.5 py-0.5 text-xs font-medium`（前缀 📋 SVG） |
| 列表条目容器 | `bg-surface-container-high rounded-xl p-3 gap-3` | `bg-sky-50/70 hover:bg-sky-100/80 rounded-2xl p-3.5 gap-3 border border-white/60 transition-colors` |
| 序号 | `text-xs text-on-surface-variant min-w-5` | 小圆章：`flex items-center justify-center w-6 h-6 rounded-full bg-white text-sky-600 text-xs font-medium tabular-nums shrink-0` |
| 单词文本 | `font-medium text-on-surface` | `font-semibold text-slate-700` |
| 翻译 input | `border-b border-dashed focus:border-primary text-on-surface-variant` | `border-b border-dashed border-transparent focus:border-sky-400 text-slate-500 placeholder:text-slate-400 bg-transparent` |
| 删除按钮 | `text-red-700 opacity-50 hover:bg-red-700/8 rounded-lg` | `text-rose-500 opacity-60 hover:opacity-100 hover:bg-rose-50 rounded-full transition-all` |
| Footer 容器 | `border-t border-surface-container-high` | 去边框，仅靠间距分隔；保留 `max-md:pb-[max(1rem,env(safe-area-inset-bottom))]` |
| 副键「返回修改」 | 桌面 text-only / 移动描边 | 统一改 player 副键调性：`bg-white/80 backdrop-blur-sm shadow-md shadow-sky-200/40 text-slate-600 rounded-full px-7 h-12 hover:bg-white active:scale-95`，移动 `flex-1` |
| 主键「确认开始」 | `bg-primary text-on-primary rounded-xl px-6 py-2.5` | `bg-gradient-to-br from-sky-400 to-emerald-400 shadow-lg shadow-sky-400/40 text-white rounded-full px-7 h-12 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:saturate-50 disabled:cursor-not-allowed` |
| 主键 disabled 条件 | 无 | `:disabled="props.words.length === 0"`（删空时禁用，避免空数据进 player） |
| Transition | `name="modal"` 默认 fade | overlay fade + 卡片 `opacity + scale-95→100 + translate-y-2→0`，150ms ease-out |

### 2.3 Transition 实现

在 `<style scoped>` 里新增：

```css
.modal-enter-active, .modal-leave-active {
  transition: opacity 150ms ease-out;
}
.modal-enter-active > .relative,
.modal-leave-active > .relative {
  transition: transform 150ms ease-out, opacity 150ms ease-out;
}
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-from > .relative,
.modal-leave-to > .relative {
  opacity: 0;
  transform: scale(0.95) translateY(8px);
}
```

（如果实现时发现 Tailwind 写不顺，改用全 utility 也行；保留行为一致即可。）

---

## 测试 / 验证策略

仓库无单测。验证方式：

1. `pnpm dev` 起本地服务器，浏览器打开 `/dictation`，目视核对 §1 全部映射。
2. 输入若干单词，点"加载单词"打开 Modal，目视核对 §2 全部映射；分别检查移动视口（< md）和桌面视口（≥ md）。
3. 删空 Modal 中所有单词，确认"确认开始"按钮变 disabled 且不可点击。
4. 走完整流程进入 `/dictation/player`，确认两页之间不再有"换皮"突兀感。
5. `pnpm lint` 通过；`pnpm type-check` 通过（本次仅改 class，类型应无影响）。

---

## 风险与权衡

- **渐变背景下 textarea 的 `bg-white/60` 可能在 Safari 移动端透出云朵 SVG 导致阅读干扰**：DecorativeBackground 的云在固定百分比位置，应该不会大面积压到表单。如出现可降到 `bg-white/80`。
- **磨砂 `backdrop-blur-md` 在低端 Android 可能掉帧**：可接受，player 已用同样的滤镜未见反馈。
- **去掉 MD3 token 后，与项目其它页面的视觉一致性下降**：本仓库目前其它页面较少，且 dictation 是独立产品线；权衡后选择"产品线内部一致"高于"全站一致"。
