# 项目资源关联设计文档

## 一、数据库设计

### 1. 来源信息表 (source_information)

```sql
CREATE TABLE IF NOT EXISTS source_information (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_id TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('knowledge_base', 'external')),
    url TEXT,
    description TEXT,
    page_type TEXT CHECK (page_type IN ('tech-package', 'press-release', 'tech-strategy', 'tech-article')),
    conversation_id TEXT,
    project_id INTEGER, -- 关联的项目ID（主要关联方式）
    metadata TEXT, -- JSON格式，包含 category 等信息
    status TEXT DEFAULT 'active',
    created_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_source_information_project_id ON source_information(project_id);
```

**关键字段说明：**
- `project_id`: 直接关联项目，这是主要的关联方式
- `page_type`: 仅用于标识页面类型，不再包含项目ID
- `metadata`: JSON格式，包含 `category` 等信息，用于资源分类

### 2. 项目与来源信息关联表 (project_source_informations)

```sql
CREATE TABLE IF NOT EXISTS project_source_informations (
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

**用途：**
- 支持多对多关系（一个来源可以关联多个项目）
- 作为 `project_id` 字段的补充关联方式
- 兼容旧数据（通过 page_type 关联的项目）

## 二、项目关联机制

### 1. 创建来源信息时的关联

当创建 `source_information` 时，如果提供了 `project_id`：

1. **直接关联**：在 `source_information` 表中设置 `project_id` 字段
2. **关联表**：同时在 `project_source_informations` 表中创建关联记录

```typescript
// 后端自动处理
if (data.project_id && created.id) {
  await this.model.createProjectAssociation(data.project_id, created.id);
}
```

### 2. 查询项目资源

后端 `findByProjectId` 方法会同时查询三种方式：

1. **优先**：通过 `project_id` 字段直接查询
2. **补充**：通过 `project_source_informations` 关联表查询
3. **兼容**：通过 `page_type = 'project-{projectId}'` 查询旧数据

```sql
SELECT DISTINCT si.* FROM source_information si
WHERE si.project_id = ? AND si.status = 'active'

UNION

SELECT DISTINCT si.* FROM source_information si
INNER JOIN project_source_informations psi ON si.id = psi.source_information_id
WHERE psi.project_id = ? AND si.status = 'active'

UNION

SELECT * FROM source_information
WHERE page_type = ? AND status = 'active'
```

## 三、资源分类逻辑

### 1. 文件识别

文件资源通过 URL 判断：
- URL 以 `/uploads/` 或 `uploads/` 开头
- URL 包含 `/api/ai-search/files/` 或 `/api/v1/public-knowledge/files/`
- URL 包含文件扩展名：`.pdf`, `.doc`, `.docx`, `.txt`, `.md`, `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`, `.ppt`, `.pptx`

### 2. 互联网信息识别

互联网信息资源通过以下方式判断：
- URL 以 `http://` 或 `https://` 开头，且不是文件路径
- `metadata.category` 为 `internet-search` 或 `web-search`

### 3. 知识点识别

知识点资源：
- `type` 为 `knowledge_base`
- `source_id` 以 `public_kb_` 开头（公共知识库）
- 或从项目详情接口获取的知识点列表

## 四、前端实现

### 1. ResourceSidebar 组件

**资源加载：**
```typescript
const sourcesResult = await sourceService.loadSourceInformationByProjectId(project.id);
```

**资源分类：**
- 文件：通过 URL 判断
- 互联网信息：通过 URL 和 category 判断
- 知识点：从项目详情接口获取

**创建资源时：**
- 必须设置 `project_id: project.id`
- 不再使用 `page_type: 'project-{id}'` 格式
- 在 `metadata` 中设置 `category`

### 2. 文件上传

上传文件时创建 `source_information`：
```typescript
{
  source_id: uploadedFile.id,
  title: uploadedFile.name,
  type: 'external',
  url: uploadedFile.url,
  description: description,
  project_id: project.id, // 明确关联到项目
  metadata: { category: 'external' }
}
```

### 3. 公共知识库关联

关联公共知识库文件时：
```typescript
{
  source_id: `public_kb_${file.id}`,
  type: 'knowledge_base',
  project_id: project.id, // 明确关联到项目
  metadata: { category: 'knowledge_base' }
}
```

### 4. Web 检索结果

保存 Web 检索结果时：
```typescript
{
  source_id: sourceId,
  type: 'external',
  url: result.url,
  project_id: project.id, // 明确关联到项目
  metadata: { category: 'web-search' }
}
```

## 五、与 source-management 页面对齐

### 1. 资源过滤

source-management 页面支持按项目过滤：
```typescript
if (selectedProject) {
  params.projectId = selectedProject;
}
```

### 2. 资源分组

source-management 页面按项目分组显示：
```typescript
const groupedSources = filteredSources.reduce((acc, source) => {
  const projectId = source.project_id || "unassigned";
  if (!acc[projectId]) {
    acc[projectId] = [];
  }
  acc[projectId].push(source);
  return acc;
}, {} as Record<number | "unassigned", SourceInformation[]>);
```

### 3. 编辑资源

source-management 页面支持修改项目关联：
- 可以修改 `project_id` 字段
- 修改后资源会移动到对应项目分组

## 六、最佳实践

1. **创建资源时**：
   - ✅ 始终设置 `project_id`
   - ✅ 在 `metadata` 中设置 `category`
   - ❌ 不要使用 `page_type: 'project-{id}'` 格式

2. **查询资源时**：
   - ✅ 使用 `loadSourceInformationByProjectId(projectId)`
   - ✅ 后端会自动处理多种关联方式

3. **资源分类时**：
   - ✅ 文件：通过 URL 判断
   - ✅ 互联网信息：通过 URL 和 category 判断
   - ✅ 知识点：从项目详情接口获取

4. **数据库维护**：
   - ✅ 确保 `project_id` 字段有索引
   - ✅ 定期清理无关联的资源（`project_id IS NULL` 且不在关联表中）

## 七、迁移说明

对于旧数据（使用 `page_type: 'project-{id}'` 格式）：
- 后端查询时会自动兼容
- 建议逐步迁移到使用 `project_id` 字段
- 迁移脚本：`backend/src/scripts/migration-source-to-project.sql`

