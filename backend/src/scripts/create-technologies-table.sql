-- 创建技术IP表
CREATE TABLE IF NOT EXISTS technologies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    name_en TEXT,
    description TEXT,
    version TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'draft', 'archived')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_technologies_name ON technologies(name);
CREATE INDEX IF NOT EXISTS idx_technologies_status ON technologies(status);

-- 为tech_points表添加technology_id外键（如果还没有）
-- 注意：如果tech_points表已经存在但没有technology_id列，需要先添加列
-- ALTER TABLE tech_points ADD COLUMN technology_id INTEGER;
-- CREATE INDEX IF NOT EXISTS idx_tech_points_technology_id ON tech_points(technology_id);
-- 外键约束（SQLite不支持ALTER TABLE添加外键，需要在创建表时添加）

