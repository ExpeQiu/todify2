# Dify API 接口文档

> ⚠️ **重要更新**: 本文档已更新为 v2.0 版本  
> 📖 **完整API文档**: 请查看 [API_DOCUMENTATION_V2.md](./API_DOCUMENTATION_V2.md)  
> 🔄 **数据库清理**: 13个表已移除，采用JSON存储策略

## 概述

本文档描述了与Dify平台集成的API接口，包括AI搜索和技术应用相关的接口。

**版本**: v1.0 (部分内容已更新)  
**最后更新**: 2025-01-13

## 基础信息

- **基础URL**: `http://localhost:8113/api` (已更新)
- **内容类型**: `application/json`
- **认证方式**: 通过环境变量配置的API密钥

## 接口列表

### 1. AI搜索接口

**端点**: `POST /ai-search`

**描述**: 调用Dify的AI搜索聊天消息API，用于智能问答和搜索功能。

**请求参数**:
```json
{
  "query": "string (必需) - 搜索查询内容",
  "inputs": {
    "key": "value (可选) - 额外的输入参数"
  }
}
```

**响应格式**:
```json
{
  "success": true,
  "data": {
    "event": "string - 事件类型",
    "task_id": "string - 任务ID",
    "id": "string - 消息ID",
    "message_id": "string - 消息唯一标识",
    "conversation_id": "string - 会话ID",
    "mode": "string - 模式",
    "answer": "string - AI回答内容",
    "metadata": {
      "usage": {
        "prompt_tokens": 0,
        "completion_tokens": 0,
        "total_tokens": 0,
        "total_price": "string - 总价格",
        "currency": "string - 货币单位",
        "latency": 0
      },
      "retriever_resources": [
        {
          "position": 1,
          "dataset_id": "string - 数据集ID",
          "dataset_name": "string - 数据集名称",
          "document_id": "string - 文档ID",
          "document_name": "string - 文档名称",
          "segment_id": "string - 片段ID",
          "score": 0.95,
          "content": "string - 检索内容"
        }
      ]
    },
    "created_at": 0
  },
  "message": "AI搜索完成"
}
```

**示例请求**:
```bash
curl -X POST http://localhost:3001/ai-search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "什么是人工智能？",
    "inputs": {
      "language": "zh-CN"
    }
  }'
```

### 2. 技术包装接口

**端点**: `POST /api/v1/ai-search/conversations/:conversationId/messages`

**描述**: 通过AI搜索模块调用技术包装应用，用于技术内容的包装和优化。

**重要变更**: 
- ⚠️ 旧的 `/api/tech-packaging/*` 端点已废弃
- ✅ 请使用 `/api/v1/ai-search/conversations/:conversationId/messages` 端点
- ✅ 生成的内容存储在 `workflow_executions.outputs` 字段中

**请求参数**:
```json
{
  "query": "string - 查询内容",
  "inputs": {
    "...": "其他输入参数"
  }
}
```

**响应格式**:
```json
{
  "success": true,
  "data": {
    "message_id": "string - 消息ID",
    "conversation_id": "string - 对话ID",
    "content": "string - AI回复内容",
    "metadata": {
      "usage": {
        "prompt_tokens": 0,
        "completion_tokens": 0,
        "total_tokens": 0,
        "total_price": "string",
        "currency": "string",
        "latency": 0
      }
    },
    "created_at": "2025-01-13T10:00:00Z"
  },
  "message": "技术包装完成"
}
```

**获取生成内容**:
```bash
# 从工作流执行记录中获取技术包装内容
GET /api/workflow-executions/:executionId
# 响应中的 outputs.tech_package 字段包含技术包装数据
```

### 3. 技术策略接口

**端点**: `POST /api/v1/ai-search/conversations/:conversationId/messages`

**描述**: 通过AI搜索模块调用技术策略应用。

**重要变更**: 
- ⚠️ 旧的 `/api/tech-promotion/*` 端点已废弃
- ✅ 请使用 `/api/v1/ai-search/conversations/:conversationId/messages` 端点
- ✅ 生成的内容存储在 `workflow_executions.outputs.promotion_strategy` 字段中

### 4. 技术通稿接口

**端点**: `POST /api/v1/ai-search/conversations/:conversationId/messages`

**描述**: 通过AI搜索模块调用技术通稿应用。

**重要变更**: 
- ⚠️ 旧的 `/api/tech-press/*` 端点已废弃
- ✅ 请使用 `/api/v1/ai-search/conversations/:conversationId/messages` 端点
- ✅ 生成的内容存储在 `workflow_executions.outputs.press_release` 字段中

### 5. 技术发布接口

**端点**: `POST /api/v1/ai-search/conversations/:conversationId/messages`

**描述**: 通过AI搜索模块调用技术发布应用。

**请求/响应格式**: 与技术包装接口相同

## 错误处理

### 参数验证错误 (400)

```json
{
  "success": false,
  "error": "Validation failed",
  "message": "请求参数验证失败",
  "details": [
    {
      "field": "query",
      "message": "Query parameter is required",
      "value": null
    }
  ]
}
```

### 服务器错误 (500)

```json
{
  "success": false,
  "error": "具体错误信息",
  "message": "操作失败"
}
```

## 数据验证

所有接口都包含以下验证机制：

1. **请求参数验证**: 检查必需参数和数据类型
2. **响应数据验证**: 验证返回数据的完整性和格式
3. **错误处理**: 统一的错误响应格式

## 环境配置

确保在 `.env` 文件中配置以下环境变量：

```env
# Dify API配置
DIFY_BASE_URL=https://api.dify.ai/v1
DIFY_WORKFLOW_BASE_URL=http://47.113.225.93/v1

# AI搜索应用
AI_SEARCH_API_KEY=app-DJzEj8nSOqkVXaMmvyhPoYEN

# 技术应用API密钥
TECH_PACKAGE_API_KEY=app-Ej8nSOqkVXaMmvyhPoYENDJz
TECH_STRATEGY_API_KEY=app-SOqkVXaMmvyhPoYENDJzEj8n
TECH_ARTICLE_API_KEY=app-VXaMmvyhPoYENDJzEj8nSOqk
TECH_PUBLISH_API_KEY=app-MmvyhPoYENDJzEj8nSOqkVXa
```

## ⚠️ 重要变更说明

### 数据库清理影响

**清理时间**: 2025-01-13  
**影响范围**: 技术包装、推广策略、技术通稿相关API

**变更内容**:
1. **13个表已移除**: tech_packaging_materials, tech_promotion_strategies, tech_press_releases 等
2. **数据存储策略**: AI生成内容现在存储在 `workflow_executions.outputs` 字段中（JSON格式）
3. **API端点废弃**: `/api/tech-packaging/*`, `/api/tech-promotion/*`, `/api/tech-press/*` 已废弃

**迁移指南**:
- 旧API: `GET /api/tech-packaging/:id`
- 新API: `GET /api/workflow-executions/:executionId` → 查看 `outputs.tech_package` 字段

详细迁移指南请参考: [API_DOCUMENTATION_V2.md](./API_DOCUMENTATION_V2.md)

## 注意事项

1. AI搜索接口使用聊天消息API (`/chat-messages`)
2. 技术应用接口使用聊天消息API (`/chat-messages`)
3. 所有接口都支持阻塞模式响应
4. 响应数据会进行格式验证，验证失败会在控制台输出警告
5. 建议在生产环境中添加适当的限流和缓存机制
6. ⚠️ **废弃API**: 请勿使用 `/api/tech-packaging/*`, `/api/tech-promotion/*`, `/api/tech-press/*` 端点