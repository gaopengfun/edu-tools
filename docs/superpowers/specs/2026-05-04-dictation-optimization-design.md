# 单词听写工具优化设计文档

**日期：** 2026-05-04  
**版本：** 1.0  
**状态：** 待审核

## 概述

对现有单词听写工具进行全面优化，实现两步流程（输入配置 → 全屏播报），增加单词翻译、确认弹框、三单词预览等功能，提升用户体验。

## 目标

1. 优化输入体验：支持更多分隔符，下拉选择配置参数
2. 增加确认环节：加载单词后展示确认弹框，支持二次修改
3. 全屏播报体验：独立播报页面，凸显单词和翻译
4. 增强导航：展示上一个、当前、下一个三个单词
5. 集成翻译：实时获取单词中文翻译（非必要功能）

## 整体架构

### 组件结构

```
src/views/dictation/
├── Dictation.vue              # 输入配置页（改造）
├── DictationPlayer.vue        # 全屏播报页（新建）
└── components/
    └── WordConfirmModal.vue   # 单词确认弹框（新建）

src/stores/
└── dictation.ts               # 状态管理（新建）
```

### 路由配置

```typescript
// src/router/index.ts
{
  path: '/dictation',
  name: 'dictation',
  component: () => import('@/views/dictation/Dictation.vue')
},
{
  path: '/dictation/player',
  name: 'dictation-player',
  component: () => import('@/views/dictation/DictationPlayer.vue')
}
```

### 状态管理

使用 pinia 创建 `useDictationStore`：

```typescript
// src/stores/dictation.ts
interface WordItem {
  text: string;           // 英文单词
  translation: string;    // 中文翻译（可为空）
  index: number;
}

interface DictationState {
  words: WordItem[];      // 单词列表
  repeatCount: number;    // 重复次数（1-5）
  speechRate: number;     // 语速（0.5-2.0）
  currentIndex: number;   // 当前播放索引
  isPlaying: boolean;     // 是否正在播放
  isPaused: boolean;      // 是否暂停
}
```

## 详细设计

### 1. 输入配置页（Dictation.vue）

#### 1.1 输入区域优化

**支持的分隔符：**
- 空格
- 中英文逗号：`,` 和 `，`
- 中英文分号：`;` 和 `；`
- 顿号：`、`
- 换行符

**解析正则：** `/[\n,，;；、\s]+/`

#### 1.2 设置区域改造

**重复次数下拉选择：**
```html
<select v-model.number="repeatCount">
  <option :value="1">1 次</option>
  <option :value="2">2 次</option>
  <option :value="3">3 次</option>
  <option :value="4">4 次</option>
  <option :value="5">5 次</option>
</select>
```

**语速下拉选择：**
```html
<select v-model.number="speechRate">
  <option :value="0.5">0.5x（很慢）</option>
  <option :value="0.8">0.8x（慢）</option>
  <option :value="1.0">1.0x（正常）</option>
  <option :value="1.2">1.2x（快）</option>
  <option :value="1.5">1.5x（很快）</option>
  <option :value="2.0">2.0x（极快）</option>
</select>
```

#### 1.3 加载单词流程

1. 用户点击"加载单词"按钮
2. 解析输入文本，切分单词
3. 显示 loading 状态
4. 调用翻译 API 批量获取翻译（静默失败）
5. 打开 `WordConfirmModal` 弹框展示结果
6. 用户确认或返回修改

**翻译 API 调用：**
- 使用有道智云翻译 API
- 批量翻译（一次最多 50 个单词）
- 超过 50 个单词时分批请求
- 失败时 translation 字段为空字符串
- 不显示错误信息，不阻塞流程

#### 1.4 翻译 API 配置

**环境变量：**
```env
VITE_YOUDAO_APP_KEY=your_app_key
VITE_YOUDAO_APP_SECRET=your_app_secret
```

