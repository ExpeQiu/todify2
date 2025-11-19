# Todify2 数据库设计文档 v2.0

## 一、概述

本文档描述了 Todify2 项目的统一数据库架构设计，整合了所有分散的表定义，解决了表结构冲突，并规范化了命名和数据类型。

### 1.1 设计目标

- **统一管理**：所有表结构集中管理，易于维护
- **性能优化**：优化索引和查询，提升数据库性能
- **数据完整性**：完善外键约束，保障数据一致性
- **可扩展性**：规范化设计，便于后续扩展
- **向后兼容**：保持与现有代码的兼容性

### 1.2 架构分层

数据库架构分为五层：

1. **第一层：基础数据层** - 品牌、车型、技术分类、技术点等核心业务数据
2. **第二层：关联关系层** - 技术点与车型、知识点的关联关系
3. **第三层：AI内容生成层** - 知识点、AI生成内容（包装材料、推广策略、通稿、演讲稿）
4. **第四层：工作流与对话层** - Agent工作流、工作流执行、对话会话、聊天消息
5. **第五层：配置与统计层** - AI角色配置、页面配置、文件管理、统计分析

## 二、表结构设计

### 2.1 第一层：基础数据层

#### 2.1.1 品牌表 (brands)

存储汽车品牌信息。

| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | INTEGER | 主键，自增 |
| name | TEXT | 品牌名称（唯一） |
| name_en | TEXT | 英文名称 |
| logo_url | TEXT | Logo URL |
| country | TEXT | 国家 |
| founded_year | INTEGER | 成立年份 |
| description | TEXT | 描述 |
| status | TEXT | 状态：active/inactive |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

#### 2.1.2 车型表 (car_models)

存储车型信息，关联品牌。

| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | INTEGER | 主键，自增 |
| brand_id | INTEGER | 外键，关联brands.id |
| name | TEXT | 车型名称 |
| name_en | TEXT | 英文名称 |
| category | TEXT | 车型类别 |
| launch_year | INTEGER | 上市年份 |
| end_year | INTEGER | 停产年份 |
| description | TEXT | 描述 |
| status | TEXT | 状态 |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

#### 2.1.3 车系表 (car_series)

存储车系信息，关联车型。

#### 2.1.4 技术分类表 (tech_categories)

存储技术分类，支持层级结构。

| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | INTEGER | 主键，自增 |
| name | VARCHAR(255) | 分类名称 |
| description | TEXT | 描述 |
| parent_id | INTEGER | 父分类ID（外键） |
| level | INTEGER | 层级（默认1） |
| sort_order | INTEGER | 排序 |
| status | VARCHAR(50) | 状态 |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

#### 2.1.5 技术点表 (tech_points)

存储技术点信息，支持父子关系。

| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | INTEGER | 主键，自增 |
| name | VARCHAR(255) | 技术点名称 |
| description | TEXT | 描述 |
| category_id | INTEGER | 外键，关联tech_categories.id |
| parent_id | INTEGER | 父技术点ID（外键） |
| level | INTEGER | 层级 |
| tech_type | VARCHAR(50) | 技术类型 |
| priority | VARCHAR(50) | 优先级 |
| status | VARCHAR(50) | 状态 |
| tags | TEXT | JSON数组格式的标签 |
| technical_details | TEXT | JSON格式的技术细节 |
| benefits | TEXT | JSON数组格式的优势 |
| applications | TEXT | JSON数组格式的应用场景 |
| keywords | TEXT | JSON数组格式的关键词 |
| source_url | VARCHAR(500) | 来源URL |
| created_by | VARCHAR(255) | 创建者 |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

### 2.2 第二层：关联关系层

#### 2.2.1 技术点与车型关联表 (tech_point_car_models)

多对多关系表，关联技术点和车型。

| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | INTEGER | 主键，自增 |
| tech_point_id | INTEGER | 外键，关联tech_points.id |
| car_model_id | INTEGER | 外键，关联car_models.id |
| application_status | VARCHAR(50) | 应用状态 |
| implementation_date | DATE | 实施日期 |
| notes | TEXT | 备注 |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

