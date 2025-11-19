-- 更新workflow_executions表结构以支持统一表
-- 版本: 2.0.0
-- 创建日期: 2025-01-XX
-- 说明: 将workflow_executions表更新为统一结构，支持Agent工作流和Dify工作流

-- 由于SQLite的限制，我们需要重新创建表
-- 步骤：
-- 1. 创建临时表保存旧数据
-- 2. 删除旧表
-- 3. 创建新表
-- 4. 迁移数据
-- 5. 删除临时表

-- 创建临时表保存旧数据
CREATE TABLE IF NOT EXISTS workflow_executions_old AS SELECT * FROM workflow_executions;

-- 删除旧表和相关索引
DROP TABLE IF EXISTS workflow_executions;

-- 创建新表（统一结构）
CREATE TABLE IF NOT EXISTS workflow_executions (
    id TEXT PRIMARY KEY,
    execution_type TEXT NOT NULL CHECK (execution_type IN ('agent_workflow', 'dify_workflow')),
    
    -- Agent工作流执行字段
    workflow_id TEXT,                  -- 关联agent_workflows.id
    workflow_name TEXT,
    shared_context TEXT DEFAULT '{}',  -- JSON字符串，共享上下文
    node_results TEXT DEFAULT '[]',    -- JSON字符串，节点执行结果列表
    
    -- Dify工作流执行字段
    workflow_run_id TEXT UNIQUE,       -- Dify工作流运行ID
    task_id TEXT,                      -- Dify任务ID
    message_id TEXT,                    -- 关联chat_messages.message_id
    app_type TEXT,                      -- 应用类型
    
    -- 通用执行字段
    status TEXT NOT NULL DEFAULT 'pending',
    error_message TEXT,                -- 错误信息
    inputs TEXT,                        -- JSON格式存储输入
    outputs TEXT,                       -- JSON格式存储输出
    
    -- 执行统计
    elapsed_time REAL DEFAULT 0,        -- 执行时间（秒）
    total_tokens INTEGER DEFAULT 0,
    total_steps INTEGER DEFAULT 0,
    duration INTEGER,                   -- 持续时间（毫秒，用于Agent工作流）
    
    -- 时间戳
    start_time TIMESTAMP,              -- 开始时间
    end_time TIMESTAMP,                -- 结束时间
    started_at DATETIME,                -- 开始时间（Dify工作流）
    finished_at DATETIME,              -- 完成时间（Dify工作流）
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (workflow_id) REFERENCES agent_workflows(id) ON DELETE SET NULL,
    FOREIGN KEY (message_id) REFERENCES chat_messages(message_id) ON DELETE SET NULL
);

-- 迁移旧数据（假设都是agent_workflow类型）
INSERT INTO workflow_executions (
    id, execution_type, workflow_id, workflow_name, shared_context, node_results,
    status, error_message, duration,
    start_time, end_time, created_at, updated_at
)
SELECT 
    id,
    'agent_workflow' as execution_type,
    workflow_id,
    workflow_name,
    COALESCE(shared_context, '{}') as shared_context,
    COALESCE(node_results, '[]') as node_results,
    status,
    error as error_message,
    duration,
    start_time,
    end_time,
    created_at,
    updated_at
FROM workflow_executions_old;

-- 删除临时表
DROP TABLE IF EXISTS workflow_executions_old;
