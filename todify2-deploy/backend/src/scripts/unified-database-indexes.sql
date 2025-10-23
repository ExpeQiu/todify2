-- Todify2 统一数据库索引优化
-- 创建高性能复合索引和优化查询性能
-- 创建日期: 2024-12-19

-- ==============================================
-- 1. 聊天对话相关表索引
-- ==============================================

-- 对话会话表索引
CREATE INDEX IF NOT EXISTS idx_conversations_conversation_id ON conversations(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_app_type ON conversations(app_type);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON conversations(created_at);
-- 复合索引：用户和状态的组合查询
CREATE INDEX IF NOT EXISTS idx_conversations_user_status ON conversations(user_id, status);
-- 复合索引：应用类型和状态的组合查询
CREATE INDEX IF NOT EXISTS idx_conversations_app_status ON conversations(app_type, status);

-- 聊天消息表索引
CREATE INDEX IF NOT EXISTS idx_chat_messages_message_id ON chat_messages(message_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_id ON chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_task_id ON chat_messages(task_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_message_type ON chat_messages(message_type);
CREATE INDEX IF NOT EXISTS idx_chat_messages_app_type ON chat_messages(app_type);
CREATE INDEX IF NOT EXISTS idx_chat_messages_status ON chat_messages(status);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);
-- 复合索引：对话和消息类型的组合查询
CREATE INDEX IF NOT EXISTS idx_chat_messages_conv_type ON chat_messages(conversation_id, message_type);
-- 复合索引：对话和状态的组合查询
CREATE INDEX IF NOT EXISTS idx_chat_messages_conv_status ON chat_messages(conversation_id, status);
-- 复合索引：应用类型和时间的组合查询
CREATE INDEX IF NOT EXISTS idx_chat_messages_app_time ON chat_messages(app_type, created_at);

-- 工作流执行表索引
CREATE INDEX IF NOT EXISTS idx_workflow_executions_workflow_run_id ON workflow_executions(workflow_run_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_task_id ON workflow_executions(task_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_message_id ON workflow_executions(message_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_app_type ON workflow_executions(app_type);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_status ON workflow_executions(status);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_created_at ON workflow_executions(created_at);
-- 复合索引：应用类型和状态的组合查询
CREATE INDEX IF NOT EXISTS idx_workflow_executions_app_status ON workflow_executions(app_type, status);
-- 复合索引：消息和状态的组合查询
CREATE INDEX IF NOT EXISTS idx_workflow_executions_msg_status ON workflow_executions(message_id, status);

-- 知识使用日志表索引
CREATE INDEX IF NOT EXISTS idx_knowledge_usage_logs_message_id ON knowledge_usage_logs(message_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_usage_logs_created_at ON knowledge_usage_logs(created_at);

-- ==============================================
-- 2. 核心业务表索引
-- ==============================================

-- 品牌表索引
CREATE INDEX IF NOT EXISTS idx_brands_name ON brands(name);
CREATE INDEX IF NOT EXISTS idx_brands_status ON brands(status);
CREATE INDEX IF NOT EXISTS idx_brands_country ON brands(country);
-- 复合索引：国家和状态的组合查询
CREATE INDEX IF NOT EXISTS idx_brands_country_status ON brands(country, status);

-- 车型表索引
CREATE INDEX IF NOT EXISTS idx_car_models_brand_id ON car_models(brand_id);
CREATE INDEX IF NOT EXISTS idx_car_models_name ON car_models(name);
CREATE INDEX IF NOT EXISTS idx_car_models_category ON car_models(category);
CREATE INDEX IF NOT EXISTS idx_car_models_status ON car_models(status);
CREATE INDEX IF NOT EXISTS idx_car_models_launch_year ON car_models(launch_year);
-- 复合索引：品牌和状态的组合查询
CREATE INDEX IF NOT EXISTS idx_car_models_brand_status ON car_models(brand_id, status);
-- 复合索引：类别和状态的组合查询
CREATE INDEX IF NOT EXISTS idx_car_models_category_status ON car_models(category, status);
-- 复合索引：品牌和类别的组合查询
CREATE INDEX IF NOT EXISTS idx_car_models_brand_category ON car_models(brand_id, category);

-- 车系表索引
CREATE INDEX IF NOT EXISTS idx_car_series_model_id ON car_series(model_id);
CREATE INDEX IF NOT EXISTS idx_car_series_name ON car_series(name);
CREATE INDEX IF NOT EXISTS idx_car_series_status ON car_series(status);
CREATE INDEX IF NOT EXISTS idx_car_series_market_segment ON car_series(market_segment);
CREATE INDEX IF NOT EXISTS idx_car_series_launch_year ON car_series(launch_year);
-- 复合索引：车型和状态的组合查询
CREATE INDEX IF NOT EXISTS idx_car_series_model_status ON car_series(model_id, status);
-- 复合索引：市场细分和状态的组合查询
CREATE INDEX IF NOT EXISTS idx_car_series_segment_status ON car_series(market_segment, status);

-- 技术分类表索引
CREATE INDEX IF NOT EXISTS idx_tech_categories_parent_id ON tech_categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_tech_categories_status ON tech_categories(status);
CREATE INDEX IF NOT EXISTS idx_tech_categories_level ON tech_categories(level);
CREATE INDEX IF NOT EXISTS idx_tech_categories_sort_order ON tech_categories(sort_order);
-- 复合索引：父级和状态的组合查询
CREATE INDEX IF NOT EXISTS idx_tech_categories_parent_status ON tech_categories(parent_id, status);
-- 复合索引：级别和排序的组合查询
CREATE INDEX IF NOT EXISTS idx_tech_categories_level_sort ON tech_categories(level, sort_order);

-- 技术点表索引
CREATE INDEX IF NOT EXISTS idx_tech_points_category_id ON tech_points(category_id);
CREATE INDEX IF NOT EXISTS idx_tech_points_parent_id ON tech_points(parent_id);
CREATE INDEX IF NOT EXISTS idx_tech_points_tech_type ON tech_points(tech_type);
CREATE INDEX IF NOT EXISTS idx_tech_points_priority ON tech_points(priority);
CREATE INDEX IF NOT EXISTS idx_tech_points_status ON tech_points(status);
CREATE INDEX IF NOT EXISTS idx_tech_points_level ON tech_points(level);
CREATE INDEX IF NOT EXISTS idx_tech_points_created_at ON tech_points(created_at);
-- 复合索引：分类和状态的组合查询
CREATE INDEX IF NOT EXISTS idx_tech_points_category_status ON tech_points(category_id, status);
-- 复合索引：优先级和状态的组合查询
CREATE INDEX IF NOT EXISTS idx_tech_points_priority_status ON tech_points(priority, status);
-- 复合索引：技术类型和状态的组合查询
CREATE INDEX IF NOT EXISTS idx_tech_points_type_status ON tech_points(tech_type, status);
-- 复合索引：父级和状态的组合查询
CREATE INDEX IF NOT EXISTS idx_tech_points_parent_status ON tech_points(parent_id, status);
-- 复合索引：分类和优先级的组合查询
CREATE INDEX IF NOT EXISTS idx_tech_points_category_priority ON tech_points(category_id, priority);

-- 技术点与车型关联表索引
CREATE INDEX IF NOT EXISTS idx_tech_point_car_models_tech_point_id ON tech_point_car_models(tech_point_id);
CREATE INDEX IF NOT EXISTS idx_tech_point_car_models_car_model_id ON tech_point_car_models(car_model_id);
CREATE INDEX IF NOT EXISTS idx_tech_point_car_models_status ON tech_point_car_models(application_status);
-- 复合索引：技术点和状态的组合查询
CREATE INDEX IF NOT EXISTS idx_tech_point_car_models_tech_status ON tech_point_car_models(tech_point_id, application_status);
-- 复合索引：车型和状态的组合查询
CREATE INDEX IF NOT EXISTS idx_tech_point_car_models_car_status ON tech_point_car_models(car_model_id, application_status);

-- ==============================================
-- 3. AI生成内容表索引
-- ==============================================

-- 技术包装材料表索引
CREATE INDEX IF NOT EXISTS idx_tech_packaging_materials_tech_point_id ON tech_packaging_materials(tech_point_id);
CREATE INDEX IF NOT EXISTS idx_tech_packaging_materials_status ON tech_packaging_materials(status);
CREATE INDEX IF NOT EXISTS idx_tech_packaging_materials_type ON tech_packaging_materials(material_type);
CREATE INDEX IF NOT EXISTS idx_tech_packaging_materials_audience ON tech_packaging_materials(target_audience);
CREATE INDEX IF NOT EXISTS idx_tech_packaging_materials_dify_task ON tech_packaging_materials(dify_task_id);
-- 复合索引：技术点和状态的组合查询
CREATE INDEX IF NOT EXISTS idx_tech_packaging_materials_tech_status ON tech_packaging_materials(tech_point_id, status);
-- 复合索引：类型和受众的组合查询
CREATE INDEX IF NOT EXISTS idx_tech_packaging_materials_type_audience ON tech_packaging_materials(material_type, target_audience);

-- 技术推广策略表索引
CREATE INDEX IF NOT EXISTS idx_tech_promotion_strategies_status ON tech_promotion_strategies(status);
CREATE INDEX IF NOT EXISTS idx_tech_promotion_strategies_type ON tech_promotion_strategies(strategy_type);
CREATE INDEX IF NOT EXISTS idx_tech_promotion_strategies_dify_task ON tech_promotion_strategies(dify_task_id);
-- 复合索引：类型和状态的组合查询
CREATE INDEX IF NOT EXISTS idx_tech_promotion_strategies_type_status ON tech_promotion_strategies(strategy_type, status);

-- 技术通稿表索引
CREATE INDEX IF NOT EXISTS idx_tech_press_releases_status ON tech_press_releases(status);
CREATE INDEX IF NOT EXISTS idx_tech_press_releases_type ON tech_press_releases(release_type);
CREATE INDEX IF NOT EXISTS idx_tech_press_releases_publication_date ON tech_press_releases(publication_date);
CREATE INDEX IF NOT EXISTS idx_tech_press_releases_dify_task ON tech_press_releases(dify_task_id);
-- 复合索引：类型和状态的组合查询
CREATE INDEX IF NOT EXISTS idx_tech_press_releases_type_status ON tech_press_releases(release_type, status);
-- 复合索引：发布日期和状态的组合查询
CREATE INDEX IF NOT EXISTS idx_tech_press_releases_date_status ON tech_press_releases(publication_date, status);

-- 技术演讲稿表索引
CREATE INDEX IF NOT EXISTS idx_tech_speeches_status ON tech_speeches(status);
CREATE INDEX IF NOT EXISTS idx_tech_speeches_type ON tech_speeches(speech_type);
CREATE INDEX IF NOT EXISTS idx_tech_speeches_event_date ON tech_speeches(event_date);
CREATE INDEX IF NOT EXISTS idx_tech_speeches_dify_task ON tech_speeches(dify_task_id);
-- 复合索引：类型和状态的组合查询
CREATE INDEX IF NOT EXISTS idx_tech_speeches_type_status ON tech_speeches(speech_type, status);
-- 复合索引：事件日期和状态的组合查询
CREATE INDEX IF NOT EXISTS idx_tech_speeches_date_status ON tech_speeches(event_date, status);

-- ==============================================
-- 4. 关联关系表索引
-- ==============================================

-- 推广策略与技术点关联表索引
CREATE INDEX IF NOT EXISTS idx_promotion_tech_points_promotion_id ON promotion_tech_points(promotion_id);
CREATE INDEX IF NOT EXISTS idx_promotion_tech_points_tech_point_id ON promotion_tech_points(tech_point_id);
-- 复合索引：推广策略和权重的组合查询
CREATE INDEX IF NOT EXISTS idx_promotion_tech_points_promotion_weight ON promotion_tech_points(promotion_id, weight);

-- 通稿与技术点关联表索引
CREATE INDEX IF NOT EXISTS idx_press_tech_points_press_release_id ON press_tech_points(press_release_id);
CREATE INDEX IF NOT EXISTS idx_press_tech_points_tech_point_id ON press_tech_points(tech_point_id);
-- 复合索引：通稿和权重的组合查询
CREATE INDEX IF NOT EXISTS idx_press_tech_points_press_weight ON press_tech_points(press_release_id, weight);

-- 演讲稿与技术点关联表索引
CREATE INDEX IF NOT EXISTS idx_speech_tech_points_speech_id ON speech_tech_points(speech_id);
CREATE INDEX IF NOT EXISTS idx_speech_tech_points_tech_point_id ON speech_tech_points(tech_point_id);
-- 复合索引：演讲稿和权重的组合查询
CREATE INDEX IF NOT EXISTS idx_speech_tech_points_speech_weight ON speech_tech_points(speech_id, weight);

-- ==============================================
-- 5. 知识点相关表索引
-- ==============================================

-- 知识点表索引
CREATE INDEX IF NOT EXISTS idx_knowledge_points_title ON knowledge_points(title);
CREATE INDEX IF NOT EXISTS idx_knowledge_points_source_type ON knowledge_points(source_type);
CREATE INDEX IF NOT EXISTS idx_knowledge_points_status ON knowledge_points(status);
CREATE INDEX IF NOT EXISTS idx_knowledge_points_dify_task ON knowledge_points(dify_task_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_points_ai_session ON knowledge_points(ai_search_session_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_points_created_at ON knowledge_points(created_at);
CREATE INDEX IF NOT EXISTS idx_knowledge_points_relevance_score ON knowledge_points(relevance_score);
-- 复合索引：来源类型和状态的组合查询
CREATE INDEX IF NOT EXISTS idx_knowledge_points_source_status ON knowledge_points(source_type, status);
-- 复合索引：相关度分数和状态的组合查询
CREATE INDEX IF NOT EXISTS idx_knowledge_points_score_status ON knowledge_points(relevance_score, status);

-- 技术点与知识点关联表索引
CREATE INDEX IF NOT EXISTS idx_tech_point_knowledge_tech_point ON tech_point_knowledge_points(tech_point_id);
CREATE INDEX IF NOT EXISTS idx_tech_point_knowledge_knowledge_point ON tech_point_knowledge_points(knowledge_point_id);
CREATE INDEX IF NOT EXISTS idx_tech_point_knowledge_relation_type ON tech_point_knowledge_points(relation_type);
CREATE INDEX IF NOT EXISTS idx_tech_point_knowledge_relevance_score ON tech_point_knowledge_points(relevance_score);
-- 复合索引：技术点和关系类型的组合查询
CREATE INDEX IF NOT EXISTS idx_tech_point_knowledge_tech_relation ON tech_point_knowledge_points(tech_point_id, relation_type);
-- 复合索引：知识点和关系类型的组合查询
CREATE INDEX IF NOT EXISTS idx_tech_point_knowledge_knowledge_relation ON tech_point_knowledge_points(knowledge_point_id, relation_type);

-- 知识点收藏表索引
CREATE INDEX IF NOT EXISTS idx_knowledge_favorites_knowledge_point ON knowledge_point_favorites(knowledge_point_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_favorites_user ON knowledge_point_favorites(user_id);
-- 复合索引：用户和知识点的组合查询
CREATE INDEX IF NOT EXISTS idx_knowledge_favorites_user_knowledge ON knowledge_point_favorites(user_id, knowledge_point_id);

-- ==============================================
-- 6. 全文搜索索引（如果支持）
-- ==============================================

-- 注意：SQLite 的全文搜索需要使用 FTS5 扩展
-- 以下索引需要在支持 FTS5 的环境中创建

-- 技术点全文搜索索引
-- CREATE VIRTUAL TABLE IF NOT EXISTS tech_points_fts USING fts5(
--     name, description, keywords, 
--     content='tech_points', content_rowid='id'
-- );

-- 知识点全文搜索索引
-- CREATE VIRTUAL TABLE IF NOT EXISTS knowledge_points_fts USING fts5(
--     title, content, tags,
--     content='knowledge_points', content_rowid='id'
-- );

-- 聊天消息全文搜索索引
-- CREATE VIRTUAL TABLE IF NOT EXISTS chat_messages_fts USING fts5(
--     content, query,
--     content='chat_messages', content_rowid='id'
-- );