**唯一约束**：(tech_point_id, car_model_id)

### 2.3 第三层：AI内容生成层

#### 2.3.1 知识点表 (knowledge_points)

存储从AI搜索等来源获取的知识点。

| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | INTEGER | 主键，自增 |
| title | TEXT | 标题 |
| content | TEXT | 内容 |
| source_query | TEXT | 来源查询 |
| source_url | TEXT | 来源URL |
| source_type | TEXT | 来源类型：ai_search/manual/import |
| metadata | TEXT | JSON格式的元数据 |
| tags | TEXT | JSON格式的标签 |
| relevance_score | REAL | 相关度分数 |
| status | TEXT | 状态 |
| dify_task_id | TEXT | Dify任务ID |
| ai_search_session_id | TEXT | AI搜索会话ID |
| created_by | INTEGER | 创建者ID |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

#### 2.3.2 技术包装材料表 (tech_packaging_materials)

存储AI生成的技术包装材料。

#### 2.3.3 技术推广策略表 (tech_promotion_strategies)

存储AI生成的技术推广策略。

#### 2.3.4 技术通稿表 (tech_press_releases)

存储AI生成的技术通稿。

#### 2.3.5 技术演讲稿表 (tech_speeches)

存储AI生成的技术演讲稿。

### 2.4 第四层：工作流与对话层

#### 2.4.1 Agent工作流表 (agent_workflows)

存储Agent工作流定义。

| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | TEXT | 主键 |
| name | TEXT | 工作流名称 |
| description | TEXT | 描述 |
| version | TEXT | 版本号（默认'1.0.0'） |
| nodes | TEXT | JSON字符串，节点列表 |
| edges | TEXT | JSON字符串，连接边列表 |
| metadata | TEXT | JSON字符串，元数据 |
| published | INTEGER | 是否已发布（0/1） |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

#### 2.4.2 工作流执行表 (workflow_executions) - 统一表

**重要**：此表合并了Agent工作流执行和Dify工作流执行记录，通过`execution_type`字段区分。

| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | TEXT | 主键 |
| execution_type | TEXT | 执行类型：'agent_workflow' 或 'dify_workflow' |
| workflow_id | TEXT | Agent工作流ID（外键，agent_workflows.id） |
| workflow_name | TEXT | 工作流名称 |
| shared_context | TEXT | JSON字符串，共享上下文（Agent工作流） |
| node_results | TEXT | JSON字符串，节点执行结果（Agent工作流） |
| workflow_run_id | TEXT | Dify工作流运行ID（唯一） |
| task_id | TEXT | Dify任务ID |
| message_id | TEXT | 关联消息ID（外键，chat_messages.message_id） |
| app_type | TEXT | 应用类型（Dify工作流） |
| status | TEXT | 执行状态 |
| error_message | TEXT | 错误信息 |
| inputs | TEXT | JSON格式的输入 |
| outputs | TEXT | JSON格式的输出 |
| elapsed_time | REAL | 执行时间（秒） |
| total_tokens | INTEGER | 总token数 |
| total_steps | INTEGER | 总步数 |
| duration | INTEGER | 持续时间（毫秒，Agent工作流） |
| start_time | TIMESTAMP | 开始时间 |
| end_time | TIMESTAMP | 结束时间 |
| started_at | DATETIME | 开始时间（Dify工作流） |
| finished_at | DATETIME | 完成时间（Dify工作流） |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

#### 2.4.3 对话会话表 (conversations)

存储对话会话信息。

#### 2.4.4 聊天消息表 (chat_messages)

存储聊天消息，关联对话会话。

### 2.5 第五层：配置与统计层

#### 2.5.1 AI角色表 (ai_roles)

存储AI角色配置。

| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | TEXT | 主键 |
| name | TEXT | 角色名称 |
| description | TEXT | 描述 |
| avatar | TEXT | 头像URL |
| system_prompt | TEXT | 系统提示词 |
| dify_config | TEXT | JSON字符串，Dify配置 |
| enabled | INTEGER | 是否启用（0/1） |
| source | TEXT | 来源标记 |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

