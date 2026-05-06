# GeelyTPD2 技术数据种子文件说明

## 问题描述
- vehicles: 3条 ✅
- tech_points: 0条 ❌
- tech_categories: 0条 ❌
- technologies: 0条 ❌

## 已创建的文件

| 文件 | 说明 |
|------|------|
| `03-add-technology-id-migration.sql` | 为 tech_points 表添加 technology_id 列 |
| `04-tech-categories-seed.sql` | 技术分类种子数据（主分类 + 子分类） |
| `05-tech-points-seed.sql` | 技术点种子数据（8条） |
| `06-technologies-seed.sql` | 技术IP种子数据（5条） |
| `SEED-TECH-DATA.sql` | **一站式导入文件**（推荐使用） |

## 快速导入（推荐）

### 方式一：使用 psql 命令行（推荐）

```bash
# 连接到 PostgreSQL
psql -h geelytpd2-postgres -U postgres -d geelytpd2

# 在 psql 中执行
\i /path/to/SEED-TECH-DATA.sql

# 或者一行命令
psql -h geelytpd2-postgres -U postgres -d geelytpd2 -f /path/to/SEED-TECH-DATA.sql
```

### 方式二：在 Docker 容器内执行

```bash
# 进入容器
docker exec -it geelytpd2-tpd2-backend sh

# 执行 SQL 文件
psql -h postgres -U postgres -d geelytpd2 -f /app/init-data/SEED-TECH-DATA.sql
```

### 方式三：使用环境变量执行

```bash
# 设置环境变量后执行
export PG_HOST=geelytpd2-postgres
export PG_PORT=5432
export PG_USER=postgres
export PG_PASSWORD=<your_password>
export PG_DATABASE=geelytpd2

psql -h $PG_HOST -p $PG_PORT -U $PG_USER -d $PG_DATABASE -f SEED-TECH-DATA.sql
```

## 验证导入结果

```sql
-- 检查数据条数
SELECT 'tech_categories' AS table_name, COUNT(*) AS count FROM tech_categories
UNION ALL
SELECT 'tech_points', COUNT(*) FROM tech_points
UNION ALL
SELECT 'technologies', COUNT(*) FROM technologies;

-- 预期结果:
-- table_name      | count
-- ----------------+------
-- tech_categories | 12
-- tech_points     | 8
-- technologies    | 5
```

## 如果需要清空后重新导入

```sql
-- 清空数据（按依赖顺序）
DELETE FROM tech_point_vehicles;
DELETE FROM tech_points;
DELETE FROM tech_categories;
DELETE FROM technologies;

-- 重新导入
\i SEED-TECH-DATA.sql
```

## 导入的技术数据

### 技术分类 (12条)
- 动力系统（及其子分类：雷神电混、纯电动驱动）
- 智能驾驶（及其子分类：感知系统、智能计算）
- 新能源技术（及其子分类：神盾电池、充电技术）
- 底盘与悬架
- 安全技术
- 智能座舱

### 技术点 (8条)
1. 雷神AI电混2.0
2. 雷神EM-P超级电混
3. 雷神EM-i超级电混
4. 神盾短刀电池
5. 千里浩瀚H7智驾系统
6. G-AI智能座舱
7. SEA浩瀚架构
8. G-Safety安全技术

### 技术IP (5条)
1. 雷神动力
2. 神盾电池
3. 千里浩瀚
4. G-AI智能座舱
5. SEA浩瀚架构

## 注意事项

1. 文件使用 PostgreSQL 语法（`ON CONFLICT DO NOTHING` 防止重复插入）
2. 技术点通过 CTE 自动关联到分类和技术IP
3. 所有 JSONB 字段使用 `::jsonb` 类型转换
4. 支持重复执行（幂等性）
