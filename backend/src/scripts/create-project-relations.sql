-- 项目关联表创建脚本
-- 用于关联项目与技术点、知识点、文件等资源

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

-- 项目与知识点关联表
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
    file_id INTEGER NOT NULL,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE,
    UNIQUE(project_id, file_id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_project_tech_points_project_id ON project_tech_points(project_id);
CREATE INDEX IF NOT EXISTS idx_project_tech_points_tech_point_id ON project_tech_points(tech_point_id);
CREATE INDEX IF NOT EXISTS idx_project_knowledge_points_project_id ON project_knowledge_points(project_id);
CREATE INDEX IF NOT EXISTS idx_project_knowledge_points_knowledge_point_id ON project_knowledge_points(knowledge_point_id);
CREATE INDEX IF NOT EXISTS idx_project_files_project_id ON project_files(project_id);
CREATE INDEX IF NOT EXISTS idx_project_files_file_id ON project_files(file_id);

