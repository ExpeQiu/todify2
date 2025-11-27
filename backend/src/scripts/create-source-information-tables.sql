-- 来源信息表
-- 用于存储通过 SourceSidebar 添加的信息（包括文本来源和外部来源）
CREATE TABLE IF NOT EXISTS source_information (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_id TEXT NOT NULL UNIQUE COMMENT '来源唯一标识（前端生成的ID）',
    title TEXT NOT NULL COMMENT '来源标题',
    type TEXT NOT NULL CHECK (type IN ('knowledge_base', 'external')) COMMENT '来源类型：knowledge_base=知识库，external=外部来源',
    url TEXT COMMENT '外部来源URL（仅external类型）',
    description TEXT COMMENT '来源描述/内容',
    page_type TEXT COMMENT '页面类型：tech-package, press-release, tech-strategy, tech-article',
    conversation_id TEXT COMMENT '关联的对话ID',
    metadata TEXT COMMENT '元数据（JSON格式）',
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')) COMMENT '状态',
    created_by TEXT COMMENT '创建人',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_source_information_source_id ON source_information(source_id);
CREATE INDEX IF NOT EXISTS idx_source_information_type ON source_information(type);
CREATE INDEX IF NOT EXISTS idx_source_information_page_type ON source_information(page_type);
CREATE INDEX IF NOT EXISTS idx_source_information_conversation_id ON source_information(conversation_id);
CREATE INDEX IF NOT EXISTS idx_source_information_status ON source_information(status);
CREATE INDEX IF NOT EXISTS idx_source_information_created_at ON source_information(created_at);

