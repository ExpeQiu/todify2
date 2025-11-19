-- Todify3 统一数据库架构 v2.0
-- 创建日期: 2025-01-XX
-- 说明: 整合所有表定义，统一命名规范，解决表结构冲突

-- ==============================================
-- 第一层：基础数据层
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
    FOREIGN KEY (model_id) REFERENCES car_models(id) ON DELETE CASCADE,
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
    FOREIGN KEY (parent_id) REFERENCES tech_categories(id) ON DELETE SET NULL
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
    FOREIGN KEY (category_id) REFERENCES tech_categories(id) ON DELETE SET NULL,
    FOREIGN KEY (parent_id) REFERENCES tech_points(id) ON DELETE SET NULL
);

-- ==============================================
-- 第二层：关联关系层
-- ==============================================

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
    FOREIGN KEY (tech_point_id) REFERENCES tech_points(id) ON DELETE CASCADE,
    FOREIGN KEY (car_model_id) REFERENCES car_models(id) ON DELETE CASCADE,
    UNIQUE(tech_point_id, car_model_id)
);

-- ==============================================
-- 第三层：AI内容生成层
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
    FOREIGN KEY (tech_point_id) REFERENCES tech_points(id) ON DELETE CASCADE
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

-- 推广策略与技术点关联表
CREATE TABLE IF NOT EXISTS promotion_tech_points (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    promotion_id INTEGER NOT NULL,
    tech_point_id INTEGER NOT NULL,
    weight DECIMAL(3,2) NOT NULL DEFAULT 1.0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (promotion_id) REFERENCES tech_promotion_strategies(id) ON DELETE CASCADE,
    FOREIGN KEY (tech_point_id) REFERENCES tech_points(id) ON DELETE CASCADE,
    UNIQUE(promotion_id, tech_point_id)
);

-- 通稿与技术点关联表
CREATE TABLE IF NOT EXISTS press_tech_points (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    press_release_id INTEGER NOT NULL,
    tech_point_id INTEGER NOT NULL,
    weight DECIMAL(3,2) NOT NULL DEFAULT 1.0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (press_release_id) REFERENCES tech_press_releases(id) ON DELETE CASCADE,
    FOREIGN KEY (tech_point_id) REFERENCES tech_points(id) ON DELETE CASCADE,
    UNIQUE(press_release_id, tech_point_id)
);

-- 演讲稿与技术点关联表
CREATE TABLE IF NOT EXISTS speech_tech_points (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    speech_id INTEGER NOT NULL,
    tech_point_id INTEGER NOT NULL,
    weight DECIMAL(3,2) NOT NULL DEFAULT 1.0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (speech_id) REFERENCES tech_speeches(id) ON DELETE CASCADE,
    FOREIGN KEY (tech_point_id) REFERENCES tech_points(id) ON DELETE CASCADE,
    UNIQUE(speech_id, tech_point_id)
);

-- ==============================================
-- 第四层：工作流与对话层
-- ==============================================

