-- 聊天消息相关数据库表结构
-- 用于存储AI对话和Dify返回消息

-- 1. 对话会话表
CREATE TABLE IF NOT EXISTS conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conversation_id TEXT UNIQUE NOT NULL, -- Dify返回的conversation_id
    user_id TEXT, -- 用户标识
    session_name TEXT, -- 会话名称
    app_type TEXT NOT NULL, -- AI应用类型 (ai-search, tech-package等)
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
    metadata TEXT, -- JSON格式存储额外信息
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. 聊天消息表
CREATE TABLE IF NOT EXISTS chat_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    message_id TEXT UNIQUE NOT NULL, -- Dify返回的message_id
    conversation_id TEXT NOT NULL, -- 关联对话会话
    task_id TEXT, -- Dify返回的task_id
    message_type TEXT NOT NULL CHECK (message_type IN ('user', 'assistant')), -- 消息类型
    content TEXT NOT NULL, -- 消息内容
    query TEXT, -- 用户查询内容（仅用户消息）
    inputs TEXT, -- JSON格式存储输入参数
    app_type TEXT NOT NULL, -- AI应用类型
    
    -- Dify响应相关字段
    dify_event TEXT, -- Dify事件类型
    dify_mode TEXT, -- Dify模式
    dify_answer TEXT, -- Dify回答内容
    
    -- 使用统计
    prompt_tokens INTEGER DEFAULT 0,
    completion_tokens INTEGER DEFAULT 0,
    total_tokens INTEGER DEFAULT 0,
    total_price TEXT, -- 总费用
    currency TEXT DEFAULT 'USD',
    latency REAL DEFAULT 0, -- 响应延迟（秒）
    
    -- 检索资源（JSON格式）
    retriever_resources TEXT, -- Dify检索到的资源
    
    -- 状态和时间
    status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    error_message TEXT, -- 错误信息
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (conversation_id) REFERENCES conversations(conversation_id) ON DELETE CASCADE
);

-- 3. 工作流执行记录表（用于技术包装等工作流应用）
CREATE TABLE IF NOT EXISTS workflow_executions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    workflow_run_id TEXT UNIQUE NOT NULL, -- Dify工作流运行ID
    task_id TEXT NOT NULL, -- 任务ID
    message_id TEXT, -- 关联的消息ID
    workflow_id TEXT, -- 工作流ID
    app_type TEXT NOT NULL, -- 应用类型
    
    -- 执行状态
    status TEXT NOT NULL, -- 执行状态
    error_message TEXT, -- 错误信息
    
    -- 输入输出
    inputs TEXT, -- JSON格式存储输入
    outputs TEXT, -- JSON格式存储输出
    
    -- 执行统计
    elapsed_time REAL DEFAULT 0, -- 执行时间（秒）
    total_tokens INTEGER DEFAULT 0,
    total_steps INTEGER DEFAULT 0,
    
    -- 时间戳
    started_at DATETIME, -- 开始时间
    finished_at DATETIME, -- 完成时间
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (message_id) REFERENCES chat_messages(message_id) ON DELETE SET NULL
);

-- 4. 知识点使用记录表（记录AI搜索中使用的知识点）
CREATE TABLE IF NOT EXISTS knowledge_usage_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    message_id TEXT NOT NULL, -- 关联的消息ID
    knowledge_point_ids TEXT, -- JSON数组格式存储使用的知识点ID
    context_summary TEXT, -- JSON格式存储上下文摘要
    context_length INTEGER DEFAULT 0, -- 上下文长度
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (message_id) REFERENCES chat_messages(message_id) ON DELETE CASCADE
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_conversations_conversation_id ON conversations(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_app_type ON conversations(app_type);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON conversations(created_at);

CREATE INDEX IF NOT EXISTS idx_chat_messages_message_id ON chat_messages(message_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_id ON chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_task_id ON chat_messages(task_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_message_type ON chat_messages(message_type);
CREATE INDEX IF NOT EXISTS idx_chat_messages_app_type ON chat_messages(app_type);
CREATE INDEX IF NOT EXISTS idx_chat_messages_status ON chat_messages(status);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);

CREATE INDEX IF NOT EXISTS idx_workflow_executions_workflow_run_id ON workflow_executions(workflow_run_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_task_id ON workflow_executions(task_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_message_id ON workflow_executions(message_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_app_type ON workflow_executions(app_type);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_status ON workflow_executions(status);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_created_at ON workflow_executions(created_at);

CREATE INDEX IF NOT EXISTS idx_knowledge_usage_logs_message_id ON knowledge_usage_logs(message_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_usage_logs_created_at ON knowledge_usage_logs(created_at);