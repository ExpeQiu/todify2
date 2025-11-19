-- 页面工具配置相关数据库表
-- 用于管理每个页面可用的工具列表和标签映射

-- 页面工具配置表
CREATE TABLE IF NOT EXISTS page_tool_configs (
    id TEXT PRIMARY KEY,
    page_type TEXT NOT NULL UNIQUE,  -- 页面类型: 'tech-package', 'press-release', 'tech-strategy', 'tech-article'
    page_title TEXT NOT NULL,         -- 页面标题
    dialogue_title TEXT NOT NULL,     -- 对话标题
    studio_title TEXT NOT NULL,       -- Studio侧边栏标题
    workflow_selection_key TEXT NOT NULL,  -- 工作流选择键
    enabled_tool_ids TEXT,            -- JSON数组，启用的工具ID列表
    feature_label_map TEXT,           -- JSON对象，功能标签映射
    is_active INTEGER DEFAULT 1,     -- 0或1，是否启用
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_page_tool_configs_page_type ON page_tool_configs(page_type);
CREATE INDEX IF NOT EXISTS idx_page_tool_configs_active ON page_tool_configs(is_active);

-- 创建触发器，自动更新updated_at字段
CREATE TRIGGER IF NOT EXISTS update_page_tool_configs_updated_at
AFTER UPDATE ON page_tool_configs
BEGIN
    UPDATE page_tool_configs SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- 插入默认配置数据（使用INSERT OR REPLACE for SQLite，或使用ON CONFLICT for PostgreSQL）
-- SQLite版本
INSERT OR REPLACE INTO page_tool_configs (
    id,
    page_type,
    page_title,
    dialogue_title,
    studio_title,
    workflow_selection_key,
    enabled_tool_ids,
    feature_label_map,
    is_active
) VALUES
-- 技术包装页面配置
(
    'tech-package-default',
    'tech-package',
    '技术包装',
    'AI内容助手',
    '更多工具箱',
    'ai-search.workflows.selection.tech-package',
    '["five-view-analysis","three-fix-analysis","tech-matrix","propagation-strategy","exhibition-video","translation","ppt-outline","script"]',
    '{"five-view-analysis":"五看","three-fix-analysis":"三定","tech-matrix":"技术矩阵","propagation-strategy":"传播","exhibition-video":"展具与视频","translation":"翻译","ppt-outline":"技术讲稿","script":"脚本"}',
    1
),
-- 发布会稿页面配置
(
    'press-release-default',
    'press-release',
    '发布会稿',
    'AI内容助手',
    '更多工具箱',
    'ai-search.workflows.selection.press-release',
    '["five-view-analysis","three-fix-analysis","tech-matrix","propagation-strategy","translation","ppt-outline"]',
    '{"five-view-analysis":"技术转译","three-fix-analysis":"用户场景挖掘","tech-matrix":"发布会场景化","propagation-strategy":"领导人口语化","exhibition-video":"展具与视频","translation":"翻译","ppt-outline":"技术讲稿","script":"脚本"}',
    1
),
-- 技术策略页面配置
(
    'tech-strategy-default',
    'tech-strategy',
    '技术策略',
    'AI内容助手',
    '更多工具箱',
    'ai-search.workflows.selection.tech-strategy',
    '["propagation-strategy","five-view-analysis","three-fix-analysis","translation"]',
    '{"five-view-analysis":"技术转译","three-fix-analysis":"用户场景挖掘","tech-matrix":"技术矩阵","propagation-strategy":"传播策略","exhibition-video":"展具与视频","translation":"翻译","ppt-outline":"技术讲稿","script":"脚本"}',
    1
),
-- 技术通稿页面配置
(
    'tech-article-default',
    'tech-article',
    '技术通稿',
    'AI内容助手',
    '更多工具箱',
    'ai-search.workflows.selection.tech-article',
    '["ppt-outline","translation"]',
    '{"five-view-analysis":"技术转译","three-fix-analysis":"用户场景挖掘","tech-matrix":"技术矩阵","propagation-strategy":"传播策略","exhibition-video":"展具与视频","translation":"翻译","ppt-outline":"技术讲稿","script":"脚本"}',
    1
);

