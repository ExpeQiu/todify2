# 项目关联关系分析报告

## 概述

本文档分析项目中"已关联技术信息"和"AI共创信息"的数据库关联关系，确保所有关联都按照项目ID正确建立。

## 一、已关联技术信息

### 1.1 技术点（Tech Points）

**关联表**: `project_tech_points`

**表结构**:
```sql
CREATE TABLE project_tech_points (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    tech_point_id INTEGER NOT NULL,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (tech_point_id) REFERENCES tech_points(id) ON DELETE CASCADE,
    UNIQUE(project_id, tech_point_id)
);
```

**查询方式**:
```typescript
// backend/src/models/Project.ts
async getTechPoints(projectId: number): Promise<TechPoint[]> {
  const sql = `
    SELECT tp.* FROM tech_points tp
    INNER JOIN project_tech_points ptp ON tp.id = ptp.tech_point_id
    WHERE ptp.project_id = ?
  `;
  return await this.db.query(sql, [projectId]);
}
```

**状态**: ✅ 已正确建立关联

---

### 1.2 知识点（Knowledge Points）

**关联表**: `project_knowledge_points`

**表结构**:
```sql
CREATE TABLE project_knowledge_points (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    knowledge_point_id INTEGER NOT NULL,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (knowledge_point_id) REFERENCES knowledge_points(id) ON DELETE CASCADE,
    UNIQUE(project_id, knowledge_point_id)
);
```

**查询方式**:
```typescript
// backend/src/models/Project.ts
async getKnowledgePoints(projectId: number): Promise<KnowledgePoint[]> {
  const sql = `
    SELECT kp.* FROM knowledge_points kp
    INNER JOIN project_knowledge_points pkp ON kp.id = pkp.knowledge_point_id
    WHERE pkp.project_id = ?
  `;
  return await this.db.query(sql, [projectId]);
}
```

**状态**: ✅ 已正确建立关联

---

### 1.3 文件（Files）

**关联表**: `project_files`

**表结构**:
```sql
CREATE TABLE project_files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    file_id TEXT NOT NULL,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (file_id) REFERENCES files(file_id) ON DELETE CASCADE,
    UNIQUE(project_id, file_id)
);
```

**查询方式**:
```typescript
// backend/src/models/Project.ts
async getFiles(projectId: number): Promise<any[]> {
  const sql = `
    SELECT f.* FROM files f
    INNER JOIN project_files pf ON f.file_id = pf.file_id
    WHERE pf.project_id = ?
  `;
  return await this.db.query(sql, [projectId]);
}
```

**状态**: ✅ 已正确建立关联

---

### 1.4 来源信息（Source Information）

**关联表**: `project_source_informations`

**表结构**:
```sql
CREATE TABLE project_source_informations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    source_information_id INTEGER NOT NULL,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (source_information_id) REFERENCES source_information(id) ON DELETE CASCADE,
    UNIQUE(project_id, source_information_id)
);
```

**查询方式**:
```typescript
// backend/src/models/SourceInformation.ts
async findByProjectId(projectId: number): Promise<SourceInformation[]> {
  const sql = `
    SELECT DISTINCT si.* FROM source_information si
    INNER JOIN project_source_informations psi ON si.id = psi.source_information_id
    WHERE psi.project_id = ? AND si.status = 'active'
    
    UNION
    
    SELECT * FROM source_information
    WHERE page_type = ? AND status = 'active'
    
    ORDER BY created_at DESC
  `;
  return await this.db.query(sql, [projectId, `project-${projectId}`]);
}
```

**注意**: 此查询支持两种方式：
1. 通过关联表 `project_source_informations` 查询（新方式）
2. 通过 `page_type = 'project-{projectId}'` 查询（旧方式，兼容性）

**状态**: ✅ 已正确建立关联（支持新旧两种方式）

---

## 二、AI共创信息

### 2.1 对话记录（Conversations）

**关联方式**: 直接在 `conversations` 表中使用 `project_id` 字段

**表结构**:
```sql
CREATE TABLE conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conversation_id TEXT UNIQUE NOT NULL,
    user_id TEXT,
    session_name TEXT,
    app_type TEXT NOT NULL,
    project_id INTEGER,  -- 关联的项目ID
    status TEXT DEFAULT 'active',
    metadata TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
);

CREATE INDEX idx_conversations_project_id ON conversations(project_id);
```

**查询方式**:
```typescript
// backend/src/services/ChatMessageService.ts
static async getConversationsByProjectId(
  projectId: number,
  limit: number = 50,
  offset: number = 0
): Promise<ConversationRecord[]> {
  const sql = `
    SELECT * FROM conversations
    WHERE project_id = ? AND status != 'deleted'
    ORDER BY updated_at DESC
    LIMIT ? OFFSET ?
  `;
  return await this.db.query(sql, [projectId, limit, offset]);
}
```

