-- Agent工作流相关数据库表

-- 1. Agent工作流表
CREATE TABLE IF NOT EXISTS agent_workflows (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    version TEXT NOT NULL DEFAULT '1.0.0',
    nodes TEXT NOT NULL,              -- JSON字符串，存储节点列表
    edges TEXT NOT NULL,              -- JSON字符串，存储边列表
    metadata TEXT,                     -- JSON字符串，存储元数据
    published INTEGER DEFAULT 0,       -- 0或1，是否已发布（只有发布的工作流才能被前端页面绑定）
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 添加 published 字段（如果表已存在）
ALTER TABLE agent_workflows ADD COLUMN published INTEGER DEFAULT 0;

-- 2. 工作流执行表
CREATE TABLE IF NOT EXISTS workflow_executions (
    id TEXT PRIMARY KEY,
    workflow_id TEXT NOT NULL,
    workflow_name TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    shared_context TEXT NOT NULL DEFAULT '{}', -- JSON字符串，共享上下文
    node_results TEXT NOT NULL DEFAULT '[]',   -- JSON字符串，节点执行结果列表
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    duration INTEGER,                          -- 毫秒
    error TEXT,                                -- JSON字符串，错误信息
    metadata TEXT,                             -- JSON字符串，元数据
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (workflow_id) REFERENCES agent_workflows(id) ON DELETE CASCADE
);

-- 3. 工作流模板表
CREATE TABLE IF NOT EXISTS workflow_templates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    thumbnail TEXT,
    workflow_structure TEXT NOT NULL,  -- JSON字符串，存储工作流结构
    metadata TEXT,                     -- JSON字符串，元数据
    is_public INTEGER DEFAULT 0,       -- 0或1，是否公开
    usage_count INTEGER DEFAULT 0,     -- 使用次数
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_agent_workflows_name ON agent_workflows(name);
CREATE INDEX IF NOT EXISTS idx_agent_workflows_updated ON agent_workflows(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_workflows_published ON agent_workflows(published);

CREATE INDEX IF NOT EXISTS idx_workflow_executions_workflow_id ON workflow_executions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_status ON workflow_executions(status);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_created ON workflow_executions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_workflow_templates_category ON workflow_templates(category);
CREATE INDEX IF NOT EXISTS idx_workflow_templates_public ON workflow_templates(is_public);
CREATE INDEX IF NOT EXISTS idx_workflow_templates_usage ON workflow_templates(usage_count DESC);

-- 创建触发器，自动更新updated_at字段
CREATE TRIGGER IF NOT EXISTS update_agent_workflows_updated_at
AFTER UPDATE ON agent_workflows
BEGIN
    UPDATE agent_workflows SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_workflow_executions_updated_at
AFTER UPDATE ON workflow_executions
BEGIN
    UPDATE workflow_executions SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_workflow_templates_updated_at
AFTER UPDATE ON workflow_templates
BEGIN
    UPDATE workflow_templates SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

