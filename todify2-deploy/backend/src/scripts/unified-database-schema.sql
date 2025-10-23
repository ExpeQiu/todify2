-- Todify2 统一数据库结构
-- 合并 database.db 和 todify2.db 的所有表结构
-- 创建日期: 2024-12-19

-- ==============================================
-- 1. 聊天对话相关表 (来自 database.db)
-- ==============================================

-- 对话会话表
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

-- 聊天消息表
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

-- 工作流执行表
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

-- 知识使用日志表
CREATE TABLE IF NOT EXISTS knowledge_usage_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    message_id TEXT NOT NULL, -- 关联的消息ID
    knowledge_point_ids TEXT, -- JSON数组格式存储使用的知识点ID
    context_summary TEXT, -- JSON格式存储上下文摘要
    context_length INTEGER DEFAULT 0, -- 上下文长度
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (message_id) REFERENCES chat_messages(message_id) ON DELETE CASCADE
);

-- ==============================================
-- 2. 核心业务表 (来自 todify2.db)
-- ==============================================

-- 品牌表
CREATE TABLE IF NOT EXISTS brands (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    name_en TEXT,
    logo_url TEXT,
    country TEXT,
    founded_year INTEGER,
    description TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 车型表
CREATE TABLE IF NOT EXISTS car_models (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    brand_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    name_en TEXT,
    category TEXT CHECK (category IN ('sedan', 'suv', 'hatchback', 'coupe', 'convertible', 'wagon', 'pickup', 'van', 'mpv')),
    launch_year INTEGER,
    end_year INTEGER,
    description TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'discontinued', 'planned')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE
);

-- 车系表
CREATE TABLE IF NOT EXISTS car_series (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    model_id INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    name_en VARCHAR(255),
    description TEXT,
    launch_year INTEGER,
    end_year INTEGER,
    market_segment VARCHAR(100),
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    metadata TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (model_id) REFERENCES car_models(id),
    UNIQUE(model_id, name)
);

-- 技术分类表
CREATE TABLE IF NOT EXISTS tech_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    parent_id INTEGER,
    level INTEGER NOT NULL DEFAULT 1,
    sort_order INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES tech_categories(id)
);

-- 技术点表
CREATE TABLE IF NOT EXISTS tech_points (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category_id INTEGER,
    parent_id INTEGER,
    level INTEGER NOT NULL DEFAULT 1,
    tech_type VARCHAR(50) NOT NULL,
    priority VARCHAR(50) NOT NULL DEFAULT 'medium',
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    tags TEXT, -- JSON数组格式
    technical_details TEXT, -- JSON格式存储技术细节
    benefits TEXT, -- JSON数组格式存储优势
    applications TEXT, -- JSON数组格式存储应用场景
    keywords TEXT, -- JSON数组格式存储关键词
    source_url VARCHAR(500),
    created_by VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES tech_categories(id),
    FOREIGN KEY (parent_id) REFERENCES tech_points(id)
);

-- 技术点与车型关联表
CREATE TABLE IF NOT EXISTS tech_point_car_models (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tech_point_id INTEGER NOT NULL,
    car_model_id INTEGER NOT NULL,
    application_status VARCHAR(50) NOT NULL DEFAULT 'planned',
    implementation_date DATE,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tech_point_id) REFERENCES tech_points(id),
    FOREIGN KEY (car_model_id) REFERENCES car_models(id),
    UNIQUE(tech_point_id, car_model_id)
);

-- ==============================================
-- 3. AI生成内容表
-- ==============================================

-- 技术包装材料表
CREATE TABLE IF NOT EXISTS tech_packaging_materials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tech_point_id INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    material_type VARCHAR(50) NOT NULL,
    target_audience VARCHAR(50) NOT NULL,
    language VARCHAR(10) NOT NULL DEFAULT 'zh',
    status VARCHAR(50) NOT NULL DEFAULT 'draft',
    generation_params TEXT, -- JSON格式存储生成参数
    dify_task_id VARCHAR(255),
    created_by VARCHAR(255),
    reviewed_by VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tech_point_id) REFERENCES tech_points(id)
);

-- 技术推广策略表
CREATE TABLE IF NOT EXISTS tech_promotion_strategies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    strategy_type VARCHAR(50) NOT NULL,
    target_market VARCHAR(255),
    timeline TEXT, -- JSON格式存储时间线
    budget_range VARCHAR(100),
    kpi_metrics TEXT, -- JSON格式存储KPI指标
    status VARCHAR(50) NOT NULL DEFAULT 'draft',
    generation_params TEXT, -- JSON格式存储生成参数
    dify_task_id VARCHAR(255),
    created_by VARCHAR(255),
    reviewed_by VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 技术通稿表
