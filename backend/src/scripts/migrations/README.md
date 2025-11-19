# 数据库迁移说明

## 目录结构

```
migrations/
├── README.md                    # 本文件
├── 001_initial_schema.sql       # 初始架构迁移
└── ...                          # 后续迁移脚本
```

## 迁移命名规范

迁移文件命名格式：`{序号}_{描述}.sql`

- 序号：三位数字，从001开始递增
- 描述：简短描述迁移内容，使用下划线分隔

示例：
- `001_initial_schema.sql`
- `002_add_user_table.sql`
- `003_update_workflow_executions.sql`

## 迁移脚本编写规范

1. **注释说明**：每个迁移脚本开头应包含：
   - 版本号
   - 创建日期
   - 迁移说明

2. **可重复执行**：使用 `IF NOT EXISTS` 或 `IF EXISTS` 确保迁移可以重复执行

3. **向后兼容**：尽量保持向后兼容，避免破坏性变更

4. **数据迁移**：如需迁移数据，应在表结构变更后执行

5. **回滚支持**：如可能，提供回滚脚本（可选）

## 执行迁移

使用数据库迁移工具执行迁移脚本，确保：
1. 按序号顺序执行
2. 记录执行结果到 `database_migrations` 表
3. 失败时记录错误信息

## 迁移记录表

所有迁移记录存储在 `database_migrations` 表中，包含：
- migration_name: 迁移文件名
- version: 版本号
- executed_at: 执行时间
- execution_time_ms: 执行耗时
- status: 执行状态
- error_message: 错误信息（如有）

