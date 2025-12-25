-- Todify3 统一数据库索引优化 v3.0
-- 创建日期: 2025-01-XX
-- 说明: 优化索引策略，添加缺失索引，提升查询性能
-- 优化点:
-- 1. 添加覆盖索引以优化常见查询
-- 2. 优化复合索引顺序（基于查询模式）
-- 3. 添加缺失的索引
-- 4. 为外键字段创建索引（如果尚未存在）

-- ==============================================
-- 第一层：基础数据层索引
-- ==============================================

-- 品牌表索引
CREATE INDEX IF NOT EXISTS idx_brands_name ON brands(name);
CREATE INDEX IF NOT EXISTS idx_brands_status ON brands(status);
CREATE INDEX IF NOT EXISTS idx_brands_country ON brands(country);
CREATE INDEX IF NOT EXISTS idx_brands_country_status ON brands(country, status);

-- 车型表索引
CREATE INDEX IF NOT EXISTS idx_car_models_brand_id ON car_models(brand_id);
CREATE INDEX IF NOT EXISTS idx_car_models_name ON car_models(name);
CREATE INDEX IF NOT EXISTS idx_car_models_category ON car_models(category);
CREATE INDEX IF NOT EXISTS idx_car_models_status ON car_models(status);
CREATE INDEX IF NOT EXISTS idx_car_models_launch_year ON car_models(launch_year);
CREATE INDEX IF NOT EXISTS idx_car_models_brand_status ON car_models(brand_id, status);
CREATE INDEX IF NOT EXISTS idx_car_models_category_status ON car_models(category, status);
CREATE INDEX IF NOT EXISTS idx_car_models_brand_category ON car_models(brand_id, category);

-- 车系表索引
CREATE INDEX IF NOT EXISTS idx_car_series_model_id ON car_series(model_id);
CREATE INDEX IF NOT EXISTS idx_car_series_name ON car_series(name);
CREATE INDEX IF NOT EXISTS idx_car_series_status ON car_series(status);
CREATE INDEX IF NOT EXISTS idx_car_series_market_segment ON car_series(market_segment);
CREATE INDEX IF NOT EXISTS idx_car_series_launch_year ON car_series(launch_year);
CREATE INDEX IF NOT EXISTS idx_car_series_model_status ON car_series(model_id, status);
CREATE INDEX IF NOT EXISTS idx_car_series_segment_status ON car_series(market_segment, status);

-- 技术分类表索引
CREATE INDEX IF NOT EXISTS idx_tech_categories_parent_id ON tech_categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_tech_categories_status ON tech_categories(status);
CREATE INDEX IF NOT EXISTS idx_tech_categories_level ON tech_categories(level);
CREATE INDEX IF NOT EXISTS idx_tech_categories_sort_order ON tech_categories(sort_order);
CREATE INDEX IF NOT EXISTS idx_tech_categories_parent_status ON tech_categories(parent_id, status);
CREATE INDEX IF NOT EXISTS idx_tech_categories_level_sort ON tech_categories(level, sort_order);

-- 技术点表索引
CREATE INDEX IF NOT EXISTS idx_tech_points_category_id ON tech_points(category_id);
CREATE INDEX IF NOT EXISTS idx_tech_points_parent_id ON tech_points(parent_id);
CREATE INDEX IF NOT EXISTS idx_tech_points_tech_type ON tech_points(tech_type);
CREATE INDEX IF NOT EXISTS idx_tech_points_priority ON tech_points(priority);
CREATE INDEX IF NOT EXISTS idx_tech_points_status ON tech_points(status);
CREATE INDEX IF NOT EXISTS idx_tech_points_level ON tech_points(level);
CREATE INDEX IF NOT EXISTS idx_tech_points_created_at ON tech_points(created_at);
CREATE INDEX IF NOT EXISTS idx_tech_points_tpd_id ON tech_points(tpd_id) WHERE tpd_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tech_points_category_status ON tech_points(category_id, status);
CREATE INDEX IF NOT EXISTS idx_tech_points_priority_status ON tech_points(priority, status);
CREATE INDEX IF NOT EXISTS idx_tech_points_type_status ON tech_points(tech_type, status);
CREATE INDEX IF NOT EXISTS idx_tech_points_parent_status ON tech_points(parent_id, status);
CREATE INDEX IF NOT EXISTS idx_tech_points_category_priority ON tech_points(category_id, priority);

