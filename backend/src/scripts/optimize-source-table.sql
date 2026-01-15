-- 数据库表结构优化SQL脚本
-- 功能：
-- 1. 添加 category 字段的枚举约束
-- 2. 创建复合索引优化查询性能
-- 3. 确保所有必要的索引存在

-- 注意：SQLite 不支持 CHECK 约束的枚举，但我们可以通过应用层验证
-- 如果需要数据库层面的约束，可以考虑使用触发器

BEGIN TRANSACTION;

-- 1. 确保 project_id 字段存在（如果不存在则添加）
-- SQLite 不支持 ALTER TABLE ADD COLUMN IF NOT EXISTS，需要先检查
-- 这里假设字段已存在，如果不存在请先运行迁移脚本

-- 2. 创建复合索引优化查询性能
-- 索引：project_id + category（用于按项目和分类查询）
CREATE INDEX IF NOT EXISTS idx_source_project_category 
ON source_information(project_id, category);

-- 索引：project_id + status（用于查询活跃状态的来源）
CREATE INDEX IF NOT EXISTS idx_source_project_status 
ON source_information(project_id, status);

-- 索引：project_id + created_at（用于按时间排序）
CREATE INDEX IF NOT EXISTS idx_source_project_created 
ON source_information(project_id, created_at DESC);

-- 3. 确保其他必要的索引存在
CREATE INDEX IF NOT EXISTS idx_source_information_source_id 
ON source_information(source_id);

CREATE INDEX IF NOT EXISTS idx_source_information_type 
ON source_information(type);

CREATE INDEX IF NOT EXISTS idx_source_information_conversation_id 
ON source_information(conversation_id);

CREATE INDEX IF NOT EXISTS idx_source_information_status 
ON source_information(status);

CREATE INDEX IF NOT EXISTS idx_source_information_created_at 
ON source_information(created_at DESC);

-- 4. 如果存在 page_type 字段，创建索引（用于兼容旧数据）
CREATE INDEX IF NOT EXISTS idx_source_information_page_type 
ON source_information(page_type);

-- 5. 创建项目来源关联表的索引（如果表存在）
CREATE INDEX IF NOT EXISTS idx_project_source_project_id 
ON project_source_informations(project_id);

CREATE INDEX IF NOT EXISTS idx_project_source_source_id 
ON project_source_informations(source_information_id);

CREATE INDEX IF NOT EXISTS idx_project_source_unique 
ON project_source_informations(project_id, source_information_id);

COMMIT;

-- 验证索引创建情况
-- SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='source_information';
