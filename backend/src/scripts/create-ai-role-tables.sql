-- AI角色相关数据库表

-- 1. AI角色表
CREATE TABLE IF NOT EXISTS ai_roles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    avatar TEXT,                     -- 角色头像URL（可选）
    system_prompt TEXT,               -- 系统提示词（可选）
    dify_config TEXT NOT NULL,       -- JSON字符串，存储Dify配置（apiUrl, apiKey, connectionType, inputFields）
    enabled INTEGER NOT NULL DEFAULT 1, -- 0或1，是否启用
    source TEXT,                     -- 来源标记：'smart-workflow', 'independent-page', 'custom'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_ai_roles_name ON ai_roles(name);
CREATE INDEX IF NOT EXISTS idx_ai_roles_enabled ON ai_roles(enabled);
CREATE INDEX IF NOT EXISTS idx_ai_roles_source ON ai_roles(source);
CREATE INDEX IF NOT EXISTS idx_ai_roles_updated ON ai_roles(updated_at DESC);

-- 创建触发器，自动更新updated_at字段
CREATE TRIGGER IF NOT EXISTS update_ai_roles_updated_at
AFTER UPDATE ON ai_roles
BEGIN
    UPDATE ai_roles SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