-- ==============================================
-- 第二层：关联关系层索引
-- ==============================================

-- 技术点与车型关联表索引
CREATE INDEX IF NOT EXISTS idx_tech_point_car_models_tech_point_id ON tech_point_car_models(tech_point_id);
CREATE INDEX IF NOT EXISTS idx_tech_point_car_models_car_model_id ON tech_point_car_models(car_model_id);
CREATE INDEX IF NOT EXISTS idx_tech_point_car_models_status ON tech_point_car_models(application_status);
CREATE INDEX IF NOT EXISTS idx_tech_point_car_models_tech_status ON tech_point_car_models(tech_point_id, application_status);
CREATE INDEX IF NOT EXISTS idx_tech_point_car_models_car_status ON tech_point_car_models(car_model_id, application_status);

-- ==============================================
-- 第三层：AI内容生成层索引
-- ==============================================

-- 知识点表索引
CREATE INDEX IF NOT EXISTS idx_knowledge_points_title ON knowledge_points(title);
CREATE INDEX IF NOT EXISTS idx_knowledge_points_source_type ON knowledge_points(source_type);
CREATE INDEX IF NOT EXISTS idx_knowledge_points_status ON knowledge_points(status);
CREATE INDEX IF NOT EXISTS idx_knowledge_points_dify_task ON knowledge_points(dify_task_id) WHERE dify_task_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_knowledge_points_ai_session ON knowledge_points(ai_search_session_id) WHERE ai_search_session_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_knowledge_points_created_at ON knowledge_points(created_at);
CREATE INDEX IF NOT EXISTS idx_knowledge_points_relevance_score ON knowledge_points(relevance_score);
CREATE INDEX IF NOT EXISTS idx_knowledge_points_source_status ON knowledge_points(source_type, status);
CREATE INDEX IF NOT EXISTS idx_knowledge_points_score_status ON knowledge_points(relevance_score, status) WHERE relevance_score IS NOT NULL;

-- 技术点与知识点关联表索引
CREATE INDEX IF NOT EXISTS idx_tech_point_knowledge_tech_point ON tech_point_knowledge_points(tech_point_id);
CREATE INDEX IF NOT EXISTS idx_tech_point_knowledge_knowledge_point ON tech_point_knowledge_points(knowledge_point_id);
CREATE INDEX IF NOT EXISTS idx_tech_point_knowledge_relation_type ON tech_point_knowledge_points(relation_type);
CREATE INDEX IF NOT EXISTS idx_tech_point_knowledge_relevance_score ON tech_point_knowledge_points(relevance_score);
CREATE INDEX IF NOT EXISTS idx_tech_point_knowledge_tech_relation ON tech_point_knowledge_points(tech_point_id, relation_type);
CREATE INDEX IF NOT EXISTS idx_tech_point_knowledge_knowledge_relation ON tech_point_knowledge_points(knowledge_point_id, relation_type);