CREATE TABLE IF NOT EXISTS tech_press_releases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title VARCHAR(255) NOT NULL,
    subtitle VARCHAR(255),
    content TEXT NOT NULL,
    summary TEXT,
    release_type VARCHAR(50) NOT NULL,
    target_media TEXT, -- JSON数组格式
    publication_date DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'draft',
    seo_keywords TEXT, -- JSON数组格式
    generation_params TEXT, -- JSON格式存储生成参数
    dify_task_id VARCHAR(255),
    created_by VARCHAR(255),
    reviewed_by VARCHAR(255),
    published_by VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 技术演讲稿表
CREATE TABLE IF NOT EXISTS tech_speeches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    speech_type VARCHAR(50) NOT NULL,
    duration_minutes INTEGER NOT NULL,
    target_audience VARCHAR(50) NOT NULL,
    event_name VARCHAR(255),
    event_date DATE,
    speaker_notes TEXT,
    slides_outline TEXT, -- JSON格式存储幻灯片大纲
    status VARCHAR(50) NOT NULL DEFAULT 'draft',
    generation_params TEXT, -- JSON格式存储生成参数
    dify_task_id VARCHAR(255),
    created_by VARCHAR(255),
    reviewed_by VARCHAR(255),
    delivered_by VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================
-- 4. 关联关系表
-- ==============================================

-- 推广策略与技术点关联表
CREATE TABLE IF NOT EXISTS promotion_tech_points (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    promotion_id INTEGER NOT NULL,
    tech_point_id INTEGER NOT NULL,
    weight DECIMAL(3,2) NOT NULL DEFAULT 1.0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (promotion_id) REFERENCES tech_promotion_strategies(id),
    FOREIGN KEY (tech_point_id) REFERENCES tech_points(id),
    UNIQUE(promotion_id, tech_point_id)
);

-- 通稿与技术点关联表
CREATE TABLE IF NOT EXISTS press_tech_points (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    press_release_id INTEGER NOT NULL,
    tech_point_id INTEGER NOT NULL,
    weight DECIMAL(3,2) NOT NULL DEFAULT 1.0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (press_release_id) REFERENCES tech_press_releases(id),
    FOREIGN KEY (tech_point_id) REFERENCES tech_points(id),
    UNIQUE(press_release_id, tech_point_id)
);

-- 演讲稿与技术点关联表
CREATE TABLE IF NOT EXISTS speech_tech_points (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    speech_id INTEGER NOT NULL,
    tech_point_id INTEGER NOT NULL,
    weight DECIMAL(3,2) NOT NULL DEFAULT 1.0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (speech_id) REFERENCES tech_speeches(id),
    FOREIGN KEY (tech_point_id) REFERENCES tech_points(id),
    UNIQUE(speech_id, tech_point_id)
);

-- ==============================================
-- 5. 知识点相关表
-- ==============================================

-- 知识点表
CREATE TABLE IF NOT EXISTS knowledge_points (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    source_query TEXT,
    source_url TEXT,
    source_type TEXT DEFAULT 'ai_search' CHECK (source_type IN ('ai_search', 'manual', 'import')),
    metadata TEXT, -- JSON字符串格式
    tags TEXT, -- JSON字符串格式
    relevance_score REAL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
    dify_task_id TEXT,
    ai_search_session_id TEXT,
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 技术点与知识点关联表
CREATE TABLE IF NOT EXISTS tech_point_knowledge_points (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tech_point_id INTEGER NOT NULL,
    knowledge_point_id INTEGER NOT NULL,
    relation_type TEXT DEFAULT 'related' CHECK (relation_type IN ('reference', 'support', 'related', 'example')),
    relevance_score REAL,
    notes TEXT,
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tech_point_id) REFERENCES tech_points(id) ON DELETE CASCADE,
    FOREIGN KEY (knowledge_point_id) REFERENCES knowledge_points(id) ON DELETE CASCADE,
    UNIQUE(tech_point_id, knowledge_point_id)
);

-- 知识点收藏表
CREATE TABLE IF NOT EXISTS knowledge_point_favorites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    knowledge_point_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (knowledge_point_id) REFERENCES knowledge_points(id) ON DELETE CASCADE,
    UNIQUE(user_id, knowledge_point_id)
);