**保存方式**:
```typescript
// backend/src/services/ChatMessageService.ts
static async upsertConversation(data: ConversationData): Promise<void> {
  const sql = `
    INSERT INTO conversations (
      conversation_id, user_id, session_name, app_type, status, project_id, metadata, updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(conversation_id) DO UPDATE SET
      project_id = COALESCE(excluded.project_id, project_id),
      ...
  `;
  await db.query(sql, [
    data.conversation_id,
    data.user_id || null,
    data.session_name || null,
    data.app_type,
    data.status || 'active',
    data.project_id || null,  // 项目ID
    data.metadata ? JSON.stringify(data.metadata) : null
  ]);
}
```

**状态**: ✅ 已正确建立关联（需要确保数据库已执行迁移脚本）

---

## 三、前端数据加载流程

### 3.1 ProjectSidebar 组件

**位置**: `frontend/src/components/project/ProjectSidebar.tsx`

**数据加载流程**:

```typescript
const loadData = async () => {
  // 1. 加载资源（文件、互联网信息）
  const sourcesResult = await sourceService.loadSourceInformationByProjectId(project.id);
  const sources = sourcesResult.success && sourcesResult.data ? sourcesResult.data : [];
  const files = sources.filter(s => s.type === 'file');
  const internetInfo = sources.filter(s => s.type === 'url' || s.type === 'text');

  // 2. 加载技术点和知识点
  const detailsResponse = await api.get(`/projects/${project.id}/details`);
  const techPoints = detailsResponse.data?.success && detailsResponse.data?.data?.techPoints || [];
  const knowledgePoints = detailsResponse.data?.success && detailsResponse.data?.data?.knowledgePoints || [];

  // 3. 加载对话记录
  const convs = await ProjectConversationService.getProjectConversations(project.id);
  setConversations(convs);
};
```

**API 端点**:
- `/api/v1/projects/:id/details` - 获取项目详情（包含技术点、知识点等）
- `/api/v1/source-information/project/:projectId` - 获取项目来源信息
- `/api/v1/projects/:id/conversations` - 获取项目对话记录

---

## 四、验证和修复

### 4.1 验证脚本

**位置**: `backend/src/scripts/verify-project-relations.ts`

**功能**:
- 检查所有关联表是否存在
- 检查 `conversations` 表是否有 `project_id` 字段
- 检查每个项目的关联数据数量
- 输出详细的验证报告

**运行方式**:
```bash
cd backend
npm run ts-node src/scripts/verify-project-relations.ts
```

### 4.2 修复脚本

**位置**: `backend/src/scripts/fix-project-relations.ts`

**功能**:
- 为 `conversations` 表添加 `project_id` 字段（如果不存在）
- 创建所有必需的关联表
- 创建必要的索引

**运行方式**:
```bash
cd backend
npm run ts-node src/scripts/fix-project-relations.ts
```

---

## 五、问题总结

### 5.1 已发现的问题

1. **conversations 表缺少 project_id 字段**
   - **影响**: 无法按项目ID查询对话记录
   - **状态**: ✅ 已修复（通过迁移脚本和更新schema）
   - **解决方案**: 运行 `fix-project-relations.ts` 脚本

2. **数据库schema不一致**
   - **影响**: 新创建的数据库可能缺少 `project_id` 字段
   - **状态**: ✅ 已修复（更新了 `unified-database-schema-v3.sql`）

### 5.2 建议

1. **运行验证脚本**: 定期运行 `verify-project-relations.ts` 检查关联关系
2. **数据迁移**: 对于现有数据库，运行 `fix-project-relations.ts` 确保所有表结构正确
3. **监控**: 在创建对话时确保传入 `project_id` 参数

---

## 六、关联关系图

```
projects (项目表)
├── project_tech_points (项目-技术点关联)
│   └── tech_points (技术点表)
├── project_knowledge_points (项目-知识点关联)
│   └── knowledge_points (知识点表)
├── project_files (项目-文件关联)
│   └── files (文件表)
├── project_source_informations (项目-来源信息关联)
│   └── source_information (来源信息表)
└── conversations (对话表)
    └── project_id (直接字段关联)
```

---

## 七、总结

### ✅ 已正确建立的关联

1. ✅ 项目-技术点关联 (`project_tech_points`)
2. ✅ 项目-知识点关联 (`project_knowledge_points`)
3. ✅ 项目-文件关联 (`project_files`)
4. ✅ 项目-来源信息关联 (`project_source_informations`)
5. ✅ 项目-对话记录关联 (`conversations.project_id`)

### 📋 验证清单

- [ ] 运行 `verify-project-relations.ts` 验证所有关联
- [ ] 如果发现问题，运行 `fix-project-relations.ts` 修复
- [ ] 确认前端能正确加载所有关联数据
- [ ] 测试创建新对话时是否正确关联项目ID

---

*最后更新: 2025-01-XX*




