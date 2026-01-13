# Todify4 API 接口文档 v2.0

**最后更新**: 2025-01-13  
**API版本**: v2.0  
**基础URL**: `http://localhost:8113/api` (开发环境)

---

## 📋 目录

1. [概述](#概述)
2. [基础信息](#基础信息)
3. [统一响应格式](#统一响应格式)
4. [核心API端点](#核心api端点)
5. [废弃的API端点](#废弃的api端点)
6. [错误处理](#错误处理)
7. [数据模型](#数据模型)

---

## 概述

本文档描述了 Todify4 项目的完整 REST API 接口。API 采用 RESTful 风格设计，所有响应遵循统一的格式规范。

### 重要变更 (v2.0)

- ⚠️ **数据库清理**: 13个表已移除，采用JSON存储策略
- ⚠️ **废弃API**: 3组API端点已废弃（tech-packaging, tech-promotion, tech-press）
- ✅ **新API**: workflow-executions API 用于获取AI生成内容

---

## 基础信息

### 基础URL

- **开发环境**: `http://localhost:8113/api`
- **生产环境**: 根据部署配置

### 内容类型

- **请求**: `application/json`
- **响应**: `application/json`

### 认证方式

当前版本无需认证，未来版本可能添加 JWT Token 认证。

---

## 统一响应格式

所有 API 响应遵循以下统一格式：

```typescript
interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  message?: string;
}
```

### 成功响应示例

```json
{
  "success": true,
  "data": {
    "id": "123",
    "name": "示例数据"
  },
  "message": "操作成功"
}
```

### 错误响应示例

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "请求参数验证失败",
    "details": {
      "field": "query",
      "message": "Query parameter is required"
    }
  }
}
```

---

## 核心API端点

### 1. 项目管理 API

#### 1.1 创建项目

**端点**: `POST /api/projects`

**描述**: 创建新项目

**请求体**:
```json
{
  "name": "项目名称",
  "description": "项目描述",
  "cover_image": "封面图片URL",
  "icon": "图标URL",
  "type": "normal" | "featured"
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "项目名称",
    "description": "项目描述",
    "created_at": "2025-01-13T10:00:00Z"
  }
}
```

#### 1.2 获取项目列表

**端点**: `GET /api/projects`

**查询参数**:
- `type`: `normal` | `featured` (可选)
- `status`: `active` | `archived` | `deleted` (可选)
- `page`: 页码 (可选，默认1)
- `pageSize`: 每页数量 (可选，默认10)

**响应**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "项目名称",
      "description": "项目描述",
      "type": "normal",
      "status": "active",
      "created_at": "2025-01-13T10:00:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

#### 1.3 获取项目详情

**端点**: `GET /api/projects/:id`

**路径参数**:
- `id`: 项目ID

**响应**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "项目名称",
    "description": "项目描述",
    "tech_points": [],
    "knowledge_points": [],
    "sources": [],
    "files": []
  }
}
```

#### 1.4 获取精选项目

**端点**: `GET /api/projects/featured`

**响应**: 与获取项目列表相同

#### 1.5 获取最近项目

**端点**: `GET /api/projects/recent`

**查询参数**:
- `limit`: 返回数量 (可选，默认10)

**响应**: 与获取项目列表相同

#### 1.6 更新项目

**端点**: `PUT /api/projects/:id`

**请求体**: 与创建项目相同（所有字段可选）

#### 1.7 删除项目

**端点**: `DELETE /api/projects/:id`

---

### 2. AI搜索 API

#### 2.1 创建对话

**端点**: `POST /api/v1/ai-search/conversations`

**描述**: 创建新的AI搜索对话会话

**请求体**:
```json
{
  "session_name": "会话名称",
  "app_type": "ai-search" | "tech-package" | "tech-strategy" | "tech-article",
  "project_id": 1
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "conversation_id": "conv-123",
    "session_name": "会话名称",
    "app_type": "ai-search",
    "created_at": "2025-01-13T10:00:00Z"
  }
}
```

#### 2.2 获取对话列表

**端点**: `GET /api/v1/ai-search/conversations`

**查询参数**:
- `app_type`: 应用类型 (可选)
- `project_id`: 项目ID (可选)
- `page`: 页码 (可选)
- `pageSize`: 每页数量 (可选)

**响应**:
```json
{
  "success": true,
  "data": [
    {
      "conversation_id": "conv-123",
      "session_name": "会话名称",
      "app_type": "ai-search",
      "created_at": "2025-01-13T10:00:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 10,
    "total": 100
  }
}
```

#### 2.3 发送消息

**端点**: `POST /api/v1/ai-search/conversations/:conversationId/messages`

**描述**: 向AI发送消息并获取回复

**路径参数**:
- `conversationId`: 对话ID

**请求体**:
```json
{
  "query": "用户问题",
  "inputs": {
    "key": "value"
  }
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "message_id": "msg-123",
    "conversation_id": "conv-123",
    "content": "AI回复内容",
    "metadata": {
      "usage": {
        "prompt_tokens": 100,
        "completion_tokens": 200,
        "total_tokens": 300
      }
    }
  }
}
```

#### 2.4 触发专家工具

**端点**: `POST /api/v1/ai-search/conversations/:conversationId/agents`

**描述**: 触发专家工具（Consult_Tech, Consult_Scene等）

**路径参数**:
- `conversationId`: 对话ID

**请求体**:
```json
{
  "feature_type": "five-view-analysis" | "three-fix-analysis" | "tech-matrix" | "propagation-strategy" | "script" | "ppt-outline",
  "inputs": {
    "query": "用户问题",
    "techDocument": "技术文档内容"
  }
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "result": "专家工具分析结果",
    "tool_name": "Consult_Tech",
    "execution_id": "exec-123"
  }
}
```

#### 2.5 获取工具事件（SSE）

**端点**: `GET /api/v1/ai-search/tool-events/:conversationId`

**描述**: 通过Server-Sent Events实时获取工具执行状态

**事件类型**:
- `tool_start`: 工具开始执行
- `tool_progress`: 工具执行进度
- `tool_complete`: 工具执行完成
- `tool_error`: 工具执行错误

**事件格式**:
```
event: tool_start
data: {"tool_name": "Consult_Tech", "status": "started"}

event: tool_progress
data: {"tool_name": "Consult_Tech", "progress": 50, "message": "正在分析..."}

event: tool_complete
data: {"tool_name": "Consult_Tech", "result": "分析结果"}
```

---

### 3. 工作流执行 API

#### 3.1 获取工作流执行详情

**端点**: `GET /api/workflow-executions/:id`

**描述**: 获取工作流执行记录，包含AI生成的内容（存储在outputs字段中）

**路径参数**:
- `id`: 工作流执行ID

**响应**:
```json
{
  "success": true,
  "data": {
    "id": "exec-123",
    "execution_type": "dify_workflow",
    "status": "completed",
    "inputs": {
      "query": "用户输入"
    },
    "outputs": {
      "tech_package": {
        "title": "技术包装标题",
        "content": "技术包装内容..."
      },
      "promotion_strategy": {
        "title": "推广策略标题",
        "content": "推广策略内容..."
      },
      "press_release": {
        "title": "技术通稿标题",
        "content": "技术通稿内容..."
      }
    },
    "created_at": "2025-01-13T10:00:00Z"
  }
}
```

**重要说明**: 
- `outputs` 字段包含所有AI生成的内容（技术包装、推广策略、通稿、演讲稿等）
- 这些内容采用JSON存储策略，不再使用独立的表

---

### 4. 技术点 API

#### 4.1 创建技术点

**端点**: `POST /api/tech-points`

**请求体**:
```json
{
  "name": "技术点名称",
  "description": "技术点描述",
  "category_id": 1,
  "tech_type": "feature" | "technology" | "innovation" | "improvement",
  "priority": "low" | "medium" | "high" | "critical"
}
```

#### 4.2 获取技术点列表

**端点**: `GET /api/tech-points`

**查询参数**:
- `category_id`: 分类ID (可选)
- `tech_type`: 技术类型 (可选)
- `priority`: 优先级 (可选)
- `search`: 搜索关键词 (可选)
- `page`: 页码 (可选)
- `pageSize`: 每页数量 (可选)

#### 4.3 获取技术点详情

**端点**: `GET /api/tech-points/:id`

**响应**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "技术点名称",
    "description": "技术点描述",
    "packaging_materials": [],
    "promotion_strategies": [],
    "press_releases": [],
    "speeches": []
  }
}
```

**注意**: `packaging_materials`、`promotion_strategies` 等字段现在返回空数组，因为对应的表已移除。实际数据请从 `workflow_executions.outputs` 中查询。

#### 4.4 获取技术点树形结构

**端点**: `GET /api/tech-points/tree`

**响应**: 返回层级结构的技术点树

#### 4.5 搜索技术点

**端点**: `GET /api/tech-points/search`

**查询参数**:
- `q`: 搜索关键词

#### 4.6 同步技术点

**端点**: `POST /api/tech-points/sync`

**描述**: 从TPD2项目同步技术点

---

### 5. 对话与消息 API

#### 5.1 获取对话列表

**端点**: `GET /api/chat/conversations`

**查询参数**:
- `app_type`: 应用类型 (可选)
- `project_id`: 项目ID (可选)

#### 5.2 获取对话消息

**端点**: `GET /api/chat/conversations/:conversationId/messages`

**路径参数**:
- `conversationId`: 对话ID

**响应**:
```json
{
  "success": true,
  "data": [
    {
      "message_id": "msg-123",
      "message_type": "user" | "assistant",
      "content": "消息内容",
      "created_at": "2025-01-13T10:00:00Z"
    }
  ]
}
```

#### 5.3 获取工作流执行记录

**端点**: `GET /api/chat/workflow-executions/:workflowRunId`

**路径参数**:
- `workflowRunId`: 工作流运行ID

---

### 6. 来源信息 API

#### 6.1 创建来源信息

**端点**: `POST /api/source-information`

**请求体**:
```json
{
  "source_id": "source-123",
  "title": "来源标题",
  "type": "knowledge_base" | "external",
  "url": "来源URL",
  "description": "来源描述",
  "page_type": "tech-package" | "press-release" | "tech-strategy" | "tech-article",
  "project_id": 1
}
```

#### 6.2 获取来源信息列表

**端点**: `GET /api/source-information`

**查询参数**:
- `project_id`: 项目ID (可选)
- `type`: 来源类型 (可选)
- `page_type`: 页面类型 (可选)

---

### 7. AI角色配置 API

#### 7.1 获取AI角色列表

**端点**: `GET /api/ai-roles`

**查询参数**:
- `source`: 来源类型 (可选)
- `enabled`: 是否启用 (可选)

**响应**:
```json
{
  "success": true,
  "data": [
    {
      "id": "independent-page-tech-package",
      "name": "技术包装主控",
      "description": "技术包装主控Agent",
      "enabled": true,
      "source": "independent-page"
    }
  ]
}
```

#### 7.2 获取AI角色详情

**端点**: `GET /api/ai-roles/:id`

---

### 8. 文件管理 API

#### 8.1 上传文件

**端点**: `POST /api/files/upload`

**Content-Type**: `multipart/form-data`

**请求体**:
- `file`: 文件对象

**响应**:
```json
{
  "success": true,
  "data": {
    "file_id": "file-123",
    "original_name": "document.pdf",
    "file_url": "/uploads/files/file-123.pdf",
    "file_size": 1024000,
    "mime_type": "application/pdf"
  }
}
```

#### 8.2 获取文件信息

**端点**: `GET /api/files/:fileId`

---

## 废弃的API端点

### ⚠️ 重要说明

以下API端点已废弃，对应的数据库表已移除。这些端点将返回错误或空数据。

**替代方案**: 请使用 `/api/workflow-executions/:id` API 获取数据，数据存储在 `outputs` 字段中。

### 1. 技术包装材料 API (已废弃)

**基础路径**: `/api/tech-packaging`

**端点**:
- `POST /api/tech-packaging` - 创建技术包装材料 ❌
- `GET /api/tech-packaging/:id` - 获取技术包装材料 ❌
- `PUT /api/tech-packaging/:id` - 更新技术包装材料 ❌
- `POST /api/tech-packaging/:id/conversations` - 添加对话关联 ❌
- `DELETE /api/tech-packaging/:id/conversations` - 移除对话关联 ❌
- `POST /api/tech-packaging/:id/sources` - 添加来源关联 ❌
- `DELETE /api/tech-packaging/:id/sources` - 移除来源关联 ❌

**替代方案**: 
```bash
# 从工作流执行记录中获取技术包装材料
GET /api/workflow-executions/:id
# 响应中的 outputs.tech_package 字段包含技术包装材料数据
```

### 2. 技术推广策略 API (已废弃)

**基础路径**: `/api/tech-promotion`

**端点**:
- `POST /api/tech-promotion` - 创建技术推广策略 ❌
- `GET /api/tech-promotion/:id` - 获取技术推广策略 ❌
- `PUT /api/tech-promotion/:id` - 更新技术推广策略 ❌
- `POST /api/tech-promotion/:id/conversations` - 添加对话关联 ❌
- `DELETE /api/tech-promotion/:id/conversations` - 移除对话关联 ❌
- `POST /api/tech-promotion/:id/sources` - 添加来源关联 ❌
- `DELETE /api/tech-promotion/:id/sources` - 移除来源关联 ❌

**替代方案**: 
```bash
# 从工作流执行记录中获取推广策略
GET /api/workflow-executions/:id
# 响应中的 outputs.promotion_strategy 字段包含推广策略数据
```

### 3. 技术通稿 API (已废弃)

**基础路径**: `/api/tech-press`

**端点**:
- `POST /api/tech-press` - 创建技术通稿 ❌
- `GET /api/tech-press/:id` - 获取技术通稿 ❌
- `PUT /api/tech-press/:id` - 更新技术通稿 ❌
- `POST /api/tech-press/:id/conversations` - 添加对话关联 ❌
- `DELETE /api/tech-press/:id/conversations` - 移除对话关联 ❌
- `POST /api/tech-press/:id/sources` - 添加来源关联 ❌
- `DELETE /api/tech-press/:id/sources` - 移除来源关联 ❌

**替代方案**: 
```bash
# 从工作流执行记录中获取技术通稿
GET /api/workflow-executions/:id
# 响应中的 outputs.press_release 字段包含技术通稿数据
```

---

## 错误处理

### 标准错误代码

| 错误代码 | 说明 | HTTP 状态码 |
|---------|------|------------|
| `VALIDATION_ERROR` | 请求参数验证失败 | 400 |
| `UNAUTHORIZED` | 未授权 | 401 |
| `FORBIDDEN` | 禁止访问 | 403 |
| `NOT_FOUND` | 资源不存在 | 404 |
| `TABLE_NOT_FOUND` | 表不存在（废弃API） | 500 |
| `DIFY_CHAT_ERROR` | Dify 聊天服务调用失败 | 500 |
| `DIFY_WORKFLOW_ERROR` | Dify 工作流服务调用失败 | 500 |
| `AI_SEARCH_FAILED` | AI 搜索执行失败 | 500 |
| `WORKFLOW_EXECUTION_FAILED` | 工作流执行失败 | 500 |
| `INTERNAL_ERROR` | 服务器内部错误 | 500 |

### 错误响应示例

```json
{
  "success": false,
  "error": {
    "code": "TABLE_NOT_FOUND",
    "message": "tech_packaging_materials 表不存在，请使用 workflow_executions API",
    "details": {
      "alternative_endpoint": "/api/workflow-executions/:id",
      "data_location": "outputs.tech_package"
    }
  }
}
```

---

## 数据模型

### 工作流执行记录 (WorkflowExecution)

```typescript
interface WorkflowExecution {
  id: string;
  execution_type: 'agent_workflow' | 'dify_workflow';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  inputs: Record<string, any>;
  outputs: {
    // AI生成的内容存储在outputs字段中
    tech_package?: {
      title: string;
      content: string;
      material_type?: string;
      target_audience?: string;
      generated_at: string;
    };
    promotion_strategy?: {
      title: string;
      content: string;
      strategy_type?: string;
      generated_at: string;
    };
    press_release?: {
      title: string;
      content: string;
      release_type?: string;
      generated_at: string;
    };
    speech?: {
      title: string;
      content: string;
      speech_type?: string;
      generated_at: string;
    };
  };
  created_at: string;
  updated_at: string;
}
```

### 项目 (Project)

```typescript
interface Project {
  id: number;
  name: string;
  description?: string;
  cover_image?: string;
  icon?: string;
  type: 'normal' | 'featured';
  status: 'active' | 'archived' | 'deleted';
  created_at: string;
  updated_at: string;
  last_opened_at?: string;
}
```

### 技术点 (TechPoint)

```typescript
interface TechPoint {
  id: number;
  name: string;
  description?: string;
  category_id?: number;
  tech_type: 'feature' | 'technology' | 'innovation' | 'improvement';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'inactive' | 'archived';
  tags?: string[];
  created_at: string;
  updated_at: string;
}
```

---

## 迁移指南

### 从废弃API迁移到新API

#### 示例1: 获取技术包装材料

**旧方式** (已废弃):
```bash
GET /api/tech-packaging/:id
```

**新方式**:
```bash
# 1. 找到关联的工作流执行ID（从conversation或message中获取）
GET /api/workflow-executions/:executionId

# 2. 从响应中提取技术包装材料
# 响应中的 outputs.tech_package 字段包含数据
```

#### 示例2: 获取项目的技术包装材料

**旧方式** (已废弃):
```bash
GET /api/projects/:id
# 响应中的 packaging_materials 字段现在返回空数组
```

**新方式**:
```bash
# 1. 获取项目的对话列表
GET /api/projects/:id/conversations

# 2. 从对话关联的工作流执行中获取数据
GET /api/workflow-executions/:executionId
# 响应中的 outputs.tech_package 字段包含数据
```

---

## 环境配置

确保在 `.env` 文件中配置以下环境变量：

```env
# 服务器配置
PORT=8113
NODE_ENV=development

# 数据库配置
DB_TYPE=sqlite
SQLITE_DB_PATH=./data/todify2.db

# Dify API配置
DIFY_BASE_URL=https://api.dify.ai/v1
DIFY_WORKFLOW_BASE_URL=http://47.113.225.93/v1

# AI搜索应用
AI_SEARCH_API_KEY=app-xxx

# 技术应用API密钥
TECH_PACKAGE_API_KEY=app-xxx
TECH_STRATEGY_API_KEY=app-xxx
TECH_ARTICLE_API_KEY=app-xxx
TECH_PUBLISH_API_KEY=app-xxx
```

---

## 注意事项

1. **废弃API**: 所有 `/api/tech-packaging/*`、`/api/tech-promotion/*`、`/api/tech-press/*` 端点已废弃
2. **数据存储**: AI生成内容存储在 `workflow_executions.outputs` 字段中
3. **向后兼容**: 废弃的API端点暂时保留，但会返回错误或空数据
4. **迁移建议**: 尽快迁移到新的 `workflow-executions` API

---

**文档版本**: v2.0  
**最后更新**: 2025-01-13  
**维护者**: Todify4 Team
