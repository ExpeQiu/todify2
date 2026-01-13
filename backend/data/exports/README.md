# 配置数据库导出说明

## 📋 导出内容

本目录包含从生产数据库导出的**配置数据库**，**不包含历史对话数据**，可直接导入到云端服务器。

### ✅ 包含的配置表（27个表，1508条记录）

#### AI配置相关
- `ai_roles` - AI角色配置（11条）
- `agent_workflows` - Agent工作流配置（2条）
- `workflow_templates` - 工作流模板（0条）
- `page_tool_configs` - 页面工具配置（4条）
- `public_page_configs` - 公开页面配置（4条）
- `article_types` - 文章类型（3条）
- `article_type_ai_roles` - 文章类型与AI角色关联（0条）

#### 业务数据配置
- `brands` - 品牌（4条）
- `car_models` - 车型（7条）
- `car_series` - 车系（0条）
- `tech_categories` - 技术分类（10条）
- `tech_points` - 技术点（33条）
- `tech_point_car_models` - 技术点与车型关联（22条）
- `tech_point_knowledge_points` - 技术点与知识点关联（0条）
- `tech_point_resources` - 技术点与资源关联（1条）

#### 项目配置
- `projects` - 项目（4条）
- `project_sources` - 项目来源（0条）
- `project_tech_points` - 项目技术点关联（1条）
- `project_knowledge_points` - 项目知识点关联（0条）
- `project_files` - 项目文件关联（0条）
- `project_source_informations` - 项目来源信息（11条）

#### 知识库配置
- `knowledge_points` - 知识点（446条）
- `public_knowledge_categories` - 公开知识分类（1条）
- `public_knowledge_files` - 公开知识文件（10条）
- `resources` - 资源（1条）

#### 其他配置
- `ai_search_field_mappings` - AI搜索字段映射（4条）
- `id_mappings` - ID映射（929条）

### ❌ 排除的历史数据表

以下表**不包含**在导出中（历史对话和执行记录）：
- `ai_search_conversations` - AI搜索对话（296,289条 - 已排除）
- `ai_search_messages` - AI搜索消息（111条 - 已排除）
- `ai_search_outputs` - AI搜索输出（0条 - 已排除）
- `chat_messages` - 聊天消息（72条 - 已排除）
- `conversations` - 对话会话（26条 - 已排除）
- `workflow_executions` - 工作流执行记录（56条 - 已排除）
- `knowledge_usage_logs` - 知识使用日志（0条 - 已排除）
- `brainstorm_sessions` - 头脑风暴会话（2条 - 已排除）
- `brainstorm_messages` - 头脑风暴消息（32条 - 已排除）
- `brainstorm_participants` - 头脑风暴参与者（8条 - 已排除）
- `workflow_stats_summary` - 工作流统计（0条 - 已排除）

## 📦 文件说明

### 数据库文件（.db）
- **文件名**: `config-database-YYYY-MM-DD_HH-MM-SS.db`
- **大小**: 约 1.3MB（相比原数据库922MB，减少了99.86%）
- **格式**: SQLite 3 数据库文件
- **用途**: 可直接复制到云端服务器使用

### SQL文件（.sql）
- **文件名**: `config-database-YYYY-MM-DD_HH-MM-SS.sql`
- **大小**: 约 512KB
- **格式**: SQLite dump 格式
- **用途**: 可通过 sqlite3 命令导入到新数据库

## 🚀 导入方法

### 方法一：直接复制数据库文件（推荐）

```bash
# 1. 复制数据库文件到云端服务器
scp config-database-2026-01-13_21-44-44.db user@server:/path/to/backend/data/

# 2. 在服务器上重命名为目标数据库名
ssh user@server
cd /path/to/backend/data
mv config-database-2026-01-13_21-44-44.db todify2.db
```

### 方法二：使用SQL文件导入

```bash
# 1. 复制SQL文件到服务器
scp config-database-2026-01-13_21-44-44.sql user@server:/tmp/

# 2. 在服务器上导入
ssh user@server
cd /path/to/backend/data
sqlite3 new_database.db < /tmp/config-database-2026-01-13_21-44-44.sql
```

### 方法三：使用Docker容器导入

```bash
# 1. 复制数据库文件到服务器
scp config-database-2026-01-13_21-44-44.db user@server:/path/to/backend/data/

# 2. 在Docker容器中导入
docker exec -i todify4-backend sqlite3 /app/data/todify2.db < config-database-2026-01-13_21-44-44.sql
```

## ⚙️ 配置更新

导入后，确保以下配置正确：

1. **环境变量** (`backend/.env`):
   ```env
   DB_TYPE=sqlite
   SQLITE_DB_PATH=./data/todify2.db
   ```

2. **文件权限**:
   ```bash
   chmod 644 backend/data/todify2.db
   ```

3. **重启服务**:
   ```bash
   # 重启后端服务以加载新数据库
   docker-compose restart backend
   # 或
   npm run start
   ```

## 📊 导出统计

- **导出时间**: 2026-01-13 21:44:44
- **源数据库大小**: 922MB
- **导出数据库大小**: 1.3MB
- **压缩率**: 99.86%
- **配置表数量**: 27个
- **总记录数**: 1,508条
- **排除记录数**: 296,617条（历史对话数据）

## ⚠️ 注意事项

1. **数据完整性**: 导出的数据库仅包含配置信息，不包含历史对话和执行记录
2. **备份**: 导入前请备份云端服务器的现有数据库
3. **版本兼容**: 确保云端服务器的数据库架构版本与导出文件兼容
4. **索引**: 导出文件包含所有相关索引，导入后会自动创建
5. **外键约束**: 确保导入的表满足外键约束关系

## 🔄 更新导出

如需更新配置数据库导出，运行：

```bash
cd /path/to/todify4
bash scripts/export-config-database.sh
```

新导出文件将保存在 `backend/data/exports/` 目录中。
