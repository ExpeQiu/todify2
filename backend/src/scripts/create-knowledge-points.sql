-- 知识点表创建脚本
-- 用于存储从AI搜索等来源获取的知识点

CREATE TABLE IF NOT EXISTS knowledge_points (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tech_point_id INTEGER,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    knowledge_type TEXT DEFAULT 'concept' CHECK (knowledge_type IN ('concept', 'tutorial', 'example', 'reference', 'best_practice')),
    difficulty_level TEXT DEFAULT 'medium' CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
    tags TEXT, -- JSON数组格式
    prerequisites TEXT, -- JSON数组格式，前置知识点
    learning_objectives TEXT, -- JSON数组格式，学习目标
    examples TEXT, -- JSON数组格式，示例代码或案例
    "references" TEXT, -- JSON数组格式，参考资料（references是SQLite关键字，需要引号）
    source_query TEXT,
    source_url TEXT,
    source_type TEXT DEFAULT 'import' CHECK (source_type IN ('ai_search', 'manual', 'import')),
    metadata TEXT, -- JSON格式的元数据
    relevance_score REAL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
    dify_task_id TEXT,
    ai_search_session_id TEXT,
    created_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tech_point_id) REFERENCES tech_points(id) ON DELETE CASCADE
);

-- 技术点与知识点关联表
CREATE TABLE IF NOT EXISTS tech_point_knowledge_points (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tech_point_id INTEGER NOT NULL,
    knowledge_point_id INTEGER NOT NULL,
    relation_type TEXT DEFAULT 'related' CHECK (relation_type IN ('reference', 'support', 'related', 'example')),
    relevance_score REAL,
    notes TEXT,
    created_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tech_point_id) REFERENCES tech_points(id) ON DELETE CASCADE,
    FOREIGN KEY (knowledge_point_id) REFERENCES knowledge_points(id) ON DELETE CASCADE,
    UNIQUE(tech_point_id, knowledge_point_id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_knowledge_points_tech_point_id ON knowledge_points(tech_point_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_points_title ON knowledge_points(title);
CREATE INDEX IF NOT EXISTS idx_knowledge_points_status ON knowledge_points(status);
CREATE INDEX IF NOT EXISTS idx_knowledge_points_created_at ON knowledge_points(created_at);
CREATE INDEX IF NOT EXISTS idx_knowledge_points_source_type ON knowledge_points(source_type);
CREATE INDEX IF NOT EXISTS idx_knowledge_points_knowledge_type ON knowledge_points(knowledge_type);
CREATE INDEX IF NOT EXISTS idx_tech_point_knowledge_points_tech_point_id ON tech_point_knowledge_points(tech_point_id);
CREATE INDEX IF NOT EXISTS idx_tech_point_knowledge_points_knowledge_point_id ON tech_point_knowledge_points(knowledge_point_id);

