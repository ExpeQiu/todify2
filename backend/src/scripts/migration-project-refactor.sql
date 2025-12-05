-- 项目数据管理重构迁移脚本
-- 创建日期: 2025-12-05
-- 说明: 重构项目数据管理架构，以"项目"为核心关联所有相关数据

-- ==============================================
-- 1. 确保 projects 表存在（如果不存在则创建）
-- ==============================================
CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    cover_image TEXT,
    icon TEXT,
    type TEXT DEFAULT 'normal' CHECK (type IN ('normal', 'featured')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
    created_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_opened_at DATETIME
);

-- ==============================================
-- 2. 项目关联基础信息表（多对多关系）
-- ==============================================

-- 项目与技术点关联表
CREATE TABLE IF NOT EXISTS project_tech_points (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    tech_point_id INTEGER NOT NULL,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (tech_point_id) REFERENCES tech_points(id) ON DELETE CASCADE,
    UNIQUE(project_id, tech_point_id)
);

-- 项目与公开知识点关联表
CREATE TABLE IF NOT EXISTS project_knowledge_points (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    knowledge_point_id INTEGER NOT NULL,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (knowledge_point_id) REFERENCES knowledge_points(id) ON DELETE CASCADE,
    UNIQUE(project_id, knowledge_point_id)
);

-- 项目与文件关联表
CREATE TABLE IF NOT EXISTS project_files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    file_id TEXT NOT NULL,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (file_id) REFERENCES files(file_id) ON DELETE CASCADE,
    UNIQUE(project_id, file_id)
);

-- 项目与来源信息关联表（多对多，支持来源信息复用）
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

-- ==============================================
-- 3. 在生成内容表中添加 project_id 字段
-- ==============================================

-- 技术包装材料表添加 project_id
-- 注意：如果表已存在，需要先检查字段是否存在
-- SQLite 不支持直接 ALTER TABLE ADD COLUMN IF NOT EXISTS，需要手动检查
-- 这里使用 ALTER TABLE，如果字段已存在会报错，需要在应用层处理

-- 为 tech_packaging_materials 添加 project_id
-- 先检查表是否存在 project_id 列（通过尝试添加，如果失败则忽略）
-- 实际执行时，如果字段已存在，需要手动处理或使用应用层检查

ALTER TABLE tech_packaging_materials ADD COLUMN project_id INTEGER;
CREATE INDEX IF NOT EXISTS idx_tech_packaging_materials_project_id ON tech_packaging_materials(project_id);
-- 添加外键约束（SQLite 3.37.0+ 支持，旧版本可能需要重建表）
-- FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL

-- 为 tech_promotion_strategies 添加 project_id
ALTER TABLE tech_promotion_strategies ADD COLUMN project_id INTEGER;
CREATE INDEX IF NOT EXISTS idx_tech_promotion_strategies_project_id ON tech_promotion_strategies(project_id);

-- 为 tech_press_releases 添加 project_id
ALTER TABLE tech_press_releases ADD COLUMN project_id INTEGER;
CREATE INDEX IF NOT EXISTS idx_tech_press_releases_project_id ON tech_press_releases(project_id);

-- ==============================================
-- 4. 生成内容关联上下文表
-- ==============================================

-- 技术包装材料关联对话表
CREATE TABLE IF NOT EXISTS tech_packaging_conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    packaging_id INTEGER NOT NULL,
    conversation_id TEXT NOT NULL,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (packaging_id) REFERENCES tech_packaging_materials(id) ON DELETE CASCADE,
    FOREIGN KEY (conversation_id) REFERENCES conversations(conversation_id) ON DELETE CASCADE,
    UNIQUE(packaging_id, conversation_id)
);

-- 技术包装材料关联来源信息表
CREATE TABLE IF NOT EXISTS tech_packaging_sources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    packaging_id INTEGER NOT NULL,
    source_id INTEGER NOT NULL,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (packaging_id) REFERENCES tech_packaging_materials(id) ON DELETE CASCADE,
    FOREIGN KEY (source_id) REFERENCES source_information(id) ON DELETE CASCADE,
    UNIQUE(packaging_id, source_id)
);

