# API 契约文档

本文档描述了 Todify2 前后端统一的 API 契约规范。

## 统一响应格式

所有 API 响应遵循以下统一格式：

```typescript
interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiErrorPayload;
  message?: string;
}

interface ApiErrorPayload {
  code: string;
  message: string;
  details?: unknown;
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
      "errors": [
        {
          "field": "query",
          "message": "Query parameter is required",
          "value": null
        }
      ]
    }
  }
}
```

## 标准错误代码

| 错误代码 | 说明 | HTTP 状态码 |
|---------|------|------------|
| `VALIDATION_ERROR` | 请求参数验证失败 | 400 |
| `UNAUTHORIZED` | 未授权 | 401 |
| `FORBIDDEN` | 禁止访问 | 403 |
| `NOT_FOUND` | 资源不存在 | 404 |
| `DIFY_CHAT_ERROR` | Dify 聊天服务调用失败 | 500 |
| `DIFY_WORKFLOW_ERROR` | Dify 工作流服务调用失败 | 500 |
| `AI_SEARCH_FAILED` | AI 搜索执行失败 | 500 |
| `WORKFLOW_EXECUTION_FAILED` | 工作流执行失败 | 500 |
| `INTERNAL_ERROR` | 服务器内部错误 | 500 |

## 分页响应格式

对于列表接口，使用分页响应格式：

```typescript
interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}
```

## 验证错误响应

当请求参数验证失败时，返回详细的验证错误：

```typescript
interface ValidationErrorResponse extends ApiResponse<never> {
  error: {
    code: 'VALIDATION_ERROR';
    message: '请求参数验证失败';
    details: {
      errors: Array<{
        field: string;
        message: string;
        value?: unknown;
      }>;
    };
  };
}
```

## 使用示例

### 后端控制器

```typescript
import { createSuccessResponse, createErrorResponse } from '@/shared/types/api';

// 成功响应
res.json(createSuccessResponse(data, '操作成功'));

// 错误响应
res.status(500).json(
  createErrorResponse('ERROR_CODE', '错误消息', errorDetails)
);
```

### 前端调用

```typescript
import { apiClient } from '@/shared/lib/api/apiClient';

const response = await apiClient.post<DataType>('/api/endpoint', payload);

if (response.success) {
  // 处理成功响应
  console.log(response.data);
} else {
  // 处理错误响应
  console.error(response.error?.message);
}
```

## 文件位置

- **后端类型定义**: `backend/src/shared/types/api.ts`
- **前端类型定义**: `frontend/src/shared/types/api.ts`
- **后端响应工具函数**: `backend/src/shared/types/api.ts` (createSuccessResponse, createErrorResponse)
- **前端 API 客户端**: `frontend/src/shared/lib/api/apiClient.ts`

## 迁移指南

### 后端迁移

1. 导入统一类型和工具函数：
```typescript
import { createSuccessResponse, createErrorResponse } from '@/shared/types/api';
```

2. 替换旧的响应格式：
```typescript
// 旧代码
res.json({ success: true, data: result });

// 新代码
res.json(createSuccessResponse(result));
```

### 前端迁移

1. 导入统一类型：
```typescript
import type { ApiResponse } from '@/shared/types/api';
```

2. `apiClient` 已自动使用统一类型，无需修改调用代码。

## 注意事项

1. 所有 API 响应必须使用统一的 `ApiResponse<T>` 格式
2. 错误响应必须包含 `code` 和 `message` 字段
3. 验证错误应使用 `createValidationErrorResponse` 函数
4. 前后端类型定义应保持一致

