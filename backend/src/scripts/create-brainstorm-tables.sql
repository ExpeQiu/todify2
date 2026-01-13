-- 头脑风暴群聊功能数据库表结构
-- 用于存储多Agent协作讨论的会话、参与者和消息

-- 1. 头脑风暴会话表
CREATE TABLE IF NOT EXISTS brainstorm_sessions (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    topic TEXT NOT NULL,
    description TEXT,
    creator_id TEXT,
    project_id INTEGER, -- 关联的项目ID
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'stopped')),
    config TEXT, -- JSON格式存储配置（终止条件等）
    summary TEXT, -- AI生成的讨论总结
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME
);

-- 2. 参与者表
CREATE TABLE IF NOT EXISTS brainstorm_participants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    ai_role_id TEXT NOT NULL,
    display_name TEXT,
    role_type TEXT, -- 角色类型（专家领域）
    sort_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES brainstorm_sessions(id) ON DELETE CASCADE
);

-- 3. 讨论消息表
CREATE TABLE IF NOT EXISTS brainstorm_messages (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    participant_id INTEGER NOT NULL,
    round_number INTEGER NOT NULL DEFAULT 1,
    content TEXT NOT NULL,
    reply_to_id TEXT, -- 回复的消息ID（可选）
    metadata TEXT, -- JSON格式存储元数据（token使用等）
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES brainstorm_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (participant_id) REFERENCES brainstorm_participants(id) ON DELETE CASCADE,
    FOREIGN KEY (reply_to_id) REFERENCES brainstorm_messages(id) ON DELETE SET NULL
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_brainstorm_sessions_status ON brainstorm_sessions(status);
CREATE INDEX IF NOT EXISTS idx_brainstorm_sessions_created_at ON brainstorm_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_brainstorm_sessions_creator_id ON brainstorm_sessions(creator_id);
CREATE INDEX IF NOT EXISTS idx_brainstorm_sessions_project_id ON brainstorm_sessions(project_id);

CREATE INDEX IF NOT EXISTS idx_brainstorm_participants_session_id ON brainstorm_participants(session_id);
CREATE INDEX IF NOT EXISTS idx_brainstorm_participants_ai_role_id ON brainstorm_participants(ai_role_id);
CREATE INDEX IF NOT EXISTS idx_brainstorm_participants_sort_order ON brainstorm_participants(sort_order);

CREATE INDEX IF NOT EXISTS idx_brainstorm_messages_session_id ON brainstorm_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_brainstorm_messages_participant_id ON brainstorm_messages(participant_id);
CREATE INDEX IF NOT EXISTS idx_brainstorm_messages_round_number ON brainstorm_messages(round_number);
CREATE INDEX IF NOT EXISTS idx_brainstorm_messages_created_at ON brainstorm_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_brainstorm_messages_reply_to_id ON brainstorm_messages(reply_to_id);

