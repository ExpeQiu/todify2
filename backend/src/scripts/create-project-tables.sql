-- 项目表
-- 用于存储项目信息
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

-- 项目来源表
-- 用于关联项目与各种来源（文件、URL、文本、技术点等）
CREATE TABLE IF NOT EXISTS project_sources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    source_type TEXT NOT NULL CHECK (source_type IN ('file', 'url', 'text', 'tech_point', 'knowledge_point')),
    source_content TEXT NOT NULL,
    source_title TEXT,
    source_description TEXT,
    metadata TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_projects_type ON projects(type);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at);
CREATE INDEX IF NOT EXISTS idx_projects_last_opened_at ON projects(last_opened_at);
CREATE INDEX IF NOT EXISTS idx_project_sources_project_id ON project_sources(project_id);
CREATE INDEX IF NOT EXISTS idx_project_sources_source_type ON project_sources(source_type);
