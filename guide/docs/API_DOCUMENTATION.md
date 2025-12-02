# Dify API 接口文档

## 概述

本文档描述了与Dify平台集成的API接口，包括AI搜索和技术应用相关的接口。

## 基础信息

- **基础URL**: `http://localhost:3001`
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

**端点**: `POST /tech-package`

**描述**: 调用技术包装应用，用于技术内容的包装和优化。

**请求参数**:
```json
{
  "inputs": {
    "query": "string - 查询内容",
    "...": "其他输入参数"
  }
}
```

**响应格式**:
```json
{
  "success": true,
  "data": {
    "id": "string - 响应ID",
    "answer": "string - 处理结果",
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
    "created_at": 0
  },
  "message": "技术包装完成"
}
```

### 3. 技术策略接口

**端点**: `POST /tech-strategy`

**描述**: 调用技术策略应用，用于技术策略的制定和分析。

**请求/响应格式**: 与技术包装接口相同

### 4. 技术通稿接口

**端点**: `POST /tech-article`

**描述**: 调用技术通稿应用，用于技术文章和通稿的生成。

**请求/响应格式**: 与技术包装接口相同

### 5. 技术发布接口

**端点**: `POST /tech-publish`

**描述**: 调用技术发布应用，用于技术内容的发布和推广。

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

## 注意事项

1. AI搜索接口使用聊天消息API (`/chat-messages`)
2. 技术应用接口使用聊天消息API (`/chat-messages`)
3. 所有接口都支持阻塞模式响应
4. 响应数据会进行格式验证，验证失败会在控制台输出警告
5. 建议在生产环境中添加适当的限流和缓存机制