**Vite 代理配置：**
```typescript
// vite.config.ts
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

### 2. 单词确认弹框（WordConfirmModal.vue）

#### 2.1 功能

- 展示解析后的单词列表
- 显示英文单词和中文翻译（如果有）
- 提供两个操作按钮：
  - "确认开始"：保存到 store，跳转到播报页
  - "返回修改"：关闭弹框，回到输入页

#### 2.2 UI 设计

**布局：**
- Modal 居中显示，最大宽度 600px
- 标题："确认单词列表"
- 单词列表：滚动区域，最大高度 400px
- 每个单词一行：英文（粗体）+ 中文翻译（灰色）
- 底部按钮：左侧"返回修改"，右侧"确认开始"（primary）

**样式：**
- 遵循 Material Design 3 规范
- 使用 MD3 颜色令牌
- 卡片式弹框，带阴影和圆角

### 3. 全屏播报页（DictationPlayer.vue）

#### 3.1 布局结构

**整体布局：**
```
┌─────────────────────────────────────┐
│ ← 返回    ████████░░░░░░  7/10      │  顶部栏
├─────────────────────────────────────┤
│                                     │
│           hello                     │  当前单词（大）
│           你好                      │  中文翻译（中）
│                                     │
│    world    hello    test          │  三单词预览
│   (上一个)  (当前)  (下一个)        │
│                                     │
│    ◀  ▶  ■  ▶▶                    │  控制按钮
│                                     │
└─────────────────────────────────────┘
```

#### 3.2 顶部栏

- 左侧：返回按钮（`←` 图标）
- 中间：进度条（视觉化显示）
- 右侧：文字进度（`7 / 10`）

**返回逻辑：**
- 点击返回按钮
- 停止当前播报（调用 `speechSynthesis.cancel()`）
- 清空播放状态
- 使用 `router.push('/dictation')` 返回

#### 3.3 单词展示区

**当前单词：**
- 字体大小：48px
- 字重：500
- 颜色：primary
- 居中显示

**中文翻译：**
- 字体大小：24px
- 颜色：on-surface-variant
- 当前单词下方
- 使用 `v-if="currentWord.translation"` 条件渲染
- 无翻译时不显示该区域

**三单词预览：**
- 横向排列，均匀分布
- 字体大小：16px
- 上一个和下一个：半透明（opacity: 0.6）
- 当前单词：高亮显示（primary 颜色）
- 边界处理：
  - 第一个单词时，上一个位置显示占位符或留空
  - 最后一个单词时，下一个位置显示占位符或留空

#### 3.4 控制按钮

**按钮布局：**
- 横向居中排列
- 间距：16px

**按钮功能：**
1. **上一个**（`◀`）：
   - 跳到上一个单词
   - 如果正在播放，停止当前播报并播放上一个
   - 第一个单词时禁用

2. **播放/暂停**（`▶` / `❚❚`）：
   - 切换播放状态
   - 播放时显示暂停图标
   - 暂停时显示播放图标
   - 按钮尺寸稍大（64x64）

3. **下一个**（`▶▶`）：
   - 跳到下一个单词
   - 如果正在播放，停止当前播报并播放下一个
   - 最后一个单词时禁用

4. **停止**（`■`）：
   - 停止播放
   - 重置到第一个单词
   - 不返回输入页（用户可通过顶部返回按钮返回）

#### 3.5 播放逻辑

**初始化：**
- 从 store 读取单词数据
- 如果 store 为空，重定向到输入页
- 设置 currentIndex 为 0

**播放流程：**
1. 获取当前单词
2. 尝试获取翻译（实时调用 API）
3. 重复播报当前单词（根据 repeatCount）
4. 每次播报间隔 500ms
5. 播报完成后等待 1000ms
6. 自动播放下一个单词
7. 播放到最后一个单词后停止

**翻译获取策略：**
- 每次切换到新单词时调用翻译 API
- 使用防抖（300ms）避免频繁请求
- 成功：更新 store 中该单词的 translation
- 失败：保持 translation 为空，不显示翻译区域
- 不显示 loading，不显示错误信息

**暂停/继续：**
- 暂停：调用 `speechSynthesis.cancel()`，设置 isPaused = true
- 继续：从当前单词继续播放

**上一个/下一个：**
- 停止当前播报
- 更新 currentIndex
- 如果正在播放状态，自动播放新单词

## 数据流

### 输入页 → Store

1. 用户输入单词并配置参数
2. 点击"加载单词"
3. 解析单词列表
4. 批量调用翻译 API
5. 保存到 `useDictationStore()`：
   - words: WordItem[]
   - repeatCount: number
   - speechRate: number

### Store → 播报页

1. 播报页 `onMounted` 时检查 store
2. 如果 words 为空，重定向到输入页
3. 读取配置并初始化播放状态

### 播报页 → Store

1. 播放状态实时同步：
   - currentIndex
   - isPlaying
   - isPaused
2. 翻译成功时更新对应单词的 translation

### 返回输入页

1. 清空播放状态（currentIndex, isPlaying, isPaused）
2. 保留单词数据和配置（支持重新播放）

## 错误处理

### 翻译 API

**策略：静默失败，不影响主流程**

- 批量翻译失败：translation 为空，正常进入确认弹框
- 实时翻译失败：不显示翻译区域，不显示错误
- 网络超时：10 秒超时，静默失败
- API 限流：静默失败，不重试

### 语音合成

- 浏览器不支持：播报页显示提示，禁用播放按钮
- 播报出错：自动跳到下一个单词
- 播报中断：捕获错误，继续流程

### 空数据保护

- 播报页检测到空单词列表：重定向到输入页
- 直接访问播报页 URL：重定向到输入页

## 性能优化

1. **翻译 API 批量请求：**
   - 一次最多 50 个单词
   - 超过 50 个时分批请求
   - 使用 Promise.all 并发请求

2. **实时翻译防抖：**
   - 300ms 防抖，避免快速切换时频繁请求

3. **组件懒加载：**
   - 播报页使用路由懒加载
   - Modal 组件按需加载

4. **状态持久化：**
   - 使用 pinia-plugin-persistedstate
   - 刷新页面后保留单词数据

## UI/UX 设计

### Material Design 3 规范

**颜色令牌：**
- `--md-primary`: 主色调
- `--md-on-primary`: 主色调上的文字
- `--md-surface`: 表面颜色
- `--md-on-surface`: 表面上的文字
- `--md-on-surface-variant`: 次要文字

**间距：**
- 8dp 节奏
- 组件间距：16px、24px、32px

**圆角：**
- 小组件：8px
- 卡片/弹框：16px
- 按钮：20px（pill shape）

**阴影：**
- 弹框：elevation-3
- 按钮悬停：elevation-1

### 响应式设计

**断点：**
- 移动端：< 640px
- 平板：640px - 1024px
- 桌面：> 1024px

**适配：**
- 播报页在移动端保持全屏
- 控制按钮在移动端缩小尺寸
- 三单词预览在移动端字体缩小

## 技术实现要点

### 翻译 API 集成

**有道智云 API：**
- 接口：`https://openapi.youdao.com/api`
- 方法：POST
- 参数：
  - q: 待翻译文本（多个单词用换行分隔）
  - from: en
  - to: zh-CHS
  - appKey: 应用 ID
  - salt: 随机数
  - sign: 签名（MD5(appKey+q+salt+appSecret)）