**dify_config JSON结构**：
```json
{
  "apiUrl": "string",
  "apiKey": "string",
  "connectionType": "chatflow" | "workflow",
  "inputFields": [...]
}
```

#### 2.5.2 公开页面配置表 (public_page_configs)

存储公开页面配置。

#### 2.5.3 页面工具配置表 (page_tool_configs)

存储页面工具配置，按页面类型唯一。

#### 2.5.4 文件表 (files)

存储上传的文件信息。

#### 2.5.5 统计表

- **workflow_node_usage** - 工作流节点使用统计
- **ai_qa_feedback** - AI问答评价统计
- **workflow_session_stats** - 工作流会话统计
- **node_content_processing** - 节点内容处理统计
- **workflow_stats_summary** - 实时统计汇总

## 三、关键设计决策

### 3.1 workflow_executions表统一

**问题**：原有两个不同的`workflow_executions`表定义：
1. Agent工作流执行表（TEXT主键，包含shared_context、node_results等）
2. Dify工作流执行表（INTEGER主键，包含workflow_run_id、task_id等）

**解决方案**：
- 合并为统一表，使用TEXT主键
- 添加`execution_type`字段区分类型
- 包含两种类型的所有字段，根据类型使用相应字段

### 3.2 主键类型规范

- **核心业务表**：使用INTEGER AUTOINCREMENT（brands, car_models, tech_points等）
- **配置表**：使用TEXT（UUID或自定义ID）（ai_roles, agent_workflows等）
- **关联表**：使用INTEGER AUTOINCREMENT

### 3.3 命名规范

- **表名**：使用复数形式（tech_points而非tech_point）
- **字段名**：统一使用snake_case
- **索引名**：统一格式`idx_表名_字段名`

### 3.4 JSON字段存储

复杂配置数据以JSON字符串存储：
- `dify_config` - Dify配置
- `nodes`、`edges` - 工作流结构
- `metadata` - 元数据
- `tags`、`keywords` - 数组数据

## 四、索引设计

### 4.1 索引策略

1. **主键索引**：自动创建
2. **外键索引**：为所有外键字段创建索引
3. **查询索引**：为常用查询字段创建索引
4. **复合索引**：为多字段组合查询创建复合索引

### 4.2 重要索引

- `idx_workflow_executions_type` - 按执行类型查询
- `idx_workflow_executions_type_status` - 按类型和状态查询
- `idx_tech_points_category_status` - 按分类和状态查询
- `idx_chat_messages_conv_status` - 按对话和状态查询

## 五、数据迁移

### 5.1 迁移机制

使用`database_migrations`表记录所有迁移历史：
- migration_name: 迁移文件名
- version: 版本号
- executed_at: 执行时间
- execution_time_ms: 执行耗时
- status: 执行状态
- error_message: 错误信息

### 5.2 迁移工具

使用`migrate.ts`工具执行迁移：
```bash
ts-node backend/src/scripts/migrate.ts
```

## 六、使用说明

### 6.1 初始化数据库

```bash
# SQLite
DB_TYPE=sqlite DB_PATH=./database.db ./backend/src/scripts/init-database-v2.sh

# PostgreSQL
DB_TYPE=postgresql PGHOST=localhost PGDATABASE=todify2 PGUSER=postgres ./backend/src/scripts/init-database-v2.sh
```

### 6.2 执行迁移

```bash
ts-node backend/src/scripts/migrate.ts
```

### 6.3 查看迁移状态

迁移工具会自动记录执行状态到`database_migrations`表。

## 七、注意事项

1. **向后兼容**：新架构保持与现有代码的兼容性
2. **数据备份**：执行迁移前必须备份现有数据
3. **测试验证**：在测试环境充分验证新架构
4. **性能测试**：验证索引优化后的查询性能
5. **文档更新**：同步更新API文档和开发文档

## 八、版本历史

- **v2.0** (2025-01-XX): 统一数据库架构，解决表冲突，规范化命名
- **v1.0**: 初始分散的数据库架构

