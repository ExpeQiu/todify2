# 技术文档

## 1. 系统架构

基于 `system-architecture.md` 和 `后端项目架构规划.md` 的规划，Todify3 采用前后端分离的现代 Web 应用架构。

### 1.1 总体架构图

系统技术架构图如下所示，展示了前端、后端、数据库和 Dify API 之间的交互关系。

```mermaid
graph TD
    A[用户浏览器] --> B{前端 (React + Vite)};
    B --> C{后端 (Node.js + Express.js)};
    C --> D[数据库 (Prisma + SQLite/PostgreSQL)];
    C --> E[Dify API];
    E --> C;
    D --> C;
```

### 1.2 技术栈

*   **前端**: React, TypeScript, Vite, CSS Modules
*   **后端**: Node.js, Express.js, TypeScript
*   **数据库**: SQLite (开发), PostgreSQL (生产)
*   **ORM**: Prisma
*   **核心 AI 服务**: Dify API
*   **部署**: Docker, Nginx

## 2. 后端设计

后端遵循 `后端项目架构规划.md` 中定义的分层架构，以实现高内聚、低耦合的设计目标。

### 2.1 核心数据模型 (Prisma Schema)

核心数据模型围绕 `WorkflowDefinition`, `FieldMapping`, 和 `Task` 构建。

```prisma
// schema.prisma

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

// 用户模型
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  tasks     Task[]
}

// 工作流任务模型
model Task {
  id          String    @id @default(cuid())
  userId      String
  user        User      @relation(fields: [userId], references: [id])
  workflowId  String    // 关联到 Dify 的工作流 ID
  status      String    // e.g., 'pending', 'processing', 'completed', 'failed'
  inputData   Json      // 用户输入的数据
  outputData  Json?     // Dify 返回的生成结果
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

// 字段映射配置 (存储为 JSON 文件或数据库记录)
// 此部分将通过配置文件管理，以实现动态映射

```

### 2.2 API 设计

API 遵循 RESTful 风格，核心端点如下：

*   `POST /api/v1/workflows/run`: 异步启动一个工作流任务。
    *   **Request Body**: `{ "workflowId": "dify-workflow-123", "inputs": { "query": "React Hooks" } }`
    *   **Response**: `{ "taskId": "task-abc-456" }`
*   `GET /api/v1/tasks/:taskId`: 查询任务状态和结果。
    *   **Response**: `{ "taskId": "...", "status": "completed", "result": { ... } }`
*   `POST /api/v1/documents`: 保存用户修订后的文档。
*   `GET /api/v1/documents/:docId/export/pdf`: 导出文档为 PDF。

### 2.3 Dify API 集成 (`DifyClient`)

将创建一个 `DifyClient` 类来封装与 Dify API 的所有交互，包括认证、请求构建和响应处理。

```typescript
// src/services/difyClient.ts

import axios from 'axios';

class DifyClient {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.DIFY_API_KEY || '';
    this.baseUrl = process.env.DIFY_API_URL || '';
  }

  async runWorkflow(workflowId: string, inputs: Record<string, any>, isStreaming: boolean = false) {
    const headers = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    };

    const body = {
      inputs,
      response_mode: isStreaming ? 'streaming' : 'blocking',
      user: 'todify-user-1', // 标识用户
    };

    const response = await axios.post(`${this.baseUrl}/workflows/${workflowId}/run`, body, { headers });
    return response.data;
  }
}

export default new DifyClient();
```

## 3. 前端设计

前端将使用 React 和 TypeScript 构建一个单页面应用 (SPA)。

### 3.1 组件结构

*   `App.tsx`: 应用根组件，管理路由。
*   `pages/WorkflowPage.tsx`: 核心工作流页面，包含五个步骤的 UI。
*   `components/Step1_Search.tsx`: 搜索步骤组件。
*   `components/Step2_TechnicalPackage.tsx`: 技术包装步骤组件。
*   `components/Step3_Promotion.tsx`: 推广策略步骤组件。
*   `components/Step4_CoreDraft.tsx`: 核心稿确认组件。
*   `components/Step5_Speech.tsx`: 演讲稿生成组件。
*   `components/common/LoadingSpinner.tsx`: 加载动画。
*   `components/common/PdfExporter.tsx`: PDF 导出按钮。

### 3.2 状态管理

*   **本地状态**: 使用 React Hooks (`useState`, `useReducer`) 管理组件内部状态。
*   **全局状态**: 对于跨组件共享的状态（如用户信息、当前工作流数据），将使用 React Context 或一个轻量级的状态管理库（如 Zustand）。

## 4. 数据流

数据流设计遵循 `data-flow-management.md` 中的原则，确保前端和后端之间的数据交换高效、可靠。

1.  **启动工作流**: 用户在前端点击“生成”按钮，前端向后端发送 `POST /api/v1/workflows/run` 请求。
2.  **异步任务**: 后端创建一个 `Task` 记录，并异步调用 `DifyClient` 来与 Dify API 交互。
3.  **状态轮询**: 前端定期轮询 `GET /api/v1/tasks/:taskId` 来获取任务状态。
4.  **结果展示**: 任务完成后，前端获取结果并将其展示在相应的步骤组件中。
5.  **保存与导出**: 用户编辑后，通过 `POST /api/v1/documents` 保存，或通过 `GET /api/v1/documents/:docId/export/pdf` 导出。