**批量翻译：**
```typescript
async function batchTranslate(words: string[]): Promise<string[]> {
  const chunks = chunkArray(words, 50);
  const results = await Promise.all(
    chunks.map(chunk => translateChunk(chunk))
  );
  return results.flat();
}
```

### 防抖实现

```typescript
import { useDebounceFn } from '@vueuse/core';

const debouncedTranslate = useDebounceFn(
  async (word: string) => {
    const translation = await translateWord(word);
    if (translation) {
      updateWordTranslation(currentIndex.value, translation);
    }
  },
  300
);
```

### 路由守卫

```typescript
// DictationPlayer.vue
onMounted(() => {
  const store = useDictationStore();
  if (store.words.length === 0) {
    router.push('/dictation');
  }
});
```

## 测试计划

### 单元测试

1. 单词解析逻辑
2. 翻译 API 调用
3. Store 状态管理
4. 播放控制逻辑

### 集成测试

1. 输入页 → 确认弹框 → 播报页流程
2. 播报页 → 返回输入页流程
3. 翻译失败时的降级处理

### E2E 测试

1. 完整用户流程
2. 边界情况（空输入、单个单词、大量单词）
3. 浏览器兼容性（Chrome、Firefox、Safari）

## 实施计划

### 子任务分解

1. **创建 pinia store**（dictation.ts）
2. **改造输入配置页**（Dictation.vue）
   - 优化输入解析
   - 改造设置为下拉选择
   - 集成翻译 API
3. **创建确认弹框**（WordConfirmModal.vue）
4. **创建全屏播报页**（DictationPlayer.vue）
   - 布局和样式
   - 播放控制逻辑
   - 实时翻译集成
5. **配置路由**
6. **配置 Vite 代理**
7. **整体测试和优化**

### 开发流程

每个子任务：
1. 使用 subagent 完成开发
2. 另一个 subagent 进行 code review
3. 修复问题后进入下一个子任务

所有子任务完成后：
1. 整体 code review
2. 流程测试
3. 用例检查
4. 发现缺陷则修复并重新测试

## 附录

### 依赖项

- `pinia`: 状态管理
- `pinia-plugin-persistedstate`: 状态持久化
- `@vueuse/core`: 工具函数（防抖等）
- `crypto-js`: MD5 签名（翻译 API）

### 环境变量示例

```env
# .env.local
VITE_YOUDAO_APP_KEY=your_app_key_here
VITE_YOUDAO_APP_SECRET=your_app_secret_here
```

### API 文档参考

- 有道智云翻译 API：https://ai.youdao.com/DOCSIRMA/html/trans/api/wbfy/index.html
