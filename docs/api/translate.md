# 翻译接口文档

基础路径：`https://www.gaopeng.fun`

## 1. 单词翻译 `POST /api-blog/translate/word`

### 请求

- Method：`POST`
- Headers：
  - `Content-Type: application/json`
  - `X-Token: <x-token>`（必填）, 读取 `import.meta.env.VITE_APP_X_TOKEN`
- Body：

```json
{
  "word": "hello"
}
```

| 字段 | 类型 | 必填 | 约束 |
|------|------|------|------|
| word | string | 是 | 非空白；trim 后长度 ≤ 200 |

### 响应

成功（HTTP 200）：

```json
{
  "success": true,
  "message": null,
  "data": {
    "word": "hello",
    "translatedText": "你好",
    "success": true,
    "message": null
  }
}
```

字段说明：

| 字段 | 类型 | 说明 |
|------|------|------|
| word | string | 原始输入文本 |
| translatedText | string | 翻译结果，单条失败时可能为空 |
| success | boolean | 单条翻译是否成功 |
| message | string | 单条失败原因，成功时为 `null` |

失败示例（HTTP 401 / 400）：

```json
{ "success": false, "message": "unauthorized", "data": null }
{ "success": false, "message": "invalid request", "data": null }
{ "success": false, "message": "word too long", "data": null }
```

## 2. 批量翻译 `POST /api-blog/translate/batch`

一次提交多条文本，按腾讯 TMT 批量接口翻译。

### 请求

- Method：`POST`
- Headers：
  - `Content-Type: application/json`
  - `X-Token: <x-token>`（必填）, 读取 `import.meta.env.VITE_APP_X_TOKEN`
- Body：

```json
{
  "words": ["hello", "world", "spring boot"]
}
```

| 字段 | 类型 | 必填 | 约束 |
|------|------|------|------|
| words | string[] | 是 | 非空数组；长度 ≤ 50；每个元素非空白；每个元素 trim 后长度 ≤ 200 |

### 响应

成功（HTTP 200）：

```json
{
  "success": true,
  "message": null,
  "data": [
    {
      "word": "hello",
      "translatedText": "你好",
      "success": true,
      "message": null
    },
    {
      "word": "world",
      "translatedText": "世界",
      "success": true,
      "message": null
    }
  ]
}
```

1. 响应数据顺序与请求 `words` 一一对应；
2. 单条失败不会影响整体 `success`，错误信息体现在元素的 `success`/`message` 字段。

失败示例（HTTP 401 / 400）：

```json
{ "success": false, "message": "unauthorized", "data": null }
{ "success": false, "message": "invalid request", "data": null }
{ "success": false, "message": "batch size exceeded", "data": null }
{ "success": false, "message": "word too long", "data": null }
```