-- 知识点收藏表索引
CREATE INDEX IF NOT EXISTS idx_knowledge_favorites_knowledge_point ON knowledge_point_favorites(knowledge_point_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_favorites_user ON knowledge_point_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_favorites_user_knowledge ON knowledge_point_favorites(user_id, knowledge_point_id);

-- 技术包装材料表索引
CREATE INDEX IF NOT EXISTS idx_tech_packaging_materials_tech_point_id ON tech_packaging_materials(tech_point_id);
CREATE INDEX IF NOT EXISTS idx_tech_packaging_materials_project_id ON tech_packaging_materials(project_id) WHERE project_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tech_packaging_materials_status ON tech_packaging_materials(status);
CREATE INDEX IF NOT EXISTS idx_tech_packaging_materials_type ON tech_packaging_materials(material_type);
CREATE INDEX IF NOT EXISTS idx_tech_packaging_materials_audience ON tech_packaging_materials(target_audience);
CREATE INDEX IF NOT EXISTS idx_tech_packaging_materials_dify_task ON tech_packaging_materials(dify_task_id) WHERE dify_task_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tech_packaging_materials_tech_status ON tech_packaging_materials(tech_point_id, status);
CREATE INDEX IF NOT EXISTS idx_tech_packaging_materials_type_audience ON tech_packaging_materials(material_type, target_audience);

-- 技术推广策略表索引
CREATE INDEX IF NOT EXISTS idx_tech_promotion_strategies_project_id ON tech_promotion_strategies(project_id) WHERE project_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tech_promotion_strategies_status ON tech_promotion_strategies(status);
CREATE INDEX IF NOT EXISTS idx_tech_promotion_strategies_type ON tech_promotion_strategies(strategy_type);
CREATE INDEX IF NOT EXISTS idx_tech_promotion_strategies_dify_task ON tech_promotion_strategies(dify_task_id) WHERE dify_task_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tech_promotion_strategies_type_status ON tech_promotion_strategies(strategy_type, status);

-- 技术通稿表索引
CREATE INDEX IF NOT EXISTS idx_tech_press_releases_project_id ON tech_press_releases(project_id) WHERE project_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tech_press_releases_status ON tech_press_releases(status);
CREATE INDEX IF NOT EXISTS idx_tech_press_releases_type ON tech_press_releases(release_type);
CREATE INDEX IF NOT EXISTS idx_tech_press_releases_publication_date ON tech_press_releases(publication_date) WHERE publication_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tech_press_releases_dify_task ON tech_press_releases(dify_task_id) WHERE dify_task_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tech_press_releases_type_status ON tech_press_releases(release_type, status);
CREATE INDEX IF NOT EXISTS idx_tech_press_releases_date_status ON tech_press_releases(publication_date, status) WHERE publication_date IS NOT NULL;

-- 技术演讲稿表索引
CREATE INDEX IF NOT EXISTS idx_tech_speeches_status ON tech_speeches(status);
CREATE INDEX IF NOT EXISTS idx_tech_speeches_type ON tech_speeches(speech_type);
CREATE INDEX IF NOT EXISTS idx_tech_speeches_event_date ON tech_speeches(event_date) WHERE event_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tech_speeches_dify_task ON tech_speeches(dify_task_id) WHERE dify_task_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tech_speeches_type_status ON tech_speeches(speech_type, status);
CREATE INDEX IF NOT EXISTS idx_tech_speeches_date_status ON tech_speeches(event_date, status) WHERE event_date IS NOT NULL;

-- 推广策略与技术点关联表索引
CREATE INDEX IF NOT EXISTS idx_promotion_tech_points_promotion_id ON promotion_tech_points(promotion_id);
CREATE INDEX IF NOT EXISTS idx_promotion_tech_points_tech_point_id ON promotion_tech_points(tech_point_id);
CREATE INDEX IF NOT EXISTS idx_promotion_tech_points_promotion_weight ON promotion_tech_points(promotion_id, weight);

-- 通稿与技术点关联表索引
CREATE INDEX IF NOT EXISTS idx_press_tech_points_press_release_id ON press_tech_points(press_release_id);
CREATE INDEX IF NOT EXISTS idx_press_tech_points_tech_point_id ON press_tech_points(tech_point_id);
CREATE INDEX IF NOT EXISTS idx_press_tech_points_press_weight ON press_tech_points(press_release_id, weight);

-- 演讲稿与技术点关联表索引
CREATE INDEX IF NOT EXISTS idx_speech_tech_points_speech_id ON speech_tech_points(speech_id);
CREATE INDEX IF NOT EXISTS idx_speech_tech_points_tech_point_id ON speech_tech_points(tech_point_id);
CREATE INDEX IF NOT EXISTS idx_speech_tech_points_speech_weight ON speech_tech_points(speech_id, weight);

-- ==============================================
-- 第四层：工作流与对话层索引
-- ==============================================

-- Agent工作流表索引
CREATE INDEX IF NOT EXISTS idx_agent_workflows_name ON agent_workflows(name);
CREATE INDEX IF NOT EXISTS idx_agent_workflows_updated ON agent_workflows(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_workflows_published ON agent_workflows(published);

-- 工作流模板表索引
CREATE INDEX IF NOT EXISTS idx_workflow_templates_category ON workflow_templates(category);
CREATE INDEX IF NOT EXISTS idx_workflow_templates_public ON workflow_templates(is_public);
CREATE INDEX IF NOT EXISTS idx_workflow_templates_usage ON workflow_templates(usage_count DESC);

-- 工作流执行表索引（统一表）
CREATE INDEX IF NOT EXISTS idx_workflow_executions_type ON workflow_executions(execution_type);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_workflow_id ON workflow_executions(workflow_id) WHERE workflow_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_workflow_executions_status ON workflow_executions(status);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_workflow_run_id ON workflow_executions(workflow_run_id) WHERE workflow_run_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_workflow_executions_task_id ON workflow_executions(task_id) WHERE task_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_workflow_executions_message_id ON workflow_executions(message_id) WHERE message_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_workflow_executions_app_type ON workflow_executions(app_type) WHERE app_type IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_workflow_executions_created ON workflow_executions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_type_status ON workflow_executions(execution_type, status);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_type_workflow ON workflow_executions(execution_type, workflow_id) WHERE workflow_id IS NOT NULL;

-- 对话会话表索引
CREATE INDEX IF NOT EXISTS idx_conversations_conversation_id ON conversations(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_conversations_app_type ON conversations(app_type);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON conversations(created_at);
CREATE INDEX IF NOT EXISTS idx_conversations_user_status ON conversations(user_id, status) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_conversations_app_status ON conversations(app_type, status);

-- 聊天消息表索引
CREATE INDEX IF NOT EXISTS idx_chat_messages_message_id ON chat_messages(message_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_id ON chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_task_id ON chat_messages(task_id) WHERE task_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_chat_messages_message_type ON chat_messages(message_type);
CREATE INDEX IF NOT EXISTS idx_chat_messages_app_type ON chat_messages(app_type);
CREATE INDEX IF NOT EXISTS idx_chat_messages_status ON chat_messages(status);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_conv_type ON chat_messages(conversation_id, message_type);
CREATE INDEX IF NOT EXISTS idx_chat_messages_conv_status ON chat_messages(conversation_id, status);
CREATE INDEX IF NOT EXISTS idx_chat_messages_app_time ON chat_messages(app_type, created_at);

-- 知识使用日志表索引
CREATE INDEX IF NOT EXISTS idx_knowledge_usage_logs_message_id ON knowledge_usage_logs(message_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_usage_logs_created_at ON knowledge_usage_logs(created_at);

-- ==============================================
-- 第五层：配置与统计层索引
-- ==============================================

-- AI角色表索引
CREATE INDEX IF NOT EXISTS idx_ai_roles_name ON ai_roles(name);
CREATE INDEX IF NOT EXISTS idx_ai_roles_enabled ON ai_roles(enabled);
CREATE INDEX IF NOT EXISTS idx_ai_roles_source ON ai_roles(source) WHERE source IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ai_roles_updated ON ai_roles(updated_at DESC);

-- 公开页面配置表索引
CREATE INDEX IF NOT EXISTS idx_public_page_configs_token ON public_page_configs(access_token);
CREATE INDEX IF NOT EXISTS idx_public_page_configs_active ON public_page_configs(is_active);
CREATE INDEX IF NOT EXISTS idx_public_page_configs_created ON public_page_configs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_public_page_configs_workflow ON public_page_configs(workflow_id) WHERE workflow_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_public_page_configs_display_mode ON public_page_configs(display_mode);

-- 页面工具配置表索引
CREATE INDEX IF NOT EXISTS idx_page_tool_configs_page_type ON page_tool_configs(page_type);
CREATE INDEX IF NOT EXISTS idx_page_tool_configs_active ON page_tool_configs(is_active);

-- 文件表索引
CREATE INDEX IF NOT EXISTS idx_files_file_id ON files(file_id);
CREATE INDEX IF NOT EXISTS idx_files_category ON files(category);
CREATE INDEX IF NOT EXISTS idx_files_status ON files(status);
CREATE INDEX IF NOT EXISTS idx_files_conversation_id ON files(conversation_id) WHERE conversation_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_files_created_at ON files(created_at);
CREATE INDEX IF NOT EXISTS idx_files_file_hash ON files(file_hash) WHERE file_hash IS NOT NULL;

-- 工作流节点使用统计表索引
CREATE INDEX IF NOT EXISTS idx_workflow_node_usage_node_id ON workflow_node_usage(node_id);
CREATE INDEX IF NOT EXISTS idx_workflow_node_usage_session_id ON workflow_node_usage(session_id);
CREATE INDEX IF NOT EXISTS idx_workflow_node_usage_user_id ON workflow_node_usage(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_workflow_node_usage_node_type ON workflow_node_usage(node_type);
CREATE INDEX IF NOT EXISTS idx_workflow_node_usage_created_at ON workflow_node_usage(created_at);
CREATE INDEX IF NOT EXISTS idx_workflow_node_usage_is_workflow_mode ON workflow_node_usage(is_workflow_mode);
CREATE INDEX IF NOT EXISTS idx_workflow_node_usage_ai_role_id ON workflow_node_usage(ai_role_id) WHERE ai_role_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_workflow_node_usage_workflow_execution_id ON workflow_node_usage(workflow_execution_id) WHERE workflow_execution_id IS NOT NULL;

-- AI问答评价统计表索引
CREATE INDEX IF NOT EXISTS idx_ai_qa_feedback_message_id ON ai_qa_feedback(message_id);
CREATE INDEX IF NOT EXISTS idx_ai_qa_feedback_node_id ON ai_qa_feedback(node_id);
CREATE INDEX IF NOT EXISTS idx_ai_qa_feedback_session_id ON ai_qa_feedback(session_id);
CREATE INDEX IF NOT EXISTS idx_ai_qa_feedback_feedback_type ON ai_qa_feedback(feedback_type);
CREATE INDEX IF NOT EXISTS idx_ai_qa_feedback_created_at ON ai_qa_feedback(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_qa_feedback_ai_role_id ON ai_qa_feedback(ai_role_id) WHERE ai_role_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ai_qa_feedback_workflow_execution_id ON ai_qa_feedback(workflow_execution_id) WHERE workflow_execution_id IS NOT NULL;

-- 工作流会话统计表索引
CREATE INDEX IF NOT EXISTS idx_workflow_session_stats_session_id ON workflow_session_stats(session_id);
CREATE INDEX IF NOT EXISTS idx_workflow_session_stats_user_id ON workflow_session_stats(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_workflow_session_stats_session_start_time ON workflow_session_stats(session_start_time);
CREATE INDEX IF NOT EXISTS idx_workflow_session_stats_exit_node_id ON workflow_session_stats(exit_node_id) WHERE exit_node_id IS NOT NULL;

-- 节点内容处理统计表索引
CREATE INDEX IF NOT EXISTS idx_node_content_processing_node_id ON node_content_processing(node_id);
CREATE INDEX IF NOT EXISTS idx_node_content_processing_session_id ON node_content_processing(session_id);
CREATE INDEX IF NOT EXISTS idx_node_content_processing_processing_type ON node_content_processing(processing_type);
CREATE INDEX IF NOT EXISTS idx_node_content_processing_created_at ON node_content_processing(created_at);
CREATE INDEX IF NOT EXISTS idx_node_content_processing_ai_role_id ON node_content_processing(ai_role_id) WHERE ai_role_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_node_content_processing_workflow_execution_id ON node_content_processing(workflow_execution_id) WHERE workflow_execution_id IS NOT NULL;

-- 实时统计汇总表索引
CREATE INDEX IF NOT EXISTS idx_workflow_stats_summary_stat_date ON workflow_stats_summary(stat_date);
CREATE INDEX IF NOT EXISTS idx_workflow_stats_summary_node_id ON workflow_stats_summary(node_id);
CREATE INDEX IF NOT EXISTS idx_workflow_stats_summary_stat_date_node ON workflow_stats_summary(stat_date, node_id);

-- ==============================================
-- 项目管理相关表索引
-- ==============================================

-- 项目表索引
CREATE INDEX IF NOT EXISTS idx_projects_type ON projects(type);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at);
CREATE INDEX IF NOT EXISTS idx_projects_last_opened_at ON projects(last_opened_at) WHERE last_opened_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_projects_type_status ON projects(type, status);

-- 项目来源表索引
CREATE INDEX IF NOT EXISTS idx_project_sources_project_id ON project_sources(project_id);
CREATE INDEX IF NOT EXISTS idx_project_sources_source_type ON project_sources(source_type);
CREATE INDEX IF NOT EXISTS idx_project_sources_project_type ON project_sources(project_id, source_type);

-- 项目与技术点关联表索引
CREATE INDEX IF NOT EXISTS idx_project_tech_points_project_id ON project_tech_points(project_id);
CREATE INDEX IF NOT EXISTS idx_project_tech_points_tech_point_id ON project_tech_points(tech_point_id);
CREATE INDEX IF NOT EXISTS idx_project_tech_points_project_tech ON project_tech_points(project_id, tech_point_id);

-- 项目与知识点关联表索引
CREATE INDEX IF NOT EXISTS idx_project_knowledge_points_project_id ON project_knowledge_points(project_id);
CREATE INDEX IF NOT EXISTS idx_project_knowledge_points_knowledge_point_id ON project_knowledge_points(knowledge_point_id);
CREATE INDEX IF NOT EXISTS idx_project_knowledge_points_project_knowledge ON project_knowledge_points(project_id, knowledge_point_id);

-- 项目与文件关联表索引
CREATE INDEX IF NOT EXISTS idx_project_files_project_id ON project_files(project_id);
CREATE INDEX IF NOT EXISTS idx_project_files_file_id ON project_files(file_id);
CREATE INDEX IF NOT EXISTS idx_project_files_project_file ON project_files(project_id, file_id);

-- 项目与来源信息关联表索引
CREATE INDEX IF NOT EXISTS idx_project_source_informations_project_id ON project_source_informations(project_id);
CREATE INDEX IF NOT EXISTS idx_project_source_informations_source_id ON project_source_informations(source_information_id);
CREATE INDEX IF NOT EXISTS idx_project_source_informations_project_source ON project_source_informations(project_id, source_information_id);

-- ==============================================
-- 来源信息相关表索引
-- ==============================================

-- 来源信息表索引
CREATE INDEX IF NOT EXISTS idx_source_information_source_id ON source_information(source_id);
CREATE INDEX IF NOT EXISTS idx_source_information_type ON source_information(type);
CREATE INDEX IF NOT EXISTS idx_source_information_page_type ON source_information(page_type) WHERE page_type IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_source_information_conversation_id ON source_information(conversation_id) WHERE conversation_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_source_information_status ON source_information(status);
CREATE INDEX IF NOT EXISTS idx_source_information_created_at ON source_information(created_at);
CREATE INDEX IF NOT EXISTS idx_source_information_type_status ON source_information(type, status);

-- ==============================================
-- 公共知识库相关表索引
-- ==============================================

-- 公共知识库分类表索引
CREATE INDEX IF NOT EXISTS idx_public_knowledge_categories_parent_id ON public_knowledge_categories(parent_id) WHERE parent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_public_knowledge_categories_sort_order ON public_knowledge_categories(sort_order);
CREATE INDEX IF NOT EXISTS idx_public_knowledge_categories_parent_sort ON public_knowledge_categories(parent_id, sort_order) WHERE parent_id IS NOT NULL;

-- 公共知识库文件表索引
CREATE INDEX IF NOT EXISTS idx_public_knowledge_files_category_id ON public_knowledge_files(category_id) WHERE category_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_public_knowledge_files_created_at ON public_knowledge_files(created_at);
CREATE INDEX IF NOT EXISTS idx_public_knowledge_files_file_type ON public_knowledge_files(file_type);

-- ==============================================
-- 生成内容关联上下文表索引
-- ==============================================

-- 技术包装材料关联对话表索引
CREATE INDEX IF NOT EXISTS idx_tech_packaging_conversations_packaging_id ON tech_packaging_conversations(packaging_id);
CREATE INDEX IF NOT EXISTS idx_tech_packaging_conversations_conversation_id ON tech_packaging_conversations(conversation_id);

-- 技术包装材料关联来源信息表索引
CREATE INDEX IF NOT EXISTS idx_tech_packaging_sources_packaging_id ON tech_packaging_sources(packaging_id);
CREATE INDEX IF NOT EXISTS idx_tech_packaging_sources_source_id ON tech_packaging_sources(source_id);

-- 技术推广策略关联对话表索引
CREATE INDEX IF NOT EXISTS idx_tech_promotion_conversations_promotion_id ON tech_promotion_conversations(promotion_id);
CREATE INDEX IF NOT EXISTS idx_tech_promotion_conversations_conversation_id ON tech_promotion_conversations(conversation_id);

-- 技术推广策略关联来源信息表索引
CREATE INDEX IF NOT EXISTS idx_tech_promotion_sources_promotion_id ON tech_promotion_sources(promotion_id);
CREATE INDEX IF NOT EXISTS idx_tech_promotion_sources_source_id ON tech_promotion_sources(source_id);

-- 技术通稿关联对话表索引
CREATE INDEX IF NOT EXISTS idx_tech_press_conversations_press_release_id ON tech_press_conversations(press_release_id);
CREATE INDEX IF NOT EXISTS idx_tech_press_conversations_conversation_id ON tech_press_conversations(conversation_id);

-- 技术通稿关联来源信息表索引
CREATE INDEX IF NOT EXISTS idx_tech_press_sources_press_release_id ON tech_press_sources(press_release_id);
CREATE INDEX IF NOT EXISTS idx_tech_press_sources_source_id ON tech_press_sources(source_id);

-- ==============================================
-- 系统表索引
-- ==============================================

-- 数据库迁移记录表索引
CREATE INDEX IF NOT EXISTS idx_database_migrations_name ON database_migrations(migration_name);
CREATE INDEX IF NOT EXISTS idx_database_migrations_version ON database_migrations(version);
CREATE INDEX IF NOT EXISTS idx_database_migrations_executed_at ON database_migrations(executed_at DESC);
CREATE INDEX IF NOT EXISTS idx_database_migrations_status ON database_migrations(status);

-- ID映射表索引（用于数据迁移）
CREATE INDEX IF NOT EXISTS idx_id_mappings_source_db_table ON id_mappings(source_db_name, source_table_name);
CREATE INDEX IF NOT EXISTS idx_id_mappings_source_id ON id_mappings(source_db_name, source_table_name, source_id);
CREATE INDEX IF NOT EXISTS idx_id_mappings_target_id ON id_mappings(target_id);