-- Agent工作流表
CREATE TABLE IF NOT EXISTS agent_workflows (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    version TEXT NOT NULL DEFAULT '1.0.0',
    nodes TEXT NOT NULL,              -- JSON字符串，存储节点列表
    edges TEXT NOT NULL,              -- JSON字符串，存储边列表
    metadata TEXT,                     -- JSON字符串，存储元数据
    published INTEGER DEFAULT 0,       -- 0或1，是否已发布
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 工作流模板表
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

-- 统一的工作流执行表（合并Agent工作流和Dify工作流执行记录）
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
-- 第五层：配置与统计层
-- ==============================================

-- AI角色表
CREATE TABLE IF NOT EXISTS ai_roles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    avatar TEXT,                     -- 角色头像URL（可选）
    system_prompt TEXT,               -- 系统提示词（可选）
    dify_config TEXT NOT NULL,       -- JSON字符串，存储Dify配置
    enabled INTEGER NOT NULL DEFAULT 1, -- 0或1，是否启用
    source TEXT,                     -- 来源标记：'smart-workflow', 'independent-page', 'custom'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 公开页面配置表
CREATE TABLE IF NOT EXISTS public_page_configs (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    address TEXT,                              -- 地址配置
    display_mode TEXT NOT NULL DEFAULT 'all',  -- all/workflow/custom/role
    workflow_id TEXT,                          -- 关联的工作流ID（workflow模式）
    role_ids TEXT,                             -- JSON字符串，角色ID列表（custom/role模式）
    access_token TEXT NOT NULL UNIQUE,         -- 访问令牌，用于生成访问链接
    is_active INTEGER DEFAULT 1,               -- 0或1，是否启用
    template_type TEXT,                        -- 模板类型: 'speech', 'ai-chat', 'custom'
    custom_html TEXT,                          -- 自定义HTML内容
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

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

-- 文件存储表
CREATE TABLE IF NOT EXISTS files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    file_id TEXT UNIQUE NOT NULL, -- 文件唯一标识
    original_name TEXT NOT NULL, -- 原始文件名
    stored_name TEXT NOT NULL, -- 存储的文件名
    file_path TEXT NOT NULL, -- 文件存储路径
    file_url TEXT NOT NULL, -- 文件访问URL
    mime_type TEXT NOT NULL, -- 文件MIME类型
    file_size INTEGER NOT NULL, -- 文件大小（字节）
    file_hash TEXT, -- 文件哈希值（用于去重）
    category TEXT DEFAULT 'general', -- 文件分类
    tags TEXT, -- JSON数组格式存储标签
    description TEXT, -- 文件描述
    uploader_id TEXT, -- 上传者ID
    conversation_id TEXT, -- 关联的对话ID（可选）
    usage_count INTEGER DEFAULT 0, -- 使用次数
    last_used_at DATETIME, -- 最后使用时间
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
    metadata TEXT, -- JSON格式存储额外信息
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 工作流节点使用统计表
CREATE TABLE IF NOT EXISTS workflow_node_usage (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    node_id TEXT NOT NULL, -- 节点ID
    node_name TEXT NOT NULL, -- 节点名称
    node_type TEXT NOT NULL, -- 节点类型
    session_id TEXT NOT NULL, -- 会话ID
    user_id TEXT, -- 用户ID
    ai_role_id TEXT, -- 关联AI角色ID
    workflow_execution_id TEXT, -- 关联工作流执行ID
    
    -- 使用统计
    usage_count INTEGER DEFAULT 1,
    total_time_spent REAL DEFAULT 0,
    avg_response_time REAL DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    failure_count INTEGER DEFAULT 0,
    
    -- 内容统计
    total_characters INTEGER DEFAULT 0,
    avg_characters INTEGER DEFAULT 0,
    content_quality_score REAL DEFAULT 0,
    
    -- 用户交互统计
    likes_count INTEGER DEFAULT 0,
    dislikes_count INTEGER DEFAULT 0,
    regenerations_count INTEGER DEFAULT 0,
    adoptions_count INTEGER DEFAULT 0,
    edits_count INTEGER DEFAULT 0,
    
    -- 工作流上下文
    is_workflow_mode BOOLEAN DEFAULT FALSE,
    is_standalone_mode BOOLEAN DEFAULT FALSE,
    previous_node_id TEXT,
    next_node_id TEXT,
    
    -- 时间戳
    first_used_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_used_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (ai_role_id) REFERENCES ai_roles(id) ON DELETE SET NULL,
    FOREIGN KEY (workflow_execution_id) REFERENCES workflow_executions(id) ON DELETE SET NULL
);

-- AI问答评价统计表
CREATE TABLE IF NOT EXISTS ai_qa_feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    message_id TEXT NOT NULL, -- 关联的消息ID
    node_id TEXT NOT NULL, -- 节点ID
    session_id TEXT NOT NULL, -- 会话ID
    user_id TEXT, -- 用户ID
    ai_role_id TEXT, -- 关联AI角色ID
    workflow_execution_id TEXT, -- 关联工作流执行ID
    
    -- 评价类型
    feedback_type TEXT NOT NULL CHECK (feedback_type IN ('like', 'dislike', 'adopt', 'regenerate', 'edit')),
    feedback_value INTEGER DEFAULT 0,
    feedback_comment TEXT,
    
    -- 内容分析
    response_time REAL,
    content_length INTEGER,
    content_quality_score REAL,
    
    -- 上下文信息
    query_text TEXT,
    response_text TEXT,
    context_data TEXT, -- JSON格式
    
    -- 时间戳
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (ai_role_id) REFERENCES ai_roles(id) ON DELETE SET NULL,
    FOREIGN KEY (workflow_execution_id) REFERENCES workflow_executions(id) ON DELETE SET NULL
);

-- 工作流会话统计表
CREATE TABLE IF NOT EXISTS workflow_session_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT UNIQUE NOT NULL, -- 会话ID
    user_id TEXT, -- 用户ID
    
    -- 会话基本信息
    session_start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    session_end_time DATETIME,
    session_duration REAL DEFAULT 0,
    
    -- 工作流完整性统计
    total_nodes_visited INTEGER DEFAULT 0,
    completed_nodes INTEGER DEFAULT 0,
    skipped_nodes INTEGER DEFAULT 0,
    
    -- 节点访问记录（JSON格式）
    node_visit_sequence TEXT,
    node_completion_status TEXT,
    
    -- 跳出点分析
    exit_node_id TEXT,
    exit_reason TEXT,
    exit_time DATETIME,
    
    -- 工作流路径分析
    workflow_path TEXT, -- JSON格式
    path_efficiency_score REAL DEFAULT 0,
    
    -- 用户满意度
    overall_satisfaction_score REAL,
    user_feedback TEXT,
    
    -- 时间戳
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 节点内容处理统计表
CREATE TABLE IF NOT EXISTS node_content_processing (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    node_id TEXT NOT NULL, -- 节点ID
    session_id TEXT NOT NULL, -- 会话ID
    message_id TEXT, -- 消息ID
    ai_role_id TEXT, -- 关联AI角色ID
    workflow_execution_id TEXT, -- 关联工作流执行ID
    
    -- 内容处理类型
    processing_type TEXT NOT NULL CHECK (processing_type IN ('direct_adopt', 'edit_adopt', 'regenerate', 'abandon')),
    processing_time REAL,
    
    -- 内容分析
    original_content_length INTEGER,
    final_content_length INTEGER,
    edit_ratio REAL DEFAULT 0,
    
    -- 编辑详情
    edit_count INTEGER DEFAULT 0,
    edit_types TEXT, -- JSON格式
    edit_duration REAL DEFAULT 0,
    
    -- 用户行为
    user_satisfaction_score REAL,
    user_behavior_data TEXT, -- JSON格式
    
    -- 时间戳
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (ai_role_id) REFERENCES ai_roles(id) ON DELETE SET NULL,
    FOREIGN KEY (workflow_execution_id) REFERENCES workflow_executions(id) ON DELETE SET NULL
);

-- 实时统计汇总表
CREATE TABLE IF NOT EXISTS workflow_stats_summary (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    stat_date DATE NOT NULL, -- 统计日期
    node_id TEXT NOT NULL, -- 节点ID
    
    -- 使用统计
    total_usage_count INTEGER DEFAULT 0,
    unique_users INTEGER DEFAULT 0,
    avg_response_time REAL DEFAULT 0,
    success_rate REAL DEFAULT 0,
    
    -- 内容统计
    total_characters INTEGER DEFAULT 0,
    avg_characters INTEGER DEFAULT 0,
    avg_content_quality REAL DEFAULT 0,
    
    -- 用户交互统计
    total_likes INTEGER DEFAULT 0,
    total_dislikes INTEGER DEFAULT 0,
    total_regenerations INTEGER DEFAULT 0,
    total_adoptions INTEGER DEFAULT 0,
    total_edits INTEGER DEFAULT 0,
    
    -- 采纳率统计
    direct_adoption_rate REAL DEFAULT 0,
    edit_adoption_rate REAL DEFAULT 0,
    abandonment_rate REAL DEFAULT 0,
    
    -- 工作流统计
    workflow_completion_rate REAL DEFAULT 0,
    avg_session_duration REAL DEFAULT 0,
    common_exit_points TEXT, -- JSON格式
    
    -- 时间戳
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(stat_date, node_id)
);

-- ==============================================
-- 系统表
-- ==============================================

-- 数据库迁移记录表
CREATE TABLE IF NOT EXISTS database_migrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    migration_name TEXT NOT NULL UNIQUE,
    version TEXT NOT NULL,
    executed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    execution_time_ms INTEGER,
    status TEXT DEFAULT 'success' CHECK (status IN ('success', 'failed', 'rolled_back')),
    error_message TEXT
);

