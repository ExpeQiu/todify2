-- 智能工作流功能使用数据统计表结构
-- 创建日期: 2024-12-19

-- ==============================================
-- 1. 工作流节点使用统计表
-- ==============================================

-- 工作流节点使用记录表
CREATE TABLE IF NOT EXISTS workflow_node_usage (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    node_id TEXT NOT NULL, -- 节点ID (ai_qa, tech_package, etc.)
    node_name TEXT NOT NULL, -- 节点名称
    node_type TEXT NOT NULL, -- 节点类型 (ai_qa, tech_package, promotion_strategy, core_draft, speech)
    session_id TEXT NOT NULL, -- 会话ID
    user_id TEXT, -- 用户ID
    
    -- 使用统计
    usage_count INTEGER DEFAULT 1, -- 使用次数
    total_time_spent REAL DEFAULT 0, -- 总耗时（秒）
    avg_response_time REAL DEFAULT 0, -- 平均响应时间（秒）
    success_count INTEGER DEFAULT 0, -- 成功次数
    failure_count INTEGER DEFAULT 0, -- 失败次数
    
    -- 内容统计
    total_characters INTEGER DEFAULT 0, -- 总字符数
    avg_characters INTEGER DEFAULT 0, -- 平均字符数
    content_quality_score REAL DEFAULT 0, -- 内容质量评分
    
    -- 用户交互统计
    likes_count INTEGER DEFAULT 0, -- 点赞次数
    dislikes_count INTEGER DEFAULT 0, -- 点踩次数
    regenerations_count INTEGER DEFAULT 0, -- 重新生成次数
    adoptions_count INTEGER DEFAULT 0, -- 采纳次数（直接使用）
    edits_count INTEGER DEFAULT 0, -- 编辑次数（需要修改后使用）
    
    -- 工作流上下文
    is_workflow_mode BOOLEAN DEFAULT FALSE, -- 是否在工作流模式中使用
    is_standalone_mode BOOLEAN DEFAULT FALSE, -- 是否在独立模式中使用
    previous_node_id TEXT, -- 前置节点ID
    next_node_id TEXT, -- 后续节点ID
    
    -- 时间戳
    first_used_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- 首次使用时间
    last_used_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- 最后使用时间
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================
-- 2. AI问答评价统计表
-- ==============================================

-- AI问答评价记录表
CREATE TABLE IF NOT EXISTS ai_qa_feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    message_id TEXT NOT NULL, -- 关联的消息ID
    node_id TEXT NOT NULL, -- 节点ID
    session_id TEXT NOT NULL, -- 会话ID
    user_id TEXT, -- 用户ID
    
    -- 评价类型
    feedback_type TEXT NOT NULL CHECK (feedback_type IN ('like', 'dislike', 'adopt', 'regenerate', 'edit')),
    feedback_value INTEGER DEFAULT 0, -- 评价分值 (1-5)
    feedback_comment TEXT, -- 评价备注
    
    -- 内容分析
    response_time REAL, -- 响应时间（秒）
    content_length INTEGER, -- 内容长度
    content_quality_score REAL, -- 内容质量评分
    
    -- 上下文信息
    query_text TEXT, -- 用户查询文本
    response_text TEXT, -- AI响应文本
    context_data TEXT, -- 上下文数据（JSON格式）
    
    -- 时间戳
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================
-- 3. 工作流完整性和跳出点统计表
-- ==============================================

-- 工作流会话统计表
CREATE TABLE IF NOT EXISTS workflow_session_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT UNIQUE NOT NULL, -- 会话ID
    user_id TEXT, -- 用户ID
    
    -- 会话基本信息
    session_start_time DATETIME DEFAULT CURRENT_TIMESTAMP, -- 会话开始时间
    session_end_time DATETIME, -- 会话结束时间
    session_duration REAL DEFAULT 0, -- 会话持续时间（秒）
    
    -- 工作流完整性统计
    total_nodes_visited INTEGER DEFAULT 0, -- 访问的节点总数
    completed_nodes INTEGER DEFAULT 0, -- 完成的节点数
    skipped_nodes INTEGER DEFAULT 0, -- 跳过的节点数
    
    -- 节点访问记录（JSON格式存储访问顺序和状态）
    node_visit_sequence TEXT, -- 节点访问序列
    node_completion_status TEXT, -- 节点完成状态
    
    -- 跳出点分析
    exit_node_id TEXT, -- 退出节点ID
    exit_reason TEXT, -- 退出原因 (user_abandon, error, completion, etc.)
    exit_time DATETIME, -- 退出时间
    
    -- 工作流路径分析
    workflow_path TEXT, -- 工作流路径（JSON格式）
    path_efficiency_score REAL DEFAULT 0, -- 路径效率评分
    
    -- 用户满意度
    overall_satisfaction_score REAL, -- 整体满意度评分
    user_feedback TEXT, -- 用户反馈
    
    -- 时间戳
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================
-- 4. 节点内容采纳和编辑统计表
-- ==============================================

-- 节点内容处理统计表
CREATE TABLE IF NOT EXISTS node_content_processing (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    node_id TEXT NOT NULL, -- 节点ID
    session_id TEXT NOT NULL, -- 会话ID
    message_id TEXT, -- 消息ID
    
    -- 内容处理类型
    processing_type TEXT NOT NULL CHECK (processing_type IN ('direct_adopt', 'edit_adopt', 'regenerate', 'abandon')),
    processing_time REAL, -- 处理时间（秒）
    
    -- 内容分析
    original_content_length INTEGER, -- 原始内容长度
    final_content_length INTEGER, -- 最终内容长度
    edit_ratio REAL DEFAULT 0, -- 编辑比例 (0-1)
    
    -- 编辑详情
    edit_count INTEGER DEFAULT 0, -- 编辑次数
    edit_types TEXT, -- 编辑类型（JSON格式）
    edit_duration REAL DEFAULT 0, -- 编辑耗时
    
    -- 用户行为
    user_satisfaction_score REAL, -- 用户满意度评分
    user_behavior_data TEXT, -- 用户行为数据（JSON格式）
    
    -- 时间戳
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================
-- 5. 实时统计汇总表
-- ==============================================

-- 实时统计汇总表
CREATE TABLE IF NOT EXISTS workflow_stats_summary (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    stat_date DATE NOT NULL, -- 统计日期
    node_id TEXT NOT NULL, -- 节点ID
    
    -- 使用统计
    total_usage_count INTEGER DEFAULT 0, -- 总使用次数
    unique_users INTEGER DEFAULT 0, -- 独立用户数
    avg_response_time REAL DEFAULT 0, -- 平均响应时间
    success_rate REAL DEFAULT 0, -- 成功率
    
    -- 内容统计
    total_characters INTEGER DEFAULT 0, -- 总字符数
    avg_characters INTEGER DEFAULT 0, -- 平均字符数
    avg_content_quality REAL DEFAULT 0, -- 平均内容质量
    
    -- 用户交互统计
    total_likes INTEGER DEFAULT 0, -- 总点赞数
    total_dislikes INTEGER DEFAULT 0, -- 总点踩数
    total_regenerations INTEGER DEFAULT 0, -- 总重新生成数
    total_adoptions INTEGER DEFAULT 0, -- 总采纳数
    total_edits INTEGER DEFAULT 0, -- 总编辑数
    
    -- 采纳率统计
    direct_adoption_rate REAL DEFAULT 0, -- 直接采纳率
    edit_adoption_rate REAL DEFAULT 0, -- 编辑后采纳率
    abandonment_rate REAL DEFAULT 0, -- 放弃率
    
    -- 工作流统计
    workflow_completion_rate REAL DEFAULT 0, -- 工作流完成率
    avg_session_duration REAL DEFAULT 0, -- 平均会话时长
    common_exit_points TEXT, -- 常见退出点（JSON格式）
    
    -- 时间戳
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(stat_date, node_id)
);

-- ==============================================
-- 6. 创建索引以提高查询性能
-- ==============================================

-- 工作流节点使用统计索引
CREATE INDEX IF NOT EXISTS idx_workflow_node_usage_node_id ON workflow_node_usage(node_id);
CREATE INDEX IF NOT EXISTS idx_workflow_node_usage_session_id ON workflow_node_usage(session_id);
CREATE INDEX IF NOT EXISTS idx_workflow_node_usage_user_id ON workflow_node_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_workflow_node_usage_node_type ON workflow_node_usage(node_type);
CREATE INDEX IF NOT EXISTS idx_workflow_node_usage_created_at ON workflow_node_usage(created_at);
CREATE INDEX IF NOT EXISTS idx_workflow_node_usage_is_workflow_mode ON workflow_node_usage(is_workflow_mode);

-- AI问答评价统计索引
CREATE INDEX IF NOT EXISTS idx_ai_qa_feedback_message_id ON ai_qa_feedback(message_id);
CREATE INDEX IF NOT EXISTS idx_ai_qa_feedback_node_id ON ai_qa_feedback(node_id);
CREATE INDEX IF NOT EXISTS idx_ai_qa_feedback_session_id ON ai_qa_feedback(session_id);
CREATE INDEX IF NOT EXISTS idx_ai_qa_feedback_feedback_type ON ai_qa_feedback(feedback_type);
CREATE INDEX IF NOT EXISTS idx_ai_qa_feedback_created_at ON ai_qa_feedback(created_at);

-- 工作流会话统计索引
CREATE INDEX IF NOT EXISTS idx_workflow_session_stats_session_id ON workflow_session_stats(session_id);
CREATE INDEX IF NOT EXISTS idx_workflow_session_stats_user_id ON workflow_session_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_workflow_session_stats_session_start_time ON workflow_session_stats(session_start_time);
CREATE INDEX IF NOT EXISTS idx_workflow_session_stats_exit_node_id ON workflow_session_stats(exit_node_id);

-- 节点内容处理统计索引
CREATE INDEX IF NOT EXISTS idx_node_content_processing_node_id ON node_content_processing(node_id);
CREATE INDEX IF NOT EXISTS idx_node_content_processing_session_id ON node_content_processing(session_id);
CREATE INDEX IF NOT EXISTS idx_node_content_processing_processing_type ON node_content_processing(processing_type);
CREATE INDEX IF NOT EXISTS idx_node_content_processing_created_at ON node_content_processing(created_at);

-- 实时统计汇总索引
CREATE INDEX IF NOT EXISTS idx_workflow_stats_summary_stat_date ON workflow_stats_summary(stat_date);
CREATE INDEX IF NOT EXISTS idx_workflow_stats_summary_node_id ON workflow_stats_summary(node_id);
CREATE INDEX IF NOT EXISTS idx_workflow_stats_summary_stat_date_node ON workflow_stats_summary(stat_date, node_id);

-- ==============================================
-- 7. 创建触发器自动更新统计汇总
-- ==============================================

-- 工作流节点使用统计触发器
CREATE TRIGGER IF NOT EXISTS update_workflow_stats_on_node_usage
AFTER INSERT ON workflow_node_usage
BEGIN
    INSERT OR REPLACE INTO workflow_stats_summary (
        stat_date, node_id, total_usage_count, unique_users, avg_response_time,
        total_characters, avg_characters, total_likes, total_dislikes,
        total_regenerations, total_adoptions, total_edits, updated_at
    )
    SELECT 
        DATE(NEW.created_at),
        NEW.node_id,
        COALESCE(SUM(usage_count), 0),
        COUNT(DISTINCT user_id),
        AVG(avg_response_time),
        COALESCE(SUM(total_characters), 0),
        AVG(avg_characters),
        COALESCE(SUM(likes_count), 0),
        COALESCE(SUM(dislikes_count), 0),
        COALESCE(SUM(regenerations_count), 0),
        COALESCE(SUM(adoptions_count), 0),
        COALESCE(SUM(edits_count), 0),
        CURRENT_TIMESTAMP
    FROM workflow_node_usage 
    WHERE DATE(created_at) = DATE(NEW.created_at) AND node_id = NEW.node_id;
END;

-- AI问答评价统计触发器
CREATE TRIGGER IF NOT EXISTS update_workflow_stats_on_feedback
AFTER INSERT ON ai_qa_feedback
BEGIN
    INSERT OR REPLACE INTO workflow_stats_summary (
        stat_date, node_id, total_likes, total_dislikes, total_regenerations,
        total_adoptions, updated_at
    )
    SELECT 
        DATE(NEW.created_at),
        NEW.node_id,
        SUM(CASE WHEN feedback_type = 'like' THEN 1 ELSE 0 END),
        SUM(CASE WHEN feedback_type = 'dislike' THEN 1 ELSE 0 END),
        SUM(CASE WHEN feedback_type = 'regenerate' THEN 1 ELSE 0 END),
        SUM(CASE WHEN feedback_type = 'adopt' THEN 1 ELSE 0 END),
        CURRENT_TIMESTAMP
    FROM ai_qa_feedback 
    WHERE DATE(created_at) = DATE(NEW.created_at) AND node_id = NEW.node_id;
END;

-- ==============================================
-- 8. 插入示例数据（用于测试）
-- ==============================================

-- 插入示例工作流节点使用数据
INSERT OR IGNORE INTO workflow_node_usage (
    node_id, node_name, node_type, session_id, user_id,
    usage_count, avg_response_time, success_count, total_characters,
    likes_count, adoptions_count, is_workflow_mode
) VALUES 
('ai_qa', 'AI问答', 'ai_qa', 'session_001', 'user_001', 1, 3.2, 1, 150, 1, 1, TRUE),
('tech_package', '技术包装', 'tech_package', 'session_001', 'user_001', 1, 2.8, 1, 800, 1, 1, TRUE),
('promotion_strategy', '推广策略', 'promotion_strategy', 'session_001', 'user_001', 1, 28.5, 1, 1200, 1, 1, TRUE),
('core_draft', '核心稿件', 'core_draft', 'session_001', 'user_001', 1, 18.2, 1, 1500, 1, 1, TRUE),
('speech', '演讲稿', 'speech', 'session_001', 'user_001', 1, 26.1, 1, 2000, 1, 1, TRUE);

-- 插入示例AI问答评价数据
INSERT OR IGNORE INTO ai_qa_feedback (
    message_id, node_id, session_id, user_id, feedback_type,
    response_time, content_length, feedback_value
) VALUES 
('msg_001', 'ai_qa', 'session_001', 'user_001', 'like', 3.2, 150, 5),
('msg_002', 'tech_package', 'session_001', 'user_001', 'adopt', 2.8, 800, 4),
('msg_003', 'promotion_strategy', 'session_001', 'user_001', 'edit', 28.5, 1200, 3),
('msg_004', 'core_draft', 'session_001', 'user_001', 'adopt', 18.2, 1500, 5),
('msg_005', 'speech', 'session_001', 'user_001', 'like', 26.1, 2000, 4);

-- 插入示例工作流会话统计数据
INSERT OR IGNORE INTO workflow_session_stats (
    session_id, user_id, session_duration, total_nodes_visited,
    completed_nodes, exit_node_id, exit_reason, overall_satisfaction_score
) VALUES 
('session_001', 'user_001', 180.5, 5, 5, 'speech', 'completion', 4.2),
('session_002', 'user_002', 95.3, 3, 2, 'promotion_strategy', 'user_abandon', 2.8),
('session_003', 'user_003', 245.7, 5, 4, 'speech', 'completion', 4.5);

-- 插入示例节点内容处理数据
INSERT OR IGNORE INTO node_content_processing (
    node_id, session_id, message_id, processing_type,
    original_content_length, final_content_length, edit_ratio,
    edit_count, user_satisfaction_score
) VALUES 
('ai_qa', 'session_001', 'msg_001', 'direct_adopt', 150, 150, 0.0, 0, 5.0),
('tech_package', 'session_001', 'msg_002', 'direct_adopt', 800, 800, 0.0, 0, 4.0),
('promotion_strategy', 'session_001', 'msg_003', 'edit_adopt', 1200, 1350, 0.125, 2, 3.0),
('core_draft', 'session_001', 'msg_004', 'direct_adopt', 1500, 1500, 0.0, 0, 5.0),
('speech', 'session_001', 'msg_005', 'direct_adopt', 2000, 2000, 0.0, 0, 4.0);
