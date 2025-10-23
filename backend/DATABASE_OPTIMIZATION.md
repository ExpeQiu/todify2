# Todify2 数据库优化指南

## 📋 概述

本文档介绍了Todify2项目的数据库优化方案，包括数据库统一和性能优化两个阶段。

## 🎯 优化目标

### 阶段1: 数据库统一（优先级：高）
- 合并多个数据库文件（database.db, todify2.db）
- 统一表结构设计
- 完善外键约束
- 标准化命名规范
- 验证数据完整性

### 阶段2: 性能优化（优先级：中）
- 添加复合索引
- 优化查询语句
- 实施缓存策略
- 数据访问模式优化
- 性能监控配置

## 🚀 快速开始

### 方法1: 使用一键优化脚本（推荐）

```bash
# 进入backend目录
cd backend

# 运行优化脚本
./optimize-database.sh
```

### 方法2: 分步执行

```bash
# 进入backend目录
cd backend

# 阶段1: 数据库统一
npx ts-node src/scripts/update-database-config.ts
npx ts-node src/scripts/migrate-to-unified-database.ts

# 阶段2: 性能优化
npx ts-node src/scripts/performance-optimization.ts
```

### 方法3: 使用TypeScript执行器

```bash
# 进入backend目录
cd backend

# 运行完整优化流程
npx ts-node src/scripts/run-database-optimization.ts
```

## 📁 文件结构

```
backend/
├── src/scripts/
│   ├── unified-database-schema.sql      # 统一数据库结构
│   ├── unified-database-indexes.sql     # 性能优化索引
│   ├── update-database-config.ts        # 配置更新脚本
│   ├── migrate-to-unified-database.ts   # 数据迁移脚本
│   ├── performance-optimization.ts      # 性能优化脚本
│   └── run-database-optimization.ts     # 完整优化流程
├── data/
│   ├── unified.db                       # 统一数据库文件
│   ├── backup/                          # 数据库备份
│   ├── migration-report.json            # 迁移报告
│   ├── performance-report.json          # 性能报告
│   └── cache-config.json               # 缓存配置
├── optimize-database.sh                 # 一键优化脚本
└── DATABASE_OPTIMIZATION.md            # 本文档
```

## 🔧 详细说明

### 1. 数据库统一

#### 问题分析
- 存在多个数据库文件：`database.db`（聊天数据）和 `todify2.db`（业务数据）
- 表结构不一致，存在重复定义
- 外键关系不完整
- 命名规范不统一

#### 解决方案
- 创建统一的数据库结构（`unified-database-schema.sql`）
- 合并所有表到单一数据库文件
- 完善外键约束和数据完整性检查
- 标准化表名和字段名

#### 主要变更
```sql
-- 统一后的核心表结构
CREATE TABLE conversations (...);           -- 聊天对话
CREATE TABLE chat_messages (...);           -- 聊天消息
CREATE TABLE brands (...);                  -- 品牌信息
CREATE TABLE car_models (...);              -- 车型信息
CREATE TABLE car_series (...);              -- 车系信息
CREATE TABLE tech_categories (...);         -- 技术分类
CREATE TABLE tech_points (...);             -- 技术点
CREATE TABLE tech_point_car_models (...);   -- 技术点与车型关联
-- ... 更多表
```

### 2. 性能优化

#### 索引优化
```sql
-- 复合索引示例
CREATE INDEX idx_tech_points_category_status ON tech_points(category_id, status);
CREATE INDEX idx_tech_points_priority_status ON tech_points(priority, status);
CREATE INDEX idx_chat_messages_conv_status ON chat_messages(conversation_id, status);
```

#### 查询优化
- 使用复合索引优化多条件查询
- 实施查询缓存策略
- 优化数据访问模式
- 添加性能监控

#### 缓存策略
```typescript
// 缓存配置示例
const cacheConfig = {
  'tech_categories': { ttl: 3600 },  // 技术分类缓存1小时
  'brands': { ttl: 1800 },           // 品牌信息缓存30分钟
  'tech_points': { ttl: 600 },       // 技术点缓存10分钟
  'chat_messages': { ttl: 60 }       // 聊天消息缓存1分钟
};
```

## 📊 预期收益

### 性能提升
- **查询性能提升 50-80%**：通过复合索引和查询优化
- **内存使用优化 30%**：通过缓存策略和连接池优化
- **响应时间减少 40%**：通过索引优化和查询缓存

### 维护性提升
- **维护成本降低 40%**：统一数据库结构，减少维护复杂度
- **系统稳定性提升**：完善的外键约束和数据验证
- **数据完整性保障**：统一的数据模型和约束检查

## 🔍 验证和测试

### 数据完整性验证
```bash
# 运行数据验证
npx ts-node src/scripts/validate-data-integrity.ts
```

### 性能测试
```bash
# 运行性能测试
npx ts-node src/scripts/performance-test.ts
```

### 功能测试
```bash
# 启动应用进行功能测试
npm run dev
```

## 📈 监控和维护

### 性能监控
- 定期检查查询性能
- 监控缓存命中率
- 分析数据库增长趋势

### 维护建议
- 定期备份数据库
- 清理过期数据
- 优化索引策略
- 监控系统资源使用

## 🚨 注意事项

### 备份要求
- **执行优化前必须备份现有数据**
- 备份文件保存在 `data/backup/` 目录
- 建议在测试环境先验证

### 兼容性
- 优化后的数据库结构与现有代码兼容
- 需要更新数据库连接配置
- 建议在维护窗口期执行

### 回滚方案
- 保留原始数据库文件作为备份
- 可以通过恢复备份文件回滚
- 配置文件可以手动恢复

## 🆘 故障排除

### 常见问题

#### 1. 迁移失败
```bash
# 检查数据库文件权限
ls -la data/

# 检查数据库连接
npx ts-node src/scripts/test-database-connection.ts
```

#### 2. 性能问题
```bash
# 分析慢查询
npx ts-node src/scripts/analyze-slow-queries.ts

# 检查索引使用情况
npx ts-node src/scripts/check-index-usage.ts
```

#### 3. 数据不一致
```bash
# 验证数据完整性
npx ts-node src/scripts/validate-data-integrity.ts

# 修复数据问题
npx ts-node src/scripts/repair-data-issues.ts
```

## 📞 支持

如果遇到问题，请：

1. 查看日志文件：`data/logs/`
2. 检查报告文件：`data/*.json`
3. 联系开发团队获取支持

## 📝 更新日志

### v1.0.0 (2024-12-19)
- 初始版本发布
- 实现数据库统一功能
- 实现性能优化功能
- 添加完整的文档和脚本

---

**注意**: 请在执行任何优化操作前，确保已经备份了重要数据，并在测试环境中验证了所有功能。
