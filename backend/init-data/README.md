# 数据库历史数据导入目录

此目录用于存放需要导入到 Docker 容器的历史数据文件。

## 支持的数据格式

### 1. SQL 文件（*.sql）
包含 INSERT 语句的 SQL 文件，将按文件名的字母顺序依次执行。

**示例:**
```sql
-- init-data/01-categories.sql
INSERT INTO tech_categories (name, description) VALUES
('动力系统', '发动机、电机、传动系统等相关技术'),
('智能驾驶', '自动驾驶、辅助驾驶相关技术');

-- init-data/02-tech-points.sql
INSERT INTO tech_points (name, tech_category_id) VALUES
('刀片电池技术', 1),
('DM-i超级混动', 1);
```

### 2. SQLite 数据库文件
- `*.db`
- `*.sqlite`
- `*.sqlite3`

如果提供了 SQLite 数据库备份文件，脚本会尝试将数据合并到新的数据库中。

**注意**: 
- 合并时使用 `INSERT OR IGNORE`，避免重复数据冲突
- 确保备份数据库的表结构与目标数据库兼容

## 使用方法

### 方法一：准备数据文件
1. 将 SQL 文件或数据库备份文件放入此目录
2. 启动 Docker 容器时，数据会自动导入

### 方法二：使用 SQLite 数据库备份
```bash
# 从现有数据库导出数据
sqlite3 existing.db .dump > init-data/backup.sql

# 或者直接复制数据库文件
cp existing.db init-data/todify3-backup.db
```

### 方法三：导出特定表的数据
```bash
# 导出特定表的数据
sqlite3 source.db <<EOF > init-data/categories.sql
.mode insert tech_categories
SELECT * FROM tech_categories;
EOF
```

## 数据导入顺序

1. **架构初始化**: 执行 `unified-database-schema-v2.sql` 创建表结构
2. **索引创建**: 执行 `unified-database-indexes-v2.sql` 创建索引
3. **SQL 文件导入**: 按文件名顺序执行所有 `.sql` 文件
4. **数据库合并**: 合并所有 SQLite 数据库文件的数据

## 环境变量控制

可以通过环境变量控制导入行为：

- `INIT_DATABASE=1`: 执行数据库初始化（默认）
- `INIT_DATABASE=0`: 跳过数据库初始化
- `FORCE_INIT=1`: 强制重新初始化数据库（会重新创建表结构）
- `FORCE_INIT=0`: 如果数据库已存在，跳过架构初始化（默认）

## 示例

### 示例 1: 导入初始分类数据
创建文件 `init-data/01-initial-categories.sql`:
```sql
INSERT OR IGNORE INTO tech_categories (name, description, sort_order) VALUES
('动力系统', '发动机、电机、传动系统等相关技术', 1),
('智能驾驶', '自动驾驶、辅助驾驶相关技术', 2),
('车联网', '车载通信、物联网技术', 3),
('新能源', '电池、充电、能源管理技术', 4),
('安全技术', '主动安全、被动安全技术', 5);
```

### 示例 2: 从备份恢复
```bash
# 将备份数据库文件放入此目录
cp /path/to/backup.db init-data/restore.db

# 启动容器，数据会自动合并
docker compose up -d
```

## 注意事项

1. **数据冲突**: 使用 `INSERT OR IGNORE` 避免主键冲突
2. **表结构**: 确保导入数据的表结构与当前数据库架构兼容
3. **顺序**: SQL 文件按字母顺序执行，注意依赖关系
4. **权限**: 此目录在容器中是只读挂载（`:ro`），确保数据安全
5. **备份**: 在导入大量数据前，建议备份现有数据库

## 验证导入

导入完成后，可以通过以下方式验证：

```bash
# 进入容器检查
docker compose exec backend sqlite3 /app/data/todify3.db "SELECT COUNT(*) FROM tech_categories;"

# 或者查看日志
docker compose logs backend | grep -i "导入\|import"
```
