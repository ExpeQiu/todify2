# 博查 Web Search API 配置和使用指南

## 一、API Key 配置

### 1. 环境变量配置

在 `backend/.env` 文件中已配置：

```env
# 博查 AI Web Search API 密钥
BOCHA_API_KEY=sk-c2d92b6a8b8c4d929f15cea2af541a03
```

### 2. 验证配置

#### 方式一：使用测试脚本（推荐）

```bash
cd backend
npm run test:bocha
```

测试脚本会：
- ✅ 检查 API Key 是否配置
- ✅ 执行测试搜索请求
- ✅ 显示搜索结果
- ✅ 验证服务可用性

#### 方式二：使用健康检查端点

如果后端服务正在运行：

```bash
curl http://localhost:3003/api/bocha/health
```

返回示例：

```json
{
  "success": true,
  "status": "available",
  "message": "博查 Web Search API 服务可用",
  "api_key_configured": true,
  "api_key_prefix": "sk-c2d9...",
  "timestamp": "2025-01-XX..."
}
```

## 二、API 端点

### 1. Web Search API

**端点**: `POST /api/bocha/web-search`

**请求示例**:

```bash
curl -X POST http://localhost:3003/api/bocha/web-search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "人工智能",
    "summary": true,
    "count": 10
  }'
```

**请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| query | String | 是 | 搜索关键词 |
| summary | Boolean | 否 | 是否返回摘要（默认 true） |
| count | Number | 否 | 返回结果数量（1-50，默认 10） |
| freshness | String | 否 | 时间范围（noLimit/oneDay/oneWeek/oneMonth/oneYear） |
| include | String | 否 | 指定搜索的网站范围 |
| exclude | String | 否 | 排除搜索的网站范围 |

**响应示例**:

```json
{
  "success": true,
  "data": {
    "_type": "SearchResponse",
    "queryContext": {
      "originalQuery": "人工智能"
    },
    "webPages": {
      "totalEstimatedMatches": 10000000,
      "value": [
        {
          "name": "搜索结果标题",
          "url": "https://example.com",
          "displayUrl": "example.com",
          "snippet": "搜索结果摘要",
          "summary": "详细摘要（如果 summary=true）",
          "siteName": "网站名称",
          "siteIcon": "网站图标URL",
          "datePublished": "2025-01-XX..."
        }
      ]
    }
  },
  "log_id": "xxx"
}
```

### 2. 健康检查 API

**端点**: `GET /api/bocha/health`

**响应示例**:

```json
{
  "success": true,
  "status": "available",
  "message": "博查 Web Search API 服务可用",
  "api_key_configured": true,
  "api_key_prefix": "sk-c2d9...",
  "timestamp": "2025-01-XX..."
}
```

## 三、前端使用

在前端项目中，通过 `bochaAPI.webSearch()` 调用：

```typescript
import { bochaAPI } from '../services/api';

const result = await bochaAPI.webSearch({
  query: '搜索关键词',
  summary: true,
  count: 10,
});

if (result.success) {
  const results = result.data?.webPages?.value || [];
  // 处理搜索结果
}
```

## 四、错误处理

### 常见错误码

| 错误码 | HTTP状态 | 说明 | 处理方式 |
|--------|----------|------|----------|
| MISSING_PARAMETER | 400 | 缺少必填参数 | 检查请求参数 |
| CONFIG_ERROR | 500 | API Key 未配置 | 检查环境变量 |
| AUTH_ERROR | 503 | API Key 无效 | 检查 API Key 是否正确 |
| NETWORK_ERROR | 503 | 网络错误 | 检查网络连接 |
| API_ERROR | 5xx | API 返回错误 | 查看错误详情 |

### 错误响应示例

```json
{
  "success": false,
  "error": {
    "code": "AUTH_ERROR",
    "message": "Invalid API KEY",
    "log_id": "xxx"
  }
}
```

## 五、服务状态验证

### ✅ 当前状态

- **API Key**: 已配置 (`sk-c2d92b6a8b8c4d929f15cea2af541a03`)
- **服务状态**: ✅ 可用
- **最后验证时间**: 2025-01-XX

### 验证命令

```bash
# 快速验证
cd backend && npm run test:bocha

# 或通过健康检查端点（需要后端服务运行）
curl http://localhost:3003/api/bocha/health
```

## 六、注意事项

1. **API Key 安全**: 
   - 不要在代码中硬编码 API Key
   - 不要将 `.env` 文件提交到 Git
   - 生产环境使用环境变量管理

2. **使用限制**:
   - 查看 [博查 API 文档](https://open.bocha.cn) 了解使用限制
   - 注意请求频率限制和余额

3. **错误处理**:
   - 始终检查 `success` 字段
   - 处理网络错误和超时
   - 记录 `log_id` 用于问题排查

4. **性能优化**:
   - 合理设置 `count` 参数（默认 10）
   - 使用 `freshness` 参数限制时间范围
   - 考虑缓存常用搜索结果

## 七、相关文档

- [博查 AI 开放平台](https://open.bocha.cn)
- [博查 Web Search API 文档](../bocha.md)
- [项目部署指南](./DEPLOYMENT_STANDARD_GUIDE.md)
