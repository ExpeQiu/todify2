-- 来源信息项目关联迁移脚本
-- 创建日期: 2025-01-XX
-- 说明: 将来源信息从 page_type 维度迁移到项目维度

-- ==============================================
-- 1. 添加 project_id 字段到 source_information 表
-- ==============================================

-- 检查并添加 project_id 字段（SQLite 不支持 IF NOT EXISTS，需要先检查）
-- 如果字段已存在，此操作会失败，需要在应用层处理

-- 添加 project_id 字段
ALTER TABLE source_information ADD COLUMN project_id INTEGER;

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_source_information_project_id ON source_information(project_id);

-- 添加外键约束（SQLite 3.37.0+ 支持，旧版本可能需要重建表）
-- 注意：SQLite 的 ALTER TABLE ADD COLUMN 不支持直接添加外键
-- 如果需要外键约束，需要重建表，这里先添加字段，外键约束在应用层处理

-- ==============================================
-- 2. 从 page_type 中提取项目 ID 并更新 project_id
-- ==============================================

-- 更新 project_id：从 page_type 中提取项目ID
-- 格式: tech-package-project-123, tech-strategy-project-456 等
UPDATE source_information
SET project_id = CAST(
  SUBSTR(
    page_type,
    INSTR(page_type, 'project-') + 8
  ) AS INTEGER
)
WHERE page_type LIKE '%-project-%'
  AND project_id IS NULL;

-- ==============================================
-- 3. 清理 page_type 字段，保留标准格式
-- ==============================================

-- 将 tech-package-project-123 格式转换为 tech-package
UPDATE source_information
SET page_type = SUBSTR(page_type, 1, INSTR(page_type, '-project-') - 1)
WHERE page_type LIKE '%-project-%'
  AND INSTR(page_type, '-project-') > 0;

-- 将 tech-strategy-project-123 格式转换为 tech-strategy
-- 注意：上面的 UPDATE 已经处理了所有 -project- 的情况

-- ==============================================
-- 4. 在 project_source_informations 表中建立关联
-- ==============================================

-- 确保 project_source_informations 表存在
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

-- 为已有 project_id 的来源信息创建关联记录
INSERT INTO project_source_informations (project_id, source_information_id, created_at)
SELECT 
    project_id,
    id,
    created_at
FROM source_information
WHERE project_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 
    FROM project_source_informations psi
    WHERE psi.project_id = source_information.project_id
      AND psi.source_information_id = source_information.id
  );

-- ==============================================
-- 5. 创建索引优化查询性能
-- ==============================================

CREATE INDEX IF NOT EXISTS idx_project_source_informations_project_id 
ON project_source_informations(project_id);

CREATE INDEX IF NOT EXISTS idx_project_source_informations_source_information_id 
ON project_source_informations(source_information_id);

-- ==============================================
-- 迁移完成
-- ==============================================

