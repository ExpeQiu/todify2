-- 公开页面配置相关数据库表

-- 公开页面配置表
CREATE TABLE IF NOT EXISTS public_page_configs (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    address TEXT,                              -- 地址配置
    display_mode TEXT NOT NULL DEFAULT 'all',  -- all/workflow/custom
    workflow_id TEXT,                          -- 关联的工作流ID（workflow模式）
    role_ids TEXT,                             -- JSON字符串，角色ID列表（custom模式）
    access_token TEXT NOT NULL UNIQUE,         -- 访问令牌，用于生成访问链接
    is_active INTEGER DEFAULT 1,               -- 0或1，是否启用
    template_type TEXT,                        -- 模板类型: 'speech', 'ai-chat', 'custom'
    custom_html TEXT,                          -- 自定义HTML内容
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_public_page_configs_token ON public_page_configs(access_token);
CREATE INDEX IF NOT EXISTS idx_public_page_configs_active ON public_page_configs(is_active);
CREATE INDEX IF NOT EXISTS idx_public_page_configs_created ON public_page_configs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_public_page_configs_workflow ON public_page_configs(workflow_id) WHERE workflow_id IS NOT NULL;

-- 创建触发器，自动更新updated_at字段
CREATE TRIGGER IF NOT EXISTS update_public_page_configs_updated_at
AFTER UPDATE ON public_page_configs
BEGIN
    UPDATE public_page_configs SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

