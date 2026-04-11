# 阿里云 OSS 上传检测工具 - 设计文档

## 概述

x-tools 中的一个路由页面，用于检测用户当前网络环境是否满足向阿里云 OSS 上传图片文件的条件。通过分步骤递进检测，实时展示每一步的结果，最终给出汇总报告。

## 检测流程

共 4 个检测步骤，串行执行：

| 步骤 | 名称 | 做什么 | 判定方式 |
|------|------|--------|----------|
| 1 | 公网连通性 | `fetch("https://www.aliyun.com", { mode: "no-cors" })` | 响应成功（含 opaque 响应）= 通过，超时/异常 = 失败 |
| 2 | OSS Endpoint 连通性 | `fetch("https://oss-cn-beijing.aliyuncs.com", { mode: "no-cors" })` | 同上 |
| 3 | OSS PUT 协议检测 | 获取 STS Token，构造 OSS PUT 签名 URL，浏览器发 OPTIONS 预检请求 | 预检响应允许 PUT = 通过 |
| 4 | 实际上传测试 | 用 STS 凭证生成 1KB 随机 Blob，通过 OSS REST API PUT 上传 | HTTP 200 = 通过 |

### 规则

- 每一步记录耗时（ms）
- 步骤 3 和 4 共享同一次 Token 请求结果
- 某一步失败后，后续步骤标记为「跳过」，不再执行
- 每步超时时间：30 秒（通过 `AbortController` 控制）
- 上传的测试文件不删除

## Token 接口

- **地址**：`https://zytestaliyun.ceshiservice.cn/api-dihw-smarthw/token/uploadTokenNew?type=pyjLog&path=pyjLog&schoolId=1500000200068840595`
- **返回字段**：`accessKeyId`、`accessKeySecret`、`securityToken`、`bucket`、`endPoint`、`region`、`path`
- **注意**：返回的 `message` 字段值为 JSON 字符串，需二次解析

## 文件结构

```
src/
├── views/
│   └── oss-check/
│       ├── OssCheck.vue          # 页面主组件
│       ├── composables/
│       │   └── useOssCheck.ts    # 检测逻辑（状态管理 + 步骤执行）
│       └── types.ts              # 类型定义
├── router/
│   └── index.ts                  # 添加 /oss-check 路由
```

## 核心类型

```ts
type StepStatus = 'pending' | 'running' | 'passed' | 'failed' | 'skipped'

interface CheckStep {
  name: string
  status: StepStatus
  duration?: number    // ms
  error?: string       // 失败原因
}
```

## Composable: useOssCheck

- 暴露 `steps: Ref<CheckStep[]>`、`summary`、`running`、`startCheck()`
- `startCheck()` 串行执行 4 个检测函数，每个函数内部更新对应 step 的状态和耗时
- Token 在步骤 3 开始前获取一次，步骤 4 复用

## 网络请求

| 请求 | 方法 | 说明 |
|------|------|------|
| 公网检测 | `fetch("https://www.aliyun.com", { mode: "no-cors" })` | no-cors 避免 CORS 拦截，opaque 响应即视为通过 |
| Endpoint 检测 | `fetch("https://oss-cn-beijing.aliyuncs.com", { mode: "no-cors" })` | 同上 |
| Token 获取 | `fetch(tokenApi)` | 跨域请求，需接口支持 CORS |
| PUT 预检 | 构造 OSS PUT 签名 URL，浏览器自动发 OPTIONS 预检 | 检查 CORS 是否允许 PUT |
| 实际上传 | `fetch(signedUrl, { method: "PUT", body: blob })` | 1KB 随机 Blob，文件名用时间戳 |

## OSS 签名

使用 OSS V4 签名，前端通过 Web Crypto API（`crypto.subtle.importKey` / `sign`）自行计算，不引入第三方库。

## 页面交互

### 流程

1. 用户进入页面，看到说明和「开始检测」按钮
2. 点击按钮后，按钮禁用，步骤列表出现，逐步执行
3. 每完成一步，实时更新该步骤状态（等待中 → 检测中 → 通过/失败）
4. 全部完成后，底部显示汇总区域，按钮恢复为「重新检测」

### 步骤状态

- **等待中**：灰色，空心圆
- **检测中**：蓝色，旋转动画
- **通过**：绿色，对勾
- **失败**：红色，叉号
- **跳过**：灰色，横线

## UI 风格：Material Design 3

纯 CSS 手写实现，不引入 UI 组件库：

- **色彩**：MD3 色彩系统，主色蓝色系，成功/失败用 green/error token
- **圆角**：卡片 12px，按钮 20px（full rounded）
- **阴影**：卡片 elevation level 1
- **字体**：系统字体栈，标题 headlineSmall，步骤名 bodyLarge，耗时 labelMedium
- **按钮**：Filled Button（主色填充、白色文字、hover state layer）
- **状态图标**：CSS 或 inline SVG（不引入图标库）
- **步骤卡片**：Surface 容器内列表项，左侧图标+名称，右侧结果 chip + 耗时
- **汇总卡片**：全部通过绿色 Surface，部分失败红色 Surface
- **响应式**：单列布局，最大宽度 600px 居中，移动端友好
