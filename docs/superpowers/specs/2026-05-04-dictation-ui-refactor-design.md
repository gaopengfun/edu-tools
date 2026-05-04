# 单词听写 UI 重构设计

## 概述

使用 Tailwind CSS v4 全面重构单词听写功能的 UI，继续 Material Design 3 风格但做精，适配移动端访问。按功能拆分细粒度子组件，播放逻辑抽离到 composable。

## 组件结构

```
src/views/dictation/
  Dictation.vue                  — 输入配置页（组合子组件）
  DictationPlayer.vue            — 极简沉浸播报页（组合子组件）
  components/
    WordInput.vue                — textarea 输入 + 单词解析 + 实时计数
    PlaybackSettings.vue         — 语速/重复次数 range slider
    WordConfirmModal.vue         — 确认弹框（可编辑翻译、删除单词）
    PlayerControls.vue           — 播放/暂停/上下一个控制栏
    ProgressBar.vue              — 线性进度条
    WordDisplay.vue              — 当前单词大字 + 翻译展示
  composables/
    useSpeechPlayer.ts           — 语音合成播放逻辑
```

## Tailwind 主题系统

全局 CSS 入口文件通过 Tailwind v4 `@theme` 定义 MD3 色彩令牌，所有组件通过 utility class 引用，消除各组件重复的 CSS 变量定义。

```css
@import "tailwindcss";

@theme {
  --color-primary: #1a73e8;
  --color-on-primary: #ffffff;
  --color-surface: #f8f9ff;
  --color-surface-container: #ffffff;
  --color-surface-container-high: #e8eaf6;
  --color-on-surface: #1a1c20;
  --color-on-surface-variant: #44474e;
  --color-outline: #74777f;
  --color-outline-variant: #c4c6d0;
}
```

## 输入配置页（Dictation.vue）

组合 WordInput + PlaybackSettings，单页表单布局。

- WordInput：textarea 输入单词，支持空格/逗号/换行分隔，实时显示单词计数
- PlaybackSettings：重复次数和语速使用 range slider（替代 number input），触控更友好
- 设置区域用浅色背景（surface）区分层次
- 按钮全宽 + 微阴影，强行动号召
- 移动端（<768px）：设置项纵向堆叠，避免挤压

## 极简沉浸播报页（DictationPlayer.vue）

组合 WordDisplay + ProgressBar + PlayerControls，全屏沉浸体验。

- 纯黑背景（#0a0a0a），最大化沉浸感
- WordDisplay：单词使用 font-weight 300 细体大字，翻译文字低对比度（45% 白色）
- ProgressBar：极细 2px 线条，融入背景
- PlayerControls：精简为 3 个按钮（上一个 / 播放暂停 / 下一个），去掉停止按钮——返回即停止
- 播放按钮使用毛玻璃效果（backdrop-filter）
- 顶部仅保留返回按钮 + 进度数字（如 "3 / 10"），无标题
- 移动端适配 safe-area-inset，底部控制栏避免被遮挡

## 确认弹框（WordConfirmModal.vue）

- 桌面端：居中弹框，圆角 20px，阴影加深
- 移动端：底部抽屉（bottom sheet），带拖拽手柄
- 每行显示：序号 + 单词 + 可编辑翻译 + 删除按钮
- 桌面端翻译字段点击可编辑（虚线下划线提示）
- 删除按钮 hover/touch 时高亮
- 头部显示单词总数
- 移动端底部按钮等宽并排，适配 safe-area

## composable：useSpeechPlayer

从 DictationPlayer.vue 抽离播放逻辑。

输入：store 引用
输出：play, pause, resume, stop, prev, next

职责：
- 封装 SpeechSynthesisUtterance 的创建、事件监听、生命周期
- 管理播放队列（重复次数、间隔等待）
- 调用 store 的 setPlayState / resetPlayState 更新状态
- onUnmounted 自动清理（cancel speech）

## 数据流

```
WordInput → 解析单词列表 → batchTranslate → previewWords
    ↓
WordConfirmModal → 编辑翻译/删除单词 → 确认
    ↓
store.setWords() + store.setConfig() → router.push('/dictation/player')
    ↓
DictationPlayer → useSpeechPlayer(store) → 控制播放
```

## Store 调整

- 新增 `removeWord(index)` 方法，支持弹框中删除单词
- 现有 `updateWordTranslation` 保持不变

## 响应式策略

Mobile-first 设计，断点：
- 默认：移动端布局
- `md`（≥768px）：桌面端布局

关键适配点：
- 输入页设置项：移动端纵向堆叠，桌面端横向排列
- 确认弹框：移动端底部抽屉，桌面端居中弹框
- 播报页字号：移动端 42px，桌面端 56px
- 控制按钮尺寸：移动端缩小，间距收紧
- safe-area-inset 适配底部控制栏和弹框按钮
