# 工具列表首页设计

## 目标

为 x-tools 提供一个根路由的工具列表页，以 MD3 风格卡片网格展示项目中所有工具入口，点击卡片跳转对应工具。新增工具时仅需在元数据处登记。

## 范围

- 新增视图：工具列表首页
- 新增元数据文件集中登记工具
- 调整路由：`/` 渲染列表页，不再重定向到 `oss-check`

**范围外（YAGNI）**：搜索、分类、收藏、标签、主题切换、工具内嵌二级路由。

## 架构

### 新增文件

- `src/views/tool-list/ToolList.vue` — 列表页 SFC。
- `src/views/tool-list/tools.ts` — 工具元数据数组 + 类型定义。

### 修改文件

- `src/router/index.ts` — 替换根路由 redirect 为 `ToolList` 视图，懒加载。

## 元数据

`src/views/tool-list/tools.ts` 导出：

```ts
export interface ToolMeta {
  name: string;          // 唯一标识，对应 route name
  title: string;         // 卡片标题
  description: string;   // 卡片副文本（一句话）
  path: string;          // 跳转路径，如 '/oss-check'
  icon?: string;         // 可选图标占位（首期不强制）
}

export const tools: ToolMeta[] = [
  {
    name: 'oss-check',
    title: 'OSS 可用性检测',
    description: '分步检测公网与阿里云 OSS 上传链路的可用性',
    path: '/oss-check',
  },
];
```

## UI / 交互

- 顶部标题区：主标题 + 一句话副标题。
- 卡片网格：`grid-template-columns: repeat(auto-fill, minmax(280px, 1fr))`，间距遵循 8dp 节奏。
- 卡片：MD3 surface，圆角、hover/focus state layer、可见 focus ring；含 title、description、末尾 chevron 作为行动指示。
- 可达性：整卡为链接（`role="link"` + `tabindex="0"`），Enter/Space 触发 `router.push(tool.path)`；点击行为使用 `<RouterLink>` 或等价实现以保留右键/Ctrl+Click 语义。
- 复用现有 MD3 token（颜色、圆角、阴影），不新增主题。

## 路由

```ts
{ path: '/', name: 'tool-list', component: () => import('@/views/tool-list/ToolList.vue') },
{ path: '/oss-check', name: 'oss-check', component: () => import('@/views/oss-check/OssCheck.vue') },
```

## 验收

- 访问 `/` 展示卡片网格，包含 oss-check 卡片。
- 点击（或键盘 Enter/Space）跳转到 `/oss-check`，原功能无回归。
- 新增一个工具仅需：在 `src/views/` 下建文件夹、注册路由、在 `tools.ts` 追加一条记录。
- 通过 `pnpm type-check` 与 `pnpm lint`。