-- 技术推广策略关联对话表
CREATE TABLE IF NOT EXISTS tech_promotion_conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    promotion_id INTEGER NOT NULL,
    conversation_id TEXT NOT NULL,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (promotion_id) REFERENCES tech_promotion_strategies(id) ON DELETE CASCADE,
    FOREIGN KEY (conversation_id) REFERENCES conversations(conversation_id) ON DELETE CASCADE,
    UNIQUE(promotion_id, conversation_id)
);

-- 技术推广策略关联来源信息表
CREATE TABLE IF NOT EXISTS tech_promotion_sources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    promotion_id INTEGER NOT NULL,
    source_id INTEGER NOT NULL,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (promotion_id) REFERENCES tech_promotion_strategies(id) ON DELETE CASCADE,
    FOREIGN KEY (source_id) REFERENCES source_information(id) ON DELETE CASCADE,
    UNIQUE(promotion_id, source_id)
);

-- 技术通稿关联对话表
CREATE TABLE IF NOT EXISTS tech_press_conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    press_release_id INTEGER NOT NULL,
    conversation_id TEXT NOT NULL,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (press_release_id) REFERENCES tech_press_releases(id) ON DELETE CASCADE,
    FOREIGN KEY (conversation_id) REFERENCES conversations(conversation_id) ON DELETE CASCADE,
    UNIQUE(press_release_id, conversation_id)
);

-- 技术通稿关联来源信息表
CREATE TABLE IF NOT EXISTS tech_press_sources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    press_release_id INTEGER NOT NULL,
    source_id INTEGER NOT NULL,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (press_release_id) REFERENCES tech_press_releases(id) ON DELETE CASCADE,
    FOREIGN KEY (source_id) REFERENCES source_information(id) ON DELETE CASCADE,
    UNIQUE(press_release_id, source_id)
);

-- ==============================================
-- 5. 创建索引以优化查询性能
-- ==============================================

-- 项目关联表索引
CREATE INDEX IF NOT EXISTS idx_project_tech_points_project_id ON project_tech_points(project_id);
CREATE INDEX IF NOT EXISTS idx_project_tech_points_tech_point_id ON project_tech_points(tech_point_id);
CREATE INDEX IF NOT EXISTS idx_project_knowledge_points_project_id ON project_knowledge_points(project_id);
CREATE INDEX IF NOT EXISTS idx_project_knowledge_points_knowledge_point_id ON project_knowledge_points(knowledge_point_id);
CREATE INDEX IF NOT EXISTS idx_project_files_project_id ON project_files(project_id);
CREATE INDEX IF NOT EXISTS idx_project_files_file_id ON project_files(file_id);
CREATE INDEX IF NOT EXISTS idx_project_source_informations_project_id ON project_source_informations(project_id);
CREATE INDEX IF NOT EXISTS idx_project_source_informations_source_id ON project_source_informations(source_information_id);

-- 生成内容关联表索引
CREATE INDEX IF NOT EXISTS idx_tech_packaging_conversations_packaging_id ON tech_packaging_conversations(packaging_id);
CREATE INDEX IF NOT EXISTS idx_tech_packaging_conversations_conversation_id ON tech_packaging_conversations(conversation_id);
CREATE INDEX IF NOT EXISTS idx_tech_packaging_sources_packaging_id ON tech_packaging_sources(packaging_id);
CREATE INDEX IF NOT EXISTS idx_tech_packaging_sources_source_id ON tech_packaging_sources(source_id);
CREATE INDEX IF NOT EXISTS idx_tech_promotion_conversations_promotion_id ON tech_promotion_conversations(promotion_id);
CREATE INDEX IF NOT EXISTS idx_tech_promotion_conversations_conversation_id ON tech_promotion_conversations(conversation_id);
CREATE INDEX IF NOT EXISTS idx_tech_promotion_sources_promotion_id ON tech_promotion_sources(promotion_id);
CREATE INDEX IF NOT EXISTS idx_tech_promotion_sources_source_id ON tech_promotion_sources(source_id);
CREATE INDEX IF NOT EXISTS idx_tech_press_conversations_press_release_id ON tech_press_conversations(press_release_id);
CREATE INDEX IF NOT EXISTS idx_tech_press_conversations_conversation_id ON tech_press_conversations(conversation_id);
CREATE INDEX IF NOT EXISTS idx_tech_press_sources_press_release_id ON tech_press_sources(press_release_id);
CREATE INDEX IF NOT EXISTS idx_tech_press_sources_source_id ON tech_press_sources(source_id);
